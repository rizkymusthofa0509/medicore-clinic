import { useEffect, useState } from 'react'

import { Card, Badge } from '../../../shared/components/ui.jsx'
import { TabelMaster } from '../../../shared/components/TabelMaster.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import MasterPageHeader from '../components/MasterPageHeader.jsx'
import {
  fetchAturanPakai,
  createAturanPakai,
  updateAturanPakai,
  deleteAturanPakai,
} from '../service/aturanPakaiService.js'

const EMPTY_FORM = {
  aturan: '',
  statusAktif: true,
}

export default function AturanPakaiPage() {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const onBranchChange = () => setBranchId(getCurrentBranchId())
    window.addEventListener('branch:changed', onBranchChange)
    return () => window.removeEventListener('branch:changed', onBranchChange)
  }, [])

  const load = async () => {
    if (!branchId) return
    setLoading(true)
    try {
      setList(await fetchAturanPakai(branchId))
    } catch (err) {
      console.error('[AturanPakaiPage] Gagal memuat aturan pakai:', err)
      setList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [branchId])

  useEffect(() => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setErrors({})
    setErrorMsg('')
  }, [branchId])

  const handleChange = (field) => (e) => {
    const { value, type, checked } = e.target
    setForm((f) => ({ ...f, [field]: type === 'checkbox' ? checked : value }))
  }

  const validate = () => {
    const err = {}
    if (!form.aturan.trim()) err.aturan = 'Wajib diisi'
    return err
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    const err = validate()
    if (Object.keys(err).length > 0) { setErrors(err); return }

    const payload = {
      branch_id: Number(branchId),
      aturan: form.aturan.trim(),
      status_aktif: Boolean(form.statusAktif),
    }

    setSubmitting(true)
    setErrorMsg('')
    setErrors({})
    try {
      if (editingId) {
        await updateAturanPakai(editingId, payload)
      } else {
        await createAturanPakai(payload)
      }
      setSaved(true)
      setForm(EMPTY_FORM)
      setEditingId(null)
      await load()
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors?.aturan) {
        setErrors({ aturan: data.errors.aturan[0] })
      }
      setErrorMsg(data?.message || (editingId ? 'Gagal memperbarui aturan pakai' : 'Gagal menyimpan aturan pakai'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (row) => {
    setForm({
      aturan: row.aturan || '',
      statusAktif: Boolean(row.statusAktif),
    })
    setEditingId(row.id)
    setErrors({})
    setErrorMsg('')
    setSaved(false)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleCancelEdit = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setErrors({})
    setErrorMsg('')
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus aturan pakai ini?')) return
    try {
      await deleteAturanPakai(id)
      if (editingId === id) handleCancelEdit()
      await load()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus aturan pakai')
    }
  }

  const columns = [
    { key: 'aturan', label: 'Aturan Pakai', sortable: true },
    {
      key: 'statusAktif',
      label: 'Status',
      width: '120px',
      render: (v) => v
        ? <Badge variant="success">Aktif</Badge>
        : <Badge variant="neutral">Tidak Aktif</Badge>,
    },
  ]

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Data Aturan Pakai"
        description="Aturan pakai yang akan muncul sebagai opsi pada pembuatan resep."
        branchId={branchId}
      />

      <Card className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
            <h3 className="text-heading-md font-bold text-[var(--text-primary)]">
              {editingId ? 'Edit Aturan Pakai' : 'Tambah Aturan Pakai'}
            </h3>
            {saved && (
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-caption">
                ✓ Berhasil {editingId ? 'diperbarui' : 'disimpan'}
              </div>
            )}
            {errorMsg && (
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-caption">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="label">Aturan Pakai *</label>
              <textarea
                value={form.aturan}
                onChange={handleChange('aturan')}
                className={`input min-h-[88px] ${errors.aturan ? 'input-error' : ''}`}
                placeholder="3x sehari 1 tablet sesudah makan"
                rows={3}
              />
              {errors.aturan && <p className="text-tiny text-red-500 mt-0.5">{errors.aturan}</p>}
              <p className="text-tiny text-[var(--text-muted)] mt-1">
                Teks ini akan muncul di dropdown pilihan aturan pakai pada form resep.
              </p>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.statusAktif}
                  onChange={handleChange('statusAktif')}
                  className="rounded border-[var(--border-primary)]"
                />
                <span className="text-body-sm">Aktif (tampil di dropdown resep)</span>
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary flex-1 disabled:opacity-50">
                {submitting ? 'Menyimpan…' : editingId ? 'Perbarui' : 'Simpan'}
              </button>
              {editingId && (
                <button onClick={handleCancelEdit} className="btn flex-1" type="button">Batal</button>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <TabelMaster
              columns={columns}
              data={list}
              searchKey={['aturan']}
              searchPlaceholder="Cari aturan pakai..."
              loading={loading}
              emptyMessage="Belum ada aturan pakai untuk branch ini"
              actions={[
                { label: 'Edit', onClick: (row) => handleEdit(row) },
                { label: 'Hapus', danger: true, onClick: (row) => handleDelete(row.id) },
              ]}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
