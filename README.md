# Selim Auto Care — Peugeot specialist garage website

Static, dependency-free site (HTML + CSS + vanilla JS + Chart.js from CDN). Deploys to Vercel as-is, no build step.

## Features
- Dark, premium layout modelled on the reference design, Peugeot imagery throughout
- EN / AR toggle (small pill in the nav), full RTL layout, Arabic typography (Cairo)
- Animated hero showroom cycling eight Peugeot models in different colours (drive-in/out, light sweep, colour-matched ring), pointer tilt
- "When to change car parts" guide: 16 numbered hotspots on a 3008, a detail panel (interval, warning signs, why it matters, photo, book button that pre-fills the form), category filters and a card grid; keyboard arrows move between hotspots
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

## Logo
`assets/img/logo.webp` is the Mohammed Selim Absar Auto Repair Workshop sign cut out of its dark plate so it sits on the navy theme; `assets/img/logo.png` is the full-resolution master. `assets/favicon.svg` is a gold SA monogram.

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
