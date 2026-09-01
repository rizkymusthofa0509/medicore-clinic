// ============================================================
// features/laporan/service/laporanLanjutanService.js
// Laporan lanjutan (jasa medis, operasional, rekapitulasi, top diagnosa).
// ============================================================

import api from '../../../shared/api.js'

/** GET /api/laporan/lanjutan — pilih jenis: jasa_medis|operasional|rekapitulasi|top_diagnosa */
export async function fetchLaporanLanjutan(branchId, jenis, params = {}) {
  if (!branchId || !jenis) return null
  const res = await api.get('/api/laporan/lanjutan', { params: { branch_id: branchId, jenis, ...params } })
  return res.data?.data ?? null
}
