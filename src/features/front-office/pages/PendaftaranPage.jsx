import { useState, useEffect } from 'react'

import { Card, Badge, Btn, Input } from '../../../shared/components/ui.jsx'
import {
  searchPatient,
  registerNewPatient,
  getPatients,
  getVisitHistoryByBranch,
  getPoli,
  getDoctors,
  getCurrentBranchId,
  hitungUmur,
  createKunjungan,
  getVisits,
} from '../../../shared/store/clinic.js'

export default function PendaftaranPage() {
  const branchId = getCurrentBranchId()

  // ============ STATE ============
  // Step 1: Pilih/Register Pasien
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isNewPatient, setIsNewPatient] = useState(true)

  // Form pasien baru (komprehensive)
  const [formData, setFormData] = useState({
    noRMLama: '',
    nama: '',
    jenisIdentitas: 'KTP',
    nik: '',
    tempatLahir: '',
    tglLahir: '',
    umur: '',
    gender: 'Laki-laki',
    golonganDarah: '',
    agama: '',
    statusPernikahan: '',
    pendidikan: '',
    alamat: '',
    kelurahan: '',
    kecamatan: '',
    kabupaten: '',
    provinsi: '',
    noHP: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [registeredPatient, setRegisteredPatient] = useState(null)

  // Step 2: Form Kunjungan
  const [kunjunganForm, setKunjunganForm] = useState({
    pasienId: '',
    statusKunjungan: 'Baru',
    penanggungJawab: 'Pasien',
    namaPenanggungJawab: '',
    tanggal: new Date().toISOString().slice(0, 10),
    jam: new Date().toTimeString().slice(0, 5),
    poliId: '',
    dokterId: '',
    ruangan: '',
    penjamin: 'UMUM',
    noPenjamin: '',
    catatanPenjamin: '',
  })
  const [kunjunganErrors, setKunjunganErrors] = useState({})
  const [kunjunganSaved, setKunjunganSaved] = useState(false)

  // Poli & Dokter
  const polis = getPoli(branchId)
  const [filteredDoctors, setFilteredDoctors] = useState([])
  const [selectedPoliRuangan, setSelectedPoliRuangan] = useState([])

  // Riwayat pasien (jika pasien lama)
  const [riwayatPasien, setRiwayatPasien] = useState([])
  const [showRiwayat, setShowRiwayat] = useState(false)

  // ============ EFFECTS ============
  // Filter dokter saat poli berubah
  useEffect(() => {
    if (kunjunganForm.poliId) {
      const dokters = getDoctors(branchId, kunjunganForm.poliId)
      setFilteredDoctors(dokters)
      const poli = polis.find(p => p.id === kunjunganForm.poliId)
      setSelectedPoliRuangan(poli?.ruangan || [])
      setKunjunganForm(prev => ({ ...prev, dokterId: '', ruangan: '' }))
    } else {
      setFilteredDoctors([])
      setSelectedPoliRuangan([])
    }
  }, [kunjunganForm.poliId, branchId])

  // Auto hitung umur
  useEffect(() => {
    if (formData.tglLahir) {
      const umur = hitungUmur(formData.tglLahir)
      setFormData(prev => ({ ...prev, umur }))
    }
  }, [formData.tglLahir])

  // Load riwayat saat pasien dipilih
  useEffect(() => {
    if (selectedPatient) {
      const riwayat = getVisitHistoryByBranch(branchId).filter(h => h.patientId === selectedPatient.id)
      setRiwayatPasien(riwayat)
      setKunjunganForm(prev => ({
        ...prev,
        pasienId: selectedPatient.id,
        namaPenanggungJawab: selectedPatient.nama,
        statusKunjungan: riwayat.length > 0 ? 'Lama' : 'Baru',
      }))
    }
  }, [selectedPatient, branchId])

  // ============ HANDLERS ============
  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = searchPatient(searchQuery)
      setSearchResults(results)
      setShowSearchResults(true)
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  const handleSelectPatient = (pasien) => {
    setSelectedPatient(pasien)
    setIsNewPatient(false)
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
    setRegisteredPatient(null)
    setShowRiwayat(true)
  }

  const validatePatientForm = () => {
    const err = {}
    if (!formData.nama.trim()) err.nama = 'Nama wajib diisi'
    if (formData.jenisIdentitas !== 'Tanpa Identitas') {
      if (!formData.nik.trim()) err.nik = 'NIK wajib diisi'
      else if (formData.nik.replace(/\D/g, '').length !== 16) err.nik = 'NIK harus 16 digit'
    }
    if (!formData.tglLahir) err.tglLahir = 'Tanggal lahir wajib diisi'
    if (!formData.tempatLahir.trim()) err.tempatLahir = 'Tempat lahir wajib diisi'
    if (!formData.alamat.trim()) err.alamat = 'Alamat wajib diisi'
    return err
  }

  const handleRegisterPatient = () => {
    if (isNewPatient) {
      const errors = validatePatientForm()
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        return
      }
    }

    let pasien = selectedPatient
    if (isNewPatient) {
      pasien = registerNewPatient(formData)
      setRegisteredPatient(pasien)
    }

    if (pasien) {
      setSelectedPatient(pasien)
      setKunjunganForm(prev => ({
        ...prev,
        pasienId: pasien.id,
        namaPenanggungJawab: pasien.nama,
      }))
    }
  }

  const validateKunjunganForm = () => {
    const err = {}
    if (!kunjunganForm.pasienId) err.pasienId = 'Pilih pasien'
    if (!kunjunganForm.poliId) err.poliId = 'Pilih poli'
    if (!kunjunganForm.dokterId) err.dokterId = 'Pilih dokter'
    if (!kunjunganForm.tanggal) err.tanggal = 'Pilih tanggal'
    if (!kunjunganForm.penanggungJawab) err.penanggungJawab = 'Pilih penanggung jawab'
    if (kunjunganForm.penanggungJawab === 'Lainnya' && !kunjunganForm.namaPenanggungJawab.trim()) {
      err.namaPenanggungJawab = 'Masukkan nama penanggung jawab'
    }
    return err
  }

  const handleSaveKunjungan = () => {
    const errors = validateKunjunganForm()
    if (Object.keys(errors).length > 0) {
      setKunjunganErrors(errors)
      return
    }
    createKunjungan(kunjunganForm)
    setKunjunganSaved(true)
    setTimeout(() => setKunjunganSaved(false), 3000)
    // Reset untuk kunjungan berikutnya
    resetKunjunganForm()
  }

  const resetKunjunganForm = () => {
    setKunjunganForm({
      pasienId: '',
      statusKunjungan: 'Baru',
      penanggungJawab: 'Pasien',
      namaPenanggungJawab: '',
      tanggal: new Date().toISOString().slice(0, 10),
      jam: new Date().toTimeString().slice(0, 5),
      poliId: '',
      dokterId: '',
      ruangan: '',
      penjamin: 'UMUM',
      noPenjamin: '',
      catatanPenjamin: '',
    })
    setSelectedPatient(null)
    setIsNewPatient(true)
    setRegisteredPatient(null)
    setShowRiwayat(false)
    setSearchQuery('')
    setRiwayatPasien([])
  }

  const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setFormErrors(prev => ({ ...prev, [field]: '' }))
  }

  const updateKunjunganField = (field, value) => {
    setKunjunganForm(prev => ({ ...prev, [field]: value }))
    setKunjunganErrors(prev => ({ ...prev, [field]: '' }))
  }

  // ============ RENDER ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Pendaftaran & Antrian Kunjungan</h1>
          <p className="page-desc">Daftar pasien baru atau lama, kemudian buat antrian kunjungan</p>
        </div>
        <button onClick={resetKunjunganForm} className="btn btn-ghost btn-sm">
          Reset Form
        </button>
      </div>

      {/* Success notification */}
      {kunjunganSaved && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
          <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
          <div>
            <p className="font-medium text-emerald-700 dark:text-emerald-300">Kunjungan Berhasil Didaftarkan</p>
            <p className="text-body-sm text-emerald-600 dark:text-emerald-400">Pasien masuk ke antrian dan siap diperiksa.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ===== KOLOM 1: Data Pasien (2/5) ===== */}
        <div className="xl:col-span-2 space-y-4">
          <Card className="p-4">
            <h3 className="text-heading-md font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--brand-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              1. Data Pasien
            </h3>

            {/* Tab: Baru / Lama */}
            <div className="flex gap-1 mb-4">
              <button
                onClick={() => { setIsNewPatient(true); setSelectedPatient(null); setRegisteredPatient(null); setShowRiwayat(false) }}
                className={`btn btn-sm flex-1 ${isNewPatient ? 'btn-primary' : 'btn-secondary'}`}
              >
                Pasien Baru
              </button>
              <button
                onClick={() => { setIsNewPatient(false) }}
                className={`btn btn-sm flex-1 ${!isNewPatient && !selectedPatient ? 'btn-primary' : 'btn-secondary'}`}
              >
                Cari Pasien Lama
              </button>
            </div>

            {/* Cari Pasien Lama */}
            {!isNewPatient && !selectedPatient && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                    placeholder="Nama / NIK / No RM"
                    className="input flex-1"
                  />
                  <button onClick={handleSearch} className="btn btn-secondary" type="button">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  </button>
                </div>

                {showSearchResults && searchResults.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-tiny text-[var(--text-muted)]">{searchResults.length} hasil</p>
                    {searchResults.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-lg border border-[var(--border-primary)] p-2.5 hover:bg-[var(--bg-hover)] cursor-pointer"
                        onClick={() => handleSelectPatient(p)}
                      >
                        <div className="w-9 h-9 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] font-bold text-body-sm">
                          {p.nama.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-body-sm truncate">{p.nama}</p>
                          <p className="text-tiny text-[var(--text-muted)] truncate">{p.noRM} • {p.jenisIdentitas}: {p.nik || '-'}</p>
                        </div>
                        <Badge variant="primary">{p.gender === 'Laki-laki' ? 'L' : 'P'}</Badge>
                      </div>
                    ))}
                  </div>
                )}

                {showSearchResults && searchResults.length === 0 && (
                  <div className="p-3 rounded-lg border border-dashed border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-center">
                    <p className="text-body-sm text-[var(--text-secondary)]">Pasien tidak ditemukan</p>
                  </div>
                )}
              </div>
            )}

            {/* Pasien Terpilih */}
            {selectedPatient && (
              <div className="p-3 rounded-xl bg-[var(--brand-light)] border border-[var(--brand-primary)]/30 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="primary">{selectedPatient.noRM}</Badge>
                  {selectedPatient.noRMLama && (
                    <span className="text-tiny text-[var(--text-muted)]">RM Lama: {selectedPatient.noRMLama}</span>
                  )}
                </div>
                <p className="font-bold text-body">{selectedPatient.nama}</p>
                <div className="grid grid-cols-2 gap-1 text-tiny text-[var(--text-secondary)] mt-1">
                  <span>{selectedPatient.jenisIdentitas}: {selectedPatient.nik || '-'}</span>
                  <span>{selectedPatient.gender}</span>
                  <span>{selectedPatient.tempatLahir}, {selectedPatient.tglLahir}</span>
                  <span>{selectedPatient.umur}</span>
                </div>
                <p className="text-tiny text-[var(--text-muted)] mt-1">{selectedPatient.alamat}</p>
                {selectedPatient.noHP && <p className="text-tiny text-[var(--text-muted)]">HP: {selectedPatient.noHP}</p>}
              </div>
            )}

            {/* Form Pasien Baru */}
            {isNewPatient && (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {/* No RM & No RM Lama */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">No. Rekam Medis Baru</label>
                    <input type="text" value={`RM-${String(getPatients().length + 1).padStart(3, '0')}`} className="input bg-[var(--bg-tertiary)]" disabled />
                    <p className="text-tiny text-[var(--text-muted)] mt-0.5">Auto-generated</p>
                  </div>
                  <div>
                    <label className="label">No. RM Lama (Optional)</label>
                    <input
                      type="text"
                      value={formData.noRMLama}
                      onChange={(e) => updateFormField('noRMLama', e.target.value)}
                      className="input"
                      placeholder="RM-LAMA-XXX"
                    />
                  </div>
                </div>

                {/* Jenis Identitas & Nomor */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Jenis Identitas</label>
                    <select
                      value={formData.jenisIdentitas}
                      onChange={(e) => updateFormField('jenisIdentitas', e.target.value)}
                      className="input"
                    >
                      <option value="KTP">KTP</option>
                      <option value="SIM">SIM</option>
                      <option value="Paspot">Paspor</option>
                      <option value="Kartu Keluarga">Kartu Keluarga</option>
                      <option value="Tanpa Identitas">Tanpa Identitas</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Nomor Identitas</label>
                    <input
                      type="text"
                      value={formData.nik}
                      onChange={(e) => updateFormField('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className={`input ${formErrors.nik ? 'input-error' : ''}`}
                      placeholder={formData.jenisIdentitas === 'Tanpa Identitas' ? 'Tidak ada' : '16 digit'}
                      maxLength={16}
                      disabled={formData.jenisIdentitas === 'Tanpa Identitas'}
                    />
                    {formErrors.nik && <p className="text-tiny text-red-500 mt-0.5">{formErrors.nik}</p>}
                  </div>
                </div>

                {/* Nama */}
                <div>
                  <label className="label">Nama Pasien</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => updateFormField('nama', e.target.value)}
                    className={`input ${formErrors.nama ? 'input-error' : ''}`}
                    placeholder="Nama lengkap sesuai identitas"
                  />
                  {formErrors.nama && <p className="text-tiny text-red-500 mt-0.5">{formErrors.nama}</p>}
                </div>

                {/* Tempat Tanggal Lahir & Umur */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="label">Tempat Lahir</label>
                    <input
                      type="text"
                      value={formData.tempatLahir}
                      onChange={(e) => updateFormField('tempatLahir', e.target.value)}
                      className={`input ${formErrors.tempatLahir ? 'input-error' : ''}`}
                      placeholder="Jakarta"
                    />
                    {formErrors.tempatLahir && <p className="text-tiny text-red-500 mt-0.5">{formErrors.tempatLahir}</p>}
                  </div>
                  <div>
                    <label className="label">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={formData.tglLahir}
                      onChange={(e) => updateFormField('tglLahir', e.target.value)}
                      className={`input ${formErrors.tglLahir ? 'input-error' : ''}`}
                    />
                    {formErrors.tglLahir && <p className="text-tiny text-red-500 mt-0.5">{formErrors.tglLahir}</p>}
                  </div>
                  <div>
                    <label className="label">Umur</label>
                    <input
                      type="text"
                      value={formData.umur}
                      className="input bg-[var(--bg-tertiary)]"
                      disabled
                      placeholder="Auto"
                    />
                  </div>
                </div>

                {/* Gender & Golongan Darah */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Jenis Kelamin</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => updateFormField('gender', e.target.value)}
                      className="input"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Golongan Darah</label>
                    <select
                      value={formData.golonganDarah}
                      onChange={(e) => updateFormField('golonganDarah', e.target.value)}
                      className="input"
                    >
                      <option value="">-- Pilih --</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                  </div>
                </div>

                {/* Agama & Status Pernikahan & Pendidikan */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="label">Agama</label>
                    <select
                      value={formData.agama}
                      onChange={(e) => updateFormField('agama', e.target.value)}
                      className="input"
                    >
                      <option value="">-- Pilih --</option>
                      <option value="Islam">Islam</option>
                      <option value="Kristen">Kristen</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Konghucu">Konghucu</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Status Nikah</label>
                    <select
                      value={formData.statusPernikahan}
                      onChange={(e) => updateFormField('statusPernikahan', e.target.value)}
                      className="input"
                    >
                      <option value="">-- Pilih --</option>
                      <option value="Belum Menikah">Belum Menikah</option>
                      <option value="Menikah">Menikah</option>
                      <option value="Cerai">Cerai</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Pendidikan</label>
                    <select
                      value={formData.pendidikan}
                      onChange={(e) => updateFormField('pendidikan', e.target.value)}
                      className="input"
                    >
                      <option value="">-- Pilih --</option>
                      <option value="Tidak Sekolah">Tidak Sekolah</option>
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA">SMA</option>
                      <option value="D3">D3</option>
                      <option value="S1">S1</option>
                      <option value="S2">S2</option>
                      <option value="S3">S3</option>
                    </select>
                  </div>
                </div>

                {/* Alamat Lengkap */}
                <div>
                  <label className="label">Alamat Lengkap</label>
                  <textarea
                    value={formData.alamat}
                    onChange={(e) => updateFormField('alamat', e.target.value)}
                    className={`input ${formErrors.alamat ? 'input-error' : ''}`}
                    placeholder="Nama jalan, nomor rumah, RT/RW"
                    rows={2}
                  />
                  {formErrors.alamat && <p className="text-tiny text-red-500 mt-0.5">{formErrors.alamat}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Kelurahan / Desa</label>
                    <input type="text" value={formData.kelurahan} onChange={(e) => updateFormField('kelurahan', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="label">Kecamatan</label>
                    <input type="text" value={formData.kecamatan} onChange={(e) => updateFormField('kecamatan', e.target.value)} className="input" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="label">Kabupaten / Kota</label>
                    <input type="text" value={formData.kabupaten} onChange={(e) => updateFormField('kabupaten', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="label">Provinsi</label>
                    <input type="text" value={formData.provinsi} onChange={(e) => updateFormField('provinsi', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="label">No. HP</label>
                    <input type="tel" value={formData.noHP} onChange={(e) => updateFormField('noHP', e.target.value.replace(/\D/g, '').slice(0, 13))} className="input" placeholder="08xxxxxxxxxx" maxLength={13} />
                  </div>
                </div>

                {/* Tombol Simpan Pasien */}
                <button onClick={handleRegisterPatient} className="btn btn-primary w-full mt-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                  Simpan Data Pasien
                </button>

                {registeredPatient && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <p className="font-medium text-emerald-700 dark:text-emerald-300">✓ Pendaftaran Berhasil</p>
                    <p className="text-body-sm text-emerald-600 dark:text-emerald-400">
                      No RM: <strong>{registeredPatient.noRM}</strong> • Nama: <strong>{registeredPatient.nama}</strong>
                    </p>
                    <PrintKartuButton patient={registeredPatient} />
                  </div>
                )}
              </div>
            )}

            {/* Riwayat Pasien (jika pasien lama) */}
            {!isNewPatient && selectedPatient && showRiwayat && (
              <div className="mt-3">
                <button
                  onClick={() => setShowRiwayat(!showRiwayat)}
                  className="btn btn-secondary btn-sm w-full mb-2"
                >
                  {showRiwayat ? 'Sembunyikan' : 'Lihat'} Riwayat RME ({riwayatPasien.length})
                </button>
                {showRiwayat && riwayatPasien.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {riwayatPasien.slice(0, 5).map((r, i) => (
                      <div key={i} className="p-2 rounded-lg border border-[var(--border-primary)] text-body-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{r.tanggal}</span>
                          <Badge variant="neutral">{r.poli?.nama}</Badge>
                        </div>
                        {r.rekamMedis && (
                          <p className="text-tiny text-[var(--text-muted)] mt-0.5">
                            Keluhan: {r.rekamMedis.keluhan} | Diag: {r.rekamMedis.diagnosis}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {showRiwayat && riwayatPasien.length === 0 && (
                  <div className="p-2 rounded-lg border border-[var(--border-primary)] text-center text-body-sm text-[var(--text-muted)]">
                    Belum ada riwayat RME
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* ===== KOLOM 2: Form Kunjungan (3/5) ===== */}
        <div className="xl:col-span-3">
          <Card className="p-5">
            <h3 className="text-heading-md font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--brand-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg>
              2. Daftar Kunjungan / Antrian
            </h3>

            {!selectedPatient && !registeredPatient ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <svg className="w-12 h-12 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg>
                <p className="text-body-sm">Pilih atau daftar pasien terlebih dahulu</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Info Pasien */}
                <div className="p-3 rounded-xl bg-[var(--brand-light)] border border-[var(--brand-primary)]/30">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--brand-primary)]">{(selectedPatient || registeredPatient)?.nama}</span>
                    <Badge variant="primary">{(selectedPatient || registeredPatient)?.noRM}</Badge>
                  </div>
                </div>

                {/* Grid Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* No Antrean */}
                  <div>
                    <label className="label">No. Pendaftaran / Antrean</label>
                    <input
                      type="text"
                      value={getNextNoAntrean(kunjunganForm.poliId || 'pl_001')}
                      className="input bg-[var(--bg-tertiary)]"
                      disabled
                    />
                    <p className="text-tiny text-[var(--text-muted)] mt-0.5">Auto-generated per poli</p>
                  </div>

                  {/* Status Kunjungan */}
                  <div>
                    <label className="label">Status Kunjungan</label>
                    <select
                      value={kunjunganForm.statusKunjungan}
                      onChange={(e) => updateKunjunganField('statusKunjungan', e.target.value)}
                      className="input"
                    >
                      <option value="Baru">Baru (First Visit)</option>
                      <option value="Lama">Lama (Repeat Visit)</option>
                    </select>
                  </div>

                  {/* Tanggal & Jam */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">Tanggal</label>
                      <input
                        type="date"
                        value={kunjunganForm.tanggal}
                        onChange={(e) => updateKunjunganField('tanggal', e.target.value)}
                        className={`input ${kunjunganErrors.tanggal ? 'input-error' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="label">Jam</label>
                      <input
                        type="time"
                        value={kunjunganForm.jam}
                        onChange={(e) => updateKunjunganField('jam', e.target.value)}
                        className="input"
                      />
                    </div>
                  </div>

                  {/* Penanggung Jawab */}
                  <div>
                    <label className="label">Penanggung Jawab</label>
                    <select
                      value={kunjunganForm.penanggungJawab}
                      onChange={(e) => updateKunjunganField('penanggungJawab', e.target.value)}
                      className={`input ${kunjunganErrors.penanggungJawab ? 'input-error' : ''}`}
                    >
                      <option value="Pasien">Pasien Sendiri</option>
                      <option value="Suami">Suami</option>
                      <option value="Istri">Istri</option>
                      <option value="Orang Tua">Orang Tua</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Nama Penanggung Jawab</label>
                    <input
                      type="text"
                      value={kunjunganForm.namaPenanggungJawab}
                      onChange={(e) => updateKunjunganField('namaPenanggungJawab', e.target.value)}
                      className={`input ${kunjunganErrors.namaPenanggungJawab ? 'input-error' : ''}`}
                      placeholder="Nama lengkap PJ"
                      disabled={kunjunganForm.penanggungJawab === 'Pasien'}
                    />
                    {kunjunganErrors.namaPenanggungJawab && <p className="text-tiny text-red-500 mt-0.5">{kunjunganErrors.namaPenanggungJawab}</p>}
                  </div>

                  {/* Poli */}
                  <div>
                    <label className="label">Poliklinik Tujuan</label>
                    <select
                      value={kunjunganForm.poliId}
                      onChange={(e) => updateKunjunganField('poliId', e.target.value)}
                      className={`input ${kunjunganErrors.poliId ? 'input-error' : ''}`}
                    >
                      <option value="">-- Pilih Poli --</option>
                      {polis.map(p => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </select>
                    {kunjunganErrors.poliId && <p className="text-tiny text-red-500 mt-0.5">{kunjunganErrors.poliId}</p>}
                  </div>

                  {/* Dokter */}
                  <div>
                    <label className="label">Nama Dokter</label>
                    <select
                      value={kunjunganForm.dokterId}
                      onChange={(e) => updateKunjunganField('dokterId', e.target.value)}
                      className={`input ${kunjunganErrors.dokterId ? 'input-error' : ''}`}
                      disabled={!kunjunganForm.poliId}
                    >
                      <option value="">-- Pilih Dokter --</option>
                      {filteredDoctors.map(d => (
                        <option key={d.id} value={d.id}>{d.nama} ({d.spesialisasi})</option>
                      ))}
                    </select>
                    {kunjunganErrors.dokterId && <p className="text-tiny text-red-500 mt-0.5">{kunjunganErrors.dokterId}</p>}
                  </div>

                  {/* Ruangan */}
                  <div>
                    <label className="label">Ruangan</label>
                    <select
                      value={kunjunganForm.ruangan}
                      onChange={(e) => updateKunjunganField('ruangan', e.target.value)}
                      className="input"
                      disabled={!kunjunganForm.poliId || selectedPoliRuangan.length === 0}
                    >
                      <option value="">-- Pilih Ruangan --</option>
                      {selectedPoliRuangan.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Penjamin */}
                  <div>
                    <label className="label">Penjamin</label>
                    <select
                      value={kunjunganForm.penjamin}
                      onChange={(e) => updateKunjunganField('penjamin', e.target.value)}
                      className="input"
                    >
                      <option value="UMUM">UMUM (Bayar Sendiri)</option>
                      <option value="BPJS">BPJS Kesehatan</option>
                      <option value="Asuransi">Asuransi Swasta</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  {/* No Penjamin */}
                  <div>
                    <label className="label">No. Penjamin / Nomor</label>
                    <input
                      type="text"
                      value={kunjunganForm.noPenjamin}
                      onChange={(e) => updateKunjunganField('noPenjamin', e.target.value)}
                      className="input"
                      placeholder={kunjunganForm.penjamin === 'UMUM' ? 'Tidak perlu diisi' : 'Nomor kartu / peserta'}
                      disabled={kunjunganForm.penjamin === 'UMUM'}
                    />
                  </div>

                  {/* Catatan Penjamin */}
                  <div>
                    <label className="label">Info Tambahan Penjamin</label>
                    <input
                      type="text"
                      value={kunjunganForm.catatanPenjamin}
                      onChange={(e) => updateKunjunganField('catatanPenjamin', e.target.value)}
                      className="input"
                      placeholder="Nama asuransi / kelas BPJS dll"
                    />
                  </div>
                </div>

                {/* Tombol */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
                  <button onClick={resetKunjunganForm} className="btn btn-ghost" type="button">
                    Batal
                  </button>
                  <button onClick={handleSaveKunjungan} className="btn btn-primary btn-lg" type="button">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                    Daftarkan Kunjungan
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* Daftar Antrian Hari Ini */}
          <Card className="p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-heading-md font-bold text-[var(--text-primary)]">Antrian Hari Ini</h3>
              <Badge variant="primary">{getVisits(branchId).length} pasien</Badge>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Antrean</th>
                    <th>Pasien</th>
                    <th>Poli</th>
                    <th>Dokter</th>
                    <th>Status</th>
                    <th>Penjamin</th>
                  </tr>
                </thead>
                <tbody>
                  {getVisits(branchId).slice(0, 8).map(vis => (
                    <tr key={vis.id}>
                      <td className="font-medium">{vis.noAntrean}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] text-tiny font-bold">
                            {vis.patient?.nama?.charAt(0)}
                          </div>
                          <span className="font-medium text-body-sm">{vis.patient?.nama}</span>
                        </div>
                      </td>
                      <td><Badge variant="primary">{vis.poli?.nama}</Badge></td>
                      <td className="text-body-sm">{vis.dokter?.nama || '-'}</td>
                      <td><Badge variant={vis.status === 'Menunggu' ? 'warning' : 'success'}>{vis.status}</Badge></td>
                      <td className="text-body-sm">{vis.penjamin || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PrintKartuButton({ patient }) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Kartu Pasien - ${patient.noRM}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 15px; background: #f8fafc; }
        .card { width: 85mm; height: 54mm; border: 2px solid #1e3a5f; border-radius: 8px; padding: 10px; position: relative; overflow: hidden; background: white; }
        .card-header { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px; }
        .card-logo { width: 28px; height: 28px; background: #1e3a5f; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
        .card-logo svg { width: 16px; height: 16px; }
        .card-title { font-size: 10px; font-weight: 700; color: #1e3a5f; }
        .card-subtitle { font-size: 7px; color: #64748b; }
        .card-rm { position: absolute; top: 10px; right: 10px; background: #1e3a5f; color: white; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; }
        .card-body { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; font-size: 9px; }
        .card-label { color: #64748b; font-size: 8px; }
        .card-value { color: #1e293b; font-weight: 500; font-size: 9px; }
        .card-footer { margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 7px; color: #94a3b8; }
        .barcode { margin-top: 4px; height: 16px; background: repeating-linear-gradient(90deg, #1e3a5f 0px, #1e3a5f 2px, transparent 2px, transparent 4px); border-radius: 2px; }
        @media print { body { padding: 0; background: white; } }
      </style></head><body>
      <div class="card">
        <div class="card-rm">${patient.noRM}</div>
        <div class="card-header">
          <div class="card-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="2.5" y="3.5" width="19" height="12" rx="1"/><rect x="4" y="5" width="6" height="2.5" rx="0.5" fill="#e6a81a" stroke="none"/><path d="M9 19h6M12 15.5V19"/></svg>
          </div>
          <div>
            <div class="card-title">Medicore Clinic</div>
            <div class="card-subtitle">Sistem Manajemen Klinik Multi-Branch</div>
          </div>
        </div>
        <div class="card-body">
          <div><div class="card-label">Nama</div><div class="card-value">${patient.nama}</div></div>
          <div><div class="card-label">No. RM</div><div class="card-value">${patient.noRM}</div></div>
          <div><div class="card-label">NIK / Identitas</div><div class="card-value">${patient.nik || '-'}</div></div>
          <div><div class="card-label">Tgl Lahir</div><div class="card-value">${patient.tglLahir || '-'}</div></div>
          <div><div class="card-label">Gender</div><div class="card-value">${patient.gender}</div></div>
          <div><div class="card-label">Gol. Darah</div><div class="card-value">${patient.golonganDarah || '-'}</div></div>
          <div style="grid-column: span 2;"><div class="card-label">Alamat</div><div class="card-value">${patient.alamat || '-'}, ${patient.kelurahan || ''} ${patient.kecamatan || ''} ${patient.kabupaten || ''}</div></div>
        </div>
        <div class="card-footer">
          <div class="barcode"></div>
          <div style="margin-top:3px">Terdaftar: ${patient.createdAt || new Date().toISOString().slice(0, 10)} | Medicore Clinic © 2024</div>
        </div>
      </div>
      <script>window.print(); window.close();</script>
      </body></html>
    `)
    printWindow.document.close()
  }

  return (
    <button onClick={handlePrint} className="btn btn-secondary btn-sm mt-2" type="button">
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Cetak Kartu Pasien
    </button>
  )
}
