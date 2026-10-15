/* Shared owners / skippers block used at the bottom of Vessel Details and each
   additional vessel. State lives on the `target` object ({ numOwners, numSkippers,
   skippers[] }) so a host can re-render freely.

   SkipperSection.render(mount, target, {
     extra:        true -> also ask "years on this size and type" + previous boats
     picker:       false -> hide the previously-added skipper list (Vessel Details)
   getTargets:   () => every target on the quote (builds the existing-skipper list)
     onChange:     () => host re-validates
   })
   SkipperSection.isComplete(target)  -> at least one fully completed skipper
   SkipperSection.missing(target)     -> number of skippers still incomplete
*/
(function () {
  const MAX_SKIPPERS = 20;
  const COUNT_OPTIONS = ['1', '2', '3', '4', '5+'];
  const YEARS = ['0', '1', '2', '3', '4', '5+'];

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const blank = () => ({ name: '', dob: '', licenceDate: '', yearsOwning: '', yearsSizeType: '', previousBoats: '' });

  const requiredKeys = extra =>
    extra ? ['name', 'dob', 'licenceDate', 'yearsOwning', 'yearsSizeType'] : ['name', 'dob', 'licenceDate', 'yearsOwning'];

  const isRowComplete = (s, extra) => requiredKeys(extra).every(k => s[k]);

  function targetCount(t) {
    return t.numSkippers === '5+' ? 5 : Number(t.numSkippers) || 0;
  }

  // Keep the "how many people skipper" answer and the number of rows in step.
  function syncRows(t) {
    t.skippers = t.skippers || [];
    const n = targetCount(t);
    if (t.numSkippers && t.numSkippers !== '5+') {
      while (t.skippers.length > n && !Object.values(t.skippers[t.skippers.length - 1]).some(Boolean)) t.skippers.pop();
      while (t.skippers.length < n) t.skippers.push(blank());
    } else if (t.numSkippers === '5+') {
      while (t.skippers.length < 5) t.skippers.push(blank());
    } else if (!t.skippers.length) {
      t.skippers.push(blank());
    }
    if (t.skippers.length > MAX_SKIPPERS) t.skippers.length = MAX_SKIPPERS;
    // More rows than the chosen number: the answer follows the rows.
    const len = t.skippers.length;
    if (t.numSkippers && len > Math.max(n, 0)) t.numSkippers = len >= 5 ? '5+' : String(len);
  }

  function missingCount(t, extra) {
    const wanted = Math.max(targetCount(t), 1);
    const done = (t.skippers || []).filter(s => isRowComplete(s, extra)).length;
    return Math.max(wanted - done, 0);
  }

  function selectHtml(field, value, opts, locked) {
    return `<select data-sk-field="${field}" ${locked ? 'disabled title="Details copied from a previously added skipper"' : ''}>
      <option value="" disabled ${value ? '' : 'selected'}>Select</option>
      ${opts.map(o => `<option value="${o}" ${value === o ? 'selected' : ''}>${o}</option>`).join('')}
    </select>`;
  }

  function render(mount, target, opts) {
    opts = opts || {};
    const extra = !!opts.extra;
    const notify = () => { if (opts.onChange) opts.onChange(); };
    syncRows(target);

    const poolFor = () => {
      const mine = new Set(target.skippers.map(s => (s.name || '').trim().toLowerCase()).filter(Boolean));
      const seen = new Set();
      const out = [];
      (opts.getTargets ? opts.getTargets() : []).forEach(t => (t.skippers || []).forEach(s => {
        const key = (s.name || '').trim().toLowerCase();
        if (!key || mine.has(key) || seen.has(key)) return;
        seen.add(key);
        out.push(s);
      }));
      return out;
    };

    const pickerOptions = () => {
      const pool = poolFor();
      return `<option value="" selected>${pool.length ? 'Select a skipper' : 'No previous skippers yet'}</option>` +
        pool.map((s, i) => `<option value="${i}">${esc(s.name)}</option>`).join('');
    };

    const header = `<div class="skipper-header-row sk-cols-${extra ? 'extra' : 'basic'}">
        <span>Skipper name</span><span>Date of birth</span><span>Date boat / PWC licence obtained</span>
        <span>Years owning a boat / PWC</span>
        ${extra ? '<span>Years owning a boat of this size and type</span><span>Previous boats owned, including length, type and ownership period</span>' : ''}
        <span></span></div>`;

    const today = new Date().toISOString().slice(0, 10);
    // A skipper copied from a previous vessel is locked, except "years owning a boat of this size and type".
    const rowHtml = (s, i) => {
      const lk = s.locked ? 'disabled title="Details copied from a previously added skipper"' : '';
      return `
      <div class="skipper-row sk-cols-${extra ? 'extra' : 'basic'}${s.locked ? ' sk-locked' : ''}" data-sk-index="${i}">
        <input type="text" placeholder="Full Name" data-sk-field="name" value="${esc(s.name)}" ${lk}>
        <input type="date" max="${today}" data-sk-field="dob" value="${esc(s.dob)}" ${lk}>
        <input type="date" max="${today}" data-sk-field="licenceDate" value="${esc(s.licenceDate)}" ${lk}>
        ${selectHtml('yearsOwning', s.yearsOwning, YEARS, !!s.locked)}
        ${extra ? selectHtml('yearsSizeType', s.yearsSizeType, YEARS) +
          `<textarea rows="2" placeholder="Example: 6m Runabout, 2020-2024" data-sk-field="previousBoats" ${lk}>${esc(s.previousBoats)}</textarea>` : ''}
        ${target.skippers.length > 1 ? `<button type="button" class="remove-row-btn" data-sk-remove="${i}" aria-label="Remove skipper">×</button>` : '<span></span>'}
      </div>`;
    };

    const countRow = (id, label, value) => `
      <div class="field-row">
        <p class="field-label">${label} <span class="required">*</span></p>
        <div class="field-input-wrap">
          <select data-sk-count="${id}">
            <option value="" disabled ${value ? '' : 'selected'}>Select</option>
            ${COUNT_OPTIONS.map(o => `<option value="${o}" ${value === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
      </div>`;

    mount.classList.add('sk-block');
    mount.innerHTML = `
      ${countRow('numOwners', 'How many people own this vessel?', target.numOwners)}
      ${countRow('numSkippers', 'How many people skipper this vessel?', target.numSkippers)}
      <p class="subsection-label">Skipper Details</p>
      <div class="skipper-table">
        ${opts.picker === false ? '' : `<div class="sk-pick-bar">
          <span class="sk-add-label">Choose a previously added skipper</span>
          <select class="sk-picker" data-sk-pick>${pickerOptions()}</select>
        </div>`}
        ${header}
        <div class="skipper-rows">${target.skippers.map(rowHtml).join('')}</div>
        <div class="sk-add-bar">
          <button type="button" class="add-row-btn" data-sk-new ${target.skippers.length >= MAX_SKIPPERS ? 'disabled' : ''}
            aria-label="Add a new skipper" title="Add a new skipper">+</button>
          <span class="sk-add-label">Add a new skipper</span>
        </div>
        <p class="sk-warning" data-sk-warning style="display:none;"></p>
      </div>`;

    const warn = () => {
      const el = mount.querySelector('[data-sk-warning]');
      const wanted = targetCount(target);
      const missing = missingCount(target, extra);
      if (wanted > 0 && missing > 0) {
        const done = wanted - missing;
        el.textContent = `You selected ${wanted} skipper${wanted > 1 ? 's' : ''} but ${done > 0 ? `only ${done} ${done > 1 ? 'have' : 'has'} complete details` : 'no skipper details are complete'}. ` +
          `Please complete the missing details, or continue if this vessel has fewer skippers.`;
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    };
    warn();

    const rerender = () => { render(mount, target, opts); notify(); };
    mount._sk = { target, opts, extra, rerender, notify, warn, poolFor, pickerOptions };
    if (mount._skBound) return;
    mount._skBound = true;

    mount.addEventListener('change', ev => {
      const { target: t, rerender: re, notify: nf } = mount._sk;
      const el = ev.target;
      if (el.dataset.skCount) {
        t[el.dataset.skCount] = el.value;
        if (el.dataset.skCount === 'numSkippers') { syncRows(t); re(); } else nf();
      } else if (el.matches('[data-sk-pick]')) {
        const c = mount._sk;
        const chosen = c.poolFor()[Number(el.value)];
        if (!chosen || t.skippers.length >= MAX_SKIPPERS) return;
        const row = {
          ...blank(),
          name: chosen.name, dob: chosen.dob, licenceDate: chosen.licenceDate,
          yearsOwning: chosen.yearsOwning || '',
          previousBoats: c.extra ? (chosen.previousBoats || '') : '',
          locked: true
          // yearsSizeType stays blank: it depends on the vessel chosen
        };
        const emptyIdx = t.skippers.findIndex(s => !Object.values(s).some(Boolean));
        if (emptyIdx >= 0) t.skippers[emptyIdx] = row; else t.skippers.push(row);
        t.numSkippers = t.skippers.length >= 5 ? '5+' : String(Math.max(t.skippers.length, targetCount(t)));
        re();
      }
    });

    const onField = ev => {
      const el = ev.target;
      const f = el.dataset.skField;
      if (!f) return;
      const c = mount._sk;
      c.target.skippers[Number(el.closest('[data-sk-index]').dataset.skIndex)][f] = el.value;
      c.warn();
      c.notify();
    };
    mount.addEventListener('input', onField);
    mount.addEventListener('change', onField);

    mount.addEventListener('click', ev => {
      const { target: t, rerender: re } = mount._sk;
      const rm = ev.target.closest('[data-sk-remove]');
      if (rm) {
        t.skippers.splice(Number(rm.dataset.skRemove), 1);
        t.numSkippers = t.skippers.length >= 5 ? '5+' : String(t.skippers.length);
        re();
        return;
      }
      if (ev.target.closest('[data-sk-new]') && t.skippers.length < MAX_SKIPPERS) {
        t.skippers.push(blank());
        t.numSkippers = t.skippers.length >= 5 ? '5+' : String(t.skippers.length);
        re();
      }
    });

    // Rebuild the previously-added list each time it is about to open.
    const refresh = ev => {
      const p = ev.target;
      if (p.matches && p.matches('[data-sk-pick]')) {
        const html = mount._sk.pickerOptions();
        if (p.innerHTML !== html) p.innerHTML = html;
      }
    };
    mount.addEventListener('mousedown', refresh);
    mount.addEventListener('focusin', refresh);
  }

  window.SkipperSection = {
    render,
    isComplete(target, extra) {
      return (target.skippers || []).some(s => isRowComplete(s, !!extra)) &&
        !!target.numOwners && !!target.numSkippers;
    },
    missing: (target, extra) => missingCount(target, !!extra),
    blank
  };
})();
