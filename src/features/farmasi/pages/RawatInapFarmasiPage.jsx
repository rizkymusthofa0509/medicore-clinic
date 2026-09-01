// ============================================================
// features/farmasi/pages/RawatInapFarmasiPage.jsx
// Verifikasi Farmasi Rawat Inap — alur sama dengan rawat jalan,
// hanya antrian resep difilter tipe_kunjungan = rawat_inap.
// ============================================================

import FarmasiPage from './FarmasiPage.jsx'

export default function RawatInapFarmasiPage() {
  return <FarmasiPage tipeKunjungan="rawat_inap" />
}
