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
     - Your Details: a code box appears under the email; Payment stays locked until it is verified.
     - After payment: a "Set up your login" popup (email locked, password + confirm).
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

    // ---------- Your Details: verify email ----------
    let verifiedEmail = '';       // the address that has been verified in this journey
    let codeSentTo = '';          // the address the visible code box was sent to
    let box = null;

    const phoneField = document.getElementById('additionalPhone').closest('.additional-field');
    const host = document.createElement('div');
    host.className = 'additional-field additional-field-full acct-verify-host';
    host.style.display = 'none';
    phoneField.insertAdjacentElement('afterend', host);

    const isVerified = () => !!verifiedEmail && normEmail(emailInput.value) === verifiedEmail;

    function showVerified() {
      host.style.display = '';
      host.className = 'additional-field additional-field-full acct-verify-host verified';
      host.innerHTML = `<div class="acct-verified"><span class="acct-tick">✓</span><span>Email verified: <strong>${esc(emailInput.value.trim())}</strong></span></div>`;
      emailInput.classList.remove('field-invalid');
    }

    function startVerification() {
      const email = emailInput.value.trim();
      host.style.display = '';
      host.className = 'additional-field additional-field-full acct-verify-host';
      host.innerHTML = '<p class="acct-verify-title">Verify your email</p><div class="acct-verify-mount"></div><p class="acct-gate-msg" style="display:none;">Please verify your email to continue.</p>';
      if (box) box.destroy();
      codeSentTo = normEmail(email);
      box = codeEntry({
        mount: host.querySelector('.acct-verify-mount'),
        email,
        onVerified: () => { verifiedEmail = normEmail(email); showVerified(); },
        onChangeEmail: () => { host.style.display = 'none'; emailInput.focus(); emailInput.select(); }
      });
    }

    // Send the code when the customer finishes typing the address (leaves the field or presses Enter).
    function syncVerification() {
      if (!validEmail(emailInput.value)) { host.style.display = 'none'; verifiedEmail = ''; codeSentTo = ''; return; }
      if (isVerified()) { if (!host.classList.contains('verified')) showVerified(); return; }
      verifiedEmail = '';
      if (codeSentTo !== normEmail(emailInput.value) || host.style.display === 'none') startVerification();
    }
    emailInput.addEventListener('change', syncVerification);
    emailInput.addEventListener('blur', syncVerification);
    emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); emailInput.blur(); } });
    // Editing the address invalidates any earlier check or code.
    emailInput.addEventListener('input', () => {
      if (normEmail(emailInput.value) !== (verifiedEmail || codeSentTo)) {
        verifiedEmail = '';
        codeSentTo = '';
        host.style.display = 'none';
      }
    });

    // Payment stays locked until the email is verified (enforced even with validation bypassed).
    document.addEventListener('click', ev => {
      if (!ev.target.closest || !ev.target.closest('#continueBtn6')) return;
      if (isVerified()) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      if (!validEmail(emailInput.value)) {
        emailInput.classList.add('field-invalid');
        emailInput.focus();
        return;
      }
      if (host.style.display === 'none') startVerification();
      const msg = host.querySelector('.acct-gate-msg');
      if (msg) msg.style.display = '';
      host.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const codeInput = host.querySelector('.acct-code-input');
      if (codeInput) codeInput.focus();
    }, true);

    // ---------- After payment: policy record, login banner and popup ----------
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

    function paintBanner(email) {
      const acct = getAccount(email);
      banner.style.display = '';
      if (acct && acct.hasPassword) {
        banner.innerHTML = `<div><strong>Your login is set up.</strong> View your policy and documents any time.</div>
          <button type="button" class="acct-btn" id="acctGoPortal">Go to my policy</button>`;
        banner.querySelector('#acctGoPortal').addEventListener('click', () => goPortal(email));
      } else {
        banner.innerHTML = `<div><strong>Set up your login</strong> to manage your policy and download your documents any time.</div>
          <button type="button" class="acct-btn" id="acctSetup">Set up login</button>`;
        banner.querySelector('#acctSetup').addEventListener('click', () => openPopup(email));
      }
    }

    function goPortal(email) {
      try { sessionStorage.setItem(SESSION_KEY, normEmail(email)); } catch (e) { /* ignore */ }
      window.location.href = 'portal.html';
    }

    payNow.addEventListener('click', () => {
      const email = (verifiedEmail || emailInput.value || '').trim();
      if (!email) return;
      const note = document.getElementById('confirmationEmailNote');
      if (note) note.innerHTML = `Your policy is now in place, and your confirmation and policy documents have been emailed to <strong>${esc(email)}</strong>.`;

      const policy = rowsOf('policySummaryList');
      const pay = rowsOf('paymentSummaryList');
      // The policy now belongs to this verified email, whether or not a password is ever set.
      saveAccount(email, {});
      addPolicy(email, {
        name: policy['Policy'] || 'Third Party Only Pleasure Craft',
        quoteNumber: policy['Quote Number'] || '',
        insuredName: policy['Insured Name'] || '',
        period: policy['Period of Insurance'] || '',
        paymentMethod: pay['Payment Method'] || '',
        totalPaid: pay['Total Paid'] || ''
      });

      paintBanner(email);
      setTimeout(() => { if (!(getAccount(email) || {}).hasPassword) openPopup(email); }, 700);
    });

    // ---------- Set-up popup ----------
    let overlay = null;
    function closePopup() {
      if (!overlay) return;
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    }

    function openPopup(email) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'acct-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(overlay);
        overlay.addEventListener('click', e => { if (e.target === overlay) closePopup(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(); });
      }

      overlay.innerHTML = `
        <div class="acct-modal" role="dialog" aria-modal="true" aria-labelledby="acctModalTitle">
          <button type="button" class="acct-modal-x" aria-label="Close">×</button>
          <h2 id="acctModalTitle">Set up your login</h2>
          <p class="acct-modal-sub">Your policy is in place. Create a password so you can view it and download your documents any time.</p>
          <div class="acct-field">
            <label for="acctEmail">Email</label>
            <div class="acct-email-locked"><input id="acctEmail" type="email" value="${esc(email)}" readonly><span class="acct-chip">✓ Verified</span></div>
          </div>
          <div class="acct-field">
            <label for="acctPw">Password</label>
            <div class="acct-pw-wrap"><input id="acctPw" type="password" autocomplete="new-password"><button type="button" class="acct-show" data-target="acctPw">Show</button></div>
          </div>
          <div class="acct-field">
            <label for="acctPw2">Confirm password</label>
            <div class="acct-pw-wrap"><input id="acctPw2" type="password" autocomplete="new-password"><button type="button" class="acct-show" data-target="acctPw2">Show</button></div>
          </div>
          <ul class="acct-rules">
            <li data-rule="len">At least ${MIN_PASSWORD} characters</li>
            <li data-rule="match">Both passwords match</li>
          </ul>
          <div class="acct-modal-actions">
            <button type="button" class="acct-btn" id="acctCreate" disabled>Create login</button>
            <button type="button" class="acct-link" id="acctSkip">Not now</button>
          </div>
          <p class="acct-modal-foot">You can always sign in later with a code emailed to you, no password needed.</p>
        </div>`;

      const pw = overlay.querySelector('#acctPw');
      const pw2 = overlay.querySelector('#acctPw2');
      const create = overlay.querySelector('#acctCreate');
      const ruleLen = overlay.querySelector('[data-rule="len"]');
      const ruleMatch = overlay.querySelector('[data-rule="match"]');

      function check() {
        const lenOk = pw.value.length >= MIN_PASSWORD;
        const matchOk = pw.value !== '' && pw.value === pw2.value;
        ruleLen.classList.toggle('met', lenOk);
        ruleMatch.classList.toggle('met', matchOk);
        create.disabled = !(lenOk && matchOk);
      }
      pw.addEventListener('input', check);
      pw2.addEventListener('input', check);
      [pw, pw2].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter' && !create.disabled) create.click(); }));

      overlay.querySelectorAll('.acct-show').forEach(btn => btn.addEventListener('click', () => {
        const target = overlay.querySelector('#' + btn.dataset.target);
        const show = target.type === 'password';
        target.type = show ? 'text' : 'password';
        btn.textContent = show ? 'Hide' : 'Show';
      }));

      overlay.querySelector('.acct-modal-x').addEventListener('click', closePopup);
      overlay.querySelector('#acctSkip').addEventListener('click', closePopup);

      create.addEventListener('click', async () => {
        const hash = await sha256(pw.value);
        saveAccount(email, { hasPassword: true, passwordHash: hash });
        overlay.querySelector('.acct-modal').innerHTML = `
          <div class="acct-done">
            <div class="acct-done-tick">✓</div>
            <h2>Your login is ready</h2>
            <p class="acct-modal-sub">Sign in any time with <strong>${esc(email)}</strong> to see your policy and download your documents.</p>
            <div class="acct-modal-actions center">
              <button type="button" class="acct-btn" id="acctOpenPortal">Go to my policy</button>
              <button type="button" class="acct-link" id="acctStay">Stay on this page</button>
            </div>
          </div>`;
        overlay.querySelector('#acctOpenPortal').addEventListener('click', () => goPortal(email));
        overlay.querySelector('#acctStay').addEventListener('click', () => { closePopup(); paintBanner(email); });
      });

      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      pw.focus();
    }
  });
})();
