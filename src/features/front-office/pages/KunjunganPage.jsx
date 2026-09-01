import { useEffect, useState } from 'react'

import { Card, Badge, toast, Modal, Btn, ConfirmDialog } from '../../../shared/components/ui.jsx'
import { TabelMaster, ActionDropdown } from '../../../shared/components/TabelMaster.jsx'
import PasienSearchRemote from '../../../shared/components/PasienSearchRemote.jsx'
import { useNavigate } from 'react-router-dom'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import {
  fetchKunjungan,
  fetchNextNomorKunjungan,
  createKunjungan,
  updateKunjungan,
  deleteKunjungan,
} from '../service/kunjunganService.js'
import { fetchPoli } from '../../master/service/poliService.js'
import { fetchRuangan } from '../../master/service/ruanganService.js'
import { fetchNakes } from '../../master/service/nakesService.js'
import { fetchAsuransi } from '../../master/service/asuransiService.js'

const EMERGENCY_FLAGS = ['nyeriDada', 'tidakSadarkanDiri', 'nadiTidakTeraba', 'gangguanPernapasan', 'perdarahan']

const INITIAL_SKRINING = {
  kondisiStabil: false,
  nyeriHebat: false,
  nyeriDada: false,
  tampakPucat: false,
  sempoyongan: false,
  lemas: false,
  tidakSadarkanDiri: false,
  nadiTidakTeraba: false,
  gangguanPernapasan: false,
  perdarahan: false,
  lainnya: false,
}

const INITIAL_FORM = {
  tipeKunjungan: 'rawat_jalan',
  nomorPendaftaran: '',
  namaPasien: null,
  penanggungJawab: '',
  hubunganPasien: '',
  tglJamKunjungan: '',
  jenisKunjungan: 'lama',
  poliId: '',
  namaPerujuk: '',
  ruanganId: '',
  statusPrioritas: 'normal',
  dokterId: '',
  dokterPenggantiId: '',
  gunakanDokterPengganti: false,
  perawatId: '',
  asuransiId: '',
  noAsuransi: '',
  biayaPendaftaran: 0,
  metodePembayaran: 'tunai',
  skrining: { ...INITIAL_SKRINING },
  keteranganSkrining: '',
}

function nowLocalDatetime() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Tanggal lokal (bukan UTC) — hindari salah tanggal di WIB */
function todayLocal() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function hitungUmur(tanggalLahir) {
  if (!tanggalLahir) return ''
  const lahir = new Date(tanggalLahir)
  const now = new Date()
  let tahun = now.getFullYear() - lahir.getFullYear()
  const m = now.getMonth() - lahir.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < lahir.getDate())) tahun--
  return tahun
}

const PRIORITY_BADGE = {
  normal: 'success',
  urgent: 'warning',
  emergency: 'danger',
}

const STATUS_BADGE = {
  terdaftar: 'neutral',
  menunggu: 'warning',
  diperiksa: 'info',
  selesai: 'success',
  batal: 'danger',
}

export default function KunjunganPage({ tipeKunjungan = 'rawat_jalan' }) {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [form, setForm] = useState(() => ({ ...INITIAL_FORM, tglJamKunjungan: nowLocalDatetime() }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [savedKunjungan, setSavedKunjungan] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const [poliList, setPoliList] = useState([])
  const [ruanganList, setRuanganList] = useState([])
  const [dokterList, setDokterList] = useState([])
  const [perawatList, setPerawatList] = useState([])
  const [asuransiList, setAsuransiList] = useState([])

  const [riwayatPasien, setRiwayatPasien] = useState([])
  const [riwayatLoading, setRiwayatLoading] = useState(false)
  const navigate = useNavigate()
  const [kunjunganHariIni, setKunjunganHariIni] = useState([])
  const [todayLoading, setTodayLoading] = useState(false)
  const [filterDate, setFilterDate] = useState(() => todayLocal())

  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({
    // Identitas
    noPendaftaran: '',
    tglJamKunjungan: '',
    jenisKunjungan: 'lama',
    status: 'terdaftar',
    statusPrioritas: 'normal',
    metodePembayaran: 'tunai',
    biayaPendaftaran: 0,
    tipeKunjungan: 'rawat_jalan',
    // Pasien (read-only di edit, hanya display)
    pasienId: null,
    pasienSnapshot: null,
    // Kunjungan medis
    poliId: '',
    ruanganId: '',
    dokterId: '',
    dokterPenggantiId: '',
    gunakanDokterPengganti: false,
    perawatId: '',
    namaPerujuk: '',
    // PJ & Asuransi
    penanggungJawab: '',
    hubunganPasien: '',
    asuransiId: '',
    noAsuransi: '',
    // Skrining
    skrining: { ...INITIAL_SKRINING },
    keteranganSkrining: '',
  })
  const [editLoading, setEditLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelLoading, setCancelLoading] = useState(false)

  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    const onBranchChange = () => {
      setBranchId(getCurrentBranchId())
      handleReset(true)
    }
    window.addEventListener('branch:changed', onBranchChange)
    return () => window.removeEventListener('branch:changed', onBranchChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadMasterData()
    loadKunjunganHariIni()
    fetchNomor()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId])

  useEffect(() => {
    loadKunjunganHariIni(filterDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate])

  // Reload ruangan when poli changes
  useEffect(() => {
    if (!branchId) return
    fetchRuangan(branchId, form.poliId || null)
      .then((data) => setRuanganList(data))
      .catch((err) => {
        console.error('[Kunjungan] Gagal memuat ruangan:', err)
        setRuanganList([])
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.poliId, branchId])

  const loadMasterData = async () => {
    if (!branchId) return
    try {
      const [poli, dokter, perawat, asuransi] = await Promise.all([
        fetchPoli(branchId),
        fetchNakes(branchId, { tipe: 'dokter' }),
        fetchNakes(branchId, { tipe: 'perawat' }),
        fetchAsuransi(branchId),
      ])
      setPoliList(poli)
      setDokterList(dokter)
      setPerawatList(perawat)
      setAsuransiList(asuransi)
    } catch (err) {
      console.error('[Kunjungan] Gagal memuat master:', err)
    }
  }

  const loadKunjunganHariIni = async (date = filterDate) => {
    if (!branchId) return
    setTodayLoading(true)
    try {
      const data = await fetchKunjungan(branchId, {
        date_from: date,
        date_to: date,
        tipe: tipeKunjungan,
        limit: 100,
      })
      setKunjunganHariIni(data)
    } catch (err) {
      console.error('[Kunjungan] Gagal memuat kunjungan hari ini:', err)
      setKunjunganHariIni([])
    } finally {
      setTodayLoading(false)
    }
  }

  const fetchNomor = async () => {
    if (!branchId) return
    try {
      const nomor = await fetchNextNomorKunjungan(branchId, tipeKunjungan)
      setForm((prev) => ({ ...prev, nomorPendaftaran: nomor || '' }))
    } catch (err) {
      console.error('[Kunjungan] Gagal mengambil nomor:', err)
    }
  }

  const handleSelectPasien = async (pasien) => {
    setForm((prev) => ({ ...prev, namaPasien: pasien }))
    setErrors((prev) => ({ ...prev, namaPasien: '' }))
    setRiwayatLoading(true)
    try {
      const data = await fetchKunjungan(branchId, { pasien_id: pasien.id, limit: 5 })
      setRiwayatPasien(data)
    } catch (err) {
      console.error('[Kunjungan] Gagal memuat riwayat pasien:', err)
      setRiwayatPasien([])
    } finally {
      setRiwayatLoading(false)
    }
  }

  const handleClearPasien = () => {
    setForm((prev) => ({ ...prev, namaPasien: null, penanggungJawab: '' }))
    setRiwayatPasien([])
  }

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const setSkrining = (key, checked) => {
    setForm((prev) => {
      const nextSkrining = { ...prev.skrining, [key]: checked }
      const triggered = EMERGENCY_FLAGS.some((f) => nextSkrining[f])
      return {
        ...prev,
        skrining: nextSkrining,
        // auto-escalate to emergency if red-flag aktif
        statusPrioritas: triggered ? 'emergency' : prev.statusPrioritas === 'emergency' && !triggered ? prev.statusPrioritas : prev.statusPrioritas,
      }
    })
  }

  const setEditField = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const setEditSkrining = (key, checked) => {
    setEditForm((prev) => {
      const nextSkrining = { ...prev.skrining, [key]: checked }
      const triggered = EMERGENCY_FLAGS.some((f) => nextSkrining[f])
      return {
        ...prev,
        skrining: nextSkrining,
        statusPrioritas: triggered ? 'emergency' : prev.statusPrioritas === 'emergency' && !triggered ? prev.statusPrioritas : prev.statusPrioritas,
      }
    })
  }

  const [editRuanganList, setEditRuanganList] = useState([])

  useEffect(() => {
    if (!branchId || !editTarget || !editForm.poliId) {
      setEditRuanganList([])
      return
    }
    fetchRuangan(branchId, editForm.poliId || null)
      .then((data) => setEditRuanganList(data))
      .catch((err) => {
        console.error('[Kunjungan Edit] Gagal memuat ruangan:', err)
        setEditRuanganList([])
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editForm.poliId, branchId, editTarget])

  const validate = () => {
    const err = {}
    if (!form.namaPasien) err.namaPasien = 'Pasien wajib dipilih'
    if (!form.tglJamKunjungan) err.tglJamKunjungan = 'Wajib diisi'
    if (!form.poliId) err.poliId = 'Wajib dipilih'
    if (!form.dokterId) err.dokterId = 'Wajib dipilih'
    if (Number(form.biayaPendaftaran) < 0) err.biayaPendaftaran = 'Tidak boleh negatif'
    if (form.hubunganPasien && form.hubunganPasien !== 'Diri Sendiri' && !form.penanggungJawab.trim()) {
      err.penanggungJawab = 'Wajib diisi jika penanggung jawab bukan diri sendiri'
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
    if (!branchId) {
      setErrorMsg('Branch aktif tidak ditemukan')
      return
    }

    setSubmitting(true)
    setErrorMsg('')
    try {
      const skriningActive = Object.entries(form.skrining)
        .filter(([, v]) => v)
        .map(([k]) => k)
      const payload = {
        branch_id: Number(branchId),
        pasien_id: form.namaPasien.id,
        no_pendaftaran: form.nomorPendaftaran || undefined,
        tipe_kunjungan: tipeKunjungan,
        jenis_kunjungan: form.jenisKunjungan,
        tgl_jam_kunjungan: form.tglJamKunjungan.replace('T', ' ') + ':00',
        poli_id: form.poliId ? Number(form.poliId) : null,
        ruangan_id: form.ruanganId ? Number(form.ruanganId) : null,
        dokter_id: form.dokterId ? Number(form.dokterId) : null,
        dokter_pengganti_id: form.gunakanDokterPengganti && form.dokterPenggantiId
          ? Number(form.dokterPenggantiId)
          : null,
        perawat_id: form.perawatId ? Number(form.perawatId) : null,
        nama_perujuk: form.namaPerujuk.trim() || null,
        penanggung_jawab: form.penanggungJawab.trim() || null,
        hubungan_pj: form.hubunganPasien || null,
        asuransi_id: form.asuransiId ? Number(form.asuransiId) : null,
        no_asuransi: form.noAsuransi.trim() || null,
        biaya_pendaftaran: Number(form.biayaPendaftaran) || 0,
        metode_pembayaran: form.metodePembayaran,
        status_prioritas: form.statusPrioritas,
        skrining_visual: skriningActive,
        keterangan_skrining: form.keteranganSkrining.trim() || null,
      }

      const created = await createKunjungan(payload)
      setSavedKunjungan(created)
      toast('Kunjungan berhasil didaftarkan', 'success')
      setCreateModalOpen(false)
      // Tampilkan daftar pada tanggal kunjungan yang baru dibuat
      const tglKunjungan = (payload.tgl_jam_kunjungan || '').slice(0, 10)
      if (tglKunjungan) setFilterDate(tglKunjungan)
      await loadKunjunganHariIni(tglKunjungan || filterDate)
      await fetchNomor()
      handleReset(false)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        const fieldErrs = {}
        for (const [k, msgs] of Object.entries(data.errors)) {
          fieldErrs[k] = msgs[0]
        }
        setErrors(fieldErrs)
      }
      setErrorMsg(data?.message || 'Gagal mendaftarkan kunjungan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = (withToast = false) => {
    setForm({
      ...INITIAL_FORM,
      tglJamKunjungan: nowLocalDatetime(),
      nomorPendaftaran: form.nomorPendaftaran || '',
    })
    setErrors({})
    setErrorMsg('')
    setSavedKunjungan(null)
    if (!withToast) fetchNomor()
  }

  const handleOpenEdit = (k) => {
    setEditTarget(k)
    const skr = { ...INITIAL_SKRINING }
    if (Array.isArray(k.skriningVisual)) {
      k.skriningVisual.forEach((s) => { if (s in skr) skr[s] = true })
    }
    const tgl = k.tglJamKunjungan ? k.tglJamKunjungan.replace(' ', 'T').slice(0, 16) : ''
    setEditForm({
      noPendaftaran: k.noPendaftaran || '',
      tglJamKunjungan: tgl,
      jenisKunjungan: k.jenisKunjungan || 'lama',
      status: k.status || 'terdaftar',
      statusPrioritas: k.statusPrioritas || 'normal',
      metodePembayaran: k.metodePembayaran || 'tunai',
      biayaPendaftaran: Number(k.biayaPendaftaran) || 0,
      tipeKunjungan: k.tipeKunjungan || 'rawat_jalan',
      pasienId: k.pasien_id || k.pasien?.id || null,
      pasienSnapshot: k.pasien || null,
      poliId: k.poli_id ? String(k.poli_id) : '',
      ruanganId: k.ruangan_id ? String(k.ruangan_id) : '',
      dokterId: k.dokter_id ? String(k.dokter_id) : '',
      dokterPenggantiId: k.dokter_pengganti_id ? String(k.dokter_pengganti_id) : '',
      gunakanDokterPengganti: Boolean(k.dokter_pengganti_id),
      perawatId: k.perawat_id ? String(k.perawat_id) : '',
      namaPerujuk: k.namaPerujuk || '',
      penanggungJawab: k.penanggungJawab || '',
      hubunganPasien: k.hubunganPj || '',
      asuransiId: k.asuransi_id ? String(k.asuransi_id) : '',
      noAsuransi: k.noAsuransi || '',
      skrining: skr,
      keteranganSkrining: k.keteranganSkrining || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editTarget) return
    setEditLoading(true)
    try {
      const skriningActive = Object.entries(editForm.skrining)
        .filter(([, v]) => v)
        .map(([k]) => k)
      await updateKunjungan(editTarget.id, {
        tgl_jam_kunjungan: editForm.tglJamKunjungan ? editForm.tglJamKunjungan.replace('T', ' ') + ':00' : undefined,
        jenis_kunjungan: editForm.jenisKunjungan,
        status: editForm.status,
        status_prioritas: editForm.statusPrioritas,
        metode_pembayaran: editForm.metodePembayaran,
        biaya_pendaftaran: Number(editForm.biayaPendaftaran) || 0,
        poli_id: editForm.poliId ? Number(editForm.poliId) : null,
        ruangan_id: editForm.ruanganId ? Number(editForm.ruanganId) : null,
        dokter_id: editForm.dokterId ? Number(editForm.dokterId) : null,
        dokter_pengganti_id: editForm.gunakanDokterPengganti && editForm.dokterPenggantiId
          ? Number(editForm.dokterPenggantiId)
          : null,
        perawat_id: editForm.perawatId ? Number(editForm.perawatId) : null,
        nama_perujuk: editForm.namaPerujuk.trim() || null,
        penanggung_jawab: editForm.penanggungJawab.trim() || null,
        hubungan_pj: editForm.hubunganPasien || null,
        asuransi_id: editForm.asuransiId ? Number(editForm.asuransiId) : null,
        no_asuransi: editForm.noAsuransi.trim() || null,
        skrining_visual: skriningActive,
        keterangan_skrining: editForm.keteranganSkrining.trim() || null,
      })
      toast('Kunjungan berhasil diperbarui', 'success')
      setEditTarget(null)
      await loadKunjunganHariIni()
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal memperbarui kunjungan', 'error')
    } finally {
      setEditLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteKunjungan(deleteTarget.id)
      toast('Kunjungan berhasil dihapus', 'success')
      setDeleteTarget(null)
      await loadKunjunganHariIni()
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal menghapus kunjungan', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Batalkan kunjungan (beda dengan Hapus — hanya update status jadi 'batal')
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    setCancelLoading(true)
    try {
      await updateKunjungan(cancelTarget.id, { status: 'batal' })
      toast(`Kunjungan ${cancelTarget.noPendaftaran} berhasil dibatalkan`, 'success')
      setCancelTarget(null)
      await loadKunjunganHariIni()
    } catch (err) {
      toast(err.response?.data?.message || 'Gagal membatalkan kunjungan', 'error')
    } finally {
      setCancelLoading(false)
    }
  }

  // Cetak struk antrian (buka window print baru)
  const handlePrintQueue = (row) => {
    const pasien = row.pasien
    const poli = row.poli
    const dokter = row.dokter
    const tanggal = row.tglJamKunjungan
      ? new Date(row.tglJamKunjungan).toLocaleDateString('id-ID', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
      : '-'
    const priorityLabel = { emergency: 'Darurat', urgent: 'Urgent', normal: 'Normal' }
    const win = window.open('', '_blank', 'width=420,height=600')
    win.document.write(`
<!DOCTYPE html>
<html><head><title>Cetak Antrian</title>
<style>
  body { font-family: monospace; font-size: 12px; margin: 0; padding: 12px; color: #000; }
  .card { border: 1px dashed #000; padding: 12px; page-break-after: always; }
  .center { text-align: center; }
  .logo { font-size: 16px; font-weight: bold; letter-spacing: 2px; }
  .qr { width: 60px; height: 60px; border: 1px solid #000; display: inline-block; margin: 4px auto; }
  .divider { border-top: 1px solid #000; margin: 6px 0; }
  .bold { font-weight: bold; }
  table { width: 100%; margin-top: 6px; }
  td { padding: 1px 4px; }
  .no-antrian { font-size: 22px; font-weight: bold; text-align: center; margin: 4px 0; }
  .small { font-size: 10px; }
</style>
</head><body>
<div class="card">
  <div class="center">
    <div class="logo">MEDI-CORE CLINIC</div>
    <div class="small">Nomor Antrian Pasien</div>
  </div>
  <div class="divider"></div>
  <div class="no-antrian">NO: ${row.noPendaftaran}</div>
  <div class="divider"></div>
  <table>
    <tr><td class="bold">Nama</td><td>: ${pasien?.nama || '-'}</td></tr>
    <tr><td class="bold">No. RM</td><td>: ${pasien?.noRm || '-'}</td></tr>
    <tr><td class="bold">Poli</td><td>: ${poli?.nama || '-'}</td></tr>
    <tr><td class="bold">Dokter</td><td>: ${dokter?.nama || '-'}</td></tr>
    <tr><td class="bold">Tanggal</td><td>: ${tanggal}</td></tr>
    <tr><td class="bold">Prioritas</td><td>: ${priorityLabel[row.statusPrioritas] || row.statusPrioritas}</td></tr>
  </table>
  <div class="divider"></div>
  <div class="center small">Harap menunggu dipanggil di loket pelayanan.</div>
</div>
</body></html>
`)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Pendaftaran Kunjungan Pasien</h1>
          <p className="page-desc">Catat kunjungan rawat jalan pasien yang sudah terdaftar. Data dipisah otomatis per branch.</p>
          <p className="mt-1 text-tiny text-[var(--text-muted)]">Branch aktif: <span className="font-mono">{branchId}</span></p>
        </div>
      </div>

      {savedKunjungan && (
        <div className="relative overflow-hidden rounded-xl border border-[var(--status-success)] bg-[var(--brand-light)]/30 dark:bg-[var(--bg-tertiary)]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--status-success)]" />
          <div className="p-4 pl-5 flex items-center gap-3">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-[var(--status-success)] text-white flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--text-primary)]">Kunjungan Berhasil Didaftarkan</p>
              <p className="text-body-sm text-[var(--text-secondary)] mt-0.5">
                No: <strong className="font-mono text-[var(--brand-hover)]">{savedKunjungan.noPendaftaran}</strong>
                {' • '}
                Pasien: <strong className="text-[var(--text-primary)]">{savedKunjungan.pasien?.nama}</strong>
                {savedKunjungan.poli?.nama ? <> {' • '} Poli: <strong className="text-[var(--text-primary)]">{savedKunjungan.poli.nama}</strong></> : null}
              </p>
            </div>
            <button
              onClick={() => setSavedKunjungan(null)}
              className="shrink-0 p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
              type="button"
              aria-label="Tutup notifikasi"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">

        {/* ============ SIDEBAR: PASIEN + KUNJUNGAN HARI INI ============ */}
        <div className="space-y-4">
          {form.namaPasien && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--border-primary)]">
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-heading-md font-bold text-[var(--text-primary)] leading-tight">Riwayat Pasien</h3>
                  <p className="text-tiny text-[var(--text-muted)]">{riwayatPasien.length} kunjungan sebelumnya</p>
                </div>
              </div>
              {riwayatLoading ? (
                <div className="flex items-center gap-2 text-body-sm text-[var(--text-muted)] py-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/><path d="m22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                  Memuat riwayat…
                </div>
              ) : riwayatPasien.length === 0 ? (
                <div className="py-6 text-center">
                  <svg className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-40 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                  <p className="text-body-sm text-[var(--text-muted)]">Belum ada kunjungan tercatat</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {riwayatPasien.map((k) => (
                    <div key={k.id} className="group rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--brand-primary)]/40 transition-colors">
                      <div className="p-3">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono text-tiny font-semibold text-[var(--brand-primary)]">{k.noPendaftaran}</span>
                          <Badge tone={PRIORITY_BADGE[k.statusPrioritas] || 'neutral'}>{k.statusPrioritas}</Badge>
                        </div>
                        <p className="text-body-sm font-medium text-[var(--text-primary)]">{k.poli?.nama || '-'}</p>
                        <p className="text-tiny text-[var(--text-muted)] mt-0.5">{k.dokter?.nama || '-'}</p>
                        <p className="text-tiny text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                          {k.tglJamKunjungan}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--border-primary)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-heading-md font-bold text-[var(--text-primary)] leading-tight">Daftar Kunjungan</h3>
                <p className="text-tiny text-[var(--text-muted)]">
                  {filterDate
                    ? new Date(filterDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Semua tanggal'}
                </p>
              </div>
              <span className="shrink-0 px-2 py-1 rounded-md bg-[var(--brand-light)] text-[var(--brand-hover)] text-tiny font-mono font-semibold">
                {kunjunganHariIni.length}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-tiny font-medium text-[var(--text-secondary)] shrink-0">Tanggal</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() => setFilterDate(todayLocal())}
                  className="btn btn-ghost btn-sm shrink-0"
                  title="Reset ke hari ini"
                >
                  Hari ini
                </button>
              </div>
              <Btn
                variant="primary"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                icon={
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                }
              >
                Tambah Kunjungan
              </Btn>
            </div>

            <TabelMaster
              columns={[
                { key: 'noPendaftaran', label: 'No. Pendaftaran', sortable: true, width: '160px', render: (v) => <span className="font-mono text-tiny font-semibold text-[var(--brand-primary)]">{v}</span> },
                { key: 'pasienNama', label: 'Nama Pasien', sortable: true, render: (_, row) => (
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{row.pasien?.nama || '-'}</div>
                    <div className="text-tiny text-[var(--text-muted)] font-mono">{row.pasien?.noRm || '-'}</div>
                  </div>
                )},
                { key: 'poliNama', label: 'Poli', render: (_, row) => row.poli?.nama || '-' },
                { key: 'dokterNama', label: 'Dokter', render: (_, row) => row.dokter?.nama || '-' },
                { key: 'jam', label: 'Jam', width: '90px', render: (_, row) => {
                  if (!row.tglJamKunjungan) return '-'
                  const t = row.tglJamKunjungan.split(' ')
                  return <span className="font-mono text-tiny">{t[1] ? t[1].slice(0, 5) : '-'}</span>
                }},
                { key: 'prioritas', label: 'Prioritas', width: '110px', render: (_, row) => (
                  <Badge tone={PRIORITY_BADGE[row.statusPrioritas] || 'neutral'}>{row.statusPrioritas || 'normal'}</Badge>
                )},
                { key: 'status', label: 'Status', width: '110px', render: (v) => <Badge tone={STATUS_BADGE[v] || 'neutral'}>{v}</Badge> },
              ]}
              data={kunjunganHariIni}
              searchKey={['noPendaftaran', 'penanggungJawab']}
              searchPlaceholder="Cari nomor / penanggung jawab…"
              loading={todayLoading}
              emptyMessage={filterDate ? `Belum ada kunjungan pada ${new Date(filterDate + 'T00:00:00').toLocaleDateString('id-ID')}` : 'Belum ada kunjungan'}
              actions={[
                { label: 'TTV > Tanda - Tanda Vital', onClick: (row) => navigate(`/pendaftaran-lama/${row.encodedId}/ttv`), icon: (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M20.84 4.61a2.17 2.17 0 01-.74 1.47L9.5 14.51l-4.73 1.19 1.2-4.8 10.4-6.05a1.65 1.65 0 012.12.77 1.65 1.65 0 01-.43 1.9z"/><circle cx="12" cy="12" r="8" style={{transform:'scale(1.2)'}}/></svg>
                )},
                { label: 'Update > Perbarui data Kunjungan', onClick: (row) => handleOpenEdit(row), icon: (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                )},
                { label: 'Batalkan Kunjungan', onClick: (row) => setCancelTarget(row), icon: (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M18.6 6.6 12 13.2l-3-3" strokeLinecap="round"/><path d="M5 19h14"/></svg>
                )},
                { label: 'Cetak Antrian', onClick: (row) => handlePrintQueue(row), icon: (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="6" y="9" width="12" height="10" ry="2"/><path d="M6 9V5a6 6 0 0 1 12 0v4M9 13h6v2H9z"/></svg>
                )},
                { label: 'Assesment Keperawatan', onClick: (row) => navigate(`/pendaftaran-lama/${row.encodedId}/nursing-assessment`), icon: (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M9 11h6M9 15h6M12 7V4a5 5 0 0 1 5 5v4l2 3v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2l2-3V9a5 5 0 0 1 5-5z"/></svg>
                )},
                { label: 'Hapus > Hapus Kunjungan', danger: true, onClick: (row) => setDeleteTarget(row), icon: (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                )},
              ]}
            />
          </Card>
        </div>
      </div>

      {/* ============ EDIT MODAL (FULL FORM) ============ */}
      <Modal open={Boolean(editTarget)} onClose={() => !editLoading && setEditTarget(null)} title="Edit Kunjungan" size="xl">
        {editTarget && (
          <form
            onSubmit={(e) => { e.preventDefault(); handleSaveEdit() }}
            className="flex flex-col max-h-[calc(80vh-80px)]"
          >
            {/* STICKY FIELD PERTAMA: Info singkat kunjungan */}
            <div className="sticky top-0 z-10 -mx-5 px-5 py-3 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] flex items-center gap-3">
              <div className="w-9 h-9 shrink-0 rounded-lg bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-tiny font-semibold text-[var(--brand-primary)]">{editForm.noPendaftaran}</span>
                  <Badge tone={STATUS_BADGE[editForm.status] || 'neutral'}>{editForm.status}</Badge>
                </div>
                <p className="text-body-sm font-medium text-[var(--text-primary)] truncate">
                  {editForm.pasienSnapshot?.nama || '-'}
                </p>
                <p className="text-tiny text-[var(--text-muted)] truncate">
                  {editForm.pasienSnapshot?.noRm || '-'} • {editForm.pasienSnapshot?.nik || '-'}
                </p>
              </div>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* === IDENTITAS KUNJUNGAN === */}
              <fieldset className="space-y-3">
                <legend className="text-body-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Identitas Kunjungan</legend>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nomor Pendaftaran</label>
                    <input type="text" value={editForm.noPendaftaran} readOnly className="input bg-[var(--bg-tertiary)] font-mono" />
                  </div>
                  <div>
                    <label className="label">Tanggal & Jam Kunjungan</label>
                    <input
                      type="datetime-local"
                      value={editForm.tglJamKunjungan}
                      onChange={(e) => setEditField('tglJamKunjungan', e.target.value)}
                      className="input"
                      disabled={editLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="label">Jenis Kunjungan</label>
                    <select value={editForm.jenisKunjungan} onChange={(e) => setEditField('jenisKunjungan', e.target.value)} className="input" disabled={editLoading}>
                      <option value="baru">Baru</option>
                      <option value="lama">Lama</option>
                      <option value="kontrol">Kontrol</option>
                      <option value="rujukan">Rujukan</option>
                      <option value="langsung">Langsung</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Status Kunjungan</label>
                    <select value={editForm.status} onChange={(e) => setEditField('status', e.target.value)} className="input" disabled={editLoading}>
                      <option value="terdaftar">Terdaftar</option>
                      <option value="menunggu">Menunggu</option>
                      <option value="diperiksa">Diperiksa</option>
                      <option value="selesai">Selesai</option>
                      <option value="batal">Batal</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Status Prioritas</label>
                    <select value={editForm.statusPrioritas} onChange={(e) => setEditField('statusPrioritas', e.target.value)} className="input" disabled={editLoading}>
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="label">Metode Pembayaran</label>
                    <select value={editForm.metodePembayaran} onChange={(e) => setEditField('metodePembayaran', e.target.value)} className="input" disabled={editLoading}>
                      <option value="tunai">Tunai</option>
                      <option value="asuransi">Asuransi</option>
                      <option value="bpjs">BPJS</option>
                      <option value="transfer">Transfer</option>
                      <option value="qris">QRIS</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Biaya Pendaftaran <span className="text-[var(--text-muted)] font-normal">(Rp)</span></label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.biayaPendaftaran}
                      onChange={(e) => setEditField('biayaPendaftaran', e.target.value)}
                      className="input"
                      disabled={editLoading}
                    />
                  </div>
                  <div>
                    <label className="label">Tipe Kunjungan</label>
                    <input type="text" value={editForm.tipeKunjungan === 'rawat_inap' ? 'Rawat Inap' : 'Rawat Jalan'} disabled className="input bg-[var(--bg-tertiary)]" />
                  </div>
                </div>
              </fieldset>

              {/* === KUNJUNGAN MEDIS === */}
              <fieldset className="space-y-3">
                <legend className="text-body-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Kunjungan Medis</legend>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Poliklinik Tujuan</label>
                    <select value={editForm.poliId} onChange={(e) => setEditField('poliId', e.target.value)} className="input" disabled={editLoading}>
                      <option value="">-- Pilih Poli --</option>
                      {poliList.map((p) => (
                        <option key={p.id} value={String(p.id)}>{p.kode} - {p.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Ruangan</label>
                    <select value={editForm.ruanganId} onChange={(e) => setEditField('ruanganId', e.target.value)} className="input" disabled={!editForm.poliId || editLoading}>
                      <option value="">-- Pilih Ruangan --</option>
                      {editRuanganList.map((r) => (
                        <option key={r.id} value={String(r.id)}>{r.kode} - {r.namaRuangan}{r.kelas ? ` (${r.kelas})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Dokter</label>
                    <select value={editForm.dokterId} onChange={(e) => setEditField('dokterId', e.target.value)} className="input" disabled={editLoading}>
                      <option value="">-- Pilih Dokter --</option>
                      {dokterList.map((d) => (
                        <option key={d.id} value={String(d.id)}>{d.nama}{d.spesialisasi ? ` (${d.spesialisasi})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Perawat</label>
                    <select value={editForm.perawatId} onChange={(e) => setEditField('perawatId', e.target.value)} className="input" disabled={editLoading}>
                      <option value="">-- Pilih Perawat --</option>
                      {perawatList.map((p) => (
                        <option key={p.id} value={String(p.id)}>{p.nama}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.gunakanDokterPengganti}
                    onChange={(e) => setEditField('gunakanDokterPengganti', e.target.checked)}
                    className="rounded border-[var(--border-primary)]"
                    disabled={editLoading}
                  />
                  <span className="text-body-sm">Gunakan Dokter Pengganti</span>
                </label>

                {editForm.gunakanDokterPengganti && (
                  <div>
                    <label className="label">Dokter Pengganti</label>
                    <select value={editForm.dokterPenggantiId} onChange={(e) => setEditField('dokterPenggantiId', e.target.value)} className="input" disabled={editLoading}>
                      <option value="">-- Pilih Dokter Pengganti --</option>
                      {dokterList
                        .filter((d) => String(d.id) !== String(editForm.dokterId))
                        .map((d) => (
                          <option key={d.id} value={String(d.id)}>{d.nama}{d.spesialisasi ? ` (${d.spesialisasi})` : ''}</option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="label">Nama Perujuk <span className="text-[var(--text-muted)] font-normal">(opsional)</span></label>
                  <input type="text" value={editForm.namaPerujuk} onChange={(e) => setEditField('namaPerujuk', e.target.value)} className="input" disabled={editLoading} />
                </div>
              </fieldset>

              {/* === PENANGGUNG JAWAB & ASURANSI === */}
              <fieldset className="space-y-3">
                <legend className="text-body-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Penanggung Jawab & Asuransi</legend>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Penanggung Jawab</label>
                    <input type="text" value={editForm.penanggungJawab} onChange={(e) => setEditField('penanggungJawab', e.target.value)} className="input" disabled={editLoading} />
                  </div>
                  <div>
                    <label className="label">Hubungan dengan Pasien</label>
                    <select value={editForm.hubunganPasien} onChange={(e) => setEditField('hubunganPasien', e.target.value)} className="input" disabled={editLoading}>
                      <option value="">-- Pilih --</option>
                      <option value="Diri Sendiri">Diri Sendiri</option>
                      <option value="Suami">Suami</option>
                      <option value="Istri">Istri</option>
                      <option value="Anak">Anak</option>
                      <option value="Ayah">Ayah</option>
                      <option value="Ibu">Ibu</option>
                      <option value="Wali">Wali</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Penjamin / Asuransi</label>
                    <select value={editForm.asuransiId} onChange={(e) => setEditField('asuransiId', e.target.value)} className="input" disabled={editLoading}>
                      <option value="">-- Pilih Penjamin --</option>
                      {asuransiList.map((a) => (
                        <option key={a.id} value={String(a.id)}>{a.namaPerusahaan}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Nomor Asuransi</label>
                    <input type="text" value={editForm.noAsuransi} onChange={(e) => setEditField('noAsuransi', e.target.value)} className="input" disabled={editLoading} />
                  </div>
                </div>
              </fieldset>

              {/* === SKRINING VISUAL TRIASE === */}
              <fieldset className="space-y-3">
                <legend className="text-body-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Skrining Visual Triase</legend>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                  <SkriningCheckbox label="Kondisi Stabil" field="kondisiStabil" form={editForm} setSkrining={setEditSkrining} />
                  <SkriningCheckbox label="Nyeri Hebat" field="nyeriHebat" form={editForm} setSkrining={setEditSkrining} />
                  <SkriningCheckbox label="Nyeri Dada" field="nyeriDada" form={editForm} setSkrining={setEditSkrining} danger />
                  <SkriningCheckbox label="Tampak Pucat" field="tampakPucat" form={editForm} setSkrining={setEditSkrining} />
                  <SkriningCheckbox label="Sempoyongan" field="sempoyongan" form={editForm} setSkrining={setEditSkrining} />
                  <SkriningCheckbox label="Lemas" field="lemas" form={editForm} setSkrining={setEditSkrining} />
                  <SkriningCheckbox label="Tidak Sadarkan Diri / Pingsan" field="tidakSadarkanDiri" form={editForm} setSkrining={setEditSkrining} danger />
                  <SkriningCheckbox label="Nadi Tidak Teraba / Jantung Berhenti" field="nadiTidakTeraba" form={editForm} setSkrining={setEditSkrining} danger />
                  <SkriningCheckbox label="Gangguan Pernapasan" field="gangguanPernapasan" form={editForm} setSkrining={setEditSkrining} danger />
                  <SkriningCheckbox label="Perdarahan" field="perdarahan" form={editForm} setSkrining={setEditSkrining} danger />
                  <SkriningCheckbox label="Lainnya" field="lainnya" form={editForm} setSkrining={setEditSkrining} />
                </div>

                <div>
                  <label className="label">Keterangan Tambahan</label>
                  <textarea
                    rows={2}
                    value={editForm.keteranganSkrining}
                    onChange={(e) => setEditField('keteranganSkrining', e.target.value)}
                    className="input"
                    placeholder="Catatan triase / perubahan…"
                    disabled={editLoading}
                  />
                </div>

                <p className="text-tiny text-[var(--text-muted)]">
                  Tanda bahaya (Nyeri Dada, Tidak Sadarkan Diri, Nadi Tidak Teraba, Gangguan Pernapasan, Perdarahan hebat) akan otomatis mengubah status prioritas ke <strong>Emergency</strong>.
                </p>
              </fieldset>
            </div>

            {/* STICKY ACTION FOOTER */}
            <div className="sticky bottom-0 z-10 -mx-5 px-5 py-3 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] flex justify-end gap-2">
              <Btn variant="secondary" onClick={() => setEditTarget(null)} disabled={editLoading}>Batal</Btn>
              <Btn variant="primary" type="submit" disabled={editLoading}>
                {editLoading ? 'Menyimpan…' : 'Simpan Perubahan'}
              </Btn>
            </div>
          </form>
        )}
      </Modal>

      {/* ============ DELETE CONFIRM ============ */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Kunjungan?"
        message={
          deleteTarget
            ? `Kunjungan ${deleteTarget.noPendaftaran} untuk pasien ${deleteTarget.pasien?.nama || '-'} akan dihapus. Tindakan ini tidak dapat dibatalkan.`
            : ''
        }
        confirmLabel={deleteLoading ? 'Menghapus…' : 'Ya, hapus'}
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleteLoading && setDeleteTarget(null)}
      />

      {/* ============ CANCEL CONFIRM ============ */}
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Batalkan Kunjungan?"
        message={
          cancelTarget
            ? `Kunjungan ${cancelTarget.noPendaftaran} untuk pasien ${cancelTarget.pasien?.nama || '-'} akan dibatalkan. Status diubah ke "Batal".`
            : ''
        }
        confirmLabel={cancelLoading ? 'Membatalkan…' : 'Ya, batalkan'}
        onConfirm={handleConfirmCancel}
        onCancel={() => !cancelLoading && setCancelTarget(null)}
      />

      {/* ============ CREATE KUNJUNGAN MODAL ============ */}
      <Modal
        open={createModalOpen}
        onClose={() => !submitting && setCreateModalOpen(false)}
        title="Pendaftaran Kunjungan Pasien"
        size="xl"
      >
        <form
          onSubmit={handleSubmit}
          className="flex flex-col max-h-[calc(80vh-80px)]"
        >
          {/* STICKY FIELD PERTAMA: Info branch + nomor akan di-generate */}
          <div className="sticky top-0 z-10 -mx-5 px-5 py-3 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] flex items-center gap-3">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-tiny text-[var(--text-muted)]">No Pendaftaran:</span>
                <span className="font-mono text-tiny font-semibold text-[var(--brand-primary)]">{form.nomorPendaftaran || '(akan di-generate)'}</span>
              </div>
              <p className="text-body-sm font-medium text-[var(--text-primary)] truncate">
                Branch aktif: <span className="font-mono">{branchId}</span> • Rawat Jalan
              </p>
            </div>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {errorMsg && (
            <div className="relative overflow-hidden rounded-lg border border-[var(--status-danger)] bg-[var(--status-danger)]/10">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--status-danger)]" />
              <div className="p-3 pl-4 flex items-start gap-2.5">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-[var(--status-danger)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                <p className="text-body-sm text-[var(--status-danger)] font-medium">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* === IDENTITAS KUNJUNGAN === */}
          <fieldset className="space-y-3">
            <legend className="text-body-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Identitas Kunjungan</legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Nomor Pendaftaran</label>
                <input
                  type="text"
                  value={form.nomorPendaftaran}
                  onChange={(e) => setField('nomorPendaftaran', e.target.value)}
                  className="input bg-[var(--bg-tertiary)] font-mono"
                  readOnly
                />
              </div>
              <div>
                <label className="label">Tanggal & Jam Kunjungan <span className="text-[var(--status-danger)] ml-0.5">*</span></label>
                <input
                  type="datetime-local"
                  value={form.tglJamKunjungan}
                    onChange={(e) => setField('tglJamKunjungan', e.target.value)}
                    className={`input ${errors.tglJamKunjungan ? 'input-error' : ''}`}
                  />
                  {errors.tglJamKunjungan && <p className="text-tiny text-red-500 mt-0.5">{errors.tglJamKunjungan}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="label">Jenis Kunjungan</label>
                <select value={form.jenisKunjungan} onChange={(e) => setField('jenisKunjungan', e.target.value)} className="input">
                  <option value="baru">Baru</option>
                  <option value="lama">Lama</option>
                  <option value="kontrol">Kontrol</option>
                  <option value="rujukan">Rujukan</option>
                  <option value="langsung">Langsung</option>
                </select>
              </div>
              <div>
                <label className="label">Status Prioritas</label>
                <select value={form.statusPrioritas} onChange={(e) => setField('statusPrioritas', e.target.value)} className="input">
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="label">Metode Pembayaran</label>
                <select value={form.metodePembayaran} onChange={(e) => setField('metodePembayaran', e.target.value)} className="input">
                  <option value="tunai">Tunai</option>
                  <option value="asuransi">Asuransi</option>
                  <option value="bpjs">BPJS</option>
                  <option value="transfer">Transfer</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Biaya Pendaftaran <span className="text-[var(--text-muted)] font-normal">(Rp)</span></label>
                <input
                  type="number"
                  min="0"
                  value={form.biayaPendaftaran}
                  onChange={(e) => setField('biayaPendaftaran', e.target.value)}
                  className={`input ${errors.biayaPendaftaran ? 'input-error' : ''}`}
                  placeholder="0"
                />
                {errors.biayaPendaftaran && <p className="text-tiny text-red-500 mt-0.5">{errors.biayaPendaftaran}</p>}
              </div>
              <div>
                <label className="label">Tipe Kunjungan</label>
                <input type="text" value="Rawat Jalan" disabled className="input bg-[var(--bg-tertiary)]" />
                <p className="text-tiny text-[var(--text-muted)] mt-1">Modul rawat inap akan segera tersedia.</p>
              </div>
            </div>
          </fieldset>

          {/* === PASIEN === */}
          <fieldset className="space-y-3">
            <legend className="text-body-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Pasien</legend>

            <PasienSearchRemote
              branchId={branchId}
              value={form.namaPasien}
              onSelect={handleSelectPasien}
              onClear={handleClearPasien}
              placeholder="Ketik nama / No RM / NIK…"
              required
              error={errors.namaPasien}
            />

            {form.namaPasien && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                <div className="col-span-2">
                  <p className="text-tiny text-[var(--text-muted)]">Nama</p>
                  <p className="font-medium text-body-sm">{form.namaPasien.gelar ? `${form.namaPasien.gelar} ` : ''}{form.namaPasien.nama}</p>
                </div>
                <div>
                  <p className="text-tiny text-[var(--text-muted)]">No RM</p>
                  <p className="font-mono text-body-sm">{form.namaPasien.noRm}</p>
                </div>
                <div>
                  <p className="text-tiny text-[var(--text-muted)]">NIK</p>
                  <p className="text-body-sm">{form.namaPasien.nik || '-'}</p>
                </div>
                <div>
                  <p className="text-tiny text-[var(--text-muted)]">Tgl Lahir</p>
                  <p className="text-body-sm">{form.namaPasien.tanggalLahir || '-'}{form.namaPasien.tanggalLahir ? ` (${hitungUmur(form.namaPasien.tanggalLahir)} th)` : ''}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-tiny text-[var(--text-muted)]">Alamat</p>
                  <p className="text-body-sm truncate">{form.namaPasien.alamat || '-'}</p>
                </div>
              </div>
            )}
          </fieldset>

          {/* === KUNJUNGAN MEDIS === */}
          <fieldset className="space-y-3">
            <legend className="text-body-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Kunjungan Medis</legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Poliklinik Tujuan <span className="text-[var(--status-danger)] ml-0.5">*</span></label>
                <select value={form.poliId} onChange={(e) => setField('poliId', e.target.value)} className={`input ${errors.poliId ? 'input-error' : ''}`}>
                  <option value="">-- Pilih Poli --</option>
                  {poliList.map((p) => (
                    <option key={p.id} value={String(p.id)}>{p.kode} - {p.nama}</option>
                  ))}
                </select>
                {errors.poliId && <p className="text-tiny text-red-500 mt-0.5">{errors.poliId}</p>}
              </div>
              <div>
                <label className="label">Ruangan</label>
                <select value={form.ruanganId} onChange={(e) => setField('ruanganId', e.target.value)} className="input" disabled={!form.poliId}>
                  <option value="">-- Pilih Ruangan --</option>
                  {ruanganList.map((r) => (
                    <option key={r.id} value={String(r.id)}>{r.kode} - {r.namaRuangan}{r.kelas ? ` (${r.kelas})` : ''}</option>
                  ))}
                </select>
                <p className="text-tiny text-[var(--text-muted)] mt-1">Ruangan mengikuti poli yang dipilih.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Dokter <span className="text-[var(--status-danger)] ml-0.5">*</span></label>
                <select value={form.dokterId} onChange={(e) => setField('dokterId', e.target.value)} className={`input ${errors.dokterId ? 'input-error' : ''}`}>
                  <option value="">-- Pilih Dokter --</option>
                  {dokterList.map((d) => (
                    <option key={d.id} value={String(d.id)}>{d.nama}{d.spesialisasi ? ` (${d.spesialisasi})` : ''}</option>
                  ))}
                </select>
                {errors.dokterId && <p className="text-tiny text-red-500 mt-0.5">{errors.dokterId}</p>}
              </div>
              <div>
                <label className="label">Perawat</label>
                <select value={form.perawatId} onChange={(e) => setField('perawatId', e.target.value)} className="input">
                  <option value="">-- Pilih Perawat --</option>
                  {perawatList.map((p) => (
                    <option key={p.id} value={String(p.id)}>{p.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.gunakanDokterPengganti}
                onChange={(e) => setField('gunakanDokterPengganti', e.target.checked)}
                className="rounded border-[var(--border-primary)]"
              />
              <span className="text-body-sm">Gunakan Dokter Pengganti</span>
            </label>

            {form.gunakanDokterPengganti && (
              <div>
                <label className="label">Dokter Pengganti</label>
                <select value={form.dokterPenggantiId} onChange={(e) => setField('dokterPenggantiId', e.target.value)} className="input">
                  <option value="">-- Pilih Dokter Pengganti --</option>
                  {dokterList
                    .filter((d) => String(d.id) !== String(form.dokterId))
                    .map((d) => (
                      <option key={d.id} value={String(d.id)}>{d.nama}{d.spesialisasi ? ` (${d.spesialisasi})` : ''}</option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Nama Perujuk <span className="text-[var(--text-muted)] font-normal">(opsional)</span></label>
              <input type="text" value={form.namaPerujuk} onChange={(e) => setField('namaPerujuk', e.target.value)} className="input" placeholder="Nama dokter/fasilitas perujuk" />
            </div>
          </fieldset>

          {/* === PENANGGUNG JAWAB & ASURANSI === */}
          <fieldset className="space-y-3">
            <legend className="text-body-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Penanggung Jawab & Asuransi</legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Penanggung Jawab</label>
                <input
                  type="text"
                  value={form.penanggungJawab}
                  onChange={(e) => setField('penanggungJawab', e.target.value)}
                  className={`input ${errors.penanggungJawab ? 'input-error' : ''}`}
                  placeholder="Nama penanggung jawab"
                />
                {errors.penanggungJawab && <p className="text-tiny text-red-500 mt-0.5">{errors.penanggungJawab}</p>}
              </div>
              <div>
                <label className="label">Hubungan dengan Pasien</label>
                <select value={form.hubunganPasien} onChange={(e) => setField('hubunganPasien', e.target.value)} className="input">
                  <option value="">-- Pilih --</option>
                  <option value="Diri Sendiri">Diri Sendiri</option>
                  <option value="Suami">Suami</option>
                  <option value="Istri">Istri</option>
                  <option value="Anak">Anak</option>
                  <option value="Ayah">Ayah</option>
                  <option value="Ibu">Ibu</option>
                  <option value="Wali">Wali</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Penjamin / Asuransi</label>
                <select value={form.asuransiId} onChange={(e) => setField('asuransiId', e.target.value)} className="input">
                  <option value="">-- Pilih Penjamin --</option>
                  {asuransiList.map((a) => (
                    <option key={a.id} value={String(a.id)}>{a.namaPerusahaan}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Nomor Asuransi</label>
                <input
                  type="text"
                  value={form.noAsuransi}
                  onChange={(e) => setField('noAsuransi', e.target.value)}
                  className="input"
                  placeholder="Nomor kartu / polis"
                />
              </div>
            </div>
          </fieldset>

          {/* === SKRINING VISUAL TRIASE === */}
          <fieldset className="space-y-3">
            <legend className="text-body-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Skrining Visual Triase</legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <SkriningCheckbox label="Kondisi Stabil" field="kondisiStabil" form={form} setSkrining={setSkrining} />
              <SkriningCheckbox label="Nyeri Hebat" field="nyeriHebat" form={form} setSkrining={setSkrining} />
              <SkriningCheckbox label="Nyeri Dada" field="nyeriDada" form={form} setSkrining={setSkrining} danger />
              <SkriningCheckbox label="Tampak Pucat" field="tampakPucat" form={form} setSkrining={setSkrining} />
              <SkriningCheckbox label="Sempoyongan" field="sempoyongan" form={form} setSkrining={setSkrining} />
              <SkriningCheckbox label="Lemas" field="lemas" form={form} setSkrining={setSkrining} />
              <SkriningCheckbox label="Tidak Sadarkan Diri / Pingsan" field="tidakSadarkanDiri" form={form} setSkrining={setSkrining} danger />
              <SkriningCheckbox label="Nadi Tidak Teraba / Jantung Berhenti" field="nadiTidakTeraba" form={form} setSkrining={setSkrining} danger />
              <SkriningCheckbox label="Gangguan Pernapasan" field="gangguanPernapasan" form={form} setSkrining={setSkrining} danger />
              <SkriningCheckbox label="Perdarahan" field="perdarahan" form={form} setSkrining={setSkrining} danger />
              <SkriningCheckbox label="Lainnya" field="lainnya" form={form} setSkrining={setSkrining} />
            </div>

            <div>
              <label className="label">Keterangan Tambahan</label>
              <textarea
                rows={2}
                value={form.keteranganSkrining}
                onChange={(e) => setField('keteranganSkrining', e.target.value)}
                className="input"
                placeholder="Catatan triase tambahan…"
              />
            </div>

            <p className="text-tiny text-[var(--text-muted)]">
              Jika ditemukan tanda bahaya (Nyeri Dada, Tidak Sadarkan Diri, Nadi Tidak Teraba, Gangguan Pernapasan, Perdarahan hebat), status prioritas akan otomatis diubah ke <strong>Emergency</strong> (tetap bisa diubah manual).
            </p>
          </fieldset>
          </div>

          {/* STICKY ACTION FOOTER */}
          <div className="sticky bottom-0 z-10 -mx-5 px-5 py-3 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] flex justify-end gap-2">
            <button type="button" onClick={() => { handleReset(false); setCreateModalOpen(false) }} disabled={submitting} className="btn btn-ghost">Batal</button>
            <button type="submit" disabled={submitting} className="btn btn-primary btn-lg disabled:opacity-50">
              {submitting ? 'Menyimpan…' : 'Daftarkan Kunjungan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function SkriningCheckbox({ label, field, form, setSkrining, danger }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-[var(--bg-primary)] transition-colors">
      <input
        type="checkbox"
        checked={Boolean(form.skrining[field])}
        onChange={(e) => setSkrining(field, e.target.checked)}
        className="rounded border-[var(--border-secondary)] accent-[var(--status-danger)]"
      />
      <span className={`text-body-sm ${danger ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
        {label}
        {danger && <Badge tone="danger" className="ml-2 text-[10px]">Bahaya</Badge>}
      </span>
    </label>
  )
}