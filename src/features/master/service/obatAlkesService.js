// ============================================================
// features/master/service/obatAlkesService.js
// Service untuk Obat, Alkes & PBF. Data dipisah per branch_id.
// ============================================================

import api from '../../../shared/api.js'

/**
 * Ambil daftar obat/alkes/pbf untuk branch tertentu.
 * @param {number|string} branchId
 * @param {{kategori?: 'obat'|'alkes'|'pbf', q?: string}} [extraParams]
 */
export async function fetchObatAlkes(branchId, extraParams = {}) {
  if (!branchId) return []
  const res = await api.get('/api/obat-alkes', { params: { branch_id: branchId, ...extraParams } })
  return res.data?.data ?? []
}

/**
 * Remote search obat untuk MasterSearch (ul/li).
 */
export async function searchObat(branchId, query, extraParams = {}) {
  const res = await api.get('/api/obat-alkes', { params: { branch_id: branchId, q: query, limit: 25, ...extraParams } })
  return res.data?.data ?? []
}

/**
 * Tambah data baru.
 */
export async function createObatAlkes(payload) {
  const res = await api.post('/api/obat-alkes', payload)
  return res.data?.data
}

/**
 * Update data.
 */
export async function updateObatAlkes(id, payload) {
  const res = await api.put(`/api/obat-alkes/${id}`, payload)
  return res.data?.data
}

/**
 * Hapus data.
 */
export async function deleteObatAlkes(id) {
  const res = await api.delete(`/api/obat-alkes/${id}`)
  return res.data
}
