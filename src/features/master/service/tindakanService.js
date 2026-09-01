// ============================================================
// features/master/service/tindakanService.js
// Service untuk Tindakan Medis. Data dipisah per branch_id.
// ============================================================

import api from '../../../shared/api.js'

/**
 * Ambil daftar tindakan medis untuk branch tertentu.
 * @param {number|string} branchId
 * @param {{poli_id?: number|string, q?: string}} [extraParams]
 */
export async function fetchTindakan(branchId, extraParams = {}) {
  if (!branchId) return []
  const res = await api.get('/api/tindakan', { params: { branch_id: branchId, ...extraParams } })
  return res.data?.data ?? []
}

/**
 * Remote search tindakan untuk MasterSearch (ul/li).
 */
export async function searchTindakan(branchId, query, extraParams = {}) {
  const res = await api.get('/api/tindakan', { params: { branch_id: branchId, q: query, ...extraParams } })
  return res.data?.data ?? []
}

/**
 * Tambah tindakan medis baru.
 */
export async function createTindakan(payload) {
  const res = await api.post('/api/tindakan', payload)
  return res.data?.data
}

/**
 * Update tindakan medis.
 */
export async function updateTindakan(id, payload) {
  const res = await api.put(`/api/tindakan/${id}`, payload)
  return res.data?.data
}

/**
 * Hapus tindakan medis.
 */
export async function deleteTindakan(id) {
  const res = await api.delete(`/api/tindakan/${id}`)
  return res.data
}
