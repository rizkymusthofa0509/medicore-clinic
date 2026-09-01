// ============================================================
// features/front-office/pages/DatabasePasienPage.jsx
// Database Pasien: list + detail pasien (section atas info pasien,
// section bawah tab-tab informasi). Data per branch_id.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Badge, Btn, Modal, toast, EmptyState, PageHeader } from '../../../shared/components/ui.jsx'
import { TabelMaster } from '../../../shared/components/TabelMaster.jsx'
import PasienSearchRemote from '../../../shared/components/PasienSearchRemote.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import { fetchPasien, showPasien } from '../service/pasienService.js'
import { fetchKunjungan } from '../service/kunjunganService.js'
import { fetchRiwayatPemeriksaan } from '../service/pemeriksaanDokterService.js'

// ==================== KONSTANTA ====================

const STATUS_LABEL = { terdaftar: 'Terdaftar', menunggu: 'Menunggu', diperiksa: 'Diperiksa', selesai: 'Selesai', batal: 'Batal' }
const STATUS_TONE = { terdaftar: 'info', menunggu: 'warning', diperiksa: 'success', selesai: 'success', batal: 'danger' }
const TIPE_LABEL = { rawat_jalan: 'Rawat Jalan', rawat_inap: 'Rawat Inap' }

const TABS = [
  { key: 'cppt', label: 'CPPT', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
  { key: 'biodata', label: 'Biodata Pasien', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { key: 'riwayat', label: 'Riwayat Kunjungan', icon: 'M3 3v5h5 M3.05 13A9 9 0 1 0 6 5.3L3 8 M12 7v5l4 2' },
  { key: 'surat', label: 'Surat', icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6' },
  { key: 'resume', label: 'Resume Medis', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 M9 12h.01 M13 12h2 M9 16h.01 M13 16h2' },
  { key: 'lab', label: 'Hasil Lab', icon: 'M10 2v6L4 18a2 2 0 0 0 1.73 3h12.54A2 2 0 0 0 20 18L14 8V2 M8.5 2h7 M7 15h10' },
  { key: 'cppt-inap', label: 'CPPT Rawat Inap', icon: 'M2 4v16 M2 8h18a2 2 0 0 1 2 2v10 M2 17h20 M6 8v9' },
  { key: 'skrining', label: 'Skrining ILP', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4' },
  { key: 'consent', label: 'Informed Consent', icon: 'M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' },
]

// ==================== HELPER ====================

function fmtTanggal(val, opts) {
  if (!val) return '-'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return String(val)
  return d.toLocaleDateString('id-ID', opts || { day: 'numeric', month: 'long', year: 'numeric' })
}

function hitungUsia(tglLahir) {
  if (!tglLahir) return '-'
  const birth = new Date(tglLahir)
  if (Number.isNaN(birth.getTime())) return '-'
  const now = new Date()
  let th = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) th--
  if (th < 1) {
    const bln = Math.max(0, (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth())
    return `${bln} bln`
  }
  return `${th} thn`
}

function rowsOf(section) {
  if (Array.isArray(section)) return section
  if (section && Array.isArray(section.rows)) return section.rows
  return []
}

function labelSkrining(val) {
  return String(val).split('_').join(' ').toUpperCase()
}

function InfoField({ label, value, mono = false, className = '' }) {
  return (
    <div className={className}>
      <p className="text-tiny font-semibold text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
      <p className={`mt-0.5 text-body-sm text-[var(--text-primary)] break-words ${mono ? 'font-mono' : ''}`}>{value || '-'}</p>
    </div>
  )
}

function PdfIcon({ className = 'w-10 h-10' }) {
  return (
    <svg className={`${className} text-[var(--status-danger)]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  )
}

function TabButton({ tab, active, onClick, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-body-sm font-medium transition-colors ${
        active
          ? 'border-[var(--brand-primary)] bg-[var(--brand-light)]/40 text-[var(--brand-primary)]'
          : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
      }`}
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d={tab.icon} />
      </svg>
      <span>{tab.label}</span>
      {count != null && count > 0 && (
        <span className="badge badge-primary font-mono">{count}</span>
      )}
    </button>
  )
}

// ==================== HALAMAN ====================

export default function DatabasePasienPage() {
  const branchId = getCurrentBranchId()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const pasienId = searchParams.get('pasien')
  const activeTab = searchParams.get('tab') || 'cppt'

  // List pasien
  const [patientList, setPatientList] = useState([])
  const [listLoading, setListLoading] = useState(true)

  // Detail pasien
  const [pasien, setPasien] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [kunjunganList, setKunjunganList] = useState([])
  const [cpptList, setCpptList] = useState([])
  const [dataLoading, setDataLoading] = useState(false)

  // CPPT detail modal
  const [selectedPemeriksaan, setSelectedPemeriksaan] = useState(null)

  // Foto pasien (draft localStorage sampai backend foto siap)
  const [foto, setFoto] = useState('')
  const [camOpen, setCamOpen] = useState(false)
  const [camError, setCamError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    if (!branchId) { setListLoading(false); return }
    setListLoading(true)
    fetchPasien(branchId)
      .then((data) => setPatientList(data))
      .catch((err) => { console.error('[DatabasePasien] gagal memuat daftar pasien:', err); toast('Gagal memuat daftar pasien', 'error') })
      .finally(() => setListLoading(false))
  }, [branchId])

  // Restore pasien dari URL
  useEffect(() => {
    if (!pasienId) { setPasien(null); setFoto(''); return }
    let cancelled = false
    setDetailLoading(true)
    showPasien(pasienId)
      .then((p) => {
        if (cancelled) return
        setPasien(p)
        try { setFoto(localStorage.getItem(`medicore_foto_pasien_${p.id}`) || '') } catch { setFoto('') }
      })
      .catch(() => {
        if (cancelled) return
        toast('Pasien tidak ditemukan atau tidak diizinkan.', 'error')
        setSearchParams({})
      })
      .finally(() => { if (!cancelled) setDetailLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasienId, branchId])

  // Load kunjungan + riwayat pemeriksaan (CPPT) untuk pasien terpilih
  useEffect(() => {
    if (!pasien || !branchId) { setKunjunganList([]); setCpptList([]); return }
    let cancelled = false
    setDataLoading(true)
    Promise.all([
      fetchKunjungan(branchId, { pasien_id: pasien.id, limit: 200 }),
      fetchRiwayatPemeriksaan(branchId, { pasien_id: pasien.id, limit: 200 }),
    ])
      .then(([kunj, pd]) => {
        if (cancelled) return
        setKunjunganList(kunj)
        setCpptList(pd)
      })
      .catch((err) => { console.error('[DatabasePasien] gagal memuat data pasien:', err) })
      .finally(() => { if (!cancelled) setDataLoading(false) })
    return () => { cancelled = true }
  }, [pasien, branchId])

  const openDetail = (id) => {
    setSearchParams({ pasien: String(id) })
  }

  const setTab = (key) => {
    setSearchParams({ pasien: String(pasien?.id), tab: key })
  }

  const tutupDetail = () => setSearchParams({})

  const gabungRm = () => toast('Fitur Gabung Rekam Medis akan segera tersedia.', 'info')

  const cetakLabel = () => {
    if (!pasien) return
    const w = window.open('', '_blank', 'width=520,height=400')
    if (!w) { toast('Pop-up diblokir browser. Izinkan pop-up untuk mencetak label.', 'warning'); return }
    const jk = pasien.jenisKelamin === 'L' ? 'LAKI-LAKI' : pasien.jenisKelamin === 'P' ? 'PEREMPUAN' : '-'
    w.document.write(`<!doctype html><html><head><title>Label Pasien</title>
      <style>
        body { font-family: 'Courier New', monospace; margin: 24px; }
        .label { border: 2px dashed #000; padding: 20px; width: 360px; }
        .klinik { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; text-align: center; margin-bottom: 12px; }
        .rm { font-size: 26px; font-weight: bold; text-align: center; letter-spacing: 3px; margin-bottom: 4px; }
        .rm-code { text-align: center; font-size: 12px; letter-spacing: 1px; margin-bottom: 12px; }
        .bar { border-top: 1px solid #000; padding-top: 10px; font-size: 13px; line-height: 1.7; }
      </style></head><body>
      <div class="label">
        <div class="klinik">Medicore Clinic</div>
        <div class="rm">${pasien.noRm || '-'}</div>
        <div class="rm-code">║║║││║│║║│║││║║║ ${pasien.noRm || '-'} ║║│║║║│║││║│║║║</div>
        <div class="bar">
          <div><b>Nama</b> : ${pasien.gelar ? pasien.gelar + ' ' : ''}${pasien.nama || '-'}</div>
          <div><b>Lahir</b> : ${fmtTanggal(pasien.tanggalLahir)} (${hitungUsia(pasien.tanggalLahir)})</div>
          <div><b>JK</b> : ${jk} &nbsp;|&nbsp; <b>Darah</b> : ${pasien.golonganDarah || '-'}</div>
          <div><b>Alamat</b> : ${pasien.alamat || '-'}</div>
        </div>
      </div>
      <script>window.onload = function(){ window.print(); }</script>
    </body></html>`)
    w.document.close()
    w.focus()
  }

  const simpanFoto = (dataUrl) => {
    if (!pasien || !dataUrl) return
    try { localStorage.setItem(`medicore_foto_pasien_${pasien.id}`, dataUrl) } catch { /* storage penuh — abaikan */ }
    setFoto(dataUrl)
    toast('Foto pasien disimpan.', 'success')
  }

  const onUploadFoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => simpanFoto(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const bukaKamera = () => {
    setCamOpen(true)
    setCamError('')
  }

  useEffect(() => {
    if (!camOpen) return
    let cancelled = false
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}) }
      })
      .catch(() => { if (!cancelled) setCamError('Kamera tidak dapat diakses. Pastikan izin kamera diizinkan.') })
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [camOpen])

  const jepretFoto = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) { setCamError('Kamera belum siap.'); return }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    simpanFoto(canvas.toDataURL('image/jpeg', 0.85))
    setCamOpen(false)
  }

  const tutupKamera = () => {
    setCamOpen(false)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  // ==================== LIST VIEW ====================
  if (!pasienId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Database Pasien"
          desc="Cari pasien untuk melihat rekam medis lengkap"
          actions={<span className="text-caption text-[var(--text-muted)]">{patientList.length} pasien terdaftar</span>}
        />

        <Card className="p-4">
          <PasienSearchRemote
            branchId={branchId}
            value={null}
            onSelect={(p) => openDetail(p.id)}
            onClear={() => {}}
            label="Cari Pasien"
            placeholder="Ketik nama / No RM / NIK lalu pilih pasien…"
          />
        </Card>

        <TabelMaster
          loading={listLoading}
          data={patientList}
          searchKey={['nama', 'noRm', 'nik', 'noHp', 'alamat']}
          searchPlaceholder="Cari nama / No RM / NIK / telp / alamat…"
          emptyMessage="Belum ada pasien terdaftar di branch ini"
          onRowClick={(row) => openDetail(row.id)}
          columns={[
            { key: 'noRm', label: 'No. RM', width: '110px', render: (v) => <span className="font-mono text-tiny font-semibold text-[var(--brand-primary)]">{v}</span> },
            { key: 'nama', label: 'Nama Pasien', render: (_, row) => (
              <div>
                <div className="font-medium text-[var(--text-primary)]">{row.gelar ? `${row.gelar} ` : ''}{row.nama}</div>
                <div className="text-tiny text-[var(--text-muted)]">NIK {row.nik || '-'}</div>
              </div>
            ) },
            { key: 'jenisKelamin', label: 'JK', width: '60px', render: (v) => (v === 'L' ? 'L' : v === 'P' ? 'P' : '-') },
            { key: 'tanggalLahir', label: 'Tgl. Lahir', width: '130px', render: (_, row) => (
              <div>
                <div>{fmtTanggal(row.tanggalLahir, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                <div className="text-tiny text-[var(--text-muted)]">{hitungUsia(row.tanggalLahir)}</div>
              </div>
            ) },
            { key: 'noHp', label: 'No. HP', width: '140px', render: (v) => <span className="font-mono text-tiny">{v || '-'}</span> },
            { key: 'alamat', label: 'Alamat', render: (v) => <span className="text-tiny text-[var(--text-secondary)] line-clamp-2">{v || '-'}</span> },
          ]}
        />
      </div>
    )
  }

  // ==================== DETAIL VIEW ====================
  if (detailLoading) {
    return <div className="p-6 text-[var(--text-muted)]">Memuat data pasien…</div>
  }
  if (!pasien) return null

  const jkLabel = pasien.jenisKelamin === 'L' ? 'LAKI-LAKI' : pasien.jenisKelamin === 'P' ? 'PEREMPUAN' : '-'
  const alamatLengkap = [pasien.alamat, pasien.rt ? `RT ${pasien.rt}` : '', pasien.rw ? `RW ${pasien.rw}` : '', pasien.namaDesa].filter(Boolean).join(', ')
  const cpptRawatInap = cpptList.filter((pd) => pd.kunjungan?.tipeKunjungan === 'rawat_inap')
  const resumeList = cpptList.filter((pd) => pd.status === 'final')
  const kunjunganDgnSkrining = kunjunganList.filter((k) => {
    const s = k.skriningVisual
    const ada = Array.isArray(s) ? s.length > 0 : s && typeof s === 'object' ? Object.values(s).some(Boolean) : Boolean(k.keteranganSkrining)
    return ada
  })

  const renderCpptItems = (list) => (
    <div className="space-y-2">
      {list.map((pd) => (
        <button
          key={pd.id}
          type="button"
          onClick={() => setSelectedPemeriksaan(pd)}
          className="w-full flex items-center gap-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3 text-left transition-colors hover:bg-[var(--bg-hover)] hover:border-[var(--brand-primary)]/40"
        >
          <PdfIcon />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-body-sm text-[var(--text-primary)] truncate">
              CPPT {fmtTanggal(pd.kunjungan?.tglJamKunjungan)} - {TIPE_LABEL[pd.kunjungan?.tipeKunjungan]?.toUpperCase() || '-'}
            </p>
            <p className="text-tiny text-[var(--text-muted)] truncate">
              {pd.kunjungan?.noPendaftaran || '-'} • Dr. {pd.dokter?.nama || '-'} • {pd.poli?.nama || '-'}
            </p>
          </div>
          <Badge tone={pd.status === 'final' ? 'success' : 'warning'} mono>{pd.status === 'final' ? 'FINAL' : 'DRAFT'}</Badge>
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* ============ SECTION ATAS: INFORMASI PASIEN ============ */}
      <Card className="overflow-hidden">
        {/* Bar nama + aksi */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-5 py-3">
          <div className="text-body-sm flex flex-wrap items-center gap-x-2">
            <span className="font-semibold text-[var(--text-secondary)]">NAMA PASIEN :</span>
            <span className="font-bold text-[var(--text-primary)]">{pasien.gelar ? `${pasien.gelar} ` : ''}{pasien.nama}</span>
            <span className="text-[var(--border-strong)]">|</span>
            <span className="font-semibold text-[var(--text-secondary)]">NOMOR RM :</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">{pasien.noRm}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Btn variant="primary" size="sm" onClick={gabungRm}>Gabung Rekam Medis</Btn>
            <Btn variant="danger" size="sm" onClick={cetakLabel}>Cetak Label</Btn>
            <Btn variant="danger" size="sm" onClick={tutupDetail}>Tutup</Btn>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_1fr] gap-6 p-5">
          {/* Kolom foto */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-40 h-40 rounded-2xl overflow-hidden border-2 border-[var(--border-primary)] bg-[var(--bg-tertiary)] flex items-center justify-center">
              {foto ? (
                <img src={foto} alt={`Foto ${pasien.nama}`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-bold text-[var(--brand-primary)]/40">
                  {(pasien.nama || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full max-w-[180px]">
              <Btn variant="primary" size="sm" onClick={bukaKamera}>Ambil Foto</Btn>
              <Btn variant="secondary" size="sm" onClick={() => document.getElementById('upload-foto-pasien')?.click()}>Upload Foto</Btn>
              <input id="upload-foto-pasien" type="file" accept="image/*" className="hidden" onChange={onUploadFoto} />
            </div>
          </div>

          {/* Kolom data diri */}
          <div>
            <p className="text-tiny font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Data Diri</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <InfoField label="Nama" value={pasien.nama} className="sm:col-span-2" />
              <InfoField label="No. RM" value={pasien.noRm} mono />
              <InfoField label="No. KTP" value={pasien.nik || '-'} mono />
              <InfoField label="Tgl. Lahir & Usia" value={`${fmtTanggal(pasien.tanggalLahir)} | ${hitungUsia(pasien.tanggalLahir)}`} className="sm:col-span-2" />
              <InfoField label="Jenis Kelamin" value={jkLabel} />
              <InfoField label="Golongan Darah" value={pasien.golonganDarah || '-'} />
            </div>
          </div>

          {/* Kolom data sosial & kontak */}
          <div>
            <p className="text-tiny font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Data Sosial & Kontak</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
              <InfoField label="Pendidikan" value={pasien.pendidikan} />
              <InfoField label="Pekerjaan" value={pasien.pekerjaan} />
              <InfoField label="Status Nikah" value={pasien.statusNikah || '-'} />
              <InfoField label="Agama" value={pasien.agama} />
              <InfoField label="Telp" value={pasien.noHp} mono className="sm:col-span-2" />
              <InfoField label="Alamat" value={alamatLengkap || '-'} className="sm:col-span-2" />
            </div>
          </div>
        </div>
      </Card>

      {/* ============ SECTION BAWAH: TAB INFORMASI ============ */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto border-b border-[var(--border-primary)]">
          <div className="flex min-w-max px-2">
            {TABS.map((t) => (
              <TabButton
                key={t.key}
                tab={t}
                active={activeTab === t.key}
                count={t.key === 'cppt' ? cpptList.length : null}
                onClick={() => setTab(t.key)}
              />
            ))}
          </div>
        </div>

        <div className="p-5">
          {/* --- Tab CPPT --- */}
          {activeTab === 'cppt' && (
            dataLoading ? (
              <p className="py-8 text-center text-body-sm text-[var(--text-muted)]">Memuat dokumen CPPT…</p>
            ) : cpptList.length === 0 ? (
              <EmptyState title="Belum ada CPPT" desc="Belum ada catatan perkembangan pasien terintegrasi (CPPT) untuk pasien ini." />
            ) : renderCpptItems(cpptList)
          )}

          {/* --- Tab Biodata Pasien --- */}
          {activeTab === 'biodata' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              <InfoField label="No. RM Lama" value={pasien.noRmLama} mono />
              <InfoField label="Jenis Identitas" value={pasien.jenisIdentitas} />
              <InfoField label="SATUSEHAT ID" value={pasien.satusehatId} mono />
              <InfoField label="Tempat Lahir" value={pasien.tempatLahir} />
              <InfoField label="Tanggal Lahir" value={fmtTanggal(pasien.tanggalLahir)} />
              <InfoField label="Usia" value={hitungUsia(pasien.tanggalLahir)} />
              <InfoField label="Golongan Darah" value={pasien.golonganDarah} />
              <InfoField label="Agama" value={pasien.agama} />
              <InfoField label="Pendidikan" value={pasien.pendidikan} />
              <InfoField label="Pekerjaan" value={pasien.pekerjaan} />
              <InfoField label="No. HP" value={pasien.noHp} mono />
              <InfoField label="Unit Lokasi" value={pasien.unitLokasi?.namaUnit || '-'} />
              <InfoField label="Alamat Tinggal" value={alamatLengkap || '-'} className="sm:col-span-2" />
              {pasien.alamatKtpBerbeda && (
                <>
                  <InfoField label="Alamat KTP" value={[pasien.alamatKtp, pasien.rtKtp ? `RT ${pasien.rtKtp}` : '', pasien.rwKtp ? `RW ${pasien.rwKtp}` : '', pasien.desaKtp].filter(Boolean).join(', ') || '-'} className="sm:col-span-2" />
                </>
              )}
              <InfoField label="Terdaftar Sejak" value={fmtTanggal(pasien.created_at, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
              <InfoField label="Branch" value={pasien.branch?.name || '-'} />
            </div>
          )}

          {/* --- Tab Riwayat Kunjungan --- */}
          {activeTab === 'riwayat' && (
            <TabelMaster
              loading={dataLoading}
              data={kunjunganList}
              searchKey={['noPendaftaran', 'status', 'tipeKunjungan', 'tglJamKunjungan']}
              searchPlaceholder="Cari no. pendaftaran / status…"
              emptyMessage="Belum ada riwayat kunjungan untuk pasien ini"
              columns={[
                { key: 'noPendaftaran', label: 'No. Pendaftaran', width: '180px', render: (v) => <span className="font-mono text-tiny font-semibold text-[var(--brand-primary)]">{v}</span> },
                { key: 'tglJamKunjungan', label: 'Tanggal', width: '170px', render: (v) => (
                  <div>
                    <div>{fmtTanggal(v)}</div>
                    <div className="text-tiny text-[var(--text-muted)]">{fmtTanggal(v, { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ) },
                { key: 'poliNama', label: 'Poli', render: (_, row) => row.poli?.nama || '-' },
                { key: 'dokterNama', label: 'Dokter', render: (_, row) => row.dokter?.nama || row.dokterPengganti?.nama || '-' },
                { key: 'tipeKunjungan', label: 'Tipe', width: '120px', render: (v) => TIPE_LABEL[v] || v },
                { key: 'status', label: 'Status', width: '110px', render: (v) => <Badge tone={STATUS_TONE[v] || 'neutral'}>{STATUS_LABEL[v] || v}</Badge> },
                { key: 'aksi', label: 'Aksi', width: '90px', render: (_, row) => (
                  <Btn
                    size="sm" variant="outline"
                    onClick={() => navigate(`/pemeriksaan-dokter?poli=${row.poli?.id ?? ''}&pasien=${row.encodedId || row.id}`)}
                  >
                    Buka
                  </Btn>
                ) },
              ]}
            />
          )}

          {/* --- Tab Surat --- */}
          {activeTab === 'surat' && (
            <EmptyState title="Belum ada surat" desc="Modul surat (keterangan sakit, rujukan, kontrol, dll) akan tersedia di sini." />
          )}

          {/* --- Tab Resume Medis --- */}
          {activeTab === 'resume' && (
            dataLoading ? (
              <p className="py-8 text-center text-body-sm text-[var(--text-muted)]">Memuat resume medis…</p>
            ) : resumeList.length === 0 ? (
              <EmptyState title="Belum ada resume medis" desc="Resume medis tersedia setelah pemeriksaan dokter diselesaikan (final)." />
            ) : (
              <div className="space-y-3">
                {resumeList.map((pd) => {
                  const diagnosa = rowsOf(pd.diagnosa)
                  const catatan = rowsOf(pd.catatan)
                  const terapi = catatan.map((c) => c.terapi).filter(Boolean)
                  const tindakLanjut = catatan.map((c) => c.tindakLanjut).filter(Boolean)
                  return (
                    <div key={pd.id} className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <p className="font-semibold text-body-sm text-[var(--text-primary)]">
                          Resume Medis — {fmtTanggal(pd.kunjungan?.tglJamKunjungan)}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-tiny text-[var(--text-muted)]">Dr. {pd.dokter?.nama || '-'}</span>
                          <Badge tone="success" mono>FINAL</Badge>
                        </div>
                      </div>
                      <div className="space-y-2 text-body-sm">
                        {diagnosa.length === 0 ? (
                          <p className="text-[var(--text-muted)]">Tidak ada diagnosa.</p>
                        ) : (
                          <ul className="space-y-1">
                            {diagnosa.map((d, i) => (
                              <li key={d.id || i} className="flex items-start gap-2">
                                <span className="font-mono text-tiny text-[var(--brand-primary)] mt-0.5">{d.kodeIcd || '-'}</span>
                                <span>{d.namaDiagnosa || '-'}{d.status ? <span className="text-tiny text-[var(--text-muted)]"> ({d.status})</span> : ''}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {terapi.length > 0 && <p><span className="font-semibold">Terapi:</span> {terapi.join('; ')}</p>}
                        {tindakLanjut.length > 0 && <p><span className="font-semibold">Tindak Lanjut:</span> {tindakLanjut.join('; ')}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* --- Tab Hasil Lab --- */}
          {activeTab === 'lab' && (
            <EmptyState title="Belum ada hasil lab" desc="Hasil pemeriksaan laboratorium akan tampil di sini." />
          )}

          {/* --- Tab CPPT Rawat Inap --- */}
          {activeTab === 'cppt-inap' && (
            dataLoading ? (
              <p className="py-8 text-center text-body-sm text-[var(--text-muted)]">Memuat dokumen CPPT rawat inap…</p>
            ) : cpptRawatInap.length === 0 ? (
              <EmptyState title="Belum ada CPPT rawat inap" desc="Belum ada catatan perkembangan rawat inap untuk pasien ini." />
            ) : renderCpptItems(cpptRawatInap)
          )}

          {/* --- Tab Skrining ILP --- */}
          {activeTab === 'skrining' && (
            dataLoading ? (
              <p className="py-8 text-center text-body-sm text-[var(--text-muted)]">Memuat data skrining…</p>
            ) : kunjunganDgnSkrining.length === 0 ? (
              <EmptyState title="Belum ada skrining ILP" desc="Belum ada hasil skrining Integrasi Layanan Primer untuk pasien ini." />
            ) : (
              <div className="space-y-3">
                {kunjunganDgnSkrining.map((k) => {
                  const s = k.skriningVisual
                  const items = Array.isArray(s)
                    ? s.filter(Boolean).map((v) => (typeof v === 'string' ? v : v.label || ''))
                    : s && typeof s === 'object'
                      ? Object.entries(s).filter(([, v]) => v).map(([key]) => labelSkrining(key))
                      : []
                  return (
                    <div key={k.id} className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
                      <p className="font-semibold text-body-sm text-[var(--text-primary)] mb-2">
                        Skrining {fmtTanggal(k.tglJamKunjungan)} — {k.noPendaftaran}
                      </p>
                      {items.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {items.map((it, i) => <Badge key={i} tone="warning">{it}</Badge>)}
                        </div>
                      )}
                      {k.keteranganSkrining && (
                        <p className="text-body-sm text-[var(--text-secondary)]"><span className="font-medium">Keterangan:</span> {k.keteranganSkrining}</p>
                      )}
                      {items.length === 0 && !k.keteranganSkrining && <p className="text-body-sm text-[var(--text-muted)]">Data skrining kosong.</p>}
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* --- Tab Informed Consent --- */}
          {activeTab === 'consent' && (
            <EmptyState title="Belum ada informed consent" desc="Dokumen persetujuan tindakan medis akan tampil di sini." />
          )}
        </div>
      </Card>

      {/* ============ MODAL DETAIL CPPT ============ */}
      <Modal open={Boolean(selectedPemeriksaan)} onClose={() => setSelectedPemeriksaan(null)} title="Detail CPPT" size="lg">
        {selectedPemeriksaan && (() => {
          const pd = selectedPemeriksaan
          const reg = pd.registrasi || {}
          const ttv = pd.ttv || {}
          const fisik = Array.isArray(pd.pemeriksaanFisik) ? pd.pemeriksaanFisik : []
          const fisikAbnormal = fisik.filter((r) => r.kondisi && r.kondisi !== 'normal')
          const diagnosa = rowsOf(pd.diagnosa)
          const obat = rowsOf(pd.pemberianObat)
          const tindakan = rowsOf(pd.pemberianTindakan)
          const catatan = rowsOf(pd.catatan)
          return (
            <div className="space-y-4 text-body-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info" mono>{pd.kunjungan?.noPendaftaran || '-'}</Badge>
                <Badge tone="neutral">{TIPE_LABEL[pd.kunjungan?.tipeKunjungan] || '-'}</Badge>
                <Badge tone={pd.status === 'final' ? 'success' : 'warning'} mono>{pd.status === 'final' ? 'FINAL' : 'DRAFT'}</Badge>
                <span className="text-tiny text-[var(--text-muted)]">Dr. {pd.dokter?.nama || '-'} • {pd.poli?.nama || '-'}</span>
              </div>

              <div>
                <p className="text-tiny font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Keluhan Utama</p>
                <p>{reg.keluhan_utama || ttv.keluhan_utama || '-'}</p>
              </div>

              <div>
                <p className="text-tiny font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Tanda-Tanda Vital</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[
                    ['Suhu', ttv.suhu != null ? `${ttv.suhu}°C` : '-'],
                    ['Tensi', ttv.sistole != null && ttv.diastole != null ? `${ttv.sistole}/${ttv.diastole}` : '-'],
                    ['Nadi', ttv.heart_rate ?? '-'],
                    ['RR', ttv.respiratory_rate ?? '-'],
                    ['SpO2', ttv.saturasi_oksigen != null ? `${ttv.saturasi_oksigen}%` : '-'],
                    ['TB', ttv.tinggi_badan != null ? `${ttv.tinggi_badan} cm` : '-'],
                    ['BB', ttv.berat_badan != null ? `${ttv.berat_badan} kg` : '-'],
                    ['IMT', ttv.imt ?? '-'],
                  ].map(([label, val]) => (
                    <div key={label} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2">
                      <p className="text-tiny text-[var(--text-muted)]">{label}</p>
                      <p className="font-mono font-medium">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-tiny font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Pemeriksaan Fisik</p>
                {fisikAbnormal.length === 0 ? (
                  <p className="text-[var(--text-secondary)]">Dalam batas normal.</p>
                ) : (
                  <ul className="space-y-1">
                    {fisikAbnormal.map((r, i) => (
                      <li key={r.key || i} className="flex gap-2">
                        <span className="font-medium">{r.label || '-'}:</span>
                        <span>{r.kondisi || '-'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="text-tiny font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Diagnosa</p>
                {diagnosa.length === 0 ? <p className="text-[var(--text-muted)]">-</p> : (
                  <ul className="space-y-1">
                    {diagnosa.map((d, i) => (
                      <li key={d.id || i} className="flex items-start gap-2">
                        <span className="font-mono text-tiny text-[var(--brand-primary)] mt-0.5">{d.kodeIcd || '-'}</span>
                        <span>{d.namaDiagnosa || '-'}{d.status ? <span className="text-tiny text-[var(--text-muted)]"> ({d.status})</span> : ''}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {obat.length > 0 && (
                <div>
                  <p className="text-tiny font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Pemberian Obat</p>
                  <ul className="space-y-1">
                    {obat.map((o, i) => (
                      <li key={o.id || i}>
                        • {o.namaObat || '-'} — {o.jumlah ?? '-'} × {o.dosis || '-'}{o.waktu ? ` (${fmtTanggal(o.waktu, { hour: '2-digit', minute: '2-digit' })})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tindakan.length > 0 && (
                <div>
                  <p className="text-tiny font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Pemberian Tindakan</p>
                  <ul className="space-y-1">
                    {tindakan.map((t, i) => (
                      <li key={t.id || i}>• {t.namaTindakan || '-'} — {t.jumlah ?? '-'} ×{t.biaya ? ` (${Number(t.biaya).toLocaleString('id-ID')})` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}

              {catatan.length > 0 && (
                <div>
                  <p className="text-tiny font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Rencana / Catatan</p>
                  <ul className="space-y-1">
                    {catatan.map((c, i) => (
                      <li key={c.id || i}>
                        {c.diagnosa && <span><b>Diagnosa:</b> {c.diagnosa}; </span>}
                        {c.terapi && <span><b>Terapi:</b> {c.terapi}; </span>}
                        {c.tindakLanjut && <span><b>Tindak lanjut:</b> {c.tindakLanjut}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>

      {/* ============ MODAL KAMERA ============ */}
      <Modal open={camOpen} onClose={tutupKamera} title="Ambil Foto Pasien" size="md">
        <div className="space-y-4">
          {camError ? (
            <p className="text-body-sm text-[var(--status-danger)]">{camError}</p>
          ) : (
            <video ref={videoRef} className="w-full rounded-xl bg-black aspect-[4/3] object-cover" muted playsInline />
          )}
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={tutupKamera}>Batal</Btn>
            <Btn variant="primary" onClick={jepretFoto} disabled={Boolean(camError)}>Jepret & Simpan</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
