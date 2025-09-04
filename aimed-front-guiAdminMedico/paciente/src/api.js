// api.js — capa simple que ahora usa localStorage.
// Más adelante podrás cambiar estos métodos para llamar a tu backend (VITE_API_BASE).
const STORAGE_KEY = 'patient.profile.v1';

export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }));
  return true;
}

export function sendSymptomMessage(_text) {
  // Por ahora solo simulamos la respuesta del sistema.
  // En el futuro: POST `${import.meta.env.VITE_API_BASE}/patient/symptoms`
  return { ok: true };
}
