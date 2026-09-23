document.addEventListener('DOMContentLoaded', () => {

  // SHA-256 hash of your chosen password — see instructions below for how to generate this.
  // This is NOT real security, only obfuscation. See the note in chat.
  const CORRECT_HASH = '775f52fdde142217998ddaa50f41574bec9eea80c47fc706c401dd9f1f4c2931';

  const form = document.getElementById('loginForm');
  const input = document.getElementById('passwordInput');
  const error = document.getElementById('loginError');

  async function sha256(text) {
    const encoded = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const enteredHash = await sha256(input.value);

    if (enteredHash === CORRECT_HASH) {
      sessionStorage.setItem('coastAuthed', 'true');
      window.location.href = 'products.html';
    } else {
      error.style.display = 'block';
      input.value = '';
      input.focus();
    }
  });

});