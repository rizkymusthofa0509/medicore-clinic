import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login } from '../../../shared/api.js'
import { saveAuthData } from '../../../shared/auth.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await login(email, password)
      const { token, user } = response.data

      saveAuthData(token, user)
      window.dispatchEvent(new Event('auth:changed'))

      const next = new URLSearchParams(location.search).get('next') || '/'
      navigate(next)
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.email?.[0] || 'Gagal periksa koneksi ke server.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/3 rounded-full" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2.5" y="3.5" width="19" height="12" rx="1" fill="none" stroke="white" />
                <rect x="4" y="5" width="6" height="2.5" rx="0.5" fill="#95d5b2" stroke="none" />
                <path d="M9 19h6M12 15.5V19" fill="none" stroke="white" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Medicore Clinic</h1>
              <p className="text-sm text-white/70">Sistem Manajemen Klinik Multi-Branch</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold leading-tight">
                Kelola Klinik Anda<br />
                <span className="text-[#95d5b2]">Secara Profesional</span>
              </h2>
              <p className="mt-4 text-white/80 text-base leading-relaxed">
                Platform manajemen klinik terintegrasi untuk multi-branch. 
                Kelola pasien, rekam medis, farmasi, dan pembayaran dalam satu sistem.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#95d5b2]" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-sm text-white">Multi-Branch</h3>
                <p className="text-xs text-white/60 mt-1">Kelola cabang klinik</p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#95d5b2]" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="font-semibold text-sm text-white">Rekam Medis</h3>
                <p className="text-xs text-white/60 mt-1">Digital & terintegrasi</p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#95d5b2]" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-sm text-white">Farmasi</h3>
                <p className="text-xs text-white/60 mt-1">Stok & penjualan obat</p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#95d5b2]" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-sm text-white">Laporan</h3>
                <p className="text-xs text-white/60 mt-1">Analisis & rekap data</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2.5" y="3.5" width="19" height="12" rx="1" fill="none" stroke="white" />
                <rect x="4" y="5" width="6" height="2.5" rx="0.5" fill="#95d5b2" stroke="none" />
                <path d="M9 19h6M12 15.5V19" fill="none" stroke="white" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Medicore Clinic</h1>
              <p className="text-xs text-[var(--text-muted)]">Sistem Manajemen Klinik</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Selamat Datang Kembali</h2>
            <p className="text-sm text-[var(--text-muted)] mt-2">Masuk ke akun admin Anda untuk melanjutkan</p>
          </div>

          <div className="bg-[var(--bg-primary)] rounded-2xl shadow-[var(--shadow-large)] border border-[var(--border-primary)] p-8">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="admin@medicore.com"
                    autoComplete="email"
                    required
                  />
                  <svg viewBox="0 0 24 24" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 6L12 13 2 6" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="label">Kata Sandi</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="Masukkan kata sandi"
                    autoComplete="current-password"
                    required
                  />
                  <svg viewBox="0 0 24 24" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3 px-4 rounded-xl bg-[var(--brand-primary)] text-white font-semibold text-sm shadow-[var(--shadow-medium)] hover:bg-[var(--brand-hover)] hover:shadow-[var(--shadow-large)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                    </svg>
                    Memproses...
                  </span>
                ) : 'Masuk'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-[#52b788] mt-6">
            Demo: admin@medicore.com / password
          </p>
        </div>
      </div>
    </div>
  )
}
