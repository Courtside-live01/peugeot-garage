/* ------------------------------------------------------------------
   Selim Auto Care — site configuration
   Edit this file only. No other file needs touching for day-to-day changes.
   ------------------------------------------------------------------ */
window.SITE = {
  // Where lead-form submissions go. FormSubmit forwards to this inbox.
  // First submission triggers a one-time activation email to this address.
  leadEmail: 'selimautocare@gmail.com',
  formEndpoint: 'https://formsubmit.co/ajax/selimautocare@gmail.com',   // reminder sign-up (no attachments)
  formAction: 'https://formsubmit.co/selimautocare@gmail.com',          // lead form (supports the registration-card photo)
  thanksUrl: 'https://selim-auto-care.vercel.app/thanks',             // where FormSubmit sends the visitor after a lead
  maxUploadMB: 10,

  // Country codes offered in the lead form. First entry is the default.
  // digits: allowed national-number lengths; mobilePrefix (optional): regex the national number must match.
  countryCodes: [
    { iso: 'AE', name: 'UAE', ar: 'الإمارات', code: '971', flag: '🇦🇪', digits: [9], mobilePrefix: '^5' },
    { iso: 'SA', name: 'Saudi Arabia', ar: 'السعودية', code: '966', flag: '🇸🇦', digits: [9], mobilePrefix: '^5' },
    { iso: 'OM', name: 'Oman', ar: 'عُمان', code: '968', flag: '🇴🇲', digits: [8], mobilePrefix: '^[79]' },
    { iso: 'QA', name: 'Qatar', ar: 'قطر', code: '974', flag: '🇶🇦', digits: [8], mobilePrefix: '^[3567]' },
    { iso: 'BH', name: 'Bahrain', ar: 'البحرين', code: '973', flag: '🇧🇭', digits: [8], mobilePrefix: '^[3]' },
    { iso: 'KW', name: 'Kuwait', ar: 'الكويت', code: '965', flag: '🇰🇼', digits: [8], mobilePrefix: '^[569]' },
    { iso: 'EG', name: 'Egypt', ar: 'مصر', code: '20', flag: '🇪🇬', digits: [10], mobilePrefix: '^1' },
    { iso: 'JO', name: 'Jordan', ar: 'الأردن', code: '962', flag: '🇯🇴', digits: [9], mobilePrefix: '^7' },
    { iso: 'LB', name: 'Lebanon', ar: 'لبنان', code: '961', flag: '🇱🇧', digits: [7, 8] },
    { iso: 'IN', name: 'India', ar: 'الهند', code: '91', flag: '🇮🇳', digits: [10], mobilePrefix: '^[6-9]' },
    { iso: 'PK', name: 'Pakistan', ar: 'باكستان', code: '92', flag: '🇵🇰', digits: [10], mobilePrefix: '^3' },
    { iso: 'BD', name: 'Bangladesh', ar: 'بنغلاديش', code: '880', flag: '🇧🇩', digits: [10], mobilePrefix: '^1' },
    { iso: 'PH', name: 'Philippines', ar: 'الفلبين', code: '63', flag: '🇵🇭', digits: [10], mobilePrefix: '^9' },
    { iso: 'LK', name: 'Sri Lanka', ar: 'سريلانكا', code: '94', flag: '🇱🇰', digits: [9], mobilePrefix: '^7' },
    { iso: 'NP', name: 'Nepal', ar: 'نيبال', code: '977', flag: '🇳🇵', digits: [10], mobilePrefix: '^9' },
    { iso: 'GB', name: 'United Kingdom', ar: 'المملكة المتحدة', code: '44', flag: '🇬🇧', digits: [10], mobilePrefix: '^7' },
    { iso: 'FR', name: 'France', ar: 'فرنسا', code: '33', flag: '🇫🇷', digits: [9], mobilePrefix: '^[67]' },
    { iso: 'DE', name: 'Germany', ar: 'ألمانيا', code: '49', flag: '🇩🇪', digits: [10, 11] },
    { iso: 'US', name: 'USA / Canada', ar: 'أمريكا / كندا', code: '1', flag: '🇺🇸', digits: [10] },
    { iso: 'TR', name: 'Türkiye', ar: 'تركيا', code: '90', flag: '🇹🇷', digits: [10], mobilePrefix: '^5' },
    { iso: 'MA', name: 'Morocco', ar: 'المغرب', code: '212', flag: '🇲🇦', digits: [9], mobilePrefix: '^[67]' },
    { iso: 'XX', name: 'Other', ar: 'أخرى', code: '', flag: '🌍', digits: [6, 7, 8, 9, 10, 11, 12] },
  ],

  // Contact details shown on the page (replace the placeholders)
  phoneDisplay: '+971 52 515 5001',
  phoneE164: '+971525155001',           // used for tel: and WhatsApp links
  whatsappText: 'Hi Selim Auto Care, I would like to book a service for my Peugeot.',
  address: { en: 'Workshop 12, Industrial Area, United Arab Emirates', ar: 'ورشة 12، المنطقة الصناعية، الإمارات العربية المتحدة' },
  mapsUrl: 'https://maps.google.com/?q=Selim+Auto+Care',

  // Hero showroom rotation: model image (assets/img/models) + display colour
  heroCars: [
    { img: 'hero-2008-blue',   name: '2008', color: '#2f7cff' },
    { img: 'hero-3008-red',    name: '3008', color: '#d94a3d' },
    { img: 'hero-408-green',   name: '408',  color: '#7bbf3a' },
    { img: 'hero-5008-white',  name: '5008', color: '#e6eaef' },
    { img: 'hero-2008-yellow', name: '2008', color: '#e4b422' },
    { img: 'hero-3008-blue',   name: '3008', color: '#1f8fd6' },
    { img: 'hero-408-grey',    name: '408',  color: '#9aa3ad' },
    { img: 'hero-5008-teal',   name: '5008', color: '#2a8c7a' },
  ],
  heroIntervalMs: 2570,   // was 3600; 40% faster cycle

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
