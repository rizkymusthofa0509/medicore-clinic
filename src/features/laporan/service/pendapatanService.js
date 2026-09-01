// ============================================================
// features/laporan/service/pendapatanService.js
// Service untuk Laporan Pendapatan per branch (GET /api/laporan/pendapatan).
// Data bersumber dari kunjungan (biaya pendaftaran + metode bayar) dan
// pemeriksaan dokter final (obat + tindakan), di-scope branch aktif.
// ============================================================

import api from '../../../shared/api.js'

/**
 * Ambil laporan pendapatan komprehensif branch aktif.
 * @param {number|string} branchId
 * @param {{ date_from?: string, date_to?: string }} [params]
 */
export async function fetchLaporanPendapatan(branchId, params = {}) {
  if (!branchId) return null
  const res = await api.get('/api/laporan/pendapatan', {
    params: { branch_id: branchId, ...params },
  })
  return res.data?.data ?? null
}
