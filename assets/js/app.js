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
    $('#waLink').href = wa; $('#waFab').href = wa;
    const pl = $('#phoneLink'); pl.href = `tel:${S.phoneE164}`; pl.textContent = S.phoneDisplay;
    $('#year').textContent = new Date().getFullYear();
    const d = $('#leadDate'); if (d) d.min = new Date().toISOString().slice(0, 10);
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
    carousel.render();
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
          <span class="svc__from">${t('services.from')} <b>${s.from}</b></span>
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
    if (service) { const cb = $(`#needChips input[value="${serviceMap[service] || service}"]`); if (cb) cb.checked = true; }
    if (model) { const sel = $('#leadModel'); const opt = Array.from(sel.options).find(o => o.textContent.includes(model)); if (opt) sel.value = opt.value; }
    if (message) { const ta = $('textarea[name="message"]'); ta.value = (ta.value ? ta.value + '\n' : '') + message; }
  }

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

  /* ---------------- 3D showroom carousel ---------------- */
  const carousel = {
    idx: 0, n: 0, timer: null,
    render() {
      const stage = $('#carouselStage'); if (!stage) return;
      const models = I18N[lang].models; this.n = models.length;
      stage.innerHTML = models.map((m, i) => `
        <figure class="car-slide" data-i="${i}" aria-label="${m.name}">
          <div class="car-slide__shadow"></div>
          <img src="/assets/img/models/${m.img}.webp" alt="${m.name}" loading="lazy" draggable="false">
        </figure>`).join('');
      let dots = $('.carousel__dots');
      if (!dots) { dots = document.createElement('div'); dots.className = 'carousel__dots'; $('#carouselCaption').after(dots); }
      dots.innerHTML = models.map((m, i) => `<button type="button" data-i="${i}" aria-label="${m.name}"></button>`).join('');
      dots.onclick = e => { const b = e.target.closest('button'); if (b) this.go(+b.dataset.i); };
      stage.onclick = e => { const f = e.target.closest('.car-slide'); if (!f) return; const i = +f.dataset.i; if (i === this.idx) { prefill({ model: models[i].name.replace(/^(Peugeot|بيجو)\s*/, '').split(' /')[0] }); document.getElementById('contact').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); } else this.go(i); };
      this.layout();
    },
    layout() {
      const slides = $$('.car-slide'); const n = this.n; const radius = Math.max(420, Math.min(window.innerWidth * .55, 760));
      slides.forEach((s, i) => {
        let off = ((i - this.idx) % n + n) % n; if (off > n / 2) off -= n;
        const angle = off * (360 / n);
        const rtl = document.documentElement.dir === 'rtl' ? -1 : 1;
        s.style.transform = `rotateY(${angle * rtl}deg) translateZ(${radius}px) rotateY(${-angle * rtl}deg) scale(${off === 0 ? 1 : .72})`;
        s.style.opacity = Math.abs(off) > 2 ? 0 : 1;
        s.style.zIndex = 10 - Math.abs(off);
        s.classList.toggle('is-active', off === 0);
        s.style.pointerEvents = Math.abs(off) > 2 ? 'none' : 'auto';
      });
      const m = I18N[lang].models[this.idx];
      $('#carouselCaption').innerHTML = `<h3>${m.name}</h3><p>${m.kind}</p><a href="#contact" class="btn btn--ghost btn--sm" data-model="${m.id}">${t('models.select')}</a>`;
      $('#carouselCaption a').onclick = () => prefill({ model: m.name.replace(/^(Peugeot|بيجو)\s*/, '').split(' /')[0] });
      $$('.carousel__dots button').forEach((b, i) => b.classList.toggle('on', i === this.idx));
    },
    go(i) { this.idx = ((i % this.n) + this.n) % this.n; this.layout(); this.restart(); },
    next() { this.go(this.idx + 1); }, prev() { this.go(this.idx - 1); },
    restart() { clearInterval(this.timer); if (!reduceMotion) this.timer = setInterval(() => this.next(), 4500); },
    init() {
      const el = $('#carousel'); if (!el) return;
      $('#carNext').onclick = () => this.next(); $('#carPrev').onclick = () => this.prev();
      el.addEventListener('keydown', e => { if (e.key === 'ArrowRight') this.next(); if (e.key === 'ArrowLeft') this.prev(); });
      let sx = null, moved = false;
      el.addEventListener('pointerdown', e => { sx = e.clientX; moved = false; });
      el.addEventListener('pointermove', e => { if (sx === null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 60) { moved = true; dx < 0 ? this.next() : this.prev(); sx = e.clientX; } });
      el.addEventListener('pointerup', () => { sx = null; }); el.addEventListener('pointercancel', () => { sx = null; });
      el.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
      el.addEventListener('mouseenter', () => clearInterval(this.timer)); el.addEventListener('mouseleave', () => this.restart());
      window.addEventListener('resize', () => this.layout());
      this.restart();
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
        const ta = $('textarea[name="message"]'); ta.value = msg; if (due.length || soon.length) { const cb = $('#needChips input[value="Full service"]'); cb.checked = true; }
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
  function initLeadForm() {
    const f = $('#leadForm'), st = $('#leadStatus'), btn = $('#leadSubmit');
    f.addEventListener('submit', async e => {
      e.preventDefault();
      if (f._honey && f._honey.value) return;
      const services = $$('input[name="service"]:checked', f).map(i => i.value);
      if (!f.checkValidity() || !services.length) { st.className = 'lead__status err'; st.textContent = t('form.invalid'); f.reportValidity(); return; }
      const fd = new FormData(f);
      const payload = {
        _subject: `New lead: ${fd.get('name')} · ${fd.get('model')} · ${services.join(', ')}`,
        _template: 'table', _captcha: 'false', _replyto: fd.get('email') || undefined,
        Name: fd.get('name'), Mobile: fd.get('phone'), Email: fd.get('email') || '-', 'Plate / VIN': fd.get('plate') || '-',
        Model: fd.get('model'), Year: fd.get('year') || '-', Services: services.join(', '), 'Preferred date': fd.get('preferred_date') || '-',
        'Pick-up requested': fd.get('pickup'), Message: fd.get('message') || '-', Language: lang, Page: location.href, Submitted: new Date().toISOString(),
      };
      btn.disabled = true; btn.firstElementChild.textContent = t('form.sending'); st.className = 'lead__status'; st.textContent = '';
      try { await postForm(payload); st.className = 'lead__status ok'; st.textContent = t('form.ok'); f.reset(); }
      catch (err) { console.error(err); st.className = 'lead__status err'; st.textContent = t('form.err'); }
      finally { btn.disabled = false; btn.firstElementChild.textContent = t('form.submit'); }
    });

    const rf = $('#reminderForm'), rs = $('#reminderStatus');
    rf.addEventListener('submit', async e => {
      e.preventDefault();
      const email = rf.email.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { rs.className = 'lead__status err'; rs.textContent = t('form.invalidEmail'); return; }
      rf.querySelector('button').disabled = true;
      try { await postForm({ _subject: 'Service reminder sign-up', _template: 'table', _captcha: 'false', Email: email, Language: lang, Submitted: new Date().toISOString() }); rs.className = 'lead__status ok'; rs.textContent = t('form.okShort'); rf.reset(); }
      catch (err) { rs.className = 'lead__status err'; rs.textContent = t('form.err'); }
      finally { rf.querySelector('button').disabled = false; }
    });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    applyConfig();
    carousel.init();
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
