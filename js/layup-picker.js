// CPWC Lay-Up Period: one text box (MM/YYYY – MM/YYYY) with a calendar popup.
// Pick two months in the popup (the earlier becomes From, the later To) or type the range in.
// Writes layUpFrom / layUpTo ("YYYY-MM"), layUpMonths and layUpInvalid to the store it is given.

const LAY_UP_MIN_YEAR = 2000; // any month and any length is allowed; this only guards against typos
const LAY_UP_MAX_YEAR = 2100;
const LAY_UP_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const layUpPad = number => String(number).padStart(2, '0');
const layUpIndex = ({ year, month }) => year * 12 + (month - 1);
const layUpKey = ({ year, month }) => `${year}-${layUpPad(month)}`;
const layUpLabel = ({ year, month }) => `${layUpPad(month)}/${year}`;

function layUpCurrentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

// Returns an error message, or '' when from..to is acceptable.
function layUpRangeError(from, to) {
  if (layUpIndex(to) < layUpIndex(from)) return 'The end month cannot be before the start month.';
  return '';
}

// Returns { from, to } or { error }. Blank text is valid (no lay-up).
function parseLayUpText(text) {
  const trimmed = text.trim();
  if (!trimmed) return { empty: true };

  const match = trimmed.match(/^(\d{1,2})\s*\/\s*(\d{4})\s*[-–—]\s*(\d{1,2})\s*\/\s*(\d{4})$/);
  if (!match) return { error: 'Enter the period as MM/YYYY – MM/YYYY, for example 12/2026 – 01/2027.' };

  const from = { month: Number(match[1]), year: Number(match[2]) };
  const to = { month: Number(match[3]), year: Number(match[4]) };

  if (from.month < 1 || from.month > 12 || to.month < 1 || to.month > 12) return { error: 'Months must be between 01 and 12.' };

  if (from.year < LAY_UP_MIN_YEAR || to.year > LAY_UP_MAX_YEAR) return { error: `Years must be between ${LAY_UP_MIN_YEAR} and ${LAY_UP_MAX_YEAR}.` };

  const error = layUpRangeError(from, to);
  return error ? { error } : { from, to };
}

function initLayUpPicker(picker, store, onChange) {
  const text = picker.querySelector('.layup-text');
  const calendarButton = picker.querySelector('.layup-cal-btn');
  const popup = picker.querySelector('.layup-popup');
  const yearLabel = picker.querySelector('.layup-year');
  const previousYear = picker.querySelector('.layup-year-prev');
  const nextYear = picker.querySelector('.layup-year-next');
  const monthGrid = picker.querySelector('.layup-months');
  const message = picker.querySelector('.layup-error');

  const current = layUpCurrentMonth();
  const minYear = LAY_UP_MIN_YEAR;
  const maxYear = LAY_UP_MAX_YEAR;

  let viewYear = current.year;
  let firstPick = null; // first month clicked in the popup, waiting for the second

  function showError(errorText) {
    message.textContent = errorText;
    message.hidden = !errorText;
    text.classList.toggle('invalid', Boolean(errorText));
  }

  function commit(from, to) {
    store.layUpFrom = from ? layUpKey(from) : '';
    store.layUpTo = to ? layUpKey(to) : '';
    store.layUpMonths = from && to ? String(layUpIndex(to) - layUpIndex(from) + 1) : '';
    onChange();
  }

  function stored() {
    const match = /^(\d{4})-(\d{2})$/.exec(store.layUpFrom || '');
    const matchTo = /^(\d{4})-(\d{2})$/.exec(store.layUpTo || '');
    return match && matchTo
      ? { from: { year: Number(match[1]), month: Number(match[2]) }, to: { year: Number(matchTo[1]), month: Number(matchTo[2]) } }
      : null;
  }

  function renderPopup() {
    yearLabel.textContent = viewYear;
    previousYear.disabled = viewYear <= minYear;
    nextYear.disabled = viewYear >= maxYear;

    const range = stored();
    const rangeStart = firstPick ? firstPick : range && range.from;
    const rangeEnd = firstPick ? firstPick : range && range.to;

    monthGrid.innerHTML = LAY_UP_MONTH_NAMES.map((name, index) => {
      const month = index + 1;
      const value = layUpIndex({ year: viewYear, month });
      const selected = rangeStart && (value === layUpIndex(rangeStart) || value === layUpIndex(rangeEnd));
      const inRange = rangeStart && !firstPick && value > layUpIndex(rangeStart) && value < layUpIndex(rangeEnd);

      return `
        <button
          type="button"
          class="layup-month${selected ? ' selected' : ''}${inRange ? ' in-range' : ''}"
          data-month="${month}"
          aria-pressed="${selected ? 'true' : 'false'}"
        >
          <strong>${layUpPad(month)}</strong><small>${name}</small>
        </button>
      `;
    }).join('');
  }

  function openPopup() {
    const range = stored();
    viewYear = range ? range.from.year : current.year;
    firstPick = null;
    showError('');
    renderPopup();
    popup.hidden = false;
    calendarButton.setAttribute('aria-expanded', 'true');
  }

  function closePopup() {
    popup.hidden = true;
    firstPick = null;
    calendarButton.setAttribute('aria-expanded', 'false');
  }

  function pickMonth(month) {
    const picked = { year: viewYear, month };

    if (!firstPick) {
      firstPick = picked;
      renderPopup();
      return;
    }

    const [from, to] = layUpIndex(picked) < layUpIndex(firstPick) ? [picked, firstPick] : [firstPick, picked];

    text.value = `${layUpLabel(from)} – ${layUpLabel(to)}`;
    store.layUpInvalid = false;
    showError('');
    commit(from, to);
    closePopup();
    calendarButton.focus();
  }

  // ----- typed entry -----

  function readText({ report }) {
    const result = parseLayUpText(text.value);

    if (result.empty) {
      store.layUpInvalid = false;
      showError('');
      commit(null, null);
      return;
    }

    if (result.error) {
      store.layUpInvalid = true;
      if (report) showError(result.error);
      commit(null, null);
      return;
    }

    store.layUpInvalid = false;
    showError('');
    commit(result.from, result.to);

    if (report) text.value = `${layUpLabel(result.from)} – ${layUpLabel(result.to)}`;
  }

  text.addEventListener('input', () => readText({ report: false }));
  text.addEventListener('blur', () => readText({ report: true }));
  text.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      readText({ report: true });
    }
  });

  // ----- popup -----

  calendarButton.addEventListener('click', () => (popup.hidden ? openPopup() : closePopup()));

  previousYear.addEventListener('click', () => { viewYear = Math.max(minYear, viewYear - 1); renderPopup(); });
  nextYear.addEventListener('click', () => { viewYear = Math.min(maxYear, viewYear + 1); renderPopup(); });

  monthGrid.addEventListener('click', event => {
    const button = event.target.closest('.layup-month');
    if (button && !button.disabled) pickMonth(Number(button.dataset.month));
  });

  document.addEventListener('click', event => {
    // composedPath: the clicked month button may already be re-rendered away when this runs
    if (!popup.hidden && !event.composedPath().includes(picker)) closePopup();
  });

  picker.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !popup.hidden) {
      closePopup();
      calendarButton.focus();
    }
  });
}
