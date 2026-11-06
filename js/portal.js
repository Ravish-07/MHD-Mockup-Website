/* Customer portal mockup. One email box for everyone:
     email -> 6-digit code (default) -> [optional: set a password] -> policies
   or, for the few who remember one:  email -> password.
   The screens are identical whether or not the email belongs to a customer; an unknown email
   simply gets an empty account once its code is verified. */
if (sessionStorage.getItem('coastAuthed') !== 'true') {
  window.location.replace('index.html');
}

document.addEventListener('DOMContentLoaded', () => {
  const { esc, normEmail, validEmail, getAccount, saveAccount, sha256, reset, codeEntry, SESSION_KEY, MIN_PASSWORD } = window.CoastMock;
  const card = document.getElementById('portalCard');
  let email = '';
  let box = null;

  const setSession = e => { try { sessionStorage.setItem(SESSION_KEY, normEmail(e)); } catch (x) { /* ignore */ } };
  const clearSession = () => { try { sessionStorage.removeItem(SESSION_KEY); } catch (x) { /* ignore */ } };

  function toast(text) {
    document.querySelectorAll('.portal-toast').forEach(t => t.remove());
    const t = document.createElement('div');
    t.className = 'portal-toast';
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  // ---------- 1. email ----------
  function showEmail(prefill) {
    if (box) { box.destroy(); box = null; }
    card.innerHTML = `
      <h1>Customer portal</h1>
      <p class="portal-sub">Enter your email address to view your policy and documents, or to get started with us.</p>
      <form id="emailForm" novalidate>
        <div class="acct-field">
          <label for="portalEmail">Email</label>
          <input id="portalEmail" type="email" autocomplete="email" placeholder="name@example.com" value="${esc(prefill || '')}">
        </div>
        <p class="portal-error" id="emailErr" style="display:none;">Please enter a valid email address.</p>
        <div class="portal-actions"><button type="submit" class="acct-btn">Continue</button></div>
      </form>`;
    const input = card.querySelector('#portalEmail');
    input.focus();
    card.querySelector('#emailForm').addEventListener('submit', e => {
      e.preventDefault();
      if (!validEmail(input.value)) { card.querySelector('#emailErr').style.display = ''; return; }
      email = input.value.trim();
      showCode();
    });
  }

  // ---------- 2. code (default for everyone) ----------
  function showCode() {
    card.innerHTML = `
      <h1>Check your email</h1>
      <p class="portal-sub">To keep your policy safe, we confirm it's you with a code sent to your email.</p>
      <div id="codeMount"></div>
      <div class="portal-alt"><button type="button" class="acct-link" id="usePassword">Use my password instead</button></div>`;
    box = codeEntry({
      mount: card.querySelector('#codeMount'),
      email,
      onVerified: afterVerified,
      onChangeEmail: () => showEmail(email)
    });
    box.focus();
    card.querySelector('#usePassword').addEventListener('click', () => { box.destroy(); showPassword(); });
  }

  // ---------- 2b. password (secondary) ----------
  function showPassword(errorText) {
    card.innerHTML = `
      <h1>Sign in with your password</h1>
      <p class="portal-sub">Signing in as <strong>${esc(email)}</strong>.</p>
      <form id="pwForm" novalidate>
        <div class="acct-field">
          <label for="portalPw">Password</label>
          <div class="acct-pw-wrap"><input id="portalPw" type="password" autocomplete="current-password"><button type="button" class="acct-show">Show</button></div>
        </div>
        <p class="portal-error" id="pwErr" style="${errorText ? '' : 'display:none;'}">${esc(errorText || '')}</p>
        <div class="portal-actions"><button type="submit" class="acct-btn">Sign in</button></div>
      </form>
      <div class="portal-alt">
        <button type="button" class="acct-link" id="useCode">Email me a code instead</button>
        <button type="button" class="acct-link" id="changeEmail">Change email</button>
      </div>`;
    const pw = card.querySelector('#portalPw');
    pw.focus();
    card.querySelector('.acct-show').addEventListener('click', e => {
      const show = pw.type === 'password';
      pw.type = show ? 'text' : 'password';
      e.currentTarget.textContent = show ? 'Hide' : 'Show';
    });
    card.querySelector('#useCode').addEventListener('click', showCode);
    card.querySelector('#changeEmail').addEventListener('click', () => showEmail(email));
    card.querySelector('#pwForm').addEventListener('submit', async e => {
      e.preventDefault();
      const acct = getAccount(email);
      const ok = acct && acct.hasPassword && acct.passwordHash === await sha256(pw.value);
      if (ok) { setSession(email); showDashboard(); return; }
      // Same message whether the email is unknown, has no password, or the password is wrong.
      showPassword("That email and password don't match. Try again, or use an emailed code instead.");
    });
  }

  // ---------- 3. after a verified code ----------
  function afterVerified() {
    if (!getAccount(email)) saveAccount(email, {});       // unknown email: empty account, no policies
    setSession(email);
    if (!getAccount(email).hasPassword) showSetPassword(); else showDashboard();
  }

  function showSetPassword() {
    card.innerHTML = `
      <h1>Set a password for next time</h1>
      <p class="portal-sub">Optional. With a password you can skip the emailed code when you sign in. You can always use a code instead.</p>
      <form id="setPwForm" novalidate>
        <div class="acct-field">
          <label for="newPw">Password</label>
          <div class="acct-pw-wrap"><input id="newPw" type="password" autocomplete="new-password"><button type="button" class="acct-show" data-target="newPw">Show</button></div>
        </div>
        <div class="acct-field">
          <label for="newPw2">Confirm password</label>
          <div class="acct-pw-wrap"><input id="newPw2" type="password" autocomplete="new-password"><button type="button" class="acct-show" data-target="newPw2">Show</button></div>
        </div>
        <ul class="acct-rules">
          <li data-rule="len">At least ${MIN_PASSWORD} characters</li>
          <li data-rule="match">Both passwords match</li>
        </ul>
        <div class="portal-actions">
          <button type="submit" class="acct-btn" id="savePw" disabled>Save password</button>
          <button type="button" class="acct-link" id="skipPw">Skip for now</button>
        </div>
      </form>`;
    const pw = card.querySelector('#newPw');
    const pw2 = card.querySelector('#newPw2');
    const save = card.querySelector('#savePw');
    const check = () => {
      const lenOk = pw.value.length >= MIN_PASSWORD;
      const matchOk = pw.value !== '' && pw.value === pw2.value;
      card.querySelector('[data-rule="len"]').classList.toggle('met', lenOk);
      card.querySelector('[data-rule="match"]').classList.toggle('met', matchOk);
      save.disabled = !(lenOk && matchOk);
    };
    pw.addEventListener('input', check);
    pw2.addEventListener('input', check);
    card.querySelectorAll('.acct-show').forEach(btn => btn.addEventListener('click', () => {
      const t = card.querySelector('#' + btn.dataset.target);
      const show = t.type === 'password';
      t.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
    }));
    pw.focus();
    card.querySelector('#skipPw').addEventListener('click', showDashboard);
    card.querySelector('#setPwForm').addEventListener('submit', async e => {
      e.preventDefault();
      if (save.disabled) return;
      saveAccount(email, { hasPassword: true, passwordHash: await sha256(pw.value) });
      toast('Password saved');
      showDashboard();
    });
  }

  // ---------- 4. dashboard ----------
  function showDashboard() {
    if (box) { box.destroy(); box = null; }
    const acct = getAccount(email) || { policies: [] };
    const policies = acct.policies || [];

    const policyHtml = p => `
      <div class="policy-card">
        <div class="policy-card-head"><h2>${esc(p.name)}</h2><span class="policy-status">Current</span></div>
        <div class="policy-rows">
          <div><span>Quote number</span>${esc(p.quoteNumber || '—')}</div>
          <div><span>Insured name</span>${esc(p.insuredName || '—')}</div>
          <div><span>Period of insurance</span>${esc(p.period || '—')}</div>
          <div><span>Total paid</span>${esc(p.totalPaid || '—')} ${p.paymentMethod ? '(' + esc(p.paymentMethod) + ')' : ''}</div>
        </div>
        <div class="policy-docs">
          <button type="button" class="acct-btn" data-doc="Policy documents">Policy documents</button>
          <button type="button" class="acct-btn secondary" data-doc="Certificate of Currency">Certificate of Currency</button>
          <button type="button" class="acct-btn secondary" data-doc="Receipt">Receipt</button>
        </div>
      </div>`;

    card.innerHTML = `
      <div class="portal-topbar">
        <div><h1>${policies.length ? 'Your policies' : 'Welcome'}</h1><p>Signed in as ${esc(email)}</p></div>
        <button type="button" class="acct-btn secondary" id="signOut">Sign out</button>
      </div>
      ${policies.length ? policies.map(policyHtml).join('') : `
        <div class="portal-empty">
          <p class="portal-sub">You don't have a policy with us yet. Get a quote in a few minutes and it will appear here.</p>
          <a class="acct-btn" href="products.html" style="display:inline-block;text-decoration:none;">Get a quote</a>
        </div>`}`;

    card.querySelectorAll('[data-doc]').forEach(b => b.addEventListener('click', () => toast(`${b.dataset.doc}: download started (demo)`)));
    card.querySelector('#signOut').addEventListener('click', () => { clearSession(); email = ''; showEmail(); });
  }

  document.getElementById('resetDemo').addEventListener('click', () => {
    reset();
    email = '';
    showEmail();
    toast('Demo data cleared');
  });

  // Arriving straight from the quote journey (login just created): already signed in.
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing && getAccount(existing)) { email = existing; showDashboard(); } else showEmail();
});
