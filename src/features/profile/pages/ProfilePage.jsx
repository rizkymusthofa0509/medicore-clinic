import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { profileService } from '../service/profileService.js'
import { PageHeader, Card, Input, Btn, Spinner, toast } from '../../../shared/components/ui.jsx'
import { getUser, getToken, saveAuthData } from '../../../shared/auth.js'

export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'password' ? 'password' : 'profile'

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [profileForm, setProfileForm] = useState({ name: '', email: '' })
  const [profileErrors, setProfileErrors] = useState({})

  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' })
  const [passwordErrors, setPasswordErrors] = useState({})

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await profileService.getMe()
      const u = res.data.user
      setUser(u)
      setProfileForm({ name: u.name || '', email: u.email || '' })
    } catch (err) {
      const cached = getUser()
      if (cached) {
        setUser(cached)
        setProfileForm({ name: cached.name || '', email: cached.email || '' })
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshStoredUser = async () => {
    const res = await profileService.getMe()
    saveAuthData(getToken(), res.data.user)
    window.dispatchEvent(new Event('auth:changed'))
    return res.data.user
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileErrors({})
    try {
      const res = await profileService.updateProfile(profileForm)
      const fresh = res.data.user
      setUser(fresh)
      setProfileForm({ name: fresh.name, email: fresh.email })
      await refreshStoredUser().catch(() => {})
      toast('Profil berhasil diperbarui', 'success')
    } catch (err) {
      const errors = err.response?.data?.errors || {}
      setProfileErrors({ name: errors.name?.[0], email: errors.email?.[0] })
      toast(err.response?.data?.message || 'Gagal memperbarui profil', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setSavingPassword(true)
    setPasswordErrors({})
    try {
      await profileService.changePassword(passwordForm)
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' })
      toast('Password berhasil diubah', 'success')
    } catch (err) {
      const errors = err.response?.data?.errors || {}
      setPasswordErrors({
        current_password: errors.current_password?.[0],
        new_password: errors.new_password?.[0],
      })
      toast(err.response?.data?.message || 'Gagal mengubah password', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  const setTab = (tab) => setSearchParams(tab === 'profile' ? {} : { tab })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  const initials = String(user?.name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const branchNames = user?.branches?.map((b) => b.name).join(', ') || user?.branch_name || '-'

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Profile"
        desc="Kelola informasi akun Anda dan ubah password."
      />

      {/* Info Ringkas */}
      <Card padded>
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[var(--brand-light)] font-display text-xl font-bold text-[var(--brand-primary)]">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-[var(--text-primary)]">{user?.name}</p>
            <p className="truncate text-body-sm text-[var(--text-secondary)]">{user?.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="badge badge-primary">{user?.role || '-'}</span>
              <span className="badge badge-success">Aktif</span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 border-t border-[var(--border-primary)] pt-4 sm:grid-cols-2">
          <div>
            <p className="text-caption font-medium text-[var(--text-muted)]">Role</p>
            <p className="text-body-sm font-medium text-[var(--text-primary)] capitalize">{user?.role || '-'}</p>
          </div>
          <div>
            <p className="text-caption font-medium text-[var(--text-muted)]">Branch</p>
            <p className="text-body-sm font-medium text-[var(--text-primary)]">{branchNames}</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-primary)]">
        <button
          type="button"
          onClick={() => setTab('profile')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]' : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)]'}`}
        >
          Informasi Profile
        </button>
        <button
          type="button"
          onClick={() => setTab('password')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'password' ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]' : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)]'}`}
        >
          Change Password
        </button>
      </div>

      {/* Tab Profile */}
      {activeTab === 'profile' && (
        <Card padded>
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Informasi Profile</p>
              <p className="text-caption text-[var(--text-muted)]">Perbarui nama dan email yang tampil di aplikasi.</p>
            </div>
            <Input
              label="Nama"
              id="profile-name"
              value={profileForm.name}
              onChange={(v) => setProfileForm({ ...profileForm, name: v })}
              placeholder="Nama lengkap"
              required
              error={profileErrors.name}
            />
            <Input
              label="Email"
              id="profile-email"
              type="email"
              value={profileForm.email}
              onChange={(v) => setProfileForm({ ...profileForm, email: v })}
              placeholder="nama@email.com"
              required
              error={profileErrors.email}
            />
            <div className="flex justify-end border-t border-[var(--border-primary)] pt-4">
              <Btn type="submit" disabled={savingProfile}>
                {savingProfile ? 'Menyimpan…' : 'Simpan Perubahan'}
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Tab Change Password */}
      {activeTab === 'password' && (
        <Card padded>
          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Ubah Password</p>
              <p className="text-caption text-[var(--text-muted)]">Gunakan minimal 6 karakter.</p>
            </div>
            <Input
              label="Password Saat Ini"
              id="current-password"
              type="password"
              value={passwordForm.current_password}
              onChange={(v) => setPasswordForm({ ...passwordForm, current_password: v })}
              placeholder="Masukkan password saat ini"
              autoComplete="current-password"
              required
              error={passwordErrors.current_password}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Password Baru"
                id="new-password"
                type="password"
                value={passwordForm.new_password}
                onChange={(v) => setPasswordForm({ ...passwordForm, new_password: v })}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
                required
                minLength={6}
                error={passwordErrors.new_password}
              />
              <Input
                label="Konfirmasi Password Baru"
                id="confirm-password"
                type="password"
                value={passwordForm.new_password_confirmation}
                onChange={(v) => setPasswordForm({ ...passwordForm, new_password_confirmation: v })}
                placeholder="Ulangi password baru"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <div className="flex justify-end border-t border-[var(--border-primary)] pt-4">
              <Btn type="submit" disabled={savingPassword}>
                {savingPassword ? 'Menyimpan…' : 'Ubah Password'}
              </Btn>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
