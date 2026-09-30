// Limits Hull Length inputs to 2 decimal places (shared by all products).
// Capture phase so the trimmed value is in place before any page handler reads it.
document.addEventListener('input', event => {
  const input = event.target;
  if (!input.matches || !input.matches('.length-input-group input[type="number"]')) return;

  const trimmed = input.value.replace(/^(-?\d*\.\d{2})\d+$/, '$1');
  if (trimmed !== input.value) input.value = trimmed;
}, true);

// On leaving the box, show the length to exactly 2 decimals (6 or 6.0 becomes 6.00).
document.addEventListener('focusout', event => {
  const input = event.target;
  if (!input.matches || !input.matches('.length-input-group input[type="number"]')) return;

  if (input.value === '' || !Number.isFinite(Number(input.value))) return;

  const formatted = Number(input.value).toFixed(2);
  if (formatted === input.value) return;

  input.value = formatted;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
});
