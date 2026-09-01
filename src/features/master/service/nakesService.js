// ============================================================
// features/master/service/nakesService.js
// Service untuk Nakes (Dokter, Perawat, Bidan, Analis Lab).
// Data dipisah per branch_id.
// ============================================================

import api from '../../../shared/api.js'

/**
 * Ambil daftar nakes untuk branch tertentu.
 * @param {number|string} branchId
 * @param {{tipe?: 'dokter'|'perawat'|'bidan'|'analis_lab', q?: string}} [extraParams]
 */
export async function fetchNakes(branchId, extraParams = {}) {
  if (!branchId) return []
  const res = await api.get('/api/nakes', { params: { branch_id: branchId, ...extraParams } })
  return res.data?.data ?? []
}

/**
 * Remote search nakes untuk MasterSearch (ul/li).
 */
export async function searchNakes(branchId, query, extraParams = {}) {
  const res = await api.get('/api/nakes', { params: { branch_id: branchId, q: query, ...extraParams } })
  return res.data?.data ?? []
}

/**
 * Tambah nakes baru.
 */
export async function createNakes(payload) {
  const res = await api.post('/api/nakes', payload)
  return res.data?.data
}

/**
 * Update nakes.
 */
export async function updateNakes(id, payload) {
  const res = await api.put(`/api/nakes/${id}`, payload)
  return res.data?.data
}

/**
 * Hapus nakes.
 */
export async function deleteNakes(id) {
  const res = await api.delete(`/api/nakes/${id}`)
  return res.data
}
