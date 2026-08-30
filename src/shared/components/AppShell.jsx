import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BrandLogo } from './Brand.jsx'
import { toggleTheme } from '../theme.js'
import { getUser, logout } from '../auth.js'
import { ConfirmDialog } from './ui.jsx'
import { getBranches, getCurrentBranchId, setCurrentBranch } from '../../shared/store/clinic.js'

const MENU = [
  { group: 'Umum', items: [{ label: 'Dashboard', to: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', end: true }] },
  { group: 'Data Master', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4', items: [
    { label: 'Depo Obat', to: '/depo-obat', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { label: 'Unit Lokasi', to: '/unit-lokasi', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'Poliklinik', to: '/poliklinik', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { label: 'Tindakan Medis', to: '/tindakan', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { label: 'Nakes & Pengguna', to: '/nakes-pengguna', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Obat, Alkes & PBF', to: '/obat-alkes', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { label: 'Perusahaan Asuransi', to: '/asuransi', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { label: 'Aturan Pakai', to: '/aturan-pakai', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  ]},
  { group: 'Rawat Jalan', icon: 'M13 10V3L4 14h7v7l9-11h-7z', items: [
    { label: 'Pendaftaran Baru', to: '/pendaftaran-baru', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
    { label: 'Pendaftaran Lama', to: '/pendaftaran-lama', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: 'Laporan Kunjungan', to: '/laporan-kunjungan', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Pemeriksaan Dokter', to: '/pemeriksaan-dokter', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { label: 'Verifikasi Farmasi', to: '/verifikasi-farmasi', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Janji Kunjungan', to: '/janji-kunjungan', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ]},
  { group: 'Rawat Inap', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', items: [
    { label: 'Pendaftaran Baru', to: '/rawat-inap/pendaftaran-baru', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
    { label: 'Pendaftaran Lama', to: '/rawat-inap/pendaftaran-lama', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: 'Laporan Kunjungan', to: '/rawat-inap/laporan-kunjungan', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Pemeriksaan Dokter', to: '/rawat-inap/pemeriksaan-dokter', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { label: 'Verifikasi Farmasi', to: '/rawat-inap/verifikasi-farmasi', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Janji Kunjungan', to: '/rawat-inap/janji-kunjungan', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ]},
  { group: 'Laporan', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', items: [
    { label: 'Kunjungan', to: '/kunjungan', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Laboratorium', to: '/laboratorium', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { label: 'Stok Opname', to: '/stok-opname', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { label: 'Mutasi Barang Internal', to: '/mutasi-barang', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { label: 'Pesanan Pembelian', to: '/pesanan-pembelian', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { label: 'Pendapatan', to: '/pendapatan', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Operasional', to: '/operasional', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { label: 'Rekapitulasi', to: '/rekapitulasi', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { label: 'Jasa Medis', to: '/jasa-medis', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Penjualan Obat', to: '/penjualan-obat', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Penjualan Langsung', to: '/penjualan-langsung', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { label: 'Cetak Surat', to: '/cetak-surat', icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' },
    { label: 'Top 10 Diagnosa', to: '/top-diagnosa', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { label: 'Kunjungan Terhapus', to: '/kunjungan-terhapus', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
  ]},
  { group: 'Database Pasien', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4', items: [{ label: 'Database Pasien', to: '/database-pasien', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' }] },
  { group: 'Setting Aplikasi', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', items: [{ label: 'Setting Aplikasi', to: '/setting', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }] },
  { group: 'Tagihan Pembayaran', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', items: [{ label: 'Tagihan Pembayaran', to: '/tagihan', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' }] },
]

const PAGE_TITLES = {}
MENU.forEach((g) => g.items.forEach((i) => { PAGE_TITLES[i.to] = i.label }))
PAGE_TITLES['/'] = 'Dashboard'

function initialsOf(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function groupContainsPath(group, pathname) {
  return group.items.some((i) => i.to === pathname || (i.end && pathname === '/'))
}

function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  useEffect(() => {
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onKey) }
  }, [])
  const name = user?.name || 'User'
  const init = initialsOf(name)
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] pl-1.5 pr-2 py-1.5 hover:bg-[var(--bg-hover)] transition-colors" title="Akun" aria-haspopup="menu" aria-expanded={open}>
        <span className="grid h-7 w-7 place-items-center rounded-md font-mono text-[0.625rem] font-bold bg-[var(--brand-primary)] text-white">{init}</span>
        <span className="hidden text-body-sm font-medium text-[var(--text-primary)] sm:block max-w-[100px] truncate">{name}</span>
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-[var(--shadow-elevated)] p-1.5 z-50">
          <div className="px-3 py-2 border-b border-[var(--border-primary)] mb-1"><p className="text-body-sm font-semibold text-[var(--text-primary)] truncate">{name}</p></div>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); navigate('/setting') }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            <span className="flex-1 text-left">Profile</span>
          </button>
          <div className="my-1 border-t border-[var(--border-primary)]" />
          <button type="button" role="menuitem" onClick={() => { setOpen(false); onLogout() }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>
            <span className="flex-1 text-left">Logout</span>
          </button>
        </div>
      )}
    </div>
  )
}

function HeaderThemeToggle() {
  const [isDark, setIsDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))
  useEffect(() => { const sync = () => setIsDark(document.documentElement.classList.contains('dark')); window.addEventListener('theme-changed', sync); return () => window.removeEventListener('theme-changed', sync) }, [])
  const handle = () => { toggleTheme(); window.dispatchEvent(new Event('theme-changed')) }
  return (
    <button type="button" onClick={handle} className="btn btn-secondary btn-icon" title={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'} aria-label="Toggle theme">
      {isDark ? (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>) : (<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>)}
    </button>
  )
}

function NavGroup({ group, open, onToggle, pathname, collapsed }) {
  const [hovered, setHovered] = useState(false)
  
  if (!group.icon) {
    return (
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75"><path d={item.icon} /></svg>
            {!collapsed && <span className="truncate flex-1">{item.label}</span>}
          </NavLink>
        ))}
      </div>
    )
  }

  const isActive = groupContainsPath(group, pathname)
  
  // Collapsed mode: show icon only, hover shows dropdown
  if (collapsed) {
    return (
      <div 
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button 
          type="button" 
          className={`nav-item justify-center ${isActive ? 'nav-item-active' : ''}`}
          title={group.group}
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75"><path d={group.icon} /></svg>
        </button>
        {hovered && (
          <div className="absolute left-full top-0 ml-2 w-56 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-[var(--shadow-elevated)] py-2 z-[100]">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{group.group}</div>
            {group.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-sub-item ${isActive ? 'nav-sub-item-active' : ''}`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75"><path d={item.icon} /></svg>
                <span className="truncate flex-1">{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Expanded mode: show full accordion
  return (
    <div className="nav-group">
      <button type="button" onClick={onToggle} className={`nav-group-header ${isActive ? 'text-[var(--text-primary)]' : ''}`} aria-expanded={open}>
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75"><path d={group.icon} /></svg>
        <span className="truncate">{group.group}</span>
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 shrink-0 nav-chevron ${open ? 'nav-chevron-open' : ''}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 6 6 6-6 6" /></svg>
      </button>
      <div className={`nav-group-children ${open ? 'nav-group-children-expanded' : 'nav-group-children-collapsed'}`}>
        {group.items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-sub-item ${isActive ? 'nav-sub-item-active' : ''}`}>
            <span className="nav-sub-dot" aria-hidden="true" />
            <span className="truncate flex-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default function AppShell({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const title = PAGE_TITLES[location.pathname] || 'Medicore Clinic'
  const [user, setUser] = useState(null)
  const [branchId, setBranchIdState] = useState(() => getCurrentBranchId())
  
  // Sidebar collapsed state - persisted to localStorage
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('medicore_sidebar_collapsed') === 'true' } catch { return false }
  })
  
  useEffect(() => {
    try { localStorage.setItem('medicore_sidebar_collapsed', String(collapsed)) } catch { /* ignore */ }
  }, [collapsed])
  
  useEffect(() => { setBranchIdState(getCurrentBranchId()) }, [location.pathname])
  useEffect(() => {
    let cancelled = false
    const load = async () => { const u = await getUser(); if (cancelled) return; if (!u) { navigate('/login', { replace: true }); return }; setUser(u) }
    load()
    const onChange = () => load()
    window.addEventListener('auth:changed', onChange)
    return () => { cancelled = true; window.removeEventListener('auth:changed', onChange) }
  }, [navigate])
  useEffect(() => { document.title = `${title} · Medicore Clinic` }, [title])
  useEffect(() => { setMobileOpen(false) }, [location.pathname])
  const toggleGroup = (groupName) => { setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] })) }
  const [openGroups, setOpenGroups] = useState(() => { const initial = {}; MENU.forEach((g) => { if (g.icon) initial[g.group] = groupContainsPath(g, location.pathname) }); return initial })
  useEffect(() => { setOpenGroups((prev) => { const next = { ...prev }; MENU.forEach((g) => { if (g.icon && groupContainsPath(g, location.pathname)) next[g.group] = true }); return next }) }, [location.pathname])
  const [logoutOpen, setLogoutOpen] = useState(false)
  const requestLogout = () => setLogoutOpen(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const confirmLogout = async () => { setLoggingOut(true); try { await logout() } finally { setLoggingOut(false); setLogoutOpen(false); navigate('/login', { replace: true }) } }

  const sidebarWidth = collapsed ? 'w-16' : 'w-64'
  const footerLeft = collapsed ? 'left-16' : 'left-64'

  return (
    <div className="flex min-h-screen items-start">
      {mobileOpen && (<div className="fixed inset-0 z-40 bg-[rgb(15_23_42_/_0.4)] backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />)}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-[var(--border-primary)] bg-[var(--bg-primary)] transition-all duration-300 lg:sticky lg:top-0 lg:h-[100vh] ${sidebarWidth} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`flex h-14 shrink-0 items-center border-b border-[var(--border-primary)] px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && <BrandLogo showTagline={false} />}
          <button 
            type="button" 
            onClick={() => setCollapsed(!collapsed)} 
            className="grid h-8 w-8 place-items-center text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            )}
          </button>
        </div>
        <nav className={`flex-1 overflow-y-auto py-3 ${collapsed ? 'px-2' : 'px-3'}`}>
          {MENU.map((g) => (
            <NavGroup key={g.group} group={g} open={openGroups[g.group]} onToggle={() => toggleGroup(g.group)} pathname={location.pathname} collapsed={collapsed} />
          ))}
        </nav>
        <div className="shrink-0 border-t border-[var(--border-primary)] p-3">
          <button type="button" onClick={requestLogout} className={`btn btn-secondary w-full ${collapsed ? 'justify-center px-2' : ''}`} title="Keluar">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
      
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button type="button" onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-md lg:hidden" title="Buka menu">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="min-w-0"><h1 className="truncate text-base font-semibold tracking-tight text-[var(--text-primary)]">{title}</h1></div>
            <div className="ml-auto flex items-center gap-2">
              <select value={branchId} onChange={(e) => { setCurrentBranch(e.target.value); setBranchIdState(e.target.value) }} className="input input-sm flex-none w-40" title="Pilih Branch">{getBranches().map(b => (<option key={b.id} value={b.id}>{b.nama}</option>))}</select>
              <button type="button" className="btn btn-secondary btn-icon" title="Koneksi Server - Online">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M2 16h.01M6 16h.01M10 16h.01M14 16h.01M18 16h.01" strokeLinecap="round" />
                  <path d="M2 12h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01" strokeLinecap="round" />
                  <path d="M2 8h.01M6 8h.01M10 8h.01" strokeLinecap="round" />
                  <circle cx="18" cy="8" r="2" fill="#41668a" stroke="#41668a" />
                </svg>
              </button>
              <HeaderThemeToggle />
              <AccountMenu onLogout={requestLogout} />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 pb-16">{children}</main>
        <footer className={`fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 sm:px-6 py-2.5 text-tiny text-[var(--text-muted)] sm:text-left text-center lg:${footerLeft}`}>© {new Date().getFullYear()} Medicore Clinic. All rights reserved.</footer>
      </div>
      <ConfirmDialog open={logoutOpen} title="Keluar dari aplikasi?" message="Anda akan keluar dari sesi saat ini." confirmLabel={loggingOut ? 'Keluar…' : 'Ya, keluar'} danger onConfirm={confirmLogout} onCancel={() => !loggingOut && setLogoutOpen(false)} />
    </div>
  )
}
