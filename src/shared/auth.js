// ============================================================
// shared/auth.js — Auth management dengan enkripsi localStorage
// Token disimpan terenkripsi, expired hanya saat logout
// ============================================================

import { secureStore, secureRetrieve, secureRemove } from './crypto.js'

const TOKEN_KEY = 'medicore_token'
const USER_KEY = 'medicore_user'

export function getToken() {
  const data = secureRetrieve(TOKEN_KEY)
  return data?.token || null
}

export function isAuthed() {
  return Boolean(getToken())
}

export function clearSession() {
  secureRemove(TOKEN_KEY)
  secureRemove(USER_KEY)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:changed'))
  }
}

export function getUser() {
  return secureRetrieve(USER_KEY)
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
  const token = getToken()
  if (!token) return null
  const user = getUser()
  return user
}

// Simpan token & user setelah login
export function saveAuthData(token, user) {
  secureStore(TOKEN_KEY, { token })
  secureStore(USER_KEY, user)
}
