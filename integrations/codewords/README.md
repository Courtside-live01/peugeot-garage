# Forward FormSubmit lead emails to WhatsApp with CodeWords

Every email from **FormSubmit <submissions@formsubmit.co>** with subject **"New lead …"** is parsed and the Name / Value table is sent as a WhatsApp message to **+971 52 515 5001**.

`whatsapp_lead_forwarder.py` is a CodeWords service (FastAPI, `codewords_client`). It is already tested against the real email layout:

```
🔧 New service request (website)
Name: Website test (ignore)
Mobile: +971 52 515 5001 (UAE)
Email: ahmed@example.com
Model: 3008
Services: Full service, Brakes
Chassis No: VF3TEST0000000000
Engine No: TEST-ENGINE
Message: Test of the new form from the website build.
Language: en
📞 Call: tel:+971525155001
💬 Customer WhatsApp: https://wa.me/971525155001
🕒 Submitted: Sat, Oct 3, 2026 6:19 PM (UTC)
```

## Step by step (beginner)

1. Go to https://codewords.ai and sign in. Click **New automation**.
2. Paste the prompt below into Cody and send it.
3. When Cody asks, **connect Gmail** (choose the selimautocare@gmail.com inbox) and **connect WhatsApp** (Cody shows a QR code; on the workshop phone open WhatsApp → Settings → Linked devices → Link a device → scan it). Confirm the number +971 52 515 5001.
4. Cody builds the workflow. Open the **Code** view, select all, and replace it with the contents of `whatsapp_lead_forwarder.py` (or attach the file and say "use this code"). Ask Cody to keep the Gmail trigger pointed at `POST /` and to set `WHATSAPP_SERVICE_ID` to its WhatsApp sender.
5. Press **Run** on `/test`. A sample lead must arrive on WhatsApp.
6. Submit the real form once on https://selim-auto-care.vercel.app. The email and the WhatsApp message arrive together.

## Prompt for Cody (copy exactly)

```
Build an automation called "Selim Auto Care lead → WhatsApp".

Trigger: Gmail (selimautocare@gmail.com) — every new email whose sender contains "formsubmit.co"
and whose subject contains "New lead".

Action: parse the HTML table in the email (two columns: Name, Value; rows such as Services,
Language, Name, Mobile, Email, Model, Chassis_No, Engine_No, Message, and the line
"Submitted at …") and send ONE WhatsApp message to my own number +971 52 515 5001 in this format:

🔧 New service request (website)
Name: …
Mobile: …
Email: …
Model: …
Services: …
Chassis No: …
Engine No: …
Message: …
Language: …
📞 Call: tel:+9715…
💬 Customer WhatsApp: https://wa.me/9715…
🕒 Submitted: …

Connect my WhatsApp number for the sending. Also add a 5-minute schedule that calls POST /poll
to catch any unread FormSubmit emails the trigger missed, and mark them read afterwards.
I will supply the Python code for the service: use it as-is and only wire the trigger,
the Gmail integration and the WhatsApp sender into it.
```

## Settings the code reads

| Variable | Meaning |
|---|---|
| `WA_TO` | Destination, digits only. Default `971525155001` |
| `WHATSAPP_SERVICE_ID` | CodeWords WhatsApp sender workflow id (Cody sets it) |
| `GREEN_ID_INSTANCE`, `GREEN_API_TOKEN`, `GREEN_API_URL` | Alternative sender via GREEN-API |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | Alternative sender via Meta WhatsApp Cloud API |
| `LEAD_SENDER` / `LEAD_SUBJECT` | Filters, default `formsubmit.co` / `new lead` |
| `COMPOSIO_USER_ID` | Gmail connection id for `/poll` if Cody uses a non-default one |

## Endpoints

- `POST /` — Gmail trigger entrypoint (one email in, one WhatsApp out). Non-lead emails are ignored.
- `POST /poll` — fetch unread FormSubmit emails from the last 7 days, forward, mark read.
- `POST /test` — send a sample lead to WhatsApp.
- `GET /health` — shows which sender is active.

## Local check

```bash
python whatsapp_lead_forwarder.py --selftest
```
