// Limits Hull Length inputs to 2 decimal places (shared by all products).
// Capture phase so the trimmed value is in place before any page handler reads it.
document.addEventListener('input', event => {
  const input = event.target;
  if (!input.matches || !input.matches('.length-input-group input[type="number"]')) return;

  const trimmed = input.value.replace(/^(-?\d*\.\d{2})\d+$/, '$1');
  if (trimmed !== input.value) input.value = trimmed;
}, true);
