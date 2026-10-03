/**
 * POST /api/notify
 * Sends every website lead to the workshop's WhatsApp (+971 52 515 5001) at the same time
 * FormSubmit emails it. The form calls this endpoint just before it submits.
 *
 * Pick ONE provider and set its environment variables in Vercel
 * (Project → Settings → Environment Variables → Redeploy). The first configured provider wins.
 *
 *  A) GREEN-API  (quickest: link the workshop phone by scanning a QR code, ~5 min)
 *       GREEN_ID_INSTANCE      e.g. 1101234567
 *       GREEN_API_TOKEN        the apiTokenInstance from console.green-api.com
 *       GREEN_API_URL          optional, default https://api.green-api.com (console shows yours, e.g. https://7105.api.greenapi.com)
 *
 *  B) META WHATSAPP CLOUD API  (official, free for notifications to your own number)
 *       WHATSAPP_TOKEN         permanent System User token
 *       WHATSAPP_PHONE_ID      the "Phone number ID" from the WhatsApp > API Setup page
 *
 *  C) TWILIO  (sandbox or approved WhatsApp sender)
 *       TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM  e.g. whatsapp:+14155238886
 *
 *  D) CALLMEBOT  (free personal bot; often full)
 *       CALLMEBOT_APIKEY
 *
 *  Optional for all: WA_TO (digits only, default 971525155001).
 * If nothing is configured the endpoint returns { skipped: true } and the email path is unaffected.
 */
const DEFAULT_TO = '971525155001';
const seen = new Map(); // small in-memory rate limit per IP (per warm instance)

const clean = (v, max = 200) => String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);

function buildMessage(b) {
  const ar = clean(b.lang, 5) === 'ar';
  const L = ar ? { h: '🔧 طلب خدمة جديد من الموقع', n: 'الاسم', m: 'الجوال', e: 'البريد', mo: 'الموديل', s: 'الخدمات', c: 'الشاصي', g: 'المحرك', x: 'ملاحظات' }
             : { h: '🔧 New service request (website)', n: 'Name', m: 'Mobile', e: 'Email', mo: 'Model', s: 'Services', c: 'Chassis', g: 'Engine', x: 'Notes' };
  return [
    L.h,
    `${L.n}: ${clean(b.name, 80)}`,
    `${L.m}: ${clean(b.mobile, 40)}`,
    b.email ? `${L.e}: ${clean(b.email, 120)}` : null,
    `${L.mo}: ${clean(b.model, 40)}`,
    `${L.s}: ${clean(b.services, 200)}`,
    b.chassis ? `${L.c}: ${clean(b.chassis, 40)}` : null,
    b.engine ? `${L.g}: ${clean(b.engine, 40)}` : null,
    b.message ? `${L.x}: ${clean(b.message, 300)}` : null,
  ].filter(Boolean).join('\n');
}

async function withTimeout(promiseFactory, ms = 8000) {
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), ms);
  try { return await promiseFactory(ctrl.signal); } finally { clearTimeout(timer); }
}

async function sendGreen(to, text, env) {
  const base = (env.GREEN_API_URL || 'https://api.green-api.com').replace(/\/$/, '');
  const url = `${base}/waInstance${env.GREEN_ID_INSTANCE}/sendMessage/${env.GREEN_API_TOKEN}`;
  const r = await withTimeout(signal => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId: `${to}@c.us`, message: text }), signal }));
  return { provider: 'green-api', ok: r.ok, status: r.status, body: (await r.text()).slice(0, 300) };
}
async function sendMeta(to, text, env) {
  const url = `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_ID}/messages`;
  const r = await withTimeout(signal => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.WHATSAPP_TOKEN}` }, body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { preview_url: false, body: text } }), signal }));
  return { provider: 'meta', ok: r.ok, status: r.status, body: (await r.text()).slice(0, 300) };
}
async function sendTwilio(to, text, env) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const form = new URLSearchParams({ From: env.TWILIO_WHATSAPP_FROM, To: `whatsapp:+${to}`, Body: text });
  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const r = await withTimeout(signal => fetch(url, { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form, signal }));
  return { provider: 'twilio', ok: r.ok, status: r.status, body: (await r.text()).slice(0, 300) };
}
async function sendCallMeBot(to, text, env) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${to}&apikey=${encodeURIComponent(env.CALLMEBOT_APIKEY)}&text=${encodeURIComponent(text)}`;
  const r = await withTimeout(signal => fetch(url, { signal }));
  return { provider: 'callmebot', ok: r.ok, status: r.status, body: (await r.text()).slice(0, 300) };
}

function pickProvider(env) {
  if (env.GREEN_ID_INSTANCE && env.GREEN_API_TOKEN) return sendGreen;
  if (env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_ID) return sendMeta;
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_FROM) return sendTwilio;
  if (env.CALLMEBOT_APIKEY) return sendCallMeBot;
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  const env = process.env;
  const to = (env.WA_TO || DEFAULT_TO).replace(/[^\d]/g, '');

  // GET = health check, so the owner can see which provider is active without sending anything
  if (req.method === 'GET') { const p = pickProvider(env); return res.end(JSON.stringify({ configured: !!p, provider: p ? p.name.replace('send', '').toLowerCase() : null, to: `+${to}` })); }
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('{"error":"Method not allowed"}'); }

  const send = pickProvider(env);
  if (!send) { return res.end(JSON.stringify({ skipped: true, reason: 'No WhatsApp provider configured' })); }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now(); const hits = (seen.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  if (hits.length >= 5) { res.statusCode = 429; return res.end('{"error":"Too many requests"}'); }
  hits.push(now); seen.set(ip, hits);

  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } } body = body || {};
  if (!clean(body.name) || !clean(body.mobile) || !clean(body.model) || !clean(body.services)) { res.statusCode = 400; return res.end('{"error":"Missing fields"}'); }

  try {
    const result = await send(to, buildMessage(body), env);
    return res.end(JSON.stringify(result));
  } catch (e) {
    return res.end(JSON.stringify({ ok: false, error: String((e && e.message) || e) }));
  }
};
