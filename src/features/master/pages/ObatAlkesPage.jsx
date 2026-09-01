import { useEffect, useMemo, useState } from 'react'

import { Card, Badge } from '../../../shared/components/ui.jsx'
import { TabelMaster } from '../../../shared/components/TabelMaster.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import MasterPageHeader from '../components/MasterPageHeader.jsx'
import {
  fetchObatAlkes,
  createObatAlkes,
  updateObatAlkes,
  deleteObatAlkes,
} from '../service/obatAlkesService.js'

const TABS = [
  { key: 'obat', label: 'Obat', kategori: 'obat' },
  { key: 'alkes', label: 'Alkes', kategori: 'alkes' },
  { key: 'pbf', label: 'PBF', kategori: 'pbf' },
]

const KAT_LABELS = { obat: 'Obat', alkes: 'Alkes', pbf: 'PBF' }

// Form awal generik; field tambahan diisi sesuai tab aktif
const EMPTY_FORM = {
  nama: '',
  kodeKfa: '',
  satuanTerbesar: '',
  satuanTerkecil: '',
  jumlahPerSatuanTerbesar: '',
  hargaJual: 0,
  stok: 0,
  alamat: '',
  noTelp: '',
  email: '',
  status: 'aktif',
}

const formatRp = (v) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(v || 0)

export default function ObatAlkesPage() {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [activeTab, setActiveTab] = useState('obat')

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

  const load = async (kategori) => {
    if (!branchId) return
    setLoading(true)
    try {
      setList(await fetchObatAlkes(branchId, { kategori }))
    } catch (err) {
      console.error('[ObatAlkesPage] Gagal memuat:', err)
      setList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(activeTab) }, [branchId, activeTab])

  useEffect(() => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setErrors({})
    setErrorMsg('')
    setSaved(false)
  }, [activeTab, branchId])

  const activeKategori = useMemo(
    () => TABS.find(t => t.key === activeTab)?.kategori || 'obat',
    [activeTab]
  )

  const handleChange = (field) => (e) => {
    const raw = e.target.value
    const isNumeric = ['hargaJual', 'stok', 'jumlahPerSatuanTerbesar'].includes(field)
    setForm((f) => ({ ...f, [field]: isNumeric ? (parseInt(raw, 10) || 0) : raw }))
  }

  const validate = () => {
    const err = {}
    if (!form.nama.trim()) err.nama = 'Wajib diisi'
    return err
  }

  const buildPayload = () => {
    const base = {
      branch_id: Number(branchId),
      kategori: activeKategori,
      nama: form.nama.trim(),
      status: form.status,
    }
    if (activeKategori === 'pbf') {
      return {
        ...base,
        alamat: form.alamat.trim() || null,
        no_telp: form.noTelp.trim() || null,
        email: form.email.trim() || null,
      }
    }
    return {
      ...base,
      kode_kfa: form.kodeKfa.trim() || null,
      satuan_terbesar: form.satuanTerbesar.trim() || null,
      satuan_terkecil: form.satuanTerkecil.trim() || null,
      jumlah_per_satuan_terbesar: form.jumlahPerSatuanTerbesar ? Number(form.jumlahPerSatuanTerbesar) : null,
      harga_jual: Number(form.hargaJual) || 0,
      stok: Number(form.stok) || 0,
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    const err = validate()
    if (Object.keys(err).length > 0) { setErrors(err); return }

    const payload = buildPayload()
    setSubmitting(true)
    setErrorMsg('')
    setErrors({})
    try {
      if (editingId) {
        await updateObatAlkes(editingId, payload)
      } else {
        await createObatAlkes(payload)
      }
      setSaved(true)
      setForm(EMPTY_FORM)
      setEditingId(null)
      await load(activeKategori)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors?.nama) setErrors({ nama: data.errors.nama[0] })
      if (data?.errors?.kode_kfa) setErrors({ kodeKfa: data.errors.kode_kfa[0] })
      setErrorMsg(data?.message || (editingId ? 'Gagal memperbarui data' : 'Gagal menyimpan data'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (row) => {
    setForm({
      nama: row.nama || '',
      kodeKfa: row.kodeKfa || '',
      satuanTerbesar: row.satuanTerbesar || '',
      satuanTerkecil: row.satuanTerkecil || '',
      jumlahPerSatuanTerbesar: row.jumlahPerSatuanTerbesar ?? '',
      hargaJual: row.hargaJual || 0,
      stok: row.stok || 0,
      alamat: row.alamat || '',
      noTelp: row.noTelp || '',
      email: row.email || '',
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
    if (!confirm(`Hapus data ${KAT_LABELS[activeKategori]} ini?`)) return
    try {
      await deleteObatAlkes(id)
      if (editingId === id) handleCancelEdit()
      await load(activeKategori)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus data')
    }
  }

  // Kolom tabel adaptif per kategori
  const columns = useMemo(() => {
    if (activeKategori === 'pbf') {
      return [
        { key: 'nama', label: 'Nama PBF', sortable: true },
        { key: 'alamat', label: 'Alamat', render: (v) => v || <span className="text-tiny text-[var(--text-muted)]">-</span> },
        { key: 'noTelp', label: 'No. Telp', width: '140px', render: (v) => v ? <span className="font-mono text-body-sm">{v}</span> : <span className="text-tiny text-[var(--text-muted)]">-</span> },
        { key: 'email', label: 'Email', render: (v) => v || <span className="text-tiny text-[var(--text-muted)]">-</span> },
        { key: 'status', label: 'Status', width: '100px', render: (v) => <Badge variant={v === 'aktif' ? 'success' : 'neutral'}>{v}</Badge> },
      ]
    }
    return [
      { key: 'kodeKfa', label: 'Kode KFA', width: '110px', render: (v) => v ? <span className="font-mono text-body-sm">{v}</span> : <span className="text-tiny text-[var(--text-muted)]">-</span> },
      { key: 'nama', label: `Nama ${KAT_LABELS[activeKategori]}`, sortable: true },
      {
        key: 'satuan',
        label: 'Satuan',
        render: (_, row) => {
          if (!row.satuanTerbesar && !row.satuanTerkecil) {
            return <span className="text-tiny text-[var(--text-muted)]">-</span>
          }
          const besar = row.satuanTerbesar || '-'
          const kecil = row.satuanTerkecil || '-'
          const ratio = row.jumlahPerSatuanTerbesar
          if (ratio && besar !== kecil) {
            return <span className="text-body-sm">{besar} = {ratio} {kecil}</span>
          }
          return <span className="text-body-sm">{besar === kecil ? besar : `${besar} / ${kecil}`}</span>
        }
      },
      { key: 'hargaJual', label: 'Harga Jual', align: 'right', width: '130px', render: (v) => formatRp(v) },
      { key: 'stok', label: 'Stok', align: 'right', width: '80px', render: (v) => <Badge variant={v > 10 ? 'success' : v > 0 ? 'warning' : 'danger'}>{v}</Badge> },
      { key: 'status', label: 'Status', width: '100px', render: (v) => <Badge variant={v === 'aktif' ? 'success' : 'neutral'}>{v}</Badge> },
    ]
  }, [activeKategori])

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Data Obat, Alkes & PBF"
        description="Kelola master data obat, alat kesehatan, dan PBF (Pedagang Besar Farmasi) per cabang."
        branchId={branchId}
      />

      <div className="flex gap-1 border-b border-[var(--border-primary)] overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === t.key
                ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
            <h3 className="text-heading-md font-bold text-[var(--text-primary)]">
              {editingId ? 'Edit' : 'Tambah'} {KAT_LABELS[activeKategori]}
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
              <label className="label">{activeKategori === 'pbf' ? 'Nama PBF *' : `Nama ${KAT_LABELS[activeKategori]} *`}</label>
              <input
                type="text"
                value={form.nama}
                onChange={handleChange('nama')}
                className={`input ${errors.nama ? 'input-error' : ''}`}
                placeholder={activeKategori === 'pbf' ? 'PT Kimia Farma Trading & Distribution' : activeKategori === 'obat' ? 'Paracetamol 500 mg' : 'Masker Bedah 3 Ply'}
              />
              {errors.nama && <p className="text-tiny text-red-500 mt-0.5">{errors.nama}</p>}
            </div>

            {activeKategori === 'pbf' ? (
              <>
                <div>
                  <label className="label">Alamat</label>
                  <input type="text" value={form.alamat} onChange={handleChange('alamat')} className="input" placeholder="Jl. Veteran No. 9, Jakarta" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">No. Telp</label>
                    <input type="text" value={form.noTelp} onChange={handleChange('noTelp')} className="input" placeholder="021-..." />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" value={form.email} onChange={handleChange('email')} className="input" placeholder="order@pbf.co.id" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label">Kode KFA <span className="text-tiny text-[var(--text-muted)]">(opsional)</span></label>
                  <input
                    type="text"
                    value={form.kodeKfa}
                    onChange={handleChange('kodeKfa')}
                    className={`input font-mono ${errors.kodeKfa ? 'input-error' : ''}`}
                    placeholder="91000012"
                  />
                  {errors.kodeKfa && <p className="text-tiny text-red-500 mt-0.5">{errors.kodeKfa}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Satuan Terbesar</label>
                    <input
                      type="text"
                      list="satuan-options"
                      value={form.satuanTerbesar}
                      onChange={handleChange('satuanTerbesar')}
                      className="input"
                      placeholder="Box"
                    />
                  </div>
                  <div>
                    <label className="label">Satuan Terkecil</label>
                    <input
                      type="text"
                      list="satuan-options"
                      value={form.satuanTerkecil}
                      onChange={handleChange('satuanTerkecil')}
                      className="input"
                      placeholder="Tablet"
                    />
                  </div>
                </div>
                {/* Datalist untuk autocomplete satuan umum. User bebas ketik nilai lain. */}
                <datalist id="satuan-options">
                  <option value="Box" />
                  <option value="Botol" />
                  <option value="Pack" />
                  <option value="Strip" />
                  <option value="Pcs" />
                  <option value="Tube" />
                  <option value="Sachet" />
                  <option value="Ampul" />
                  <option value="Vial" />
                  <option value="Roll" />
                  <option value="Tablet" />
                  <option value="Kapsul" />
                  <option value="Kaplet" />
                  <option value="ml" />
                  <option value="mg" />
                  <option value="Cm" />
                </datalist>

                <div>
                  <label className="label">Jumlah per Satuan Terbesar</label>
                  <input
                    type="number"
                    value={form.jumlahPerSatuanTerbesar}
                    onChange={handleChange('jumlahPerSatuanTerbesar')}
                    className="input"
                    min={1}
                    placeholder="100 (1 Box = 100 Tablet)"
                  />
                  <p className="text-tiny text-[var(--text-muted)] mt-1">
                    Misal 1 Box = 100 Tablet. Boleh dikosongkan jika satuan terbesar = terkecil.
                  </p>
                </div>

                <div>
                  <label className="label">Harga Jual (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">Rp</span>
                    <input
                      type="number"
                      value={form.hargaJual}
                      onChange={handleChange('hargaJual')}
                      className="input pl-8"
                      min={0}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Stok</label>
                  <input
                    type="number"
                    value={form.stok}
                    onChange={handleChange('stok')}
                    className="input"
                    min={0}
                  />
                </div>
              </>
            )}

            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={handleChange('status')} className="input">
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
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
              searchKey={activeKategori === 'pbf' ? ['nama', 'alamat', 'noTelp', 'email'] : ['nama', 'kodeKfa', 'satuanTerbesar', 'satuanTerkecil']}
              searchPlaceholder={`Cari ${KAT_LABELS[activeKategori].toLowerCase()}...`}
              loading={loading}
              emptyMessage={`Belum ada data ${KAT_LABELS[activeKategori]} untuk branch ini`}
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
