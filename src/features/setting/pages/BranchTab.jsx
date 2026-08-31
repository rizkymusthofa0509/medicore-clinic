import { useState, useEffect } from 'react'
import { settingService } from '../service/settingService.js'
import { TabelMaster } from '../../../shared/components/TabelMaster.jsx'
import { Modal, useToast } from '../../../shared/components/ui.jsx'

export default function BranchTab() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', address: '', phone: '', operational_hours: '', status: 'aktif' })
  const toast = useToast()

  useEffect(() => { loadBranches() }, [])

  const loadBranches = async () => {
    setLoading(true)
    try {
      const res = await settingService.getBranches()
      setBranches(res.data.data)
    } catch (err) {
      toast.error('Gagal memuat data branch')
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
    try {
      if (editing) {
        await settingService.updateBranch(editing.id, form)
        toast.success('Branch berhasil diperbarui')
      } else {
        await settingService.createBranch(form)
        toast.success('Branch berhasil ditambahkan')
      }
      setShowForm(false)
      loadBranches()
    } catch (err) {
      const msg = err.response?.data?.message || Object.values(err.response?.data?.errors || {})?.[0]?.[0] || 'Gagal menyimpan'
      toast.error(msg)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus branch ini?')) return
    try {
      await settingService.deleteBranch(id)
      toast.success('Branch berhasil dihapus')
      loadBranches()
    } catch (err) {
      toast.error('Gagal menghapus branch')
    }
  }

  const columns = [
    { key: 'code', label: 'Kode', sortable: true, width: '100px' },
    { key: 'name', label: 'Nama Branch', sortable: true },
    { key: 'address', label: 'Alamat', render: (v) => v || '-' },
    { key: 'phone', label: 'Telepon', render: (v) => v || '-' },
    { key: 'status', label: 'Status', width: '100px', render: (v) => (
      <span className={`badge ${v === 'aktif' ? 'badge-success' : 'badge-danger'}`}>{v}</span>
    )},
  ]

  const actions = [
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
          Tambah Branch
        </button>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Branch' : 'Tambah Branch'} size="md">
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
      </Modal>

      <TabelMaster
        columns={columns}
        data={branches}
        searchKey={['name', 'code', 'address']}
        searchPlaceholder="Cari branch..."
        loading={loading}
        actions={actions}
      />

      <toast.Container />
    </div>
  )
}
