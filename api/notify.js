/**
 * POST /api/notify
 * Sends a WhatsApp message to the workshop for every lead submitted on the site.
 *
 * Provider: CallMeBot (free, personal WhatsApp). One-time setup by the workshop owner:
 *   1. Save +34 644 71 81 99 in your phone contacts (name it CallMeBot).
 *   2. From WhatsApp (+971 52 515 5001) send it the message:  I allow callmebot to send me messages
 *   3. CallMeBot replies with your API key.
 *   4. In Vercel: Project → Settings → Environment Variables → add
 *        CALLMEBOT_APIKEY = <the key>     (and optionally WA_TO = 971525155001)
 *      then redeploy.
 * If CALLMEBOT_APIKEY is not set the endpoint does nothing and returns { skipped: true },
 * so the email path via FormSubmit is never affected.
 */
const DEFAULT_TO = '971525155001';
const seen = new Map(); // tiny in-memory rate limit per IP (per warm instance)

function clean(v, max = 200) { return String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max); }

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method not allowed'); }

  const key = process.env.CALLMEBOT_APIKEY;
  const to = (process.env.WA_TO || DEFAULT_TO).replace(/[^\d]/g, '');
  if (!key) { res.statusCode = 200; return res.end(JSON.stringify({ skipped: true, reason: 'CALLMEBOT_APIKEY not set' })); }

  // rate limit: 5 per 10 minutes per IP
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now(); const hits = (seen.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  if (hits.length >= 5) { res.statusCode = 429; return res.end('Too many requests'); }
  hits.push(now); seen.set(ip, hits);

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const name = clean(body.name, 80), mobile = clean(body.mobile, 40), model = clean(body.model, 40), services = clean(body.services, 200);
  if (!name || !mobile || !model || !services) { res.statusCode = 400; return res.end('Missing fields'); }

  const lines = [
    '🔧 New service request (website)',
    `Name: ${name}`,
    `Mobile: ${mobile}`,
    body.email ? `Email: ${clean(body.email, 120)}` : null,
    `Model: ${model}`,
    `Services: ${services}`,
    body.chassis ? `Chassis: ${clean(body.chassis, 40)}` : null,
    body.engine ? `Engine: ${clean(body.engine, 40)}` : null,
    body.message ? `Notes: ${clean(body.message, 300)}` : null,
    `Lang: ${clean(body.lang, 5) || 'en'}`,
  ].filter(Boolean);

  const url = `https://api.callmebot.com/whatsapp.php?phone=${to}&apikey=${encodeURIComponent(key)}&text=${encodeURIComponent(lines.join('\n'))}`;
  try {
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, { signal: ctrl.signal }); clearTimeout(timer);
    res.statusCode = 200; return res.end(JSON.stringify({ ok: r.ok, status: r.status }));
  } catch (e) {
    res.statusCode = 200; return res.end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
  }
};
