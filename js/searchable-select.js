// Makes every dropdown on the page searchable. Clicking a <select> (or typing while it has focus) opens a
// panel with a search box instead of the browser's list. Matching is forgiving: start of text, anywhere in
// the text, small typos, then letters in order. The <select> stays the source of truth: choosing an option
// sets its value and fires the usual input/change events, so page code works unchanged.

(() => {
  const MAX_TYPOS_PER_LETTERS = 4; // allow one typo per this many typed letters
  const MIN_LETTERS_FOR_TYPOS = 3; // shorter searches would match almost everything

  const normalise = text => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  function editDistance(a, b) {
    let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const current = [i];
      for (let j = 1; j <= b.length; j++) {
        const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
        current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, substitution);
      }
      previous = current;
    }
    return previous[b.length];
  }

  function hasLettersInOrder(text, query) {
    let position = 0;
    for (const letter of query.replace(/ /g, '')) {
      position = text.indexOf(letter, position) + 1;
      if (position === 0) return false;
    }
    return true;
  }

  // Higher is better; 0 means the option does not match.
  function matchScore(label, query) {
    const text = normalise(label);
    const search = normalise(query);
    if (!search) return 1;
    if (text.startsWith(search)) return 5;
    if (text.split(' ').some(word => word.startsWith(search))) return 4;
    if (text.includes(search)) return 3;

    const allowedTypos = Math.max(1, Math.floor(search.length / MAX_TYPOS_PER_LETTERS));
    for (let start = 0; search.length >= MIN_LETTERS_FOR_TYPOS && start < text.length; start++) {
      if (start > 0 && text[start - 1] !== ' ') continue; // compare from the start of each word
      for (const length of [search.length - 1, search.length, search.length + 1]) {
        if (editDistance(text.slice(start, start + length), search) <= allowedTypos) return 2;
      }
    }

    return hasLettersInOrder(text, search) ? 1 : 0;
  }

  // ---------- Panel ----------

  const panel = document.createElement('div');
  panel.className = 'searchable-select-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <input type="text" class="searchable-select-search" placeholder="Type to search" autocomplete="off" aria-label="Search options">
    <ul class="searchable-select-list" role="listbox"></ul>
  `;
  const searchInput = panel.querySelector('.searchable-select-search');
  const list = panel.querySelector('.searchable-select-list');

  let activeSelect = null;
  let shownOptions = [];
  let highlighted = 0;

  function choosableOptions(select) {
    return Array.from(select.options).filter(option => !option.disabled && option.value !== '');
  }

  function renderList() {
    shownOptions = choosableOptions(activeSelect)
      .map((option, order) => ({ option, order, score: matchScore(option.textContent, searchInput.value) }))
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.order - b.order)
      .map(entry => entry.option);

    highlighted = Math.max(0, shownOptions.findIndex(option => option.value === activeSelect.value));
    if (searchInput.value) highlighted = 0;

    list.innerHTML = shownOptions.length
      ? shownOptions.map((option, index) => `
          <li role="option" data-index="${index}" class="${index === highlighted ? 'highlighted' : ''}${option.value === activeSelect.value ? ' selected' : ''}">${option.textContent.trim()}</li>
        `).join('')
      : '<li class="searchable-select-empty">No matches</li>';

    list.querySelector('.highlighted')?.scrollIntoView({ block: 'nearest' });
  }

  function positionPanel() {
    const box = activeSelect.getBoundingClientRect();
    panel.style.left = `${box.left}px`;
    panel.style.top = `${box.bottom + 4}px`;
    panel.style.width = `${Math.max(box.width, 220)}px`;
  }

  function open(select, initialText = '') {
    activeSelect = select;
    searchInput.value = initialText;
    panel.hidden = false;
    positionPanel();
    renderList();
    searchInput.focus();
  }

  function close({ refocus } = { refocus: true }) {
    if (!activeSelect) return;
    panel.hidden = true;
    if (refocus) activeSelect.focus();
    activeSelect = null;
  }

  function choose(option) {
    const select = activeSelect;
    close();
    if (!option || select.value === option.value) return;
    select.value = option.value;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function moveHighlight(step) {
    if (!shownOptions.length) return;
    highlighted = (highlighted + step + shownOptions.length) % shownOptions.length;
    list.querySelectorAll('li').forEach((item, index) => item.classList.toggle('highlighted', index === highlighted));
    list.querySelector('.highlighted')?.scrollIntoView({ block: 'nearest' });
  }

  searchInput.addEventListener('input', renderList);

  searchInput.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); moveHighlight(1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); moveHighlight(-1); }
    else if (event.key === 'Enter') { event.preventDefault(); choose(shownOptions[highlighted]); }
    else if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (event.key === 'Tab') close({ refocus: false });
  });

  // mousedown (not click) so the search box keeps focus until the choice is made
  list.addEventListener('mousedown', event => {
    event.preventDefault();
    const item = event.target.closest('li[data-index]');
    if (item) choose(shownOptions[Number(item.dataset.index)]);
  });

  // ---------- Opening from any dropdown ----------

  const isSearchable = element => element instanceof HTMLSelectElement && !element.disabled && !element.multiple;

  document.addEventListener('mousedown', event => {
    if (activeSelect && !panel.contains(event.target)) close({ refocus: false });
    if (!isSearchable(event.target)) return;
    event.preventDefault(); // stop the browser's own list
    event.target.focus();
    open(event.target);
  });

  document.addEventListener('keydown', event => {
    const select = event.target;
    if (!isSearchable(select) || activeSelect) return;

    const opensList = event.key === 'Enter' || event.key === ' ' || (event.altKey && event.key === 'ArrowDown');
    const typesLetter = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== ' ';
    if (!opensList && !typesLetter) return;

    event.preventDefault();
    open(select, typesLetter ? event.key : '');
  });

  window.addEventListener('resize', () => activeSelect && positionPanel());
  window.addEventListener('scroll', event => {
    if (activeSelect && !panel.contains(event.target)) positionPanel();
  }, true);

  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(panel));
})();
