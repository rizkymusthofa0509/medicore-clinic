import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BrandLogo } from './Brand.jsx'
import { toggleTheme } from '../theme.js'
import { getUser, logout } from '../auth.js'
import { ConfirmDialog } from './ui.jsx'
import { getCurrentBranchId, setCurrentBranch } from '../../shared/store/clinic.js'
import { pingServer } from '../api.js'
import api from '../api.js'

const MENU = [
  { group: 'Umum', items: [{ label: 'Dashboard', to: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', end: true }] },

  { group: 'Front Office', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', items: [
    { label: 'Pasien Baru', to: '/pendaftaran-baru', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
    { label: 'Pendaftaran Kunjungan', to: '/pendaftaran-lama', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ]},

  { group: 'Rawat Jalan', icon: 'M13 10V3L4 14h7v7l9-11h-7z', items: [
    { label: 'Pemeriksaan Dokter', to: '/pemeriksaan-dokter', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  ]},

  { group: 'Farmasi', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', items: [
    { label: 'Verifikasi Farmasi', to: '/verifikasi-farmasi', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Penjualan Obat Langsung', to: '/penjualan-langsung', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
  ]},

  { group: 'Kasir', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', items: [
    { label: 'Tagihan Pembayaran', to: '/tagihan', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  ]},

  { group: 'Rawat Inap', icon: 'M3 7v11m0-4h18m0 4V7M6 7v4a2 2 0 002 2h8a2 2 0 002-2V7', items: [
    { label: 'Pendaftaran Rawat Inap', to: '/rawat-inap/pendaftaran-baru', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
    { label: 'Kunjungan Rawat Inap', to: '/rawat-inap/pendaftaran-lama', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: 'Pemeriksaan Dokter', to: '/rawat-inap/pemeriksaan-dokter', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { label: 'Verifikasi Farmasi', to: '/rawat-inap/verifikasi-farmasi', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]},

  { group: 'Laporan', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', items: [
    { label: 'Kunjungan', to: '/kunjungan', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Pendapatan', to: '/pendapatan', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Penjualan Obat', to: '/penjualan-obat', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Operasional', to: '/operasional', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Rekapitulasi', to: '/rekapitulasi', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Jasa Medis', to: '/jasa-medis', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Laboratorium', to: '/laboratorium', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Stok Opname', to: '/stok-opname', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Mutasi Barang', to: '/mutasi-barang', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Pesanan Pembelian', to: '/pesanan-pembelian', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Top 10 Diagnosa', to: '/top-diagnosa', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Kunjungan Terhapus', to: '/kunjungan-terhapus', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Cetak Surat', to: '/cetak-surat', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ]},

  { group: 'Database Pasien', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4', items: [{ label: 'Database Pasien', to: '/database-pasien', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' }] },

  { group: 'Data Master', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4', items: [
    { label: 'Depo Obat', to: '/depo-obat', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { label: 'Unit, Poli, Ruangan', to: '/unit-lokasi', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'Tindakan Medis', to: '/tindakan', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { label: 'Nakes & Pengguna', to: '/nakes-pengguna', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'Obat, Alkes & PBF', to: '/obat-alkes', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { label: 'Perusahaan Asuransi', to: '/asuransi', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { label: 'Aturan Pakai', to: '/aturan-pakai', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  ]},

  { group: 'Setting Aplikasi', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', items: [{ label: 'Setting Aplikasi', to: '/setting', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }] },
]

const PAGE_TITLES = {}
MENU.forEach((g) => g.items.forEach((i) => { PAGE_TITLES[i.to] = i.label }))
PAGE_TITLES['/'] = 'Dashboard'
PAGE_TITLES['/profile'] = 'Profile'

function initialsOf(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function groupContainsPath(group, pathname) {
  return group.items.some((i) => i.to === pathname || (i.end && pathname === '/'))
}

export default function AppShell({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const title = PAGE_TITLES[location.pathname] || 'Medicore Clinic'
  
  // State
  const [user, setUser] = useState(null)
  const [allBranches, setAllBranches] = useState([])
  const [userBranches, setUserBranches] = useState([])
  const [branchId, setBranchIdState] = useState(() => getCurrentBranchId())
  const [serverStatus, setServerStatus] = useState('checking')
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('medicore_sidebar_collapsed') === 'true' } catch { return false }
  })
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [showBranchDropdown, setShowBranchDropdown] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const pingIntervalRef = useRef(null)

  // Load branches from API (only when user is logged in)
  useEffect(() => {
    if (!user) return // Only load after user is loaded
    
    const loadBranches = async () => {
      try {
        const res = await api.get('/api/settings/branches')
        const branches = res.data.data.map(b => ({
          id: String(b.id),
          nama: b.name,
          code: b.code,
          status: b.status
        }))
        setAllBranches(branches)
        console.log('[AppShell] ✅ Loaded branches from API:', branches.length)
      } catch (err) {
        console.error('[AppShell] ❌ Failed to load branches:', err.message)
        // Don't crash - just use empty array
        setAllBranches([])
      }
    }
    loadBranches()
  }, [user])

  // Sidebar collapsed state
  const collapsedRef = useRef(collapsed)
  useEffect(() => {
    try { localStorage.setItem('medicore_sidebar_collapsed', String(collapsed)) } catch {}
    if (collapsedRef.current !== collapsed) {
      collapsedRef.current = collapsed
      window.dispatchEvent(new Event('sidebar:toggled'))
    }
  }, [collapsed])

  // Ping server
  const checkServerConnection = async () => {
    const result = await pingServer()
    setServerStatus(result.online ? 'online' : 'offline')
  }

  useEffect(() => {
    checkServerConnection()
    pingIntervalRef.current = setInterval(checkServerConnection, 30000)
    return () => { if (pingIntervalRef.current) clearInterval(pingIntervalRef.current) }
  }, [])

  // Listen for branch changes
  useEffect(() => {
    const handleBranchChange = () => setBranchIdState(getCurrentBranchId())
    window.addEventListener('branch:changed', handleBranchChange)
    return () => window.removeEventListener('branch:changed', handleBranchChange)
  }, [])

  useEffect(() => { setBranchIdState(getCurrentBranchId()) }, [location.pathname])

  // Load user
  useEffect(() => {
    let cancelled = false
    const load = async () => { 
      const u = await getUser()
      if (cancelled) return
      if (!u) { navigate('/login', { replace: true }); return }
      setUser(u)
      // Set user branches from login data
      if (u.branches && u.branches.length > 0) {
        setUserBranches(u.branches.map(b => ({
          id: String(b.id),
          nama: b.name || b.nama,
          code: b.code,
          isDefault: b.is_default || b.isDefault
        })))
      }
    }
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

  const requestLogout = () => setLogoutOpen(true)
  const confirmLogout = async () => { setLoggingOut(true); try { await logout() } finally { setLoggingOut(false); setLogoutOpen(false); navigate('/login', { replace: true }) } }
  const handleThemeToggle = () => { toggleTheme(); setIsDark(document.documentElement.classList.contains('dark')) }

  // Filter branches based on user access
  const accessibleBranches = userBranches.length > 0 
    ? allBranches.filter(b => userBranches.some(ub => ub.id === b.id))
    : allBranches

  // Debug
  useEffect(() => {
    console.log('[AppShell Debug]', { 
      user: user?.name, 
      userBranches: userBranches.length, 
      allBranches: allBranches.length,
      accessibleBranches: accessibleBranches.length,
      branchId
    })
  }, [user, userBranches, allBranches, accessibleBranches, branchId])

  return (
    <div className="flex min-h-screen bg-[var(--bg-secondary)]">
      {mobileOpen && (<div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />)}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col bg-[var(--bg-primary)] border-r border-[var(--border-primary)] transition-all duration-300 lg:sticky lg:top-0 overflow-visible ${collapsed ? 'w-16' : 'w-60'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`flex h-14 shrink-0 items-center border-b border-[var(--border-primary)] px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && <BrandLogo showTagline={false} />}
          <button 
            type="button" 
            onClick={() => setCollapsed(!collapsed)} 
            className="grid h-8 w-8 place-items-center text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            {collapsed ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            )}
          </button>
        </div>
        
        <nav className={`flex-1 py-3 px-2 ${collapsed ? 'overflow-visible' : 'overflow-y-auto'}`}>
          {MENU.map((g) => (
            <NavGroup key={g.group} group={g} open={openGroups[g.group]} onToggle={() => toggleGroup(g.group)} pathname={location.pathname} collapsed={collapsed} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />
          ))}
        </nav>
        
        <div className="shrink-0 border-t border-[var(--border-primary)] p-2">
          <button type="button" onClick={requestLogout} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors ${collapsed ? 'justify-center' : ''}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
      
      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#1b4332] shadow-lg">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button type="button" onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center text-white/80 hover:bg-white/10 rounded-md lg:hidden">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="min-w-0 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center lg:hidden">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2.5" y="3.5" width="19" height="12" rx="1" fill="none" stroke="white" />
                  <rect x="4" y="5" width="6" height="2.5" rx="0.5" fill="#b7e4c7" stroke="none" />
                  <path d="M9 19h6M12 15.5V19" fill="none" stroke="white" />
                </svg>
              </div>
              <h1 className="truncate text-base font-semibold text-white">{title}</h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {/* Branch Selector Dropdown */}
              {accessibleBranches.length > 0 && (
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                    className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${branchId ? 'text-[#95d5b2] hover:bg-white/10' : 'text-white/60 hover:bg-white/10'}`}
                    title="Pilih Branch"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21V12a4 4 0 014-4v0a4 4 0 014 4v9"/>
                    </svg>
                    {accessibleBranches.find(b => b.id === branchId) && (
                      <span className="hidden sm:block text-xs max-w-[80px] truncate">
                        {accessibleBranches.find(b => b.id === branchId)?.nama || 'Branch'}
                      </span>
                    )}
                  </button>
                  {showBranchDropdown && (
                    <div 
                      className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-2xl py-1.5 z-[99999]"
                      onMouseLeave={() => setShowBranchDropdown(false)}
                    >
                      <div className="px-3 py-1.5 border-b border-[var(--border-primary)]">
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Pilih Branch</span>
                      </div>
                      {accessibleBranches.map(b => {
                        const isActive = b.id === branchId
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setCurrentBranch(b.id)
                              setBranchIdState(b.id)
                              setShowBranchDropdown(false)
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                              isActive 
                                ? 'bg-[var(--bg-hover)] text-[var(--brand-primary)] font-medium' 
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                              <path d="M22 4L12 14.01l-3-3"/>
                            </svg>
                            <span className="truncate flex-1 text-left">{b.nama}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">{b.code}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
              <button 
                type="button" 
                className={`p-2 rounded-lg transition-all ${serverStatus === 'online' ? 'text-emerald-300 hover:bg-white/10' : serverStatus === 'offline' ? 'text-red-300 hover:bg-white/10' : 'text-white/60 hover:bg-white/10'}`}
                title={`Server: ${serverStatus}`}
                onClick={checkServerConnection}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 16h.01M6 16h.01M10 16h.01M14 16h.01M18 16h.01" strokeLinecap="round" />
                  <path d="M2 12h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01" strokeLinecap="round" />
                  <path d="M2 8h.01M6 8h.01M10 8h.01" strokeLinecap="round" />
                  {serverStatus === 'online' && <circle cx="18" cy="8" r="2.5" fill="currentColor" />}
                  {serverStatus === 'offline' && <circle cx="18" cy="8" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />}
                  {serverStatus === 'checking' && <circle cx="18" cy="8" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />}
                </svg>
              </button>
              <button type="button" onClick={handleThemeToggle} className="p-2 rounded-lg text-white/80 hover:bg-white/10">
                {isDark ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                )}
              </button>
              <AccountMenu user={user} onLogout={requestLogout} />
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 pb-16">{children}</main>
        
        <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-2.5 text-xs text-[var(--text-muted)] text-center lg:left-60">
          © {new Date().getFullYear()} Medicore Clinic. All rights reserved.
        </footer>
      </div>
      
      <ConfirmDialog open={logoutOpen} title="Keluar dari aplikasi?" message="Anda akan keluar dari sesi saat ini." confirmLabel={loggingOut ? 'Keluar…' : 'Ya, keluar'} danger onConfirm={confirmLogout} onCancel={() => !loggingOut && setLogoutOpen(false)} />
    </div>
  )
}

function NavGroup({ group, open, onToggle, pathname, collapsed, activeDropdown, setActiveDropdown }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const isActive = groupContainsPath(group, pathname)
  
  if (!group.icon) {
    return (
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavLink 
            key={item.to} 
            to={item.to} 
            end={item.end} 
            className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75"><path d={item.icon} /></svg>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </div>
    )
  }

  if (collapsed) {
    return (
      <div 
        className="relative"
        onMouseEnter={() => setShowDropdown(true)}
        onMouseLeave={() => setShowDropdown(false)}
      >
        <button 
          type="button" 
          className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-colors ${isActive ? 'bg-[var(--brand-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
          title={group.group}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75"><path d={group.icon} /></svg>
        </button>
        {showDropdown && (
          <div 
            className="absolute left-full top-0 ml-2 w-56 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-[var(--shadow-large)] py-2 z-[99999]"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <div className="px-3 py-2 text-[11px] font-bold text-[var(--brand-primary)] uppercase tracking-wider border-b border-[var(--border-primary)]">{group.group}</div>
            {group.items.map((item) => (
              <NavLink 
                key={item.to} 
                to={item.to} 
                end={item.end} 
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${isActive ? 'bg-[var(--bg-hover)] text-[var(--brand-primary)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                onClick={() => setShowDropdown(false)}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75"><path d={item.icon} /></svg>
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      <button 
        type="button" 
        onClick={onToggle} 
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[var(--bg-hover)] text-[var(--brand-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75"><path d={group.icon} /></svg>
        <span className="truncate flex-1 text-left">{group.group}</span>
        <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 6 6 6-6 6" /></svg>
      </button>
      {open && (
        <div className="ml-4 space-y-0.5 border-l-2 border-[var(--border-primary)] pl-2">
          {group.items.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              end={item.end} 
              className={({ isActive }) => `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-[var(--bg-hover)] text-[var(--brand-primary)] font-medium' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
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
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 pl-1.5 pr-2 py-1.5 hover:bg-white/20 transition-colors text-white">
        <span className="grid h-7 w-7 place-items-center rounded-md font-mono text-[0.625rem] font-bold bg-white/25 text-white">{init}</span>
        <span className="hidden text-sm font-medium sm:block max-w-[100px] truncate">{name}</span>
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-[var(--shadow-large)] p-1.5 z-50">
          <div className="px-3 py-2 border-b border-[var(--border-primary)] mb-1"><p className="text-sm font-semibold text-[var(--text-primary)] truncate">{name}</p></div>
          <button type="button" onClick={() => { setOpen(false); navigate('/profile') }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            Profile
          </button>
          <button type="button" onClick={() => { setOpen(false); navigate('/profile?tab=password') }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            Change Password
          </button>
          <div className="my-1 border-t border-[var(--border-primary)]" />
          <button type="button" onClick={() => { setOpen(false); onLogout() }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--status-danger)] hover:bg-red-50 dark:hover:bg-red-900/20">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
