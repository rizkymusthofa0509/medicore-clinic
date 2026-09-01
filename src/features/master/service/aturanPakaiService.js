// ============================================================
// features/master/service/aturanPakaiService.js
// Service untuk Aturan Pakai (dipakai di dropdown resep).
// Data dipisah per branch_id.
// ============================================================

import api from '../../../shared/api.js'

/**
 * Ambil daftar aturan pakai untuk branch tertentu.
 * @param {number|string} branchId
 * @param {{only_active?: boolean, q?: string}} [extraParams]
 */
export async function fetchAturanPakai(branchId, extraParams = {}) {
  if (!branchId) return []
  const res = await api.get('/api/aturan-pakai', { params: { branch_id: branchId, ...extraParams } })
  return res.data?.data ?? []
}

/**
 * Remote search aturan pakai untuk MasterSearch (ul/li).
 */
export async function searchAturanPakai(branchId, query, extraParams = {}) {
  const res = await api.get('/api/aturan-pakai', { params: { branch_id: branchId, q: query, ...extraParams } })
  return res.data?.data ?? []
}

/**
 * Tambah aturan pakai baru.
 */
export async function createAturanPakai(payload) {
  const res = await api.post('/api/aturan-pakai', payload)
  return res.data?.data
}

/**
 * Update aturan pakai.
 */
export async function updateAturanPakai(id, payload) {
  const res = await api.put(`/api/aturan-pakai/${id}`, payload)
  return res.data?.data
}

/**
 * Hapus aturan pakai.
 */
export async function deleteAturanPakai(id) {
  const res = await api.delete(`/api/aturan-pakai/${id}`)
  return res.data
}
