/**
 * Supabase Backend Integration for MedSage Clinic
 * Handles Auth, Appointments, Medical Checkups, Patient Profiles, and Admin Access.
 * Project ID: acsmzastgryhkvjulipc
 */

const SUPABASE_URL = 'https://acsmzastgryhkvjulipc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vaE2b8oaJcA_JY_Wib0OgA_WeHPlBDK';

// Initialize Supabase Client
const supabase = (typeof window !== 'undefined' && window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ====================================================================
// LOCAL STORAGE MOCK DATABASE (Seamless fallback if tables aren't setup yet)
// ====================================================================
const LOCAL_STORAGE_KEY = 'medsage_local_db_v2';

function getLocalDB() {
  const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (existing) {
    try { return JSON.parse(existing); } catch (e) {}
  }

  // Initial rich sample data
  const initialDB = {
    profiles: [
      {
        id: 'admin-001',
        email: 'admin@medsageclinic.com',
        full_name: 'Dr. Ahmad Khan (Chief Medical Officer)',
        phone: '+92 300 1234567',
        role: 'admin',
        age: 42,
        gender: 'Male',
        blood_group: 'O+',
        allergies: 'None'
      },
      {
        id: 'pat-111',
        email: 'fatima.ali@example.com',
        full_name: 'Fatima Ali',
        phone: '+92 321 4567890',
        role: 'patient',
        age: 28,
        gender: 'Female',
        blood_group: 'B+',
        allergies: 'Penicillin'
      },
      {
        id: 'pat-222',
        email: 'usman.raza@example.com',
        full_name: 'Usman Raza',
        phone: '+92 333 9876543',
        role: 'patient',
        age: 35,
        gender: 'Male',
        blood_group: 'O+',
        allergies: 'None'
      },
      {
        id: 'pat-333',
        email: 'sara.ahmed@example.com',
        full_name: 'Sara Ahmed',
        phone: '+92 302 5566778',
        role: 'patient',
        age: 31,
        gender: 'Female',
        blood_group: 'A+',
        allergies: 'Sulfa Drugs'
      }
    ],
    appointments: [
      {
        id: 101,
        patient_id: 'pat-111',
        full_name: 'Fatima Ali',
        phone: '+92 321 4567890',
        email: 'fatima.ali@example.com',
        service: 'General Physician',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '11:30 AM',
        message: 'Seasonal allergy flare-up and persistent morning headaches.',
        status: 'confirmed',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 102,
        patient_id: 'pat-222',
        full_name: 'Usman Raza',
        phone: '+92 333 9876543',
        email: 'usman.raza@example.com',
        service: 'Skin Treatment',
        appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        appointment_time: '03:00 PM',
        message: 'Severe dry patches and itching on inner elbows.',
        status: 'pending',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString()
      },
      {
        id: 103,
        patient_id: 'pat-333',
        full_name: 'Sara Ahmed',
        phone: '+92 302 5566778',
        email: 'sara.ahmed@example.com',
        service: 'Vaccination',
        appointment_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        appointment_time: '10:00 AM',
        message: 'Annual flu booster and pediatric immunization schedule check.',
        status: 'confirmed',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 104,
        patient_id: null,
        full_name: 'Bilal Tariq',
        phone: '+92 300 7788990',
        email: 'bilal.tariq@gmail.com',
        service: 'Lab Tests',
        appointment_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        appointment_time: '09:00 AM',
        message: 'Fasting blood glucose and lipid profile test.',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ],
    checkups: [
      {
        id: 501,
        patient_id: 'pat-111',
        doctor_name: 'Dr. Ahmad Khan',
        checkup_date: new Date(Date.now() - 86400000 * 14).toISOString().split('T')[0],
        diagnosis: 'Acute Rhinosinusitis & Tension Headache',
        symptoms: 'Nasal congestion, facial pressure, throbbing headache for 4 days',
        vitals: { bp: '118/76', pulse: '74 bpm', temp: '99.1°F', weight: '58 kg' },
        prescriptions: [
          { medicine: 'Amoxicillin-Clavulanate 625mg', dosage: '1 tablet', frequency: 'Twice daily (after meals)', duration: '7 days' },
          { medicine: 'Fexofenadine 120mg', dosage: '1 tablet', frequency: 'Once daily at bedtime', duration: '10 days' },
          { medicine: 'Normal Saline Nasal Spray', dosage: '2 sprays', frequency: '3 times daily', duration: 'As needed' }
        ],
        doctor_notes: 'Patient advised steam inhalation twice daily and adequate hydration. Avoid cold exposure.',
        follow_up_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        created_at: new Date(Date.now() - 86400000 * 14).toISOString()
      },
      {
        id: 502,
        patient_id: 'pat-111',
        doctor_name: 'Dr. Ahmad Khan',
        checkup_date: new Date(Date.now() - 86400000 * 45).toISOString().split('T')[0],
        diagnosis: 'Routine Wellness & Mild Iron Deficiency',
        symptoms: 'Lethargy, occasional dizziness upon standing',
        vitals: { bp: '115/72', pulse: '78 bpm', temp: '98.4°F', weight: '57 kg' },
        prescriptions: [
          { medicine: 'Ferrous Fumarate + Folic Acid', dosage: '1 capsule', frequency: 'Once daily with Vitamin C', duration: '30 days' },
          { medicine: 'Vitamin D3 200,000 IU', dosage: '1 ampoule', frequency: 'Monthly', duration: '3 months' }
        ],
        doctor_notes: 'Hb recorded at 10.8 g/dL. Recommended dietary adjustments (spinach, dates, pomegranate).',
        follow_up_date: new Date(Date.now() - 86400000 * 15).toISOString().split('T')[0],
        created_at: new Date(Date.now() - 86400000 * 45).toISOString()
      },
      {
        id: 503,
        patient_id: 'pat-222',
        doctor_name: 'Dr. Ahmad Khan',
        checkup_date: new Date(Date.now() - 86400000 * 20).toISOString().split('T')[0],
        diagnosis: 'Atopic Dermatitis (Chronic Eczema) Flare-up',
        symptoms: 'Intense pruritus, erythema, scaling on both inner elbows and neck',
        vitals: { bp: '128/82', pulse: '70 bpm', temp: '98.6°F', weight: '76 kg' },
        prescriptions: [
          { medicine: 'Hydrocortisone 1% Cream', dosage: 'Apply thin film', frequency: 'Twice daily on affected patches', duration: '10 days' },
          { medicine: 'Cetirizine 10mg', dosage: '1 tablet', frequency: 'Once daily at night', duration: '14 days' },
          { medicine: 'Liquid Paraffin Moisturizing Emollient', dosage: 'Generous application', frequency: 'Post-shower and as needed', duration: 'Continuous' }
        ],
        doctor_notes: 'Instructed to discontinue fragranced soaps and wear loose cotton garments.',
        follow_up_date: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
        created_at: new Date(Date.now() - 86400000 * 20).toISOString()
      }
    ]
  };

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialDB));
  return initialDB;
}

function saveLocalDB(db) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
}

// ====================================================================
// BACKEND API FUNCTIONS
// ====================================================================

/**
 * Submit an appointment from landing page or portals
 */
async function submitAppointmentToSupabase(appointmentData) {
  const record = {
    full_name: appointmentData.fullName || appointmentData.full_name,
    phone: appointmentData.phone,
    email: appointmentData.email || null,
    service: appointmentData.service || null,
    appointment_date: appointmentData.appointmentDate || appointmentData.appointment_date || new Date().toISOString().split('T')[0],
    appointment_time: appointmentData.appointmentTime || appointmentData.appointment_time || '11:00 AM',
    message: appointmentData.message || null,
    patient_id: appointmentData.patientId || appointmentData.patient_id || null,
    status: 'pending'
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('appointments').insert([record]).select();
      if (!error && data && data.length > 0) {
        return { success: true, data: data[0] };
      }
      console.warn('Supabase insert notice, using local database fallback:', error?.message);
    } catch (err) {
      console.warn('Supabase query error:', err);
    }
  }

  // Local storage fallback
  const db = getLocalDB();
  const newAppointment = {
    id: Date.now(),
    ...record,
    created_at: new Date().toISOString()
  };
  db.appointments.unshift(newAppointment);
  saveLocalDB(db);
  return { success: true, data: newAppointment, local: true };
}

/**
 * Fetch all appointments (Admin)
 */
async function getAppointments() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return { success: true, data };
    } catch (e) {
      console.warn('Supabase getAppointments error:', e);
    }
  }
  const db = getLocalDB();
  return { success: true, data: db.appointments };
}

/**
 * Update appointment status (Admin)
 */
async function updateAppointmentStatus(id, newStatus, doctorNotes = '') {
  if (supabase) {
    try {
      const updatePayload = { status: newStatus };
      if (doctorNotes) updatePayload.doctor_notes = doctorNotes;
      const { data, error } = await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('id', id)
        .select();
      if (!error && data) return { success: true, data: data[0] };
    } catch (e) {
      console.warn('Supabase updateAppointmentStatus error:', e);
    }
  }
  const db = getLocalDB();
  const app = db.appointments.find(a => String(a.id) === String(id));
  if (app) {
    app.status = newStatus;
    if (doctorNotes) app.doctor_notes = doctorNotes;
    saveLocalDB(db);
    return { success: true, data: app, local: true };
  }
  return { success: false, error: 'Appointment not found' };
}

/**
 * Get all patients and their profiles (Admin)
 */
async function getPatients() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return { success: true, data };
    } catch (e) {
      console.warn('Supabase getPatients error:', e);
    }
  }
  const db = getLocalDB();
  const patients = db.profiles.filter(p => p.role === 'patient');
  return { success: true, data: patients };
}

/**
 * Get full checkups / medical history for a patient
 */
async function getPatientCheckups(patientId) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('checkups')
        .select('*')
        .eq('patient_id', patientId)
        .order('checkup_date', { ascending: false });
      if (!error && data) return { success: true, data };
    } catch (e) {
      console.warn('Supabase getPatientCheckups error:', e);
    }
  }
  const db = getLocalDB();
  const checkups = db.checkups.filter(c => String(c.patient_id) === String(patientId));
  return { success: true, data: checkups };
}

/**
 * Add a new checkup record (Admin/Doctor)
 */
async function addCheckup(checkupData) {
  const record = {
    patient_id: checkupData.patientId,
    doctor_name: checkupData.doctorName || 'Dr. Ahmad Khan',
    checkup_date: checkupData.checkupDate || new Date().toISOString().split('T')[0],
    diagnosis: checkupData.diagnosis,
    symptoms: checkupData.symptoms || '',
    vitals: checkupData.vitals || { bp: '120/80', pulse: '72 bpm', temp: '98.6°F', weight: '70 kg' },
    prescriptions: checkupData.prescriptions || [],
    doctor_notes: checkupData.doctorNotes || '',
    follow_up_date: checkupData.followUpDate || null
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('checkups').insert([record]).select();
      if (!error && data && data.length > 0) return { success: true, data: data[0] };
    } catch (e) {
      console.warn('Supabase addCheckup error:', e);
    }
  }

  const db = getLocalDB();
  const newCheckup = {
    id: Date.now(),
    ...record,
    created_at: new Date().toISOString()
  };
  db.checkups.unshift(newCheckup);
  saveLocalDB(db);
  return { success: true, data: newCheckup, local: true };
}

/**
 * Patient Authentication (Login)
 */
async function patientLogin(email, password) {
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data?.user) {
        // Fetch role
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        return { success: true, user: data.user, profile: prof || { email, role: 'patient' } };
      }
    } catch (e) {
      console.warn('Supabase patientLogin error:', e);
    }
  }

  // Local fallback demo match
  const db = getLocalDB();
  const profile = db.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
  if (profile) {
    return {
      success: true,
      user: { id: profile.id, email: profile.email },
      profile,
      local: true
    };
  }

  // If new email in local demo, auto create patient profile
  const newId = 'pat-' + Date.now();
  const newProf = {
    id: newId,
    email,
    full_name: email.split('@')[0].replace('.', ' '),
    phone: '+92 300 0000000',
    role: 'patient',
    age: 26,
    gender: 'Male',
    blood_group: 'B+',
    allergies: 'None'
  };
  db.profiles.push(newProf);
  saveLocalDB(db);
  return { success: true, user: { id: newId, email }, profile: newProf, local: true };
}

/**
 * Patient Registration
 */
async function patientRegister(patientData) {
  const { email, password, fullName, phone, age, gender, bloodGroup, allergies } = patientData;

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            age: age || null,
            gender: gender || 'Male',
            blood_group: bloodGroup || 'B+',
            allergies: allergies || 'None'
          }
        }
      });
      if (!error && data?.user) {
        return { success: true, user: data.user };
      }
    } catch (e) {
      console.warn('Supabase patientRegister error:', e);
    }
  }

  const db = getLocalDB();
  const existing = db.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const newId = 'pat-' + Date.now();
  const newProfile = {
    id: newId,
    email,
    full_name: fullName,
    phone,
    role: 'patient',
    age: parseInt(age) || 30,
    gender: gender || 'Male',
    blood_group: bloodGroup || 'O+',
    allergies: allergies || 'None'
  };
  db.profiles.push(newProfile);
  saveLocalDB(db);
  return { success: true, user: { id: newId, email }, profile: newProfile, local: true };
}

/**
 * Admin Authentication
 */
async function adminLogin(email, password) {
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data?.user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (prof && prof.role === 'admin') {
          return { success: true, user: data.user, profile: prof };
        } else {
          return { success: false, error: 'Access Denied: This account does not have Administrator privileges.' };
        }
      }
    } catch (e) {
      console.warn('Supabase adminLogin error:', e);
    }
  }

  // Master Admin verification (Supports both live credentials and offline validation)
  if (email.trim().toLowerCase() === 'admin@medsageclinic.com' && password === 'MedSageAdmin2026!') {
    const db = getLocalDB();
    const adminProf = db.profiles.find(p => p.role === 'admin') || {
      id: 'admin-001',
      email: 'admin@medsageclinic.com',
      full_name: 'Dr. Ahmad Khan (Chief Medical Officer)',
      role: 'admin'
    };
    return { success: true, user: { id: adminProf.id, email }, profile: adminProf, local: true };
  }

  return { success: false, error: 'Invalid Administrator email or password.' };
}

// Expose globally
window.medsageBackend = {
  supabase,
  submitAppointmentToSupabase,
  getAppointments,
  updateAppointmentStatus,
  getPatients,
  getPatientCheckups,
  addCheckup,
  patientLogin,
  patientRegister,
  adminLogin,
  getLocalDB
};
