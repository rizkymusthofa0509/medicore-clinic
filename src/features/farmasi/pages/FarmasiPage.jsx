import { useState, useEffect } from 'react'

import { Card, Badge, Btn, Input } from '../../../shared/components/ui.jsx'
import {
  getObatList,
  getVisits,
  updateKunjunganStatus,
  updateObatStok,
  addObat,
  updateObatData,
  getCurrentBranchId,
  getBranches,
} from '../../../shared/store/clinic.js'

export default function FarmasiPage() {
  const branchId = getCurrentBranchId()
  const [activeTab, setActiveTab] = useState('resep') // 'resep' | 'stok'

  // Resep masuk dari dokter
  const [resepMasuk, setResepMasuk] = useState([])

  // Stok obat
  const [obatList, setObatList] = useState([])

  // Form edit stok
  const [formData, setFormData] = useState({
    nama: '',
    kategori: '',
    stok: 0,
    hargaBeli: 0,
    hargaJual: 0,
    stokMinimum: 0,
    satuan: 'tablet',
  })
  const [formMode, setFormMode] = useState('browse') // 'browse' | 'add' | 'edit'
  const [editingObatId, setEditingObatId] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [saved, setSaved] = useState(false)

  // Load
  useEffect(() => {
    loadResep()
    loadObat()
  }, [branchId])

  const loadResep = () => {
    const visits = getVisits(branchId)
    const resepList = []
    visits.forEach(v => {
      if (v.status === 'Diperiksa' || v.status === 'Apotek') {
        // Cari rekam medis dari history
        const allVisits = getVisits(branchId)
        const visWithHistory = allVisits.find(av => av.id === v.id)
        if (visWithHistory && visWithHistory.rekamMedis?.resep?.length > 0) {
          visWithHistory.rekamMedis.resep.forEach(r => {
            resepList.push({
              kunjunganId: v.id,
              noAntrean: v.noAntrean,
              patientName: v.patient?.nama || '',
              patientNoRM: v.patient?.noRM || '',
              poliName: v.poli?.nama || '',
              dokterName: v.dokter?.nama || '',
              obatId: r.obatId,
              dosis: r.dosis,
              qty: r.qty,
              status: v.status === 'Apotek' ? 'Siapkan Obat' : 'Belum',
            })
          })
        }
      }
    })
    setResepMasuk(resepList)
  }

  const loadObat = () => {
    setObatList(getObatList(branchId))
  }

  const handleSiapkanObat = (kunjunganId) => {
    const resep = resepMasuk.find(r => r.kunjunganId === kunjunganId)
    if (!resep) return
    // Kurangi stok obat
    updateObatStok(resep.obatId, -resep.qty, `Pembagian resep: ${resep.dosis}`)
    // Update status kunjungan
    updateKunjunganStatus(kunjunganId, 'Apotek')
    loadObat()
    loadResep()
    alert(`✅ Obat berhasil disiapkan. Stok ${getObatById(resep.obatId)?.nama} dikurangi ${resep.qty}.`)
  }

  const handleSelesai = (kunjunganId) => {
    updateKunjunganStatus(kunjunganId, 'Selesai')
    loadResep()
    alert('✅ Pasien selesai mengambil obat.')
  }

  const getObatById = (obatId) => obatList.find(o => o.id === obatId)

  const handleEditStok = (obat) => {
    setFormData({
      nama: obat.nama,
      kategori: obat.kategori,
      stok: obat.stok,
      hargaBeli: obat.hargaBeli,
      hargaJual: obat.hargaJual,
      stokMinimum: obat.stokMinimum,
      satuan: obat.satuan,
    })
    setFormMode('edit')
    setEditingObatId(obat.id)
    setSaved(false)
  }

  const handleAddObat = () => {
    setFormData({
      nama: '',
      kategori: '',
      stok: 0,
      hargaBeli: 0,
      hargaJual: 0,
      stokMinimum: 0,
      satuan: 'tablet',
    })
    setFormMode('add')
    setEditingObatId(null)
    setSaved(false)
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.nama.trim()) errors.nama = 'Nama obat wajib diisi'
    if (!formData.kategori.trim()) errors.kategori = 'Kategori wajib diisi'
    if (formData.stok < 0) errors.stok = 'Stok tidak boleh negatif'
    if (formData.hargaBeli < 0) errors.hargaBeli = 'Harga beli tidak boleh negatif'
    if (formData.hargaJual < 0) errors.hargaJual = 'Harga jual tidak boleh negatif'
    if (formData.stokMinimum < 0) errors.stokMinimum = 'Stok minimum tidak boleh negatif'
    return errors
  }

  const handleSimpan = () => {
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    if (formMode === 'add') {
      addObat(formData)
      setSaved(true)
      loadObat()
    } else if (formMode === 'edit') {
      updateObatData(editingObatId, formData)
      setSaved(true)
      loadObat()
    }
    setFormMode('browse')
  }

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Farmasi & Stok Obat</h1>
          <p className="page-desc">Manajemen resep & stok obat apotek</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-caption text-[var(--text-muted)]">Branch:</span>
          <select
            value={branchId}
            onChange={e => {
              // Update branch
            }}
            className="input input-sm flex-none w-48"
          >
            {getBranches().map(b => (
              <option key={b.id} value={b.id}>{b.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-1 border-b border-[var(--border-primary)]">
        <button
          onClick={() => setActiveTab('resep')}
          className={`btn btn-sm ${activeTab === 'resep' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg>
          Resep Masuk ({resepMasuk.length})
        </button>
        <button
          onClick={() => setActiveTab('stok')}
          className={`btn btn-sm ${activeTab === 'stok' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          Inventaris Obat ({obatList.length})
        </button>
      </div>

      {/* === TAB: Resep Masuk === */}
      {activeTab === 'resep' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading-lg font-bold text-[var(--text-primary)]">Resep dari Dokter</h2>
            <p className="text-caption text-[var(--text-muted)]">
              Pilih obat untuk disiapkan → konfirmasi selesai
            </p>
          </div>

          {resepMasuk.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg>
              <p className="text-body text-[var(--text-secondary)]">Belum ada resep masuk dari dokter</p>
              <p className="text-caption text-[var(--text-muted)] mt-1">Resep akan muncul setelah dokter menyimpan rekam medis.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Antrean</th>
                    <th>Pasien</th>
                    <th>Poli</th>
                    <th>Dokter</th>
                    <th>Obat</th>
                    <th>Dosis / Keterangan</th>
                    <th>Qty</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {resepMasuk.map((resep, i) => (
                    <tr key={`${resep.kunjunganId}-${i}`}>
                      <td className="font-medium">{resep.noAntrean}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] text-tiny font-bold">
                            {resep.patientName.charAt(0)}
                          </div>
                          <span className="font-medium">{resep.patientName}</span>
                          <span className="text-caption text-[var(--text-muted)]">({resep.patientNoRM})</span>
                        </div>
                      </td>
                      <td><Badge variant="primary">{resep.poliName}</Badge></td>
                      <td className="text-body-sm">{resep.dokterName}</td>
                      <td>
                        <span className="font-medium">{getObatById(resep.obatId)?.nama || 'Obat tidak ditemukan'}</span>
                        <span className="text-caption text-[var(--text-muted)] ml-1">
                          ({getObatById(resep.obatId)?.kategori || ''})
                        </span>
                      </td>
                      <td className="text-body-sm">{resep.dosis || '-'}</td>
                      <td className="font-medium">{resep.qty}</td>
                      <td>
                        <Badge variant={resep.status === 'Selesai' ? 'success' : 'warning'}>
                          {resep.status}
                        </Badge>
                      </td>
                      <td>
                        {resep.status === 'Belum' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSiapkanObat(resep.kunjunganId)}
                              className="btn btn-secondary btn-sm"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                              Siapkan
                            </button>
                          </div>
                        )}
                        {resep.status === 'Siapkan Obat' && (
                          <button
                            onClick={() => handleSelesai(resep.kunjunganId)}
                            className="btn btn-primary btn-sm"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
                            Selesai
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* === TAB: Inventaris Obat === */}
      {activeTab === 'stok' && (
        <div className="space-y-4">
          {/* Tombol + */}
          <div className="flex justify-end">
            <button onClick={handleAddObat} className="btn btn-primary btn-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Tambah Obat Baru
            </button>
          </div>

          {/* Form (berada di atas tabel) */}
          {formMode === 'add' && (
            <Card className="p-5 border-dashed border-[var(--border-primary)]">
              <h2 className="text-heading-md font-bold text-[var(--text-primary)] mb-4">
                {saved ? '✓ Obat berhasil ditambahkan!' : 'Tambah Obat Baru'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Nama Obat</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                    className={`input ${formErrors.nama ? 'input-error' : ''}`}
                    placeholder="Paracetamol 500mg"
                  />
                  {formErrors.nama && <p className="text-caption text-red-500 mt-1">{formErrors.nama}</p>}
                </div>
                <div>
                  <label className="label">Kategori</label>
                  <input
                    type="text"
                    value={formData.kategori}
                    onChange={e => setFormData({ ...formData, kategori: e.target.value })}
                    className={`input ${formErrors.kategori ? 'input-error' : ''}`}
                    placeholder="Analgesik, Antibiotik, dll"
                  />
                  {formErrors.kategori && <p className="text-caption text-red-500 mt-1">{formErrors.kategori}</p>}
                </div>
                <div>
                  <label className="label">Satuan</label>
                  <select
                    value={formData.satuan}
                    onChange={e => setFormData({ ...formData, satuan: e.target.value })}
                    className="input"
                  >
                    <option value="tablet">Tablet</option>
                    <option value="kapsul">Kapsul</option>
                    <option value="vial">Vial</option>
                    <option value="syrup">Syrup</option>
                    <option value="salep">Salep</option>
                    <option value="kemasan">Kemasan</option>
                  </select>
                </div>
                <div>
                  <label className="label">Stok</label>
                  <input
                    type="number"
                    value={formData.stok}
                    onChange={e => setFormData({ ...formData, stok: parseInt(e.target.value, 10) || 0 })}
                    className={`input ${formErrors.stok ? 'input-error' : ''}`}
                    min={0}
                  />
                  {formErrors.stok && <p className="text-caption text-red-500 mt-1">{formErrors.stok}</p>}
                </div>
                <div>
                  <label className="label">Harga Beli (Rp)</label>
                  <input
                    type="number"
                    value={formData.hargaBeli}
                    onChange={e => setFormData({ ...formData, hargaBeli: parseInt(e.target.value, 10) || 0 })}
                    className={`input ${formErrors.hargaBeli ? 'input-error' : ''}`}
                    min={0}
                  />
                  {formErrors.hargaBeli && <p className="text-caption text-red-500 mt-1">{formErrors.hargaBeli}</p>}
                </div>
                <div>
                  <label className="label">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    value={formData.hargaJual}
                    onChange={e => setFormData({ ...formData, hargaJual: parseInt(e.target.value, 10) || 0 })}
                    className={`input ${formErrors.hargaJual ? 'input-error' : ''}`}
                    min={0}
                  />
                  {formErrors.hargaJual && <p className="text-caption text-red-500 mt-1">{formErrors.hargaJual}</p>}
                </div>
                <div>
                  <label className="label">Stok Minimum (peringatan)</label>
                  <input
                    type="number"
                    value={formData.stokMinimum}
                    onChange={e => setFormData({ ...formData, stokMinimum: parseInt(e.target.value, 10) || 0 })}
                    className={`input ${formErrors.stokMinimum ? 'input-error' : ''}`}
                    min={0}
                  />
                  {formErrors.stokMinimum && <p className="text-caption text-red-500 mt-1">{formErrors.stokMinimum}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setFormMode('browse')} className="btn btn-ghost">
                  Batal
                </button>
                <button onClick={handleSimpan} className="btn btn-primary">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 3 5-3V21a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h10"/></svg>
                  Simpan
                </button>
              </div>
            </Card>
          )}

          {formMode === 'edit' && (
            <Card className="p-5 border-[var(--brand-primary)]">
              <h2 className="text-heading-md font-bold text-[var(--text-primary)] mb-4">
                {saved ? '✓ Obat berhasil diperbarui!' : 'Edit Stok Obat'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Nama Obat</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                    className="input"
                    disabled
                  />
                </div>
                <div>
                  <label className="label">Kategori</label>
                  <input
                    type="text"
                    value={formData.kategori}
                    onChange={e => setFormData({ ...formData, kategori: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Satuan</label>
                  <select
                    value={formData.satuan}
                    onChange={e => setFormData({ ...formData, satuan: e.target.value })}
                    className="input"
                  >
                    <option value="tablet">Tablet</option>
                    <option value="kapsul">Kapsul</option>
                    <option value="vial">Vial</option>
                    <option value="syrup">Syrup</option>
                    <option value="salep">Salep</option>
                    <option value="kemasan">Kemasan</option>
                  </select>
                </div>
                <div>
                  <label className="label">Stok</label>
                  <input
                    type="number"
                    value={formData.stok}
                    onChange={e => setFormData({ ...formData, stok: parseInt(e.target.value, 10) || 0 })}
                    className={`input ${formErrors.stok ? 'input-error' : ''}`}
                    min={0}
                  />
                  {formErrors.stok && <p className="text-caption text-red-500 mt-1">{formErrors.stok}</p>}
                </div>
                <div>
                  <label className="label">Harga Beli (Rp)</label>
                  <input
                    type="number"
                    value={formData.hargaBeli}
                    onChange={e => setFormData({ ...formData, hargaBeli: parseInt(e.target.value, 10) || 0 })}
                    className="input"
                    min={0}
                  />
                </div>
                <div>
                  <label className="label">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    value={formData.hargaJual}
                    onChange={e => setFormData({ ...formData, hargaJual: parseInt(e.target.value, 10) || 0 })}
                    className="input"
                    min={0}
                  />
                </div>
                <div>
                  <label className="label">Stok Minimum</label>
                  <input
                    type="number"
                    value={formData.stokMinimum}
                    onChange={e => setFormData({ ...formData, stokMinimum: parseInt(e.target.value, 10) || 0 })}
                    className={`input ${formErrors.stokMinimum ? 'input-error' : ''}`}
                    min={0}
                  />
                  {formErrors.stokMinimum && <p className="text-caption text-red-500 mt-1">{formErrors.stokMinimum}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setFormMode('browse')} className="btn btn-ghost">
                  Batal
                </button>
                <button onClick={handleSimpan} className="btn btn-primary">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 3 5-3V21a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h10"/></svg>
                  Update
                </button>
              </div>
            </Card>
          )}

          {/* Tabel stok */}
          <Card className="p-5">
            <h2 className="text-heading-lg font-bold text-[var(--text-primary)] mb-4">Daftar Obat</h2>

            {obatList.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-body text-[var(--text-secondary)]">Belum ada data obat. Tambahkan obat baru.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nama Obat</th>
                      <th>Kategori</th>
                      <th>Stok</th>
                      <th>Harga Beli</th>
                      <th>Harga Jual</th>
                      <th>Stok Min.</th>
                      <th>Satuan</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obatList.map(ob => {
                      const isCritical = ob.stok <= ob.stokMinimum
                      return (
                        <tr
                          key={ob.id}
                          className={isCritical ? 'bg-red-50/30 dark:bg-red-900/20' : ''}
                        >
                          <td>
                            <span className="font-medium">{ob.nama}</span>
                          </td>
                          <td><Badge variant="neutral">{ob.kategori}</Badge></td>
                          <td className={`font-medium ${isCritical ? 'text-red-600 dark:text-red-400' : ''}`}>
                            {ob.stok}
                          </td>
                          <td className="text-body-sm">{formatRupiah(ob.hargaBeli)}</td>
                          <td className="font-medium">{formatRupiah(ob.hargaJual)}</td>
                          <td>
                            <span className="text-caption">{ob.stokMinimum}</span>
                          </td>
                          <td className="text-caption text-[var(--text-muted)]">{ob.satuan}</td>
                          <td>
                            {isCritical ? (
                              <Badge variant="danger">Kritis</Badge>
                            ) : ob.stok <= ob.stokMinimum * 2 ? (
                              <Badge variant="warning">Hampir Kritis</Badge>
                            ) : (
                              <Badge variant="success">Normal</Badge>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => handleEditStok(ob)}
                              className="btn btn-secondary btn-sm"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              Edit
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
