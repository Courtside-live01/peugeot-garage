# Selim Auto Care — Peugeot specialist garage website

Static, dependency-free site (HTML + CSS + vanilla JS + Chart.js from CDN). Deploys to Vercel as-is, no build step.

## Features
- Dark, premium layout modelled on the reference design, Peugeot imagery throughout
- EN / AR toggle (small pill in the nav), full RTL layout, Arabic typography (Cairo)
- Animated hero showroom cycling eight Peugeot models in different colours (drive-in/out, light sweep, colour-matched ring), pointer tilt
- "When to change car parts" guide: 16 numbered hotspots on a 3008, a detail panel (interval, warning signs, why it matters, photo, book button that pre-fills the form), a scrollable part picker with previous/next and a counter; keyboard arrows move between hotspots
- Charts (Chart.js): price vs dealer, job mix, time in workshop, and an interactive service-interval planner
- Lead form with model picker, Chassis No, Engine No, optional registration-card photo (camera or upload), service chips, consent, honeypot; results land in **selimautocare@gmail.com**
- Service-reminder sign-up in the footer, WhatsApp floating button, click-to-call

## Lead form: how email delivery works
The lead form posts natively (multipart, so the registration-card photo travels as an attachment) to [FormSubmit](https://formsubmit.co) at `https://formsubmit.co/selimautocare@gmail.com`, which emails the lead and redirects the visitor to `/thanks` (Arabic: `/thanks?lang=ar`). The footer reminder sign-up uses the AJAX endpoint. No account or API key is needed.

Fields sent: Name, Email (also set as reply-to), Mobile (country code + number, normalised to +971 50 123 4567 format), Model, Chassis No, Engine No, Services, Message, Language, plus the optional attachment (JPG/PNG/PDF, 10 MB limit enforced client-side and by FormSubmit).

Validation runs in the browser before anything is sent: name length, email syntax plus common typo domains (.con, gmail.co), and mobile length/prefix per country (`countryCodes` in config.js; UAE requires 9 digits starting with 5, leading 0 and country code are stripped automatically). Errors show under each field in the active language.

WhatsApp: all WhatsApp links and the floating button use `phoneE164` in `assets/js/config.js` (+971 52 515 5001). The number is deliberately not displayed on the page.

**One-time activation:** the first time someone submits the form, FormSubmit sends an email to selimautocare@gmail.com with an **Activate Form** button. Click it once. Every submission after that arrives as a table-formatted email with the reply-to set to the customer's address.

Optional hardening: after activation, FormSubmit gives you a random alias for the address (e.g. `https://formsubmit.co/ajax/abc123…`). Paste it into `formEndpoint` in `assets/js/config.js` so the raw email is not visible in page source.

## WhatsApp delivery of leads
Two layers, both independent of the email path:

1. **One-tap copy from the customer (works today).** After submitting, the thank-you page shows "Send on WhatsApp too". It opens WhatsApp with the whole request pre-written and addressed to +971 52 515 5001.
2. **Automatic message to the workshop.** `api/notify.js` is a Vercel serverless function the form calls before it submits. It needs one WhatsApp provider configured through environment variables (Vercel → Project → Settings → Environment Variables → Redeploy). Until then it returns `{ skipped: true }`. `GET /api/notify` reports which provider is active.

   | Provider | Env vars | Setup effort | Notes |
   |---|---|---|---|
   | **GREEN-API** (recommended to start) | `GREEN_ID_INSTANCE`, `GREEN_API_TOKEN`, optional `GREEN_API_URL` | ~5 min: register at console.green-api.com, create an instance, scan the QR from WhatsApp → Linked devices on the workshop phone | Sends from the workshop's own number to itself. Unofficial WhatsApp-Web gateway; fine for low-volume self-notifications |
   | **Meta WhatsApp Cloud API** (official) | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | ~20 min: Meta developer app → WhatsApp → API setup → add +971 52 515 5001 as a recipient → permanent System User token | Free for messages to your own verified number |
   | Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` | Sandbox needs re-joining every 72 h; production needs an approved sender | |
   | CallMeBot | `CALLMEBOT_APIKEY` | Free personal bot | Was full in Oct 2026 |

   Optional for all: `WA_TO` (digits only; default 971525155001). The function rate-limits to 5 calls per IP per 10 minutes and times out after 8 s so it can never block the form.

## Mobile
Below 900px a fixed bottom bar offers **Book a Service** and **WhatsApp**, the floating bubble hides, inputs are 16px to stop iOS zooming, and sections, charts and the form use tighter spacing.

## Logo
`assets/img/logo.webp` is the Mohammed Selim Absar Auto Repair Workshop sign cut out of its dark plate, with the gold lettering recoloured to the site's blue gradient; `assets/img/logo.png` is the original-colour master and `assets/img/logo-blue.png` the recoloured master. The nav logo fades in on load and glows with a light sweep on hover. `assets/favicon.svg` is a gold SA monogram.

## Editing content
- `assets/js/config.js` — phone, WhatsApp, address, chart figures, service intervals
- `assets/js/i18n.js` — every string in English and Arabic, plus the service cards and the `parts` guide text (intervals, signs, why). Hotspot positions and categories live in `PARTS` in `assets/js/app.js`
- `assets/img/` — all imagery (WebP, optimised). Models in `img/models`, service photos in `img/services`, part shots in `img/parts`

Replace the placeholder workshop address before going live. The `heroCars` list in config.js controls which cars and colours rotate in the hero; recoloured variants (3008 orange, 5008 red, 2008 yellow, 408 silver) are derived from the originals.

## Local preview
```bash
npx serve .
```
or any static server. Open http://localhost:3000.

## Deploy
Vercel: import the GitHub repo at https://vercel.com/new (team `selim-auto-care`), framework preset **Other**, no build command, output directory `.`.

## Credits and notice
Imagery sourced from Peugeot Abu Dhabi marketing pages at the owner's request. Selim Auto Care is an independent workshop, not affiliated with Stellantis or Automobiles Peugeot; the footer carries that disclaimer. Confirm image-usage rights with the brand before commercial launch.

## Image credits (parts guide)
Eight part photos come from Wikimedia Commons / Openverse under Creative Commons licences. They were cropped and placed on a plain panel; under CC BY-SA the edited files in `assets/img/parts/photo/` are shared under the same licence. Keep this table (also in `CREDITS.json`) with the site.

| Part | File | Author | Licence | Source |
|---|---|---|---|---|
| ac | Taumelscheibenverdichter-Schnitt.JPG | Cschirp | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Taumelscheibenverdichter-Schnitt.JPG |
| alternator | Car alternator on a workbench surrounded by various auto parts in a garage setting.jpg | <a href="//commons.wikimedia.org/wiki/User:Shixart1985" title="User:Shixart1985" | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Car_alternator_on_a_workbench_surrounded_by_various_auto_parts_in_a_garage_setting.jpg |
| belts | Keilrippenriemen Servopumpe Spannrollen VW T4 IMG 20160922 135213.jpg | H | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Keilrippenriemen_Servopumpe_Spannrollen_VW_T4_IMG_20160922_135213.jpg |
| fuelpump | Bosch Fuel Pump 0 580 254 957-92467.jpg | <a href="https://www.wikidata.org/wiki/Q108103612" class="extiw" title="d:Q | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Bosch_Fuel_Pump_0_580_254_957-92467.jpg |
| gearbox | Installiert Ölfilter in einem Automatikgetriebe IMG 6756.JPG | H | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Installiert_%C3%96lfilter_in_einem_Automatikgetriebe_IMG_6756.JPG |
| lights | " 13 - ITALY - Alfa Romeo headlight assembly - projector black headlamp xenon - Giulietta 2013.jpg | Pava | CC BY-SA 3.0 it | https://commons.wikimedia.org/wiki/File:%22_13_-_ITALY_-_Alfa_Romeo_headlight_assembly_-_projector_black_headlamp_xenon_-_Giulietta_2013.jpg |
| plugs | SparkPlug ILZKBR7A.jpg | <a href="//commons.wikimedia.org/w/index.php?title=User:J.skolimowski&amp;action | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:SparkPlug_ILZKBR7A.jpg |
| waterpump | Automotive coolant pump 6C1Q-8K500-AF-3352.jpg | <a href="https://www.wikidata.org/wiki/Q108103612" class="extiw" title="d:Q | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Automotive_coolant_pump_6C1Q-8K500-AF-3352.jpg |
