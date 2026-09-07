/**
 * MedSage Clinic — Patient Health Portal Logic
 * Handles Authentication, Medical Checkup History, Prescription Viewing, and Appointment Booking.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── State ──
  let currentPatient = null;
  let patientCheckups = [];
  let patientAppointments = [];

  // ── Elements ──
  const authSection         = document.getElementById('patientAuthSection');
  const dashboardSection    = document.getElementById('patientDashboardSection');
  const loginForm           = document.getElementById('patientLoginForm');
  const registerForm        = document.getElementById('patientRegisterForm');
  const tabBtnLogin         = document.getElementById('tabBtnLogin');
  const tabBtnRegister      = document.getElementById('tabBtnRegister');
  const btnPatientLogout    = document.getElementById('btnPatientLogout');

  // Dashboard Header Elements
  const navAvatar           = document.getElementById('navAvatar');
  const navPatientName      = document.getElementById('navPatientName');
  const navBloodBadge       = document.getElementById('navBloodBadge');
  const heroWelcomeText     = document.getElementById('heroWelcomeText');
  const heroCheckupsCount   = document.getElementById('heroCheckupsCount');
  const heroApptsCount      = document.getElementById('heroApptsCount');
  const heroBloodGroup      = document.getElementById('heroBloodGroup');

  // Containers
  const checkupsList        = document.getElementById('patientCheckupsList');
  const appointmentsList    = document.getElementById('patientAppointmentsList');

  // Tabs
  const tabButtons          = document.querySelectorAll('.tab-nav-btn');
  const tabPanes            = document.querySelectorAll('.tab-pane');

  // Booking Modal
  const bookingModal        = document.getElementById('patientBookingModal');
  const btnBookApptNav      = document.getElementById('btnBookApptNav');
  const btnQuickBook        = document.getElementById('btnQuickBook');
  const btnNewAppointmentTab= document.getElementById('btnNewAppointmentTab');
  const btnCloseBookingModal= document.getElementById('btnCloseBookingModal');
  const btnCancelBooking    = document.getElementById('btnCancelBooking');
  const bookingForm         = document.getElementById('patientDirectBookingForm');

  // ── 1. Check for Active Session ──
  const savedPatient = sessionStorage.getItem('medsage_patient_session');
  if (savedPatient) {
    try {
      currentPatient = JSON.parse(savedPatient);
      unlockPatientDashboard();
    } catch (e) {
      sessionStorage.removeItem('medsage_patient_session');
    }
  }

  // ── 2. Auth Toggle (Sign In vs Register) ──
  tabBtnLogin.addEventListener('click', () => {
    tabBtnLogin.classList.add('active');
    tabBtnRegister.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  });

  tabBtnRegister.addEventListener('click', () => {
    tabBtnRegister.classList.add('active');
    tabBtnLogin.classList.remove('active');
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
  });

  // Demo Login Quick Fill
  document.querySelectorAll('.btn-demo-fill').forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-email');
      document.getElementById('loginEmail').value = email;
      document.getElementById('loginPassword').value = 'Patient123!';
      loginForm.dispatchEvent(new Event('submit'));
    });
  });

  // ── 3. Login Submission ──
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = document.getElementById('btnSubmitLogin');
    const origHTML = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Verifying Patient Identity...</span>`;

    const res = await window.medsageBackend.patientLogin(email, password);

    submitBtn.disabled = false;
    submitBtn.innerHTML = origHTML;

    if (res.success) {
      currentPatient = res.profile;
      sessionStorage.setItem('medsage_patient_session', JSON.stringify(currentPatient));
      unlockPatientDashboard();
    } else {
      alert(res.error || 'Login failed. Please check your email and password.');
    }
  });

  // ── 4. Registration Submission ──
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName  = document.getElementById('regFullName').value.trim();
    const phone     = document.getElementById('regPhone').value.trim();
    const age       = document.getElementById('regAge').value;
    const gender    = document.getElementById('regGender').value;
    const bloodGroup= document.getElementById('regBloodGroup').value;
    const allergies = document.getElementById('regAllergies').value.trim() || 'None';
    const email     = document.getElementById('regEmail').value.trim();
    const password  = document.getElementById('regPassword').value;

    const submitBtn = document.getElementById('btnSubmitRegister');
    const origHTML = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Creating Patient File...</span>`;

    const res = await window.medsageBackend.patientRegister({
      fullName,
      phone,
      age,
      gender,
      bloodGroup,
      allergies,
      email,
      password
    });

    submitBtn.disabled = false;
    submitBtn.innerHTML = origHTML;

    if (res.success) {
      alert('Account successfully created! Welcome to MedSage Clinic.');
      currentPatient = res.profile || {
        id: res.user?.id,
        full_name: fullName,
        phone,
        email,
        age,
        gender,
        blood_group: bloodGroup,
        allergies
      };
      sessionStorage.setItem('medsage_patient_session', JSON.stringify(currentPatient));
      unlockPatientDashboard();
    } else {
      alert(res.error || 'Registration failed. Please try again.');
    }
  });

  // ── 5. Logout ──
  btnPatientLogout.addEventListener('click', () => {
    if (confirm('Are you sure you want to log out of your health portal?')) {
      sessionStorage.removeItem('medsage_patient_session');
      currentPatient = null;
      dashboardSection.style.display = 'none';
      authSection.style.display = 'flex';
    }
  });

  // ── 6. Unlock Dashboard ──
  function unlockPatientDashboard() {
    authSection.style.display = 'none';
    dashboardSection.style.display = 'block';

    const firstName = currentPatient.full_name ? currentPatient.full_name.split(' ')[0] : 'Patient';
    navPatientName.textContent  = currentPatient.full_name || 'Patient';
    navAvatar.textContent       = getInitials(currentPatient.full_name);
    navBloodBadge.textContent   = currentPatient.blood_group || 'O+';
    heroWelcomeText.textContent = `Welcome back, ${firstName}! 👋`;
    heroBloodGroup.textContent  = currentPatient.blood_group || 'O+';

    // Populate profile tab
    document.getElementById('profFullName').textContent = currentPatient.full_name || '—';
    document.getElementById('profPhone').textContent    = currentPatient.phone || '—';
    document.getElementById('profEmail').textContent    = currentPatient.email || '—';
    document.getElementById('profAgeGender').textContent= `${currentPatient.age || '—'} yrs • ${currentPatient.gender || '—'}`;
    document.getElementById('profBloodGroup').textContent= currentPatient.blood_group || '—';
    document.getElementById('profAllergies').textContent = currentPatient.allergies || 'None';

    loadPatientData();
  }

  // ── 7. Load Patient Checkups & Appointments ──
  async function loadPatientData() {
    // 1. Checkups (Primary)
    const chkRes = await window.medsageBackend.getPatientCheckups(currentPatient.id);
    patientCheckups = chkRes.success ? chkRes.data : [];

    // Also match by email if patient ID changed in demo
    if (patientCheckups.length === 0 && window.medsageBackend.getLocalDB) {
      const db = window.medsageBackend.getLocalDB();
      const pMatch = db.profiles.find(p => p.email.toLowerCase() === currentPatient.email.toLowerCase());
      if (pMatch && pMatch.id !== currentPatient.id) {
        patientCheckups = db.checkups.filter(c => c.patient_id === pMatch.id);
      }
    }

    heroCheckupsCount.textContent = patientCheckups.length;
    renderCheckups();

    // 2. Appointments
    const appRes = await window.medsageBackend.getAppointments();
    if (appRes.success) {
      const allAppts = appRes.data || [];
      patientAppointments = allAppts.filter(a =>
        String(a.patient_id) === String(currentPatient.id) ||
        (a.email && a.email.toLowerCase() === currentPatient.email.toLowerCase())
      );
    }
    heroApptsCount.textContent = patientAppointments.length;
    renderAppointments();
  }

  // ── 8. Render Checkup Timeline (Diagnosis, Vitals, Prescriptions) ──
  function renderCheckups() {
    checkupsList.innerHTML = '';

    if (patientCheckups.length === 0) {
      checkupsList.innerHTML = `
        <div style="text-align:center;padding:48px 20px;background:#fff;border-radius:16px;border:1px dashed var(--gray-300);">
          <div style="font-size:36px;margin-bottom:12px;">🩺</div>
          <h3 style="color:var(--gray-800);margin-bottom:6px;">No Clinical Checkups Recorded Yet</h3>
          <p style="color:var(--gray-500);max-width:440px;margin:0 auto 16px;font-size:0.9rem;">
            You have no prior medical consultations in your file. Once Dr. Ahmad Khan conducts an examination, your diagnoses, vitals, and prescriptions will appear here.
          </p>
          <button class="btn-auth-submit" style="width:auto;display:inline-block;" onclick="document.getElementById('btnQuickBook').click()">
            Schedule Your First Consultation →
          </button>
        </div>
      `;
      return;
    }

    patientCheckups.forEach(chk => {
      const card = document.createElement('div');
      card.className = 'patient-checkup-card';

      // Prescriptions Table
      let rxTable = '';
      if (Array.isArray(chk.prescriptions) && chk.prescriptions.length > 0) {
        rxTable = `
          <div class="prescriptions-table-wrapper">
            <div class="prescription-header">
              <span>💊 Prescribed Medications (Rx)</span>
            </div>
            <table class="prescription-table">
              <thead>
                <tr>
                  <th>Medicine & Strength</th>
                  <th>Dosage</th>
                  <th>Schedule / Frequency</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                ${chk.prescriptions.map(rx => `
                  <tr>
                    <td><strong style="color:var(--gray-900);">${escapeHTML(rx.medicine)}</strong></td>
                    <td>${escapeHTML(rx.dosage || '1 unit')}</td>
                    <td><span style="color:var(--primary-700);font-weight:600;">${escapeHTML(rx.frequency || 'As directed')}</span></td>
                    <td>${escapeHTML(rx.duration || '—')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="checkup-top-header">
          <div class="doctor-badge-group">
            <div class="doctor-avatar">AK</div>
            <div class="doctor-meta">
              <h4>${escapeHTML(chk.doctor_name || 'Dr. Ahmad Khan')}</h4>
              <p>Consultant Physician & Specialist</p>
            </div>
          </div>
          <div class="visit-date-pill">
            🗓️ Visit Date: ${chk.checkup_date}
          </div>
        </div>

        <div class="diagnosis-box">
          <div class="diagnosis-title">${escapeHTML(chk.diagnosis)}</div>
          ${chk.symptoms ? `<div class="symptoms-text"><strong>Chief Complaints:</strong> ${escapeHTML(chk.symptoms)}</div>` : ''}
        </div>

        <!-- Vitals Meter -->
        <div class="vitals-meter-grid">
          <div class="vital-meter-item">
            <span>Blood Pressure</span>
            <strong>${chk.vitals?.bp || '120/80'}</strong>
          </div>
          <div class="vital-meter-item">
            <span>Heart Rate</span>
            <strong>${chk.vitals?.pulse || '72 bpm'}</strong>
          </div>
          <div class="vital-meter-item">
            <span>Temperature</span>
            <strong>${chk.vitals?.temp || '98.6°F'}</strong>
          </div>
          <div class="vital-meter-item">
            <span>Body Weight</span>
            <strong>${chk.vitals?.weight || '70 kg'}</strong>
          </div>
        </div>

        <!-- Prescriptions -->
        ${rxTable}

        <!-- Clinical Advice -->
        ${chk.doctor_notes ? `
          <div class="advice-callout">
            <strong>Doctor's Advice:</strong> ${escapeHTML(chk.doctor_notes)}
          </div>
        ` : ''}

        <div class="checkup-footer">
          <div class="followup-text">
            ${chk.follow_up_date ? `Recommended Next Visit: <strong>${chk.follow_up_date}</strong>` : 'Follow up as needed if symptoms persist.'}
          </div>
          <button class="btn-print-checkup btn-print-patient-slip">
            🖨️ Print Prescription Slip
          </button>
        </div>
      `;

      card.querySelector('.btn-print-patient-slip').addEventListener('click', () => {
        printPatientSlip(chk);
      });

      checkupsList.appendChild(card);
    });
  }

  // ── 9. Render Patient Appointments ──
  function renderAppointments() {
    appointmentsList.innerHTML = '';

    if (patientAppointments.length === 0) {
      appointmentsList.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:48px 20px;background:#fff;border-radius:16px;border:1px dashed var(--gray-300);">
          <div style="font-size:36px;margin-bottom:12px;">📅</div>
          <h3 style="color:var(--gray-800);margin-bottom:6px;">No Upcoming Appointments</h3>
          <p style="color:var(--gray-500);max-width:440px;margin:0 auto 16px;font-size:0.9rem;">
            You currently have no scheduled appointments at MedSage Clinic. Book a slot with Dr. Ahmad Khan easily.
          </p>
          <button class="btn-auth-submit" style="width:auto;display:inline-block;" onclick="document.getElementById('btnQuickBook').click()">
            + Book Appointment Now
          </button>
        </div>
      `;
      return;
    }

    patientAppointments.forEach(appt => {
      const card = document.createElement('div');
      card.className = 'patient-appt-card';

      card.innerHTML = `
        <div>
          <div class="appt-card-top">
            <div class="appt-service-name">${escapeHTML(appt.service || 'Consultation')}</div>
            <span class="status-pill status-${appt.status}">${appt.status}</span>
          </div>

          <div class="appt-date-display">
            <span>📅 ${appt.appointment_date || 'Date Pending'}</span>
            <span>⏰ ${appt.appointment_time || 'Morning Slot'}</span>
          </div>

          ${appt.message ? `
            <p style="font-size:0.85rem;color:var(--gray-600);margin-top:12px;background:var(--gray-50);padding:8px 12px;border-radius:6px;">
              <strong>Note:</strong> ${escapeHTML(appt.message)}
            </p>
          ` : ''}
        </div>

        <div style="font-size:0.75rem;color:var(--gray-400);border-top:1px solid var(--gray-100);padding-top:10px;">
          Requested on ${new Date(appt.created_at || Date.now()).toLocaleDateString()}
        </div>
      `;

      appointmentsList.appendChild(card);
    });
  }

  // ── 10. Direct Appointment Booking Modal ──
  function openBookingModal() {
    document.getElementById('bookingPatientNameLabel').textContent = currentPatient.full_name;
    document.getElementById('bookDate').value = new Date().toISOString().split('T')[0];
    bookingModal.classList.add('open');
  }

  btnBookApptNav?.addEventListener('click', openBookingModal);
  btnQuickBook?.addEventListener('click', openBookingModal);
  btnNewAppointmentTab?.addEventListener('click', openBookingModal);
  btnCloseBookingModal?.addEventListener('click', () => bookingModal.classList.remove('open'));
  btnCancelBooking?.addEventListener('click', () => bookingModal.classList.remove('open'));

  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const service = document.getElementById('bookService').value;
    const date    = document.getElementById('bookDate').value;
    const time    = document.getElementById('bookTime').value;
    const message = document.getElementById('bookMessage').value.trim();

    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting Booking...';

    const res = await window.medsageBackend.submitAppointmentToSupabase({
      patientId: currentPatient.id,
      fullName: currentPatient.full_name,
      phone: currentPatient.phone,
      email: currentPatient.email,
      service,
      appointmentDate: date,
      appointmentTime: time,
      message
    });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Confirm Appointment';

    if (res.success) {
      alert('Appointment successfully booked! Our receptionist will confirm your timing.');
      bookingModal.classList.remove('open');
      bookingForm.reset();
      loadPatientData();

      // Switch to appointments tab
      document.querySelector('.tab-nav-btn[data-tab="tab-appointments"]')?.click();
    } else {
      alert('Failed to submit appointment. Please try again.');
    }
  });

  // ── 11. Print Patient Prescription Slip ──
  function printPatientSlip(chk) {
    const printBar = document.getElementById('patientSlipBar');
    printBar.innerHTML = `
      <div><strong>Patient:</strong> ${escapeHTML(currentPatient.full_name)} (${currentPatient.age || '—'} yrs, ${currentPatient.gender || '—'})</div>
      <div><strong>Date:</strong> ${chk.checkup_date}</div>
      <div><strong>Blood Group:</strong> ${currentPatient.blood_group || '—'}</div>
      <div><strong>BP / Pulse:</strong> ${chk.vitals?.bp || '120/80'} | ${chk.vitals?.pulse || '72 bpm'}</div>
    `;

    document.getElementById('patientSlipDiagnosis').textContent = chk.diagnosis + (chk.symptoms ? ` (${chk.symptoms})` : '');

    const rxTbody = document.getElementById('patientSlipRxTbody');
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

    document.getElementById('patientSlipAdvice').textContent = chk.doctor_notes || 'Continue general hygiene and prescribed rest.';

    const printArea = document.getElementById('printablePatientSlip');
    printArea.style.display = 'block';
    window.print();
    printArea.style.display = 'none';
  }

  // ── 12. Tab Switcher ──
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.getAttribute('data-tab');
      tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === target);
      });
    });
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
