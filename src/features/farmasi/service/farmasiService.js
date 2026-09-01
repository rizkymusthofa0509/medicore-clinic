// ============================================================
// features/farmasi/service/farmasiService.js
// Servis Farmasi (resep + stok mutasi) — di-scope branch_id.
// ============================================================

import api from '../../../shared/api.js'

/** GET /api/farmasi/resep — antrian resep menunggu verifikasi / dispensed. */
export async function fetchResep(branchId, params = {}) {
  if (!branchId) return []
  const res = await api.get('/api/farmasi/resep', { params: { branch_id: branchId, ...params } })
  return res.data?.data ?? []
}

/** POST /api/farmasi/resep/{id}/dispense — verifikasi + kurangi stok. */
export async function dispenseResep(branchId, id, catatan = '') {
  const res = await api.post(`/api/farmasi/resep/${id}/dispense`, { branch_id: branchId, catatan })
  return res.data
}

/** POST /api/farmasi/resep/{id}/batalkan */
export async function batalkanResep(branchId, id, catatan) {
  const res = await api.post(`/api/farmasi/resep/${id}/batalkan`, { branch_id: branchId, catatan })
  return res.data
}

/** GET /api/farmasi/stok — riwayat mutasi stok. */
export async function fetchMutasiStok(branchId, params = {}) {
  if (!branchId) return []
  const res = await api.get('/api/farmasi/stok', { params: { branch_id: branchId, ...params } })
  return res.data?.data ?? []
}
