// ============================================================
// features/front-office/service/kunjunganService.js
// Service untuk Pendaftaran Kunjungan (rawat jalan & inap).
// Data dipisah per branch_id.
// ============================================================

import api from '../../../shared/api.js'

/**
 * Ambil daftar kunjungan per branch.
 * @param {number|string} branchId
 * @param {{
 *   q?: string,
 *   tipe?: 'rawat_jalan'|'rawat_inap',
 *   status?: string,
 *   date_from?: string,
 *   date_to?: string,
 *   pasien_id?: number,
 *   limit?: number,
 * }} [params]
 */
export async function fetchKunjungan(branchId, params = {}) {
  if (!branchId) return []
  const res = await api.get('/api/kunjungan', {
    params: { branch_id: branchId, ...params },
  })
  return res.data?.data ?? []
}

/**
 * Ambil nomor pendaftaran berikutnya untuk branch.
 * Format: KJN-YYYYMMDD-XXXX
 */
export async function fetchNextNomorKunjungan(branchId, tipe = 'rawat_jalan') {
  if (!branchId) return null
  const res = await api.get('/api/kunjungan/next-nomor', {
    params: { branch_id: branchId, tipe },
  })
  return res.data?.data?.no_pendaftaran ?? null
}

/**
 * Daftarkan kunjungan baru.
 * Payload menggunakan field name BE (snake_case).
 */
export async function createKunjungan(payload) {
  const res = await api.post('/api/kunjungan', payload)
  return res.data?.data
}

export async function showKunjungan(id) {
  const res = await api.get(`/api/kunjungan/${id}`)
  return res.data?.data
}

export async function updateKunjungan(id, payload) {
  const res = await api.put(`/api/kunjungan/${id}`, payload)
  return res.data?.data
}

export async function deleteKunjungan(id) {
  const res = await api.delete(`/api/kunjungan/${id}`)
  return res.data
}

/**
 * Simpan Tanda Tanda Vital (TTV) untuk kunjungan.
 * Payload fields: keluhan_utama, suhu, saturasi_oksigen, kesadaran,
 * tinggi_badan, berat_badan, lingkar_perut, imt, sistole, diastole,
 * respiratory_rate, heart_rate, catatan_ttv
 * @returns transformed kunjungan object (with relations)
 */
export async function saveTtv(kunjunganId, payload) {
  const res = await api.post(`/api/kunjungan/${kunjunganId}/ttv`, payload)
  return res.data?.data
}

/**
 * Ambil data asesmen keperawatan (atau null jika belum ada).
 * @returns {subjektif,objektif,asesmen,plan,implementasi,evaluasi,created_at} | null
 */
export async function fetchNursingAssessment(kunjunganId) {
  const res = await api.get(`/api/kunjungan/${kunjunganId}/nursing-assessment`)
  return res.data?.data ?? null
}

/**
 * Simpan asesmen keperawatan (create-or-update SOAPIE).
 * @returns transformed kunjungan object (with relations)
 */
export async function saveNursingAssessment(kunjunganId, payload) {
  const res = await api.post(`/api/kunjungan/${kunjunganId}/nursing-assessment`, payload)
  return res.data?.data
}