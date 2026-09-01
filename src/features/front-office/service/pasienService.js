// ============================================================
// features/front-office/service/pasienService.js
// Service untuk data pasien. Data dipisah per branch_id.
// ============================================================

import api from '../../../shared/api.js'

/**
 * Daftar pasien per branch (maks 100, diurutkan terbaru).
 * @param {number|string} branchId
 * @param {string} [q] keyword pencarian (nama / no_rm / nik)
 */
export async function fetchPasien(branchId, q = '') {
  if (!branchId) return []
  const params = { branch_id: branchId }
  if (q) params.q = q
  const res = await api.get('/api/pasien', { params })
  return res.data?.data ?? []
}

/**
 * Ambil No RM berikutnya yang tersedia untuk branch.
 */
export async function fetchNextNoRm(branchId) {
  if (!branchId) return null
  const res = await api.get('/api/pasien/next-rm', { params: { branch_id: branchId } })
  return res.data?.data?.no_rm ?? null
}

/**
 * Daftarkan pasien baru.
 * Payload menggunakan field name BE (snake_case),
 * lihat PasienController untuk field lengkap.
 */
export async function createPasien(payload) {
  const res = await api.post('/api/pasien', payload)
  return res.data?.data
}

export async function showPasien(id) {
  const res = await api.get(`/api/pasien/${id}`)
  return res.data?.data
}

export async function updatePasien(id, payload) {
  const res = await api.put(`/api/pasien/${id}`, payload)
  return res.data?.data
}

export async function deletePasien(id) {
  const res = await api.delete(`/api/pasien/${id}`)
  return res.data
}
