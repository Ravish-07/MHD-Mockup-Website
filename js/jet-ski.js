if (sessionStorage.getItem('coastAuthed') !== 'true') {
  window.location.replace('index.html');
}


document.addEventListener('DOMContentLoaded', () => {

  const progressBar = document.getElementById('progressBar');
  let referralRequired = false;

const DEV_BYPASS_VALIDATION = true;

  const quoteState = {
    importantInfo: {},
    vesselDetails: {}
  };

  // ---------- STEP 2 (progress step 1): IMPORTANT INFO ----------
  const questions = [
    {
      id: 'q1',
      text: 'The Vessel(s) will be owned by the applicant/You for the duration of the policy.',
      type: 'toggle'
    },
    {
      id: 'q2',
      text: 'The Vessel(s) is not used for financial reward or registered as a commercial vessel.',
      type: 'toggle'
    },
    {
      id: 'q3',
      text: 'The Vessel(s) will not operate outside of Australian or New Zealand waters or the waters located between the two countries.',
      type: 'toggle'
    },
    {
      id: 'q4',
      text: 'The Vessel(s) will not be under construction (other than being refitted) at any time during the insurance period and the Vessel(s) has been launched.',
      type: 'toggle'
    },
    {
      id: 'q5',
      text: 'The Vessel(s) to be insured under this insurance is not registered or zoned as a building (for example, a floating office).',
      type: 'toggle'
    },
    {
      id: 'q6',
      text: 'The Vessel(s) is not used for permanent accommodation (agreement available upon request).',
      type: 'toggle'
    },
    {
      id: 'q7',
      text: 'The Vessel(s) is not used for Timeshare Arrangement / Syndicate / Equity Arrangement.',
      type: 'toggle'
    },
    {
      id: 'q8',
      text: 'The Vessel(s) is not be used for Holiday Rental / Air B&B Holiday Rental / Air B&B.',
      type: 'toggle'
    },
    {
      id: 'q9',
      text: 'The Vessel(s) is seaworthy.',
      type: 'toggle'
    },
    {
      id: 'q10',
      text: 'The Vessel(s) will not operate more than 50 nautical miles (92.6km) from mainland.',
      type: 'toggle'
    },
    {
      id: 'q11',
      text: 'What is the maximum capable speed of the Vessel(s)? Please answer in regards to the fastest Vessel if applying to insure more than one.',
      type: 'select',
      options: [
        'Up to 40 Knots / 75 kph',
        '40-60 Knots / 75-110 kph',
        'Over 60 Knots / 110 kph'
      ]
    }
  ];

  function renderQuestions() {
    const list = document.getElementById('questionList');

    list.innerHTML = questions.map(q => {

      if (q.type === 'select') {
        return `
          <div class="question-row" data-qid="${q.id}">
            <p class="question-text">${q.text}</p>

            <select class="question-select" data-qid="${q.id}">
              <option value="" disabled selected>Select</option>
              ${q.options.map(option =>
                `<option value="${option}">${option}</option>`
              ).join('')}
            </select>
          </div>
        `;
      }

      return `
        <div class="question-row" data-qid="${q.id}">
          <p class="question-text">${q.text}</p>

          <div class="question-toggle">
            <button type="button" class="toggle-btn" data-value="true">True</button>
            <button type="button" class="toggle-btn" data-value="false">False</button>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.question-row');
        const qid = row.dataset.qid;
        const value = btn.dataset.value;

        row.querySelectorAll('.toggle-btn').forEach(b => {
          b.classList.remove('selected');
        });

        btn.classList.add('selected');

        quoteState.importantInfo[qid] = value;


        checkStep2Complete();
      });
    });

    list.querySelectorAll('.question-select').forEach(select => {
      select.addEventListener('change', () => {

        const qid = select.dataset.qid;
        const value = select.value;

        quoteState.importantInfo[qid] = value;

        checkStep2Complete();
      });
    });
  }

  function checkStep2Complete() {
    if (DEV_BYPASS_VALIDATION) {
      document.getElementById('continueStep2Btn').disabled = false;
      return;
    }

    const answered = Object.keys(quoteState.importantInfo).length;
    document.getElementById('continueStep2Btn').disabled = answered < questions.length;
  }



function formatCurrencyInput(input) {
  const digits = input.value.replace(/\D/g, '');

  input.value = digits
    ? '$' + Number(digits).toLocaleString('en-AU')
    : '';
}

// ---------- STEP 3 (progress step 2): VESSEL DETAILS ----------

const vesselFields = [
  {
    id: 'hullMake',
    label: 'Hull Make',
    type: 'select',
    options: ['Honda', 'Kawasaki', 'Sea-Doo', 'Yamaha', 'Other'],
    specifyOnOther: true
  },
  {
    id: 'hullModel',
    label: 'Hull Model',
    type: 'text'
  },
  {
    id: 'hullYearBuilt',
    label: 'Hull Year Built',
    type: 'number',
    placeholder: 'YYYY'
  },
  {
    id: 'hullConstruction',
    label: 'Hull Construction',
    type: 'select',
    options: ['Fibreglass', 'NanoXcel', 'Polytec', 'Other'],
    specifyOnOther: true
  },
  {
    id: 'hullLength',
    label: 'Hull Length',
    type: 'length'
  },
  {
    id: 'motorMake',
    label: 'Motor Make',
    type: 'select',
    options: ['Honda', 'Kawasaki', 'Rotax', 'Yamaha', 'Other'],
    specifyOnOther: true
  },
  {
    id: 'equipmentOver2000',
    label: 'Do you have equipment valued at $2,000 or above to insure with the vessel?',
    type: 'select',
    options: ['No', 'Yes'],
    equipmentConditional: true
  },
  {
    id: 'purchaseDate',
    label: 'Purchase Date',
    type: 'date'
  },
  {
    id: 'purchasePrice',
    label: 'Purchase Price',
    type: 'number',
    placeholder: '$'
  },
  {
    id: 'totalSumInsured',
    label: 'Total Sum Insured',
    type: 'number',
    placeholder: '$'
  },
  {
    id: 'storageMethod',
    label: 'Storage Method',
    type: 'select',
    options: [
      'Garage',
      'Shed',
      'Behind Locked Gates',
      'Carport',
      'Driveway',
      'Roadside / Verge / Nature Strip',
      'Private Jetty - Floating Dock',
      'Private Jetty - In Water',
      'Marina Berth',
      'Other'
    ],
    specifyOnOther: true
  },
  {
    id: 'locationAddress',
    label: 'Location Address',
    type: 'text',
    placeholder: 'Start typing address...'
  }
];

function renderVesselFields() {
  const list = document.getElementById('vesselFieldList');

  list.innerHTML = vesselFields.map(f => {
    let inputHtml = '';

    if (f.id === 'locationAddress') {
      inputHtml = addressHtml(
        'locationAddress',
        quoteState.vesselDetails
      );
    }

    else if (f.type === 'length') {
      inputHtml = `
        <div class="length-input-group">
          <input
            type="number"
            id="hullLength"
            data-field="hullLength"
            min="0"
            step="0.01"
            inputmode="decimal"
            placeholder="0"
          >

          <select
            id="hullLengthUnit"
            data-field="hullLengthUnit"
            class="length-unit"
          >
            <option value="m" selected>m</option>
            <option value="ft">ft</option>
          </select>
        </div>
      `;
    }

    else if (f.type === 'select') {
      inputHtml = `
        <select id="${f.id}" data-field="${f.id}">
          <option value="" disabled selected>Select</option>
          ${f.options.map(option =>
            `<option value="${option}">${option}</option>`
          ).join('')}
        </select>
      `;
    }

    else {
      const isCurrency =
        f.id === 'purchasePrice' ||
        f.id === 'totalSumInsured';

      inputHtml = `
        <input
          type="${isCurrency ? 'text' : f.type}"
          id="${f.id}"
          data-field="${f.id}"
          ${isCurrency ? 'data-currency="true" inputmode="numeric"' : ''}
          placeholder="${isCurrency ? '$0' : (f.placeholder || '')}"
          ${f.id === 'hullYearBuilt' ? 'min="1900" max="9999" step="1"' : ''}
          ${f.type === 'number' && !isCurrency ? 'min="0"' : ''}
        >
      `;
    }

    let conditionalHtml = '';

    if (f.specifyOnOther) {
      conditionalHtml = `
        <div class="conditional-field" id="${f.id}SpecifyWrap" style="display:none;">
          <input
            type="text"
            id="${f.id}Specify"
            data-field="${f.id}Specify"
            placeholder="Please Specify"
          >
        </div>
      `;
    }

    if (f.equipmentConditional) {
      conditionalHtml = `
        <div class="conditional-field equipment-details"
             id="equipmentDetails"
             style="display:none;">

          <input
            type="text"
            id="equipmentDescription"
            data-field="equipmentDescription"
            placeholder="Item Description"
          >

          <input
            type="number"
            id="equipmentValue"
            data-field="equipmentValue"
            min="0"
            placeholder="Value ($)"
          >

        </div>
      `;
    }

    return `
      <div class="field-row" data-field-row="${f.id}">
        <p class="field-label">
          ${f.label}
        </p>

        <div class="field-input-wrap">
          ${inputHtml}
          ${conditionalHtml}
        </div>
      </div>
    `;
  }).join('');

  // m is the default measurement unit
  quoteState.vesselDetails.hullLengthUnit = 'm';

  list.querySelectorAll('input, select').forEach(el => {

    const saveValue = () => {
      if (!el.dataset.field) return;

      if (el.dataset.currency === 'true') {
        formatCurrencyInput(el);
      }

      quoteState.vesselDetails[el.dataset.field] = el.value;

      if (el.dataset.field === 'storageMethod') {
        referralRequired =
          el.value === 'Roadside / Verge / Nature Strip';
      }

      // Show "Please Specify" when Other is selected
      const fieldDefinition = vesselFields.find(
        f => f.id === el.dataset.field
      );

      if (fieldDefinition?.specifyOnOther) {
        const specifyWrap =
          document.getElementById(`${fieldDefinition.id}SpecifyWrap`);

        if (el.value === 'Other') {
          specifyWrap.style.display = 'block';
        } else {
          specifyWrap.style.display = 'none';
          quoteState.vesselDetails[`${fieldDefinition.id}Specify`] = '';
        }
      }

      // Show equipment description/value when Yes selected
      if (el.dataset.field === 'equipmentOver2000') {
        const equipmentDetails =
          document.getElementById('equipmentDetails');

        if (el.value === 'Yes') {
          equipmentDetails.style.display = 'flex';
        } else {
          equipmentDetails.style.display = 'none';
          quoteState.vesselDetails.equipmentDescription = '';
          quoteState.vesselDetails.equipmentValue = '';
        }
      }

      checkStep3Complete();
    };

    el.addEventListener('input', saveValue);
    el.addEventListener('change', saveValue);
  });

  bindAddress(
    list,
    quoteState.vesselDetails,
    'locationAddress',
    checkStep3Complete
  );
}

function checkStep3Complete() {

  if (DEV_BYPASS_VALIDATION) {
  document.getElementById('continueStep3Btn').disabled = false;
  return;
  }

  const requiredBaseFields = vesselFields.every(f => {
    const value = quoteState.vesselDetails[f.id];
    return value !== undefined && value !== '';
  });

  let conditionalFieldsComplete = true;

  // "Other" requires Please Specify
  vesselFields
    .filter(f => f.specifyOnOther)
    .forEach(f => {

      if (quoteState.vesselDetails[f.id] === 'Other') {
        const specified =
          quoteState.vesselDetails[`${f.id}Specify`];

        if (!specified || specified.trim() === '') {
          conditionalFieldsComplete = false;
        }
      }
    });

  // Equipment Yes requires Description + Value
  if (quoteState.vesselDetails.equipmentOver2000 === 'Yes') {
    if (
      !quoteState.vesselDetails.equipmentDescription ||
      !quoteState.vesselDetails.equipmentValue
    ) {
      conditionalFieldsComplete = false;
    }
  }

  document.getElementById('continueStep3Btn').disabled =
    !(requiredBaseFields && conditionalFieldsComplete);
}




// ---------- STEP 4 (progress step 3): EXPERIENCE & HISTORY ----------

const experienceFields = [
  { id: 'numOwners', label: 'How many people own this vessel?', type: 'select', options: ['1', '2', '3', '4', '5+'] },
  { id: 'numSkippers', label: 'How many people skipper this vessel?', type: 'select', options: ['1', '2', '3', '4', '5+'] }
];

const yearsOwningOptions = ['0', '1', '2', '3', '4', '5+'];

quoteState.experienceHistory = {
  numOwners: '',
  numSkippers: '',
  skippers: [],
  past5Years: {},
  claims: [],
  ever: {}
};

function renderExperienceFields() {
  const list = document.getElementById('experienceFieldList');
  list.innerHTML = experienceFields.map(f => `
    <div class="field-row" data-field-row="${f.id}">
      <p class="field-label">${f.label} <span class="required">*</span></p>
      <div class="field-input-wrap">
        <select id="${f.id}" data-field="${f.id}">
          <option value="" disabled selected>Select</option>
          ${f.options.map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('select').forEach(el => {
    el.addEventListener('change', () => {
      quoteState.experienceHistory[el.dataset.field] = el.value;
      checkStep4Complete();
    });
  });
}

let skipperRowCount = 0;

function addSkipperRow() {
  skipperRowCount++;
  const idx = skipperRowCount;
  const rows = document.getElementById('skipperRows');

  const row = document.createElement('div');
  row.className = 'skipper-row';
  row.dataset.rowId = idx;
  row.innerHTML = `
    <input type="text" placeholder="Full Name" data-skipper-field="name">
    <input type="date" data-skipper-field="dob">
    <input type="date" data-skipper-field="licenceDate">
    <select data-skipper-field="yearsOwning">
      <option value="" disabled selected>Select</option>
      ${yearsOwningOptions.map(o => `<option value="${o}">${o}</option>`).join('')}
    </select>
    ${skipperRowCount > 1 ? `<button type="button" class="remove-row-btn" data-remove-skipper="${idx}">×</button>` : `<span></span>`}
  `;

  rows.appendChild(row);

  row.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', updateSkippersState);
    el.addEventListener('change', updateSkippersState);
  });

  const removeBtn = row.querySelector('[data-remove-skipper]');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      row.remove();
      updateSkippersState();
    });
  }

  updateSkippersState();
}

function updateSkippersState() {
  const rows = document.querySelectorAll('#skipperRows .skipper-row');
  quoteState.experienceHistory.skippers = Array.from(rows).map(row => ({
    name: row.querySelector('[data-skipper-field="name"]').value,
    dob: row.querySelector('[data-skipper-field="dob"]').value,
    licenceDate: row.querySelector('[data-skipper-field="licenceDate"]').value,
    yearsOwning: row.querySelector('[data-skipper-field="yearsOwning"]').value
  }));
  checkStep4Complete();
}

document.getElementById('addSkipperBtn').addEventListener('click', addSkipperRow);

const past5YearsQuestions = [
  { id: 'cancelledRefused', text: 'Had any insurances cancelled, refused or had special conditions imposed?', details: true },
  { id: 'madeClaims', text: 'Made any boat / PWC insurance claims?' }
];

const everQuestions = [
  { id: 'chargedConvicted', text: 'Been charged or convicted with any offence?', details: true },
  { id: 'lostLicence', text: 'Lost your boat / PWC or motor vehicle licence?', details: true }
];

function renderYesNoList(containerId, questionsArr, stateKey) {
  const list = document.getElementById(containerId);
  list.innerHTML = questionsArr.map(q => `
    <div class="question-row" data-qid="${q.id}">
      <p class="question-text">${q.text}</p>
      <div class="question-toggle">
        <button type="button" class="toggle-btn" data-value="yes">Yes</button>
        <button type="button" class="toggle-btn" data-value="no">No</button>
      </div>
    </div>
    ${q.details ? `
      <div class="detail-row" data-detail-for="${q.id}" style="display:none;">
        <input type="text" data-detail="${q.id}" placeholder="Please Specify">
      </div>
    ` : ''}
  `).join('');

  list.querySelectorAll('[data-detail]').forEach(input => {
    input.addEventListener('input', () => {
      quoteState.experienceHistory[stateKey][`${input.dataset.detail}Details`] = input.value;
      checkStep4Complete();
    });
  });

  list.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.question-row');
      const qid = row.dataset.qid;
      const value = btn.dataset.value;

      row.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      quoteState.experienceHistory[stateKey][qid] = value;

      const detail = list.querySelector(`[data-detail-for="${qid}"]`);
      if (detail) {
        detail.style.display = value === 'yes' ? 'block' : 'none';
        if (value !== 'yes') {
          detail.querySelector('input').value = '';
          quoteState.experienceHistory[stateKey][`${qid}Details`] = '';
        }
      }

      if (stateKey === 'past5Years' && qid === 'madeClaims') {
        const claimsWrap = document.getElementById('claimsWrap');
        if (value === 'yes') {
          claimsWrap.style.display = 'block';
          if (document.querySelectorAll('#claimsRows .claims-row').length === 0) {
            addClaimRow();
          }
        } else {
          claimsWrap.style.display = 'none';
          document.getElementById('claimsRows').innerHTML = '';
          quoteState.experienceHistory.claims = [];
        }
      }

      checkStep4Complete();
    });
  });
}

let claimRowCount = 0;

function addClaimRow() {
  claimRowCount++;
  const idx = claimRowCount;
  const rows = document.getElementById('claimsRows');

  const row = document.createElement('div');
  row.className = 'claims-row';
  row.dataset.rowId = idx;
  row.innerHTML = `
    <input type="date" data-claim-field="dateOfLoss">
    <input type="text" placeholder="Description of Loss" data-claim-field="description">
    <input type="number" min="0" placeholder="$" data-claim-field="settlement">
    ${claimRowCount > 1 ? `<button type="button" class="remove-row-btn" data-remove-claim="${idx}">×</button>` : `<span></span>`}
  `;

  rows.appendChild(row);

  row.querySelectorAll('input').forEach(el => {
    el.addEventListener('input', updateClaimsState);
  });

  const removeBtn = row.querySelector('[data-remove-claim]');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      row.remove();
      updateClaimsState();
    });
  }

  updateClaimsState();
}

function updateClaimsState() {
  const rows = document.querySelectorAll('#claimsRows .claims-row');
  quoteState.experienceHistory.claims = Array.from(rows).map(row => ({
    dateOfLoss: row.querySelector('[data-claim-field="dateOfLoss"]').value,
    description: row.querySelector('[data-claim-field="description"]').value,
    settlement: row.querySelector('[data-claim-field="settlement"]').value
  }));
  checkStep4Complete();
}

document.getElementById('addClaimBtn').addEventListener('click', addClaimRow);

function checkStep4Complete() {

  if (DEV_BYPASS_VALIDATION) {
  document.getElementById('continueBtn4').disabled = false;
  return;
  }
  const eh = quoteState.experienceHistory;

  const topFieldsFilled = experienceFields.every(f => eh[f.id] !== '' && eh[f.id] !== undefined);

  const skippersFilled = eh.skippers.length > 0 && eh.skippers.every(s =>
    s.name && s.dob && s.licenceDate && s.yearsOwning
  );

  const past5YearsAnswered = past5YearsQuestions.every(q => eh.past5Years[q.id] !== undefined);
  const everAnswered = everQuestions.every(q => eh.ever[q.id] !== undefined);

  const detailsFilled = [['past5Years', past5YearsQuestions], ['ever', everQuestions]].every(([group, questionList]) =>
    questionList
      .filter(q => q.details && eh[group][q.id] === 'yes')
      .every(q => (eh[group][`${q.id}Details`] || '').trim() !== '')
  );

  let claimsValid = true;
  if (eh.past5Years.madeClaims === 'yes') {
    claimsValid = eh.claims.length > 0 && eh.claims.every(c =>
      c.dateOfLoss && c.description && c.settlement
    );
  }

  const complete = topFieldsFilled && skippersFilled && past5YearsAnswered && everAnswered && detailsFilled && claimsValid;
  document.getElementById('continueBtn4').disabled = !complete;
}

renderExperienceFields();
addSkipperRow();
renderYesNoList('past5YearsList', past5YearsQuestions, 'past5Years');
renderYesNoList('everList', everQuestions, 'ever');
checkStep4Complete();


// ---------- STEP 5 (progress step 4): ADDITIONAL JET SKI ----------

quoteState.additionalJetSkis = {
  hasAdditional: '',
  units: []
};

let additionalUnitCount = 0;


// ---------- YES / NO: ADDITIONAL JET SKI ----------

document.querySelectorAll('#hasAdditionalToggle .toggle-btn').forEach(btn => {

  btn.addEventListener('click', () => {

    document
      .querySelectorAll('#hasAdditionalToggle .toggle-btn')
      .forEach(b => b.classList.remove('selected'));

    btn.classList.add('selected');

    const value = btn.dataset.value;

    quoteState.additionalJetSkis.hasAdditional = value;

    const addBtn = document.getElementById('addJetSkiBtn');

    if (value === 'yes') {

      addBtn.style.display = 'inline-flex';

      const list = document.getElementById('additionalJetSkisList');

      if (list.children.length === 0) {
        addJetSkiUnit();
      }

    } else {

      addBtn.style.display = 'none';

      document.getElementById(
        'additionalJetSkisList'
      ).innerHTML = '';

      quoteState.additionalJetSkis.units = [];

      additionalUnitCount = 0;
    }

    checkStep5Complete();

  });

});


// ---------- ADD JET SKI ----------

function addJetSkiUnit() {

  additionalUnitCount++;

  const idx = additionalUnitCount;

  const list =
    document.getElementById('additionalJetSkisList');

  const card =
    document.createElement('div');

  card.className = 'unit-card';
  card.dataset.unitId = idx;


  // ---------- SAME FIELDS AS VESSEL DETAILS ----------

  const fieldsHtml = vesselFields.map(f => {

    let inputHtml = '';

    if (f.id === 'locationAddress') {
      inputHtml = `
        <div class="address-field" data-unit-address>
          <div class="address-lookup-wrap">
            <input
              type="text"
              data-unit-address-lookup
              autocomplete="off"
              placeholder="Start typing address..."
            >
          </div>

          <div
            class="address-manual"
            data-unit-address-manual
            style="display:none;"
          >
            <input
              type="text"
              data-unit-address-part="street"
              placeholder="Street address"
            >

            <input
              type="text"
              data-unit-address-part="suburb"
              placeholder="Suburb"
            >

            <select data-unit-address-part="state">
              <option value="" disabled selected>State</option>
              ${STATES.map(state =>
                `<option value="${state}">${state}</option>`
              ).join('')}
            </select>

            <input
              type="text"
              data-unit-address-part="postcode"
              inputmode="numeric"
              maxlength="4"
              placeholder="Postcode"
            >
          </div>

          <button
            type="button"
            class="link-btn"
            data-unit-address-toggle
          >
            Enter address manually
          </button>
        </div>
      `;
    }

    else if (f.type === 'length') {


      inputHtml = `
        <div class="length-input-group">

          <input
            type="number"
            min="0"
            step="0.01"
            inputmode="decimal"
            placeholder="0"
            data-unit-field="hullLength"
          >

          <select
            class="length-unit"
            data-unit-field="hullLengthUnit"
          >
            <option value="m" selected>m</option>
            <option value="ft">ft</option>
          </select>

        </div>
      `;

    }


    // SELECT

    else if (f.type === 'select') {

      inputHtml = `
        <select data-unit-field="${f.id}">

          <option value="" disabled selected>
            Select
          </option>

          ${f.options.map(option =>
            `<option value="${option}">${option}</option>`
          ).join('')}

        </select>
      `;

    }


    // NORMAL INPUT

    else {
      const isCurrency =
        f.id === 'purchasePrice' ||
        f.id === 'totalSumInsured';

      inputHtml = `
        <input
          type="${isCurrency ? 'text' : f.type}"
          data-unit-field="${f.id}"
          ${isCurrency ? 'data-currency="true" inputmode="numeric"' : ''}
          placeholder="${isCurrency ? '$0' : (f.placeholder || '')}"
          ${f.id === 'hullYearBuilt' ? 'min="1900" max="9999" step="1"' : ''}
          ${f.type === 'number' && !isCurrency ? 'min="0"' : ''}
        >
      `;
    }


    // ---------- OTHER: PLEASE SPECIFY ----------

    let conditionalHtml = '';

    if (f.specifyOnOther) {

      conditionalHtml = `
        <div
          class="conditional-field"
          data-specify-wrap="${f.id}"
          style="display:none;"
        >

          <input
            type="text"
            data-unit-field="${f.id}Specify"
            placeholder="Please Specify"
          >

        </div>
      `;

    }


    // ---------- EQUIPMENT DETAILS ----------

    if (f.equipmentConditional) {

      conditionalHtml = `
        <div
          class="conditional-field equipment-details"
          data-equipment-details
          style="display:none;"
        >

          <input
            type="text"
            data-unit-field="equipmentDescription"
            placeholder="Item Description"
          >

          <input
            type="number"
            min="0"
            data-unit-field="equipmentValue"
            placeholder="Value ($)"
          >

        </div>
      `;

    }


    return `
      <div class="field-row">

        <p class="field-label">
          ${f.label}
        </p>


        <div class="field-input-wrap">
          ${inputHtml}
          ${conditionalHtml}
        </div>

      </div>
    `;

  }).join('');


  // ---------- FULL JET SKI CARD ----------

  card.innerHTML = `

    <div class="unit-card-header">

      <span class="unit-card-title">
        Jet Ski #${idx + 1}
      </span>

      <button
        type="button"
        class="remove-row-btn"
        data-remove-unit="${idx}"
      >
        ×
      </button>

    </div>


    ${fieldsHtml}


    <!-- DIFFERENT SKIPPER -->

    <div class="additional-skipper-question">

      <span class="additional-skipper-question-text">
        Will this Jet Ski have a different skipper?
        <span class="required">*</span>
      </span>

      <div class="question-toggle">

        <button
          type="button"
          class="toggle-btn"
          data-different-skipper="yes"
        >
          Yes
        </button>

        <button
          type="button"
          class="toggle-btn"
          data-different-skipper="no"
        >
          No
        </button>

      </div>

    </div>


    <!-- ADDITIONAL SKIPPER DETAILS -->

    <div
      class="unit-skipper-section"
      data-unit-skipper-section
      style="display:none;"
    >

      <p class="subsection-label">
        Skipper Details
      </p>

      <div class="skipper-table">

        <div class="skipper-header-row">

          <span>Skipper name</span>

          <span>Date of birth</span>

          <span>
            Date boat / PWC licence obtained
          </span>

          <span>
            Number of years owning a boat / PWC
          </span>

          <span></span>

        </div>


        <div
          class="unit-skipper-rows"
          data-unit-skipper-rows
        ></div>


        <button
          type="button"
          class="add-row-btn"
          data-add-unit-skipper
        >
          +
        </button>

      </div>

    </div>
  `;


  list.appendChild(card);

const unitAddress = card.querySelector('[data-unit-address]');

if (unitAddress) {
  const lookup =
    unitAddress.querySelector('[data-unit-address-lookup]');

  const manual =
    unitAddress.querySelector('[data-unit-address-manual]');

  const toggle =
    unitAddress.querySelector('[data-unit-address-toggle]');

  const parts = {};

  const saveManualAddress = () => {
    unitAddress
      .querySelectorAll('[data-unit-address-part]')
      .forEach(field => {
        parts[field.dataset.unitAddressPart] =
          field.value;
      });

    card.dataset.locationAddress =
      composeAddress(parts);

    card.dataset.locationAddressPostcode =
      parts.postcode || '';

    updateAllUnitsState();
    checkStep5Complete();
  };

  lookup.addEventListener('input', () => {
    card.dataset.locationAddress = lookup.value;

    card.dataset.locationAddressPostcode =
      extractPostcode(lookup.value);

    updateAllUnitsState();
    checkStep5Complete();
  });

  unitAddress
    .querySelectorAll('[data-unit-address-part]')
    .forEach(field => {
      field.addEventListener('input', saveManualAddress);
      field.addEventListener('change', saveManualAddress);
    });

  toggle.addEventListener('click', () => {
    const enteringManually =
      manual.style.display === 'none';

    manual.style.display =
      enteringManually ? 'grid' : 'none';

    unitAddress
      .querySelector('.address-lookup-wrap')
      .style.display =
        enteringManually ? 'none' : '';

    toggle.textContent =
      enteringManually
        ? 'Search for an address instead'
        : 'Enter address manually';

    if (enteringManually) {
      saveManualAddress();
    } else {
      card.dataset.locationAddress = lookup.value;
      card.dataset.locationAddressPostcode =
        extractPostcode(lookup.value);

      updateAllUnitsState();
    }
  });
}
  // Default measurement unit

  const lengthUnit =
    card.querySelector(
      '[data-unit-field="hullLengthUnit"]'
    );

  if (lengthUnit) {
    lengthUnit.value = 'm';
  }


  // ---------- VESSEL FIELD LISTENERS ----------

  card
    .querySelectorAll('[data-unit-field]')
    .forEach(el => {

      const saveValue = () => {

        if (el.dataset.currency === 'true') {
          formatCurrencyInput(el);
        }

        const fieldName =
          el.dataset.unitField;


        // OTHER --> PLEASE SPECIFY

        const fieldDefinition =
          vesselFields.find(
            f => f.id === fieldName
          );

        if (
          fieldDefinition &&
          fieldDefinition.specifyOnOther
        ) {

          const specifyWrap =
            card.querySelector(
              `[data-specify-wrap="${fieldDefinition.id}"]`
            );

          if (specifyWrap) {

            if (el.value === 'Other') {

              specifyWrap.style.display = 'block';

            } else {

              specifyWrap.style.display = 'none';

              const specifyInput =
                specifyWrap.querySelector(
                  '[data-unit-field]'
                );

              if (specifyInput) {
                specifyInput.value = '';
              }

            }

          }

        }


        // EQUIPMENT --> DESCRIPTION + VALUE

        if (fieldName === 'equipmentOver2000') {

          const equipmentDetails =
            card.querySelector(
              '[data-equipment-details]'
            );

          if (equipmentDetails) {

            if (el.value === 'Yes') {

              equipmentDetails.style.display = 'flex';

            } else {

              equipmentDetails.style.display = 'none';

              equipmentDetails
                .querySelectorAll('input')
                .forEach(input => {
                  input.value = '';
                });

            }

          }

        }


        updateAllUnitsState();
        checkStep5Complete();

      };


      el.addEventListener('input', saveValue);
      el.addEventListener('change', saveValue);

    });


  // ---------- DIFFERENT SKIPPER YES / NO ----------

  card
    .querySelectorAll('[data-different-skipper]')
    .forEach(button => {

      button.addEventListener('click', () => {

        card
          .querySelectorAll('[data-different-skipper]')
          .forEach(b =>
            b.classList.remove('selected')
          );

        button.classList.add('selected');

        const value =
          button.dataset.differentSkipper;

        card.dataset.differentSkipper = value;

        const skipperSection =
          card.querySelector(
            '[data-unit-skipper-section]'
          );

        const skipperRows =
          card.querySelector(
            '[data-unit-skipper-rows]'
          );


        if (value === 'yes') {

          skipperSection.style.display = 'block';

          if (
            skipperRows.querySelectorAll(
              '.unit-skipper-row'
            ).length === 0
          ) {
            addUnitSkipperRow(card);
          }

        } else {

          skipperSection.style.display = 'none';
          skipperRows.innerHTML = '';

        }

        updateAllUnitsState();
        checkStep5Complete();

      });

    });


  // ---------- ADD SKIPPER ----------

  card
    .querySelector('[data-add-unit-skipper]')
    .addEventListener('click', () => {

      addUnitSkipperRow(card);

    });


  // ---------- REMOVE JET SKI ----------

  card
    .querySelector(
      `[data-remove-unit="${idx}"]`
    )
    .addEventListener('click', () => {

      card.remove();

      updateAllUnitsState();
      renumberUnitCards();
      checkStep5Complete();

    });


  updateAllUnitsState();
  checkStep5Complete();

}


// ---------- ADD SKIPPER TO SPECIFIC JET SKI ----------

function addUnitSkipperRow(card) {

  const rowsContainer =
    card.querySelector(
      '[data-unit-skipper-rows]'
    );

  const existingRows =
    rowsContainer.querySelectorAll(
      '.unit-skipper-row'
    );

  const row =
    document.createElement('div');

  row.className =
    'skipper-row unit-skipper-row';


  row.innerHTML = `

    <input
      type="text"
      placeholder="Full Name"
      data-unit-skipper-field="name"
    >

    <input
      type="date"
      data-unit-skipper-field="dob"
    >

    <input
      type="date"
      data-unit-skipper-field="licenceDate"
    >

    <select
      data-unit-skipper-field="yearsOwning"
    >

      <option value="" disabled selected>
        Select
      </option>

      ${yearsOwningOptions.map(option =>
        `<option value="${option}">${option}</option>`
      ).join('')}

    </select>

    ${
      existingRows.length > 0
        ? `
          <button
            type="button"
            class="remove-row-btn"
            data-remove-unit-skipper
          >
            ×
          </button>
        `
        : '<span></span>'
    }
  `;


  rowsContainer.appendChild(row);


  row
    .querySelectorAll('input, select')
    .forEach(el => {

      el.addEventListener('input', () => {
        updateAllUnitsState();
        checkStep5Complete();
      });

      el.addEventListener('change', () => {
        updateAllUnitsState();
        checkStep5Complete();
      });

    });


  const removeButton =
    row.querySelector(
      '[data-remove-unit-skipper]'
    );

  if (removeButton) {

    removeButton.addEventListener('click', () => {

      row.remove();

      updateAllUnitsState();
      checkStep5Complete();

    });

  }


  updateAllUnitsState();
  checkStep5Complete();

}


// ---------- SAVE ALL ADDITIONAL JET SKIS ----------

function updateAllUnitsState() {

  const cards =
    document.querySelectorAll(
      '#additionalJetSkisList .unit-card'
    );


  quoteState.additionalJetSkis.units =
    Array.from(cards).map(card => {

      const data = {
        hasDifferentSkipper:
          card.dataset.differentSkipper || '',

        locationAddress:
          card.dataset.locationAddress || '',

        locationAddressPostcode:
          card.dataset.locationAddressPostcode || '',

        skippers: []
      };


      // Vessel fields

      card
        .querySelectorAll('[data-unit-field]')
        .forEach(el => {

          data[el.dataset.unitField] =
            el.value;

        });


      // Skipper fields

      const skipperRows =
        card.querySelectorAll(
          '.unit-skipper-row'
        );


      data.skippers =
        Array.from(skipperRows).map(row => ({

          name:
            row.querySelector(
              '[data-unit-skipper-field="name"]'
            ).value,

          dob:
            row.querySelector(
              '[data-unit-skipper-field="dob"]'
            ).value,

          licenceDate:
            row.querySelector(
              '[data-unit-skipper-field="licenceDate"]'
            ).value,

          yearsOwning:
            row.querySelector(
              '[data-unit-skipper-field="yearsOwning"]'
            ).value

        }));


      return data;

    });

}


// ---------- RENUMBER JET SKIS ----------

function renumberUnitCards() {

  document
    .querySelectorAll(
      '#additionalJetSkisList .unit-card'
    )
    .forEach((card, i) => {

      card
        .querySelector('.unit-card-title')
        .textContent =
          `Jet Ski #${i + 2}`;

    });

}


// ---------- ADD ANOTHER JET SKI ----------

document
  .getElementById('addJetSkiBtn')
  .addEventListener('click', addJetSkiUnit);


// ---------- VALIDATION ----------

function checkStep5Complete() {

  if (DEV_BYPASS_VALIDATION) {

    document
      .getElementById('continueBtn5')
      .disabled = false;

    return;
  }


  const aj =
    quoteState.additionalJetSkis;


  // Must answer whether another Jet Ski exists

  if (
    aj.hasAdditional === '' ||
    aj.hasAdditional === undefined
  ) {

    document
      .getElementById('continueBtn5')
      .disabled = true;

    return;
  }


  // No additional Jet Ski

  if (aj.hasAdditional === 'no') {

    document
      .getElementById('continueBtn5')
      .disabled = false;

    return;
  }


  // Validate every additional Jet Ski

  const allUnitsValid =
    aj.units.length > 0 &&
    aj.units.every(unit => {


      // All original Vessel Details fields

      const vesselFieldsComplete =
        vesselFields.every(field => {

          const value =
            unit[field.id];

          if (
            value === undefined ||
            value === ''
          ) {
            return false;
          }


          // Other requires specification

          if (
            field.specifyOnOther &&
            value === 'Other'
          ) {

            const specified =
              unit[`${field.id}Specify`];

            if (
              !specified ||
              specified.trim() === ''
            ) {
              return false;
            }

          }


          return true;

        });


      if (!vesselFieldsComplete) {
        return false;
      }


      // Equipment requires description + value

      if (
        unit.equipmentOver2000 === 'Yes'
      ) {

        if (
          !unit.equipmentDescription ||
          !unit.equipmentValue
        ) {
          return false;
        }

      }


      // Different skipper question is mandatory

      if (
        !unit.hasDifferentSkipper
      ) {
        return false;
      }


      // If different skipper = Yes,
      // at least one complete skipper is required

      if (
        unit.hasDifferentSkipper === 'yes'
      ) {

        if (
          unit.skippers.length === 0
        ) {
          return false;
        }


        const skippersComplete =
          unit.skippers.every(skipper =>

            skipper.name &&
            skipper.dob &&
            skipper.licenceDate &&
            skipper.yearsOwning

          );


        if (!skippersComplete) {
          return false;
        }

      }


      return true;

    });


  document
    .getElementById('continueBtn5')
    .disabled = !allUnitsValid;

}


checkStep5Complete();

// ---------- YOUR QUOTE: VESSEL + SKIPPER SUMMARY ----------

function formatSummaryDate(value) {
  if (!value) return '';

  const [year, month, day] = value.split('-');

  return `${day}/${month}/${year}`;
}

function renderQuoteSummary() {

  const vesselSummaryList =
    document.getElementById('vesselSummaryList');

  const skipperSummaryList =
    document.getElementById('skipperSummaryList');


  // ---------- VESSELS ----------

  const vessels = [
    quoteState.vesselDetails,
    ...quoteState.additionalJetSkis.units
  ];

  vesselSummaryList.innerHTML = vessels.map((vessel, index) => {

    const hullMake =
      vessel.hullMake === 'Other'
        ? vessel.hullMakeSpecify
        : vessel.hullMake;

    return `
      <div class="summary-row">

        <span class="summary-label">
          Vessel ${index + 1}
        </span>

        <span class="summary-value summary-details">

          <span>
            <strong>Hull Year Built:</strong>
            ${vessel.hullYearBuilt || ''}
          </span>

          <span>
            <strong>Hull Make:</strong>
            ${hullMake || ''}
          </span>

          <span>
            <strong>Hull Model:</strong>
            ${vessel.hullModel || ''}
          </span>

          <span>
            <strong>Location Address:</strong>
            ${vessel.locationAddress || ''}
          </span>

          <span>
            <strong>Total Sum Insured:</strong>
            ${vessel.totalSumInsured || ''}
          </span>

          <span>
            <strong>Base Premium:</strong>
            $1,746.36
          </span>

          <span>
            <strong>GST:</strong>
            $174.64
          </span>

          <span>
            <strong>Stamp Duty:</strong>
            $172.89
          </span>

        </span>

      </div>
    `;

  }).join('');


  // ---------- SKIPPERS ----------

  const primarySkippers =
    quoteState.experienceHistory.skippers || [];

  const additionalSkippers =
    quoteState.additionalJetSkis.units.flatMap(unit =>
      unit.hasDifferentSkipper === 'yes'
        ? unit.skippers
        : []
    );

  const allSkippers = [
    ...primarySkippers,
    ...additionalSkippers
  ];

  skipperSummaryList.innerHTML = allSkippers.map((skipper, index) => `

    <div class="summary-row">

      <span class="summary-label">
        Skipper ${index + 1}
      </span>

      <span class="summary-value summary-details">

        <span>
          <strong>Name:</strong>
          ${skipper.name || ''}
        </span>

        <span>
          <strong>DOB:</strong>
          ${formatSummaryDate(skipper.dob)}
        </span>

      </span>

    </div>

  `).join('');
}

// ---------- STEP 6 (progress step 5): YOUR QUOTE ----------

quoteState.yourQuote = {
  quoteNumber: 'Q-PWC-260922-001',
  policyStartDate: '',
  policyEndDate: ''
};

function setDefaultPolicyDates() {
  const startInput = document.getElementById('policyStartDate');
  const endInput = document.getElementById('policyEndDate');

  if (!startInput || !endInput) return;

  const today = new Date();

  const oneYearOut = new Date(today);
  oneYearOut.setFullYear(today.getFullYear() + 1);

  const toInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  startInput.value = toInputValue(today);
  endInput.value = toInputValue(oneYearOut);

  quoteState.yourQuote.policyStartDate = startInput.value;
  quoteState.yourQuote.policyEndDate = endInput.value;
}

function updateQuoteDates() {
  const startInput = document.getElementById('policyStartDate');
  const endInput = document.getElementById('policyEndDate');

  quoteState.yourQuote.policyStartDate = startInput.value;
  quoteState.yourQuote.policyEndDate = endInput.value;
}

document
  .getElementById('policyStartDate')
  .addEventListener('change', updateQuoteDates);

document
  .getElementById('policyEndDate')
  .addEventListener('change', updateQuoteDates);

document
  .getElementById('addJetSkiFromQuoteBtn')
  .addEventListener('click', () => goToSection(5));

// ---------- EMAIL QUOTE MODAL ----------

const emailQuoteModal = document.getElementById('emailQuoteModal');
const closeEmailQuoteModal = document.getElementById('closeEmailQuoteModal');

function openQuoteModal() {

  const reviewName =
    document.getElementById('reviewInsuredName');

  const reviewEmail =
    document.getElementById('reviewEmail');

  const reviewPhone =
    document.getElementById('reviewPhone');

  const info = quoteState.additionalInformation;

  reviewName.value =
    info.insuredName ||
    `${info.firstName || ''} ${info.lastName || ''}`.trim();

  reviewEmail.value =
    info.email || '';

  reviewPhone.value =
    info.phone || '';

  emailQuoteModal.classList.add('active');
  emailQuoteModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeQuoteModal() {
  emailQuoteModal.classList.remove('active');
  emailQuoteModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

document.getElementById('emailQuoteBtn').addEventListener('click', openQuoteModal);

closeEmailQuoteModal.addEventListener('click', closeQuoteModal);

// Click outside modal to close
emailQuoteModal.addEventListener('click', (e) => {
  if (e.target === emailQuoteModal) {
    closeQuoteModal();
  }
});

// Escape key to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && emailQuoteModal.classList.contains('active')) {
    closeQuoteModal();
  }
});

setDefaultPolicyDates();

document.getElementById('submitQuoteReviewBtn').addEventListener('click', () => {
  window.location.href = 'products.html';
});



// ---------- STEPS 7-9: YOUR DETAILS, PAYMENT, CONFIRMATION (see quote-checkout.js) ----------

const checkout = setupCheckout({
  quoteState,
  bypassValidation: DEV_BYPASS_VALIDATION,
  policyName: 'Jet Ski / Personal Watercraft',
  paymentBaseAmount: 2148.89,
  getPolicyVessels: () => [
    quoteState.vesselDetails,
    ...(quoteState.additionalJetSkis.hasAdditional === 'yes' ? quoteState.additionalJetSkis.units : [])
  ],
  getQuoteNumber: () => quoteState.yourQuote.quoteNumber
});

function applyReferralQuoteState() {
  const quoteSection = document.getElementById('step-6');
  const premiumPanel = quoteSection.querySelector('.premium-panel');

  // Roadside / Verge storage refers the quote, on the main vessel or on any additional jet ski
  const additionalUnitReferral =
    quoteState.additionalJetSkis.hasAdditional === 'yes' &&
    quoteState.additionalJetSkis.units.some(
      unit => unit.storageMethod === 'Roadside / Verge / Nature Strip'
    );

  if (!referralRequired && !additionalUnitReferral) {
    return;
  }

  // Change every premium amount to $0.00
  premiumPanel.querySelectorAll('.premium-amount, .premium-line strong')
    .forEach(amount => {
      amount.textContent = '$0.00';
    });

  // Hide everything below the premium panel
  let element = premiumPanel.nextElementSibling;

  while (element) {
    element.style.display = 'none';
    element = element.nextElementSibling;
  }

  // Keep action buttons visible
  const quoteActions = quoteSection.querySelector('.quote-actions');

  if (quoteActions) {
    quoteActions.style.display = 'flex';
  }

  // Disable lifecycle actions
  const emailBtn = document.getElementById('emailQuoteBtn');
  const buyBtn = document.getElementById('continueBtn6');

  emailBtn.disabled = true;
  buyBtn.disabled = true;

  emailBtn.classList.add('referral-disabled');
  buyBtn.classList.add('referral-disabled');

  // Open referral popup
  const referralQuoteModal = document.getElementById('referralQuoteModal');

  referralQuoteModal.classList.add('active');
  referralQuoteModal.setAttribute('aria-hidden', 'false');

  document.body.classList.add('modal-open');
}


// ---------- DECLINE MODAL ----------

const declineModal = document.getElementById('declineModal');
const declineModalX = document.getElementById('declineModalX');
const declineCloseBtn = document.getElementById('declineCloseBtn');

function openDeclineModal() {
  progressBar.classList.add('declined');

  declineModal.classList.add('active');
  declineModal.setAttribute('aria-hidden', 'false');

  document.body.classList.add('modal-open');
}

function exitDeclinedQuote() {
  window.location.href = 'products.html';
}

declineModalX.addEventListener('click', exitDeclinedQuote);
declineCloseBtn.addEventListener('click', exitDeclinedQuote);

  // ---------- NAVIGATION ----------
  function goToSection(sectionNum) {
    if (sectionNum === 7) {
      checkout.showYourDetails();
    } else if (sectionNum === 8) {
      checkout.showPaymentPage();
    } else {
      showQuoteStep(sectionNum);

      if (sectionNum === 6) {
        renderQuoteSummary();
        applyReferralQuoteState();
      }
    }
  }

// ---------- CLICKABLE PROGRESS BAR ----------

enableProgressBarNavigation(DEV_BYPASS_VALIDATION, step => goToSection(step + 1));


  renderQuestions();
  checkStep2Complete();
  renderVesselFields();
  checkStep3Complete();

const dutyAgreement = document.getElementById('dutyAgreement');
const getStartedBtn = document.getElementById('getStartedBtn');

dutyAgreement.addEventListener('change', () => {
  getStartedBtn.disabled = !dutyAgreement.checked;
});


const referralQuoteModal = document.getElementById('referralQuoteModal');
const closeReferralQuoteModal = document.getElementById('closeReferralQuoteModal');

closeReferralQuoteModal.addEventListener('click', () => {
  referralQuoteModal.classList.remove('active');
  referralQuoteModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
});

document
  .getElementById('submitReferralReviewBtn')
  .addEventListener('click', () => {
    window.location.href = 'products.html';
  });

document.getElementById('getStartedBtn').addEventListener('click', () => goToSection(2));

document
  .getElementById('backBtn2')
  .addEventListener(
    'click',
    () => goToSection(1)
  );

document.getElementById('continueStep2Btn').addEventListener('click', () => {

  const ownershipDecline =
    quoteState.importantInfo.q1 === 'false';

  const speedDecline =
    quoteState.importantInfo.q11 === 'Over 60 Knots / 110 kph';

  if (ownershipDecline || speedDecline) {
    openDeclineModal();
    return;
  }

  goToSection(3);
});

document.getElementById('backBtn3').addEventListener('click', () => goToSection(2));
document.getElementById('continueStep3Btn').addEventListener('click', () => goToSection(4));

document.getElementById('backBtn4').addEventListener('click', () => goToSection(3));
document.getElementById('continueBtn4').addEventListener('click', () => goToSection(5));

document.getElementById('backBtn5').addEventListener('click', () => goToSection(4));
document.getElementById('continueBtn5').addEventListener('click', () => goToSection(6));

document.getElementById('backBtn6').addEventListener('click', () => goToSection(5));
document.getElementById('continueBtn6').addEventListener('click', () => goToSection(7));

document.getElementById('backBtn7').addEventListener('click', () => goToSection(6));


});
