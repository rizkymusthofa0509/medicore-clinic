import { useEffect, useMemo, useState } from 'react'

import { Card, Badge } from '../../../shared/components/ui.jsx'
import { TabelMaster } from '../../../shared/components/TabelMaster.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import MasterPageHeader from '../components/MasterPageHeader.jsx'
import RuanganInline from '../components/RuanganInline.jsx'
import {
  fetchUnitLokasi,
  createUnitLokasi,
  deleteUnitLokasi,
} from '../service/unitLokasiService.js'
import {
  fetchPoli,
  createPoli,
  deletePoli,
} from '../service/poliService.js'
import {
  fetchRuangan,
  createRuangan,
  deleteRuangan,
} from '../service/ruanganService.js'
import { fetchDepoObat } from '../service/depoObatService.js'

const TABS = [
  { key: 'unit-lokasi', label: 'Unit Lokasi' },
  { key: 'poliklinik', label: 'Poliklinik' },
  { key: 'ruangan', label: 'Ruangan' },
]

export default function UnitLokasiPage() {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [activeTab, setActiveTab] = useState('unit-lokasi')

  // Unit Lokasi
  const [unitList, setUnitList] = useState([])
  const [unitLoading, setUnitLoading] = useState(false)
  const [unitForm, setUnitForm] = useState({ kode: '', namaUnit: '', jenis: 'rawat_jalan', lokasi: '', keterangan: '' })
  const [unitErrors, setUnitErrors] = useState({})
  const [unitSaved, setUnitSaved] = useState(false)
  const [unitErrorMsg, setUnitErrorMsg] = useState('')
  const [unitSubmitting, setUnitSubmitting] = useState(false)

  // Poli
  const [poliList, setPoliList] = useState([])
  const [poliLoading, setPoliLoading] = useState(false)
  const [poliForm, setPoliForm] = useState({ kode: '', nama: '', jenisPoli: '', unitLokasiId: '', depoObatId: '', status: 'aktif', antrianFTKP: true })
  const [poliErrors, setPoliErrors] = useState({})
  const [poliSaved, setPoliSaved] = useState(false)
  const [poliSubmitting, setPoliSubmitting] = useState(false)
  const [poliErrorMsg, setPoliErrorMsg] = useState('')

  // Ruangan
  const [ruanganList, setRuanganList] = useState([])
  const [ruanganLoading, setRuanganLoading] = useState(false)
  const [ruanganForm, setRuanganForm] = useState({ poliId: '', kode: '', namaRuangan: '', kelas: '', kapasitas: 1 })
  const [ruanganErrors, setRuanganErrors] = useState({})
  const [ruanganSubmitting, setRuanganSubmitting] = useState(false)
  const [ruanganSaved, setRuanganSaved] = useState(false)
  const [ruanganErrorMsg, setRuanganErrorMsg] = useState('')

  // Depo (untuk dropdown "Unit Stok" di poli)
  const [depoList, setDepoList] = useState([])

  useEffect(() => {
    const onBranchChange = () => setBranchId(getCurrentBranchId())
    window.addEventListener('branch:changed', onBranchChange)
    return () => window.removeEventListener('branch:changed', onBranchChange)
  }, [])

  const loadUnit = async () => {
    setUnitLoading(true)
    try {
      setUnitList(await fetchUnitLokasi(branchId))
    } catch (err) {
      console.error('[UnitLokasiPage] Gagal memuat unit lokasi:', err)
      setUnitList([])
    } finally {
      setUnitLoading(false)
    }
  }

  const loadPoli = async () => {
    setPoliLoading(true)
    try {
      setPoliList(await fetchPoli(branchId))
    } catch (err) {
      console.error('[UnitLokasiPage] Gagal memuat poli:', err)
      setPoliList([])
    } finally {
      setPoliLoading(false)
    }
  }

  const loadRuangan = async () => {
    setRuanganLoading(true)
    try {
      setRuanganList(await fetchRuangan(branchId))
    } catch (err) {
      console.error('[UnitLokasiPage] Gagal memuat ruangan:', err)
      setRuanganList([])
    } finally {
      setRuanganLoading(false)
    }
  }

  const loadDepo = async () => {
    try {
      setDepoList(await fetchDepoObat(branchId))
    } catch (err) {
      console.error('[UnitLokasiPage] Gagal memuat depo:', err)
      setDepoList([])
    }
  }

  useEffect(() => {
    loadUnit()
    loadPoli()
    loadRuangan()
    loadDepo()
  }, [branchId])

  // ============== Unit Lokasi handlers ==============
  const handleUnitSave = async () => {
    const err = {}
    if (!unitForm.kode.trim()) err.kode = 'Wajib diisi'
    if (!unitForm.namaUnit.trim()) err.namaUnit = 'Wajib diisi'
    if (Object.keys(err).length > 0) { setUnitErrors(err); return }

    setUnitSubmitting(true)
    setUnitErrorMsg('')
    try {
      await createUnitLokasi({
        branch_id: Number(branchId),
        kode: unitForm.kode.trim(),
        nama_unit: unitForm.namaUnit.trim(),
        jenis: unitForm.jenis,
        lokasi: unitForm.lokasi.trim() || null,
        keterangan: unitForm.keterangan.trim() || null,
      })
      setUnitSaved(true)
      setUnitForm({ kode: '', namaUnit: '', jenis: 'rawat_jalan', lokasi: '', keterangan: '' })
      await loadUnit()
      setTimeout(() => setUnitSaved(false), 2500)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        const fieldErrs = {}
        if (data.errors.kode) fieldErrs.kode = data.errors.kode[0]
        if (data.errors.nama_unit) fieldErrs.namaUnit = data.errors.nama_unit[0]
        setUnitErrors(fieldErrs)
      }
      setUnitErrorMsg(data?.message || 'Gagal menyimpan unit lokasi')
    } finally {
      setUnitSubmitting(false)
    }
  }

  const handleUnitDelete = async (id) => {
    if (!confirm('Hapus unit lokasi ini? Poli yang berelasi mungkin akan kehilangan unit.')) return
    try {
      await deleteUnitLokasi(id)
      await Promise.all([loadUnit(), loadPoli()])
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus unit lokasi')
    }
  }

  // ============== Poli handlers ==============
  const handlePoliSave = async () => {
    const err = {}
    if (!poliForm.kode.trim()) err.kode = 'Wajib diisi'
    if (!poliForm.nama.trim()) err.nama = 'Wajib diisi'
    if (Object.keys(err).length > 0) { setPoliErrors(err); return }

    setPoliSubmitting(true)
    setPoliErrorMsg('')
    try {
      await createPoli({
        branch_id: Number(branchId),
        kode: poliForm.kode.trim(),
        nama: poliForm.nama.trim(),
        jenis_poli: poliForm.jenisPoli || null,
        unit_lokasi_id: poliForm.unitLokasiId ? Number(poliForm.unitLokasiId) : null,
        depo_obat_id: poliForm.depoObatId ? Number(poliForm.depoObatId) : null,
        antrian_ftkp: Boolean(poliForm.antrianFTKP),
        status: poliForm.status,
      })
      setPoliSaved(true)
      setPoliForm({ kode: '', nama: '', jenisPoli: '', unitLokasiId: '', depoObatId: '', status: 'aktif', antrianFTKP: true })
      await Promise.all([loadPoli(), loadUnit()])
      setTimeout(() => setPoliSaved(false), 2500)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        const fieldErrs = {}
        if (data.errors.kode) fieldErrs.kode = data.errors.kode[0]
        if (data.errors.nama) fieldErrs.nama = data.errors.nama[0]
        setPoliErrors(fieldErrs)
      }
      setPoliErrorMsg(data?.message || 'Gagal menyimpan poli')
    } finally {
      setPoliSubmitting(false)
    }
  }

  const handlePoliDelete = async (id) => {
    if (!confirm('Hapus poli ini? Semua ruangan terkait akan ikut terhapus.')) return
    try {
      await deletePoli(id)
      await Promise.all([loadPoli(), loadRuangan(), loadUnit()])
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus poli')
    }
  }

  // ============== Ruangan handlers ==============
  const handleRuanganSave = async () => {
    const err = {}
    if (!ruanganForm.poliId) err.poliId = 'Wajib diisi'
    if (!ruanganForm.kode.trim()) err.kode = 'Wajib diisi'
    if (!ruanganForm.namaRuangan.trim()) err.namaRuangan = 'Wajib diisi'
    if (Object.keys(err).length > 0) { setRuanganErrors(err); return }

    setRuanganSubmitting(true)
    setRuanganErrorMsg('')
    try {
      await createRuangan({
        branch_id: Number(branchId),
        poli_id: Number(ruanganForm.poliId),
        kode: ruanganForm.kode.trim(),
        nama_ruangan: ruanganForm.namaRuangan.trim(),
        kelas: ruanganForm.kelas.trim() || null,
        kapasitas: Number(ruanganForm.kapasitas) || 1,
      })
      setRuanganSaved(true)
      setRuanganForm({ poliId: '', kode: '', namaRuangan: '', kelas: '', kapasitas: 1 })
      await Promise.all([loadRuangan(), loadPoli()])
      setTimeout(() => setRuanganSaved(false), 2500)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        const fieldErrs = {}
        if (data.errors.poli_id) fieldErrs.poliId = data.errors.poli_id[0]
        if (data.errors.kode) fieldErrs.kode = data.errors.kode[0]
        if (data.errors.nama_ruangan) fieldErrs.namaRuangan = data.errors.nama_ruangan[0]
        setRuanganErrors(fieldErrs)
      }
      setRuanganErrorMsg(data?.message || 'Gagal menyimpan ruangan')
    } finally {
      setRuanganSubmitting(false)
    }
  }

  const handleRuanganDelete = async (id) => {
    if (!confirm('Hapus ruangan ini?')) return
    try {
      await deleteRuangan(id)
      await Promise.all([loadRuangan(), loadPoli()])
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus ruangan')
    }
  }

  // Ruangan dipartisi per poli untuk inline editor
  const ruanganByPoli = useMemo(() => {
    const map = {}
    for (const r of ruanganList) {
      if (!map[r.poli_id]) map[r.poli_id] = []
      map[r.poli_id].push(r)
    }
    return map
  }, [ruanganList])

  // ============== Columns ==============
  const unitColumns = [
    { key: 'kode', label: 'Kode', sortable: true, width: '100px' },
    { key: 'namaUnit', label: 'Nama Unit', sortable: true },
    { key: 'jenis', label: 'Jenis', render: (v) => <Badge variant="primary">{v}</Badge> },
    { key: 'lokasi', label: 'Lokasi' },
    { key: 'jumlahPoli', label: 'Jumlah Poli', render: (v) => <Badge variant="info">{v}</Badge> },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'aktif' ? 'success' : 'neutral'}>{v}</Badge> },
  ]

  const poliColumns = [
    { key: 'kode', label: 'Kode', sortable: true, width: '90px' },
    { key: 'nama', label: 'Nama Poliklinik', sortable: true },
    { key: 'jenisPoli', label: 'Jenis', render: (v) => <Badge variant="primary">{v || '-'}</Badge> },
    { key: 'unitLokasi', label: 'Unit Lokasi', render: (v) => v ? <Badge variant="info">{v.namaUnit}</Badge> : <span className="text-tiny text-[var(--text-muted)]">-</span> },
    { key: 'depoObat', label: 'Unit Stok', render: (v) => v ? <Badge variant="info">{v.namaDepo}</Badge> : <span className="text-tiny text-[var(--text-muted)]">-</span> },
    { key: 'antrianFTKP', label: 'FTKP', render: (v) => v ? <Badge variant="success">Ya</Badge> : <Badge variant="neutral">Tidak</Badge> },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'aktif' ? 'success' : 'danger'}>{v}</Badge> },
  ]

  const ruanganColumns = [
    { key: 'kode', label: 'Kode', sortable: true, width: '110px' },
    { key: 'namaRuangan', label: 'Nama Ruangan', sortable: true },
    { key: 'poli', label: 'Poli', render: (v) => v ? <Badge variant="primary">{v.nama}</Badge> : '-' },
    { key: 'kelas', label: 'Kelas' },
    { key: 'kapasitas', label: 'Kapasitas', render: (v) => <Badge variant="info">{v}</Badge> },
    { key: 'status', label: 'Status', render: (v) => {
      const map = { tersedia: 'success', terisi: 'warning', maintenance: 'danger' }
      return <Badge variant={map[v] || 'neutral'}>{v}</Badge>
    }},
  ]

  return (
    <div className="space-y-6">
      <MasterPageHeader
        title="Unit Lokasi"
        description="Kelola unit lokasi, poliklinik, dan ruangan per cabang."
        branchId={branchId}
      />

      {/* Sub-tab internal: Poliklinik | Ruangan */}
      <div className="flex gap-1 border-b border-[var(--border-primary)]">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.key
                ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'unit-lokasi' && (
        <Card className="p-5">
          <h2 className="text-heading-lg font-bold text-[var(--text-primary)] mb-4">Unit Lokasi</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
              <h3 className="text-heading-md font-bold text-[var(--text-primary)]">Tambah Unit Lokasi</h3>
              {unitSaved && <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-caption">✓ Berhasil disimpan</div>}
              {unitErrorMsg && <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-caption">{unitErrorMsg}</div>}
              <div>
                <label className="label">Kode</label>
                <input type="text" value={unitForm.kode} onChange={e => setUnitForm({ ...unitForm, kode: e.target.value })} className={`input ${unitErrors.kode ? 'input-error' : ''}`} placeholder="RJ" />
                {unitErrors.kode && <p className="text-tiny text-red-500 mt-0.5">{unitErrors.kode}</p>}
              </div>
              <div>
                <label className="label">Nama Unit</label>
                <input type="text" value={unitForm.namaUnit} onChange={e => setUnitForm({ ...unitForm, namaUnit: e.target.value })} className={`input ${unitErrors.namaUnit ? 'input-error' : ''}`} placeholder="Rawat Jalan" />
                {unitErrors.namaUnit && <p className="text-tiny text-red-500 mt-0.5">{unitErrors.namaUnit}</p>}
              </div>
              <div>
                <label className="label">Jenis</label>
                <select value={unitForm.jenis} onChange={e => setUnitForm({ ...unitForm, jenis: e.target.value })} className="input">
                  <option value="rawat_jalan">Rawat Jalan</option>
                  <option value="rawat_inap">Rawat Inap</option>
                  <option value="penunjang">Penunjang</option>
                  <option value="umum">Umum</option>
                </select>
              </div>
              <div>
                <label className="label">Lokasi</label>
                <input type="text" value={unitForm.lokasi} onChange={e => setUnitForm({ ...unitForm, lokasi: e.target.value })} className="input" placeholder="Lantai 1" />
              </div>
              <button onClick={handleUnitSave} disabled={unitSubmitting} className="btn btn-primary w-full disabled:opacity-50">
                {unitSubmitting ? 'Menyimpan…' : 'Simpan Unit'}
              </button>
            </div>
            <div className="lg:col-span-2">
              <TabelMaster
                columns={unitColumns}
                data={unitList}
                searchKey={['kode', 'namaUnit', 'lokasi']}
                searchPlaceholder="Cari unit lokasi..."
                loading={unitLoading}
                emptyMessage="Belum ada unit lokasi untuk branch ini"
                actions={[
                  { label: 'Hapus', variant: 'danger', onClick: (row) => handleUnitDelete(row.id) },
                ]}
              />
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'poliklinik' && (
        <Card className="p-5">
          <h2 className="text-heading-lg font-bold text-[var(--text-primary)] mb-4">Poliklinik</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
              <h3 className="text-heading-md font-bold text-[var(--text-primary)]">Tambah Poli</h3>
              {poliSaved && <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-caption">✓ Berhasil disimpan</div>}
              {poliErrorMsg && <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-caption">{poliErrorMsg}</div>}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Kode</label>
                  <input type="text" value={poliForm.kode} onChange={e => setPoliForm({ ...poliForm, kode: e.target.value })} className={`input ${poliErrors.kode ? 'input-error' : ''}`} placeholder="PL-UM" />
                </div>
                <div>
                  <label className="label">Nama Poli</label>
                  <input type="text" value={poliForm.nama} onChange={e => setPoliForm({ ...poliForm, nama: e.target.value })} className={`input ${poliErrors.nama ? 'input-error' : ''}`} placeholder="Poli Umum" />
                </div>
              </div>
              <div>
                <label className="label">Unit Lokasi</label>
                <select value={poliForm.unitLokasiId} onChange={e => setPoliForm({ ...poliForm, unitLokasiId: e.target.value })} className="input">
                  <option value="">-- Pilih --</option>
                  {unitList.map(u => <option key={u.id} value={u.id}>{u.kode} - {u.namaUnit}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Jenis</label>
                  <select value={poliForm.jenisPoli} onChange={e => setPoliForm({ ...poliForm, jenisPoli: e.target.value })} className="input">
                    <option value="">--</option>
                    <option value="Umum">Umum</option>
                    <option value="Gigi">Gigi</option>
                    <option value="THT">THT</option>
                    <option value="Kebidanan">Kebidanan</option>
                    <option value="Radiologi">Radiologi</option>
                    <option value="Mata">Mata</option>
                    <option value="Anak">Anak</option>
                    <option value="Bedah">Bedah</option>
                  </select>
                </div>
                <div>
                  <label className="label">Unit Stok</label>
                  <select value={poliForm.depoObatId} onChange={e => setPoliForm({ ...poliForm, depoObatId: e.target.value })} className="input">
                    <option value="">-- Pilih Depo --</option>
                    {depoList.map(d => <option key={d.id} value={d.id}>{d.namaDepo}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Status</label>
                  <select value={poliForm.status} onChange={e => setPoliForm({ ...poliForm, status: e.target.value })} className="input">
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
                <div>
                  <label className="label">FTKP</label>
                  <select value={String(poliForm.antrianFTKP)} onChange={e => setPoliForm({ ...poliForm, antrianFTKP: e.target.value === 'true' })} className="input">
                    <option value="true">Ya</option>
                    <option value="false">Tidak</option>
                  </select>
                </div>
              </div>
              <button onClick={handlePoliSave} disabled={poliSubmitting} className="btn btn-primary w-full disabled:opacity-50">
                {poliSubmitting ? 'Menyimpan…' : 'Simpan Poli'}
              </button>
            </div>
            <div className="lg:col-span-2">
              <TabelMaster
                columns={poliColumns}
                data={poliList}
                searchKey={['kode', 'nama', 'jenisPoli']}
                searchPlaceholder="Cari poli..."
                loading={poliLoading}
                emptyMessage="Belum ada poli untuk branch ini"
                actions={[
                  { label: 'Hapus', variant: 'danger', onClick: (row) => handlePoliDelete(row.id) },
                ]}
              />
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'ruangan' && (
        <Card className="p-5">
          <h2 className="text-heading-lg font-bold text-[var(--text-primary)] mb-4">Ruangan</h2>

          {/* Form ruangan lengkap (kode + nama + kelas + kapasitas) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
              <h3 className="text-heading-md font-bold text-[var(--text-primary)]">Tambah Ruangan</h3>
              {ruanganSaved && <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-caption">✓ Berhasil disimpan</div>}
              {ruanganErrorMsg && <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-caption">{ruanganErrorMsg}</div>}
              <div>
                <label className="label">Poli</label>
                <select value={ruanganForm.poliId} onChange={e => setRuanganForm({ ...ruanganForm, poliId: e.target.value })} className={`input ${ruanganErrors.poliId ? 'input-error' : ''}`}>
                  <option value="">-- Pilih Poli --</option>
                  {poliList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
                {ruanganErrors.poliId && <p className="text-tiny text-red-500 mt-0.5">{ruanganErrors.poliId}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Kode</label>
                  <input type="text" value={ruanganForm.kode} onChange={e => setRuanganForm({ ...ruanganForm, kode: e.target.value })} className={`input ${ruanganErrors.kode ? 'input-error' : ''}`} placeholder="R-UM-01" />
                </div>
                <div>
                  <label className="label">Kapasitas</label>
                  <input type="number" value={ruanganForm.kapasitas} onChange={e => setRuanganForm({ ...ruanganForm, kapasitas: parseInt(e.target.value, 10) || 1 })} className="input" min={1} />
                </div>
              </div>
              <div>
                <label className="label">Nama Ruangan</label>
                <input type="text" value={ruanganForm.namaRuangan} onChange={e => setRuanganForm({ ...ruanganForm, namaRuangan: e.target.value })} className={`input ${ruanganErrors.namaRuangan ? 'input-error' : ''}`} placeholder="Ruang Periksa 1" />
              </div>
              <div>
                <label className="label">Kelas</label>
                <input type="text" value={ruanganForm.kelas} onChange={e => setRuanganForm({ ...ruanganForm, kelas: e.target.value })} className="input" placeholder="Kelas 1 / Utama / Standar" />
              </div>
              <button onClick={handleRuanganSave} disabled={ruanganSubmitting} className="btn btn-primary w-full disabled:opacity-50">
                {ruanganSubmitting ? 'Menyimpan…' : 'Simpan Ruangan'}
              </button>
            </div>

            <div className="lg:col-span-2">
              <TabelMaster
                columns={ruanganColumns}
                data={ruanganList}
                searchKey={['kode', 'namaRuangan', 'kelas']}
                searchPlaceholder="Cari ruangan..."
                loading={ruanganLoading}
                emptyMessage="Belum ada ruangan untuk branch ini"
                actions={[
                  { label: 'Hapus', variant: 'danger', onClick: (row) => handleRuanganDelete(row.id) },
                ]}
              />
            </div>
          </div>

          {/* Inline ruangan per poli */}
          <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
            <h4 className="text-heading-sm font-bold text-[var(--text-primary)] mb-3">Kelola Cepat Ruangan per Poli</h4>
            {poliList.length === 0 ? (
              <p className="text-tiny text-[var(--text-muted)]">Belum ada poli. Tambahkan poli di tab Poliklinik dulu.</p>
            ) : (
              <div className="space-y-2">
                {poliList.map(p => (
                  <RuanganInline
                    key={p.id}
                    poli={p}
                    branchId={branchId}
                    ruangan={ruanganByPoli[p.id] || []}
                    onChange={() => Promise.all([loadRuangan(), loadPoli()])}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
