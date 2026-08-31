import { useState, useEffect } from 'react'
import { settingService } from '../service/settingService.js'

export default function AccountTab() {
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', branch_id: '', is_active: true })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userBranches, setUserBranches] = useState([])
  const [selectedBranches, setSelectedBranches] = useState([])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersRes, branchesRes] = await Promise.all([
        settingService.getUsers(),
        settingService.getBranches(),
      ])
      setUsers(usersRes.data.data)
      setBranches(branchesRes.data.data)
    } catch (err) {
      setError('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', email: '', password: '', role: 'user', branch_id: '', is_active: true })
    setShowForm(true)
  }

  const openEdit = (user) => {
    setEditing(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      branch_id: user.branch_id || '',
      is_active: user.is_active,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (editing) {
        await settingService.updateUser(editing.id, payload)
        setSuccess('User berhasil diperbarui')
      } else {
        await settingService.createUser(payload)
        setSuccess('User berhasil ditambahkan')
      }
      setShowForm(false)
      loadData()
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors? Object.values(err.response.data.errors).flat()[0] : 'Gagal menyimpan data'
      setError(msg)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus user ini?')) return
    try {
      await settingService.deleteUser(id)
      setSuccess('User berhasil dihapus')
      loadData()
    } catch (err) {
      setError('Gagal menghapus user')
    }
  }

  const openBranchModal = async (user) => {
    setSelectedUser(user)
    try {
      const res = await settingService.getUserBranches(user.id)
      const assignedIds = res.data.data.map(b => b.id)
      setSelectedBranches([...assignedIds])
      if (!user.branch_id && assignedIds.length === 0 && branches.length > 0) {
        setSelectedBranches([branches[0].id])
      } else if (user.branch_id && !assignedIds.includes(user.branch_id)) {
        setSelectedBranches([...assignedIds, user.branch_id])
      }
      setShowBranchModal(true)
    } catch (err) {
      setError('Gagal memuat branch user')
    }
  }

  const toggleBranch = (branchId) => {
    setSelectedBranches(prev =>
      prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]
    )
  }

  const saveUserBranches = async () => {
    try {
      const branchesPayload = selectedBranches.map((id, idx) => ({
        id,
        is_default: idx === 0,
      }))
      await settingService.syncUserBranches(selectedUser.id, { branches: branchesPayload })
      setSuccess('Branch user berhasil disimpan')
      setShowBranchModal(false)
      loadData()
    } catch (err) {
      setError('Gagal menyimpan branch user')
    }
  }

  return (
    <div className="space-y-4">
      {success && <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm border border-emerald-200 dark:border-emerald-800">{success}</div>}
      {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">{error}</div>}

      <div className="flex justify-end">
        <button onClick={openCreate} className="btn btn-primary">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          Tambah User
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{editing ? 'Edit User' : 'Tambah User'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nama *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="label">Password {editing ? '(kosongkan jika tidak diubah)' : '*'}</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input"={!editing} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Role</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="input">
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div>
                  <label className="label">Branch Default *</label>
                  <select value={form.branch_id} onChange={e => setForm({...form, branch_id: e.target.value})} className="input" required>
                    <option value="">-- Pilih --</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="rounded" />
                <label htmlFor="is_active" className="text-sm">Aktif</label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Simpan' : 'Tambah'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Assignment Modal */}
      {showBranchModal && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Branch Access - {selectedUser?.name}</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {branches.map(b => (
                <label key={b.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBranches.includes(b.id)}
                    onChange={() => toggleBranch(b.id)}
                    className="rounded"
                  />
                  <span className="text-sm text-[var(--text-primary)]">{b.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">({b.code})</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-[var(--border-primary)]">
              <button onClick={() => setShowBranchModal(false)} className="btn btn-secondary">Batal</button>
              <button onClick={saveUserBranches} className="btn btn-primary">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-primary)]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Nama</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Branch</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]">Belum ada user</td></tr>
            ) : (
              users.map((u, i) => (
                <tr key={u.id} className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--bg-hover)]">
                  <td className="px-4 py-3 text-sm">{i + 1}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{u.email}</td>
                  <td className="px-4 py-3"><span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-success'}`}>{u.role}</span></td>
                  <td className="px-4 py-3 text-sm">{u.branch_name}</td>
                  <td className="px-4 py-3"><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openBranchModal(u)} className="btn btn-sm btn-secondary mr-1">Branch</button>
                    <button onClick={() => openEdit(u)} className="btn btn-sm btn-secondary mr-1">Edit</button>
                    <button onClick={() => handleDelete(u.id)} className="btn btn-sm btn-danger">Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
