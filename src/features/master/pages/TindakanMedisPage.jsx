import { useState, useEffect } from 'react'

import { Card, Badge, Input } from '../../../shared/components/ui.jsx'
import { TabelMaster } from '../../../shared/components/TabelMaster.jsx'
import {
  getTindakanMedis,
  addTindakanMedis,
  getPoli,
  getCurrentBranchId,
} from '../../../shared/store/clinic.js'

export default function TindakanMedisPage() {
  const branchId = getCurrentBranchId()
  const [tindakanList, setTindakanList] = useState([])
  const [poliList, setPoliList] = useState([])
  const [tindakanForm, setTindakanForm] = useState({
    kelompokTindakan: '', kodeICD9: '', namaTindakan: '', poliId: '', jumlahBiaya: 0, jasaDokter: 0, persentaseDokter: 0, rupiahDokter: 0, jasaAsisten: 0, jasaKlinik: 0,
  })
  const [tindakanErrors, setTindakanErrors] = useState({})
  const [tindakanSaved, setTindakanSaved] = useState(false)

  useEffect(() => {
    setTindakanList(getTindakanMedis())
    setPoliList(getPoli(branchId))
  }, [branchId])

  const handleTindakanSave = () => {
    const err = {}
    if (!tindakanForm.kodeICD9.trim()) err.kodeICD9 = 'Wajib diisi'
    if (!tindakanForm.namaTindakan.trim()) err.namaTindakan = 'Wajib diisi'
    if (!tindakanForm.poliId) err.poliId = 'Wajib diisi'
    if (Object.keys(err).length > 0) { setTindakanErrors(err); return }
    addTindakanMedis(tindakanForm)
    setTindakanSaved(true)
    setTindakanForm({ kelompokTindakan: '', kodeICD9: '', namaTindakan: '', poliId: '', jumlahBiaya: 0, jasaDokter: 0, persentaseDokter: 0, rupiahDokter: 0, jasaAsisten: 0, jasaKlinik: 0 })
    setTindakanErrors({})
    setTindakanList(getTindakanMedis())
  }

  const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)

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
          <h1 className="page-title">Data Tindakan Medis</h1>
          <p className="page-desc">Kelola daftar tindakan dan pembagian jasa medis</p>
        </div>
      </div>

      <Card className="p-5">
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
    </div>
  )
}
