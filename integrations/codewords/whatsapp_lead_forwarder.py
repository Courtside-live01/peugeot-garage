"""
Selim Auto Care — FormSubmit lead → WhatsApp forwarder (CodeWords workflow)

WHAT IT DOES
  Every email from FormSubmit (submissions@formsubmit.co, subject "New lead …") is parsed,
  the Name/Value table is turned into a clean WhatsApp message, and the message is sent to
  the workshop's WhatsApp +971 52 515 5001.

HOW CODEWORDS RUNS IT
  • Trigger mode  — Cody attaches a Gmail "new email" trigger. Gmail posts the email to POST /
                    and this service handles that one email.
  • Catch-up mode — POST /poll (or a 5-minute schedule) fetches any unread FormSubmit emails
                    through the Gmail integration, forwards them, and marks them read. This
                    covers anything the trigger missed.

WHATSAPP SENDING (first configured option wins)
  1. CodeWords WhatsApp DM   — set WHATSAPP_SERVICE_ID to the id of the CodeWords "send WhatsApp
                               message" workflow Cody creates when you say "connect my WhatsApp
                               number" (it is called through codewords_client).
  2. GREEN-API               — GREEN_ID_INSTANCE + GREEN_API_TOKEN (+ optional GREEN_API_URL)
  3. Meta WhatsApp Cloud API — WHATSAPP_TOKEN + WHATSAPP_PHONE_ID
  Target number: WA_TO (digits only), default 971525155001.

Tested parser: see `python whatsapp_lead_forwarder.py --selftest`.
"""

from __future__ import annotations

import base64
import html
import json
import os
import re
import sys
from html.parser import HTMLParser
from typing import Any, Dict, List, Optional

import httpx
from fastapi import FastAPI
from pydantic import BaseModel, Field

try:  # inside CodeWords these are available; locally the self-test still works without them
    from codewords_client import AsyncCodewordsClient, logger  # type: ignore
except Exception:  # pragma: no cover
    import logging

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("lead-forwarder")  # type: ignore
    AsyncCodewordsClient = None  # type: ignore

app = FastAPI(title="Selim Auto Care — lead to WhatsApp", version="1.0.0")

WA_TO = re.sub(r"\D", "", os.environ.get("WA_TO", "971525155001"))
SENDER_MATCH = os.environ.get("LEAD_SENDER", "formsubmit.co").lower()
SUBJECT_MATCH = os.environ.get("LEAD_SUBJECT", "new lead").lower()
SITE_LABEL = os.environ.get("SITE_LABEL", "selimautocare website")

# Field order and pretty labels for the WhatsApp message. FormSubmit replaces spaces with "_".
FIELD_ORDER = [
    ("name", "Name"), ("mobile", "Mobile"), ("email", "Email"), ("model", "Model"),
    ("services", "Services"), ("chassis_no", "Chassis No"), ("engine_no", "Engine No"),
    ("message", "Message"), ("preferred_date", "Preferred date"), ("pick_up_requested", "Pick-up"),
    ("language", "Language"),
]
SKIP_FIELDS = {"_subject", "_template", "_captcha", "_next", "_honey", "_replyto", "page", "submitted", "attachment"}


# ----------------------------------------------------------------------------- parsing
class _TableParser(HTMLParser):
    """Collects every <tr> as a list of cell texts."""

    def __init__(self) -> None:
        super().__init__()
        self.rows: List[List[str]] = []
        self._row: Optional[List[str]] = None
        self._cell: Optional[List[str]] = None

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self._row = []
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []
        elif tag == "br" and self._cell is not None:
            self._cell.append("\n")

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self._row is not None and self._cell is not None:
            self._row.append("".join(self._cell).strip())
            self._cell = None
        elif tag == "tr" and self._row is not None:
            if self._row:
                self.rows.append(self._row)
            self._row = None

    def handle_data(self, data):
        if self._cell is not None:
            self._cell.append(data)


def _norm_key(k: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", html.unescape(k).strip().lower()).strip("_")


def parse_formsubmit_html(body_html: str) -> Dict[str, str]:
    """FormSubmit 'table' template → {field: value}. Ignores the Name/Value header row."""
    p = _TableParser()
    p.feed(body_html or "")
    out: Dict[str, str] = {}
    for row in p.rows:
        if len(row) < 2:
            continue
        k, v = _norm_key(row[0]), html.unescape(row[1]).strip()
        if not k or k in ("name_value", "field") or (k == "name" and v.lower() == "value"):
            continue
        if k in SKIP_FIELDS:
            continue
        out[k] = v
    return out


def parse_formsubmit_text(body_text: str) -> Dict[str, str]:
    """Fallback for plain-text bodies: lines like 'Mobile: +971…'."""
    out: Dict[str, str] = {}
    for line in (body_text or "").splitlines():
        m = re.match(r"\s*([A-Za-z][A-Za-z0-9 _/-]{0,40}?)\s*:\s*(.+?)\s*$", line)
        if m:
            k = _norm_key(m.group(1))
            if k and k not in SKIP_FIELDS and k not in ("someone_just_submitted_your_form_on", "here_s_what_they_had_to_say"):
                out.setdefault(k, m.group(2).strip())
    return out


def parse_lead(body_html: str = "", body_text: str = "") -> Dict[str, str]:
    data = parse_formsubmit_html(body_html) if body_html else {}
    if len(data) < 2:
        data = {**parse_formsubmit_text(body_text), **data}
    return data


def submitted_at(body_html: str, body_text: str) -> str:
    m = re.search(r"Submitted at\s+(.+?)\s*(?:<|$)", body_html or body_text or "", re.I)
    return html.unescape(m.group(1)).strip() if m else ""


# ----------------------------------------------------------------------------- formatting
def format_whatsapp(lead: Dict[str, str], when: str = "", lang: str = "") -> str:
    lang = (lang or lead.get("language") or "en").lower()
    ar = lang.startswith("ar")
    title = "🔧 طلب خدمة جديد من الموقع" if ar else "🔧 New service request (website)"
    labels_ar = {"name": "الاسم", "mobile": "الجوال", "email": "البريد", "model": "الموديل", "services": "الخدمات",
                 "chassis_no": "الشاصي", "engine_no": "المحرك", "message": "ملاحظات", "preferred_date": "التاريخ المفضل",
                 "pick_up_requested": "استلام", "language": "اللغة"}
    lines = [title]
    used = set()
    for key, label in FIELD_ORDER:
        val = lead.get(key, "").strip()
        used.add(key)
        if not val or val == "-":
            continue
        lines.append(f"{labels_ar.get(key, label) if ar else label}: {val}")
    for key, val in lead.items():  # anything new that the form adds later
        if key not in used and val and key not in SKIP_FIELDS:
            lines.append(f"{key.replace('_', ' ').title()}: {val}")
    mobile = re.sub(r"[^\d+]", "", lead.get("mobile", ""))
    if mobile:
        digits = mobile.lstrip("+")
        lines.append(("📞 اتصل: " if ar else "📞 Call: ") + f"tel:+{digits}")
        lines.append(("💬 واتساب العميل: " if ar else "💬 Customer WhatsApp: ") + f"https://wa.me/{digits}")
    if when:
        lines.append(("🕒 " if ar else "🕒 Submitted: ") + when)
    return "\n".join(lines)


# ----------------------------------------------------------------------------- email payload helpers
def _get(d: Any, *paths: str) -> Any:
    """First non-empty value among dotted paths, e.g. 'payload.subject'."""
    for path in paths:
        cur = d
        ok = True
        for part in path.split("."):
            if isinstance(cur, dict) and part in cur:
                cur = cur[part]
            else:
                ok = False
                break
        if ok and cur not in (None, "", [], {}):
            return cur
    return None


def _b64(s: str) -> str:
    try:
        return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4)).decode("utf-8", "ignore")
    except Exception:
        return ""


def extract_email(payload: Dict[str, Any]) -> Dict[str, str]:
    """Normalise the many shapes a Gmail trigger / Gmail API message can arrive in."""
    p = payload or {}
    subject = _get(p, "subject", "payload.subject", "message.subject", "headers.subject", "data.subject") or ""
    sender = _get(p, "from", "sender", "payload.sender", "payload.from", "message.from", "headers.from", "data.sender") or ""
    html_body = _get(p, "html", "body_html", "messageHtml", "payload.messageHtml", "payload.html", "message.html", "data.html") or ""
    text_body = _get(p, "text", "body", "messageText", "payload.messageText", "payload.body", "message.text", "snippet", "data.text") or ""
    msg_id = _get(p, "id", "message_id", "messageId", "payload.messageId", "payload.id", "message.id", "data.id") or ""
    thread_id = _get(p, "threadId", "thread_id", "payload.threadId", "payload.thread_id") or ""

    # Raw Gmail API message: walk parts for text/html and text/plain
    parts = _get(p, "payload.parts", "message.payload.parts") or []
    stack = list(parts) if isinstance(parts, list) else []
    while stack:
        part = stack.pop()
        if isinstance(part, dict):
            mime = part.get("mimeType", "")
            data = (part.get("body") or {}).get("data")
            if data and mime == "text/html" and not html_body:
                html_body = _b64(data)
            elif data and mime == "text/plain" and not text_body:
                text_body = _b64(data)
            stack.extend(part.get("parts") or [])
    if not html_body and isinstance(_get(p, "payload.body.data"), str):
        html_body = _b64(_get(p, "payload.body.data"))
    for h in (_get(p, "payload.headers", "message.payload.headers") or []):
        if isinstance(h, dict):
            n = h.get("name", "").lower()
            if n == "subject" and not subject:
                subject = h.get("value", "")
            if n == "from" and not sender:
                sender = h.get("value", "")
    if isinstance(text_body, dict):
        text_body = json.dumps(text_body)
    return {"subject": str(subject), "sender": str(sender), "html": str(html_body), "text": str(text_body),
            "id": str(msg_id), "thread_id": str(thread_id)}


def is_lead_email(subject: str, sender: str) -> bool:
    return SENDER_MATCH in (sender or "").lower() and SUBJECT_MATCH in (subject or "").lower()


# ----------------------------------------------------------------------------- WhatsApp senders
async def send_whatsapp(text: str) -> Dict[str, Any]:
    env = os.environ
    to = WA_TO
    # 1) CodeWords WhatsApp DM workflow (Cody fills WHATSAPP_SERVICE_ID after "connect my WhatsApp number")
    if env.get("WHATSAPP_SERVICE_ID") and AsyncCodewordsClient is not None:
        async with AsyncCodewordsClient() as cw:  # type: ignore[misc]
            resp = await cw.run(service_id=env["WHATSAPP_SERVICE_ID"], inputs={"to": f"+{to}", "phone": f"+{to}", "message": text, "text": text})
            return {"provider": "codewords-whatsapp", "status": resp.status_code, "body": resp.text[:300]}
    async with httpx.AsyncClient(timeout=15) as http:
        # 2) GREEN-API (workshop phone linked by QR)
        if env.get("GREEN_ID_INSTANCE") and env.get("GREEN_API_TOKEN"):
            base = env.get("GREEN_API_URL", "https://api.green-api.com").rstrip("/")
            r = await http.post(f"{base}/waInstance{env['GREEN_ID_INSTANCE']}/sendMessage/{env['GREEN_API_TOKEN']}",
                                json={"chatId": f"{to}@c.us", "message": text})
            return {"provider": "green-api", "status": r.status_code, "body": r.text[:300]}
        # 3) Meta WhatsApp Cloud API
        if env.get("WHATSAPP_TOKEN") and env.get("WHATSAPP_PHONE_ID"):
            r = await http.post(f"https://graph.facebook.com/v21.0/{env['WHATSAPP_PHONE_ID']}/messages",
                                headers={"Authorization": f"Bearer {env['WHATSAPP_TOKEN']}"},
                                json={"messaging_product": "whatsapp", "to": to, "type": "text", "text": {"preview_url": False, "body": text}})
            return {"provider": "meta", "status": r.status_code, "body": r.text[:300]}
    raise RuntimeError("No WhatsApp sender configured: set WHATSAPP_SERVICE_ID, or GREEN_ID_INSTANCE+GREEN_API_TOKEN, or WHATSAPP_TOKEN+WHATSAPP_PHONE_ID")


# ----------------------------------------------------------------------------- Gmail (catch-up mode via Composio)
def _composio():
    from composio import Composio  # provided inside CodeWords; auto-configured by codewords_client
    return Composio()


def _composio_user() -> str:
    return os.environ.get("COMPOSIO_USER_ID") or os.environ.get("CODEWORDS_USER_ID") or "default"


def fetch_unread_leads(max_results: int = 20) -> List[Dict[str, Any]]:
    composio = _composio()
    res = composio.tools.execute(
        "GMAIL_FETCH_EMAILS",
        user_id=_composio_user(),
        arguments={"query": f"from:{SENDER_MATCH} is:unread newer_than:7d", "max_results": max_results, "include_payload": True, "verbose": True},
    )
    data = res.get("data", res) if isinstance(res, dict) else {}
    msgs = data.get("messages") or data.get("data", {}).get("messages") or []
    return msgs if isinstance(msgs, list) else []


def mark_read(message_id: str) -> None:
    try:
        _composio().tools.execute("GMAIL_ADD_LABEL_TO_EMAIL", user_id=_composio_user(),
                                  arguments={"message_id": message_id, "remove_label_ids": ["UNREAD"], "add_label_ids": []})
    except Exception as e:  # not fatal
        logger.warning("mark_read failed", message_id=message_id, error=str(e))


# ----------------------------------------------------------------------------- API
class EmailEvent(BaseModel):
    """Loose schema: whatever the Gmail trigger sends is accepted and normalised."""
    model_config = {"extra": "allow"}
    subject: Optional[str] = Field(None, description="Email subject")
    sender: Optional[str] = Field(None, description="From address", alias="from")
    html: Optional[str] = Field(None, description="HTML body")
    text: Optional[str] = Field(None, description="Plain-text body")


async def handle_email(payload: Dict[str, Any], force: bool = False) -> Dict[str, Any]:
    em = extract_email(payload)
    if not force and not is_lead_email(em["subject"], em["sender"]):
        return {"forwarded": False, "reason": "not a FormSubmit lead", "subject": em["subject"], "sender": em["sender"]}
    lead = parse_lead(em["html"], em["text"])
    if not lead:
        return {"forwarded": False, "reason": "no table found", "subject": em["subject"]}
    msg = format_whatsapp(lead, submitted_at(em["html"], em["text"]))
    result = await send_whatsapp(msg)
    logger.info("lead forwarded", provider=result.get("provider"), status=result.get("status"), name=lead.get("name"))
    return {"forwarded": True, "to": f"+{WA_TO}", "lead": lead, "message": msg, "send": result, "email_id": em["id"]}


@app.post("/", summary="Gmail trigger entrypoint: one email in, one WhatsApp out")
async def on_email(event: Dict[str, Any]):
    return await handle_email(event)


@app.post("/poll", summary="Catch-up: forward all unread FormSubmit emails, then mark them read")
async def poll(max_results: int = 20):
    out = []
    for m in fetch_unread_leads(max_results):
        r = await handle_email(m)
        if r.get("forwarded") and r.get("email_id"):
            mark_read(r["email_id"])
        out.append({k: r.get(k) for k in ("forwarded", "reason", "subject", "email_id")})
    return {"processed": len(out), "results": out}


@app.post("/test", summary="Send a sample lead to WhatsApp to prove the connection")
async def test_send():
    sample = {"name": "Website test (ignore)", "mobile": "+971 50 123 4567", "email": "test@example.com", "model": "3008",
              "services": "Full service, Brakes", "chassis_no": "VF3TEST0000000000", "engine_no": "TEST-ENGINE", "message": "Connection test", "language": "en"}
    return await send_whatsapp(format_whatsapp(sample, "now"))


@app.get("/health")
async def health():
    env = os.environ
    provider = ("codewords-whatsapp" if env.get("WHATSAPP_SERVICE_ID") else "green-api" if env.get("GREEN_ID_INSTANCE") else
                "meta" if env.get("WHATSAPP_TOKEN") else None)
    return {"ok": True, "provider": provider, "to": f"+{WA_TO}", "sender_filter": SENDER_MATCH, "subject_filter": SUBJECT_MATCH}


# ----------------------------------------------------------------------------- self-test
SAMPLE_HTML = """
<p>Someone just submitted your form on <a href="https://selim-auto-care.vercel.app/">https://selim-auto-care.vercel.app/</a>.</p>
<p>Here's what they had to say:</p>
<table><tr><th>Name</th><th>Value</th></tr>
<tr><td>Services</td><td>Full service, Brakes</td></tr>
<tr><td>Language</td><td>en</td></tr>
<tr><td>Name</td><td>Website test (ignore)</td></tr>
<tr><td>Mobile</td><td><a href="tel:+971525155001">+971 52 515 5001 (UAE)</a></td></tr>
<tr><td>Email</td><td>ahmed@example.com</td></tr>
<tr><td>Model</td><td>3008</td></tr>
<tr><td>Chassis_No</td><td>VF3TEST0000000000</td></tr>
<tr><td>Engine_No</td><td>TEST-ENGINE</td></tr>
<tr><td>Message</td><td>Test of the new form from the website build.</td></tr>
</table>
<p>Submitted at Sat, Oct 3, 2026 6:19 PM (UTC)</p>
"""

if __name__ == "__main__":
    if "--selftest" in sys.argv:
        lead = parse_lead(SAMPLE_HTML)
        assert lead["name"] == "Website test (ignore)", lead
        assert lead["chassis_no"] == "VF3TEST0000000000", lead
        assert lead["services"] == "Full service, Brakes", lead
        assert "+971 52 515 5001" in lead["mobile"], lead
        assert is_lead_email("New lead from selimautocare website", "FormSubmit <submissions@formsubmit.co>")
        assert is_lead_email("New lead: Ahmed · 3008 · Brakes", "submissions@formsubmit.co")
        assert not is_lead_email("Your invoice", "billing@formsubmit.co")
        print(format_whatsapp(lead, submitted_at(SAMPLE_HTML, "")))
        print("\nSELFTEST OK")
    else:
        from codewords_client import run_service  # type: ignore
        run_service(app)
