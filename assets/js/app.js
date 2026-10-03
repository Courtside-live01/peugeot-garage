/* Selim Auto Care — app */
(function () {
  'use strict';
  const S = window.SITE, I18N = window.I18N;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const charts = {};
  let lang = 'en';
  const t = (k) => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;

  /* ---------------- contact details from config ---------------- */
  function applyConfig() {
    const wa = `https://wa.me/${S.phoneE164.replace(/[^\d]/g, '')}?text=${encodeURIComponent(S.whatsappText)}`;
    $('#waLink').href = wa; $('#waFab').href = wa; const wb = $('#waBar'); if (wb) wb.href = wa;
    const pl = $('#phoneLink'); if (pl) { pl.href = `tel:${S.phoneE164}`; pl.textContent = S.phoneDisplay; }
    $('#year').textContent = new Date().getFullYear();
  }

  /* ---------------- i18n ---------------- */
  function setLang(next, { persist = true } = {}) {
    lang = I18N[next] ? next : 'en';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach(el => { const v = t(el.dataset.i18n); if (v !== el.dataset.i18n) el.innerHTML = v; });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $$('.lang__opt').forEach(o => o.classList.toggle('on', o.dataset.lang === lang));
    $('#addressText').textContent = S.address[lang] || S.address.en;
    document.title = lang === 'ar' ? 'سليم أوتو كير | ورشة متخصصة في بيجو' : 'Selim Auto Care | Peugeot Specialist Garage';
    if (persist) { try { localStorage.setItem('sac-lang', lang); } catch (e) {} }
    renderServices();
    if (hero.imgs.length) { $('#heroName').textContent = (lang === 'ar' ? 'بيجو ' : 'Peugeot ') + S.heroCars[hero.i].name; }
    const lf = $('#leadForm'); if (lf && lf._fillCC) lf._fillCC();
    const ft = $('#fileText'); if (ft && !$('#fileField').classList.contains('has-file')) ft.textContent = t('form.photoBtn');
    parts.render();
    buildCharts();
    planner.update();
  }

  /* ---------------- services ---------------- */
  function renderServices() {
    const grid = $('#servicesGrid'); if (!grid) return;
    grid.innerHTML = I18N[lang].services.map((s, i) => `
      <article class="svc reveal is-in" style="transition-delay:${i * 60}ms">
        <div class="svc__media">
          <img src="/assets/img/services/${s.img}.webp" alt="${s.title}" loading="lazy">
        </div>
        <div class="svc__body">
          <h3>${s.title}</h3>
          <p>${s.desc}</p>
          <button type="button" class="svc__btn" data-service="${s.id}">${t('services.book')}</button>
        </div>
      </article>`).join('');
    grid.addEventListener('click', e => {
      const b = e.target.closest('[data-service]'); if (!b) return;
      prefill({ service: b.dataset.service });
      document.getElementById('contact').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }, { once: true });
  }

  const serviceMap = { service: 'Full service', brakes: 'Brakes', diag: 'Diagnostics / warning light', battery: 'Battery', ac: 'Air conditioning', timing: 'Timing belt', tyres: 'Tyres / alignment', glass: 'Other' };
  function prefill({ service, model, message }) {
    if (service) { const cb = $(`#needChips input[value="${serviceMap[service] || service}"]`); if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); } }
    if (model) { const sel = $('#leadModel'); const opt = Array.from(sel.options).find(o => o.textContent.includes(model)); if (opt) sel.value = opt.value; }
    if (message) { const ta = $('textarea[name="Message"]'); ta.value = (ta.value ? ta.value + '\n' : '') + message; }
  }

  /* ---------------- hero showroom rotation ---------------- */
  const hero = {
    i: 0, timer: null, imgs: [],
    init() {
      const stage = $('#heroStage'); if (!stage) return;
      this.imgs = S.heroCars.map((c, k) => { const im = new Image(); im.src = `/assets/img/models/${c.img}.webp`; im.alt = `Peugeot ${c.name}`; im.className = 'car3d__img'; im.draggable = false; if (k === 0) im.fetchPriority = 'high'; stage.appendChild(im); return im; });
      const cap = $('#heroCaption'); cap.innerHTML = `<i></i><span id="heroName"></span><span class="car3d__dots">${S.heroCars.map(() => '<b></b>').join('')}</span>`;
      this.show(0, true);
      if (!reduceMotion) this.timer = setInterval(() => this.show(this.i + 1), S.heroIntervalMs || 3600);
      document.addEventListener('visibilitychange', () => { clearInterval(this.timer); if (!document.hidden && !reduceMotion) this.timer = setInterval(() => this.show(this.i + 1), S.heroIntervalMs || 3600); });
    },
    show(n, first) {
      const stage = $('#heroStage'); const prev = this.imgs[this.i]; this.i = n % this.imgs.length; const cur = this.imgs[this.i]; const car = S.heroCars[this.i];
      if (!first && prev !== cur) { prev.classList.remove('is-in'); prev.classList.add('is-out'); }
      cur.classList.remove('is-out'); void cur.offsetWidth; cur.classList.add('is-in');
      stage.style.setProperty('--car', car.color); $('#heroCaption').style.setProperty('--car', car.color);
      stage.classList.remove('is-sweep'); void stage.offsetWidth; stage.classList.add('is-sweep');
      $('#heroName').textContent = (lang === 'ar' ? 'بيجو ' : 'Peugeot ') + car.name;
      $$('.car3d__dots b').forEach((d, k) => d.classList.toggle('on', k === this.i));
    },
  };

  /* ---------------- tilt (3D hover) ---------------- */
  function initTilt() {
    if (reduceMotion || !window.matchMedia('(hover:hover)').matches) return;
    $$('[data-tilt]').forEach(el => {
      const max = parseFloat(el.dataset.tiltMax || 10);
      const layers = $$('[data-depth]', el);
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(1200px) rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
        layers.forEach(l => { const d = parseFloat(l.dataset.depth) / 2; l.style.transform = `translate3d(${px * d}px, ${py * d}px, 0)`; });
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; layers.forEach(l => l.style.transform = ''); });
    });
  }

  /* ---------------- parts guide (when to change) ---------------- */
  const I = {
    battery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="7" width="18" height="12" rx="2"/><path d="M7 4v3M17 4v3M7 13h4M9 11v4M14 13h3"/></svg>',
    oil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h5l1 3h3l3 4v9H5V6h3z"/><path d="M12 11c-1.6 2-2.4 3.2-2.4 4.3a2.4 2.4 0 0 0 4.8 0c0-1.1-.8-2.3-2.4-4.3z"/></svg>',
    tyres: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21"/></svg>',
    wipers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 17h18M12 17L7 6M12 17h0"/><path d="M4 9c4-3 12-3 16 0" stroke-dasharray="2 2"/></svg>',
    plugs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v3M9 5h6v4H9zM10 9v4h4V9M11 13v4h2v-4M12 17l-2 5h4z"/></svg>',
    belts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="7" cy="8" r="3"/><circle cx="17" cy="16" r="3"/><path d="M8.5 5.4l10 8M5.5 10.6l10 8"/></svg>',
    fuelpump: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h14M7 7h6v4H7zM15 9h2l3 3v6a2 2 0 0 1-4 0v-5"/></svg>',
    waterpump: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="1.5"/><path d="M12 6V3M18 12h3M12 18v3M6 12H3M9 9l2 2M15 9l-2 2M15 15l-2-2M9 15l2-2"/></svg>',
    gearbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="6" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="18" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><path d="M6 7v10M12 7v10M18 7v5H6"/></svg>',
    timing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="7" r="4"/><circle cx="16" cy="17" r="4"/><circle cx="8" cy="7" r="1.2"/><circle cx="16" cy="17" r="1.2"/><path d="M11.2 4.6l8 8.8M4.8 9.4l8 8.8"/></svg>',
    ac: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2v20M4 6l16 12M4 18L20 6M12 2l-2 2M12 2l2 2M12 22l-2-2M12 22l2-2"/></svg>',
    alternator: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M13 7l-3 5h4l-3 5"/></svg>',
    lights: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 5c5 0 8 3 8 7s-3 7-8 7a7 7 0 0 1 0-14z"/><path d="M19 8h3M19 12h3M19 16h3"/></svg>',
    checkup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.6-.6-.6-2.6z"/></svg>',
    brakes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3a9 9 0 0 1 9 9" stroke-width="3"/></svg>',
    shocks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2v3M12 19v3M8 5h8M8 19h8M9 7l6 2-6 2 6 2-6 2 6 2"/></svg>',
  };
  // order = numbering on the car; x/y are % positions on the 3008 image; svc = form chip to pre-tick
  const PARTS = [
    { id: 'battery',    cat: 'electrical', x: 58, y: 38, svc: 'Battery', photo: 'parts/battery' },
    { id: 'oil',        cat: 'fluids',     x: 66, y: 40, svc: 'Oil change', photo: 'services/oil-change' },
    { id: 'tyres',      cat: 'wheels',     x: 54, y: 73, svc: 'Tyres / alignment', photo: 'parts/tyre' },
    { id: 'wipers',     cat: 'comfort',    x: 50, y: 31, svc: 'Other', photo: 'parts/wipers' },
    { id: 'plugs',      cat: 'engine',     x: 73, y: 38, svc: 'Full service' },
    { id: 'belts',      cat: 'engine',     x: 86, y: 52, svc: 'Full service' },
    { id: 'fuelpump',   cat: 'engine',     x: 30, y: 58, svc: 'Diagnostics / warning light' },
    { id: 'waterpump',  cat: 'engine',     x: 84, y: 60, svc: 'Full service' },
    { id: 'gearbox',    cat: 'fluids',     x: 46, y: 64, svc: 'Full service' },
    { id: 'timing',     cat: 'engine',     x: 82, y: 44, svc: 'Timing belt', photo: 'parts/timing-belt' },
    { id: 'ac',         cat: 'comfort',    x: 42, y: 42, svc: 'Air conditioning' },
    { id: 'alternator', cat: 'electrical', x: 76, y: 60, svc: 'Diagnostics / warning light' },
    { id: 'lights',     cat: 'comfort',    x: 70, y: 49, svc: 'Other' },
    { id: 'checkup',    cat: 'engine',     x: 36, y: 78, svc: 'Full service', photo: 'services/diagnostics' },
    { id: 'brakes',     cat: 'wheels',     x: 14, y: 66, svc: 'Brakes', photo: 'parts/brake-disc' },
    { id: 'shocks',     cat: 'wheels',     x: 20, y: 50, svc: 'Brakes', photo: 'parts/strut' },
  ];
  const CATS = ['engine', 'electrical', 'wheels', 'fluids', 'comfort'];
  const parts = {
    cur: 'oil', filter: 'all',
    txt(id) { return (I18N[lang].parts && I18N[lang].parts[id]) || I18N.en.parts[id]; },
    render() {
      const car = $('#partsCar'); if (!car) return;
      $$('.hot', car).forEach(h => h.remove());
      PARTS.forEach((p, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'hot'; b.dataset.id = p.id; b.dataset.tip = this.txt(p.id).name; b.style.left = p.x + '%'; b.style.top = p.y + '%'; b.textContent = i + 1; b.setAttribute('aria-label', this.txt(p.id).name); car.appendChild(b); });
      const chips = $('#partsChips');
      chips.innerHTML = PARTS.map((p, i) => `<button type="button" data-id="${p.id}"><i>${i + 1}</i>${this.txt(p.id).name}</button>`).join('');
      let nav = $('.parts__nav'); if (!nav) { nav = document.createElement('div'); nav.className = 'parts__nav'; $('.parts__pick').appendChild(nav); }
      nav.innerHTML = `<span class="parts__counter" id="partsCounter"></span><button type="button" data-step="-1" aria-label="${t('parts.prev')}">${document.documentElement.dir === 'rtl' ? '&#10095;' : '&#10094;'}</button><button type="button" data-step="1" aria-label="${t('parts.next')}">${document.documentElement.dir === 'rtl' ? '&#10094;' : '&#10095;'}</button>`;
      this.select(this.cur, false);
    },
    select(id, scroll = true) {
      const p = PARTS.find(x => x.id === id); if (!p) return; this.cur = id; const d = this.txt(id); const n = PARTS.indexOf(p) + 1;
      const clock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>', road = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20L9 4h6l5 16M12 6v3M12 12v3M12 18v2"/></svg>';
      const pills = [d.km ? `<span class="parts__pill">${road}${d.km}</span>` : '', d.time ? `<span class="parts__pill parts__pill--time">${clock}${d.time}</span>` : ''].join('') || `<span class="parts__pill parts__pill--time">${clock}${t('parts.noFixed')}</span>`;
      const el = $('#partsDetail'); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
      el.innerHTML = `
        <div class="parts__detail-head"><span class="parts__ico">${I[id]}</span><div><div class="parts__cat">${String(n).padStart(2, '0')} · ${t('parts.cat.' + p.cat)}</div><h3>${d.name}</h3></div></div>
        ${p.photo ? `<img class="parts__photo" src="/assets/img/${p.photo}.webp" alt="${d.name}" loading="lazy">` : ''}
        <div><h4>${t('parts.interval')}</h4><div class="parts__pills">${pills}</div></div>
        <div><h4>${t('parts.signs')}</h4><ul class="parts__signs">${d.signs.map(x => `<li>${x}</li>`).join('')}</ul></div>
        <div><h4>${t('parts.why')}</h4><p class="parts__why">${d.why}</p></div>
        <a href="#contact" class="btn btn--primary btn--sm" data-svc="${p.svc}">${t('parts.book')}</a>`;
      $('a[data-svc]', el).onclick = () => { prefill({ service: p.svc, message: (lang === 'ar' ? 'أرغب بفحص: ' : 'I would like a check of: ') + d.name }); };
      $$('.hot').forEach(h => h.classList.toggle('on', h.dataset.id === id));
      $$('#partsChips button').forEach(c => { const on = c.dataset.id === id; c.classList.toggle('on', on); if (on && scroll) c.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' }); });
      const ctr = $('#partsCounter'); if (ctr) ctr.textContent = `${String(n).padStart(2, '0')} / ${PARTS.length}`;
      if (scroll && window.innerWidth < 900) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    },
    init() {
      if (!$('#partsCar')) return;
      $('#partsCar').addEventListener('click', e => { const h = e.target.closest('.hot'); if (h) this.select(h.dataset.id); });
      $('#partsChips').addEventListener('click', e => { const c = e.target.closest('button'); if (c) this.select(c.dataset.id); });
      $('.parts__pick').addEventListener('click', e => { const b = e.target.closest('[data-step]'); if (!b) return; const i = PARTS.findIndex(p => p.id === this.cur); this.select(PARTS[(i + (+b.dataset.step) + PARTS.length) % PARTS.length].id); });
      $('#partsCar').addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const i = PARTS.findIndex(p => p.id === this.cur); const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + PARTS.length) % PARTS.length; this.select(PARTS[n].id); $(`.hot[data-id="${PARTS[n].id}"]`).focus(); e.preventDefault(); } });
    },
  };

  /* ---------------- counters + reveal ---------------- */
  function initReveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: .12 });
    $$('.reveal').forEach(el => io.observe(el));
    const cio = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; count(e.target); cio.unobserve(e.target); }), { threshold: .6 });
    $$('[data-count]').forEach(el => cio.observe(el));
  }
  function count(el) {
    const end = +el.dataset.count, suf = (lang === 'ar' && el.dataset.suffixAr) || el.dataset.suffix || '', dur = reduceMotion ? 0 : 1600, t0 = performance.now();
    const step = now => { const p = Math.min(1, (now - t0) / (dur || 1)); const v = Math.round(end * (1 - Math.pow(1 - p, 3))); el.textContent = v.toLocaleString('en-US') + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ---------------- nav ---------------- */
  function initNav() {
    const burger = $('#burger'), menu = $('#mobileMenu');
    burger.onclick = () => { const open = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', open); };
    menu.addEventListener('click', e => { if (e.target.tagName === 'A') { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
    const links = $$('.nav__links a'); const secs = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(s => io.observe(s));
    $('#langToggle').onclick = () => setLang(lang === 'en' ? 'ar' : 'en');
    $$('a[href="#top"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); if (history.replaceState) history.replaceState(null, '', location.pathname + location.search); }));
  }

  /* ---------------- charts ---------------- */
  const C = { blue: '#3987e5', orange: '#d95926', aqua: '#199e70', yellow: '#c98500', magenta: '#d55181', green: '#008300', violet: '#9085e9', grid: 'rgba(255,255,255,.07)', tick: '#b6bdcc', surface: '#0d1324' };
  const isAr = () => lang === 'ar';
  const fmtN = (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d });

  function chartDefaults() {
    if (!window.Chart) return false;
    Chart.defaults.color = C.tick; Chart.defaults.font.family = isAr() ? 'Cairo, Inter, sans-serif' : 'Inter, Sora, sans-serif'; Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.tooltip.backgroundColor = '#0f1526'; Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,.14)'; Chart.defaults.plugins.tooltip.borderWidth = 1; Chart.defaults.plugins.tooltip.padding = 10; Chart.defaults.plugins.tooltip.titleColor = '#fff'; Chart.defaults.plugins.tooltip.bodyColor = '#dfe4ee'; Chart.defaults.plugins.tooltip.rtl = isAr(); Chart.defaults.plugins.tooltip.textDirection = isAr() ? 'rtl' : 'ltr';
    Chart.defaults.animation.duration = reduceMotion ? 0 : 700;
    return true;
  }
  const kill = id => { if (charts[id]) { charts[id].destroy(); delete charts[id]; } };
  const legendHTML = (items) => items.map(([c, l]) => `<span><i style="background:${c}"></i>${l}</span>`).join('');

  function buildCharts() {
    if (!chartDefaults()) return;
    const pc = S.priceComparison, mix = S.jobMix, tw = S.timeInWorkshop;
    const rtlOpts = { reverse: isAr() };

    // 1. grouped bar: Selim vs dealer (AED)
    kill('price');
    charts.price = new Chart($('#chartPrice'), {
      type: 'bar',
      data: { labels: isAr() ? pc.jobsAr : pc.jobs, datasets: [
        { label: t('insights.selim'), data: pc.selim, backgroundColor: C.blue, borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: 'bottom', maxBarThickness: 26 },
        { label: t('insights.dealer'), data: pc.dealer, backgroundColor: C.orange, borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: 'bottom', maxBarThickness: 26 },
      ] },
      options: { maintainAspectRatio: false, datasets: { bar: { categoryPercentage: .62, barPercentage: .86 } },
        scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: false, font: { size: window.innerWidth < 600 ? 10 : 11 }, callback(v) { const l = this.getLabelForValue(v); const W = window.innerWidth < 600 ? 9 : 14; return l.length > W ? l.split(' ').reduce((a, w) => { const last = a[a.length - 1]; if ((last + ' ' + w).length > W) a.push(w); else a[a.length - 1] = (last + ' ' + w).trim(); return a; }, ['']) : l; } }, ...rtlOpts },
          y: { grid: { color: C.grid }, border: { display: false }, ticks: { callback: v => fmtN(v) }, position: isAr() ? 'right' : 'left' } },
        plugins: { tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${fmtN(c.parsed.y)} AED` } } } }
    });
    $('#legendPrice').innerHTML = legendHTML([[C.blue, t('insights.selim')], [C.orange, t('insights.dealer')]]);

    // 2. doughnut: job mix (categorical, fixed order, 2px surface gaps)
    kill('mix');
    const mixColors = [C.blue, C.orange, C.aqua, C.yellow, C.magenta, C.violet, '#6b7280'];
    charts.mix = new Chart($('#chartMix'), {
      type: 'doughnut',
      data: { labels: isAr() ? mix.labelsAr : mix.labels, datasets: [{ data: mix.values, backgroundColor: mixColors, borderColor: C.surface, borderWidth: 2, hoverOffset: 6 }] },
      options: { maintainAspectRatio: false, cutout: '68%', plugins: { tooltip: { callbacks: { label: c => ` ${c.label}: ${fmtN(c.parsed)}%` } } },
        onHover: (e, els) => { const c = $('#donutTotal'); if (els.length) { const i = els[0].index; c.textContent = fmtN(mix.values[i]) + '%'; c.nextElementSibling.textContent = (isAr() ? mix.labelsAr : mix.labels)[i]; } else { c.textContent = '100%'; c.nextElementSibling.textContent = t('insights.c2center'); } } }
    });
    $('#legendMix').innerHTML = legendHTML((isAr() ? mix.labelsAr : mix.labels).map((l, i) => [mixColors[i], `${l} · ${fmtN(mix.values[i])}%`]));

    // 3. horizontal bar: hours in workshop (single series, no legend)
    kill('time');
    charts.time = new Chart($('#chartTime'), {
      type: 'bar',
      data: { labels: isAr() ? tw.labelsAr : tw.labels, datasets: [{ data: tw.hours, backgroundColor: C.aqua, borderRadius: isAr() ? { topLeft: 4, bottomLeft: 4 } : { topRight: 4, bottomRight: 4 }, borderSkipped: isAr() ? 'right' : 'left', maxBarThickness: 18 }] },
      options: { indexAxis: 'y', maintainAspectRatio: false,
        scales: { x: { grid: { color: C.grid }, border: { display: false }, ticks: { callback: v => fmtN(v, 1) + ' h' }, ...rtlOpts, position: 'bottom' }, y: { grid: { display: false }, position: isAr() ? 'right' : 'left' } },
        plugins: { tooltip: { callbacks: { label: c => ` ${fmtN(c.parsed.x, 2)} ${t('insights.hours')}` } } } }
    });

    // data tables
    const th = (...c) => `<tr>${c.map(x => `<th>${x}</th>`).join('')}</tr>`;
    $('#dataTables').innerHTML = `
      <table><caption>${t('insights.c1title')} (AED)</caption>${th(t('insights.job'), t('insights.selim'), t('insights.dealer'))}
        ${(isAr() ? pc.jobsAr : pc.jobs).map((j, i) => `<tr><td>${j}</td><td class="num">${fmtN(pc.selim[i])}</td><td class="num">${fmtN(pc.dealer[i])}</td></tr>`).join('')}</table>
      <table><caption>${t('insights.c2title')}</caption>${th(t('insights.job'), t('insights.share'))}
        ${(isAr() ? mix.labelsAr : mix.labels).map((j, i) => `<tr><td>${j}</td><td class="num">${fmtN(mix.values[i])}%</td></tr>`).join('')}</table>
      <table><caption>${t('insights.c3title')}</caption>${th(t('insights.job'), t('insights.hours'))}
        ${(isAr() ? tw.labelsAr : tw.labels).map((j, i) => `<tr><td>${j}</td><td class="num">${fmtN(tw.hours[i], 2)}</td></tr>`).join('')}</table>`;
  }

  /* ---------------- service planner ---------------- */
  const planner = {
    rows: [],
    compute() {
      const km = Math.max(0, +$('#plKm').value || 0), last = Math.min(km, Math.max(0, +$('#plLast').value || 0)), eng = $('#plEngine').value;
      const since = km - last;
      this.rows = (S.intervals[eng] || S.intervals.petrol).map(it => {
        const pct = Math.min(160, Math.round(since / it.km * 100));
        return { key: it.key, label: t('planner.item.' + it.key), pct, left: it.km - since, status: pct >= 100 ? 'due' : pct >= 75 ? 'soon' : 'ok' };
      }).sort((a, b) => b.pct - a.pct);
    },
    update() {
      if (!$('#plKm')) return;
      this.compute();
      const col = { ok: '#2ea36b', soon: '#e0a21b', due: '#e45757' };
      if (window.Chart) {
        kill('planner');
        charts.planner = new Chart($('#chartPlanner'), {
          type: 'bar',
          data: { labels: this.rows.map(r => r.label), datasets: [{ data: this.rows.map(r => r.pct), backgroundColor: this.rows.map(r => col[r.status]), borderRadius: isAr() ? { topLeft: 4, bottomLeft: 4 } : { topRight: 4, bottomRight: 4 }, borderSkipped: isAr() ? 'right' : 'left', maxBarThickness: 16 }] },
          options: { indexAxis: 'y', maintainAspectRatio: false,
            scales: { x: { min: 0, max: 160, grid: { color: C.grid }, border: { display: false }, ticks: { stepSize: 25, callback: v => fmtN(v) + '%' }, reverse: isAr() }, y: { grid: { display: false }, position: isAr() ? 'right' : 'left', ticks: { font: { size: 11 } } } },
            plugins: { tooltip: { callbacks: { label: c => { const r = this.rows[c.dataIndex]; return r.left >= 0 ? ` ${fmtN(r.pct)}% · ${fmtN(r.left)} km ${isAr() ? 'متبقية' : 'left'}` : ` ${fmtN(r.pct)}% · ${fmtN(-r.left)} km ${isAr() ? 'متأخر' : 'overdue'}`; } } },
              annotationLine: {} },
          },
          plugins: [{ id: 'dueLine', afterDraw(ch) { const x = ch.scales.x.getPixelForValue(100); const { top, bottom } = ch.chartArea; const ctx = ch.ctx; ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke(); ctx.restore(); } }]
        });
      }
      const due = this.rows.filter(r => r.status === 'due'), soon = this.rows.filter(r => r.status === 'soon');
      const sum = $('#plannerSummary'); let html = '';
      if (due.length) html += `<div><span class="pill pill--due"><i></i>${fmtN(due.length)} ${t('planner.sumDue')}</span> <span style="color:var(--text-3);font-size:.85rem">${due.map(r => r.label).join(' · ')}</span></div>`;
      if (soon.length) html += `<div><span class="pill pill--soon"><i></i>${fmtN(soon.length)} ${t('planner.sumSoon')}</span> <span style="color:var(--text-3);font-size:.85rem">${soon.map(r => r.label).join(' · ')}</span></div>`;
      if (!due.length && !soon.length) html += `<div><span class="pill pill--ok"><i></i>${t('planner.sumOk')}</span> <span style="color:var(--text-3);font-size:.85rem">${t('planner.sumNext')} ${this.rows[0].label} (${fmtN(this.rows[0].left)} km)</span></div>`;
      sum.innerHTML = html;
      $('#plannerCta').onclick = () => {
        const km = $('#plKm').value, eng = $('#plEngine').selectedOptions[0].textContent;
        const msg = `${isAr() ? 'المخطط' : 'Planner'}: ${fmtN(km)} km, ${eng}. ${due.length ? (isAr() ? 'متأخر: ' : 'Overdue: ') + due.map(r => r.label).join(', ') + '. ' : ''}${soon.length ? (isAr() ? 'قريباً: ' : 'Due soon: ') + soon.map(r => r.label).join(', ') + '.' : ''}`;
        const ta = $('textarea[name="Message"]'); ta.value = msg; if (due.length || soon.length) { const cb = $('#needChips input[value="Full service"]'); cb.checked = true; }
      };
    },
    init() { if (!$('#plannerForm')) return; $('#plannerForm').addEventListener('input', () => this.update()); $('#plannerForm').addEventListener('submit', e => e.preventDefault()); },
  };

  /* ---------------- lead form (FormSubmit → selimautocare@gmail.com) ---------------- */
  async function postForm(payload) {
    const res = await fetch(S.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json().catch(() => ({}));
    if (j && j.success === 'false') throw new Error(j.message || 'rejected');
    return j;
  }
  /* ---- validators ---- */
  const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
  function validEmail(v) { v = v.trim(); if (!EMAIL_RE.test(v) || v.length > 254) return false; const dom = v.split('@')[1].toLowerCase(); if (/\.(con|cmo|cm|comm|gmial|gamil)$/.test(dom) || /^(gmail|yahoo|hotmail|outlook)\.co$/.test(dom)) return false; return true; }
  function parseMobile(cc, raw) {
    let n = String(raw).replace(/[^\d+]/g, '');
    const codeDigits = cc.code;
    if (n.startsWith('+')) n = n.slice(1);
    if (n.startsWith('00')) n = n.slice(2);
    if (codeDigits && n.startsWith(codeDigits) && n.length > codeDigits.length + 5) n = n.slice(codeDigits.length); // typed with country code
    n = n.replace(/^0+/, '');                              // drop trunk zero (050 -> 50)
    if (cc.iso === 'XX') { const full = n.replace(/\D/g, ''); return { ok: /^\d{8,15}$/.test(full), full: '+' + full, national: full }; }
    const ok = cc.digits.includes(n.length) && /^\d+$/.test(n) && (!cc.mobilePrefix || new RegExp(cc.mobilePrefix).test(n));
    return { ok, full: '+' + codeDigits + n, national: n };
  }
  const fmtMobile = (cc, n) => cc.iso === 'AE' && n.length === 9 ? `+971 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}` : `+${cc.code} ${n}`;

  function initLeadForm() {
    const f = $('#leadForm'), st = $('#leadStatus'), btn = $('#leadSubmit');
    const fileIn = $('#leadFile'), fileField = $('#fileField'), fileText = $('#fileText'), fileClear = $('#fileClear');
    const ccSel = $('#leadCC'), mob = $('#leadMobile'), email = $('#leadEmail');
    const maxBytes = (S.maxUploadMB || 10) * 1024 * 1024;

    // country codes
    const fillCC = () => { const cur = ccSel.value; ccSel.innerHTML = S.countryCodes.map(c => `<option value="${c.iso}">${c.flag} ${c.code ? '+' + c.code : ''} ${lang === 'ar' ? c.ar : c.name}</option>`).join(''); ccSel.value = cur && S.countryCodes.some(c => c.iso === cur) ? cur : S.countryCodes[0].iso; };
    fillCC(); f._fillCC = fillCC;
    const cc = () => S.countryCodes.find(c => c.iso === ccSel.value) || S.countryCodes[0];
    ccSel.addEventListener('change', () => { mob.placeholder = cc().iso === 'AE' ? '50 123 4567' : ''; if (mob.value) check('mobile'); });

    // field-level validation
    const show = (key, msg, el) => { const e = $(`[data-err="${key}"]`, f); if (e) { e.textContent = msg || ''; e.classList.toggle('show', !!msg); } if (el) { el.classList.toggle('is-invalid', !!msg); el.classList.toggle('is-valid', !msg && !!el.value); } return !msg; };
    const check = (key) => {
      switch (key) {
        case 'name': return show('name', f.Name.value.trim().length >= 2 ? '' : t('form.errName'), f.Name);
        case 'email': return show('email', validEmail(email.value) ? '' : t('form.errEmail'), email);
        case 'mobile': { const r = parseMobile(cc(), mob.value); return show('mobile', r.ok ? '' : (cc().iso === 'AE' ? t('form.errMobileUae') : t('form.errMobile')), mob); }
        case 'model': return show('model', f.Model.value ? '' : t('form.errModel'), f.Model);
        case 'services': return show('services', $$('#needChips input:checked').length ? '' : t('form.errServices'));
        case 'consent': return show('consent', $('#leadConsent').checked ? '' : t('form.errConsent'));
      }
      return true;
    };
    f.Name.addEventListener('blur', () => check('name')); f.Name.addEventListener('input', () => { if (f.Name.classList.contains('is-invalid')) check('name'); });
    email.addEventListener('blur', () => check('email')); email.addEventListener('input', () => { if (email.classList.contains('is-invalid')) check('email'); });
    mob.addEventListener('blur', () => check('mobile')); mob.addEventListener('input', () => { mob.value = mob.value.replace(/[^\d\s+()-]/g, ''); if (mob.classList.contains('is-invalid')) check('mobile'); });
    f.Model.addEventListener('change', () => check('model'));
    $('#needChips').addEventListener('change', () => check('services'));
    $('#leadConsent').addEventListener('change', () => check('consent'));

    const resetFile = () => { fileIn.value = ''; fileField.classList.remove('has-file'); fileText.textContent = t('form.photoBtn'); fileClear.hidden = true; };
    fileIn.addEventListener('change', () => {
      const file = fileIn.files[0]; if (!file) return resetFile();
      if (file.size > maxBytes) { st.className = 'lead__status err'; st.textContent = t('form.fileTooBig'); return resetFile(); }
      st.textContent = ''; fileField.classList.add('has-file'); fileText.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`; fileClear.hidden = false;
    });
    fileClear.addEventListener('click', resetFile);

    f.addEventListener('submit', e => {
      e.preventDefault();
      if (f._honey && f._honey.value) return;
      const results = ['name', 'email', 'mobile', 'model', 'services', 'consent'].map(check);
      if (results.includes(false)) { st.className = 'lead__status err'; st.textContent = t('form.invalid'); const first = $('.is-invalid, .err.show', f); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      if (fileIn.files[0] && fileIn.files[0].size > maxBytes) { st.className = 'lead__status err'; st.textContent = t('form.fileTooBig'); return; }
      const services = $$('#needChips input:checked').map(i => i.value);
      const m = parseMobile(cc(), mob.value);
      $('#leadMobileFull').value = fmtMobile(cc(), m.national) + ` (${cc().name})`;
      $('#leadReplyTo').value = email.value.trim();
      $('#leadServices').value = services.join(', ');
      $('#leadLang').value = lang;
      $('#leadSubject').value = `New lead: ${f.Name.value.trim()} · ${f.Model.value} · ${services.join(', ')}`;
      const base = S.thanksUrl || (location.origin + '/thanks');
      $('#leadNext').value = base + (lang === 'ar' ? '?lang=ar' : '');
      const lead = { at: Date.now(), name: f.Name.value.trim(), mobile: fmtMobile(cc(), m.national), email: email.value.trim(), model: f.Model.value, services: services.join(', '), chassis: f['Chassis No'].value.trim(), engine: f['Engine No'].value.trim(), message: f.Message.value.trim(), lang };
      try { sessionStorage.setItem('sac-lead', JSON.stringify(lead)); } catch (err) {}
      // WhatsApp notification to the workshop (serverless; needs CALLMEBOT_APIKEY on Vercel, silently skipped otherwise)
      try { fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead), keepalive: true }).catch(() => {}); } catch (err) {}
      if (!fileIn.files.length) fileIn.disabled = true; // do not send an empty attachment field
      btn.disabled = true; btn.firstElementChild.textContent = t('form.sending'); st.className = 'lead__status'; st.textContent = '';
      f.submit(); // native multipart POST to FormSubmit, which redirects to /thanks
    });

    const rf = $('#reminderForm'), rs = $('#reminderStatus');
    rf.addEventListener('submit', async e => {
      e.preventDefault();
      const email = rf.email.value.trim();
      if (!validEmail(email)) { rs.className = 'lead__status err'; rs.textContent = t('form.invalidEmail'); return; }
      rf.querySelector('button').disabled = true;
      try { await postForm({ _subject: 'Service reminder sign-up', _template: 'table', _captcha: 'false', Email: email, Language: lang, Submitted: new Date().toISOString() }); rs.className = 'lead__status ok'; rs.textContent = t('form.okShort'); rf.reset(); }
      catch (err) { rs.className = 'lead__status err'; rs.textContent = t('form.err'); }
      finally { rf.querySelector('button').disabled = false; }
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    applyConfig();
    hero.init();
    parts.init();
    planner.init();
    initNav();
    initLeadForm();
    let saved = 'en'; try { saved = new URLSearchParams(location.search).get('lang') || localStorage.getItem('sac-lang') || (navigator.language.startsWith('ar') ? 'ar' : 'en'); } catch (e) {}
    setLang(saved, { persist: false });
    initTilt();
    initReveal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
