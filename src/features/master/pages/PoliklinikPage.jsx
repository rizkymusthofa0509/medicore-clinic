import { useState, useEffect } from 'react'

import { Card, Badge, Input } from '../../../shared/components/ui.jsx'
import { TabelMaster } from '../../../shared/components/TabelMaster.jsx'
import {
  getPoli,
  addPoli,
  addRuangan,
  getDepoObat,
  getCurrentBranchId,
} from '../../../shared/store/clinic.js'

export default function PoliklinikPage() {
  const branchId = getCurrentBranchId()
  const [poliList, setPoliList] = useState([])
  const [depoList, setDepoList] = useState([])
  const [poliForm, setPoliForm] = useState({ kode: '', nama: '', jenisPoli: '', unitStok: '', status: 'aktif', antrianFTKP: true })
  const [poliErrors, setPoliErrors] = useState({})
  const [poliSaved, setPoliSaved] = useState(false)
  const [ruanganInput, setRuanganInput] = useState('')
  const [poliRuanganId, setPoliRuanganId] = useState(null)

  useEffect(() => {
    setPoliList(getPoli(branchId))
    setDepoList(getDepoObat())
  }, [branchId])

  const handlePoliSave = () => {
    const err = {}
    if (!poliForm.kode.trim()) err.kode = 'Wajib diisi'
    if (!poliForm.nama.trim()) err.nama = 'Wajib diisi'
    if (Object.keys(err).length > 0) { setPoliErrors(err); return }
    addPoli({ ...poliForm, branchId, ruangan: [] })
    setPoliSaved(true)
    setPoliForm({ kode: '', nama: '', jenisPoli: '', unitStok: '', status: 'aktif', antrianFTKP: true })
    setPoliErrors({})
    setPoliList(getPoli(branchId))
  }

  const handleAddRuangan = (poliId) => {
    if (!ruanganInput.trim()) return
    addRuangan(poliId, ruanganInput)
    setRuanganInput('')
    setPoliList(getPoli(branchId))
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Data Poliklinik</h1>
          <p className="page-desc">Kelola poliklinik dan ruangan di setiap unit</p>
        </div>
      </div>

      <Card className="p-5">
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
    </div>
  )
}
