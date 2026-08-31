import { useState, useEffect } from 'react'
import { settingService } from '../service/settingService.js'
import { TabelMaster, ActionDropdown } from '../../../shared/components/TabelMaster.jsx'
import { Modal, useToast } from '../../../shared/components/ui.jsx'

export default function AccountTab() {
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', branch_id: '', is_active: true })
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedBranches, setSelectedBranches] = useState([])
  const toast = useToast()

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
      toast.error('Gagal memuat data')
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
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (editing) {
        await settingService.updateUser(editing.id, payload)
        toast.success('User berhasil diperbarui')
      } else {
        await settingService.createUser(payload)
        toast.success('User berhasil ditambahkan')
      }
      setShowForm(false)
      loadData()
    } catch (err) {
      const msg = err.response?.data?.message || Object.values(err.response?.data?.errors || {})?.[0]?.[0] || 'Gagal menyimpan'
      toast.error(msg)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus user ini?')) return
    try {
      await settingService.deleteUser(id)
      toast.success('User berhasil dihapus')
      loadData()
    } catch (err) {
      toast.error('Gagal menghapus user')
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
      toast.error('Gagal memuat branch user')
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
      toast.success('Branch user berhasil disimpan')
      setShowBranchModal(false)
      loadData()
    } catch (err) {
      toast.error('Gagal menyimpan branch user')
    }
  }

  const columns = [
    { key: 'name', label: 'Nama', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', width: '80px', render: (v) => (
      <span className={`badge ${v === 'admin' ? 'badge-primary' : 'badge-success'}`}>{v}</span>
    )},
    { key: 'branch_name', label: 'Branch' },
    { key: 'is_active', label: 'Status', width: '100px', render: (v) => (
      <span className={`badge ${v ? 'badge-success' : 'badge-danger'}`}>{v ? 'Aktif' : 'Nonaktif'}</span>
    )},
  ]

  const actions = [
    {
      label: 'Set Branch',
      icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21V12a4 4 0 014-4v0a4 4 0 014 4v9"/></svg>,
      onClick: (row) => openBranchModal(row),
    },
    {
      label: 'Edit',
      icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
      onClick: (row) => openEdit(row),
    },
    {
      label: 'Hapus',
      danger: true,
      icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
      onClick: (row) => handleDelete(row.id),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="btn btn-primary">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          Tambah User
        </button>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit User' : 'Tambah User'} size="md">
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
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input" />
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
      </Modal>

      <Modal open={showBranchModal} onClose={() => setShowBranchModal(false)} title={`Branch Access - ${selectedUser?.name || ''}`} size="sm">
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
      </Modal>

      <TabelMaster
        columns={columns}
        data={users}
        searchKey={['name', 'email', 'branch_name']}
        searchPlaceholder="Cari user..."
        loading={loading}
        actions={actions}
      />

      <toast.Container />
    </div>
  )
}
