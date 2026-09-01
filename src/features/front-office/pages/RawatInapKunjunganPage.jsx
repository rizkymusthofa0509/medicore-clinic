// ============================================================
// features/front-office/pages/RawatInapKunjunganPage.jsx
// Pendaftaran Kunjungan Rawat Inap — tabel & alur sama dengan
// rawat jalan, hanya dibedakan tipe_kunjungan = rawat_inap.
// ============================================================

import KunjunganPage from './KunjunganPage.jsx'

export default function RawatInapKunjunganPage() {
  return <KunjunganPage tipeKunjungan="rawat_inap" />
}
