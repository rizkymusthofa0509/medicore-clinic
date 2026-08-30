import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { Card, Badge, Btn, Input } from '../../../shared/components/ui.jsx'
import {
  getVisits,
  getKunjunganById,
  getKunjunganByIdWithHistory,
  addRekamMedis,
  getDoctors,
  getNextNoAntrean,
  getCurrentBranchId,
  updateKunjunganStatus,
  getObatList,
  getVisitHistoryByBranch,
} from '../../../shared/store/clinic.js'

export default function RmePage() {
  const branchId = getCurrentBranchId()
  const [activeTab, setActiveTab] = useState('daftar') // 'daftar' | 'riwayat'

  // Antrean pasien di meja dokter
  const [antreanPasien, setAntreanPasien] = useState([])
  const [selectedVisit, setSelectedVisit] = useState(null)

  // Form rekam medis
  const [formData, setFormData] = useState({
    tensi: '',
    suhu: '',
    beratBadan: '',
    keluhan: '',
    diagnosis: '',
    resep: [{ obatId: '', dosis: '', qty: 1 }],
  })
  const [formErrors, setFormErrors] = useState({})
  const [rekamSaved, setRekamSaved] = useState(false)

  // Riwayat medis
  const [riwayat, setRiwayat] = useState([])
  const [showRiwayatDetail, setShowRiwayatDetail] = useState(null)

  const obatList = getObatList(branchId)

  // Load antrean
  useEffect(() => {
    const visits = getVisits(branchId)
    setAntreanPasien(visits.filter(v => v.status === 'Menunggu' || v.status === 'Diperiksa'))
  }, [branchId])

  // Load riwayat
  useEffect(() => {
    const history = getVisitHistoryByBranch(branchId)
    setRiwayat(history)
  }, [branchId])

  const handleSelectVisit = (visit) => {
    setSelectedVisit(visit)
    // Isi form dengan data yang ada jika sudah direkam
    const history = getVisitHistoryByBranch(branchId)
    const existing = history.find(h => h.id === visit.id)
    if (existing && existing.rekamMedis) {
      setFormData({
        tensi: existing.rekamMedis.tensi || '',
        suhu: existing.rekamMedis.suhu || '',
        beratBadan: existing.rekamMedis.beratBadan || '',
        keluhan: existing.rekamMedis.keluhan || '',
        diagnosis: existing.rekamMedis.diagnosis || '',
        resep: existing.rekamMedis.resep.map(r => ({ ...r })) || [{ obatId: '', dosis: '', qty: 1 }],
      })
    } else {
      setFormData({
        tensi: '',
        suhu: '',
        beratBadan: '',
        keluhan: '',
        diagnosis: '',
        resep: [{ obatId: '', dosis: '', qty: 1 }],
      })
    }
    setRekamSaved(false)
    setFormErrors({})
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.keluhan.trim()) errors.keluhan = 'Keluhan wajib diisi'
    if (!formData.diagnosis.trim()) errors.diagnosis = 'Diagnosis wajib diisi'
    return errors
  }

  const handleSaveRekamMedis = () => {
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const visitId = selectedVisit?.id
    if (!visitId) {
      alert('Pilih pasien terlebih dahulu')
      return
    }

    updateKunjunganStatus(visitId, 'Diperiksa')
    const rm = addRekamMedis(visitId, formData)
    if (rm) {
      setRekamSaved(true)
      // Update antrean
      const visits = getVisits(branchId)
      setAntreanPasien(visits.filter(v => v.status === 'Menunggu' || v.status === 'Diperiksa'))
    }
  }

  const addResepRow = () => {
    setFormData({ ...formData, resep: [...formData.resep, { obatId: '', dosis: '', qty: 1 }] })
  }

  const removeResepRow = (index) => {
    if (formData.resep.length === 1) return
    const newResep = formData.resep.filter((_, i) => i !== index)
    setFormData({ ...formData, resep: newResep })
  }

  const updateResep = (index, field, value) => {
    const newResep = [...formData.resep]
    newResep[index][field] = value
    setFormData({ ...formData, resep: newResep })
  }

  const dokterByPoli = getDoctors(branchId, selectedVisit?.poliId)
  const noAntreanCount = getNextNoAntrean('pl_001')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Rekam Medis Elektronik</h1>
          <p className="page-desc">Pemeriksaan pasien & penentuan resep obat</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-caption text-[var(--text-muted)]">No. Antrean berikutnya:</span>
          <Badge variant="primary">{noAntreanCount}</Badge>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-[var(--border-primary)]">
        <button
          onClick={() => setActiveTab('daftar')}
          className={`btn btn-sm ${activeTab === 'daftar' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg>
          Daftar Antrean ({antreanPasien.filter(v => v.status === 'Menunggu').length})
        </button>
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`btn btn-sm ${activeTab === 'riwayat' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
          Riwayat Medis Pasien
        </button>
      </div>

      {/* === TAB: Daftar Antrean === */}
      {activeTab === 'daftar' && (
        <div className="space-y-6">
          {/* Daftar antrean */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading-lg font-bold text-[var(--text-primary)]">
                Antrean Pasien
                <span className="ml-2 text-caption text-[var(--text-muted)]">
                  (Menunggu: {antreanPasien.filter(v => v.status === 'Menunggu').length} | Diperiksa: {antreanPasien.filter(v => v.status === 'Diperiksa').length})
                </span>
              </h2>
            </div>

            {antreanPasien.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <p className="text-body text-[var(--text-secondary)]">Belum ada pasien dalam antrean</p>
              </div>
            ) : (
              <div className="space-y-2">
                {antreanPasien.map(vis => (
                  <div
                    key={vis.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${selectedVisit?.id === vis.id ? 'border-[var(--brand-primary)] bg-[var(--brand-light)]/30' : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'} ${vis.status === 'Diperiksa' ? 'bg-[var(--accent-light)]/20 border-[var(--accent-primary)]/30' : ''}`}
                    onClick={() => handleSelectVisit(vis)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] font-bold">
                          {vis.patient?.nama?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-body">{vis.patient?.nama || '-'}</p>
                          <p className="text-caption text-[var(--text-muted)]">
                            {vis.patient?.noRM} • {vis.noAntrean} • {vis.poli?.nama}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant={vis.status === 'Diperiksa' ? 'accent' : 'neutral'}>
                        {vis.status}
                      </Badge>
                      <p className="text-caption text-[var(--text-muted)] mt-1">
                        {vis.createdAt ? new Date(vis.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </p>
                    </div>

                    {vis.status === 'Menunggu' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelectVisit(vis) }}
                        className="btn btn-primary btn-sm"
                      >
                        Pilih
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Form rekam medis */}
          {selectedVisit && (
            <Card className="p-6 border-[var(--brand-primary)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-heading-lg font-bold text-[var(--text-primary)]">
                    Rekam Medis — {selectedVisit.patient?.nama}
                  </h2>
                  <p className="text-caption text-[var(--text-muted)]">
                    No. Antrean: {selectedVisit.noAntrean} • Poli: {selectedVisit.poli?.nama} • {selectedVisit.dokter?.nama}
                  </p>
                </div>
                {rekamSaved && (
                  <Badge variant="success">✓ Berhasil disimpan</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Tanda Vital: Tekanan Darah</label>
                  <Input
                    type="text"
                    value={formData.tensi}
                    onChange={(e) => setFormData({ ...formData, tensi: e.target.value })}
                    placeholder="Contoh: 120/80"
                    className={formErrors.tensi ? 'input-error' : ''}
                  />
                  <p className="text-caption text-[var(--text-muted)] mt-1">Contoh: 120/80, 130/90</p>
                </div>

                <div>
                  <label className="label">Tanda Vital: Suhu (°C)</label>
                  <Input
                    type="text"
                    value={formData.suhu}
                    onChange={(e) => setFormData({ ...formData, suhu: e.target.value })}
                    placeholder="Contoh: 36.5"
                    className={formErrors.suhu ? 'input-error' : ''}
                  />
                </div>

                <div>
                  <label className="label">Tanda Vital: Berat Badan (kg)</label>
                  <Input
                    type="text"
                    value={formData.beratBadan}
                    onChange={(e) => setFormData({ ...formData, beratBadan: e.target.value })}
                    placeholder="Contoh: 62"
                    className={formErrors.beratBadan ? 'input-error' : ''}
                  />
                </div>

                <div>
                  <label className="label">Dokter yang memeriksa</label>
                  <div className="p-3 rounded-lg bg-[var(--brand-light)]">
                    <p className="font-medium">{selectedVisit.dokter?.nama}</p>
                    <p className="text-caption text-[var(--text-muted)]">{selectedVisit.dokter?.spesialisasi}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="label">Keluhan Utama</label>
                <textarea
                  value={formData.keluhan}
                  onChange={(e) => setFormData({ ...formData, keluhan: e.target.value })}
                  className={`input ${formErrors.keluhan ? 'input-error' : ''}`}
                  placeholder="Sebutkan keluhan yang dialami pasien..."
                  rows={3}
                />
                {formErrors.keluhan && <p className="text-caption text-red-500 mt-1">{formErrors.keluhan}</p>}
              </div>

              <div className="mt-4">
                <label className="label">Diagnosis Dokter</label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className={`input ${formErrors.diagnosis ? 'input-error' : ''}`}
                  placeholder="Diagnosis atau kecurigaan dokter..."
                  rows={2}
                />
                {formErrors.diagnosis && <p className="text-caption text-red-500 mt-1">{formErrors.diagnosis}</p>}
              </div>

              {/* Daftar obat */}
              <div className="mt-4">
                <label className="label">Resep Obat & Dosis</label>
                <div className="space-y-2">
                  {formData.resep.map((resep, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <select
                          value={resep.obatId}
                          onChange={(e) => updateResep(index, 'obatId', e.target.value)}
                          className="input flex-1"
                        >
                          <option value="">-- Pilih Obat --</option>
                          {obatList.map((ob) => (
                            <option key={ob.id} value={ob.id}>{ob.nama}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={resep.dosis}
                          onChange={(e) => updateResep(index, 'dosis', e.target.value)}
                          placeholder="Dosis"
                          className="flex-1"
                        />
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          value={resep.qty}
                          onChange={(e) => updateResep(index, 'qty', parseInt(e.target.value, 10) || 1)}
                          placeholder="Qty"
                          className="w-full"
                        />
                      </div>
                      <button
                        onClick={() => removeResepRow(index)}
                        className="btn btn-danger btn-icon-sm"
                        disabled={formData.resep.length === 1}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={addResepRow} className="btn btn-secondary btn-sm mt-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                  Tambah Obat
                </button>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => { setSelectedVisit(null); setRekamSaved(false) }}
                  className="btn btn-ghost"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveRekamMedis}
                  className="btn btn-primary btn-lg"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 3 5-3V21a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h10"/></svg>
                  {rekamSaved ? 'Simpan Lagi' : 'Simpan Rekam Medis'}
                </button>
              </div>
            </Card>
          )}

          {/* Jika tidak ada pasien terpilih */}
          {!selectedVisit && (
            <Card className="p-6 text-center">
              <svg className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg>
              <p className="text-body text-[var(--text-secondary)]">Pilih pasien dari daftar antrean untuk membuat rekam medis</p>
            </Card>
          )}
        </div>
      )}

      {/* === TAB: Riwayat Medis === */}
      {activeTab === 'riwayat' && (
        <Card className="p-5">
          <h2 className="text-heading-lg font-bold text-[var(--text-primary)] mb-4">Riwayat Kunjungan Pasien</h2>

          {riwayat.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-body text-[var(--text-secondary)]">Belum ada riwayat kunjungan</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Tanggal</th>
                    <th>Pasien</th>
                    <th>Poli</th>
                    <th>Dokter</th>
                    <th>Status</th>
                    <th>Total Bayar</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayat.map((hist, i) => (
                    <tr key={hist.id}>
                      <td className="text-caption text-[var(--text-muted)]">{i + 1}</td>
                      <td className="text-body">{hist.tanggal}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] text-tiny font-bold">
                            {hist.patient?.nama?.charAt(0)}
                          </div>
                          <span className="font-medium">{hist.patient?.nama}</span>
                        </div>
                      </td>
                      <td><Badge variant="primary">{hist.poli?.nama}</Badge></td>
                      <td className="text-body-sm">{hist.dokter?.nama || '-'}</td>
                      <td><Badge variant={hist.status === 'Selesai' ? 'success' : 'warning'}>{hist.status}</Badge></td>
                      <td className="font-medium">
                        {hist.tagihan ? (
                          <span className="text-success">Rp {hist.tagihan.totalBayar.toLocaleString('id-ID')}</span>
                        ) : '-'}
                      </td>
                      <td>
                        <button
                          onClick={() => setShowRiwayatDetail(hist.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modal detail riwayat */}
      {showRiwayatDetail && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading-lg font-bold text-[var(--text-primary)]">Detail Kunjungan</h2>
            <button onClick={() => setShowRiwayatDetail(null)} className="btn btn-ghost btn-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {(() => {
            const hist = riwayat.find(h => h.id === showRiwayatDetail)
            if (!hist) return null
            return (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <p className="text-caption text-[var(--text-muted)] mb-1">Pasien</p>
                  <p className="font-medium">{hist.patient?.nama} ({hist.patient?.noRM})</p>
                  <p className="text-caption">{hist.patient?.alamat}</p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                  <p className="text-caption text-[var(--text-muted)] mb-1">Poli & Dokter</p>
                  <p className="font-medium">{hist.poli?.nama} • {hist.dokter?.nama}</p>
                  <p className="text-caption">{hist.tanggal} • No. Antrean: {hist.noAntrean}</p>
                </div>

                {hist.rekamMedis && (
                  <div className="p-3 rounded-lg bg-[var(--brand-light)] border border-[var(--brand-primary)]/30">
                    <p className="text-caption text-[var(--brand-primary)] mb-2">Rekam Medis</p>
                    <div className="grid grid-cols-3 gap-3 text-body-sm">
                      <div>
                        <p className="text-[var(--text-muted)]">Tensi</p>
                        <p className="font-medium">{hist.rekamMedis.tensi || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-muted)]">Suhu</p>
                        <p className="font-medium">{hist.rekamMedis.suhu || '-'}°C</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-muted)]">BB</p>
                        <p className="font-medium">{hist.rekamMedis.beratBadan || '-'}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-[var(--text-muted)]">Keluhan</p>
                      <p className="text-body">{hist.rekamMedis.keluhan || '-'}</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-[var(--text-muted)]">Diagnosis</p>
                      <p className="text-body">{hist.rekamMedis.diagnosis || '-'}</p>
                    </div>
                  </div>
                )}

                {hist.rekamMedis?.resep && hist.rekamMedis.resep.length > 0 && (
                  <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                    <p className="text-caption text-[var(--text-muted)] mb-2">Resep Obat</p>
                    <div className="space-y-1">
                      {hist.rekamMedis.resep.map((r, i) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b border-[var(--border-primary)] last:border-0">
                          <div>
                            <span className="font-medium">{r.obat?.nama || 'Obat tidak ditemukan'}</span>
                            <span className="text-caption text-[var(--text-muted)] ml-2">{r.dosis}</span>
                          </div>
                          <span className="text-caption">{r.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hist.tagihan && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-caption text-emerald-700 dark:text-emerald-300 mb-2">Tagihan & Pembayaran</p>
                    <div className="grid grid-cols-2 gap-3 text-body-sm">
                      <div>
                        <p className="text-[var(--text-muted)]">Biaya Konsultasi</p>
                        <p className="font-medium">Rp {hist.tagihan.biayaKonsultasi.toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-muted)]">Biaya Tindakan</p>
                        <p className="font-medium">Rp {hist.tagihan.biayaTindakan.toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-muted)]">Total Obat</p>
                        <p className="font-medium">Rp {hist.tagihan.totalObat.toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-muted)]">Total Bayar</p>
                        <p className="font-bold text-lg">Rp {hist.tagihan.totalBayar.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                      <p className="text-caption text-[var(--text-muted)]">Metode Pembayaran: <Badge variant="success">{hist.tagihan.metodePembayaran}</Badge></p>
                      <p className="text-caption text-[var(--text-muted)]">Tgl. Bayar: {hist.tglBayar}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </Card>
      )}

      {/* Placeholder dokter */}
      {activeTab === 'daftar' && !selectedVisit && antreanPasien.length === 0 && (
        <div className="text-center text-body text-[var(--text-muted)]">
          <p>Silakan pilih pasien dari daftar antrean untuk memulai rekam medis.</p>
        </div>
      )}
    </div>
  )
}
