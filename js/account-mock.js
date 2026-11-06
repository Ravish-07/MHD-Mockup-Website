/* CUSTOMER LOGIN MOCKUP (front-end only, no real authentication).
   Everything here is simulated: the emailed code is always 123456 and "accounts" live in this
   browser's localStorage so the quote journey and the portal page can share them.

   window.CoastMock
     DEMO_CODE            the code every email "receives"
     getAccount(email)    -> { hasPassword, passwordHash, policies[] } or null
     saveAccount(email, patch)
     codeEntry({ mount, email, onVerified, onChangeEmail })   reusable 6-digit code box
     sha256(text)
     reset()              clears all mock accounts and the demo session

   TPCP quote journey (only runs when #additionalEmail and #continueBtn6 exist):
     - Your Details: a "Confirm Email" field; Payment stays locked until both entries match.
     - After payment: the login is created and the customer is signed in automatically (no code, no password).
       The account is "unverified" until its first emailed code in the portal, so a password cannot be used
       before then. An email that already has a verified account is never auto-signed-in.
*/
(function () {
  const DEMO_CODE = '123456';
  const STORE_KEY = 'coastMockAccounts';
  const SESSION_KEY = 'coastMockSession';
  const CODE_TTL_MS = 10 * 60 * 1000;
  const MAX_ATTEMPTS = 5;
  const RESEND_SECONDS = 30;
  const MIN_PASSWORD = 12;

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const normEmail = e => String(e || '').trim().toLowerCase();
  const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());

  // ---------- mock account store ----------
  function readStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  function writeStore(store) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* storage blocked: mock just forgets */ }
  }
  function getAccount(email) {
    return readStore()[normEmail(email)] || null;
  }
  function saveAccount(email, patch) {
    const store = readStore();
    const key = normEmail(email);
    store[key] = Object.assign({ hasPassword: false, passwordHash: '', policies: [] }, store[key], patch);
    writeStore(store);
    return store[key];
  }
  function addPolicy(email, policy) {
    const acct = getAccount(email) || { policies: [] };
    const policies = (acct.policies || []).filter(p => p.quoteNumber !== policy.quoteNumber);
    policies.push(policy);
    return saveAccount(email, { policies });
  }
  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function reset() {
    try { localStorage.removeItem(STORE_KEY); sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  // ---------- reusable 6-digit code box ----------
  function codeEntry({ mount, email, onVerified, onChangeEmail }) {
    let issuedAt = Date.now();
    let attempts = 0;
    let locked = false;
    let cooldown = RESEND_SECONDS;
    let timer = null;

    mount.innerHTML = `
      <div class="acct-code">
        <p class="acct-code-msg">We've sent a 6-digit code to <strong>${esc(email)}</strong>. It can take a minute to arrive.</p>
        <div class="acct-code-row">
          <input class="acct-code-input" type="text" inputmode="numeric" autocomplete="one-time-code"
                 maxlength="6" placeholder="6-digit code" aria-label="6-digit code">
          <button type="button" class="acct-btn acct-verify">Verify</button>
        </div>
        <p class="acct-status" role="status" aria-live="polite"></p>
        <div class="acct-code-links">
          <button type="button" class="acct-link acct-resend" disabled></button>
          <button type="button" class="acct-link acct-change">Change email</button>
        </div>
        <p class="acct-demo">Demo only: the code is ${DEMO_CODE}.</p>
      </div>`;

    const input = mount.querySelector('.acct-code-input');
    const verifyBtn = mount.querySelector('.acct-verify');
    const resendBtn = mount.querySelector('.acct-resend');
    const status = mount.querySelector('.acct-status');

    const say = (text, kind) => { status.textContent = text; status.className = 'acct-status' + (kind ? ' ' + kind : ''); };

    function paintResend() {
      resendBtn.disabled = cooldown > 0;
      resendBtn.textContent = cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code';
    }
    function startCooldown() {
      cooldown = RESEND_SECONDS;
      paintResend();
      clearInterval(timer);
      timer = setInterval(() => {
        if (!mount.isConnected || !mount.contains(resendBtn)) { clearInterval(timer); return; }
        cooldown = Math.max(0, cooldown - 1);
        paintResend();
        if (cooldown === 0) clearInterval(timer);
      }, 1000);
    }

    function verify() {
      const entered = input.value.replace(/\D/g, '');
      if (entered.length !== 6) { say('Enter the 6-digit code from the email.', 'error'); return; }
      if (locked) { say('Too many attempts. Please request a new code.', 'error'); return; }
      if (Date.now() - issuedAt > CODE_TTL_MS) { say('That code has expired. Please request a new one.', 'error'); return; }
      if (entered !== DEMO_CODE) {
        attempts++;
        if (attempts >= MAX_ATTEMPTS) {
          locked = true;
          say('Too many attempts. Please request a new code.', 'error');
        } else {
          say(`That code isn't right. ${MAX_ATTEMPTS - attempts} ${MAX_ATTEMPTS - attempts === 1 ? 'try' : 'tries'} left.`, 'error');
        }
        input.select();
        return;
      }
      clearInterval(timer);
      say('Verified', 'ok');
      onVerified();
    }

    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 6);
      if (input.value.length === 6) verify();
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); verify(); } });
    verifyBtn.addEventListener('click', verify);
    resendBtn.addEventListener('click', () => {
      if (cooldown > 0) return;
      issuedAt = Date.now();
      attempts = 0;
      locked = false;
      input.value = '';
      say('A new code has been sent.', 'ok');
      startCooldown();
      input.focus();
    });
    mount.querySelector('.acct-change').addEventListener('click', () => {
      clearInterval(timer);
      if (onChangeEmail) onChangeEmail();
    });

    startCooldown();
    return { focus: () => input.focus(), destroy: () => clearInterval(timer) };
  }

  window.CoastMock = { DEMO_CODE, MIN_PASSWORD, SESSION_KEY, esc, normEmail, validEmail, getAccount, saveAccount, addPolicy, sha256, reset, codeEntry };

  // =====================================================================
  // TPCP quote journey hooks
  // =====================================================================
  document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('additionalEmail');
    const paymentBtn = document.getElementById('continueBtn6');
    if (!emailInput || !paymentBtn) return;

    // ---------- Your Details: type the email twice ----------
    const emailField = emailInput.closest('.additional-field');
    const confirmField = document.createElement('div');
    confirmField.className = 'additional-field';
    confirmField.innerHTML = `
      <label for="additionalEmailConfirm">Confirm Email</label>
      <input type="email" id="additionalEmailConfirm" placeholder="Re-enter your email" autocomplete="off">
      <p class="acct-field-error" id="emailConfirmError" role="alert" style="display:none;">The email addresses don't match.</p>`;
    emailField.insertAdjacentElement('afterend', confirmField);
    const confirmInput = confirmField.querySelector('#additionalEmailConfirm');
    const confirmError = confirmField.querySelector('#emailConfirmError');

    const emailsMatch = () => validEmail(emailInput.value) && normEmail(emailInput.value) === normEmail(confirmInput.value);

    function paintMatch(showEmptyError) {
      const typed = confirmInput.value.trim() !== '';
      const bad = (typed || showEmptyError) && !emailsMatch();
      confirmInput.classList.toggle('field-invalid', bad);
      confirmError.style.display = bad ? '' : 'none';
      confirmError.textContent = !validEmail(emailInput.value) && !typed
        ? 'Please enter a valid email address.'
        : "The email addresses don't match.";
    }
    confirmInput.addEventListener('blur', () => paintMatch(false));
    confirmInput.addEventListener('input', () => { if (emailsMatch()) paintMatch(false); });
    emailInput.addEventListener('input', () => { if (confirmInput.value.trim() !== '') paintMatch(false); });

    // Payment stays locked until the two entries match (enforced even with validation bypassed).
    document.addEventListener('click', ev => {
      if (!ev.target.closest || !ev.target.closest('#continueBtn6')) return;
      if (emailsMatch()) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      paintMatch(true);
      (validEmail(emailInput.value) ? confirmInput : emailInput).focus();
      confirmField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, true);

    // ---------- After payment: policy belongs to the email, login is ready ----------
    const payNow = document.getElementById('payNowBtn');
    const grid = document.querySelector('#tp-step-9 .confirmation-grid');
    const banner = document.createElement('div');
    banner.className = 'acct-banner';
    banner.style.display = 'none';
    if (grid) grid.insertAdjacentElement('beforebegin', banner);

    const rowsOf = id => Array.from(document.querySelectorAll(`#${id} .details-row`)).reduce((o, r) => {
      o[r.querySelector('.details-label').textContent.trim()] = r.querySelector('.details-value').textContent.trim();
      return o;
    }, {});

    function goPortal(email, signIn) {
      try {
        if (signIn) sessionStorage.setItem(SESSION_KEY, normEmail(email));
        else sessionStorage.removeItem(SESSION_KEY);
      } catch (e) { /* ignore */ }
      window.location.href = 'portal.html';
    }

    payNow.addEventListener('click', () => {
      const email = emailInput.value.trim();
      if (!email) return;
      const note = document.getElementById('confirmationEmailNote');
      if (note) note.innerHTML = `Your policy is now in place, and your confirmation and policy documents have been emailed to <strong>${esc(email)}</strong>.`;

      const policy = rowsOf('policySummaryList');
      const pay = rowsOf('paymentSummaryList');
      // An address that already has a verified account must not be signed in (or reset) by a purchase:
      // someone could type another person's email. That customer proves it's them with a code instead.
      const existing = getAccount(email);
      const alreadyVerified = !!(existing && existing.verified);
      if (!existing) saveAccount(email, { verified: false });
      addPolicy(email, {
        name: policy['Policy'] || 'Third Party Only Pleasure Craft',
        quoteNumber: policy['Quote Number'] || '',
        insuredName: policy['Insured Name'] || '',
        period: policy['Period of Insurance'] || '',
        paymentMethod: pay['Payment Method'] || '',
        totalPaid: pay['Total Paid'] || ''
      });

      banner.style.display = '';
      if (alreadyVerified) {
        banner.innerHTML = `<div><strong>You already have a Coast login.</strong> Sign in with <strong>${esc(email)}</strong> to see this policy with your others.</div>
          <button type="button" class="acct-btn" id="acctGoPortal">Sign in</button>`;
        banner.querySelector('#acctGoPortal').addEventListener('click', () => goPortal(email, false));
      } else {
        banner.innerHTML = `<div><strong>Your login is ready.</strong> You're signed in as <strong>${esc(email)}</strong>. View your policy and documents any time.</div>
          <button type="button" class="acct-btn" id="acctGoPortal">View my policy</button>`;
        banner.querySelector('#acctGoPortal').addEventListener('click', () => goPortal(email, true));
      }
    });
  });
})();
