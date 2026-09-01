// ============================================================
// features/front-office/pages/RawatInapPemeriksaanPage.jsx
// Pemeriksaan Dokter Rawat Inap — alur sama dengan rawat jalan,
// hanya antrian difilter tipe_kunjungan = rawat_inap.
// ============================================================

import PemeriksaanDokterPage from './PemeriksaanDokterPage.jsx'

export default function RawatInapPemeriksaanPage() {
  return <PemeriksaanDokterPage tipeKunjungan="rawat_inap" />
}
