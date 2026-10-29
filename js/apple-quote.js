/* COAST — Your Quote · coastal glass test page
   Scroll choreography + presentation. No dependencies.
   Every per-frame write is a transform or opacity (compositor-only), and all
   measuring happens before any writing, so scrolling stays at 60fps. */
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  // Reduced motion is honoured gently: the scroll-linked scenes still work (the user drives them) but
  // without large movement. Add ?motion=full to the URL to see everything regardless of the OS setting.
  const forceFull = /[?&]motion=full/.test(location.search);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !forceFull;
  if (forceFull) document.body.classList.add('aq-motion');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);
  const smooth = (t) => t * t * (3 - 2 * t);

  const PRICES = {
    annual:  { value: 2148.89, note: 'Annual premium · Total premium payable', dock: 'Annual premium' },
    monthly: { value: 232.12,  note: 'Per month · 10 instalments',             dock: 'Per month · 10 instalments' },
    daily:   { value: 5.89,    note: 'Per day · annual premium ÷ 365',          dock: 'Per day · annual ÷ 365' }
  };
  const MODES = ['annual', 'monthly', 'daily'];
  const fmt = (n) => n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ---------- Odometer price ----------
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
        if (dot !== -1 && i > dot) { col.style.cssText = 'font-size:.45em;margin-top:.22em;opacity:.7;font-weight:300'; }
      } else {
        const s = document.createElement('span');
        s.className = 'odo-ch' + (ch === '$' ? ' cur' : '') + (dot !== -1 && i >= dot ? ' small' : '');
        s.textContent = ch;
        el.appendChild(s);
      }
    });
  }

  function rollTo(text, animate) {
    buildOdometer(priceEl, text);
    priceEl.setAttribute('aria-label', '$' + text);
    if (reduceMotion || !animate) {
      odoCols.forEach(c => { c.strip.style.transition = 'none'; c.strip.style.setProperty('--d', c.digit); });
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => odoCols.forEach((c, i) => {
      c.strip.style.setProperty('--delay', i * 70 + 'ms');
      c.strip.style.setProperty('--d', c.digit);
    })));
  }

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
    seg.style.setProperty('--i', MODES.indexOf(mode));
    $$('.aq-seg-btn', seg).forEach(b => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on);
    });
    const p = PRICES[mode];
    note.style.opacity = 0;
    setTimeout(() => { note.textContent = p.note; note.style.opacity = 1; }, 220);
    rollTo(fmt(p.value), true);
    dockPrice.textContent = '$' + fmt(p.value);
    dockLabel.textContent = p.dock;
  }));

  // ---------- Cards develop with scroll (translucent -> solid), so they skip the one-shot reveal ----------
  const cards = $$('.aq-tile, .aq-card, .aq-legal');
  cards.forEach(c => { c.classList.remove('reveal'); c.style.removeProperty('--d'); });

  // Wrap each $ amount in a span so it can count up when its card arrives
  const countGroups = new Map(); // card -> [{el, target, dec}]
  $$('.aq-tile .big, .aq-lines strong, .aq-total strong, .aq-row strong, .aq-dl dd').forEach(host => {
    const card = host.closest('.aq-tile, .aq-card');
    if (!card) return;
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const re = /\$([\d,]+(?:\.\d+)?)/g;
      if (!re.test(node.textContent)) return;
      re.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let last = 0, m;
      while ((m = re.exec(node.textContent))) {
        frag.appendChild(document.createTextNode(node.textContent.slice(last, m.index) + '$'));
        const s = document.createElement('span');
        s.className = 'aq-num';
        const dec = (m[1].split('.')[1] || '').length;
        s.dataset.final = m[1];
        s.textContent = m[1];
        if (!countGroups.has(card)) countGroups.set(card, []);
        countGroups.get(card).push({ el: s, target: parseFloat(m[1].replace(/,/g, '')), dec, shown: -1 });
        frag.appendChild(s);
        last = m.index + m[0].length;
      }
      frag.appendChild(document.createTextNode(node.textContent.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  });

  // Individual lines inside cards fade up one after another
  const items = $$('.aq-row, .aq-lines li, .aq-dl > div, .aq-total, .aq-date, .aq-nil, .aq-share, .aq-period-live').map(el => ({ el, last: -1 }));
  const cardState = cards.map(el => ({ el, last: -1 }));

  // ---------- One-shot reveals ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((el, i) => {
    if (!el.style.getPropertyValue('--d') && el.classList.contains('aq-tile')) el.style.setProperty('--d', ((i % 4) * 70) + 'ms');
    io.observe(el);
  });

  const bar = $('#bar');
  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) { bar.classList.add('in'); obs.disconnect(); }
  }, { threshold: 0.6 }).observe(bar);

  const shareNum = $('#shareNum'), shareLabel = $('#shareLabel');
  const TOTAL = 2148.89;
  const shareDefault = () => { shareNum.textContent = '$' + fmt(TOTAL); shareLabel.textContent = 'Total premium · hover or tap a line to see where it goes'; };
  function selectLine(n) {
    const li = $(`.aq-lines li[data-seg="${n}"]`);
    const amt = parseFloat($('strong', li).dataset.amt || $('strong', li).textContent.replace(/[$,]/g, ''));
    $$('.aq-lines li.sel').forEach(x => x.classList.remove('sel'));
    li.classList.add('sel');
    bar.classList.add('dim');
    $$('.seg.on', bar).forEach(s => s.classList.remove('on'));
    $(`.seg[data-seg="${n}"]`, bar).classList.add('on');
    shareNum.textContent = (amt / TOTAL * 100).toFixed(1) + '%';
    shareLabel.textContent = $('span', li).textContent + ' · $' + fmt(amt) + ' of your premium';
  }
  function clearLine() {
    $$('.aq-lines li.sel').forEach(x => x.classList.remove('sel'));
    bar.classList.remove('dim');
    $$('.seg.on', bar).forEach(s => s.classList.remove('on'));
    shareDefault();
  }
  $$('.aq-lines li').forEach(li => {
    const n = li.dataset.seg;
    $('strong', li).dataset.amt = $('strong', li).textContent.replace(/[$,]/g, '');
    li.addEventListener('mouseenter', () => selectLine(n));
    li.addEventListener('focus', () => selectLine(n));
    li.addEventListener('click', () => selectLine(n));
    li.addEventListener('mouseleave', clearLine);
    li.addEventListener('blur', clearLine);
  });
  $$('.seg', bar).forEach(sg => {
    sg.addEventListener('mouseenter', () => selectLine(sg.dataset.seg));
    sg.addEventListener('mouseleave', clearLine);
  });

  // ---------- Split headlines into words (scroll-lit) ----------
  function splitWords(el) {
    const words = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'aq-w';
            w.textContent = part;
            words.push(w);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(el);
    return words;
  }
  const heads = $$('.aq-sec-head h2, .aq-finale h2').map(el => ({ el, words: splitWords(el), last: -1 }));

  // ---------- Scroll scenes ----------
  const hero = $('#hero');
  const heroTop = $('#heroTop');
  const heroPrice = $('#heroPrice');
  const heroBottom = $('#heroBottom');
  const heroCue = $('.aq-scroll-cue');
  const story = $('#story');
  const beats = $$('.aq-beat', story).map(el => ({ el, num: $('[data-target]', el), target: +$('[data-target]', el).dataset.target, shown: -1 }));
  const storyStage = $('.aq-story-stage', story);
  const rings = $$('.aq-rings i', story);
  const dots = $$('.aq-dots button', story);
  const tiles = $$('.aq-tile');
  const blob = $('.blob.b1');
  const waves = $('.aq-waves');
  const dusk = $('#dusk');
  const progress = $('#progress');
  const nav = $('#nav');
  const dock = $('#dock');
  const finaleCtas = $('.aq-finale .aq-cta-row');
  const TILE_SPEEDS = [-22, 0, 20, 8];

  dots.forEach((d, i) => d.addEventListener('click', () => {
    const r = story.getBoundingClientRect();
    const top = scrollY + r.top + ((i + 0.55) / beats.length) * (r.height - innerHeight);
    scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
  }));

  let lastY = scrollY, ticking = false, heroPast = false, finaleVisible = false, dockOn = false;

  function frame() {
    ticking = false;
    const vh = innerHeight;
    const y = scrollY;

    // ---- read phase ----
    const heroR = hero.getBoundingClientRect();
    const storyR = story.getBoundingClientRect();
    const tileR = tiles.map(t => t.getBoundingClientRect());
    const headR = heads.map(h => h.el.getBoundingClientRect());
    const cardR = cards.map(c => c.getBoundingClientRect());
    const itemR = items.map(it => it.el.getBoundingClientRect());
    const finR = finaleCtas.getBoundingClientRect();
    const docH = document.documentElement.scrollHeight;

    // ---- write phase ----
    // global: sun sinks, sea rises, sky cools, hairline progress
    const sp = clamp(y / Math.max(1, docH - vh));
    if (!reduceMotion) {
      blob.style.transform = `translate3d(0, ${(sp * vh * 0.8).toFixed(1)}px, 0)`;
      waves.style.transform = `translate3d(0, ${(-sp * vh * 0.07).toFixed(1)}px, 0)`;
    }
    dusk.style.opacity = (sp * 0.95).toFixed(3);
    progress.style.transform = `scaleX(${sp.toFixed(4)})`;

    // hero: top + bottom fall away, the price shrinks and holds the stage, then dissolves
    const hp = clamp(-heroR.top / Math.max(1, heroR.height - vh));
    const fadeOut = clamp(hp / 0.32);
    heroTop.style.opacity = (1 - fadeOut).toFixed(3);
    if (!reduceMotion) heroTop.style.transform = `translate3d(0, ${(-fadeOut * 70).toFixed(1)}px, 0)`;
    heroBottom.style.opacity = (1 - clamp(hp / 0.26)).toFixed(3);
    if (!reduceMotion) heroBottom.style.transform = `translate3d(0, ${(clamp(hp / 0.26) * 60).toFixed(1)}px, 0)`;
    heroCue.style.opacity = (1 - clamp(hp / 0.12)).toFixed(3);
    heroBottom.style.pointerEvents = hp > 0.2 ? 'none' : '';
    const pe = clamp((hp - 0.38) / 0.34);
    heroPrice.style.opacity = (1 - smooth(pe)).toFixed(3);
    if (!reduceMotion) heroPrice.style.transform = `translate3d(0, ${(-hp * vh * 0.06).toFixed(1)}px, 0) scale(${(1 - easeOut(clamp(hp / 0.8)) * 0.42).toFixed(4)})`;
    heroPast = hp > 0.3;

    // story: three beats scrubbed by scroll, numbers count as they arrive
    const sp2 = clamp(-storyR.top / Math.max(1, storyR.height - vh));
    storyStage.style.opacity = smooth(clamp(1 - storyR.top / (vh * 0.3))).toFixed(3);
    const n = beats.length;
    beats.forEach((b, i) => {
      const t = clamp(sp2 * n - i);
      const inn = smooth(clamp(t / (i === 0 ? 0.12 : 0.22)));
      const out = i === n - 1 ? 1 : smooth(clamp((1 - t) / 0.22));
      const vis = inn * out;
      b.el.style.opacity = vis.toFixed(3);
      if (!reduceMotion) b.el.style.transform = `translate3d(0, ${((1 - inn) * 60 - (1 - out) * 60).toFixed(1)}px, 0) scale(${(1.12 - 0.12 * inn - 0.1 * (1 - out)).toFixed(4)})`;
      const v = Math.round(b.target * easeOut(clamp(t / 0.5)));
      if (v !== b.shown) { b.shown = v; b.num.textContent = v.toLocaleString('en-AU'); }
      if (dots[i]) dots[i].classList.toggle('on', vis > 0.5);
    });
    if (!reduceMotion) rings.forEach((r, i) => r.style.transform = `scale(${(0.5 + sp2 * (1.5 + i * 0.55) + i * 0.28).toFixed(4)})`);

    // headlines: words light up as the line climbs the viewport
    heads.forEach((h, k) => {
      const p = clamp((vh * 0.9 - headR[k].top) / (vh * 0.4));
      if (Math.abs(p - h.last) < 0.003) return;
      h.last = p;
      const x = p * (h.words.length + 2);
      h.words.forEach((w, i) => {
        const wp = clamp(x - i);
        w.style.opacity = (0.14 + 0.86 * wp).toFixed(3);
        if (!reduceMotion) w.style.transform = `translate3d(0, ${((1 - wp) * 14).toFixed(1)}px, 0)`;
      });
    });

    // cards develop: translucent and slightly small when they enter, solid and settled by ~45% up the screen
    cardState.forEach((cs, i) => {
      const r = cardR[i];
      const d = clamp((vh * 0.98 - r.top) / (vh * 0.5));
      if (Math.abs(d - cs.last) < 0.004) return;
      cs.last = d;
      const e = smooth(d);
      cs.el.style.opacity = (0.16 + 0.84 * e).toFixed(3);
      if (!reduceMotion) cs.el.style.scale = (0.955 + 0.045 * e).toFixed(4);
      const grp = countGroups.get(cs.el);
      if (grp) {
        const k = easeOut(clamp((d - 0.12) / 0.62));
        grp.forEach(g => {
          const v = k >= 1 ? g.target : g.target * k;
          const txt = g.dec ? v.toLocaleString('en-AU', { minimumFractionDigits: g.dec, maximumFractionDigits: g.dec })
                            : Math.round(v).toLocaleString('en-AU');
          if (txt !== g.shown) { g.shown = txt; g.el.textContent = txt; }
        });
      }
    });
    // lines inside cards follow, a beat later
    items.forEach((it, i) => {
      const r = itemR[i];
      const t = clamp((vh * 0.92 - r.top) / (vh * 0.26));
      if (Math.abs(t - it.last) < 0.004) return;
      it.last = t;
      it.el.style.opacity = smooth(t).toFixed(3);
      if (!reduceMotion) it.el.style.translate = `0 ${((1 - smooth(t)) * 16).toFixed(1)}px`;
    });

    // cover tiles drift at different speeds → depth
    if (!reduceMotion) tiles.forEach((t, i) => {
      const r = tileR[i];
      if (r.bottom < -200 || r.top > vh + 200) return;
      const off = (r.top + r.height / 2 - vh / 2) / vh;
      t.style.translate = `0 ${(off * TILE_SPEEDS[i % 4]).toFixed(1)}px`;
    });

    // nav hides on the way down; dock appears when the hero CTAs have gone
    nav.classList.toggle('hide', y > lastY && y > 160);
    lastY = y;
    finaleVisible = finR.top < vh && finR.bottom > 0;
    const show = heroPast && !finaleVisible;
    if (show !== dockOn) {
      dockOn = show;
      dock.classList.toggle('show', show);
      dock.setAttribute('aria-hidden', !show);
      $('button', dock).tabIndex = show ? 0 : -1;
    }
  }

  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  frame();

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

  // ---------- Pointer tilt on cards ----------
  if (!reduceMotion && matchMedia('(hover: hover)').matches) {
    $$('.aq-tile, .aq-duo .aq-card').forEach(card => {
      const lift = card.classList.contains('aq-tile') ? 5 : 3;
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.classList.add('aq-tilting');
        card.style.transform = `perspective(900px) translateY(${-lift}px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.classList.remove('aq-tilting'); card.style.transform = ''; });
    });
  }

  // ---------- Copy quote number ----------
  $('#navQuote').addEventListener('click', () => {
    const q = 'Q-PWC-260922-001';
    const done = () => showToast('Quote number copied · ' + q);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(q).then(done, done); else done();
  });

  // ---------- Magnetic buttons ----------
  if (!reduceMotion && matchMedia('(hover: hover)').matches) {
    $$('.aq-btn.primary, .aq-btn.glass-btn').forEach(btn => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.2;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        btn.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.translate = ''; });
    });
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

  const periodLive = $('#periodLive');
  function updatePeriodLive() {
    const a = new Date(start.value), b = new Date(end.value);
    if (isNaN(a) || isNaN(b) || b <= a) { periodLive.textContent = ''; return; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Math.round((a - today) / 864e5);
    const f = (d) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    const begins = days <= 0 ? 'Cover begins today' : days === 1 ? 'Cover begins tomorrow' : `Cover begins in ${days} days`;
    periodLive.textContent = `${begins} · protected through ${f(b)}`;
  }
  function updatePeriod() {
    updatePeriodLive();
    const a = new Date(start.value), b = new Date(end.value);
    if (isNaN(a) || isNaN(b) || b <= a) { periodLen.textContent = '—'; return; }
    const days = Math.round((b - a) / 864e5);
    const months = Math.round(days / 30.4375);
    periodLen.textContent = months >= 12 && months % 12 === 0
      ? (months / 12) + (months === 12 ? ' year' : ' years')
      : months > 1 ? months + ' months' : days + ' days';
  }
  start.addEventListener('change', () => {
    const a = new Date(start.value);
    if (!isNaN(a)) { const nx = new Date(a); nx.setFullYear(a.getFullYear() + 1); end.value = iso(nx); }
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
    if (e.key === 'Tab') {
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
