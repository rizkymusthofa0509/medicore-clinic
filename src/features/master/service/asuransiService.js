// ============================================================
// features/master/service/asuransiService.js
// Service untuk Perusahaan Asuransi. Data dipisah per branch_id.
// ============================================================

import api from '../../../shared/api.js'

/**
 * Ambil daftar perusahaan asuransi untuk branch tertentu.
 * @param {number|string} branchId
 */
export async function fetchAsuransi(branchId) {
  if (!branchId) return []
  const res = await api.get('/api/asuransi', { params: { branch_id: branchId } })
  return res.data?.data ?? []
}

/**
 * Tambah perusahaan asuransi baru.
 */
export async function createAsuransi(payload) {
  const res = await api.post('/api/asuransi', payload)
  return res.data?.data
}

/**
 * Update perusahaan asuransi.
 */
export async function updateAsuransi(id, payload) {
  const res = await api.put(`/api/asuransi/${id}`, payload)
  return res.data?.data
}

/**
 * Hapus perusahaan asuransi.
 */
export async function deleteAsuransi(id) {
  const res = await api.delete(`/api/asuransi/${id}`)
  return res.data
}
