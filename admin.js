/**
 * MedSage Clinic — Admin Management Portal Logic
 * Handles Admin Authentication, Appointments, Patient Dossier & Full Medical History
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── State ──
  let currentAdmin = null;
  let appointments = [];
  let patients = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let activeDossierPatient = null;

  // ── Elements ──
  const loginOverlay        = document.getElementById('adminLoginOverlay');
  const loginForm           = document.getElementById('adminLoginForm');
  const appLayout           = document.getElementById('adminAppLayout');
  const adminLogoutBtn      = document.getElementById('adminLogoutBtn');

  // Stats Elements
  const statTotalAppts      = document.getElementById('statTotalAppointments');
  const statPendingAppts    = document.getElementById('statPendingAppointments');
  const statTotalPatients   = document.getElementById('statTotalPatients');
  const statTotalCheckups   = document.getElementById('statTotalCheckups');
  const badgePendingCount   = document.getElementById('badgePendingCount');

  // Table Bodies
  const overviewTbody       = document.getElementById('overviewAppointmentsTbody');
  const appointmentsTbody   = document.getElementById('appointmentsListTbody');
  const patientsTbody       = document.getElementById('patientsListTbody');

  // Search & Filter
  const apptSearchInput     = document.getElementById('appointmentSearchInput');
  const patientSearchInput  = document.getElementById('patientSearchInput');
  const filterChips         = document.querySelectorAll('.chip-btn');

  // Sidebar navigation
  const sidebarButtons      = document.querySelectorAll('.sidebar-btn[data-tab]');
  const tabPanes            = document.querySelectorAll('.tab-pane');
  const pageTitle           = document.getElementById('pageTitle');
  const pageSubTitle        = document.getElementById('pageSubTitle');

  // Modals
  const patientDossierModal = document.getElementById('patientDossierModal');
  const newCheckupModal     = document.getElementById('newCheckupModal');
  const checkupForm         = document.getElementById('checkupForm');
  const rxRowsContainer     = document.getElementById('rxRowsContainer');
  const btnAddMedRow        = document.getElementById('btnAddMedicationRow');

  // ── 1. Authentication Check ──
  const savedAdmin = sessionStorage.getItem('medsage_admin_session');
  if (savedAdmin) {
    try {
      currentAdmin = JSON.parse(savedAdmin);
      unlockDashboard();
    } catch (e) {
      sessionStorage.removeItem('medsage_admin_session');
    }
  }

  // Handle Login Form Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const submitBtn = document.getElementById('loginSubmitBtn');
    const origHTML = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Authenticating Doctor...</span>`;

    const res = await window.medsageBackend.adminLogin(email, password);

    submitBtn.disabled = false;
    submitBtn.innerHTML = origHTML;

    if (res.success) {
      currentAdmin = res.profile || { email, role: 'admin' };
      sessionStorage.setItem('medsage_admin_session', JSON.stringify(currentAdmin));
      unlockDashboard();
    } else {
      alert(res.error || 'Authentication failed. Please verify admin credentials.');
    }
  });

  // Logout
  adminLogoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to log out of the Admin Portal?')) {
      sessionStorage.removeItem('medsage_admin_session');
      currentAdmin = null;
      appLayout.style.display = 'none';
      loginOverlay.style.display = 'flex';
    }
  });

  function unlockDashboard() {
    loginOverlay.style.display = 'none';
    appLayout.style.display = 'flex';
    if (currentAdmin.full_name) {
      document.getElementById('adminDisplayName').textContent = currentAdmin.full_name;
    }
    loadAllData();
  }

  // ── 2. Load Core Data ──
  async function loadAllData() {
    // 1. Appointments
    const apptsRes = await window.medsageBackend.getAppointments();
    if (apptsRes.success) {
      appointments = apptsRes.data || [];
    }

    // 2. Patients
    const patRes = await window.medsageBackend.getPatients();
    if (patRes.success) {
      patients = patRes.data || [];
    }

    updateStats();
    renderOverviewTable();
    renderAppointmentsTable();
    renderPatientsTable();
    populatePatientSelect();
  }

  // ── 3. Calculate & Render Stats ──
  async function updateStats() {
    const total = appointments.length;
    const pending = appointments.filter(a => a.status === 'pending').length;
    const totalPats = patients.length;

    // Checkups count
    let checkupCount = 0;
    const db = window.medsageBackend.getLocalDB ? window.medsageBackend.getLocalDB() : null;
    if (db && db.checkups) {
      checkupCount = db.checkups.length;
    }

    statTotalAppts.textContent = total;
    statPendingAppts.textContent = pending;
    statTotalPatients.textContent = totalPats;
    statTotalCheckups.textContent = checkupCount;
    badgePendingCount.textContent = pending;

    if (pending > 0) {
      badgePendingCount.style.background = 'var(--warning)';
      badgePendingCount.style.color = '#fff';
    }
  }

  // ── 4. Render Overview Appointments ──
  function renderOverviewTable() {
    overviewTbody.innerHTML = '';
    const recent = appointments.slice(0, 5);

    if (recent.length === 0) {
      overviewTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:24px;">No appointment records yet.</td></tr>`;
      return;
    }

    recent.forEach(appt => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="patient-cell">
            <div class="patient-avatar-mini">${getInitials(appt.full_name)}</div>
            <div class="patient-meta">
              <strong>${escapeHTML(appt.full_name)}</strong>
              <span>${escapeHTML(appt.phone)}</span>
            </div>
          </div>
        </td>
        <td><strong>${escapeHTML(appt.service || 'Consultation')}</strong></td>
        <td>${appt.appointment_date || 'N/A'} <br/><span style="font-size:0.75rem;color:var(--gray-500);">${appt.appointment_time || ''}</span></td>
        <td>
          <span class="status-pill status-${appt.status}">${appt.status}</span>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn-icon-action btn-quick-confirm" data-id="${appt.id}" ${appt.status === 'confirmed' ? 'disabled' : ''}>
              ✓ Confirm
            </button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-quick-confirm')?.addEventListener('click', async () => {
        await handleStatusUpdate(appt.id, 'confirmed');
      });

      overviewTbody.appendChild(tr);
    });
  }

  // ── 5. Render All Appointments (Filterable & Searchable) ──
  function renderAppointmentsTable() {
    appointmentsTbody.innerHTML = '';

    let filtered = appointments.filter(appt => {
      const matchesFilter = (currentFilter === 'all') || (appt.status === currentFilter);
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        (appt.full_name && appt.full_name.toLowerCase().includes(q)) ||
        (appt.phone && appt.phone.toLowerCase().includes(q)) ||
        (appt.service && appt.service.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      appointmentsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:32px;">No matching appointments found.</td></tr>`;
      return;
    }

    filtered.forEach(appt => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="patient-cell">
            <div class="patient-avatar-mini">${getInitials(appt.full_name)}</div>
            <div class="patient-meta">
              <strong>${escapeHTML(appt.full_name)}</strong>
              <span>${escapeHTML(appt.phone)} ${appt.email ? '• ' + escapeHTML(appt.email) : ''}</span>
            </div>
          </div>
        </td>
        <td><strong style="color:var(--primary-700);">${escapeHTML(appt.service || 'General Care')}</strong></td>
        <td>${appt.appointment_date || 'N/A'}<br/><span style="font-size:0.75rem;color:var(--gray-500);">${appt.appointment_time || ''}</span></td>
        <td style="max-width:240px;font-size:0.82rem;color:var(--gray-600);">${escapeHTML(appt.message || 'None provided')}</td>
        <td>
          <select class="status-select" data-id="${appt.id}">
            <option value="pending" ${appt.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${appt.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="completed" ${appt.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${appt.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn-icon-action btn-record-checkup" data-id="${appt.id}" title="Write Checkup & Prescription">
              🩺 Checkup
            </button>
          </div>
        </td>
      `;

      // Status change listener
      const select = tr.querySelector('.status-select');
      select.addEventListener('change', async (e) => {
        await handleStatusUpdate(appt.id, e.target.value);
      });

      // Quick checkup button
      tr.querySelector('.btn-record-checkup').addEventListener('click', () => {
        openCheckupModalForAppt(appt);
      });

      appointmentsTbody.appendChild(tr);
    });
  }

  async function handleStatusUpdate(apptId, newStatus) {
    const res = await window.medsageBackend.updateAppointmentStatus(apptId, newStatus);
    if (res.success) {
      const idx = appointments.findIndex(a => String(a.id) === String(apptId));
      if (idx !== -1) appointments[idx].status = newStatus;
      updateStats();
      renderOverviewTable();
      renderAppointmentsTable();
    } else {
      alert('Failed to update status: ' + res.error);
    }
  }

  // Filter chips click
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.getAttribute('data-filter');
      renderAppointmentsTable();
    });
  });

  // Search input
  if (apptSearchInput) {
    apptSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderAppointmentsTable();
    });
  }

  // ── 6. Render Patients & Clinical Dossiers ──
  function renderPatientsTable() {
    patientsTbody.innerHTML = '';
    const q = patientSearchInput ? patientSearchInput.value.toLowerCase().trim() : '';

    const filtered = patients.filter(p => {
      return !q ||
        (p.full_name && p.full_name.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.blood_group && p.blood_group.toLowerCase().includes(q));
    });

    if (filtered.length === 0) {
      patientsTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:32px;">No patient records found.</td></tr>`;
      return;
    }

    filtered.forEach(patient => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="patient-cell">
            <div class="patient-avatar-mini">${getInitials(patient.full_name)}</div>
            <div class="patient-meta">
              <strong>${escapeHTML(patient.full_name)}</strong>
              <span>${escapeHTML(patient.phone || 'No phone')} • ${escapeHTML(patient.email || '')}</span>
            </div>
          </div>
        </td>
        <td>${patient.age || '—'} yrs • ${patient.gender || '—'}</td>
        <td>
          <span style="font-weight:700;color:var(--primary-700);background:var(--primary-50);padding:3px 8px;border-radius:4px;">
            ${patient.blood_group || 'Unknown'}
          </span>
        </td>
        <td><span style="color:${patient.allergies && patient.allergies !== 'None' ? 'var(--danger)' : 'var(--gray-500)'};">${escapeHTML(patient.allergies || 'None recorded')}</span></td>
        <td>
          <button class="btn-icon-action btn-view-dossier" style="color:var(--primary-700);font-weight:700;">
            📂 View History & Checkups
          </button>
        </td>
        <td>
          <button class="btn-primary btn-add-checkup-patient" style="font-size:0.78rem;padding:6px 12px;">
            + Checkup
          </button>
        </td>
      `;

      tr.querySelector('.btn-view-dossier').addEventListener('click', () => {
        openPatientDossier(patient);
      });

      tr.querySelector('.btn-add-checkup-patient').addEventListener('click', () => {
        openCheckupModalForPatient(patient);
      });

      patientsTbody.appendChild(tr);
    });
  }

  if (patientSearchInput) {
    patientSearchInput.addEventListener('input', () => {
      renderPatientsTable();
    });
  }

  // ── 7. Open Full Patient Dossier (All Checkups & History) ──
  async function openPatientDossier(patient) {
    activeDossierPatient = patient;
    document.getElementById('dossierName').textContent = patient.full_name;
    document.getElementById('dossierAvatar').textContent = getInitials(patient.full_name);
    document.getElementById('dossierMeta').textContent =
      `Age: ${patient.age || '—'} | ${patient.gender || '—'} | Blood Group: ${patient.blood_group || '—'} | Phone: ${patient.phone || '—'} | Allergies: ${patient.allergies || 'None'}`;

    const container = document.getElementById('dossierCheckupsContainer');
    container.innerHTML = `<p style="color:var(--gray-400);text-align:center;padding:20px;">Loading clinical records...</p>`;
    patientDossierModal.classList.add('open');

    const res = await window.medsageBackend.getPatientCheckups(patient.id);
    const checkups = res.success ? res.data : [];

    if (checkups.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:32px;background:var(--gray-50);border-radius:12px;border:1px dashed var(--gray-300);">
          <h4 style="color:var(--gray-700);margin-bottom:6px;">No Previous Checkup Records</h4>
          <p style="font-size:0.85rem;color:var(--gray-500);margin-bottom:14px;">This patient has not yet had a recorded consultation.</p>
          <button class="btn-primary" id="btnDossierEmptyAddCheckup">+ Record First Consultation</button>
        </div>
      `;
      document.getElementById('btnDossierEmptyAddCheckup')?.addEventListener('click', () => {
        patientDossierModal.classList.remove('open');
        openCheckupModalForPatient(patient);
      });
      return;
    }

    container.innerHTML = '';
    checkups.forEach((chk, idx) => {
      const card = document.createElement('div');
      card.className = 'checkup-card';

      // Prescription rows
      let rxHtml = '';
      if (Array.isArray(chk.prescriptions) && chk.prescriptions.length > 0) {
        rxHtml = `
          <div style="margin-top:12px;">
            <strong style="font-size:0.82rem;color:var(--primary-800);text-transform:uppercase;">Prescribed Medications (Rx):</strong>
            <table class="rx-display-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                ${chk.prescriptions.map(rx => `
                  <tr>
                    <td><strong>${escapeHTML(rx.medicine)}</strong></td>
                    <td>${escapeHTML(rx.dosage || '—')}</td>
                    <td>${escapeHTML(rx.frequency || '—')}</td>
                    <td>${escapeHTML(rx.duration || '—')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="checkup-card-header">
          <div>
            <span class="checkup-date-badge">📅 Visit Date: ${chk.checkup_date}</span>
            <span style="font-size:0.82rem;color:var(--gray-500);margin-left:8px;">Doctor: ${escapeHTML(chk.doctor_name || 'Dr. Ahmad Khan')}</span>
          </div>
          <button class="btn-secondary btn-print-rx" style="font-size:0.75rem;padding:4px 10px;">
            🖨️ Print Prescription Slip
          </button>
        </div>

        <div style="margin-bottom:8px;">
          <h4 style="font-size:1.05rem;color:var(--gray-900);margin-bottom:4px;">${escapeHTML(chk.diagnosis)}</h4>
          ${chk.symptoms ? `<p style="font-size:0.85rem;color:var(--gray-600);"><strong>Chief Complaints:</strong> ${escapeHTML(chk.symptoms)}</p>` : ''}
        </div>

        <!-- Vitals -->
        <div class="vitals-banner">
          <div class="vital-tag">BP: <strong>${chk.vitals?.bp || '120/80'}</strong></div>
          <div class="vital-tag">Pulse: <strong>${chk.vitals?.pulse || '72 bpm'}</strong></div>
          <div class="vital-tag">Temp: <strong>${chk.vitals?.temp || '98.6°F'}</strong></div>
          <div class="vital-tag">Weight: <strong>${chk.vitals?.weight || '70 kg'}</strong></div>
        </div>

        <!-- Prescriptions -->
        ${rxHtml}

        <!-- Clinical Advice -->
        ${chk.doctor_notes ? `
          <div style="margin-top:12px;background:var(--primary-50);padding:10px 14px;border-radius:8px;font-size:0.84rem;color:var(--primary-900);">
            <strong>Doctor's Advice:</strong> ${escapeHTML(chk.doctor_notes)}
          </div>
        ` : ''}

        ${chk.follow_up_date ? `
          <div style="margin-top:8px;font-size:0.78rem;color:var(--gray-500);">
            ⏳ Next Recommended Follow-up: <strong>${chk.follow_up_date}</strong>
          </div>
        ` : ''}
      `;

      // Print Button Handler
      card.querySelector('.btn-print-rx').addEventListener('click', () => {
        printPrescription(patient, chk);
      });

      container.appendChild(card);
    });
  }

  // Close dossier modal
  document.getElementById('btnCloseDossier').addEventListener('click', () => patientDossierModal.classList.remove('open'));
  document.getElementById('btnCloseDossierBottom').addEventListener('click', () => patientDossierModal.classList.remove('open'));

  // Dossier "+ Add New Checkup" button
  document.getElementById('btnDossierAddCheckup').addEventListener('click', () => {
    patientDossierModal.classList.remove('open');
    if (activeDossierPatient) {
      openCheckupModalForPatient(activeDossierPatient);
    }
  });

  // ── 8. New Checkup Modal & Prescription Builder ──
  function populatePatientSelect() {
    const select = document.getElementById('checkupPatientSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Choose Patient --</option>';
    patients.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.full_name} (${p.phone || p.email})`;
      select.appendChild(opt);
    });
  }

  function openCheckupModalForPatient(patient) {
    populatePatientSelect();
    const select = document.getElementById('checkupPatientSelect');
    select.value = patient.id;
    document.getElementById('checkupDate').value = new Date().toISOString().split('T')[0];
    newCheckupModal.classList.add('open');
  }

  function openCheckupModalForAppt(appt) {
    // If appointment has an associated patient
    let p = patients.find(pat => pat.id === appt.patient_id || pat.email === appt.email);
    if (!p) {
      // Create on-the-fly local patient record so doctor can save checkup
      p = {
        id: 'pat-' + Date.now(),
        full_name: appt.full_name,
        phone: appt.phone,
        email: appt.email || '',
        role: 'patient',
        age: 30,
        gender: 'Male',
        blood_group: 'B+',
        allergies: 'None'
      };
      patients.push(p);
      const db = window.medsageBackend.getLocalDB();
      db.profiles.push(p);
      localStorage.setItem('medsage_local_db_v2', JSON.stringify(db));
      renderPatientsTable();
    }
    openCheckupModalForPatient(p);
    if (appt.service) {
      document.getElementById('checkupDiagnosis').value = appt.service + ' Examination';
    }
  }

  document.getElementById('btnQuickNewCheckup').addEventListener('click', () => {
    populatePatientSelect();
    document.getElementById('checkupDate').value = new Date().toISOString().split('T')[0];
    newCheckupModal.classList.add('open');
  });

  document.getElementById('btnSidebarNewCheckup').addEventListener('click', () => {
    populatePatientSelect();
    document.getElementById('checkupDate').value = new Date().toISOString().split('T')[0];
    newCheckupModal.classList.add('open');
  });

  document.getElementById('btnCloseCheckupModal').addEventListener('click', () => newCheckupModal.classList.remove('open'));
  document.getElementById('btnCancelCheckup').addEventListener('click', () => newCheckupModal.classList.remove('open'));

  // Add medication row
  btnAddMedRow.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'rx-row';
    row.innerHTML = `
      <input type="text" placeholder="Medicine name & strength (e.g. Panadol 500mg)" class="rx-name" required />
      <input type="text" placeholder="Dosage (e.g. 1 tab)" class="rx-dosage" />
      <input type="text" placeholder="Frequency (e.g. TDS 3x daily)" class="rx-frequency" />
      <input type="text" placeholder="Duration (e.g. 5 days)" class="rx-duration" />
      <button type="button" class="btn-remove-rx" title="Remove" onclick="this.parentElement.remove()">×</button>
    `;
    rxRowsContainer.appendChild(row);
  });

  // Checkup Form Submission
  checkupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const patientId = document.getElementById('checkupPatientSelect').value;
    if (!patientId) {
      alert('Please select a patient.');
      return;
    }

    const checkupDate = document.getElementById('checkupDate').value;
    const diagnosis   = document.getElementById('checkupDiagnosis').value.trim();
    const symptoms    = document.getElementById('checkupSymptoms').value.trim();
    const doctorNotes = document.getElementById('checkupNotes').value.trim();
    const followUpDate= document.getElementById('checkupFollowUp').value || null;

    const vitals = {
      bp:     document.getElementById('vitalBP').value.trim(),
      pulse:  document.getElementById('vitalPulse').value.trim(),
      temp:   document.getElementById('vitalTemp').value.trim(),
      weight: document.getElementById('vitalWeight').value.trim()
    };

    // Gather prescriptions
    const rxRows = rxRowsContainer.querySelectorAll('.rx-row');
    const prescriptions = [];
    rxRows.forEach(row => {
      const name = row.querySelector('.rx-name').value.trim();
      if (name) {
        prescriptions.push({
          medicine: name,
          dosage: row.querySelector('.rx-dosage').value.trim(),
          frequency: row.querySelector('.rx-frequency').value.trim(),
          duration: row.querySelector('.rx-duration').value.trim()
        });
      }
    });

    const submitBtn = document.getElementById('btnSaveCheckup');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving Checkup...';

    const res = await window.medsageBackend.addCheckup({
      patientId,
      doctorName: 'Dr. Ahmad Khan',
      checkupDate,
      diagnosis,
      symptoms,
      vitals,
      prescriptions,
      doctorNotes,
      followUpDate
    });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Save & Record Consultation';

    if (res.success) {
      alert('Checkup and prescription successfully recorded!');
      newCheckupModal.classList.remove('open');
      checkupForm.reset();
      updateStats();

      // If dossier is active for this patient, reload it
      if (activeDossierPatient && activeDossierPatient.id === patientId) {
        openPatientDossier(activeDossierPatient);
      }
    } else {
      alert('Failed to save checkup: ' + res.error);
    }
  });

  // ── 9. Print Prescription Slip ──
  function printPrescription(patient, chk) {
    const printBar = document.getElementById('printPatientBar');
    printBar.innerHTML = `
      <div><strong>Patient:</strong> ${escapeHTML(patient.full_name)} (${patient.age || '—'} yrs, ${patient.gender || '—'})</div>
      <div><strong>Date:</strong> ${chk.checkup_date}</div>
      <div><strong>Blood Group:</strong> ${patient.blood_group || '—'}</div>
      <div><strong>BP / Pulse:</strong> ${chk.vitals?.bp || '120/80'} | ${chk.vitals?.pulse || '72 bpm'}</div>
    `;

    document.getElementById('printDiagnosis').textContent = chk.diagnosis + (chk.symptoms ? ` (${chk.symptoms})` : '');

    const rxTbody = document.getElementById('printRxTbody');
    rxTbody.innerHTML = '';
    if (chk.prescriptions && chk.prescriptions.length > 0) {
      chk.prescriptions.forEach(rx => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e2e8f0';
        tr.innerHTML = `
          <td style="padding:8px 12px;font-weight:700;">${escapeHTML(rx.medicine)}</td>
          <td style="padding:8px 12px;">${escapeHTML(rx.dosage || '—')}</td>
          <td style="padding:8px 12px;">${escapeHTML(rx.frequency || '—')}</td>
          <td style="padding:8px 12px;">${escapeHTML(rx.duration || '—')}</td>
        `;
        rxTbody.appendChild(tr);
      });
    } else {
      rxTbody.innerHTML = `<tr><td colspan="4" style="padding:8px 12px;color:#94a3b8;">No systemic medications prescribed.</td></tr>`;
    }

    document.getElementById('printAdvice').textContent = chk.doctor_notes || 'Continue general health hygiene and recommended rest.';

    const printArea = document.getElementById('printablePrescription');
    printArea.style.display = 'block';
    window.print();
    printArea.style.display = 'none';
  }

  // ── 10. Tab Switching ──
  sidebarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sidebarButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === targetTab);
      });

      if (targetTab === 'tab-overview') {
        pageTitle.textContent = 'Clinic Overview';
        pageSubTitle.textContent = 'Welcome back, Dr. Ahmad Khan. Real-time patient & consultation statistics.';
      } else if (targetTab === 'tab-appointments') {
        pageTitle.textContent = 'Appointment Requests';
        pageSubTitle.textContent = 'Manage bookings, patient inquiries, and confirm visits.';
      } else if (targetTab === 'tab-patients') {
        pageTitle.textContent = 'Patient Registry & Medical Dossiers';
        pageSubTitle.textContent = 'Complete consultation history, diagnoses, vital signs, and prescriptions.';
      }
    });
  });

  document.getElementById('btnGoToAppointments')?.addEventListener('click', () => {
    document.querySelector('.sidebar-btn[data-tab="tab-appointments"]')?.click();
  });

  // ── Helpers ──
  function getInitials(name) {
    if (!name) return 'PT';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

});
