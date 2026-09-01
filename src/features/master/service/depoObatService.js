// ============================================================
// features/master/service/depoObatService.js
// Service untuk Depo Obat. Data dipisah per branch_id.
// ============================================================

import api from '../../../shared/api.js'

/**
 * Ambil daftar depo obat untuk branch tertentu.
 * @param {number|string} branchId
 */
export async function fetchDepoObat(branchId) {
  if (!branchId) return []
  const res = await api.get('/api/depo-obat', { params: { branch_id: branchId } })
  return res.data?.data ?? []
}

/**
 * Tambah depo obat baru.
 * @param {{branch_id:number, nama_depo:string, lokasi?:string, keterangan?:string}} payload
 */
export async function createDepoObat(payload) {
  const res = await api.post('/api/depo-obat', payload)
  return res.data?.data
}

/**
 * Update depo obat.
 * @param {number|string} id
 * @param {{nama_depo?:string, lokasi?:string, keterangan?:string, status?:string}} payload
 */
export async function updateDepoObat(id, payload) {
  const res = await api.put(`/api/depo-obat/${id}`, payload)
  return res.data?.data
}

/**
 * Hapus depo obat.
 * @param {number|string} id
 */
export async function deleteDepoObat(id) {
  const res = await api.delete(`/api/depo-obat/${id}`)
  return res.data
}
