import { useEffect, useState } from 'react'

import { Card, Badge } from '../../../shared/components/ui.jsx'
import { TabelMaster } from '../../../shared/components/TabelMaster.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import MasterPageHeader from '../components/MasterPageHeader.jsx'
import {
  fetchDepoObat,
  createDepoObat,
  deleteDepoObat,
} from '../service/depoObatService.js'

export default function DepoObatPage() {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ namaDepo: '', lokasi: '', keterangan: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const onBranchChange = () => setBranchId(getCurrentBranchId())
    window.addEventListener('branch:changed', onBranchChange)
    return () => window.removeEventListener('branch:changed', onBranchChange)
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      setList(await fetchDepoObat(branchId))
    } catch (err) {
      console.error('[DepoObatPage] Gagal memuat depo:', err)
      setList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [branchId])

  const handleSave = async () => {
    const err = {}
    if (!form.namaDepo.trim()) err.namaDepo = 'Wajib diisi'
    if (Object.keys(err).length > 0) { setErrors(err); return }

    setSubmitting(true)
    setErrorMsg('')
    try {
      await createDepoObat({
        branch_id: Number(branchId),
        nama_depo: form.namaDepo.trim(),
        lokasi: form.lokasi.trim() || null,
        keterangan: form.keterangan.trim() || null,
      })
      setSaved(true)
      setForm({ namaDepo: '', lokasi: '', keterangan: '' })
      await load()
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        const fieldErrs = {}
        if (data.errors.nama_depo) fieldErrs.namaDepo = data.errors.nama_depo[0]
        setErrors(fieldErrs)
      }
      setErrorMsg(data?.message || 'Gagal menyimpan depo obat')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus depo ini?')) return
    try {
      await deleteDepoObat(id)
      await load()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus depo')
    }
  }

  const columns = [
    { key: 'namaDepo', label: 'Nama Depo', sortable: true },
    { key: 'lokasi', label: 'Lokasi', sortable: true },
    { key: 'keterangan', label: 'Keterangan' },
    { key: 'status', label: 'Status', render: (v) => (
      <Badge variant={v === 'aktif' ? 'success' : 'neutral'}>{v || 'aktif'}</Badge>
    )},
  ]

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Data Depo Obat"
        description="Kelola depo obat per cabang. Data dipisahkan otomatis per branch."
        branchId={branchId}
      />

      <Card className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
            <h3 className="text-heading-md font-bold text-[var(--text-primary)]">Tambah Depo</h3>
            {saved && <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-caption">✓ Berhasil disimpan</div>}
            {errorMsg && <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-caption">{errorMsg}</div>}
            <div>
              <label className="label">Nama Depo Obat</label>
              <input type="text" value={form.namaDepo} onChange={e => setForm({ ...form, namaDepo: e.target.value })} className={`input ${errors.namaDepo ? 'input-error' : ''}`} placeholder="Depo Utama" />
              {errors.namaDepo && <p className="text-tiny text-red-500 mt-0.5">{errors.namaDepo}</p>}
            </div>
            <div>
              <label className="label">Lokasi</label>
              <input type="text" value={form.lokasi} onChange={e => setForm({ ...form, lokasi: e.target.value })} className="input" placeholder="Lantai 1" />
            </div>
            <div>
              <label className="label">Keterangan</label>
              <input type="text" value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} className="input" />
            </div>
            <button onClick={handleSave} disabled={submitting} className="btn btn-primary w-full disabled:opacity-50">
              {submitting ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>

          <div className="lg:col-span-2">
            <TabelMaster
              columns={columns}
              data={list}
              searchKey={['namaDepo', 'lokasi', 'keterangan']}
              searchPlaceholder="Cari depo..."
              loading={loading}
              emptyMessage="Belum ada depo obat untuk branch ini"
              actions={[
                { label: 'Hapus', variant: 'danger', onClick: (row) => handleDelete(row.id) },
              ]}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
