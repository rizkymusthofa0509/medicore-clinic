import { useState, useEffect } from 'react'

import { Card, Badge, Input } from '../../../shared/components/ui.jsx'
import { TabelMaster } from '../../../shared/components/TabelMaster.jsx'
import {
  getDepoObat,
  addDepoObat,
  getCurrentBranchId,
} from '../../../shared/store/clinic.js'

export default function DepoObatPage() {
  const [depoList, setDepoList] = useState([])
  const [depoForm, setDepoForm] = useState({ namaDepo: '', lokasi: '', keterangan: '' })
  const [depoErrors, setDepoErrors] = useState({})
  const [depoSaved, setDepoSaved] = useState(false)

  useEffect(() => { setDepoList(getDepoObat()) }, [])

  const handleDepoSave = () => {
    const err = {}
    if (!depoForm.namaDepo.trim()) err.namaDepo = 'Wajib diisi'
    if (Object.keys(err).length > 0) { setDepoErrors(err); return }
    addDepoObat(depoForm)
    setDepoSaved(true)
    setDepoForm({ namaDepo: '', lokasi: '', keterangan: '' })
    setDepoErrors({})
    setDepoList(getDepoObat())
  }

  const depoColumns = [
    { key: 'namaDepo', label: 'Nama Depo', sortable: true },
    { key: 'lokasi', label: 'Lokasi', sortable: true },
    { key: 'keterangan', label: 'Keterangan' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Data Depo Obat</h1>
          <p className="page-desc">Kelola depot obat di seluruh unit klinik</p>
        </div>
      </div>

      <Card className="p-5">
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
    </div>
  )
}
