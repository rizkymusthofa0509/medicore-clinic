import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 500))
    localStorage.setItem('medicore_token', 'demo-token')
    localStorage.setItem('medicore_user', JSON.stringify({ name: username || 'Admin', role: 'admin' }))
    window.dispatchEvent(new Event('auth:changed'))
    setLoading(false)
    const next = new URLSearchParams(location.search).get('next') || '/'
    navigate(next)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col">
      {/* Header Branding */}
      <header className="border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2.5" y="3.5" width="19" height="12" rx="1" fill="none" stroke="white" />
                <rect x="4" y="5" width="6" height="2.5" rx="0.5" fill="var(--accent-primary)" stroke="none" />
                <path d="M9 19h6M12 15.5V19" fill="none" stroke="white" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)]">Medicore Clinic</h1>
              <p className="text-tiny text-[var(--text-muted)]">Sistem Manajemen Klinik Multi-Branch</p>
            </div>
          </div>
          <span className="text-caption text-[var(--text-muted)] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Demo Mode
          </span>
        </div>
      </header>

      {/* Login form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="card p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[var(--brand-primary)] flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2.5" y="3.5" width="19" height="12" rx="1" fill="none" stroke="white" />
                  <rect x="4" y="5" width="6" height="2.5" rx="0.5" fill="var(--accent-primary)" stroke="none" />
                  <path d="M9 19h6M12 15.5V19" fill="none" stroke="white" />
                </svg>
              </div>
              <h2 className="text-display-sm font-bold text-[var(--text-primary)]">Masuk ke Sistem</h2>
              <p className="text-body-sm text-[var(--text-secondary)] mt-1">Akses penuh sebagai Admin</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input"
                  placeholder="Masukkan username"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="label">Kata Sandi</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  defaultValue="demo"
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg">
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>
            <p className="text-center text-tiny text-[var(--text-muted)] mt-4">
              Demo: Masukkan username apapun untuk mengakses.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] bg-[var(--bg-primary)] py-3">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-tiny text-[var(--text-muted)]">
          <span>© 2024 Medicore Clinic. All rights reserved.</span>
          <span>Versi Demo 1.0.0</span>
        </div>
      </footer>
    </div>
  )
}
