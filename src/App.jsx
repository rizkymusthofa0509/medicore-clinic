import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import LoginPage from './features/auth/pages/LoginPage.jsx'
import AppShell from './shared/components/AppShell.jsx'
import { ToastHost } from './shared/components/ui.jsx'
import { bootstrapAuth } from './shared/auth.js'
import DashboardPage from './features/dashboard/pages/DashboardPage.jsx'
import PendaftaranPage from './features/front-office/pages/PendaftaranPage.jsx'
import DatabasePasienPage from './features/front-office/pages/DatabasePasienPage.jsx'
import LaporanKunjunganPage from './features/laporan/pages/LaporanKunjunganPage.jsx'
import PendapatanPage from './features/laporan/pages/PendapatanPage.jsx'
import CetakSuratPage from './features/laporan/pages/CetakSuratPage.jsx'
import KunjunganPage from './features/front-office/pages/KunjunganPage.jsx'
import KunjunganTtvPage from './features/front-office/pages/KunjunganTtvPage.jsx'
import NursingAssessmentPage from './features/front-office/pages/NursingAssessmentPage.jsx'
import PemeriksaanDokterPage from './features/front-office/pages/PemeriksaanDokterPage.jsx'
import KasirPage from './features/kasir/pages/KasirPage.jsx'
import FarmasiPage from './features/farmasi/pages/FarmasiPage.jsx'
import DepoObatPage from './features/master/pages/DepoObatPage.jsx'
import UnitLokasiPage from './features/master/pages/UnitLokasiPage.jsx'
import TindakanPage from './features/master/pages/TindakanPage.jsx'
import NakesPage from './features/master/pages/NakesPage.jsx'
import AsuransiPage from './features/master/pages/AsuransiPage.jsx'
import AturanPakaiPage from './features/master/pages/AturanPakaiPage.jsx'
import ObatAlkesPage from './features/master/pages/ObatAlkesPage.jsx'
import SettingPage from './features/setting/pages/SettingPage.jsx'
import ProfilePage from './features/profile/pages/ProfilePage.jsx'
import { setCurrentBranch } from './shared/store/clinic.js'

function ComingSoon() {
  const location = useLocation()
  const titleMap = {
    'depo-obat': 'Data Depo Obat',
    'unit-lokasi': 'Unit, Poli, Ruangan',
    'tindakan': 'Data Tindakan',
    'nakes-pengguna': 'Data Nakes & Pengguna',
    'obat-alkes': 'Data Obat, Alkes & PBF',
    'asuransi': 'Perusahaan Asuransi',
    'aturan-pakai': 'Data Aturan Pakai',
    'pendaftaran-baru': 'Pendaftaran Pasien Baru',
    'pendaftaran-lama': 'Pendaftaran Kunjungan Pasien',
    'pendaftaran-lama-ttv': 'Pemeriksaan Tanda Tanda Vital (TTV)',
    'laporan-kunjungan': 'Laporan Kunjungan',
    'pemeriksaan-dokter': 'Pemeriksaan Dokter',
    'verifikasi-farmasi': 'Verifikasi Farmasi',
    'janji-kunjungan': 'Janji Kunjungan',
    'database-pasien': 'Database Pasien',
    'setting': 'Setting Aplikasi',
    'tagihan': 'Tagihan Pembayaran',
    'kunjungan': 'Laporan Kunjungan',
    'laboratorium': 'Laporan Laboratorium',
    'stok-opname': 'Laporan Stok Opname',
    'mutasi-barang': 'Laporan Mutasi Barang',
    'pesanan-pembelian': 'Pesanan Pembelian',
    'pendapatan': 'Laporan Pendapatan',
    'operasional': 'Laporan Operasional',
    'rekapitulasi': 'Laporan Rekapitulasi',
    'jasa-medis': 'Pembagian Jasa Medis',
    'penjualan-obat': 'Laporan Penjualan Obat',
    'penjualan-langsung': 'Penjualan Obat Langsung',
    'cetak-surat': 'Cetak Surat Surat',
    'top-diagnosa': 'Top 10 Diagnosa',
    'kunjungan-terhapus': 'Kunjungan Terhapus',
  }

  const getTitle = () => {
    const parts = location.pathname.split('/').filter(Boolean)
    return titleMap[parts[parts.length - 1]] || 'Halaman'
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-[var(--brand-light)] flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-[var(--brand-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-display-sm font-bold text-[var(--text-primary)]">{getTitle()}</h2>
        <p className="text-body-sm text-[var(--text-secondary)] mt-2">
          Halaman ini sedang dalam pengembangan. Fitur akan segera tersedia.
        </p>
      </div>
    </div>
  )
}

function Protected({ children }) {
  const { pathname } = useLocation()
  const [state, setState] = useState({ status: 'checking', profile: null })

  useEffect(() => {
    let cancelled = false
    bootstrapAuth().then(profile => {
      if (cancelled) return
      setState(profile ? { status: 'ok', profile } : { status: 'unauth', profile: null })
    })
    const onChange = () => {
      if (cancelled) return
      bootstrapAuth().then(p => {
        if (cancelled) return
        setState(p ? { status: 'ok', profile: p } : { status: 'unauth', profile: null })
      })
    }
    window.addEventListener('auth:changed', onChange)
    return () => { cancelled = true; window.removeEventListener('auth:changed', onChange) }
  }, [pathname])

  if (state.status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <svg className="h-8 w-8 animate-spin text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
          <path d="m22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    )
  }
  if (state.status === 'unauth') {
    const next = encodeURIComponent(pathname)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return children
}

export default function App() {
  useEffect(() => {
    const stored = localStorage.getItem('medicore_branch')
    if (stored) {
      setCurrentBranch(stored)
    }
  }, [])

  return (
    <>
      <ToastHost />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard */}
        <Route path="/" element={<Protected><AppShell><DashboardPage /></AppShell></Protected>} />

        {/* Data Master (Top Level) */}
        <Route path="/depo-obat" element={<Protected><AppShell><DepoObatPage /></AppShell></Protected>} />
        <Route path="/unit-lokasi" element={<Protected><AppShell><UnitLokasiPage /></AppShell></Protected>} />
        <Route path="/tindakan" element={<Protected><AppShell><TindakanPage /></AppShell></Protected>} />
        <Route path="/nakes-pengguna" element={<Protected><AppShell><NakesPage /></AppShell></Protected>} />
        <Route path="/obat-alkes" element={<Protected><AppShell><ObatAlkesPage /></AppShell></Protected>} />
        <Route path="/asuransi" element={<Protected><AppShell><AsuransiPage /></AppShell></Protected>} />
        <Route path="/aturan-pakai" element={<Protected><AppShell><AturanPakaiPage /></AppShell></Protected>} />

        {/* Rawat Jalan (Top Level) */}
        <Route path="/pendaftaran-baru" element={<Protected><AppShell><PendaftaranPage /></AppShell></Protected>} />
        <Route path="/pendaftaran-lama" element={<Protected><AppShell><KunjunganPage /></AppShell></Protected>} />
        <Route path="/pendaftaran-lama/:kunjunganId/ttv" element={<Protected><AppShell><KunjunganTtvPage /></AppShell></Protected>} />
        <Route path="/pendaftaran-lama/:kunjunganId/nursing-assessment" element={<Protected><AppShell><NursingAssessmentPage /></AppShell></Protected>} />
        <Route path="/laporan-kunjungan" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/pemeriksaan-dokter" element={<Protected><AppShell><PemeriksaanDokterPage /></AppShell></Protected>} />
        <Route path="/verifikasi-farmasi" element={<Protected><AppShell><FarmasiPage /></AppShell></Protected>} />
        <Route path="/janji-kunjungan" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />

        {/* Rawat Inap (Top Level) */}
        <Route path="/rawat-inap/pendaftaran-baru" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/rawat-inap/pendaftaran-lama" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/rawat-inap/laporan-kunjungan" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/rawat-inap/pemeriksaan-dokter" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/rawat-inap/verifikasi-farmasi" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/rawat-inap/janji-kunjungan" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />

        {/* Laporan (Top Level) */}
        <Route path="/kunjungan" element={<Protected><AppShell><LaporanKunjunganPage /></AppShell></Protected>} />
        <Route path="/laboratorium" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/stok-opname" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/mutasi-barang" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/pesanan-pembelian" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/pendapatan" element={<Protected><AppShell><PendapatanPage /></AppShell></Protected>} />
        <Route path="/operasional" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/rekapitulasi" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/jasa-medis" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/penjualan-obat" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/penjualan-langsung" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/cetak-surat" element={<Protected><AppShell><CetakSuratPage /></AppShell></Protected>} />
        <Route path="/top-diagnosa" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />
        <Route path="/kunjungan-terhapus" element={<Protected><AppShell><ComingSoon /></AppShell></Protected>} />

        {/* Database Pasien & Settings */}
        <Route path="/database-pasien" element={<Protected><AppShell><DatabasePasienPage /></AppShell></Protected>} />
        <Route path="/setting" element={<Protected><AppShell><SettingPage /></AppShell></Protected>} />
        <Route path="/profile" element={<Protected><AppShell><ProfilePage /></AppShell></Protected>} />
        <Route path="/tagihan" element={<Protected><AppShell><KasirPage /></AppShell></Protected>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
