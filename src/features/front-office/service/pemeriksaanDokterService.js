// ============================================================
// features/front-office/service/pemeriksaanDokterService.js
// Service untuk Pemeriksaan Dokter (per kunjungan & riwayat per branch).
// Semua section disimpan sebagai JSON di BE (table pemeriksaan_dokter).
// ============================================================

import api from '../../../shared/api.js'

/**
 * Ambil pemeriksaan dokter untuk satu kunjungan (null jika belum ada).
 * @param {string} kunjunganId encodedId kunjungan
 */
export async function fetchPemeriksaanDokter(kunjunganId) {
  const res = await api.get(`/api/kunjungan/${kunjunganId}/pemeriksaan-dokter`)
  return res.data?.data ?? null
}

/**
 * Simpan pemeriksaan dokter (create-or-update).
 * Payload: status, registrasi, ttv, pemeriksaan_fisik, anatomi,
 * riwayat_alergi, riwayat_obat, catatan (semua JSON array/object).
 */
export async function savePemeriksaanDokter(kunjunganId, payload) {
  const res = await api.post(`/api/kunjungan/${kunjunganId}/pemeriksaan-dokter`, payload)
  return res.data?.data
}

/**
 * Daftar riwayat pemeriksaan dokter per branch (opsional filter pasien).
 * @param {number|string} branchId
 * @param {{ pasien_id?: number, limit?: number }} [params]
 */
export async function fetchRiwayatPemeriksaan(branchId, params = {}) {
  if (!branchId) return []
  const res = await api.get('/api/pemeriksaan-dokter', {
    params: { branch_id: branchId, ...params },
  })
  return res.data?.data ?? []
}
