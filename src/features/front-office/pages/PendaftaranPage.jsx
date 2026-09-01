import { useEffect, useState } from 'react'

import { Card, Badge, Input } from '../../../shared/components/ui.jsx'
import { TabelMaster } from '../../../shared/components/TabelMaster.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import {
  fetchPasien,
  fetchNextNoRm,
  showPasien,
  createPasien,
  updatePasien,
  deletePasien,
} from '../service/pasienService.js'
import { fetchUnitLokasi } from '../../master/service/unitLokasiService.js'
import { fetchBranches } from '../../../shared/branches.js'

const INITIAL_FORM = {
  noRm: '',
  noRmLama: '',
  jenisIdentitas: 'KTP',
  nik: '',
  satusehatId: '',
  gelar: '',
  nama: '',
  agama: '',
  pendidikan: '',
  tempatLahir: '',
  tanggalLahir: '',
  jenisKelamin: 'L',
  golonganDarah: '',
  pekerjaan: '',
  alamat: '',
  rt: '',
  rw: '',
  namaDesa: '',
  alamatKtpBerbeda: false,
  alamatKtp: '',
  rtKtp: '',
  rwKtp: '',
  desaKtp: '',
  noHp: '',
  unitLokasiId: '',
}

function hitungUmur(tanggalLahir) {
  if (!tanggalLahir) return ''
  const lahir = new Date(tanggalLahir)
  const now = new Date()
  let tahun = now.getFullYear() - lahir.getFullYear()
  const m = now.getMonth() - lahir.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < lahir.getDate())) tahun--
  return `${tahun} tahun`
}

export default function PendaftaranPage() {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [branchInfo, setBranchInfo] = useState(null)
  const [unitList, setUnitList] = useState([])
  const [pasienList, setPasienList] = useState([])
  const [loadingList, setLoadingList] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...INITIAL_FORM, noRm: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [savedPatient, setSavedPatient] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [searchQ, setSearchQ] = useState('')

  useEffect(() => {
    const onBranchChange = () => setBranchId(getCurrentBranchId())
    window.addEventListener('branch:changed', onBranchChange)
    return () => window.removeEventListener('branch:changed', onBranchChange)
  }, [])

  const loadUnit = async () => {
    try {
      setUnitList(await fetchUnitLokasi(branchId))
    } catch (err) {
      console.error('[Pendaftaran] Gagal memuat unit lokasi:', err)
      setUnitList([])
    }
  }

  const loadBranches = async () => {
    try {
      const all = await fetchBranches()
      const me = all.find(b => String(b.id) === String(branchId))
      setBranchInfo(me || null)
    } catch (err) {
      console.error('[Pendaftaran] Gagal memuat branch:', err)
    }
  }

  const loadPasien = async (q = '') => {
    setLoadingList(true)
    try {
      setPasienList(await fetchPasien(branchId, q))
    } catch (err) {
      console.error('[Pendaftaran] Gagal memuat pasien:', err)
      setPasienList([])
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadUnit()
    loadPasien(searchQ)
    loadBranches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId])

  // Auto-generate No RM hanya untuk mode tambah (bukan edit)
  useEffect(() => {
    if (editingId) return
    let cancelled = false
    fetchNextNoRm(branchId).then(noRm => {
      if (cancelled) return
      setForm(prev => ({ ...prev, noRm: noRm || '' }))
    })
    return () => { cancelled = true }
  }, [branchId, editingId])

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const err = {}
    if (!form.nama.trim()) err.nama = 'Nama wajib diisi'
    if (!form.tempatLahir.trim()) err.tempatLahir = 'Wajib diisi'
    if (!form.tanggalLahir) err.tanggalLahir = 'Wajib diisi'
    if (form.jenisIdentitas !== 'Tanpa Identitas') {
      const nikDigits = form.nik.replace(/\D/g, '')
      if (!nikDigits) err.nik = 'NIK wajib diisi'
      else if (nikDigits.length !== 16) err.nik = 'NIK harus 16 digit'
    }
    return err
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    const validation = validate()
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }

    setSubmitting(true)
    setErrorMsg('')
    try {
      const payload = {
        branch_id: Number(branchId),
        no_rm: form.noRm || undefined,
        no_rm_lama: form.noRmLama.trim() || null,
        jenis_identitas: form.jenisIdentitas,
        nik: form.jenisIdentitas === 'Tanpa Identitas' ? null : form.nik.trim() || null,
        satusehat_id: form.satusehatId.trim() || null,
        gelar: form.gelar.trim() || null,
        nama: form.nama.trim(),
        tempat_lahir: form.tempatLahir.trim(),
        tanggal_lahir: form.tanggalLahir,
        jenis_kelamin: form.jenisKelamin,
        golongan_darah: form.golonganDarah || null,
        agama: form.agama || null,
        pendidikan: form.pendidikan || null,
        pekerjaan: form.pekerjaan.trim() || null,
        alamat: form.alamat.trim() || null,
        rt: form.rt.trim() || null,
        rw: form.rw.trim() || null,
        nama_desa: form.namaDesa.trim() || null,
        alamat_ktp_berbeda: form.alamatKtpBerbeda,
        alamat_ktp: form.alamatKtp.trim() || null,
        rt_ktp: form.rtKtp.trim() || null,
        rw_ktp: form.rwKtp.trim() || null,
        desa_ktp: form.desaKtp.trim() || null,
        no_hp: form.noHp.trim() || null,
        unit_lokasi_id: form.unitLokasiId ? Number(form.unitLokasiId) : null,
      }
      if (editingId) {
        const data = await updatePasien(editingId, payload)
        setSavedPatient({ ...data, __updated: true })
        setEditingId(null)
      } else {
        const data = await createPasien(payload)
        setSavedPatient(data)
      }
      await loadPasien(searchQ)
      // Refresh No RM untuk entri berikutnya (kecuali sedang edit)
      if (!editingId) {
        const nextNoRm = await fetchNextNoRm(branchId)
        setForm({ ...INITIAL_FORM, noRm: nextNoRm || '' })
      } else {
        setForm({ ...INITIAL_FORM, noRm: form.noRm })
        setEditingId(null)
      }
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        const fieldErrs = {}
        if (data.errors.nama) fieldErrs.nama = data.errors.nama[0]
        if (data.errors.nik) fieldErrs.nik = data.errors.nik[0]
        if (data.errors.tanggal_lahir) fieldErrs.tanggalLahir = data.errors.tanggal_lahir[0]
        if (data.errors.tempat_lahir) fieldErrs.tempatLahir = data.errors.tempat_lahir[0]
        if (data.errors.no_rm) fieldErrs.noRm = data.errors.no_rm[0]
        setErrors(fieldErrs)
      }
      setErrorMsg(data?.message || (editingId ? 'Gagal memperbarui pasien' : 'Gagal mendaftarkan pasien'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async () => {
    setForm({ ...INITIAL_FORM, noRm: '' })
    setErrors({})
    setErrorMsg('')
    setSavedPatient(null)
    setEditingId(null)
    const nextNoRm = await fetchNextNoRm(branchId)
    setForm(prev => ({ ...prev, noRm: nextNoRm || '' }))
  }

  const handleSearch = (e) => {
    e?.preventDefault?.()
    loadPasien(searchQ)
  }

  const handleEdit = async (row) => {
    try {
      // Ambil data terbaru dari BE (supaya selalu fresh)
      const fresh = await showPasien(row.id)
      setEditingId(fresh.id)
      setForm({
        noRm: fresh.noRm || '',
        noRmLama: fresh.noRmLama || '',
        jenisIdentitas: fresh.jenisIdentitas || 'KTP',
        nik: fresh.nik || '',
        satusehatId: fresh.satusehatId || '',
        gelar: fresh.gelar || '',
        nama: fresh.nama || '',
        agama: fresh.agama || '',
        pendidikan: fresh.pendidikan || '',
        tempatLahir: fresh.tempatLahir || '',
        tanggalLahir: fresh.tanggalLahir || '',
        jenisKelamin: fresh.jenisKelamin || 'L',
        golonganDarah: fresh.golonganDarah || '',
        pekerjaan: fresh.pekerjaan || '',
        alamat: fresh.alamat || '',
        rt: fresh.rt || '',
        rw: fresh.rw || '',
        namaDesa: fresh.namaDesa || '',
        alamatKtpBerbeda: Boolean(fresh.alamatKtpBerbeda),
        alamatKtp: fresh.alamatKtp || '',
        rtKtp: fresh.rtKtp || '',
        rwKtp: fresh.rwKtp || '',
        desaKtp: fresh.desaKtp || '',
        noHp: fresh.noHp || '',
        unitLokasiId: fresh.unitLokasiId ? String(fresh.unitLokasiId) : '',
      })
      setSavedPatient(null)
      setErrorMsg('')
      // Scroll ke form
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memuat data pasien')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus data pasien ini?')) return
    try {
      await deletePasien(id)
      if (editingId === id) {
        handleReset()
      }
      await loadPasien(searchQ)
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus pasien')
    }
  }

  const handleCetakKartu = (pasien) => {
    const branch = branchInfo || { name: 'Medicore Clinic', code: '', address: '', phone: '' }
    const win = window.open('', '_blank', 'width=600,height=700')
    if (!win) {
      alert('Pop-up diblokir. Izinkan pop-up untuk mencetak.')
      return
    }
    const genderLabel = pasien.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'
    const namaLengkap = [pasien.gelar, pasien.nama].filter(Boolean).join(' ')

    win.document.write(`
<!DOCTYPE html>
<html><head><title>Kartu Pasien - ${pasien.noRm}</title>
<style>
  @page { size: 10cm 10cm; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .sheet { width: 10cm; height: 10cm; padding: 4mm; background: #fff; color: #1e293b; }
  .header { display: flex; align-items: center; gap: 4px; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 4px; }
  .header-logo { width: 14px; height: 14px; background: #1b4332; border-radius: 3px; display: grid; place-items: center; color: white; font-size: 9px; font-weight: 700; }
  .header-text { flex: 1; min-width: 0; }
  .header-title { font-size: 8px; font-weight: 700; color: #1b4332; line-height: 1.1; }
  .header-sub { font-size: 6px; color: #64748b; line-height: 1.1; }
  .header-rm { background: #1b4332; color: white; padding: 2px 4px; border-radius: 3px; font-size: 7px; font-weight: 700; }
  .patient-name { font-size: 9px; font-weight: 700; color: #1b4332; margin: 3px 0 2px; line-height: 1.1; }
  .body { display: grid; grid-template-columns: 1fr 1fr; gap: 1px 6px; font-size: 6.5px; }
  .row { display: flex; gap: 2px; }
  .label { color: #64748b; min-width: 22px; }
  .value { color: #1e293b; font-weight: 600; flex: 1; }
  .footer { position: absolute; bottom: 4mm; left: 4mm; right: 4mm; border-top: 1px dashed #cbd5e1; padding-top: 3px; display: flex; justify-content: space-between; font-size: 5.5px; color: #94a3b8; }
  .barcode { height: 10px; background: repeating-linear-gradient(90deg, #1e293b 0 1px, transparent 1px 3px); border-radius: 1px; margin-top: 2px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<div class="sheet">
  <div class="header">
    <div class="header-logo">M</div>
    <div class="header-text">
      <div class="header-title">${branch.name || 'Medicore Clinic'}${branch.code ? ' · ' + branch.code : ''}</div>
      <div class="header-sub">${branch.address || 'Sistem Manajemen Klinik'}</div>
    </div>
    <div class="header-rm">${pasien.noRm || '-'}</div>
  </div>
  <div class="patient-name">${namaLengkap}</div>
  <div class="body">
    <div class="row"><span class="label">NIK</span><span class="value">${pasien.nik || '-'}</span></div>
    <div class="row"><span class="label">JK</span><span class="value">${genderLabel}</span></div>
    <div class="row"><span class="label">TTL</span><span class="value">${(pasien.tempatLahir || '-')}, ${pasien.tanggalLahir || '-'}</span></div>
    <div class="row"><span class="label">Gol</span><span class="value">${pasien.golonganDarah || '-'}</span></div>
    <div class="row" style="grid-column: span 2;"><span class="label">Alamat</span><span class="value">${(pasien.alamat || '-')}${pasien.rt ? ' RT ' + pasien.rt : ''}${pasien.rw ? '/RW ' + pasien.rw : ''}</span></div>
    ${pasien.unitLokasi ? `<div class="row" style="grid-column: span 2;"><span class="label">Unit</span><span class="value">${pasien.unitLokasi.kode} - ${pasien.unitLokasi.namaUnit}</span></div>` : ''}
  </div>
  <div class="barcode"></div>
  <div class="footer">
    <span>${branch.phone ? 'Telp: ' + branch.phone : ''}</span>
    <span>${new Date().toISOString().slice(0,10)}</span>
  </div>
</div>
<script>window.onload = () => { setTimeout(() => { window.print(); }, 200); };</script>
</body></html>
    `)
    win.document.close()
  }

  const columns = [
    { key: 'noRm', label: 'No. RM', sortable: true, width: '240px', render: (v, row) => (
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-[var(--brand-primary)]">{v}</span>
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleEdit(row) }}
            className="p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--brand-primary)] transition-colors"
            title="Edit pasien"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleCetakKartu(row) }}
            className="p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--brand-primary)] transition-colors"
            title="Cetak kartu pasien"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id) }}
            className="p-1 rounded-md text-[var(--text-muted)] hover:bg-red-50 hover:text-[var(--status-danger)] dark:hover:bg-red-900/20 transition-colors"
            title="Hapus pasien"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
          </button>
        </div>
      </div>
    )},
    { key: 'nama', label: 'Nama Pasien', sortable: true, render: (v, row) => (
      <div>
        <div className="font-medium text-[var(--text-primary)]">
          {row.gelar ? `${row.gelar} ` : ''}{v}
        </div>
        <div className="text-tiny text-[var(--text-muted)]">
          {row.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
          {row.tanggalLahir ? ` • ${row.tempatLahir}, ${row.tanggalLahir}` : ''}
        </div>
      </div>
    )},
    { key: 'nik', label: 'NIK', width: '160px' },
    { key: 'unitLokasi', label: 'Unit Tujuan', render: (v) => v
      ? <Badge variant="info">{v.kode} - {v.namaUnit}</Badge>
      : <span className="text-tiny text-[var(--text-muted)]">-</span>
    },
    { key: 'noHp', label: 'No. HP' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Pendaftaran Pasien Baru</h1>
          <p className="page-desc">Catat data identitas pasien ke dalam sistem. Pemisahan data otomatis per branch.</p>
          <p className="mt-1 text-tiny text-[var(--text-muted)]">Branch aktif: <span className="font-mono">{branchId}</span></p>
        </div>
        <button onClick={handleReset} type="button" className="btn btn-ghost btn-sm">
          Reset Form
        </button>
      </div>

      {/* Success notification */}
      {savedPatient && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
          <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
          <div className="flex-1">
            <p className="font-medium text-emerald-700 dark:text-emerald-300">Pasien Berhasil Didaftarkan</p>
            <p className="text-body-sm text-emerald-600 dark:text-emerald-400">
              No RM: <strong>{savedPatient.noRm}</strong> • Nama: <strong>{savedPatient.nama}</strong>
            </p>
          </div>
          <button onClick={() => setSavedPatient(null)} className="text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-md p-1" type="button">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ============ FORM DATA PASIEN ============ */}
        <Card className="p-5 xl:col-span-2">
          <h2 className="text-heading-lg font-bold text-[var(--text-primary)] mb-4">Data Pasien</h2>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-body-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* === IDENTITAS === */}
            <fieldset className="space-y-3">
              <legend className="text-body-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Identitas</legend>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Nomor Rekam Medis</label>
                  <input type="text" value={form.noRm} onChange={e => setField('noRm', e.target.value)} className={`input bg-[var(--bg-tertiary)] ${errors.noRm ? 'input-error' : ''}`} readOnly />
                  {errors.noRm && <p className="text-tiny text-red-500 mt-0.5">{errors.noRm}</p>}
                </div>
                <div>
                  <label className="label">Nomor Rekam Medis Lama <span className="text-[var(--text-muted)] font-normal">(opsional)</span></label>
                  <input type="text" value={form.noRmLama} onChange={e => setField('noRmLama', e.target.value)} className="input" placeholder="RM-LAMA-XXX" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Jenis Identitas</label>
                  <select value={form.jenisIdentitas} onChange={e => setField('jenisIdentitas', e.target.value)} className="input">
                    <option value="KTP">KTP</option>
                    <option value="SIM">SIM</option>
                    <option value="Paspot">Paspor</option>
                    <option value="Kartu Keluarga">Kartu Keluarga</option>
                    <option value="Tanpa Identitas">Tanpa Identitas</option>
                  </select>
                </div>
                <div>
                  <label className="label">Nomor KTP / NIK</label>
                  <input
                    type="text"
                    value={form.nik}
                    onChange={e => setField('nik', e.target.value.replace(/\D/g, '').slice(0, 20))}
                    className={`input ${errors.nik ? 'input-error' : ''}`}
                    placeholder={form.jenisIdentitas === 'Tanpa Identitas' ? 'Tidak ada' : '16 digit'}
                    disabled={form.jenisIdentitas === 'Tanpa Identitas'}
                    maxLength={20}
                  />
                  {errors.nik && <p className="text-tiny text-red-500 mt-0.5">{errors.nik}</p>}
                </div>
              </div>

              <div>
                <label className="label">SATUSEHAT ID <span className="text-[var(--text-muted)] font-normal">(opsional)</span></label>
                <input type="text" value={form.satusehatId} onChange={e => setField('satusehatId', e.target.value)} className="input" placeholder="P-..." />
              </div>
            </fieldset>

            {/* === BIODATA === */}
            <fieldset className="space-y-3">
              <legend className="text-body-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Biodata</legend>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="label">Gelar <span className="text-[var(--text-muted)] font-normal">(opsional)</span></label>
                  <input type="text" value={form.gelar} onChange={e => setField('gelar', e.target.value)} className="input" placeholder="dr / drg / Ny" />
                </div>
                <div className="md:col-span-3">
                  <label className="label">Nama Pasien</label>
                  <input type="text" value={form.nama} onChange={e => setField('nama', e.target.value)} className={`input ${errors.nama ? 'input-error' : ''}`} placeholder="Nama lengkap sesuai identitas" />
                  {errors.nama && <p className="text-tiny text-red-500 mt-0.5">{errors.nama}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="label">Tempat Lahir</label>
                  <input type="text" value={form.tempatLahir} onChange={e => setField('tempatLahir', e.target.value)} className={`input ${errors.tempatLahir ? 'input-error' : ''}`} placeholder="Jakarta" />
                  {errors.tempatLahir && <p className="text-tiny text-red-500 mt-0.5">{errors.tempatLahir}</p>}
                </div>
                <div>
                  <label className="label">Tanggal Lahir</label>
                  <input type="date" value={form.tanggalLahir} onChange={e => setField('tanggalLahir', e.target.value)} className={`input ${errors.tanggalLahir ? 'input-error' : ''}`} />
                  {errors.tanggalLahir && <p className="text-tiny text-red-500 mt-0.5">{errors.tanggalLahir}</p>}
                </div>
                <div>
                  <label className="label">Umur</label>
                  <input type="text" value={hitungUmur(form.tanggalLahir)} className="input bg-[var(--bg-tertiary)]" disabled placeholder="Otomatis" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="label">Jenis Kelamin</label>
                  <select value={form.jenisKelamin} onChange={e => setField('jenisKelamin', e.target.value)} className="input">
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="label">Golongan Darah</label>
                  <select value={form.golonganDarah} onChange={e => setField('golonganDarah', e.target.value)} className="input">
                    <option value="">--</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div>
                  <label className="label">Agama</label>
                  <select value={form.agama} onChange={e => setField('agama', e.target.value)} className="input">
                    <option value="">-- Pilih --</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Pendidikan</label>
                  <select value={form.pendidikan} onChange={e => setField('pendidikan', e.target.value)} className="input">
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
                <div>
                  <label className="label">Pekerjaan</label>
                  <input type="text" value={form.pekerjaan} onChange={e => setField('pekerjaan', e.target.value)} className="input" placeholder="Karyawan / Wiraswasta / Pelajar" />
                </div>
              </div>
            </fieldset>

            {/* === ALAMAT TINGGAL === */}
            <fieldset className="space-y-3">
              <legend className="text-body-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Alamat Tinggal</legend>

              <div>
                <label className="label">Alamat</label>
                <textarea value={form.alamat} onChange={e => setField('alamat', e.target.value)} className="input" placeholder="Nama jalan, nomor rumah" rows={2} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="label">RT</label>
                  <input type="text" value={form.rt} onChange={e => setField('rt', e.target.value.replace(/\D/g, '').slice(0, 3))} className="input" placeholder="001" maxLength={3} />
                </div>
                <div>
                  <label className="label">RW</label>
                  <input type="text" value={form.rw} onChange={e => setField('rw', e.target.value.replace(/\D/g, '').slice(0, 3))} className="input" placeholder="001" maxLength={3} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="label">Nama Desa / Kelurahan</label>
                  <input type="text" value={form.namaDesa} onChange={e => setField('namaDesa', e.target.value)} className="input" placeholder="Desa Sukamaju" />
                </div>
              </div>
            </fieldset>

            {/* === ALAMAT KTP (jika berbeda) === */}
            <fieldset className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.alamatKtpBerbeda}
                  onChange={e => setField('alamatKtpBerbeda', e.target.checked)}
                  className="rounded border-[var(--border-primary)]"
                />
                <span className="text-body-sm font-medium text-[var(--text-primary)]">Alamat KTP Berbeda</span>
              </label>

              {form.alamatKtpBerbeda && (
                <div className="space-y-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                  <div>
                    <label className="label">Alamat KTP</label>
                    <textarea value={form.alamatKtp} onChange={e => setField('alamatKtp', e.target.value)} className="input" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="label">RT KTP</label>
                      <input type="text" value={form.rtKtp} onChange={e => setField('rtKtp', e.target.value.replace(/\D/g, '').slice(0, 3))} className="input" maxLength={3} />
                    </div>
                    <div>
                      <label className="label">RW KTP</label>
                      <input type="text" value={form.rwKtp} onChange={e => setField('rwKtp', e.target.value.replace(/\D/g, '').slice(0, 3))} className="input" maxLength={3} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="label">Desa KTP</label>
                      <input type="text" value={form.desaKtp} onChange={e => setField('desaKtp', e.target.value)} className="input" />
                    </div>
                  </div>
                </div>
              )}
            </fieldset>

            {/* === KONTAK & UNIT TUJUAN === */}
            <fieldset className="space-y-3">
              <legend className="text-body-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Kontak & Unit Tujuan</legend>

              <div>
                <label className="label">Nomor HP</label>
                <input type="tel" value={form.noHp} onChange={e => setField('noHp', e.target.value.replace(/\D/g, '').slice(0, 13))} className="input" placeholder="08xxxxxxxxxx" maxLength={13} />
              </div>

              <div>
                <label className="label">
                  Unit Tujuan <span className="text-[var(--text-muted)] font-normal">(opsional — bukan poli)</span>
                </label>
                <select value={form.unitLokasiId} onChange={e => setField('unitLokasiId', e.target.value)} className="input">
                  <option value="">-- Pilih Unit Lokasi --</option>
                  {unitList.map(u => (
                    <option key={u.id} value={String(u.id)}>{u.kode} - {u.namaUnit}</option>
                  ))}
                </select>
                <p className="text-tiny text-[var(--text-muted)] mt-1">
                  Unit tujuan hanya pencatatan unit yang dituju pasien, bukan poli spesifik.
                </p>
              </div>
            </fieldset>

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-primary)]">
              <button type="button" onClick={handleReset} className="btn btn-ghost">Reset</button>
              <button type="submit" disabled={submitting} className="btn btn-primary btn-lg disabled:opacity-50">
                {submitting ? 'Menyimpan…' : 'Daftarkan Pasien'}
              </button>
            </div>
          </form>
        </Card>

        {/* ============ DAFTAR PASIEN ============ */}
        <Card className="p-5">
          <h2 className="text-heading-lg font-bold text-[var(--text-primary)] mb-4">Pasien Terdaftar</h2>

          <form onSubmit={handleSearch} className="flex gap-2 mb-3">
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Cari nama / No RM / NIK"
              className="input flex-1"
            />
            <button type="submit" className="btn btn-secondary">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
          </form>

          <TabelMaster
            columns={columns}
            data={pasienList}
            searchKey={['noRm', 'nama', 'nik']}
            searchPlaceholder="Cari di tabel..."
            loading={loadingList}
            emptyMessage="Belum ada pasien untuk branch ini"
          />
        </Card>
      </div>
    </div>
  )
}
