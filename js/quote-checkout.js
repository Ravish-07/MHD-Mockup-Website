// Shared by the quote flows: the address field and step navigation (Jet Ski and Comprehensive Pleasure
// Craft), Your Details (step 7, same two flows) and Payment + Confirmation (steps 8 and 9, all three flows).

const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

const INTRO_SECTION = 1;
const CONFIRMATION_SECTION = 9;

// ---------- ADDRESS FIELD (lookup or manual entry) ----------

function extractPostcode(text) {
  const match = String(text || '').match(/\b\d{4}\b/);
  return match ? match[0] : '';
}

function composeAddress(parts) {
  return [parts.street, [parts.suburb, parts.state, parts.postcode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
}

function addressHtml(key, store, placeholder = 'Start typing address...') {
  const manual = !!store[`${key}Manual`];
  const parts = store[`${key}Parts`] || {};

  return `
    <div class="address-field" data-address="${key}">
      <div class="address-lookup-wrap" style="${manual ? 'display:none;' : ''}">
        <input
          type="text"
          data-addr-lookup
          autocomplete="off"
          placeholder="${placeholder}"
          value="${manual ? '' : (store[key] || '')}"
        >
      </div>

      <div class="address-manual" style="${manual ? '' : 'display:none;'}">
        <input type="text" data-addr-part="street" placeholder="Street address" value="${parts.street || ''}">
        <input type="text" data-addr-part="suburb" placeholder="Suburb" value="${parts.suburb || ''}">

        <select data-addr-part="state">
          <option value="" disabled ${parts.state ? '' : 'selected'}>State</option>
          ${STATES.map(state => `
            <option value="${state}" ${parts.state === state ? 'selected' : ''}>${state}</option>
          `).join('')}
        </select>

        <input
          type="text"
          data-addr-part="postcode"
          inputmode="numeric"
          maxlength="4"
          placeholder="Postcode"
          value="${parts.postcode || ''}"
        >
      </div>

      <button type="button" class="link-btn" data-addr-toggle>
        ${manual ? 'Search for an address instead' : 'Enter address manually'}
      </button>
    </div>
  `;
}

function bindAddress(container, store, key, onChange) {
  const wrapper = container.querySelector(`[data-address="${key}"]`);
  if (!wrapper) return;

  const lookup = wrapper.querySelector('[data-addr-lookup]');

  function storeManualAddress() {
    const parts = store[`${key}Parts`] || (store[`${key}Parts`] = {});
    store[key] = composeAddress(parts);
    store[`${key}Postcode`] = parts.postcode || '';
  }

  function storeLookupAddress() {
    store[key] = lookup.value;
    store[`${key}Postcode`] = extractPostcode(lookup.value);
  }

  lookup.addEventListener('input', () => {
    storeLookupAddress();
    if (onChange) onChange();
  });

  wrapper.querySelectorAll('[data-addr-part]').forEach(field => {
    const updateManualAddress = () => {
      const parts = store[`${key}Parts`] || (store[`${key}Parts`] = {});
      parts[field.dataset.addrPart] = field.value;
      storeManualAddress();
      if (onChange) onChange();
    };

    field.addEventListener('input', updateManualAddress);
    field.addEventListener('change', updateManualAddress);
  });

  wrapper.querySelector('[data-addr-toggle]').addEventListener('click', event => {
    const manual = !store[`${key}Manual`];
    store[`${key}Manual`] = manual;

    wrapper.querySelector('.address-lookup-wrap').style.display = manual ? 'none' : '';
    wrapper.querySelector('.address-manual').style.display = manual ? '' : 'none';
    event.currentTarget.textContent = manual ? 'Search for an address instead' : 'Enter address manually';

    if (manual) storeManualAddress();
    else storeLookupAddress();

    if (onChange) onChange();
  });
}

function formatQuoteDate(dateValue) {
  if (!dateValue) return 'Not provided';

  const [year, month, day] = dateValue.split('-');
  return `${day}/${month}/${year}`;
}

// ---------- STEP NAVIGATION ----------

function updateProgressBar(activeStep) {
  document.querySelectorAll('.progress-step').forEach(step => {
    const stepNumber = Number(step.dataset.step);
    step.classList.toggle('active', stepNumber === activeStep);
    step.classList.toggle('completed', stepNumber < activeStep);
  });
}

// Sections are numbered from the intro (step-1); the progress bar counts from the first form step.
function showQuoteStep(sectionNumber) {
  document.querySelectorAll('.quote-step').forEach(section => {
    section.style.display = 'none';
  });
  document.getElementById(`step-${sectionNumber}`).style.display = 'block';

  const showsProgress = sectionNumber !== INTRO_SECTION && sectionNumber !== CONFIRMATION_SECTION;
  document.getElementById('progressBar').style.display = showsProgress ? 'block' : 'none';
  if (showsProgress) updateProgressBar(sectionNumber - 1);

  window.scrollTo(0, 0);
}

function enableProgressBarNavigation(bypassValidation, showProgressStep) {
  const progressBar = document.getElementById('progressBar');

  progressBar.querySelectorAll('.progress-step').forEach(step => {
    step.style.cursor = 'pointer';

    step.addEventListener('click', () => {
      const targetStep = Number(step.dataset.step);
      const activeStep = Number(progressBar.querySelector('.progress-step.active')?.dataset.step || 1);

      if (bypassValidation || targetStep <= activeStep) showProgressStep(targetStep);
    });
  });
}

// ---------- CHECKOUT STEPS ----------

function setupCheckout({ quoteState, bypassValidation, policyName, paymentBaseAmount, getPolicyVessels, getQuoteNumber }) {
  const byId = id => document.getElementById(id);

  quoteState.additionalInformation = {
    firstName: '',
    lastName: '',
    insuredName: '',
    email: '',
    phone: '',
    residentialAddress: '',
    postalAddress: '',
    interestedParty: '',
    vessels: [],
    hasTrailer: '',
    trailers: [],
    attachments: []
  };

  const info = quoteState.additionalInformation;

  // ---------- YOUR DETAILS: CUSTOMER ----------

  const firstNameInput = byId('additionalFirstName');
  const lastNameInput = byId('additionalLastName');
  const insuredNameInput = byId('additionalInsuredName');
  const phoneInput = byId('additionalPhone');
  let insuredNameManuallyEdited = false;

  function replaceWithAddressField(input, key) {
    const host = input.parentElement;
    input.style.display = 'none';
    host.insertAdjacentHTML('beforeend', addressHtml(key, info));
    bindAddress(host, info, key, checkYourDetailsComplete);
  }

  replaceWithAddressField(byId('additionalResidentialAddress'), 'residentialAddress');
  replaceWithAddressField(byId('additionalPostalAddress'), 'postalAddress');

  // Insured Name follows First + Last Name until the user types their own.
  function updateAutomaticInsuredName() {
    if (insuredNameManuallyEdited) return;

    const fullName = `${firstNameInput.value.trim()} ${lastNameInput.value.trim()}`.trim().replace(/\s+/g, ' ');
    insuredNameInput.value = fullName;
    info.insuredName = fullName;
  }

  firstNameInput.addEventListener('input', () => {
    info.firstName = firstNameInput.value;
    updateAutomaticInsuredName();
    checkYourDetailsComplete();
  });

  lastNameInput.addEventListener('input', () => {
    info.lastName = lastNameInput.value;
    updateAutomaticInsuredName();
    checkYourDetailsComplete();
  });

  insuredNameInput.addEventListener('input', () => {
    insuredNameManuallyEdited = true;
    info.insuredName = insuredNameInput.value;
  });

  byId('additionalEmail').addEventListener('input', event => {
    info.email = event.target.value;
    checkYourDetailsComplete();
  });

  phoneInput.addEventListener('input', () => {
    phoneInput.value = phoneInput.value.replace(/[^\d\s+()-]/g, '');
    info.phone = phoneInput.value;
    checkYourDetailsComplete();
  });

  byId('additionalInterestedParty').addEventListener('input', event => {
    info.interestedParty = event.target.value;
  });

  // ---------- YOUR DETAILS: VESSEL IDENTIFICATION ----------

  const vesselDetailsContainer = byId('additionalVesselDetails');

  function vesselFieldHtml(label, field, attributes = 'type="text"') {
    return `
      <div class="additional-field">
        <label>${label}</label>
        <input ${attributes} data-additional-vessel-field="${field}">
      </div>
    `;
  }

  function renderVesselIdentification() {
    vesselDetailsContainer.innerHTML = getPolicyVessels().map((vessel, index) => `
      <div class="additional-vessel-card" data-vessel-index="${index}">
        <div class="additional-vessel-heading">Vessel ${index + 1}</div>

        <p class="subsection-label">Hull Details</p>
        <div class="additional-vessel-grid">
          ${vesselFieldHtml('Hull Name', 'hullName')}
          ${vesselFieldHtml('Hull Registration Number', 'hullRegistration')}
          ${vesselFieldHtml('Hull Identification Number (HIN)', 'hin')}
        </div>

        <p class="subsection-label">Motor Details</p>
        <div class="additional-vessel-grid">
          ${vesselFieldHtml('Motor Model', 'motorModel', `type="text" value="${vessel.motorMake || ''}"`)}
          ${vesselFieldHtml('Motor Year Built', 'motorYear', `type="number" min="1900" max="9999" placeholder="YYYY" value="${vessel.motorYear || ''}"`)}
          ${vesselFieldHtml('Motor Horsepower', 'motorHorsepower', 'type="number" min="0"')}
          ${vesselFieldHtml('Motor Serial Number', 'motorSerialNumber')}
        </div>
      </div>
    `).join('');

    vesselDetailsContainer.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', updateVesselIdentificationState);
    });

    updateVesselIdentificationState();
  }

  function updateVesselIdentificationState() {
    const cards = vesselDetailsContainer.querySelectorAll('.additional-vessel-card');

    info.vessels = Array.from(cards).map((card, index) => {
      const valueOf = field => card.querySelector(`[data-additional-vessel-field="${field}"]`)?.value || '';

      return {
        vesselNumber: index + 1,
        hullName: valueOf('hullName'),
        hullRegistration: valueOf('hullRegistration'),
        hin: valueOf('hin'),
        motorModel: valueOf('motorModel'),
        motorYear: valueOf('motorYear'),
        motorHorsepower: valueOf('motorHorsepower'),
        motorSerialNumber: valueOf('motorSerialNumber')
      };
    });
  }

  // ---------- YOUR DETAILS: TRAILERS ----------

  const hasTrailerSelect = byId('additionalHasTrailer');
  const trailerSection = byId('additionalTrailerSection');
  const trailerRows = byId('additionalTrailerRows');

  function addTrailerRow() {
    const row = document.createElement('div');
    row.className = 'additional-vessel-card additional-trailer-row';
    row.innerHTML = `
      <div class="additional-vessel-heading">Trailer ${trailerRows.children.length + 1}</div>

      <div class="additional-vessel-grid">
        <div class="additional-field">
          <label>Trailer Make &amp; Model</label>
          <input type="text" data-trailer-field="makeModel">
        </div>

        <div class="additional-field">
          <label>Trailer Year Built</label>
          <input type="number" min="1900" max="9999" placeholder="YYYY" data-trailer-field="year">
        </div>

        <div class="additional-field">
          <label>Trailer Registration Number</label>
          <input type="text" data-trailer-field="registration">
        </div>

        <button type="button" class="remove-row-btn" data-remove-trailer>×</button>
      </div>
    `;

    trailerRows.appendChild(row);

    row.querySelectorAll('input').forEach(input => input.addEventListener('input', updateTrailerState));
    row.querySelector('[data-remove-trailer]').addEventListener('click', () => {
      row.remove();
      renumberTrailerRows();
      updateTrailerState();
    });

    updateTrailerState();
  }

  function renumberTrailerRows() {
    trailerRows.querySelectorAll('.additional-trailer-row').forEach((row, index) => {
      row.querySelector('.additional-vessel-heading').textContent = `Trailer ${index + 1}`;
    });
  }

  function updateTrailerState() {
    info.trailers = Array.from(trailerRows.querySelectorAll('.additional-trailer-row')).map(row => ({
      makeModel: row.querySelector('[data-trailer-field="makeModel"]').value,
      year: row.querySelector('[data-trailer-field="year"]').value,
      registration: row.querySelector('[data-trailer-field="registration"]').value
    }));
  }

  hasTrailerSelect.addEventListener('change', () => {
    info.hasTrailer = hasTrailerSelect.value;

    if (info.hasTrailer === 'Yes') {
      trailerSection.style.display = 'block';
      if (trailerRows.children.length === 0) addTrailerRow();
    } else {
      trailerSection.style.display = 'none';
      trailerRows.innerHTML = '';
      info.trailers = [];
    }

    checkYourDetailsComplete();
  });

  byId('addAdditionalTrailerBtn').addEventListener('click', addTrailerRow);

  byId('additionalAttachments').addEventListener('change', event => {
    info.attachments = Array.from(event.target.files);
  });

  function checkYourDetailsComplete() {
    const continueButton = byId('continueBtn7');

    if (bypassValidation) {
      continueButton.disabled = false;
      return;
    }

    const customerComplete =
      info.firstName.trim() !== '' &&
      info.lastName.trim() !== '' &&
      info.email.trim() !== '' &&
      info.phone.trim() !== '' &&
      info.residentialAddress.trim() !== '';

    continueButton.disabled = !(customerComplete && info.hasTrailer !== '');
  }

  function showYourDetails() {
    renderVesselIdentification();
    showQuoteStep(7);
    checkYourDetailsComplete();
  }

  const { showPaymentPage } = setupPayment({
    quoteState,
    bypassValidation,
    policyName,
    getAmountDue: () => paymentBaseAmount,
    getQuoteNumber,
    showStep: showQuoteStep
  });

  byId('continueBtn7').addEventListener('click', showPaymentPage);
  byId('backBtn8').addEventListener('click', showYourDetails);

  return { showYourDetails, showPaymentPage };
}

// Payment (step 8) and Confirmation (step 9). showStep(sectionNumber) displays a step of the calling flow.
function setupPayment({ quoteState, bypassValidation, policyName, getAmountDue, getQuoteNumber, showStep }) {
  const byId = id => document.getElementById(id);

  quoteState.payment = {
    method: '',
    cardType: '',
    cardholderName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: ''
  };

  const payment = quoteState.payment;

  // ---------- PAYMENT ----------

  const paymentMethodSelection = byId('paymentMethodSelection');
  const paymentEntrySection = byId('paymentEntrySection');
  const continueToPaymentBtn = byId('continueToPaymentBtn');
  const payNowBtn = byId('payNowBtn');
  const cardTypeSelect = byId('paymentCardType');
  const cardNumberInput = byId('paymentCardNumber');
  const ccvInput = byId('paymentCCV');

  function showPaymentPage() {
    showStep(8);
    updatePaymentTotals();
    paymentMethodSelection.style.display = 'block';
    paymentEntrySection.style.display = 'none';
  }

  function returnToPaymentMethods() {
    paymentEntrySection.style.display = 'none';
    paymentMethodSelection.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.payment-method-option').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.payment-method-option').forEach(option => option.classList.remove('selected'));
      button.classList.add('selected');
      payment.method = button.dataset.paymentMethod;
      continueToPaymentBtn.disabled = false;
    });
  });

  continueToPaymentBtn.addEventListener('click', () => {
    if (!payment.method) return;

    paymentMethodSelection.style.display = 'none';
    paymentEntrySection.style.display = 'block';
    paymentEntrySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  byId('paymentEntryBackBtn').addEventListener('click', returnToPaymentMethods);
  byId('cancelPaymentBtn').addEventListener('click', returnToPaymentMethods);

  function getCardSurchargeRate() {
    if (payment.cardType === 'Visa') return 0.01;
    if (payment.cardType === 'Mastercard') return 0.01;
    if (payment.cardType === 'American Express') return 0.015;
    return 0;
  }

  function formatPaymentMoney(amount) {
    return Number(amount || 0).toLocaleString('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2
    });
  }

  function updatePaymentTotals() {
    payment.amountDue = getAmountDue();
    payment.surcharge = payment.amountDue * getCardSurchargeRate();
    payment.totalPaid = payment.amountDue + payment.surcharge;

    byId('paymentAmountDue').textContent = formatPaymentMoney(payment.amountDue);
    byId('paymentSurcharge').textContent = formatPaymentMoney(payment.surcharge);
    byId('paymentTotalPaid').textContent = formatPaymentMoney(payment.totalPaid);
  }

  function checkPaymentComplete() {
    if (bypassValidation) {
      payNowBtn.disabled = false;
      return;
    }

    payNowBtn.disabled = !(
      payment.cardType &&
      payment.cardholderName.trim() &&
      payment.cardNumber.length >= 15 &&
      payment.expiryMonth &&
      payment.expiryYear &&
      payment.ccv.length >= 3
    );
  }

  cardTypeSelect.addEventListener('change', () => {
    payment.cardType = cardTypeSelect.value;
    updatePaymentTotals();
    checkPaymentComplete();
  });

  byId('paymentCardholderName').addEventListener('input', event => {
    payment.cardholderName = event.target.value;
    checkPaymentComplete();
  });

  cardNumberInput.addEventListener('input', () => {
    const digits = cardNumberInput.value.replace(/\D/g, '').substring(0, 19);
    cardNumberInput.value = digits.replace(/(.{4})/g, '$1 ').trim();
    payment.cardNumber = digits;
    checkPaymentComplete();
  });

  byId('paymentExpiryMonth').addEventListener('change', event => {
    payment.expiryMonth = event.target.value;
    checkPaymentComplete();
  });

  byId('paymentExpiryYear').addEventListener('change', event => {
    payment.expiryYear = event.target.value;
    checkPaymentComplete();
  });

  ccvInput.addEventListener('input', () => {
    ccvInput.value = ccvInput.value.replace(/\D/g, '').substring(0, 4);
    payment.ccv = ccvInput.value;
    checkPaymentComplete();
  });

  // ---------- CONFIRMATION ----------

  function detailsRowsHtml(rows) {
    return rows.map(([label, value]) => `
      <div class="details-row">
        <span class="details-label">${label}</span>
        <span class="details-value">${value}</span>
      </div>
    `).join('');
  }

  function populatePaymentConfirmation() {
    const info = quoteState.additionalInformation;

    byId('confirmationEmailNote').textContent = info.email
      ? `Confirmation documents will be sent to ${info.email}.`
      : 'Your confirmation documents are ready.';

    const startDate = formatQuoteDate(byId('policyStartDate').value);
    const endDate = formatQuoteDate(byId('policyEndDate').value);

    byId('policySummaryList').innerHTML = detailsRowsHtml([
      ['Policy', policyName],
      ['Quote Number', getQuoteNumber()],
      ['Insured Name', info.insuredName || 'Not provided'],
      ['Period of Insurance', `${startDate} – ${endDate}`]
    ]);

    byId('paymentSummaryList').innerHTML = detailsRowsHtml([
      ['Payment Method', payment.cardType || 'Card'],
      ['Amount Due', formatPaymentMoney(payment.amountDue)],
      ['Card Surcharge', formatPaymentMoney(payment.surcharge)],
      ['Total Paid', formatPaymentMoney(payment.totalPaid)]
    ]);
  }

  function showConfirmationMessage(message) {
    const toast = byId('confirmationToast');
    toast.textContent = message;
    toast.style.display = 'block';

    clearTimeout(showConfirmationMessage.timeout);
    showConfirmationMessage.timeout = setTimeout(() => {
      toast.style.display = 'none';
    }, 4000);
  }

  payNowBtn.addEventListener('click', () => {
    updatePaymentTotals();
    populatePaymentConfirmation();
    showStep(CONFIRMATION_SECTION);
  });

  byId('homeBtn').addEventListener('click', () => {
    window.location.href = 'products.html';
  });
  byId('receiptBtn').addEventListener('click', () => {
    showConfirmationMessage('Your receipt has been emailed to you.');
  });
  byId('certificateBtn').addEventListener('click', () => {
    showConfirmationMessage('Your Certificate of Currency has been emailed to you.');
  });

  checkPaymentComplete();

  return { showPaymentPage };
}
