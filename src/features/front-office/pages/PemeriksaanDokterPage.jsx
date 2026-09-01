import { useEffect, useState, useMemo, useRef } from 'react'

import { Card, Badge, Btn, Modal, toast } from '../../../shared/components/ui.jsx'
import { TabelMaster } from '../../../shared/components/TabelMaster.jsx'
import MasterSearch from '../../../shared/components/MasterSearch.jsx'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { fetchPoli } from '../../master/service/poliService.js'
import { fetchKunjungan, showKunjungan } from '../service/kunjunganService.js'
import { fetchPemeriksaanDokter, savePemeriksaanDokter } from '../service/pemeriksaanDokterService.js'
import { searchObat } from '../../master/service/obatAlkesService.js'
import { searchTindakan } from '../../master/service/tindakanService.js'
import { searchAturanPakai } from '../../master/service/aturanPakaiService.js'
import { searchNakes } from '../../master/service/nakesService.js'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import gambarAnatomi from '../../../assets/pemeriksaan/pemeriksaan.jpeg'

const STATUS_BADGE = {
  terdaftar: 'info',
  menunggu: 'warning',
  diperiksa: 'success',
  selesai: 'success',
  batal: 'danger',
}

const PRIORITY_BADGE = {
  emergency: 'danger',
  urgent: 'warning',
  normal: 'success',
}

// ============================================================
// Daftar area pemeriksaan fisik (default kondisi: Normal semua)
// ============================================================
const PHYSICAL_AREAS = [
  'Kepala', 'Wajah', 'Mata', 'Telinga', 'Hidung', 'Mulut dan Bibir',
  'Gigi Geligi', 'Lidah', 'Langit - Langit', 'Leher', 'Tenggorokan', 'Tonsil',
  'Dada', 'Payudara', 'Punggung', 'Perut', 'Genitalia', 'Anus / Dubur',
  'Lengan Atas', 'Lengan Bawah', 'Jari Tangan', 'Kuku Tangan', 'Persendian Tangan',
  'Tungkai Atas', 'Tungkai Bawah', 'Jari Kaki', 'Kuku Kaki', 'Persendian Kaki',
]

const KONDISI_LABEL = {
  normal: 'Normal',
  tidak_normal: 'Tidak Normal',
  tidak_diperiksa: 'Tidak Diperiksa',
}

const SKRINING_LABELS = {
  kondisiStabil: 'Kondisi Stabil',
  nyeriHebat: 'Nyeri Hebat',
  nyeriDada: 'Nyeri Dada',
  tampakPucat: 'Tampak Pucat',
  sempoyongan: 'Sempoyongan',
  lemas: 'Lemas',
  tidakSadarkanDiri: 'Tidak Sadarkan Diri / Pingsan',
  nadiTidakTeraba: 'Nadi Tidak Teraba / Jantung Berhenti',
  gangguanPernapasan: 'Gangguan Pernapasan',
  perdarahan: 'Perdarahan',
  lainnya: 'Lainnya',
}

const defaultFisik = () =>
  PHYSICAL_AREAS.map((label) => ({ key: label, label, kondisi: 'normal', keterangan: '' }))

const DIAGNOSA_STATUS_LABEL = {
  utama: 'Utama',
  sekunder: 'Sekunder',
  komplikasi: 'Komplikasi',
}

const newRowId = (prefix = 'r') => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`

function fmtRupiah(n) {
  const v = Number(n) || 0
  return 'Rp ' + v.toLocaleString('id-ID')
}

function nowLocalDatetime() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-tiny text-[var(--text-secondary)]">{label}:</span>
      <span className={
        'text-sm text-[var(--text-primary)] text-right truncate ' +
        (mono ? 'font-mono text-tiny' : '')
      }>{value || '-'}</span>
    </div>
  )
}

/** Accordion section — collapsible, optional dot indicator when filled */
function Section({ title, defaultOpen = false, dot = false, invalid = false, children, right }) {
  const [open, setOpen] = useState(defaultOpen)

  // Auto-buka section yang belum lengkap saat validasi gagal
  useEffect(() => {
    if (invalid) setOpen(true)
  }, [invalid])

  return (
    <Card className={`p-0 overflow-hidden ${invalid ? 'ring-1 ring-[var(--status-danger)]' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full transition-opacity ${invalid ? 'bg-[var(--status-danger)]' : dot ? 'bg-[var(--status-success)] opacity-60' : 'bg-transparent'}`} />
          {title}
          {invalid && <span className="text-tiny font-normal text-[var(--status-danger)]">(wajib diisi)</span>}
        </span>
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          {right}
          <svg className="w-4 h-4 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-[var(--border-primary)]">
          {children}
        </div>
      )}
    </Card>
  )
}

export default function PemeriksaanDokterPage({ tipeKunjungan = 'rawat_jalan' }) {
  const branchId = getCurrentBranchId()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [poliList, setPoliList] = useState([])
  const [kunjunganList, setKunjunganList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPoli, setSelectedPoli] = useState(null)
  const [selectedKunjungan, setSelectedKunjungan] = useState(null)

  // Form state (setiap section disimpan sebagai JSON di BE)
  const [exam, setExam] = useState({
    status: 'draft',
    registrasi: {
      keluhanUtama: '',
      jenisKunjungan: '',
      penanggungJawab: '',
      hubunganPj: '',
      namaPerujuk: '',
      asuransi: '',
      noAsuransi: '',
      metodePembayaran: '',
      statusPrioritas: '',
      skriningVisual: [],
      keteranganSkrining: '',
    },
    ttv: null,
    pemeriksaanFisik: defaultFisik(),
    anatomi: [],
    riwayatAlergi: [],
    riwayatObat: [],
    riwayatPenyakit: [],
    diagnosa: [],
    pemberianObat: [],
    pemberianObatRacik: [],
    pemberianTindakan: [],
    catatan: [],
  })
  const [pendingMarker, setPendingMarker] = useState(null) // { x, y } titik anatomi diklik
  const [markerLabel, setMarkerLabel] = useState('')
  const [markerDesc, setMarkerDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [invalidSections, setInvalidSections] = useState([])

  // Offset overlay aksi bottom mengikuti lebar sidebar (collapsed = 4rem)
  const [sidebarOffset, setSidebarOffset] = useState(() => {
    try { return localStorage.getItem('medicore_sidebar_collapsed') === 'true' ? 'lg:left-16' : 'lg:left-60' } catch { return 'lg:left-60' }
  })
  useEffect(() => {
    const onToggle = () => {
      try {
        setSidebarOffset(localStorage.getItem('medicore_sidebar_collapsed') === 'true' ? 'lg:left-16' : 'lg:left-60')
      } catch { setSidebarOffset('lg:left-60') }
    }
    window.addEventListener('sidebar:toggled', onToggle)
    return () => window.removeEventListener('sidebar:toggled', onToggle)
  }, [])

  // Riwayat kunjungan modal
  const [riwayatOpen, setRiwayatOpen] = useState(false)
  const [riwayatList, setRiwayatList] = useState([])
  const [riwayatLoading, setRiwayatLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailKunjungan, setDetailKunjungan] = useState(null)
  const [detailExam, setDetailExam] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Load poli + kunjungan
  useEffect(() => {
    if (!branchId) {
      setLoading(false)
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([
      fetchPoli(branchId),
      fetchKunjungan(branchId, {
        tipe: tipeKunjungan,
        date_from: today,
        date_to: today,
      }),
    ]).then(([poli, kunj]) => {
      setPoliList(poli)
      setKunjunganList(kunj)
    }).catch((err) => {
      console.error('[Dokter] load failed:', err)
    }).finally(() => setLoading(false))
  }, [branchId])

  // Group queue by poli — pasien selesai/batal dipindah ke bawah antrian
  const queueByPoli = useMemo(() => {
    const map = {}
    kunjunganList.forEach((k) => {
      const poli = k.poli?.id || 'tanpa-poli'
      if (!map[poli]) map[poli] = []
      map[poli].push(k)
    })
    Object.values(map).forEach((list) => {
      list.sort((a, b) => {
        const aDone = a.status === 'selesai' || a.status === 'batal'
        const bDone = b.status === 'selesai' || b.status === 'batal'
        if (aDone !== bDone) return aDone ? 1 : -1
        return 0
      })
    })
    return map
  }, [kunjunganList])

  const poliParam = searchParams.get('poli')
  const pasienParam = searchParams.get('pasien')
  const restoredRef = useRef(false)

  // ============================================================
  // Seeding & load data pemeriksaan
  // ============================================================

  /** Seed form pemeriksaan dari data kunjungan (keluhan + TTV dari pendaftaran) */
  const seedExamFromKunjungan = (kunjungan) => {
    const ttv = kunjungan?.dataTtv ?? null
    return {
      status: 'draft',
      registrasi: {
        keluhanUtama: ttv?.keluhan_utama || '',
        jenisKunjungan: kunjungan?.jenisKunjungan || '',
        penanggungJawab: kunjungan?.penanggungJawab || '',
        hubunganPj: kunjungan?.hubunganPj || '',
        namaPerujuk: kunjungan?.namaPerujuk || '',
        asuransi: kunjungan?.asuransi?.namaPerusahaan || kunjungan?.asuransi?.nama_perusahaan || '',
        noAsuransi: kunjungan?.noAsuransi || '',
        metodePembayaran: kunjungan?.metodePembayaran || '',
        statusPrioritas: kunjungan?.statusPrioritas || '',
        skriningVisual: Array.isArray(kunjungan?.skriningVisual)
          ? kunjungan.skriningVisual
          : (kunjungan?.skriningVisual && typeof kunjungan.skriningVisual === 'object'
            ? Object.entries(kunjungan.skriningVisual).filter(([, v]) => v).map(([k2]) => k2)
            : []),
        keteranganSkrining: kunjungan?.keteranganSkrining || '',
      },
      ttv,
      pemeriksaanFisik: defaultFisik(),
      anatomi: [],
      riwayatAlergi: [],
      riwayatObat: [],
      riwayatPenyakit: [],
      diagnosa: [],
      pemberianObat: [],
      pemberianObatRacik: [],
      pemberianTindakan: [],
      catatan: [],
    }
  }

  /** Normalisasi section: backend bisa kirim array langsung atau { rows: [...] } */
  const sectionRows = (v) => {
    if (Array.isArray(v)) return v
    if (v && Array.isArray(v.rows)) return v.rows
    return []
  }

  /** Gabungkan data tersimpan (BE) ke base seed */
  const applySaved = (base, saved) => {
    const fisikMap = new Map((saved?.pemeriksaanFisik || []).map((r) => [r.label, r]))
    return {
      status: saved?.status || base.status,
      registrasi: {
        keluhanUtama: saved?.registrasi?.keluhan_utama ?? base.registrasi.keluhanUtama,
        jenisKunjungan: saved?.registrasi?.jenis_kunjungan ?? base.registrasi.jenisKunjungan,
        penanggungJawab: saved?.registrasi?.penanggung_jawab ?? base.registrasi.penanggungJawab,
        hubunganPj: saved?.registrasi?.hubungan_pj ?? base.registrasi.hubunganPj,
        namaPerujuk: saved?.registrasi?.nama_perujuk ?? base.registrasi.namaPerujuk,
        asuransi: saved?.registrasi?.asuransi ?? base.registrasi.asuransi,
        noAsuransi: saved?.registrasi?.no_asuransi ?? base.registrasi.noAsuransi,
        metodePembayaran: saved?.registrasi?.metode_pembayaran ?? base.registrasi.metodePembayaran,
        statusPrioritas: saved?.registrasi?.status_prioritas ?? base.registrasi.statusPrioritas,
        skriningVisual: saved?.registrasi?.skrining_visual ?? base.registrasi.skriningVisual,
        keteranganSkrining: saved?.registrasi?.keterangan_skrining ?? base.registrasi.keteranganSkrining,
      },
      ttv: base.ttv,
      pemeriksaanFisik: base.pemeriksaanFisik.map((row) =>
        fisikMap.get(row.label) || row
      ),
      anatomi: saved?.anatomi || [],
      riwayatAlergi: sectionRows(saved?.riwayatAlergi),
      riwayatObat: sectionRows(saved?.riwayatObat),
      riwayatPenyakit: sectionRows(saved?.riwayatPenyakit),
      diagnosa: sectionRows(saved?.diagnosa),
      pemberianObat: sectionRows(saved?.pemberianObat),
      pemberianObatRacik: sectionRows(saved?.pemberianObatRacik),
      pemberianTindakan: sectionRows(saved?.pemberianTindakan),
      catatan: sectionRows(saved?.catatan),
    }
  }

  /** Buka pemeriksaan pasien: seed dari kunjungan, lalu overlay data tersimpan dari BE */
  const loadExam = async (kunjungan) => {
    const base = seedExamFromKunjungan(kunjungan)
    try {
      const saved = await fetchPemeriksaanDokter(kunjungan.encodedId || kunjungan.id)
      setExam(saved ? applySaved(base, saved) : base)
    } catch (err) {
      console.error('[Dokter] gagal memuat pemeriksaan tersimpan:', err)
      setExam(base)
    }
  }

  const openExam = (kunjungan) => {
    setSelectedPoli(kunjungan?.poli || null)
    setSelectedKunjungan(kunjungan)
    setInvalidSections([])
    setSearchParams({
      poli: kunjungan?.poli ? String(kunjungan.poli.id) : undefined,
      pasien: kunjungan?.encodedId || String(kunjungan?.id),
    })
    loadExam(kunjungan)
  }

  // Restore navigation state from URL search params after data loads (refresh resilience)
  useEffect(() => {
    if (loading || restoredRef.current) return
    restoredRef.current = true
    // Resolve poli from param (by id)
    if (poliParam) {
      const poli = poliList.find((p) => String(p.id) === poliParam)
      if (poli) setSelectedPoli(poli)
    }
    // Resolve patient: in-memory first (numeric id), else fetch by encrypted id via BE
    if (pasienParam && !selectedKunjungan) {
      const found = kunjunganList.find(
        (k) => String(k.id) === pasienParam
      )
      const resolve = (kunjungan) => {
        if (!kunjungan) {
          toast('Pasien tidak ditemukan atau tidak diizinkan.', 'error')
          setSearchParams({})
          return
        }
        setSelectedPoli(kunjungan.poli || selectedPoli)
        setSelectedKunjungan(kunjungan)
        setInvalidSections([])
        loadExam(kunjungan)
      }
      if (found) resolve(found)
      else {
        // encrypted id — BE decodes reliably (random IV makes in-memory match impossible)
        showKunjungan(pasienParam).then(resolve).catch(() => resolve(null))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, poliParam, pasienParam, poliList, kunjunganList])

  const setField = (key, value) => setExam((prev) => ({ ...prev, [key]: value }))
  const setRegistrasi = (key, value) =>
    setExam((prev) => ({ ...prev, registrasi: { ...prev.registrasi, [key]: value } }))

  // ---- Pemeriksaan Fisik ----
  const setFisik = (key, patch) => {
    setExam((prev) => ({
      ...prev,
      pemeriksaanFisik: prev.pemeriksaanFisik.map((row) =>
        row.key === key ? { ...row, ...patch } : row
      ),
    }))
  }

  // ---- Anatomi Tubuh (gambar diklik -> titik + keterangan) ----
  const onAnatomyClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10
    setPendingMarker({ x, y })
    setMarkerLabel('')
    setMarkerDesc('')
  }

  const saveMarker = () => {
    if (!pendingMarker || !markerDesc.trim()) return
    setExam((prev) => ({
      ...prev,
      anatomi: [
        ...prev.anatomi,
        {
          id: `a-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          x: pendingMarker.x,
          y: pendingMarker.y,
          label: markerLabel.trim(),
          keterangan: markerDesc.trim(),
        },
      ],
    }))
    setPendingMarker(null)
    setMarkerDesc('')
    setMarkerLabel('')
  }

  const removeMarker = (id) => {
    setExam((prev) => ({ ...prev, anatomi: prev.anatomi.filter((m) => m.id !== id) }))
  }

  // ---- Table list helpers ----
  const addRow = (key, empty) =>
    setExam((prev) => ({ ...prev, [key]: [...prev[key], { id: newRowId(), ...empty }] }))
  const removeRow = (key, id) =>
    setExam((prev) => ({ ...prev, [key]: prev[key].filter((r) => r.id !== id) }))
  const setRow = (key, id, patch) =>
    setExam((prev) => ({
      ...prev,
      [key]: prev[key].map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))

  // ---- Pemberian Obat: pilih obat dari master -> isi harga otomatis ----
  const setObatRow = (id, obat) => {
    if (!obat) {
      setRow('pemberianObat', id, { obatId: null, namaObat: '', harga: 0 })
      return
    }
    setRow('pemberianObat', id, {
      obatId: obat.id,
      namaObat: obat.nama || '',
      harga: obat.hargaJual ?? 0,
    })
  }

  // ---- Pemberian Tindakan: pilih tindakan dari master -> biaya otomatis ----
  const setTindakanRow = (id, tindakan) => {
    if (!tindakan) {
      setRow('pemberianTindakan', id, { tindakanId: null, namaTindakan: '', biaya: 0 })
      return
    }
    setRow('pemberianTindakan', id, {
      tindakanId: tindakan.id,
      namaTindakan: tindakan.namaTindakan || '',
      biaya: tindakan.jumlahBiaya ?? 0,
    })
  }

  // ---- Pemberian Tindakan: pilih dokter / asisten dari master nakes ----
  const setNakesRow = (key, id, field, nakes) => {
    setRow(key, id, { [field]: nakes ? (nakes.nama || '') : '' })
  }

  // ---- Obat Racik: pilih aturan pakai dari master ----
  const setAturanRow = (id, aturan) => {
    setRow('pemberianObatRacik', id, { aturanPakai: aturan ? (aturan.aturan || '') : '' })
  }

  // ---- Aksi samping (dieksekusi saat pemeriksaan) ----
  const openRiwayat = async () => {
    setRiwayatOpen(true)
    setRiwayatLoading(true)
    try {
      const list = await fetchKunjungan(branchId, {
        pasien_id: selectedKunjungan?.pasien?.id,
        limit: 100,
      })
      setRiwayatList(list)
    } catch (err) {
      console.error('[Dokter] gagal memuat riwayat kunjungan:', err)
      toast('Gagal memuat riwayat kunjungan', 'error')
    } finally {
      setRiwayatLoading(false)
    }
  }

  /** Buka detail pemeriksaan dokter dari kunjungan riwayat (read-only) */
  const openDetail = async (row) => {
    setDetailKunjungan(row)
    setDetailExam(null)
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const saved = await fetchPemeriksaanDokter(row.encodedId || row.id)
      setDetailExam(saved)
    } catch (err) {
      console.error('[Dokter] gagal memuat detail pemeriksaan:', err)
      toast('Gagal memuat detail pemeriksaan', 'error')
    } finally {
      setDetailLoading(false)
    }
  }

  const buatJanji = () => navigate('/janji-kunjungan')
  const buatResepLuar = () => toast('Modul Resep Luar akan segera tersedia.', 'info')
  const buatSurat = () => toast('Modul Surat (keterangan sakit, rujukan, dll) akan segera tersedia.', 'info')

  // ---- Simpan ----
  const validateMandatory = () => {
    const missing = []
    const ttv = selectedKunjungan?.dataTtv

    if (!exam.registrasi.keluhanUtama?.trim()) missing.push('Keluhan Utama')
    if (!exam.registrasi.jenisKunjungan) missing.push('Jenis Kunjungan')
    if (!ttv || !ttv.tinggi_badan || !ttv.berat_badan) missing.push('Tanda Tanda Vital')
    const tidakNormalTanpaKet = exam.pemeriksaanFisik.filter((r) => r.kondisi === 'tidak_normal' && !r.keterangan?.trim())
    if (tidakNormalTanpaKet.length > 0) missing.push('Pemeriksaan Fisik (temuan tidak normal wajib keterangan)')
    const diagnosaInvalid = exam.diagnosa.some((d) => !d.namaDiagnosa?.trim() || !d.status)
    if (diagnosaInvalid || exam.diagnosa.length === 0) missing.push('Diagnosa Pasien (wajib isi nama + status)')

    return missing
  }

  const handleSave = async (status) => {
    if (!selectedKunjungan) return
    if (selectedKunjungan.status === 'selesai') return

    if (status === 'final') {
      const missing = validateMandatory()
      if (missing.length > 0) {
        setInvalidSections(missing)
        toast(`Field wajib belum lengkap: ${missing.join(', ')}. Silakan cek section yang ditandai.`, 'warning', 6500)
        return
      }
      setInvalidSections([])
    } else {
      setInvalidSections([])
    }

    setSaving(true)
    const id = selectedKunjungan.encodedId || String(selectedKunjungan.id)
    const payload = {
      status,
      registrasi: {
        keluhan_utama: exam.registrasi.keluhanUtama,
        jenis_kunjungan: exam.registrasi.jenisKunjungan,
        penanggung_jawab: exam.registrasi.penanggungJawab,
        hubungan_pj: exam.registrasi.hubunganPj,
        nama_perujuk: exam.registrasi.namaPerujuk,
        asuransi: exam.registrasi.asuransi,
        no_asuransi: exam.registrasi.noAsuransi,
        metode_pembayaran: exam.registrasi.metodePembayaran,
        status_prioritas: exam.registrasi.statusPrioritas,
        skrining_visual: exam.registrasi.skriningVisual,
        keterangan_skrining: exam.registrasi.keteranganSkrining,
      },
      ttv: exam.ttv,
      pemeriksaan_fisik: exam.pemeriksaanFisik,
      anatomi: exam.anatomi,
      riwayat_alergi: { rows: exam.riwayatAlergi },
      riwayat_obat: { rows: exam.riwayatObat },
      riwayat_penyakit: { rows: exam.riwayatPenyakit },
      diagnosa: { rows: exam.diagnosa },
      pemberian_obat: { rows: exam.pemberianObat },
      pemberian_obat_racik: { rows: exam.pemberianObatRacik },
      pemberian_tindakan: { rows: exam.pemberianTindakan },
      catatan: { rows: exam.catatan },
    }
    try {
      await savePemeriksaanDokter(id, payload)
      setExam((prev) => ({ ...prev, status }))
      if (status === 'final') {
        setSelectedKunjungan((prev) => (prev ? { ...prev, status: 'selesai' } : prev))
        // Update status di list antrian supaya langsung turun ke bawah tanpa reload
        setKunjunganList((prev) =>
          prev.map((k) => (String(k.id) === String(selectedKunjungan.id) ? { ...k, status: 'selesai' } : k))
        )
        toast('Pemeriksaan selesai. Status kunjungan diperbarui menjadi selesai.', 'success')
      } else {
        toast('Pemeriksaan dokter disimpan sebagai draft.', 'success')
      }
    } catch (err) {
      console.error('[Dokter] gagal simpan:', err)
      toast(err?.response?.data?.message || 'Gagal menyimpan pemeriksaan dokter', 'error')
    } finally {
      setSaving(false)
    }
  }

  const goBackToList = () => {
    setSelectedKunjungan(null)
    setPendingMarker(null)
    // Return to queue view — keep poli param, drop pasien
    setSearchParams({ poli: selectedPoli ? String(selectedPoli.id) : undefined })
  }

  if (loading) {
    return <div className="p-6 text-[var(--text-muted)]">Memuat data pemeriksaan dokter…</div>
  }

  // ===== DOCTOR EXAM FORM (when a patient is selected) =====
  if (selectedKunjungan) {
    const k = selectedKunjungan
    const p = k.pasien
    const usia = p?.tanggalLahir
      ? Math.floor((Date.now() - new Date(p.tanggalLahir)) / (365.25 * 24 * 60 * 60 * 1000)) + ' th'
      : '-'
    const ttv = k?.dataTtv
    const jumlahTidakNormal = exam.pemeriksaanFisik.filter((r) => r.kondisi === 'tidak_normal').length

    return (
      <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-secondary)]">
        <div className="p-4 md:p-6 xl:p-8 pb-32">

          {/* STICKY PAGE TITLE + AKSI */}
          <div className="sticky top-0 z-[5] -mx-4 md:-mx-6 xl:-mx-8 bg-[var(--bg-secondary)]/95 backdrop-blur border-b border-[var(--border-primary)] px-4 md:px-6 xl:px-8 py-3 mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goBackToList}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
              title="Kembali ke daftar poli"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div className="flex items-center gap-1.5 text-tiny text-[var(--text-muted)]">
              <span>Pemeriksaan Dokter</span>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              <span className="text-[var(--text-primary)] font-medium">Dr. {k.dokter?.nama || '-'}</span>
            </div>
            <Badge tone={STATUS_BADGE[k.status] || 'neutral'} variant="soft">{k.status}</Badge>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center" style={{ color: 'var(--border-primary)' }}><div className="w-full border-t border-[var(--border-primary)]" /></div>
            <div className="relative flex justify-center">
              <span className="px-4 text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-secondary)] uppercase tracking-wider">
                Pemeriksaan Pasien — {p?.nama || '-'}
              </span>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSave(exam.status) }}
            className="grid grid-cols-1 xl:grid-cols-[70%_30%] gap-6 items-start"
          >

            {/* ===== KOLOM KIRI (70%): Form Sections ===== */}
            <div className="space-y-4">

              {/* Keluhan & Registrasi — dimuat dari pendaftaran kunjungan */}
              <Section title="Keluhan & Informasi Registrasi" defaultOpen dot={!!exam.registrasi.keluhanUtama}
                invalid={invalidSections.some((s) => s === 'Keluhan Utama' || s === 'Jenis Kunjungan')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-tiny font-semibold text-[var(--text-secondary)]">Keluhan Utama</label>
                    <textarea
                      placeholder="Keluhan utama pasien"
                      value={exam.registrasi.keluhanUtama}
                      onChange={(e) => setRegistrasi('keluhanUtama', e.target.value)}
                      rows={3}
                      className="input w-full resize-y mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-tiny font-semibold text-[var(--text-secondary)]">Jenis Kunjungan</label>
                    <select value={exam.registrasi.jenisKunjungan} onChange={(e) => setRegistrasi('jenisKunjungan', e.target.value)} className="input w-full mt-1">
                      <option value="">-</option>
                      <option value="baru">Baru</option>
                      <option value="lama">Lama</option>
                      <option value="kontrol">Kontrol</option>
                      <option value="rujukan">Rujukan</option>
                      <option value="langsung">Langsung</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-tiny font-semibold text-[var(--text-secondary)]">Status Prioritas</label>
                    <select value={exam.registrasi.statusPrioritas} onChange={(e) => setRegistrasi('statusPrioritas', e.target.value)} className="input w-full mt-1">
                      <option value="">-</option>
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-tiny font-semibold text-[var(--text-secondary)]">Penanggung Jawab</label>
                    <input type="text" value={exam.registrasi.penanggungJawab} onChange={(e) => setRegistrasi('penanggungJawab', e.target.value)} className="input w-full mt-1" />
                  </div>
                  <div>
                    <label className="text-tiny font-semibold text-[var(--text-secondary)]">Hubungan dengan Pasien</label>
                    <input type="text" value={exam.registrasi.hubunganPj} onChange={(e) => setRegistrasi('hubunganPj', e.target.value)} className="input w-full mt-1" />
                  </div>
                  <div>
                    <label className="text-tiny font-semibold text-[var(--text-secondary)]">Nama Perujuk</label>
                    <input type="text" value={exam.registrasi.namaPerujuk} onChange={(e) => setRegistrasi('namaPerujuk', e.target.value)} className="input w-full mt-1" />
                  </div>
                  <div>
                    <label className="text-tiny font-semibold text-[var(--text-secondary)]">Asuransi</label>
                    <input type="text" value={exam.registrasi.asuransi} onChange={(e) => setRegistrasi('asuransi', e.target.value)} className="input w-full mt-1" />
                  </div>
                  <div>
                    <label className="text-tiny font-semibold text-[var(--text-secondary)]">No. Asuransi</label>
                    <input type="text" value={exam.registrasi.noAsuransi} onChange={(e) => setRegistrasi('noAsuransi', e.target.value)} className="input w-full mt-1" />
                  </div>
                  <div>
                    <label className="text-tiny font-semibold text-[var(--text-secondary)]">Metode Pembayaran</label>
                    <select value={exam.registrasi.metodePembayaran} onChange={(e) => setRegistrasi('metodePembayaran', e.target.value)} className="input w-full mt-1">
                      <option value="">-</option>
                      <option value="tunai">Tunai</option>
                      <option value="asuransi">Asuransi</option>
                      <option value="bpjs">BPJS</option>
                      <option value="transfer">Transfer</option>
                      <option value="qris">QRIS</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 mt-2">
                    <div className="border border-[var(--border-primary)] rounded-lg p-3 bg-[var(--bg-secondary)]">
                      <p className="text-tiny font-semibold text-[var(--text-secondary)] mb-2">
                        Skrining Visual Triase (Diagnosis Awal — saat registrasi)
                      </p>
                      {exam.registrasi.skriningVisual.length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)]">Tidak ada temuan skrining visual pada registrasi.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {exam.registrasi.skriningVisual.map((s) => (
                            <Badge key={s} tone={['nyeriDada', 'tidakSadarkanDiri', 'nadiTidakTeraba', 'gangguanPernapasan', 'perdarahan'].includes(s) ? 'danger' : 'warning'} variant="soft">
                              {SKRINING_LABELS[s] || s}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="mt-2">
                        <label className="text-tiny font-semibold text-[var(--text-secondary)]">Keterangan Skrining</label>
                        <textarea
                          placeholder="Keterangan tambahan skrining…"
                          value={exam.registrasi.keteranganSkrining}
                          onChange={(e) => setRegistrasi('keteranganSkrining', e.target.value)}
                          rows={2}
                          className="input w-full resize-y mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Section>

              {/* TTV — dimuat dari input TTV pendaftaran kunjungan */}
              <Section title="Tanda Tanda Vital" dot={!!ttv}
                invalid={invalidSections.some((s) => s === 'Tanda Tanda Vital')}>
                {ttv ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-tiny text-[var(--text-secondary)]">Suhu</span><span className="block font-medium text-[var(--text-primary)]">{ttv.suhu || '-'} °C</span></div>
                    <div><span className="text-tiny text-[var(--text-secondary)]">Saturasi</span><span className="block font-medium text-[var(--text-primary)]">{ttv.saturasi_oksigen || '-'} %</span></div>
                    <div><span className="text-tiny text-[var(--text-secondary)]">Kesadaran</span><span className="block font-medium text-[var(--text-primary)]">{ttv.kesadaran || '-'}</span></div>
                    <div><span className="text-tiny text-[var(--text-secondary)]">Tinggi Badan</span><span className="block font-medium text-[var(--text-primary)]">{ttv.tinggi_badan || '-'} cm</span></div>
                    <div><span className="text-tiny text-[var(--text-secondary)]">Berat Badan</span><span className="block font-medium text-[var(--text-primary)]">{ttv.berat_badan || '-'} kg</span></div>
                    <div><span className="text-tiny text-[var(--text-secondary)]">Lingkar Perut</span><span className="block font-medium text-[var(--text-primary)]">{ttv.lingkar_perut || '-'} cm</span></div>
                    <div><span className="text-tiny text-[var(--text-secondary)]">IMT</span><span className="block font-medium text-[var(--text-primary)]">{ttv.imt || '-'} kg/m²</span></div>
                    <div><span className="text-tiny text-[var(--text-secondary)]">Tekanan Darah</span><span className="block font-medium text-[var(--text-primary)]">{ttv.sistole || '-'}/{ttv.diastole || ''} mmHg</span></div>
                    <div><span className="text-tiny text-[var(--text-secondary)]">RR</span><span className="block font-medium text-[var(--text-primary)]">{ttv.respiratory_rate || '-'} /min</span></div>
                    <div><span className="text-tiny text-[var(--text-secondary)]">HR</span><span className="block font-medium text-[var(--text-primary)]">{ttv.heart_rate || '-'} bpm</span></div>
                    <div><span className="text-tiny text-[var(--text-secondary)]">Prioritas</span><span className="block font-medium text-[var(--text-primary)]">{k?.statusPrioritas || '-'}</span></div>
                    {ttv.catatan_ttv && (
                      <div className="md:col-span-4"><span className="text-tiny text-[var(--text-secondary)]">Catatan TTV</span><span className="block text-sm text-[var(--text-primary)]">{ttv.catatan_ttv}</span></div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">Belum ada data TTV untuk kunjungan ini.</p>
                )}
              </Section>

              {/* Pemeriksaan Fisik — table list per area, default Normal */}
              <Section
                title="Pemeriksaan Fisik"
                dot={jumlahTidakNormal > 0}
                invalid={invalidSections.some((s) => s.startsWith('Pemeriksaan Fisik'))}
                right={jumlahTidakNormal > 0
                  ? <Badge tone="danger" variant="soft">{jumlahTidakNormal} tidak normal</Badge>
                  : <Badge tone="success" variant="soft">Semua normal</Badge>}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-tiny text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                        <th className="py-2 pr-3 font-semibold w-48">Area</th>
                        <th className="py-2 pr-3 font-semibold w-44">Kondisi</th>
                        <th className="py-2 font-semibold">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.pemeriksaanFisik.map((row) => (
                        <tr key={row.key} className="border-b border-[var(--border-primary)] last:border-b-0 align-top">
                          <td className="py-2 pr-3 font-medium text-[var(--text-primary)]">{row.label}</td>
                          <td className="py-2 pr-3">
                            <select
                              value={row.kondisi}
                              onChange={(e) => setFisik(row.key, { kondisi: e.target.value })}
                              className="input w-full"
                            >
                              <option value="normal">{KONDISI_LABEL.normal}</option>
                              <option value="tidak_normal">{KONDISI_LABEL.tidak_normal}</option>
                              <option value="tidak_diperiksa">{KONDISI_LABEL.tidak_diperiksa}</option>
                            </select>
                          </td>
                          <td className="py-2">
                            {row.kondisi === 'tidak_normal' ? (
                              <textarea
                                placeholder="Temuan / keterangan tidak normal…"
                                value={row.keterangan}
                                onChange={(e) => setFisik(row.key, { keterangan: e.target.value })}
                                rows={2}
                                className="input w-full resize-y"
                              />
                            ) : (
                              <span className="text-tiny text-[var(--text-muted)]">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              {/* Anatomi Tubuh — gambar diklik -> titik + keterangan */}
              <Section title="Anatomi Tubuh" dot={exam.anatomi.length > 0}
                right={<Badge tone={exam.anatomi.length > 0 ? 'success' : 'neutral'} variant="soft">{exam.anatomi.length} titik</Badge>}>
                <p className="text-tiny text-[var(--text-secondary)] mb-2">
                  Klik titik pada gambar anatomi untuk menandai temuan, lalu isi keterangan pada modal.
                </p>
                <div
                  className="relative inline-block w-full cursor-crosshair select-none"
                  onClick={onAnatomyClick}
                >
                  <img
                    src={gambarAnatomi}
                    alt="Anatomi tubuh manusia (anterior & posterior)"
                    className="w-full h-auto rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]"
                    draggable={false}
                  />
                  {/* Titik pratinjau (belum disimpan) */}
                  {pendingMarker && (
                    <div
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-dashed border-[var(--brand-primary)] bg-[var(--brand-primary)]/20 animate-pulse pointer-events-none"
                      style={{ left: `${pendingMarker.x}%`, top: `${pendingMarker.y}%` }}
                    />
                  )}
                  {/* Titik tersimpan */}
                  {exam.anatomi.map((m, i) => (
                    <button
                      key={m.id}
                      type="button"
                      title={`${m.label ? m.label + ': ' : ''}${m.keterangan}`}
                      onClick={(e) => { e.stopPropagation(); removeMarker(m.id) }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full text-tiny font-bold text-white bg-[var(--status-danger)] border-2 border-white shadow hover:scale-110 transition-transform"
                      style={{ left: `${m.x}%`, top: `${m.y}%` }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                {exam.anatomi.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-tiny font-semibold text-[var(--text-secondary)]">Daftar titik anatomi (klik nomor pada gambar untuk hapus):</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-tiny text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                            <th className="py-2 pr-3 font-semibold w-10">No</th>
                            <th className="py-2 pr-3 font-semibold w-48">Label</th>
                            <th className="py-2 font-semibold">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exam.anatomi.map((m, i) => (
                            <tr key={m.id} className="border-b border-[var(--border-primary)] last:border-b-0 align-top">
                              <td className="py-2 pr-3">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-tiny font-bold text-white bg-[var(--status-danger)]">{i + 1}</span>
                              </td>
                              <td className="py-2 pr-3 font-medium text-[var(--text-primary)]">{m.label || '-'}</td>
                              <td className="py-2">
                                <span className="text-[var(--text-primary)]">{m.keterangan}</span>
                                <button
                                  type="button"
                                  onClick={() => removeMarker(m.id)}
                                  className="ml-2 text-[var(--status-danger)] hover:opacity-70 align-middle"
                                  title="Hapus titik"
                                >
                                  <svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Section>

              {/* Modal keterangan titik anatomi */}
              <Modal
                open={!!pendingMarker}
                onClose={() => { setPendingMarker(null); setMarkerDesc(''); setMarkerLabel('') }}
                title="Beri Keterangan Titik Anatomi"
                size="md"
              >
                <p className="text-tiny text-[var(--text-secondary)] mb-3">
                  Titik ditandai di posisi ({pendingMarker?.x}%, {pendingMarker?.y}%) — lengkapi label dan keterangan temuan.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-tiny font-semibold text-[var(--text-secondary)]">Label Area</label>
                    <input
                      type="text"
                      placeholder="mis. Nyeri bahu kanan"
                      value={markerLabel}
                      onChange={(e) => setMarkerLabel(e.target.value)}
                      className="input w-full mt-1"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-tiny font-semibold text-[var(--text-secondary)]">Keterangan Temuan</label>
                    <textarea
                      placeholder="Deskripsi temuan pada titik ini…"
                      value={markerDesc}
                      onChange={(e) => setMarkerDesc(e.target.value)}
                      rows={3}
                      className="input w-full resize-y mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Btn size="sm" variant="ghost" type="button" onClick={() => { setPendingMarker(null); setMarkerDesc(''); setMarkerLabel('') }}>Batal</Btn>
                  <Btn size="sm" variant="primary" type="button" onClick={saveMarker} disabled={!markerDesc.trim()}>Tandai Titik</Btn>
                </div>
              </Modal>

              {/* Riwayat Alergi — table list */}
              <Section title="Riwayat Alergi" dot={exam.riwayatAlergi.length > 0}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-tiny text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                        <th className="py-2 pr-3 font-semibold w-36">Jenis</th>
                        <th className="py-2 pr-3 font-semibold">Alergen</th>
                        <th className="py-2 pr-3 font-semibold">Reaksi</th>
                        <th className="py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.riwayatAlergi.length === 0 && (
                        <tr><td colSpan={4} className="py-2 text-[var(--text-muted)]">Belum ada riwayat alergi tercatat.</td></tr>
                      )}
                      {exam.riwayatAlergi.map((r) => (
                        <tr key={r.id} className="border-b border-[var(--border-primary)] last:border-b-0 align-top">
                          <td className="py-2 pr-3">
                            <select value={r.jenis || ''} onChange={(e) => setRow('riwayatAlergi', r.id, { jenis: e.target.value })} className="input w-full">
                              <option value="">-</option>
                              <option value="obat">Obat</option>
                              <option value="makanan">Makanan</option>
                              <option value="lain">Lainnya</option>
                            </select>
                          </td>
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="Nama alergen…" value={r.alergen || ''} onChange={(e) => setRow('riwayatAlergi', r.id, { alergen: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="Reaksi (gatal, sesak, dll)…" value={r.reaksi || ''} onChange={(e) => setRow('riwayatAlergi', r.id, { reaksi: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2">
                            <button type="button" onClick={() => removeRow('riwayatAlergi', r.id)} className="text-[var(--status-danger)] hover:opacity-70" title="Hapus">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Btn size="sm" variant="outline" type="button" className="mt-2" onClick={() => addRow('riwayatAlergi', { jenis: '', alergen: '', reaksi: '' })}>
                  + Tambah Alergi
                </Btn>
              </Section>

              {/* Riwayat Obat — table list */}
              <Section title="Riwayat Obat" dot={exam.riwayatObat.length > 0}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-tiny text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                        <th className="py-2 pr-3 font-semibold">Nama Obat</th>
                        <th className="py-2 pr-3 font-semibold w-32">Dosis</th>
                        <th className="py-2 pr-3 font-semibold w-40">Aturan Pakai</th>
                        <th className="py-2 pr-3 font-semibold">Keterangan</th>
                        <th className="py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.riwayatObat.length === 0 && (
                        <tr><td colSpan={5} className="py-2 text-[var(--text-muted)]">Belum ada riwayat obat tercatat.</td></tr>
                      )}
                      {exam.riwayatObat.map((r) => (
                        <tr key={r.id} className="border-b border-[var(--border-primary)] last:border-b-0 align-top">
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="Nama obat…" value={r.namaObat || ''} onChange={(e) => setRow('riwayatObat', r.id, { namaObat: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="Dosis…" value={r.dosis || ''} onChange={(e) => setRow('riwayatObat', r.id, { dosis: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="Aturan pakai…" value={r.aturanPakai || ''} onChange={(e) => setRow('riwayatObat', r.id, { aturanPakai: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="Keterangan…" value={r.keterangan || ''} onChange={(e) => setRow('riwayatObat', r.id, { keterangan: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2">
                            <button type="button" onClick={() => removeRow('riwayatObat', r.id)} className="text-[var(--status-danger)] hover:opacity-70" title="Hapus">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Btn size="sm" variant="outline" type="button" className="mt-2" onClick={() => addRow('riwayatObat', { namaObat: '', dosis: '', aturanPakai: '', keterangan: '' })}>
                  + Tambah Obat
                </Btn>
              </Section>

              {/* Riwayat Penyakit — table list */}
              <Section title="Riwayat Penyakit" dot={exam.riwayatPenyakit.length > 0}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-tiny text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                        <th className="py-2 pr-3 font-semibold">Nama Penyakit</th>
                        <th className="py-2 pr-3 font-semibold">Tahun</th>
                        <th className="py-2 pr-3 font-semibold">Pengobatan</th>
                        <th className="py-2 pr-3 font-semibold">Status</th>
                        <th className="py-2 pr-3 font-semibold">Keterangan</th>
                        <th className="py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.riwayatPenyakit.length === 0 && (
                        <tr><td colSpan={6} className="py-2 text-[var(--text-muted)]">Belum ada riwayat penyakit tercatat.</td></tr>
                      )}
                      {exam.riwayatPenyakit.map((r) => (
                        <tr key={r.id} className="border-b border-[var(--border-primary)] last:border-b-0 align-top">
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="Nama penyakit…" value={r.namaPenyakit || ''} onChange={(e) => setRow('riwayatPenyakit', r.id, { namaPenyakit: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2 pr-3 w-28">
                            <input type="text" placeholder="Tahun…" value={r.tahun || ''} onChange={(e) => setRow('riwayatPenyakit', r.id, { tahun: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="Pengobatan…" value={r.pengobatan || ''} onChange={(e) => setRow('riwayatPenyakit', r.id, { pengobatan: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2 pr-3 w-36">
                            <select value={r.status || ''} onChange={(e) => setRow('riwayatPenyakit', r.id, { status: e.target.value })} className="input w-full">
                              <option value="">-</option>
                              <option value="sembuh">Sembuh</option>
                              <option value="dalam_pengobatan">Dalam Pengobatan</option>
                              <option value="kronis">Kronis</option>
                            </select>
                          </td>
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="Keterangan…" value={r.keterangan || ''} onChange={(e) => setRow('riwayatPenyakit', r.id, { keterangan: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2">
                            <button type="button" onClick={() => removeRow('riwayatPenyakit', r.id)} className="text-[var(--status-danger)] hover:opacity-70" title="Hapus">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Btn size="sm" variant="outline" type="button" className="mt-2" onClick={() => addRow('riwayatPenyakit', { namaPenyakit: '', tahun: '', pengobatan: '', status: '', keterangan: '' })}>
                  + Tambah Riwayat Penyakit
                </Btn>
              </Section>

              {/* Diagnosa Pasien — table list */}
              <Section title="Diagnosa Pasien" dot={exam.diagnosa.length > 0}
                invalid={invalidSections.some((s) => s.startsWith('Diagnosa Pasien'))}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-tiny text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                        <th className="py-2 pr-3 font-semibold w-28">Kode ICD</th>
                        <th className="py-2 pr-3 font-semibold">Nama Diagnosa</th>
                        <th className="py-2 pr-3 font-semibold w-36">Status</th>
                        <th className="py-2 pr-3 font-semibold">Catatan Tambahan</th>
                        <th className="py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.diagnosa.length === 0 && (
                        <tr><td colSpan={5} className="py-2 text-[var(--text-muted)]">Belum ada diagnosa tercatat.</td></tr>
                      )}
                      {exam.diagnosa.map((r) => (
                        <tr key={r.id} className="border-b border-[var(--border-primary)] last:border-b-0 align-top">
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="mis. A09" value={r.kodeIcd || ''} onChange={(e) => setRow('diagnosa', r.id, { kodeIcd: e.target.value })} className="input w-full font-mono" />
                          </td>
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="Nama diagnosa…" value={r.namaDiagnosa || ''} onChange={(e) => setRow('diagnosa', r.id, { namaDiagnosa: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2 pr-3">
                            <select value={r.status || ''} onChange={(e) => setRow('diagnosa', r.id, { status: e.target.value })} className="input w-full">
                              <option value="">-</option>
                              {Object.entries(DIAGNOSA_STATUS_LABEL).map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="Catatan tambahan…" value={r.catatan || ''} onChange={(e) => setRow('diagnosa', r.id, { catatan: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2">
                            <button type="button" onClick={() => removeRow('diagnosa', r.id)} className="text-[var(--status-danger)] hover:opacity-70" title="Hapus">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Btn size="sm" variant="outline" type="button" className="mt-2" onClick={() => addRow('diagnosa', { kodeIcd: '', namaDiagnosa: '', status: '', catatan: '' })}>
                  + Tambah Diagnosa
                </Btn>
              </Section>

              {/* Daftar Pemberian Obat — koneksi master obat */}
              <Section
                title="Daftar Pemberian Obat"
                dot={exam.pemberianObat.length > 0}
                right={exam.pemberianObat.length > 0
                  ? <span className="text-tiny font-mono">{fmtRupiah(exam.pemberianObat.reduce((s, r) => s + (Number(r.subtotal) || 0), 0))}</span>
                  : null}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-tiny text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                        <th className="py-2 pr-3 font-semibold w-10">No</th>
                        <th className="py-2 pr-3 font-semibold">Nama Obat</th>
                        <th className="py-2 pr-3 font-semibold w-40">Dokter</th>
                        <th className="py-2 pr-3 font-semibold w-40">Waktu</th>
                        <th className="py-2 pr-3 font-semibold w-32">Harga</th>
                        <th className="py-2 pr-3 font-semibold w-24">Jumlah</th>
                        <th className="py-2 pr-3 font-semibold w-32">Subtotal</th>
                        <th className="py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.pemberianObat.length === 0 && (
                        <tr><td colSpan={8} className="py-2 text-[var(--text-muted)]">Belum ada pemberian obat.</td></tr>
                      )}
                      {exam.pemberianObat.map((r, i) => {
                        const subtotal = (Number(r.harga) || 0) * (Number(r.jumlah) || 0)
                        return (
                          <tr key={r.id} className="border-b border-[var(--border-primary)] last:border-b-0 align-top">
                            <td className="py-2 pr-3 text-[var(--text-muted)]">{i + 1}</td>
                            <td className="py-2 pr-3 min-w-[220px]">
                              <MasterSearch
                                branchId={branchId}
                                fetcher={searchObat}
                                params={{ kategori: 'obat' }}
                                value={r.obatId ? { id: r.obatId, nama: r.namaObat } : null}
                                onSelect={(o) => setObatRow(r.id, o)}
                                onClear={() => setObatRow(r.id, null)}
                                placeholder="Ketik nama obat…"
                                renderItem={(o) => ({
                                  title: o.nama,
                                  sub: `${o.satuanTerkecil || '-'} • Stok ${o.stok ?? 0} • ${fmtRupiah(o.hargaJual)}`,
                                })}
                              />
                            </td>
                            <td className="py-2 pr-3 min-w-[180px]">
                              <MasterSearch
                                branchId={branchId}
                                fetcher={searchNakes}
                                params={{ tipe: 'dokter' }}
                                value={r.dokter ? { id: r.dokter, nama: r.dokter } : null}
                                onSelect={(n) => setNakesRow('pemberianObat', r.id, 'dokter', n)}
                                onClear={() => setNakesRow('pemberianObat', r.id, 'dokter', null)}
                                placeholder="Ketik nama dokter…"
                                renderItem={(n) => ({ title: n.nama, sub: n.spesialisasi || n.tipe })}
                              />
                            </td>
                            <td className="py-2 pr-3">
                              <input type="datetime-local" value={r.waktu || ''} onChange={(e) => setRow('pemberianObat', r.id, { waktu: e.target.value })} className="input w-full" />
                            </td>
                            <td className="py-2 pr-3">
                              <input type="number" min="0" value={r.harga ?? ''} onChange={(e) => setRow('pemberianObat', r.id, { harga: e.target.value === '' ? 0 : Number(e.target.value) })} className="input w-full" />
                            </td>
                            <td className="py-2 pr-3">
                              <input type="number" min="1" value={r.jumlah ?? ''} onChange={(e) => setRow('pemberianObat', r.id, { jumlah: e.target.value === '' ? 0 : Number(e.target.value) })} className="input w-full" />
                            </td>
                            <td className="py-2 pr-3 font-mono text-tiny font-semibold text-[var(--text-primary)]">
                              {fmtRupiah(subtotal)}
                            </td>
                            <td className="py-2">
                              <button type="button" onClick={() => removeRow('pemberianObat', r.id)} className="text-[var(--status-danger)] hover:opacity-70" title="Hapus">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <Btn size="sm" variant="outline" type="button" className="mt-2" onClick={() => addRow('pemberianObat', { obatId: '', namaObat: '', dokter: k?.dokter?.nama || '', waktu: nowLocalDatetime(), harga: 0, jumlah: 1, subtotal: 0 })}>
                  + Tambah Pemberian Obat
                </Btn>
              </Section>

              {/* Daftar Pemberian Obat Racik — table list */}
              <Section title="Daftar Pemberian Obat Racik" dot={exam.pemberianObatRacik.length > 0}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-tiny text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                        <th className="py-2 pr-3 font-semibold w-10">No</th>
                        <th className="py-2 pr-3 font-semibold w-32">Jumlah Kemasan</th>
                        <th className="py-2 pr-3 font-semibold w-56">Aturan Pakai</th>
                        <th className="py-2 pr-3 font-semibold">Detail Racikan</th>
                        <th className="py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.pemberianObatRacik.length === 0 && (
                        <tr><td colSpan={5} className="py-2 text-[var(--text-muted)]">Belum ada obat racikan.</td></tr>
                      )}
                      {exam.pemberianObatRacik.map((r, i) => (
                        <tr key={r.id} className="border-b border-[var(--border-primary)] last:border-b-0 align-top">
                          <td className="py-2 pr-3 text-[var(--text-muted)]">{i + 1}</td>
                          <td className="py-2 pr-3">
                            <input type="number" min="1" value={r.jumlahKemasan ?? ''} onChange={(e) => setRow('pemberianObatRacik', r.id, { jumlahKemasan: e.target.value === '' ? 0 : Number(e.target.value) })} className="input w-full" />
                          </td>
                          <td className="py-2 pr-3 min-w-[220px]">
                            <MasterSearch
                              branchId={branchId}
                              fetcher={searchAturanPakai}
                              value={r.aturanPakai ? { id: r.aturanPakai, aturan: r.aturanPakai } : null}
                              onSelect={(a) => setAturanRow(r.id, a)}
                              onClear={() => setAturanRow(r.id, null)}
                              placeholder="Ketik aturan pakai…"
                              renderItem={(a) => ({ title: a.aturan })}
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <textarea placeholder="Detail racikan (komposisi obat)…" value={r.detail || ''} onChange={(e) => setRow('pemberianObatRacik', r.id, { detail: e.target.value })} rows={2} className="input w-full resize-y" />
                          </td>
                          <td className="py-2">
                            <button type="button" onClick={() => removeRow('pemberianObatRacik', r.id)} className="text-[var(--status-danger)] hover:opacity-70" title="Hapus">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Btn size="sm" variant="outline" type="button" className="mt-2" onClick={() => addRow('pemberianObatRacik', { jumlahKemasan: 1, aturanPakai: '', detail: '' })}>
                  + Tambah Obat Racik
                </Btn>
              </Section>

              {/* Daftar Pemberian Tindakan — koneksi master tindakan */}
              <Section title="Daftar Pemberian Tindakan" dot={exam.pemberianTindakan.length > 0}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-tiny text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                        <th className="py-2 pr-3 font-semibold w-10">No</th>
                        <th className="py-2 pr-3 font-semibold">Pilih Tindakan</th>
                        <th className="py-2 pr-3 font-semibold w-32">Jumlah</th>
                        <th className="py-2 pr-3 font-semibold">Catatan</th>
                        <th className="py-2 pr-3 font-semibold w-40">Dokter</th>
                        <th className="py-2 pr-3 font-semibold w-40">Asisten Dokter</th>
                        <th className="py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.pemberianTindakan.length === 0 && (
                        <tr><td colSpan={7} className="py-2 text-[var(--text-muted)]">Belum ada tindakan diberikan.</td></tr>
                      )}
                      {exam.pemberianTindakan.map((r, i) => (
                        <tr key={r.id} className="border-b border-[var(--border-primary)] last:border-b-0 align-top">
                          <td className="py-2 pr-3 text-[var(--text-muted)]">{i + 1}</td>
                          <td className="py-2 pr-3 min-w-[220px]">
                            <MasterSearch
                              branchId={branchId}
                              fetcher={searchTindakan}
                              value={r.tindakanId ? { id: r.tindakanId, namaTindakan: r.namaTindakan } : null}
                              onSelect={(t) => setTindakanRow(r.id, t)}
                              onClear={() => setTindakanRow(r.id, null)}
                              placeholder="Ketik nama / kode tindakan…"
                              renderItem={(t) => ({
                                title: t.namaTindakan,
                                sub: `${t.kodeICD9 ? 'ICD-9 ' + t.kodeICD9 + ' • ' : ''}${t.kelompokTindakan || '-'} • ${fmtRupiah(t.jumlahBiaya)}`,
                              })}
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <input type="number" min="1" value={r.jumlah ?? ''} onChange={(e) => setRow('pemberianTindakan', r.id, { jumlah: e.target.value === '' ? 0 : Number(e.target.value) })} className="input w-full" />
                          </td>
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="Catatan (opsional)…" value={r.catatan || ''} onChange={(e) => setRow('pemberianTindakan', r.id, { catatan: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2 pr-3">
                            <input type="text" value={r.dokter || k?.dokter?.nama || ''} onChange={(e) => setRow('pemberianTindakan', r.id, { dokter: e.target.value })} className="input w-full" readOnly />
                          </td>
                          <td className="py-2 pr-3 min-w-[180px]">
                            <MasterSearch
                              branchId={branchId}
                              fetcher={searchNakes}
                              value={r.asistenDokter ? { id: r.asistenDokter, nama: r.asistenDokter } : null}
                              onSelect={(n) => setNakesRow('pemberianTindakan', r.id, 'asistenDokter', n)}
                              onClear={() => setNakesRow('pemberianTindakan', r.id, 'asistenDokter', null)}
                              placeholder="Ketik nama asisten…"
                              renderItem={(n) => ({ title: n.nama, sub: n.tipe })}
                            />
                          </td>
                          <td className="py-2">
                            <button type="button" onClick={() => removeRow('pemberianTindakan', r.id)} className="text-[var(--status-danger)] hover:opacity-70" title="Hapus">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Btn size="sm" variant="outline" type="button" className="mt-2" onClick={() => addRow('pemberianTindakan', { tindakanId: '', namaTindakan: '', jumlah: 1, catatan: '', dokter: k?.dokter?.nama || '', asistenDokter: '', biaya: 0 })}>
                  + Tambah Tindakan
                </Btn>
              </Section>

              {/* Catatan Pemeriksaan — table list diagnosa/terapi */}
              <Section title="Catatan Pemeriksaan Dokter" dot={exam.catatan.length > 0}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-tiny text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                        <th className="py-2 pr-3 font-semibold">Diagnosa</th>
                        <th className="py-2 pr-3 font-semibold">Terapi</th>
                        <th className="py-2 pr-3 font-semibold">Tindak Lanjut</th>
                        <th className="py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.catatan.length === 0 && (
                        <tr><td colSpan={4} className="py-2 text-[var(--text-muted)]">Belum ada diagnosa tercatat.</td></tr>
                      )}
                      {exam.catatan.map((r) => (
                        <tr key={r.id} className="border-b border-[var(--border-primary)] last:border-b-0 align-top">
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="Diagnosa…" value={r.diagnosa || ''} onChange={(e) => setRow('catatan', r.id, { diagnosa: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="Terapi…" value={r.terapi || ''} onChange={(e) => setRow('catatan', r.id, { terapi: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2 pr-3">
                            <input type="text" placeholder="Tindak lanjut…" value={r.tindakLanjut || ''} onChange={(e) => setRow('catatan', r.id, { tindakLanjut: e.target.value })} className="input w-full" />
                          </td>
                          <td className="py-2">
                            <button type="button" onClick={() => removeRow('catatan', r.id)} className="text-[var(--status-danger)] hover:opacity-70" title="Hapus">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Btn size="sm" variant="outline" type="button" className="mt-2" onClick={() => addRow('catatan', { diagnosa: '', terapi: '', tindakLanjut: '' })}>
                  + Tambah Diagnosa
                </Btn>
              </Section>

            </div>

            {/* ===== KOLOM KANAN (30%): Patient Profile + Aksi ===== */}
            <div>
              <Card className="p-5 sticky top-[72px]">
                <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-primary)]">
                  <div className="w-14 h-14 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] text-2xl">
                    {p?.nama?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-[var(--text-primary)] truncate">{p?.nama || '-'}</h3>
                    <p className="text-tiny text-[var(--text-muted)] font-mono">{p?.noRm || '-'}</p>
                  </div>
                  <Badge tone={STATUS_BADGE[k.status] || 'neutral'} variant="soft">{k.status}</Badge>
                </div>

                <div className="space-y-2.5 text-sm mt-3">
                  <InfoRow label="No. Pendaftaran" value={k.noPendaftaran} mono />
                  <InfoRow label="No. Rekam Medis" value={p?.noRm} mono />
                  <InfoRow label="Tanggal Lahir" value={p?.tanggalLahir} />
                  <InfoRow label="Usia" value={usia} />
                  <InfoRow label="Jenis Kelamin" value={p?.jenisKelamin === 'L' ? 'Laki-laki' : p?.jenisKelamin === 'P' ? 'Perempuan' : '-'} />
                  <InfoRow label="Alamat" value={p?.alamat} />
                  <InfoRow label="No. KTP" value={p?.nik} mono />
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border-primary)] space-y-1.5 text-sm">
                  <InfoRow label="Poli" value={k.poli?.nama} />
                  <InfoRow label="Dokter" value={k.dokter?.nama} />
                  <InfoRow label="Ruangan" value={k.ruangan?.namaRuangan} />
                  <InfoRow label="Tanggal Kunjungan" value={k.tglJamKunjungan ? formatDateID(k.tglJamKunjungan) : '-'} />
                  <InfoRow label="Metode Bayar" value={k.metodePembayaran} />
                </div>

                {/* ===== Penanggung Jawab & Asuransi ===== */}
                <div className="mt-4 pt-3 border-t border-[var(--border-primary)]">
                  <p className="text-tiny font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Penanggung Jawab & Asuransi
                  </p>
                  <div className="space-y-1.5 text-sm">
                    <InfoRow label="Nama" value={k.penanggungJawab} />
                    <InfoRow label="Hubungan" value={k.hubunganPj} />
                    <InfoRow label="Perujuk" value={k.namaPerujuk} />
                    <InfoRow label="Asuransi" value={k.asuransi?.namaPerusahaan || k.asuransi?.nama_perusahaan} />
                    <InfoRow label="No. Asuransi" value={k.noAsuransi} mono />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border-primary)]">
                  <Badge tone={PRIORITY_BADGE[k.statusPrioritas] || 'normal'} variant="soft">
                    Prioritas: {k.statusPrioritas || 'normal'}
                  </Badge>
                </div>

                {/* ===== Aksi saat pemeriksaan ===== */}
                <div className="mt-4 pt-3 border-t border-[var(--border-primary)] space-y-2">
                  <Btn variant="outline" size="sm" className="w-full justify-start" type="button" onClick={openRiwayat}>
                    Lihat Riwayat Kunjungan
                  </Btn>
                  <Btn variant="outline" size="sm" className="w-full justify-start" type="button" onClick={buatJanji}>
                    Buat Janji Kunjungan
                  </Btn>
                  <Btn variant="outline" size="sm" className="w-full justify-start" type="button" onClick={buatResepLuar}>
                    Buat Resep Luar
                  </Btn>
                  <Btn variant="outline" size="sm" className="w-full justify-start" type="button" onClick={buatSurat}>
                    Buat Surat
                  </Btn>
                </div>
              </Card>
            </div>

          </form>
        </div>

        {/* ===== STICKY BOTTOM ACTION BAR (overlay) ===== */}
        <div className={`fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/95 backdrop-blur shadow-[0_-8px_24px_rgba(0,0,0,0.08)] ${sidebarOffset}`}>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 px-4 md:px-6 xl:px-8 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <Badge tone={STATUS_BADGE[k.status] || 'neutral'} variant="soft">{k.status}</Badge>
              <span className="hidden sm:block text-tiny text-[var(--text-muted)] truncate">
                {p?.nama || '-'} · {k.noPendaftaran || '-'}
              </span>
            </div>
            <div className="sm:ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {k.status === 'selesai' ? (
                <>
                  <span className="text-tiny text-[var(--text-muted)] hidden sm:block">Pemeriksaan sudah selesai</span>
                  <Btn variant="secondary" className="flex-1 sm:flex-none justify-center" type="button" onClick={goBackToList}>
                    Kembali ke Antrian
                  </Btn>
                </>
              ) : (
                <>
                  <Btn variant="secondary" className="flex-1 sm:flex-none justify-center" type="button" disabled={saving} onClick={() => handleSave('draft')}>
                    {saving ? 'Menyimpan…' : 'Simpan Draft'}
                  </Btn>
                  <Btn variant="primary" className="flex-1 sm:flex-none justify-center" type="button" disabled={saving} onClick={() => handleSave('final')}>
                    Simpan & Selesaikan Pemeriksaan
                  </Btn>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ===== Modal Riwayat Kunjungan ===== */}
        <Modal open={riwayatOpen} onClose={() => setRiwayatOpen(false)} title={`Riwayat Kunjungan — ${p?.nama || '-'}`} size="xl">
          {riwayatLoading ? (
            <p className="text-sm text-[var(--text-muted)]">Memuat riwayat kunjungan…</p>
          ) : riwayatList.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Tidak ada kunjungan lain untuk pasien ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-tiny text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                    <th className="py-2 pr-3 font-semibold">No. Pendaftaran</th>
                    <th className="py-2 pr-3 font-semibold">Tanggal</th>
                    <th className="py-2 pr-3 font-semibold">Poli</th>
                    <th className="py-2 pr-3 font-semibold">Dokter</th>
                    <th className="py-2 pr-3 font-semibold">Status</th>
                    <th className="py-2 font-semibold w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatList.map((row) => (
                    <tr key={row.id} className="border-b border-[var(--border-primary)] last:border-b-0">
                      <td className="py-2 pr-3 font-mono text-tiny font-semibold text-[var(--brand-primary)]">{row.noPendaftaran || '-'}</td>
                      <td className="py-2 pr-3 text-[var(--text-secondary)]">{row.tglJamKunjungan ? formatDateID(row.tglJamKunjungan) : '-'}</td>
                      <td className="py-2 pr-3 text-[var(--text-primary)]">{row.poli?.nama || '-'}</td>
                      <td className="py-2 pr-3 text-[var(--text-primary)]">{row.dokter?.nama || '-'}</td>
                      <td className="py-2 pr-3"><Badge tone={STATUS_BADGE[row.status] || 'neutral'} variant="soft">{row.status}</Badge></td>
                      <td className="py-2">
                        <div className="flex items-center gap-1.5">
                          <Btn size="sm" variant="outline" type="button" onClick={() => openDetail(row)}>
                            Detail Diagnosa
                          </Btn>
                          {row.hasTtv && (
                            <Btn size="sm" variant="ghost" type="button" onClick={() => { setRiwayatOpen(false); openExam(row) }}>
                              Buka
                            </Btn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>

        {/* ===== Modal Detail Diagnosa Pemeriksaan Sebelumnya ===== */}
        <Modal
          open={detailOpen}
          onClose={() => { setDetailOpen(false); setDetailExam(null); setDetailKunjungan(null) }}
          title={`Detail Pemeriksaan — ${detailKunjungan?.noPendaftaran || '-'}`}
          size="xl"
        >
          {detailLoading ? (
            <p className="text-sm text-[var(--text-muted)]">Memuat detail pemeriksaan…</p>
          ) : !detailExam ? (
            <p className="text-sm text-[var(--text-muted)]">
              Belum ada catatan pemeriksaan dokter untuk kunjungan ini.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Info kunjungan */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <InfoRow label="No. Pendaftaran" value={detailKunjungan?.noPendaftaran} mono />
                <InfoRow label="Poli" value={detailKunjungan?.poli?.nama} />
                <InfoRow label="Dokter" value={detailKunjungan?.dokter?.nama} />
                <InfoRow label="Status" value={detailKunjungan?.status} />
              </div>

              {/* Registrasi */}
              <div>
                <p className="text-tiny font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Keluhan & Registrasi
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <InfoRow label="Keluhan Utama" value={detailExam.registrasi?.keluhan_utama || detailExam.registrasi?.keluhanUtama} />
                  <InfoRow label="Jenis Kunjungan" value={detailExam.registrasi?.jenis_kunjungan || detailExam.registrasi?.jenisKunjungan} />
                  <InfoRow label="Status Prioritas" value={detailExam.registrasi?.status_prioritas || detailExam.registrasi?.statusPrioritas} />
                </div>
              </div>

              {/* Diagnosa */}
              <div>
                <p className="text-tiny font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Diagnosa
                </p>
                {(!detailExam.diagnosa?.rows || detailExam.diagnosa.rows.length === 0) ? (
                  <p className="text-sm text-[var(--text-muted)]">Tidak ada diagnosa tercatat.</p>
                ) : (
                  <div className="overflow-x-auto border border-[var(--border-primary)] rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-tiny text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                          <th className="py-2 px-3 font-semibold w-28">Kode ICD</th>
                          <th className="py-2 px-3 font-semibold">Nama Diagnosa</th>
                          <th className="py-2 px-3 font-semibold w-32">Status</th>
                          <th className="py-2 px-3 font-semibold">Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailExam.diagnosa.rows.map((d, i) => (
                          <tr key={d.id || i} className="border-b border-[var(--border-primary)] last:border-b-0">
                            <td className="py-2 px-3 font-mono text-tiny">{d.kodeIcd || '-'}</td>
                            <td className="py-2 px-3 text-[var(--text-primary)]">{d.namaDiagnosa || '-'}</td>
                            <td className="py-2 px-3">
                              <Badge tone={d.status === 'utama' ? 'danger' : d.status === 'sekunder' ? 'warning' : d.status === 'komplikasi' ? 'info' : 'neutral'} variant="soft">
                                {DIAGNOSA_STATUS_LABEL[d.status] || d.status || '-'}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-[var(--text-secondary)]">{d.catatan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pemberian Obat */}
              <div>
                <p className="text-tiny font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Pemberian Obat
                </p>
                {(!detailExam.pemberianObat || (Array.isArray(detailExam.pemberianObat) ? detailExam.pemberianObat.length === 0 : !detailExam.pemberianObat.rows || detailExam.pemberianObat.rows.length === 0)) ? (
                  <p className="text-sm text-[var(--text-muted)]">Tidak ada pemberian obat.</p>
                ) : (
                  <div className="overflow-x-auto border border-[var(--border-primary)] rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-tiny text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                          <th className="py-2 px-3 font-semibold">Nama Obat</th>
                          <th className="py-2 px-3 font-semibold w-32">Harga</th>
                          <th className="py-2 px-3 font-semibold w-24">Jumlah</th>
                          <th className="py-2 px-3 font-semibold w-32">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(detailExam.pemberianObat) ? detailExam.pemberianObat : detailExam.pemberianObat.rows).map((o, i) => (
                          <tr key={o.id || i} className="border-b border-[var(--border-primary)] last:border-b-0">
                            <td className="py-2 px-3 text-[var(--text-primary)]">{o.namaObat || '-'}</td>
                            <td className="py-2 px-3 font-mono text-tiny">{fmtRupiah(o.harga)}</td>
                            <td className="py-2 px-3">{o.jumlah || 0}</td>
                            <td className="py-2 px-3 font-mono text-tiny">{fmtRupiah((Number(o.harga) || 0) * (Number(o.jumlah) || 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pemberian Tindakan */}
              <div>
                <p className="text-tiny font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Pemberian Tindakan
                </p>
                {(!detailExam.pemberianTindakan?.rows || detailExam.pemberianTindakan.rows.length === 0) ? (
                  <p className="text-sm text-[var(--text-muted)]">Tidak ada tindakan.</p>
                ) : (
                  <div className="overflow-x-auto border border-[var(--border-primary)] rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-tiny text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                          <th className="py-2 px-3 font-semibold">Tindakan</th>
                          <th className="py-2 px-3 font-semibold w-24">Jumlah</th>
                          <th className="py-2 px-3 font-semibold w-32">Biaya</th>
                          <th className="py-2 px-3 font-semibold">Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailExam.pemberianTindakan.rows.map((t, i) => (
                          <tr key={t.id || i} className="border-b border-[var(--border-primary)] last:border-b-0">
                            <td className="py-2 px-3 text-[var(--text-primary)]">{t.namaTindakan || '-'}</td>
                            <td className="py-2 px-3">{t.jumlah || 0}</td>
                            <td className="py-2 px-3 font-mono text-tiny">{fmtRupiah(t.biaya)}</td>
                            <td className="py-2 px-3 text-[var(--text-secondary)]">{t.catatan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Catatan Dokter */}
              <div>
                <p className="text-tiny font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Catatan Pemeriksaan
                </p>
                {(!detailExam.catatan?.rows || detailExam.catatan.rows.length === 0) ? (
                  <p className="text-sm text-[var(--text-muted)]">Tidak ada catatan.</p>
                ) : (
                  <div className="overflow-x-auto border border-[var(--border-primary)] rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-tiny text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                          <th className="py-2 px-3 font-semibold">Diagnosa</th>
                          <th className="py-2 px-3 font-semibold">Terapi</th>
                          <th className="py-2 px-3 font-semibold">Tindak Lanjut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailExam.catatan.rows.map((c, i) => (
                          <tr key={c.id || i} className="border-b border-[var(--border-primary)] last:border-b-0">
                            <td className="py-2 px-3 text-[var(--text-primary)]">{c.diagnosa || '-'}</td>
                            <td className="py-2 px-3 text-[var(--text-primary)]">{c.terapi || '-'}</td>
                            <td className="py-2 px-3 text-[var(--text-primary)]">{c.tindakLanjut || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    )
  }

  // ===== QUEUE TABLE VIEW (per selected poli) =====
  if (selectedPoli) {
    const queue = queueByPoli[selectedPoli.id] || []
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-secondary)]">
        <div className="p-4 md:p-6 xl:p-8">
          <div className="sticky top-0 z-[5] -mx-4 md:-mx-6 xl:-mx-8 bg-[var(--bg-secondary)]/95 border-b border-[var(--border-primary)] px-4 md:px-6 xl:px-8 py-4 mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setSelectedPoli(null); setSearchParams({}) }}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
              title="Kembali ke daftar poli"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div className="flex items-center gap-1.5 text-tiny text-[var(--text-muted)]">
              <span>Pemeriksaan Dokter</span>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              <span className="text-[var(--text-primary)] font-medium">{selectedPoli.nama}</span>
            </div>
            <Badge tone="warning" variant="soft" className="ml-auto">{queue.length} pasien</Badge>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center" style={{ color: 'var(--border-primary)' }}><div className="w-full border-t border-[var(--border-primary)]" /></div>
            <div className="relative flex justify-center">
              <span className="px-4 text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-secondary)] uppercase tracking-wider">
                Antrean Pasien — {selectedPoli.nama}
              </span>
            </div>
          </div>

          <TabelMaster
            columns={[
              { key: 'noPendaftaran', label: 'No. Pendaftaran', sortable: true, width: '150px', render: (v) => <span className="font-mono text-tiny font-semibold text-[var(--brand-primary)]">{v || '-'}</span> },
              { key: 'pasienNama', label: 'Nama Pasien', sortable: true, render: (_, row) => (
                <div>
                  <div className="font-medium text-[var(--text-primary)]">{row.pasien?.nama || '-'}</div>
                  <div className="text-tiny text-[var(--text-muted)] font-mono">{row.pasien?.noRm || '-'}</div>
                </div>
              )},
              { key: 'ttvFlag', label: 'TTV', width: '110px', render: (_, row) => (
                row.hasTtv
                  ? <Badge tone="success" variant="soft">TTV Siap</Badge>
                  : <Badge tone="neutral" variant="soft">Belum TTV</Badge>
              )},
              { key: 'status', label: 'Status', width: '110px', render: (v) => <Badge tone={STATUS_BADGE[v] || 'neutral'}>{v}</Badge> },
              { key: 'prioritas', label: 'Prioritas', width: '100px', render: (_, row) => <Badge tone={PRIORITY_BADGE[row.statusPrioritas] || 'normal'}>{row.statusPrioritas || 'normal'}</Badge> },
              { key: 'dokterNama', label: 'Dokter', render: (_, row) => row.dokter?.nama || '-' },
              { key: 'action', label: 'Aksi', width: '140px', render: (_, row) => {
                if (row.status === 'selesai') {
                  return (
                    <Btn size="sm" variant="ghost" onClick={() => openExam(row)} title="Lihat hasil pemeriksaan">
                      Lihat Hasil
                    </Btn>
                  )
                }
                if (row.status === 'batal') {
                  return <span className="text-tiny text-[var(--text-muted)]">Dibatalkan</span>
                }
                return row.hasTtv ? (
                  <Btn size="sm" variant="primary" onClick={() => openExam(row)}>
                    Lakukan Pemeriksaan
                  </Btn>
                ) : (
                  <Btn size="sm" variant="ghost" type="button">
                    Belum ada TTV
                  </Btn>
                )
              }},
            ]}
            data={queue}
            searchKey={['noPendaftaran', 'pasienNama', 'dokterNama']}
            searchPlaceholder="Cari pasien / no pendaftaran…"
            loading={false}
            emptyMessage="Tidak ada pasien pada antrean poli ini."
          />
        </div>
      </div>
    )
  }

  // ===== POLI CARDS VIEW =====
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-secondary)]">
      <div className="p-4 md:p-6 xl:p-8">
        <div className="sticky top-0 z-[5] -mx-4 md:-mx-6 xl:-mx-8 bg-[var(--bg-secondary)]/95 border-b border-[var(--border-primary)] px-4 md:px-6 xl:px-8 py-4 mb-4">
          <div className="flex items-center gap-2 text-tiny text-[var(--text-muted)]">
            <span>Front Office</span>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            <span className="text-[var(--text-primary)] font-medium">Pemeriksaan Dokter</span>
          </div>
          <p className="text-tiny text-[var(--text-secondary)] mt-0.5">
            Total antrian hari ini: <strong className="text-[var(--text-primary)]">{kunjunganList.length}</strong>
          </p>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center" style={{ color: 'var(--border-primary)' }}><div className="w-full border-t border-[var(--border-primary)]" /></div>
          <div className="relative flex justify-center">
            <span className="px-4 text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-secondary)] uppercase tracking-wider">
              Pilih Poli
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-[var(--text-muted)]">Memuat daftar poli…</div>
        ) : poliList.length === 0 ? (
          <div className="text-[var(--text-muted)]">Belum ada poli di branch ini.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {poliList.map((poli) => {
              const queue = queueByPoli[poli.id] || []
              const withTtv = queue.filter((k) => k.hasTtv).length
              const total = queue.length
              return (
                <Card key={poli.id} className="p-4 hover:border-[var(--brand-primary)]/40 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)]">{poli.nama}</h3>
                      <p className="text-tiny text-[var(--text-muted)] font-mono">{poli.kode}</p>
                    </div>
                    <Badge tone={total > 0 ? 'warning' : 'success'} variant="soft">
                      {total} antrian
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-[var(--text-muted)]">TTV siap</span>
                    <span className="font-mono font-semibold text-[var(--text-success)]">{withTtv}/{total}</span>
                  </div>

                  {total > 0 ? (
                    <Btn
                      size="sm"
                      variant="primary"
                      className="w-full mt-3"
                      onClick={() => {
                        setSelectedPoli(poli)
                        setSearchParams({ poli: String(poli.id) })
                      }}
                    >
                      Lihat Antrean
                    </Btn>
                  ) : (
                    <Btn size="sm" variant="ghost" className="w-full mt-3" type="button">
                      Kosong
                    </Btn>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function formatDateID(dt) {
  if (!dt) return '-'
  const d = new Date(dt)
  if (isNaN(d.getTime())) return dt
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
