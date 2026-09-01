import { useEffect, useState } from 'react'

import { Card, Badge } from '../../../shared/components/ui.jsx'
import { TabelMaster } from '../../../shared/components/TabelMaster.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import MasterPageHeader from '../components/MasterPageHeader.jsx'
import {
  fetchAsuransi,
  createAsuransi,
  updateAsuransi,
  deleteAsuransi,
} from '../service/asuransiService.js'

const EMPTY_FORM = {
  namaPerusahaan: '',
  hargaObatKhusus: false,
  statusAktif: true,
}

export default function AsuransiPage() {
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
      setList(await fetchAsuransi(branchId))
    } catch (err) {
      console.error('[AsuransiPage] Gagal memuat asuransi:', err)
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
    if (!form.namaPerusahaan.trim()) err.namaPerusahaan = 'Wajib diisi'
    return err
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    const err = validate()
    if (Object.keys(err).length > 0) { setErrors(err); return }

    const payload = {
      branch_id: Number(branchId),
      nama_perusahaan: form.namaPerusahaan.trim(),
      harga_obat_khusus: Boolean(form.hargaObatKhusus),
      status_aktif: Boolean(form.statusAktif),
    }

    setSubmitting(true)
    setErrorMsg('')
    setErrors({})
    try {
      if (editingId) {
        await updateAsuransi(editingId, payload)
      } else {
        await createAsuransi(payload)
      }
      setSaved(true)
      setForm(EMPTY_FORM)
      setEditingId(null)
      await load()
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors?.nama_perusahaan) {
        setErrors({ namaPerusahaan: data.errors.nama_perusahaan[0] })
      }
      setErrorMsg(data?.message || (editingId ? 'Gagal memperbarui asuransi' : 'Gagal menyimpan asuransi'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (row) => {
    setForm({
      namaPerusahaan: row.namaPerusahaan || '',
      hargaObatKhusus: Boolean(row.hargaObatKhusus),
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
    if (!confirm('Hapus perusahaan asuransi ini?')) return
    try {
      await deleteAsuransi(id)
      if (editingId === id) handleCancelEdit()
      await load()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus asuransi')
    }
  }

  const columns = [
    { key: 'namaPerusahaan', label: 'Nama Perusahaan', sortable: true },
    {
      key: 'hargaObatKhusus',
      label: 'Harga Obat Khusus',
      width: '170px',
      render: (v) => v ? <Badge variant="warning">Ya</Badge> : <Badge variant="neutral">Tidak</Badge>,
    },
    {
      key: 'statusAktif',
      label: 'Status Aktif',
      width: '130px',
      render: (v) => v ? <Badge variant="success">Ya</Badge> : <Badge variant="danger">Tidak</Badge>,
    },
  ]

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Perusahaan Asuransi"
        description="Kelola daftar perusahaan asuransi yang bekerja sama dengan klinik per cabang."
        branchId={branchId}
      />

      <Card className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
            <h3 className="text-heading-md font-bold text-[var(--text-primary)]">
              {editingId ? 'Edit Asuransi' : 'Tambah Asuransi'}
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
              <label className="label">Nama Perusahaan *</label>
              <input
                type="text"
                value={form.namaPerusahaan}
                onChange={handleChange('namaPerusahaan')}
                className={`input ${errors.namaPerusahaan ? 'input-error' : ''}`}
                placeholder="BPJS Kesehatan / Prudential / dll"
              />
              {errors.namaPerusahaan && <p className="text-tiny text-red-500 mt-0.5">{errors.namaPerusahaan}</p>}
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hargaObatKhusus}
                  onChange={handleChange('hargaObatKhusus')}
                  className="rounded border-[var(--border-primary)]"
                />
                <span className="text-body-sm">Harga Obat Khusus</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.statusAktif}
                  onChange={handleChange('statusAktif')}
                  className="rounded border-[var(--border-primary)]"
                />
                <span className="text-body-sm">Status Aktif</span>
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
              searchKey={['namaPerusahaan']}
              searchPlaceholder="Cari perusahaan asuransi..."
              loading={loading}
              emptyMessage="Belum ada perusahaan asuransi untuk branch ini"
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
