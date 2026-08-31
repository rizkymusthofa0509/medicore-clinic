import { useState, useEffect } from 'react'
import { settingService } from '../service/settingService.js'

export default function BranchTab() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', address: '', phone: '', operational_hours: '', status: 'aktif' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadBranches() }, [])

  const loadBranches = async () => {
    setLoading(true)
    try {
      const res = await settingService.getBranches()
      setBranches(res.data.data)
    } catch (err) {
      setError('Gagal memuat data branch')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', code: '', address: '', phone: '', operational_hours: '', status: 'aktif' })
    setShowForm(true)
  }

  const openEdit = (branch) => {
    setEditing(branch)
    setForm({
      name: branch.name,
      code: branch.code,
      address: branch.address || '',
      phone: branch.phone || '',
      operational_hours: branch.operational_hours || '',
      status: branch.status,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (editing) {
        await settingService.updateBranch(editing.id, form)
        setSuccess('Branch berhasil diperbarui')
      } else {
        await settingService.createBranch(form)
        setSuccess('Branch berhasil ditambahkan')
      }
      setShowForm(false)
      loadBranches()
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors? Object.values(err.response.data.errors).flat()[0] : 'Gagal menyimpan data'
      setError(msg)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus branch ini?')) return
    try {
      await settingService.deleteBranch(id)
      setSuccess('Branch berhasil dihapus')
      loadBranches()
    } catch (err) {
      setError('Gagal menghapus branch')
    }
  }

  return (
    <div className="space-y-4">
      {success && <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm border border-emerald-200 dark:border-emerald-800">{success}</div>}
      {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">{error}</div>}

      <div className="flex justify-end">
        <button onClick={openCreate} className="btn btn-primary">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          Tambah Branch
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{editing ? 'Edit Branch' : 'Tambah Branch'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nama Branch *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="label">Kode *</label>
                  <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="input" required />
                </div>
              </div>
              <div>
                <label className="label">Alamat</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Telepon</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="label">Jam Operasional</label>
                  <input value={form.operational_hours} onChange={e => setForm({...form, operational_hours: e.target.value})} className="input" placeholder="08:00 - 20:00" />
                </div>
              </div>
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input">
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Simpan' : 'Tambah'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-primary)]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Kode</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Nama</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Alamat</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">Loading...</td></tr>
            ) : branches.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">Belum ada branch</td></tr>
            ) : (
              branches.map((b, i) => (
                <tr key={b.id} className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--bg-hover)]">
                  <td className="px-4 py-3 text-sm">{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-mono">{b.code}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{b.name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{b.address || '-'}</td>
                  <td className="px-4 py-3"><span className={`badge ${b.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>{b.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(b)} className="btn btn-sm btn-secondary mr-2">Edit</button>
                    <button onClick={() => handleDelete(b.id)} className="btn btn-sm btn-danger">Hapus</button>
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
