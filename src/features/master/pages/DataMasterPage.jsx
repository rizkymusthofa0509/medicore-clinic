import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function DataMasterPage() {
  const branchId = getCurrentBranchId()
  const location = useLocation()
  
  const [depoList, setDepoList] = useState([])
  const [poliList, setPoliList] = useState([])
  const [tindakanList, setTindakanList] = useState([])

  // Sync active tab with current route
  const getTabFromPath = () => {
    const path = location.pathname
    if (path === '/depo-obat') return 'depo-obat'
    if (path === '/poliklinik' || path === '/unit-lokasi') return 'poliklinik'
    if (path === '/tindakan') return 'tindakan'
    return 'depo-obat'
  }

  const [activeTab, setActiveTab] = useState(getTabFromPath())

  useEffect(() => {
    setActiveTab(getTabFromPath())
  }, [location.pathname])

  useEffect(() => { loadAll() }, [branchId])

  const loadAll = () => {
    setDepoList(getDepoObat())
    setPoliList(getPoli(branchId))
    setTindakanList(getTindakanMedis())
  }

  // Forms
  const [depoForm, setDepoForm] = useState({ namaDepo: '', lokasi: '', keterangan: '' })
  const [depoErrors, setDepoErrors] = useState({})
  const [depoSaved, setDepoSaved] = useState(false)

  const [poliForm, setPoliForm] = useState({ kode: '', nama: '', jenisPoli: '', unitStok: '', status: 'aktif', antrianFTKP: true })
  const [poliErrors, setPoliErrors] = useState({})
  const [poliSaved, setPoliSaved] = useState(false)

  const [tindakanForm, setTindakanForm] = useState({
    kelompokTindakan: '', kodeICD9: '', namaTindakan: '', poliId: '', jumlahBiaya: 0, jasaDokter: 0, persentaseDokter: 0, rupiahDokter: 0, jasaAsisten: 0, jasaKlinik: 0,
  })
  const [tindakanErrors, setTindakanErrors] = useState({})
  const [tindakanSaved, setTindakanSaved] = useState(false)

  const [ruanganInput, setRuanganInput] = useState('')
  const [poliRuanganId, setPoliRuanganId] = useState(null)

  // DEPO
  const handleDepoSave = () => {
    const err = {}
    if (!depoForm.namaDepo.trim()) err.namaDepo = 'Wajib diisi'
    if (Object.keys(err).length > 0) { setDepoErrors(err); return }
    addDepoObat(depoForm)
    setDepoSaved(true); setDepoForm({ namaDepo: '', lokasi: '', keterangan: '' }); loadAll()
  }

  // POLI
  const handlePoliSave = () => {
    const err = {}
    if (!poliForm.kode.trim()) err.kode = 'Wajib diisi'
    if (!poliForm.nama.trim()) err.nama = 'Wajib diisi'
    if (Object.keys(err).length > 0) { setPoliErrors(err); return }
    addPoli({ ...poliForm, branchId, ruangan: [] })
    setPoliSaved(true); setPoliForm({ kode: '', nama: '', jenisPoli: '', unitStok: '', status: 'aktif', antrianFTKP: true }); loadAll()
  }

  const handleAddRuangan = (poliId) => {
    if (!ruanganInput.trim()) return
    addRuangan(poliId, ruanganInput); setRuanganInput(''); loadAll()
  }

  // TINDAKAN
  const handleTindakanSave = () => {
    const err = {}
    if (!tindakanForm.kodeICD9.trim()) err.kodeICD9 = 'Wajib diisi'
    if (!tindakanForm.namaTindakan.trim()) err.namaTindakan = 'Wajib diisi'
    if (!tindakanForm.poliId) err.poliId = 'Wajib diisi'
    if (Object.keys(err).length > 0) { setTindakanErrors(err); return }
    addTindakanMedis(tindakanForm)
    setTindakanSaved(true); setTindakanForm({ kelompokTindakan: '', kodeICD9: '', namaTindakan: '', poliId: '', jumlahBiaya: 0, jasaDokter: 0, persentaseDokter: 0, rupiahDokter: 0, jasaAsisten: 0, jasaKlinik: 0 }); loadAll()
  }

  const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)

  // KOLOM TABEL
  const depoColumns = [
    { key: 'namaDepo', label: 'Nama Depo', sortable: true },
    { key: 'lokasi', label: 'Lokasi', sortable: true },
    { key: 'keterangan', label: 'Keterangan' },
  ]

  const poliColumns = [
    { key: 'kode', label: 'Kode', sortable: true, width: '80px' },
    { key: 'nama', label: 'Nama Poliklinik', sortable: true },
    { key: 'jenisPoli', label: 'Jenis', sortable: true, render: (v) => <Badge variant="primary">{v || '-'}</Badge> },
    { key: 'unitStok', label: 'Unit Stok', render: (v) => <Badge variant="info">{v || '-'}</Badge> },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'aktif' ? 'success' : 'danger'}>{v}</Badge> },
    { key: 'antrianFTKP', label: 'FTKP', render: (v) => v ? <Badge variant="success">Ya</Badge> : <Badge variant="neutral">Tidak</Badge> },
    { key: 'ruangan', label: 'Ruangan', render: (v) => (
      <div className="flex flex-wrap gap-1">
        {v?.map((r, i) => <Badge key={i} variant="primary">{r}</Badge>)}
        {(!v || v.length === 0) && <span className="text-tiny text-[var(--text-muted)]">-</span>}
      </div>
    )},
  ]

  const tindakanColumns = [
    { key: 'kodeICD9', label: 'ICD-9', sortable: true, width: '80px', render: (v) => <span className="font-mono text-body-sm">{v}</span> },
    { key: 'namaTindakan', label: 'Nama Tindakan', sortable: true },
    { key: 'kelompokTindakan', label: 'Kelompok' },
    { key: 'poliId', label: 'Poliklinik', render: (v) => <Badge variant="primary">{poliList.find(p => p.id === v)?.nama || '-'}</Badge> },
    { key: 'jumlahBiaya', label: 'Biaya', render: (v) => formatRp(v) },
    { key: 'jasaDokter', label: 'Jasa Dokter', render: (v) => formatRp(v) },
    { key: 'persentaseDokter', label: '%', width: '50px', render: (v) => `${v}%` },
    { key: 'rupiahDokter', label: 'Rp Dokter', render: (v) => formatRp(v) },
    { key: 'jasaAsisten', label: 'Jasa Asisten', render: (v) => formatRp(v) },
    { key: 'jasaKlinik', label: 'Jasa Klinik', render: (v) => formatRp(v) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Data Master</h1>
          <p className="page-desc">Kelola seluruh data referensi klinik</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-primary)] overflow-x-auto">
        {[
          { key: 'depo-obat', label: 'Depo Obat', count: depoList.length },
          { key: 'poliklinik', label: 'Poliklinik', count: poliList.length },
          { key: 'tindakan', label: 'Tindakan Medis', count: tindakanList.length },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`btn btn-sm whitespace-nowrap ${activeTab === t.key ? 'btn-primary' : 'btn-secondary'}`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* TAB: DEPO OBAT */}
      {activeTab === 'depo-obat' && (
        <Card className="p-5">
          <h2 className="text-heading-lg font-bold text-[var(--text-primary)] mb-4">Data Depo Obat</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
              <h3 className="text-heading-md font-bold text-[var(--text-primary)]">Tambah Depo</h3>
              {depoSaved && <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-caption">✓ Berhasil disimpan</div>}
              <div>
                <label className="label">Nama Depo Obat</label>
                <input type="text" value={depoForm.namaDepo} onChange={e => setDepoForm({ ...depoForm, namaDepo: e.target.value })} className={`input ${depoErrors.namaDepo ? 'input-error' : ''}`} placeholder="Depo Utama" />
                {depoErrors.namaDepo && <p className="text-tiny text-red-500 mt-0.5">{depoErrors.namaDepo}</p>}
              </div>
              <div>
                <label className="label">Lokasi</label>
                <input type="text" value={depoForm.lokasi} onChange={e => setDepoForm({ ...depoForm, lokasi: e.target.value })} className="input" placeholder="Lantai 1" />
              </div>
              <div>
                <label className="label">Keterangan</label>
                <input type="text" value={depoForm.keterangan} onChange={e => setDepoForm({ ...depoForm, keterangan: e.target.value })} className="input" />
              </div>
              <button onClick={handleDepoSave} className="btn btn-primary w-full">Simpan</button>
            </div>
            <div className="lg:col-span-2">
              <TabelMaster columns={depoColumns} data={depoList} searchKey={['namaDepo', 'lokasi', 'keterangan']} searchPlaceholder="Cari depo..." />
            </div>
          </div>
        </Card>
      )}

      {/* TAB: POLIKLINIK */}
      {activeTab === 'poliklinik' && (
        <Card className="p-5">
          <h2 className="text-heading-lg font-bold text-[var(--text-primary)] mb-4">Data Poliklinik</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
              <h3 className="text-heading-md font-bold text-[var(--text-primary)]">Tambah Poli</h3>
              {poliSaved && <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-caption">✓ Berhasil disimpan</div>}
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
                  <select value={poliForm.unitStok} onChange={e => setPoliForm({ ...poliForm, unitStok: e.target.value })} className="input">
                    <option value="">-- Pilih Depo --</option>
                    {depoList.map(d => <option key={d.id} value={d.namaDepo}>{d.namaDepo}</option>)}
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
                  <select value={poliForm.antrianFTKP} onChange={e => setPoliForm({ ...poliForm, antrianFTKP: e.target.value === 'true' })} className="input">
                    <option value={true}>Ya</option>
                    <option value={false}>Tidak</option>
                  </select>
                </div>
              </div>
              <button onClick={handlePoliSave} className="btn btn-primary w-full">Simpan</button>
            </div>
            <div className="lg:col-span-2">
              <TabelMaster columns={poliColumns} data={poliList} searchKey={['kode', 'nama', 'jenisPoli']} searchPlaceholder="Cari poli..." />
              <div className="mt-4 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                <h4 className="text-heading-sm font-bold text-[var(--text-primary)] mb-3">Kelola Ruangan per Poli</h4>
                <div className="space-y-2">
                  {poliList.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-primary)]">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-body-sm">{p.nama}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.ruangan?.map((r, i) => <Badge key={i} variant="primary">{r}</Badge>)}
                          {(!p.ruangan || p.ruangan.length === 0) && <span className="text-tiny text-[var(--text-muted)]">Belum ada</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <input type="text" value={poliRuanganId === p.id ? ruanganInput : ''} onChange={e => { setPoliRuanganId(p.id); setRuanganInput(e.target.value) }} placeholder="R-GI-01" className="input w-28" onFocus={() => setPoliRuanganId(p.id)} />
                        <button onClick={() => handleAddRuangan(p.id)} className="btn btn-secondary btn-sm" disabled={poliRuanganId !== p.id || !ruanganInput.trim()}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB: TINDAKAN */}
      {activeTab === 'tindakan' && (
        <Card className="p-5">
          <h2 className="text-heading-lg font-bold text-[var(--text-primary)] mb-4">Data Tindakan Medis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] space-y-3">
              <h3 className="text-heading-md font-bold text-[var(--text-primary)]">Tambah Tindakan</h3>
              {tindakanSaved && <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-caption">✓ Berhasil disimpan</div>}
              <div>
                <label className="label">Kelompok Tindakan</label>
                <input type="text" value={tindakanForm.kelompokTindakan} onChange={e => setTindakanForm({ ...tindakanForm, kelompokTindakan: e.target.value })} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Kode ICD-9</label>
                  <input type="text" value={tindakanForm.kodeICD9} onChange={e => setTindakanForm({ ...tindakanForm, kodeICD9: e.target.value })} className={`input ${tindakanErrors.kodeICD9 ? 'input-error' : ''}`} placeholder="99.0" />
                </div>
                <div>
                  <label className="label">Nama Tindakan</label>
                  <input type="text" value={tindakanForm.namaTindakan} onChange={e => setTindakanForm({ ...tindakanForm, namaTindakan: e.target.value })} className={`input ${tindakanErrors.namaTindakan ? 'input-error' : ''}`} />
                </div>
              </div>
              <div>
                <label className="label">Poliklinik</label>
                <select value={tindakanForm.poliId} onChange={e => setTindakanForm({ ...tindakanForm, poliId: e.target.value })} className={`input ${tindakanErrors.poliId ? 'input-error' : ''}`}>
                  <option value="">-- Pilih --</option>
                  {poliList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Jumlah Biaya</label>
                <input type="number" value={tindakanForm.jumlahBiaya} onChange={e => setTindakanForm({ ...tindakanForm, jumlahBiaya: parseInt(e.target.value, 10) || 0 })} className="input" min={0} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label">Jasa Dokter</label>
                  <input type="number" value={tindakanForm.jasaDokter} onChange={e => setTindakanForm({ ...tindakanForm, jasaDokter: parseInt(e.target.value, 10) || 0 })} className="input" min={0} />
                </div>
                <div>
                  <label className="label">%</label>
                  <input type="number" value={tindakanForm.persentaseDokter} onChange={e => setTindakanForm({ ...tindakanForm, persentaseDokter: parseInt(e.target.value, 10) || 0 })} className="input" min={0} max={100} />
                </div>
                <div>
                  <label className="label">Rp Dokter</label>
                  <input type="number" value={tindakanForm.rupiahDokter} onChange={e => setTindakanForm({ ...tindakanForm, rupiahDokter: parseInt(e.target.value, 10) || 0 })} className="input" min={0} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Jasa Asisten</label>
                  <input type="number" value={tindakanForm.jasaAsisten} onChange={e => setTindakanForm({ ...tindakanForm, jasaAsisten: parseInt(e.target.value, 10) || 0 })} className="input" min={0} />
                </div>
                <div>
                  <label className="label">Jasa Klinik</label>
                  <input type="number" value={tindakanForm.jasaKlinik} onChange={e => setTindakanForm({ ...tindakanForm, jasaKlinik: parseInt(e.target.value, 10) || 0 })} className="input" min={0} />
                </div>
              </div>
              <button onClick={handleTindakanSave} className="btn btn-primary w-full">Simpan</button>
            </div>
            <div className="lg:col-span-2">
              <TabelMaster columns={tindakanColumns} data={tindakanList} searchKey={['kodeICD9', 'namaTindakan', 'kelompokTindakan']} searchPlaceholder="Cari tindakan..." />
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
