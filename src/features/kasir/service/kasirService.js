// ============================================================
// features/kasir/service/kasirService.js
// Servis kasir & pembayaran — semua di-scope branch_id.
// ============================================================

import api from '../../../shared/api.js'

/**
 * GET /api/kasir/tagihan
 * @param {string} branchId
 * @param {{status?:string, date_from?:string, date_to?:string, q?:string, limit?:number}} params
 */
export async function fetchTagihan(branchId, params = {}) {
  if (!branchId) return []
  const res = await api.get('/api/kasir/tagihan', { params: { branch_id: branchId, ...params } })
  return res.data?.data ?? []
}

/** Detail tagihan (termasuk rincian obat/tindakan) untuk cetak struk / proses bayar. */
export async function fetchTagihanDetail(branchId, id) {
  if (!branchId || !id) return null
  const res = await api.get(`/api/kasir/tagihan/${id}`, { params: { branch_id: branchId } })
  return res.data?.data ?? null
}

/**
 * POST proses pembayaran.
 * @param {string} branchId
 * @param {string|number} id
 * @param {{jumlah_dibayarkan:number, metode_pembayaran:string, catatan?:string}} payload
 */
export async function bayarTagihan(branchId, id, payload) {
  const res = await api.post(`/api/kasir/tagihan/${id}/bayar`, { branch_id: branchId, ...payload })
  return res.data
}

export async function fetchStruk(branchId, id) {
  return fetchTagihanDetail(branchId, id)
}
