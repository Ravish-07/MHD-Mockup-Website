/* COAST — Your Quote · Liquid Glass test page
   Pure presentation: odometer price, scroll reveals, cursor specular light,
   payment toggle, floating dock, email sheet. No dependencies. */
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PRICES = {
    annual:  { value: 2148.89, note: 'Annual premium · Total premium payable', dock: 'Annual premium' },
    monthly: { value: 232.12,  note: 'Per month · 10 instalments',             dock: 'Per month · 10 instalments' }
  };

  const fmt = (n) => n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ---------- Odometer ----------
  // Builds one vertical digit strip per numeral; changing --d slides to the digit.
  const priceEl = $('#priceNum');
  let odoCols = [];

  function buildOdometer(el, text) {
    el.textContent = '';
    odoCols = [];
    const chars = ('$' + text).split('');
    const dot = chars.indexOf('.');
    chars.forEach((ch, i) => {
      if (/\d/.test(ch)) {
        const col = document.createElement('span');
        col.className = 'odo-col';
        const strip = document.createElement('span');
        strip.className = 'odo-strip';
        strip.style.setProperty('--d', 0);
        for (let n = 0; n <= 9; n++) {
          const s = document.createElement('span');
          s.textContent = n;
          strip.appendChild(s);
        }
        col.appendChild(strip);
        el.appendChild(col);
        odoCols.push({ strip, digit: +ch });
        if (dot !== -1 && i > dot) col.classList.add('small-wrap');
      } else {
        const s = document.createElement('span');
        s.className = 'odo-ch' + (ch === '$' ? ' cur' : '') + (dot !== -1 && i >= dot ? ' small' : '');
        s.textContent = ch;
        el.appendChild(s);
      }
    });
    // cents: shrink the digit columns after the decimal point
    $$('.odo-col.small-wrap', el).forEach(c => { c.style.fontSize = '.45em'; c.style.marginTop = '.22em'; c.style.opacity = '.75'; c.style.fontWeight = '300'; });
  }

  function rollTo(text, animate) {
    buildOdometer(priceEl, text);
    priceEl.setAttribute('aria-label', '$' + text);
    // double rAF so the 0 → target transition actually runs
    const go = () => odoCols.forEach((c, i) => {
      c.strip.style.setProperty('--delay', (animate ? i * 70 : 0) + 'ms');
      c.strip.style.setProperty('--d', c.digit);
    });
    if (reduceMotion || !animate) { odoCols.forEach(c => { c.strip.style.transition = 'none'; c.strip.style.setProperty('--d', c.digit); }); return; }
    requestAnimationFrame(() => requestAnimationFrame(go));
  }

  // First roll waits until the hero is on screen and the page has settled: the "wow" beat.
  let mode = 'annual';
  rollTo(fmt(PRICES.annual.value), false);
  odoCols.forEach(c => { c.strip.style.transition = 'none'; c.strip.style.setProperty('--d', 0); });
  window.addEventListener('load', () => setTimeout(() => {
    odoCols.forEach(c => c.strip.style.removeProperty('transition'));
    rollTo(fmt(PRICES.annual.value), true);
  }, 450));

  // ---------- Payment toggle ----------
  const seg = $('.aq-seg');
  const note = $('#priceNote');
  const dockPrice = $('#dockPrice');
  const dockLabel = $('#dockLabel');

  $$('.aq-seg-btn', seg).forEach(btn => btn.addEventListener('click', () => {
    const next = btn.dataset.mode;
    if (next === mode) return;
    mode = next;
    seg.dataset.mode = mode;
    $$('.aq-seg-btn', seg).forEach(b => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on);
    });
    const p = PRICES[mode];
    note.style.opacity = 0;
    setTimeout(() => { note.textContent = p.note; note.style.opacity = 1; }, 220);
    // Re-roll: start from zeros so every digit visibly travels
    rollTo(fmt(p.value), true);
    dockPrice.textContent = '$' + fmt(p.value);
    dockLabel.textContent = p.dock;
  }));

  // ---------- Scroll reveal ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((el, i) => {
    // Stagger tiles/facts that share a row without hand-written delays
    if (!el.style.getPropertyValue('--d') && (el.classList.contains('aq-tile'))) {
      el.style.setProperty('--d', ((i % 4) * 70) + 'ms');
    }
    io.observe(el);
  });

  // Breakdown bar grows when visible
  const bar = $('#bar');
  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) { bar.classList.add('in'); obs.disconnect(); }
  }, { threshold: 0.6 }).observe(bar);

  // Bar <-> legend hover linking
  $$('.aq-lines li').forEach(li => {
    const n = li.dataset.seg;
    const on = () => { bar.classList.add('dim'); $(`.seg[data-seg="${n}"]`, bar).classList.add('on'); };
    const off = () => { bar.classList.remove('dim'); $$('.seg.on', bar).forEach(s => s.classList.remove('on')); };
    li.addEventListener('mouseenter', on);
    li.addEventListener('mouseleave', off);
  });

  // ---------- Count-up on key facts ----------
  $$('[data-count]').forEach(el => {
    const target = +el.dataset.count;
    const run = () => {
      if (reduceMotion) return;
      const t0 = performance.now(), dur = 2200;
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 4);
        el.textContent = Math.round(target * eased).toLocaleString('en-AU');
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!reduceMotion) el.textContent = '0';
    new IntersectionObserver((en, obs) => { if (en[0].isIntersecting) { run(); obs.disconnect(); } }, { threshold: 0.6 }).observe(el);
  });

  // ---------- Cursor-tracked specular light on glass ----------
  let raf = 0;
  document.addEventListener('pointermove', (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const g = e.target.closest && e.target.closest('.glass');
      if (g) {
        const r = g.getBoundingClientRect();
        g.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        g.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }
    });
  }, { passive: true });

  // ---------- Nav hides on scroll down, returns on scroll up; dock appears past hero CTAs ----------
  const nav = $('#nav');
  const dock = $('#dock');
  const heroCtas = $('#heroCtas');
  let lastY = scrollY, heroGone = false;

  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('hide', y > lastY && y > 160);
    lastY = y;
  }, { passive: true });

  new IntersectionObserver(([e]) => {
    heroGone = !e.isIntersecting && e.boundingClientRect.top < 0;
    setDock();
  }).observe(heroCtas);

  const finale = $('.aq-finale .aq-cta-row');
  let finaleVisible = false;
  new IntersectionObserver(([e]) => { finaleVisible = e.isIntersecting; setDock(); }).observe(finale);

  function setDock() {
    const show = heroGone && !finaleVisible;
    dock.classList.toggle('show', show);
    dock.setAttribute('aria-hidden', !show);
    $('button', dock).tabIndex = show ? 0 : -1;
  }

  // ---------- Period of insurance ----------
  const start = $('#policyStartDate');
  const end = $('#policyEndDate');
  const periodLen = $('#periodLen');
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  (function setDefaultDates() {
    const today = new Date();
    const next = new Date(today);
    next.setFullYear(today.getFullYear() + 1);
    start.value = iso(today);
    end.value = iso(next);
  })();

  function updatePeriod() {
    const a = new Date(start.value), b = new Date(end.value);
    if (isNaN(a) || isNaN(b) || b <= a) { periodLen.textContent = '—'; return; }
    const days = Math.round((b - a) / 864e5);
    const months = Math.round(days / 30.4375);
    periodLen.textContent = months >= 12 && months % 12 === 0
      ? (months / 12) + (months === 12 ? ' year' : ' years')
      : months > 1 ? months + ' months' : days + ' days';
  }
  start.addEventListener('change', () => {
    // keep the standard 12-month term unless the user has set their own end date
    const a = new Date(start.value);
    if (!isNaN(a)) { const n = new Date(a); n.setFullYear(a.getFullYear() + 1); end.value = iso(n); }
    updatePeriod();
  });
  end.addEventListener('change', updatePeriod);
  updatePeriod();

  // ---------- Toast ----------
  const toast = $('#toast');
  let toastT;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  $$('[data-action="buy"]').forEach(b => b.addEventListener('click', () => {
    showToast('Test page — Buy Online continues to Your Details in the live flow.');
  }));

  // ---------- Email sheet ----------
  const modal = $('#emailModal');
  const form = $('#emailForm');
  const sent = $('#emailSent');
  let lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    form.hidden = false; sent.hidden = true;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#reviewInsuredName').focus(), 350);
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  $$('[data-action="email"]').forEach(b => b.addEventListener('click', openModal));
  $('#emailClose').addEventListener('click', closeModal);
  $('#emailDone').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') { // keep focus inside the sheet
      const f = $$('button, input', modal).filter(el => !el.closest('[hidden]'));
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  $('#emailSubmit').addEventListener('click', () => {
    const name = $('#reviewInsuredName'), email = $('#reviewEmail');
    let ok = true;
    [name, email].forEach(i => i.classList.remove('err'));
    if (!name.value.trim()) { name.classList.add('err'); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { email.classList.add('err'); ok = false; }
    if (!ok) return;
    form.hidden = true; sent.hidden = false;
    $('#emailDone').focus();
  });
})();
