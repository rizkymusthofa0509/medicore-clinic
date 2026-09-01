import { useEffect, useMemo, useState } from 'react'

import { Card, Badge } from '../../../shared/components/ui.jsx'
import { TabelMaster } from '../../../shared/components/TabelMaster.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import MasterPageHeader from '../components/MasterPageHeader.jsx'
import { fetchPoli } from '../service/poliService.js'
import {
  fetchNakes,
  createNakes,
  updateNakes,
  deleteNakes,
} from '../service/nakesService.js'

const TABS = [
  { key: 'dokter', label: 'Data Dokter', tipe: 'dokter' },
  { key: 'perawat', label: 'Data Perawat', tipe: 'perawat' },
  { key: 'bidan', label: 'Data Bidan', tipe: 'bidan' },
  { key: 'analis_lab', label: 'Analis Laboratorium', tipe: 'analis_lab' },
]

const TIPE_LABELS = {
  dokter: 'Dokter',
  perawat: 'Perawat',
  bidan: 'Bidan',
  analis_lab: 'Analis Lab',
}

const EMPTY_FORM = {
  nama: '',
  nik: '',
  email: '',
  tipe: 'dokter',
  noSTR: '',
  noSIP: '',
  strExpiredAt: '',
  sipExpiredAt: '',
  kodeBpjs: '',
  ihsSatusehat: '',
  spesialisasi: '',
  noTelp: '',
  status: 'aktif',
  poliIds: [],
}

export default function NakesPage() {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [activeTab, setActiveTab] = useState('dokter')

  const [nakesList, setNakesList] = useState([])
  const [loading, setLoading] = useState(false)
  const [poliList, setPoliList] = useState([])

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

  const loadNakes = async (tipe) => {
    if (!branchId) return
    setLoading(true)
    try {
      setNakesList(await fetchNakes(branchId, { tipe }))
    } catch (err) {
      console.error('[NakesPage] Gagal memuat nakes:', err)
      setNakesList([])
    } finally {
      setLoading(false)
    }
  }

  const loadPoli = async () => {
    if (!branchId) return
    try {
      setPoliList(await fetchPoli(branchId))
    } catch (err) {
      console.error('[NakesPage] Gagal memuat poli:', err)
      setPoliList([])
    }
  }

  useEffect(() => {
    loadNakes(activeTab)
  }, [branchId, activeTab])

  useEffect(() => {
    loadPoli()
  }, [branchId])

  useEffect(() => {
    setForm({ ...EMPTY_FORM, tipe: activeTab })
    setEditingId(null)
    setErrors({})
    setErrorMsg('')
    setSaved(false)
  }, [activeTab])

  useEffect(() => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setErrors({})
  }, [branchId])

  const activeTipe = useMemo(
    () => TABS.find(t => t.key === activeTab)?.tipe || 'dokter',
    [activeTab]
  )

  const handleChange = (field) => (e) => {
    const { value, type, checked } = e.target
    setForm((f) => ({ ...f, [field]: type === 'checkbox' ? checked : value }))
  }

  const handlePoliToggle = (poliId) => {
    setForm((f) => {
      const exists = f.poliIds.includes(poliId)
      return {
        ...f,
        poliIds: exists ? f.poliIds.filter((id) => id !== poliId) : [...f.poliIds, poliId],
      }
    })
  }

  const validate = () => {
    const err = {}
    if (!form.nama.trim()) err.nama = 'Wajib diisi'
    if (!form.nik.trim()) err.nik = 'Wajib diisi'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      err.email = 'Format email tidak valid'
    }
    return err
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    const err = validate()
    if (Object.keys(err).length > 0) { setErrors(err); return }

    const payload = {
      branch_id: Number(branchId),
      nama: form.nama.trim(),
      nik: form.nik.trim(),
      email: form.email.trim() || null,
      tipe: activeTipe,
      no_str: form.noSTR.trim() || null,
      no_sip: form.noSIP.trim() || null,
      str_expired_at: form.strExpiredAt || null,
      sip_expired_at: form.sipExpiredAt || null,
      kode_bpjs: form.kodeBpjs.trim() || null,
      ihs_satusehat: form.ihsSatusehat.trim() || null,
      spesialisasi: form.spesialisasi.trim() || null,
      no_telp: form.noTelp.trim() || null,
      status: form.status,
      poli_ids: form.poliIds,
    }

    setSubmitting(true)
    setErrorMsg('')
    setErrors({})
    try {
      if (editingId) {
        await updateNakes(editingId, payload)
      } else {
        await createNakes(payload)
      }
      setSaved(true)
      setForm({ ...EMPTY_FORM, tipe: activeTipe })
      setEditingId(null)
      await loadNakes(activeTipe)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        const fieldErrs = {}
        if (data.errors.nama) fieldErrs.nama = data.errors.nama[0]
        if (data.errors.nik) fieldErrs.nik = data.errors.nik[0]
        if (data.errors.email) fieldErrs.email = data.errors.email[0]
        setErrors(fieldErrs)
      }
      setErrorMsg(data?.message || (editingId ? 'Gagal memperbarui nakes' : 'Gagal menyimpan nakes'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (row) => {
    setForm({
      nama: row.nama || '',
      nik: row.nik || '',
      email: row.email || '',
      tipe: row.tipe || activeTipe,
      noSTR: row.noSTR || '',
      noSIP: row.noSIP || '',
      strExpiredAt: row.strExpiredAt || '',
      sipExpiredAt: row.sipExpiredAt || '',
      kodeBpjs: row.kodeBpjs || '',
      ihsSatusehat: row.ihsSatusehat || '',
      spesialisasi: row.spesialisasi || '',
      noTelp: row.noTelp || '',
      status: row.status || 'aktif',
      poliIds: row.poliIds || [],
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
    setForm({ ...EMPTY_FORM, tipe: activeTipe })
    setEditingId(null)
    setErrors({})
    setErrorMsg('')
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus data nakes ini?')) return
    try {
      await deleteNakes(id)
      if (editingId === id) handleCancelEdit()
      await loadNakes(activeTipe)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus nakes')
    }
  }

  const formatDate = (d) => {
    if (!d) return '-'
    try {
      return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return d }
  }

  const showSIP = activeTipe === 'dokter'

  const columns = [
    { key: 'nama', label: 'Nama', sortable: true },
    { key: 'nik', label: 'NIK', width: '150px', render: (v) => <span className="font-mono text-body-sm">{v}</span> },
    { key: 'email', label: 'Email', render: (v) => v || <span className="text-tiny text-[var(--text-muted)]">-</span> },
    { key: 'tipe', label: 'Tipe', width: '110px', render: (v) => <Badge variant="primary">{TIPE_LABELS[v] || v}</Badge> },
    {
      key: 'noSTR', label: 'STR', width: '140px',
      render: (v, row) => v ? (
        <div className="text-caption">
          <div className="font-mono">{v}</div>
          {row.strExpiredAt && <div className="text-tiny text-[var(--text-muted)]">exp {formatDate(row.strExpiredAt)}</div>}
        </div>
      ) : <span className="text-tiny text-[var(--text-muted)]">-</span>
    },
    ...(showSIP ? [{
      key: 'noSIP', label: 'SIP', width: '140px',
      render: (v, row) => v ? (
        <div className="text-caption">
          <div className="font-mono">{v}</div>
          {row.sipExpiredAt && <div className="text-tiny text-[var(--text-muted)]">exp {formatDate(row.sipExpiredAt)}</div>}
        </div>
      ) : <span className="text-tiny text-[var(--text-muted)]">-</span>
    }] : []),
    {
      key: 'polis', label: 'Bertugas di Poli',
      render: (_, row) => row.polis && row.polis.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {row.polis.map((p) => <Badge key={p.id} variant="info">{p.nama}</Badge>)}
        </div>
      ) : <span className="text-tiny text-[var(--text-muted)]">-</span>
    },
    { key: 'kodeBpjs', label: 'Kode BPJS', width: '130px', render: (v) => v ? <span className="font-mono text-body-sm">{v}</span> : <span className="text-tiny text-[var(--text-muted)]">-</span> },
    { key: 'ihsSatusehat', label: 'IHS Satu Sehat', width: '140px', render: (v) => v ? <span className="font-mono text-body-sm">{v}</span> : <span className="text-tiny text-[var(--text-muted)]">-</span> },
    { key: 'status', label: 'Status', width: '90px', render: (v) => <Badge variant={v === 'aktif' ? 'success' : 'neutral'}>{v}</Badge> },
  ]

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Nakes & Pengguna"
        description="Kelola data Dokter, Perawat, Bidan, dan Analis Laboratorium per cabang."
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
              {editingId ? 'Edit' : 'Tambah'} {TIPE_LABELS[activeTipe]}
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
              <label className="label">Nama Lengkap *</label>
              <input type="text" value={form.nama} onChange={handleChange('nama')} className={`input ${errors.nama ? 'input-error' : ''}`} placeholder="dr. Andi Pratama, Sp.PD" />
              {errors.nama && <p className="text-tiny text-red-500 mt-0.5">{errors.nama}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">NIK *</label>
                <input type="text" value={form.nik} onChange={handleChange('nik')} className={`input ${errors.nik ? 'input-error' : ''}`} placeholder="3175012345670001" />
                {errors.nik && <p className="text-tiny text-red-500 mt-0.5">{errors.nik}</p>}
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={form.email} onChange={handleChange('email')} className={`input ${errors.email ? 'input-error' : ''}`} placeholder="email@klinik.test" />
                {errors.email && <p className="text-tiny text-red-500 mt-0.5">{errors.email}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">No. STR</label>
                <input type="text" value={form.noSTR} onChange={handleChange('noSTR')} className="input" placeholder="STR-..." />
              </div>
              <div>
                <label className="label">STR Expired</label>
                <input type="date" value={form.strExpiredAt} onChange={handleChange('strExpiredAt')} className="input" />
              </div>
            </div>
            {showSIP && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">No. SIP</label>
                  <input type="text" value={form.noSIP} onChange={handleChange('noSIP')} className="input" placeholder="SIP-..." />
                </div>
                <div>
                  <label className="label">SIP Expired</label>
                  <input type="date" value={form.sipExpiredAt} onChange={handleChange('sipExpiredAt')} className="input" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Kode BPJS <span className="text-tiny text-[var(--text-muted)]">(opsional)</span></label>
                <input type="text" value={form.kodeBpjs} onChange={handleChange('kodeBpjs')} className="input" placeholder="BPJS-..." />
              </div>
              <div>
                <label className="label">IHS Satu Sehat <span className="text-tiny text-[var(--text-muted)]">(opsional)</span></label>
                <input type="text" value={form.ihsSatusehat} onChange={handleChange('ihsSatusehat')} className="input" placeholder="IHS-..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Spesialisasi</label>
                <input type="text" value={form.spesialisasi} onChange={handleChange('spesialisasi')} className="input" placeholder="Anak / Gigi / dll" />
              </div>
              <div>
                <label className="label">No. Telp</label>
                <input type="text" value={form.noTelp} onChange={handleChange('noTelp')} className="input" placeholder="0812..." />
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
              <p className="text-tiny font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Bertugas di Poliklinik <span className="text-[var(--text-muted)] normal-case font-normal">(bisa lebih dari satu)</span>
              </p>
              {poliList.length === 0 ? (
                <p className="text-tiny text-[var(--text-muted)]">Belum ada poli. Tambahkan poli di menu Unit, Poli, Ruangan.</p>
              ) : (
                <div className="space-y-1 max-h-44 overflow-y-auto rounded-lg border border-[var(--border-primary)] p-2 bg-[var(--bg-primary)]">
                  {poliList.map((p) => {
                    const checked = form.poliIds.includes(p.id)
                    return (
                      <label key={p.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-[var(--bg-hover)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handlePoliToggle(p.id)}
                          className="rounded border-[var(--border-primary)]"
                        />
                        <span className="text-body-sm flex-1 truncate">{p.nama}</span>
                        {p.kode && <span className="text-tiny font-mono text-[var(--text-muted)]">{p.kode}</span>}
                      </label>
                    )
                  })}
                </div>
              )}
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
              data={nakesList}
              searchKey={['nama', 'nik', 'email', 'noSTR', 'noSIP']}
              searchPlaceholder={`Cari ${TIPE_LABELS[activeTipe].toLowerCase()}...`}
              loading={loading}
              emptyMessage={`Belum ada data ${TIPE_LABELS[activeTipe]}`}
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
