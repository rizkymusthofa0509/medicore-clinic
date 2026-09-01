import { useEffect, useState } from 'react'

import { Card, Badge } from '../../../shared/components/ui.jsx'
import { TabelMaster } from '../../../shared/components/TabelMaster.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import MasterPageHeader from '../components/MasterPageHeader.jsx'
import { fetchPoli } from '../service/poliService.js'
import {
  fetchTindakan,
  createTindakan,
  updateTindakan,
  deleteTindakan,
} from '../service/tindakanService.js'

const EMPTY_FORM = {
  kelompokTindakan: '',
  kodeICD9: '',
  namaTindakan: '',
  poliId: '',
  jumlahBiaya: 0,
  // Jasa Dokter
  jasaDokter: 0,
  persentaseDokter: 0,
  rupiahDokter: 0,
  // Jasa Asisten
  jasaAsisten: 0,
  persentaseAsisten: 0,
  rupiahAsisten: 0,
  // Jasa Klinik
  jasaKlinik: 0,
  persentaseKlinik: 0,
  rupiahKlinik: 0,
  status: 'aktif',
}

export default function TindakanPage() {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [tindakanList, setTindakanList] = useState([])
  const [poliList, setPoliList] = useState([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onBranchChange = () => setBranchId(getCurrentBranchId())
    window.addEventListener('branch:changed', onBranchChange)
    return () => window.removeEventListener('branch:changed', onBranchChange)
  }, [])

  const loadTindakan = async () => {
    setLoading(true)
    try {
      setTindakanList(await fetchTindakan(branchId))
    } catch (err) {
      console.error('[TindakanPage] Gagal memuat tindakan:', err)
      setTindakanList([])
    } finally {
      setLoading(false)
    }
  }

  const loadPoli = async () => {
    try {
      setPoliList(await fetchPoli(branchId))
    } catch (err) {
      console.error('[TindakanPage] Gagal memuat poli:', err)
      setPoliList([])
    }
  }

  useEffect(() => {
    loadTindakan()
    loadPoli()
    setForm(EMPTY_FORM)
    setEditingId(null)
    setErrors({})
  }, [branchId])

  const handleChange = (field) => (e) => {
    const raw = e.target.value
    const isNumeric = [
      'jumlahBiaya',
      'jasaDokter', 'persentaseDokter', 'rupiahDokter',
      'jasaAsisten', 'persentaseAsisten', 'rupiahAsisten',
      'jasaKlinik', 'persentaseKlinik', 'rupiahKlinik',
    ].includes(field)
    setForm((f) => ({ ...f, [field]: isNumeric ? (parseInt(raw, 10) || 0) : raw }))
  }

  const validate = () => {
    const err = {}
    if (!form.kodeICD9.trim()) err.kodeICD9 = 'Wajib diisi'
    if (!form.namaTindakan.trim()) err.namaTindakan = 'Wajib diisi'
    if (!form.poliId) err.poliId = 'Wajib diisi'
    return err
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    const err = validate()
    if (Object.keys(err).length > 0) { setErrors(err); return }

    const payload = {
      branch_id: Number(branchId),
      poli_id: form.poliId ? Number(form.poliId) : null,
      kelompok_tindakan: form.kelompokTindakan.trim() || null,
      kode_icd9: form.kodeICD9.trim(),
      nama_tindakan: form.namaTindakan.trim(),
      jumlah_biaya: Number(form.jumlahBiaya) || 0,
      jasa_dokter: Number(form.jasaDokter) || 0,
      persentase_dokter: Number(form.persentaseDokter) || 0,
      rupiah_dokter: Number(form.rupiahDokter) || 0,
      jasa_asisten: Number(form.jasaAsisten) || 0,
      persentase_asisten: Number(form.persentaseAsisten) || 0,
      rupiah_asisten: Number(form.rupiahAsisten) || 0,
      jasa_klinik: Number(form.jasaKlinik) || 0,
      persentase_klinik: Number(form.persentaseKlinik) || 0,
      rupiah_klinik: Number(form.rupiahKlinik) || 0,
      status: form.status,
    }

    setSubmitting(true)
    setErrorMsg('')
    setErrors({})
    try {
      if (editingId) {
        await updateTindakan(editingId, payload)
      } else {
        await createTindakan(payload)
      }
      setSaved(true)
      setForm(EMPTY_FORM)
      setEditingId(null)
      await loadTindakan()
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        const fieldErrs = {}
        if (data.errors.kode_icd9) fieldErrs.kodeICD9 = data.errors.kode_icd9[0]
        if (data.errors.nama_tindakan) fieldErrs.namaTindakan = data.errors.nama_tindakan[0]
        if (data.errors.poli_id) fieldErrs.poliId = data.errors.poli_id[0]
        setErrors(fieldErrs)
      }
      setErrorMsg(data?.message || (editingId ? 'Gagal memperbarui tindakan' : 'Gagal menyimpan tindakan'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (row) => {
    setForm({
      kelompokTindakan: row.kelompokTindakan || '',
      kodeICD9: row.kodeICD9 || '',
      namaTindakan: row.namaTindakan || '',
      poliId: row.poliId ? String(row.poliId) : '',
      jumlahBiaya: row.jumlahBiaya || 0,
      jasaDokter: row.jasaDokter || 0,
      persentaseDokter: row.persentaseDokter || 0,
      rupiahDokter: row.rupiahDokter || 0,
      jasaAsisten: row.jasaAsisten || 0,
      persentaseAsisten: row.persentaseAsisten || 0,
      rupiahAsisten: row.rupiahAsisten || 0,
      jasaKlinik: row.jasaKlinik || 0,
      persentaseKlinik: row.persentaseKlinik || 0,
      rupiahKlinik: row.rupiahKlinik || 0,
      status: row.status || 'aktif',
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
    if (!confirm('Hapus tindakan ini?')) return
    try {
      await deleteTindakan(id)
      if (editingId === id) handleCancelEdit()
      await loadTindakan()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus tindakan')
    }
  }

  const formatRp = (val) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(val || 0)

  const columns = [
    { key: 'kodeICD9', label: 'ICD-9', sortable: true, width: '90px', render: (v) => <span className="font-mono text-body-sm">{v}</span> },
    { key: 'namaTindakan', label: 'Nama Tindakan', sortable: true },
    { key: 'kelompokTindakan', label: 'Kelompok' },
    { key: 'poli', label: 'Poliklinik', render: (_, row) => <Badge variant="primary">{row.poli?.nama || poliList.find(p => String(p.id) === String(row.poliId))?.nama || '-'}</Badge> },
    { key: 'jumlahBiaya', label: 'Jumlah Biaya', align: 'right', render: (v) => formatRp(v) },
    { key: 'jasaDokter', label: 'Jasa Dokter', align: 'right', render: (v) => formatRp(v) },
    { key: 'persentaseDokter', label: '% Dokter', align: 'right', width: '90px', render: (v) => `${v}%` },
    { key: 'rupiahDokter', label: 'Rp Dokter', align: 'right', render: (v) => formatRp(v) },
    { key: 'jasaAsisten', label: 'Jasa Asisten', align: 'right', render: (v) => formatRp(v) },
    { key: 'persentaseAsisten', label: '% Asisten', align: 'right', width: '90px', render: (v) => `${v}%` },
    { key: 'rupiahAsisten', label: 'Rp Asisten', align: 'right', render: (v) => formatRp(v) },
    { key: 'jasaKlinik', label: 'Jasa Klinik', align: 'right', render: (v) => formatRp(v) },
    { key: 'persentaseKlinik', label: '% Klinik', align: 'right', width: '90px', render: (v) => `${v}%` },
    { key: 'rupiahKlinik', label: 'Rp Klinik', align: 'right', render: (v) => formatRp(v) },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'aktif' ? 'success' : 'neutral'}>{v || 'aktif'}</Badge> },
  ]

  // Reusable field row untuk form Jasa: [label, % input, Rp input]
  const JasaRow = ({ title, prefix, jasaField, persenField, rupiahField }) => (
    <div>
      <label className="label">{title}</label>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <input
            type="number"
            value={form[jasaField]}
            onChange={handleChange(jasaField)}
            className="input"
            min={0}
            placeholder="0"
            aria-label={`${title} nominal`}
          />
          <p className="text-tiny text-[var(--text-muted)] mt-0.5">Nominal</p>
        </div>
        <div>
          <div className="relative">
            <input
              type="number"
              value={form[persenField]}
              onChange={handleChange(persenField)}
              className="input pr-7"
              min={0}
              max={100}
              placeholder="0"
              aria-label={`${title} persentase`}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">%</span>
          </div>
          <p className="text-tiny text-[var(--text-muted)] mt-0.5">%</p>
        </div>
        <div>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">Rp</span>
            <input
              type="number"
              value={form[rupiahField]}
              onChange={handleChange(rupiahField)}
              className="input pl-8"
              min={0}
              placeholder="0"
              aria-label={`${title} rupiah`}
            />
          </div>
          <p className="text-tiny text-[var(--text-muted)] mt-0.5">Rp</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Data Tindakan Medis"
        description="Kelola master data tindakan medis dan tarif jasanya."
        branchId={branchId}
      />

      <Card className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
            <h3 className="text-heading-md font-bold text-[var(--text-primary)]">
              {editingId ? 'Edit Tindakan' : 'Tambah Tindakan'}
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
              <label className="label">Kelompok Tindakan</label>
              <input type="text" value={form.kelompokTindakan} onChange={handleChange('kelompokTindakan')} className="input" placeholder="Bedah / Tindakan Umum" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Kode ICD-9</label>
                <input type="text" value={form.kodeICD9} onChange={handleChange('kodeICD9')} className={`input ${errors.kodeICD9 ? 'input-error' : ''}`} placeholder="99.0" />
                {errors.kodeICD9 && <p className="text-tiny text-red-500 mt-0.5">{errors.kodeICD9}</p>}
              </div>
              <div>
                <label className="label">Nama Tindakan</label>
                <input type="text" value={form.namaTindakan} onChange={handleChange('namaTindakan')} className={`input ${errors.namaTindakan ? 'input-error' : ''}`} />
                {errors.namaTindakan && <p className="text-tiny text-red-500 mt-0.5">{errors.namaTindakan}</p>}
              </div>
            </div>
            <div>
              <label className="label">Poliklinik</label>
              <select value={form.poliId} onChange={handleChange('poliId')} className={`input ${errors.poliId ? 'input-error' : ''}`}>
                <option value="">-- Pilih --</option>
                {poliList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
              {errors.poliId && <p className="text-tiny text-red-500 mt-0.5">{errors.poliId}</p>}
            </div>
            <div>
              <label className="label">Jumlah Biaya</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">Rp</span>
                <input type="number" value={form.jumlahBiaya} onChange={handleChange('jumlahBiaya')} className="input pl-8" min={0} />
              </div>
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={handleChange('status')} className="input">
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>

            <div className="pt-2 border-t border-[var(--border-primary)]">
              <p className="text-tiny font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Komposisi Jasa</p>
              <div className="space-y-3">
                <JasaRow
                  title="Jasa Dokter"
                  prefix="dokter"
                  jasaField="jasaDokter"
                  persenField="persentaseDokter"
                  rupiahField="rupiahDokter"
                />
                <JasaRow
                  title="Jasa Asisten"
                  prefix="asisten"
                  jasaField="jasaAsisten"
                  persenField="persentaseAsisten"
                  rupiahField="rupiahAsisten"
                />
                <JasaRow
                  title="Jasa Klinik"
                  prefix="klinik"
                  jasaField="jasaKlinik"
                  persenField="persentaseKlinik"
                  rupiahField="rupiahKlinik"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary flex-1 disabled:opacity-50">
                {submitting ? 'Menyimpan…' : editingId ? 'Perbarui' : 'Simpan'}
              </button>
              {editingId && (
                <button onClick={handleCancelEdit} className="btn flex-1" type="button">
                  Batal
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <TabelMaster
              columns={columns}
              data={tindakanList}
              searchKey={['kodeICD9', 'namaTindakan', 'kelompokTindakan']}
              searchPlaceholder="Cari tindakan..."
              loading={loading}
              emptyMessage="Belum ada data tindakan"
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
