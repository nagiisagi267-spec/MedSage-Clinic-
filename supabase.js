/**
 * Supabase Backend Integration for MedSage Clinic
 * Project ID: acsmzastgryhkvjulipc
 */

const SUPABASE_URL = 'https://acsmzastgryhkvjulipc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vaE2b8oaJcA_JY_Wib0OgA_WeHPlBDK';

// Initialize Supabase Client
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/**
 * Submit an appointment or inquiry to Supabase
 * @param {Object} appointmentData { fullName, phone, email, service, message }
 */
async function submitAppointmentToSupabase(appointmentData) {
  if (!supabase) {
    console.warn('Supabase client not loaded, falling back to local simulation.');
    return { success: true, data: appointmentData, offline: true };
  }

  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          full_name: appointmentData.fullName,
          phone: appointmentData.phone,
          email: appointmentData.email || null,
          service: appointmentData.service || null,
          message: appointmentData.message || null,
          status: 'pending'
        }
      ])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error sending to Supabase:', err);
    return { success: false, error: err.message };
  }
}

// Expose globally
window.medsageBackend = {
  supabase,
  submitAppointmentToSupabase
};
