/* ------------------------------------------------------------------
   Selim Auto Care — site configuration
   Edit this file only. No other file needs touching for day-to-day changes.
   ------------------------------------------------------------------ */
window.SITE = {
  // Where lead-form submissions go. FormSubmit forwards to this inbox.
  // First submission triggers a one-time activation email to this address.
  leadEmail: 'selimautocare@gmail.com',
  formEndpoint: 'https://formsubmit.co/ajax/selimautocare@gmail.com',

  // Contact details shown on the page (replace the placeholders)
  phoneDisplay: '+971 50 000 0000',
  phoneE164: '+971500000000',           // used for tel: and WhatsApp links
  whatsappText: 'Hi Selim Auto Care, I would like to book a service for my Peugeot.',
  address: { en: 'Workshop 12, Industrial Area, United Arab Emirates', ar: 'ورشة 12، المنطقة الصناعية، الإمارات العربية المتحدة' },
  mapsUrl: 'https://maps.google.com/?q=Selim+Auto+Care',

  // Indicative figures used in the Insights charts (AED). Edit freely.
  priceComparison: {
    jobs: ['Full service', 'Front brake pads & discs', 'Battery (AGM)', 'A/C regas & check', 'Timing belt kit'],
    jobsAr: ['خدمة كاملة', 'فحمات وأقراص أمامية', 'بطارية AGM', 'شحن وفحص المكيف', 'طقم سير التوقيت'],
    selim:  [650, 1450, 780, 350, 2400],
    dealer: [980, 2300, 1150, 520, 3600],
  },
  jobMix: {
    labels: ['Servicing & oil', 'Brakes', 'Diagnostics & electrical', 'A/C', 'Suspension & steering', 'Tyres', 'Other'],
    labelsAr: ['خدمة وزيت', 'فرامل', 'تشخيص وكهرباء', 'مكيف', 'تعليق وتوجيه', 'إطارات', 'أخرى'],
    values: [34, 17, 15, 12, 9, 7, 6],
  },
  timeInWorkshop: {
    labels: ['Oil change', 'Full service', 'Brake pads & discs', 'A/C regas', 'Diagnostics', 'Timing belt'],
    labelsAr: ['تغيير زيت', 'خدمة كاملة', 'فحمات وأقراص', 'شحن مكيف', 'تشخيص', 'سير التوقيت'],
    hours: [0.75, 3, 2.5, 1.5, 1.25, 6],
  },

  // Service interval planner (km / months). Typical Peugeot guidance, hot-climate adjusted.
  intervals: {
    petrol: [
      { key: 'oil', km: 10000, months: 12 },
      { key: 'airFilter', km: 30000, months: 24 },
      { key: 'cabinFilter', km: 15000, months: 12 },
      { key: 'brakeFluid', km: 40000, months: 24 },
      { key: 'sparkPlugs', km: 40000, months: 48 },
      { key: 'coolant', km: 80000, months: 60 },
      { key: 'timingBelt', km: 100000, months: 72 },
      { key: 'gearboxOil', km: 60000, months: 60 },
      { key: 'acService', km: 20000, months: 12 },
    ],
    diesel: [
      { key: 'oil', km: 10000, months: 12 },
      { key: 'fuelFilter', km: 30000, months: 24 },
      { key: 'airFilter', km: 30000, months: 24 },
      { key: 'cabinFilter', km: 15000, months: 12 },
      { key: 'brakeFluid', km: 40000, months: 24 },
      { key: 'adblue', km: 12000, months: 12 },
      { key: 'coolant', km: 80000, months: 60 },
      { key: 'timingBelt', km: 120000, months: 84 },
      { key: 'acService', km: 20000, months: 12 },
    ],
    hybrid: [
      { key: 'oil', km: 15000, months: 12 },
      { key: 'airFilter', km: 30000, months: 24 },
      { key: 'cabinFilter', km: 15000, months: 12 },
      { key: 'brakeFluid', km: 40000, months: 24 },
      { key: 'sparkPlugs', km: 60000, months: 48 },
      { key: 'coolant', km: 80000, months: 60 },
      { key: 'hvCheck', km: 20000, months: 12 },
      { key: 'acService', km: 20000, months: 12 },
    ],
    ev: [
      { key: 'cabinFilter', km: 15000, months: 12 },
      { key: 'brakeFluid', km: 40000, months: 24 },
      { key: 'coolant', km: 80000, months: 60 },
      { key: 'hvCheck', km: 20000, months: 12 },
      { key: 'reductionOil', km: 100000, months: 96 },
      { key: 'acService', km: 20000, months: 12 },
      { key: 'tyreRotation', km: 10000, months: 12 },
    ],
  },
};
