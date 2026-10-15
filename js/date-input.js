/* Shows DD/MM/YYYY text entry (with calendar button) for date fields on the vessel and
   skipper sections. The original <input type="date"> stays in the DOM, hidden, and keeps
   holding the ISO value, so existing code that reads or sets .value keeps working. */
(function () {
  const SCOPE = '#vesselFieldList, .sk-block, #additionalBoatsList, #additionalJetSkisList';
  const pad = n => String(n).padStart(2, '0');
  const toDisplay = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? `${m[3]}/${m[2]}/${m[1]}` : ''; };
  const toIso = text => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
    if (!m) return '';
    const d = new Date(+m[3], +m[2] - 1, +m[1]);
    if (d.getFullYear() !== +m[3] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[1]) return '';
    return `${m[3]}-${m[2]}-${m[1]}`;
  };
  const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

  function enhance(input) {
    if (input._dateEnhanced || input.type !== 'date' || !input.closest(SCOPE)) return;
    input._dateEnhanced = true;

    const wrap = document.createElement('span');
    wrap.className = 'date-dmy';
    const text = document.createElement('input');
    text.type = 'text';
    text.inputMode = 'numeric';
    text.maxLength = 10;
    text.placeholder = 'DD/MM/YYYY';
    text.autocomplete = 'off';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'date-dmy-btn';
    btn.tabIndex = -1;
    btn.setAttribute('aria-label', 'Open calendar');
    btn.textContent = '📅';

    input.parentNode.insertBefore(wrap, input);
    wrap.append(text, btn, input);
    input.classList.add('date-dmy-native');
    input.tabIndex = -1;
    text.value = toDisplay(input.value);

    // Programmatic sets (prefill, example data) refresh the visible text.
    Object.defineProperty(input, 'value', {
      get() { return proto.get.call(this); },
      set(v) { proto.set.call(this, v); text.value = toDisplay(this.value); text.classList.remove('field-invalid'); }
    });

    const fire = () => {
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    text.addEventListener('input', () => {
      const digits = text.value.replace(/\D/g, '').slice(0, 8);
      let out = digits.slice(0, 2);
      if (digits.length > 2) out += '/' + digits.slice(2, 4);
      if (digits.length > 4) out += '/' + digits.slice(4);
      text.value = out;
      let iso = out.length === 10 ? toIso(out) : '';
      if (iso && input.max && iso > input.max) iso = '';
      if (iso && input.min && iso < input.min) iso = '';
      text.classList.toggle('field-invalid', out.length === 10 && !iso);
      if (proto.get.call(input) !== iso) { proto.set.call(input, iso); fire(); }
    });

    btn.addEventListener('click', () => { try { input.showPicker(); } catch (e) { input.focus(); } });
    input.addEventListener('change', () => { text.value = toDisplay(proto.get.call(input)); text.classList.remove('field-invalid'); });
  }

  const scan = root => root.querySelectorAll && root.querySelectorAll('input[type="date"]').forEach(enhance);
  const start = () => {
    scan(document);
    new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      if (n.matches && n.matches('input[type="date"]')) enhance(n); else scan(n);
    }))).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
