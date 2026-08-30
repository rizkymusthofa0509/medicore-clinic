// ============================================================
// shared/auth.js — Demo auth untuk Medicore Clinic
// Token & profile disimpa di localStorage (tanpa enkripsi).
// ============================================================

const TOKEN_KEY = 'medicore_token'
const USER_KEY = 'medicore_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function isAuthed() {
  return Boolean(getToken())
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:changed'))
  }
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getUserName() {
  return getUser()?.name || 'User'
}

export function getUserRole() {
  return getUser()?.role || null
}

export function logout() {
  clearSession()
}

export async function bootstrapAuth() {
  return getToken() ? getUser() : null
}
