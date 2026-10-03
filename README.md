# Selim Auto Care — Peugeot specialist garage website

Static, dependency-free site (HTML + CSS + vanilla JS + Chart.js from CDN). Deploys to Vercel as-is, no build step.

## Features
- Dark, premium layout modelled on the reference design, Peugeot imagery throughout
- EN / AR toggle (small pill in the nav), full RTL layout, Arabic typography (Cairo)
- 3D hero car with pointer tilt + parallax badges, 3D showroom carousel of nine Peugeot models (drag, swipe, arrows, keyboard, autoplay)
- Charts (Chart.js): price vs dealer, job mix, time in workshop, and an interactive service-interval planner
- Lead form with service chips, model picker, date, pick-up option, consent, honeypot; results land in **selimautocare@gmail.com**
- Service-reminder sign-up in the footer, WhatsApp floating button, click-to-call

## Lead form: how email delivery works
The form posts to [FormSubmit](https://formsubmit.co) (`https://formsubmit.co/ajax/selimautocare@gmail.com`). No account or API key is needed.

**One-time activation:** the first time someone submits the form, FormSubmit sends an email to selimautocare@gmail.com with an **Activate Form** button. Click it once. Every submission after that arrives as a table-formatted email with the reply-to set to the customer's address.

Optional hardening: after activation, FormSubmit gives you a random alias for the address (e.g. `https://formsubmit.co/ajax/abc123…`). Paste it into `formEndpoint` in `assets/js/config.js` so the raw email is not visible in page source.

## Editing content
- `assets/js/config.js` — phone, WhatsApp, address, chart figures, service intervals
- `assets/js/i18n.js` — every string in English and Arabic, plus the service cards and model list
- `assets/img/` — all imagery (WebP, optimised). Models in `img/models`, service photos in `img/services`, part shots in `img/parts`

Replace the placeholder phone number (`+971 50 000 0000`) and address before going live.

## Local preview
```bash
npx serve .
```
or any static server. Open http://localhost:3000.

## Deploy
Vercel: import the GitHub repo at https://vercel.com/new (team `selim-auto-care`), framework preset **Other**, no build command, output directory `.`.

## Credits and notice
Imagery sourced from Peugeot Abu Dhabi marketing pages at the owner's request. Selim Auto Care is an independent workshop, not affiliated with Stellantis or Automobiles Peugeot; the footer carries that disclaimer. Confirm image-usage rights with the brand before commercial launch.
