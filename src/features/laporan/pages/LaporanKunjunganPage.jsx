// ============================================================
// features/laporan/pages/LaporanKunjunganPage.jsx
// Laporan Kunjungan (URL /kunjungan). Data selalu di-scope
// branch_id aktif; beberapa jenis report dipisah dalam TAB.
// Export Excel (xlsx) + Cetak/PDF (kop laporan standar klinik).
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { Card, Badge, Btn, Select, PageHeader } from '../../../shared/components/ui.jsx'
import { DataTable } from '../../../shared/components/ui.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import { fetchBranches } from '../../../shared/branches.js'
import { fetchKunjungan } from '../../front-office/service/kunjunganService.js'

// ==================== KONSTANTA ====================

const STATUS_LABEL = { terdaftar: 'Terdaftar', menunggu: 'Menunggu', diperiksa: 'Diperiksa', selesai: 'Selesai', batal: 'Batal' }
const STATUS_TONE = { terdaftar: 'info', menunggu: 'warning', diperiksa: 'success', selesai: 'success', batal: 'danger' }
const JENIS_LABEL = { baru: 'Baru', lama: 'Lama', kontrol: 'Kontrol', rujukan: 'Rujukan', langsung: 'Langsung' }
const PEMBAYARAN_LABEL = { tunai: 'Tunai', asuransi: 'Asuransi', bpjs: 'BPJS', transfer: 'Transfer', qris: 'QRIS' }

const TABS = [
  { key: 'rekap', label: 'Rekap Kunjungan' },
  { key: 'harian', label: 'Kunjungan Harian' },
  { key: 'bulanan', label: 'Kunjungan Bulanan' },
  { key: 'poli', label: 'Per Poli' },
  { key: 'dokter', label: 'Per Dokter' },
  { key: 'rincian', label: 'Rincian Kunjungan' },
  { key: 'batal', label: 'Kunjungan Dibatalkan' },
]

const STATUS_ORDER = ['terdaftar', 'menunggu', 'diperiksa', 'selesai', 'batal']

// ==================== HELPER ====================

function today() { return new Date().toISOString().slice(0, 10) }

function fmtTanggal(val, opts) {
  if (!val) return '-'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return String(val)
  return d.toLocaleDateString('id-ID', opts || { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtJam(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function fmtBulan(key) {
  // key: YYYY-MM
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
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

function groupBy(list, keyFn) {
  const map = new Map()
  for (const item of list) {
    const key = keyFn(item)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }
  return map
}

function countStatus(items, status) {
  return items.filter((i) => i.status === status).length
}

// ==================== KARTU ANGKA ====================

function StatCard({ label, value, sub, tone = 'brand' }) {
  return (
    <Card className="p-4">
      <p className="text-caption font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className={`mt-1.5 text-3xl font-semibold font-mono tabular-nums ${
        tone === 'success' ? 'text-[var(--status-success)]'
          : tone === 'danger' ? 'text-[var(--status-danger)]'
            : tone === 'warning' ? 'text-[var(--status-warning)]'
              : 'text-[var(--text-primary)]'
      }`}>{value}</p>
      {sub && <p className="mt-1 text-tiny text-[var(--text-secondary)]">{sub}</p>}
    </Card>
  )
}

// ==================== TABEL AGREGAT (polos, untuk report) ====================

function ReportTable({ head, children, footer }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-body-sm">
          <thead>
            <tr>
              {head.map((h, i) => (
                <th
                  key={i}
                  className={`whitespace-nowrap border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2.5 text-tiny font-semibold uppercase tracking-wide text-[var(--text-tertiary)] ${
                    h.align === 'right' ? 'text-right' : h.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr:not(:last-child)>td]:border-b [&>tr>td]:border-[var(--border-primary)] [&>tr:hover]:bg-[var(--bg-hover)]">
            {children}
          </tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </table>
      </div>
    </Card>
  )
}

function CellNum({ value }) {
  return <td className="px-4 py-2.5 text-right font-mono tabular-nums">{value}</td>
}

function CellTxt({ children, mono = false, muted = false }) {
  return <td className={`px-4 py-2.5 ${mono ? 'font-mono' : ''} ${muted ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>{children}</td>
}

function BadgeStatus({ status }) {
  return <Badge tone={STATUS_TONE[status] || 'neutral'}>{STATUS_LABEL[status] || status}</Badge>
}

// ==================== HALAMAN ====================

export default function LaporanKunjunganPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'rekap'

  const [branchId, setBranchId] = useState(getCurrentBranchId())
  const [branchName, setBranchName] = useState('-')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter laporan
  const [dateFrom, setDateFrom] = useState(today())
  const [dateTo, setDateTo] = useState(today())
  const [tipe, setTipe] = useState('')

  // Selalu ikuti branch aktif (ganti branch → muat ulang data branch itu)
  useEffect(() => {
    const onBranchChange = () => setBranchId(getCurrentBranchId())
    window.addEventListener('branch:changed', onBranchChange)
    return () => window.removeEventListener('branch:changed', onBranchChange)
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!branchId) { setLoading(false); return }
    fetchBranches({ force: true }).then((branches) => {
      if (cancelled) return
      const b = branches.find((x) => String(x.id) === String(branchId))
      setBranchName(b?.name || b?.nama || `Branch ${branchId}`)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [branchId])

  // Muat data kunjungan branch aktif sesuai filter
  useEffect(() => {
    if (!branchId) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    setError('')
    const params = { limit: 500 }
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    if (tipe) params.tipe = tipe
    fetchKunjungan(branchId, params)
      .then((data) => { if (!cancelled) setRows(data) })
      .catch((err) => {
        console.error('[LaporanKunjungan] gagal memuat data:', err)
        if (!cancelled) setError(err?.response?.data?.message || 'Gagal memuat data kunjungan')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [branchId, dateFrom, dateTo, tipe])

  const setTab = (key) => setSearchParams({ tab: key })

  // ==================== AGREGASI ====================

  const stats = useMemo(() => ({
    total: rows.length,
    rawatJalan: rows.filter((r) => r.tipeKunjungan === 'rawat_jalan').length,
    rawatInap: rows.filter((r) => r.tipeKunjungan === 'rawat_inap').length,
    selesai: countStatus(rows, 'selesai'),
    batal: countStatus(rows, 'batal'),
    baru: rows.filter((r) => r.jenisKunjungan === 'baru').length,
  }), [rows])

  const statusMatrix = useMemo(() => STATUS_ORDER.map((s) => ({
    status: s,
    label: STATUS_LABEL[s],
    rawatJalan: rows.filter((r) => r.status === s && r.tipeKunjungan === 'rawat_jalan').length,
    rawatInap: rows.filter((r) => r.status === s && r.tipeKunjungan === 'rawat_inap').length,
    total: rows.filter((r) => r.status === s).length,
  })), [rows])

  const harian = useMemo(() => {
    const map = groupBy(rows, (r) => (r.tglJamKunjungan || '').slice(0, 10))
    return [...map.entries()]
      .filter(([k]) => k)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([tanggal, items]) => ({
        tanggal,
        rawatJalan: items.filter((i) => i.tipeKunjungan === 'rawat_jalan').length,
        rawatInap: items.filter((i) => i.tipeKunjungan === 'rawat_inap').length,
        selesai: countStatus(items, 'selesai'),
        batal: countStatus(items, 'batal'),
        total: items.length,
      }))
  }, [rows])

  const bulanan = useMemo(() => {
    const map = groupBy(rows, (r) => (r.tglJamKunjungan || '').slice(0, 7))
    return [...map.entries()]
      .filter(([k]) => k)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([bulan, items]) => ({
        bulan,
        label: fmtBulan(bulan),
        rawatJalan: items.filter((i) => i.tipeKunjungan === 'rawat_jalan').length,
        rawatInap: items.filter((i) => i.tipeKunjungan === 'rawat_inap').length,
        selesai: countStatus(items, 'selesai'),
        batal: countStatus(items, 'batal'),
        total: items.length,
      }))
  }, [rows])

  const perPoli = useMemo(() => {
    const map = groupBy(rows, (r) => r.poli?.nama || '(Tanpa Poli)')
    return [...map.entries()]
      .map(([nama, items]) => ({
        nama,
        total: items.length,
        terdaftar: countStatus(items, 'terdaftar'),
        menunggu: countStatus(items, 'menunggu'),
        diperiksa: countStatus(items, 'diperiksa'),
        selesai: countStatus(items, 'selesai'),
        batal: countStatus(items, 'batal'),
      }))
      .sort((a, b) => b.total - a.total)
  }, [rows])

  const perDokter = useMemo(() => {
    const map = groupBy(rows, (r) => r.dokter?.nama || r.dokterPengganti?.nama || '(Tanpa Dokter)')
    return [...map.entries()]
      .map(([nama, items]) => ({
        nama,
        poli: [...new Set(items.map((i) => i.poli?.nama).filter(Boolean))].join(', '),
        total: items.length,
        selesai: countStatus(items, 'selesai'),
        batal: countStatus(items, 'batal'),
      }))
      .sort((a, b) => b.total - a.total)
  }, [rows])

  const dibatalkan = useMemo(() => rows.filter((r) => r.status === 'batal'), [rows])

  // ==================== EXPORT & CETAK ====================

  const periodeLabel = () => {
    if (dateFrom && dateTo && dateFrom === dateTo) return fmtTanggal(dateFrom, { day: 'numeric', month: 'long', year: 'numeric' })
    if (dateFrom && dateTo) return `${fmtTanggal(dateFrom)} s.d. ${fmtTanggal(dateTo)}`
    if (dateFrom) return `Sejak ${fmtTanggal(dateFrom)}`
    if (dateTo) return `s.d. ${fmtTanggal(dateTo)}`
    return 'Semua tanggal'
  }

  const judulTab = TABS.find((t) => t.key === tab)?.label || ''

  const exportExcel = () => {
    let sheets = []
    const header = {
      'Klinik': 'Medicore Clinic',
      'Branch': branchName,
      'Laporan': judulTab,
      'Periode': periodeLabel(),
    }
    if (tab === 'rekap') {
      sheets = [{
        name: 'Rekap Status',
        rows: [
          header,
          ...statusMatrix.map((s, i) => ({
            No: i + 1, Status: s.label, 'Rawat Jalan': s.rawatJalan, 'Rawat Inap': s.rawatInap, Total: s.total,
          })),
          {},
          { No: '', Status: 'TOTAL', 'Rawat Jalan': stats.rawatJalan, 'Rawat Inap': stats.rawatInap, Total: stats.total },
        ],
      }]
    } else if (tab === 'harian') {
      sheets = [{ name: 'Kunjungan Harian', rows: [header, ...harian.map((r, i) => ({
        No: i + 1, Tanggal: fmtTanggal(r.tanggal, { day: '2-digit', month: 'long', year: 'numeric' }), 'Rawat Jalan': r.rawatJalan, 'Rawat Inap': r.rawatInap, Selesai: r.selesai, Batal: r.batal, Total: r.total,
      }))] }]
    } else if (tab === 'bulanan') {
      sheets = [{ name: 'Kunjungan Bulanan', rows: [header, ...bulanan.map((r, i) => ({
        No: i + 1, Bulan: r.label, 'Rawat Jalan': r.rawatJalan, 'Rawat Inap': r.rawatInap, Selesai: r.selesai, Batal: r.batal, Total: r.total,
      }))] }]
    } else if (tab === 'poli') {
      sheets = [{ name: 'Per Poli', rows: [header, ...perPoli.map((r, i) => ({
        No: i + 1, Poli: r.nama, Terdaftar: r.terdaftar, Menunggu: r.menunggu, Diperiksa: r.diperiksa, Selesai: r.selesai, Batal: r.batal, Total: r.total,
      }))] }]
    } else if (tab === 'dokter') {
      sheets = [{ name: 'Per Dokter', rows: [header, ...perDokter.map((r, i) => ({
        No: i + 1, Dokter: r.nama, Poli: r.poli, Selesai: r.selesai, Batal: r.batal, Total: r.total,
      }))] }]
    } else if (tab === 'rincian' || tab === 'batal') {
      const source = tab === 'batal' ? dibatalkan : rows
      sheets = [{ name: 'Rincian Kunjungan', rows: [header, ...source.map((r, i) => ({
        No: i + 1,
        'No. Pendaftaran': r.noPendaftaran,
        Tanggal: fmtTanggal(r.tglJamKunjungan),
        Jam: fmtJam(r.tglJamKunjungan),
        'No. RM': r.pasien?.noRm || '-',
        Pasien: r.pasien?.nama || '-',
        'JK': r.pasien?.jenisKelamin === 'L' ? 'L' : r.pasien?.jenisKelamin === 'P' ? 'P' : '-',
        Umur: hitungUsia(r.pasien?.tanggalLahir),
        Poli: r.poli?.nama || '-',
        Dokter: r.dokter?.nama || r.dokterPengganti?.nama || '-',
        Jenis: JENIS_LABEL[r.jenisKunjungan] || r.jenisKunjungan || '-',
        Pembayaran: PEMBAYARAN_LABEL[r.metodePembayaran] || r.metodePembayaran || '-',
        Status: STATUS_LABEL[r.status] || r.status,
      }))] }]
    }
    const wb = XLSX.utils.book_new()
    sheets.forEach((s) => {
      const ws = XLSX.utils.json_to_sheet(s.rows, { skipHeader: false })
      XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31))
    })
    XLSX.writeFile(wb, `laporan-kunjungan-${tab}-${dateFrom || 'all'}.xlsx`)
  }

  const cetakPdf = () => {
    const w = window.open('', '_blank', 'width=1100,height=700')
    if (!w) return
    const dicetak = fmtTanggal(new Date(), { day: 'numeric', month: 'long', year: 'numeric' })
    const buildTable = (head, bodyRows) => `<table cellspacing="0"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${bodyRows}</tbody></table>`

    let body = ''
    if (tab === 'rekap') {
      body = buildTable(
        ['No', 'Status', 'Rawat Jalan', 'Rawat Inap', 'Total'],
        statusMatrix.map((s, i) => `<tr><td class="c">${i + 1}</td><td>${s.label}</td><td class="r">${s.rawatJalan}</td><td class="r">${s.rawatInap}</td><td class="r"><b>${s.total}</b></td></tr>`)
          .join('') + `<tr class="tot"><td colspan="4" class="r"><b>TOTAL KUNJUNGAN</b></td><td class="r"><b>${stats.total}</b></td></tr>`,
      )
    } else if (tab === 'harian') {
      body = buildTable(
        ['No', 'Tanggal', 'Rawat Jalan', 'Rawat Inap', 'Selesai', 'Batal', 'Total'],
        harian.map((r, i) => `<tr><td class="c">${i + 1}</td><td>${fmtTanggal(r.tanggal, { day: '2-digit', month: 'long', year: 'numeric' })}</td><td class="r">${r.rawatJalan}</td><td class="r">${r.rawatInap}</td><td class="r">${r.selesai}</td><td class="r">${r.batal}</td><td class="r"><b>${r.total}</b></td></tr>`).join(''),
      )
    } else if (tab === 'bulanan') {
      body = buildTable(
        ['No', 'Bulan', 'Rawat Jalan', 'Rawat Inap', 'Selesai', 'Batal', 'Total'],
        bulanan.map((r, i) => `<tr><td class="c">${i + 1}</td><td>${r.label}</td><td class="r">${r.rawatJalan}</td><td class="r">${r.rawatInap}</td><td class="r">${r.selesai}</td><td class="r">${r.batal}</td><td class="r"><b>${r.total}</b></td></tr>`).join(''),
      )
    } else if (tab === 'poli') {
      body = buildTable(
        ['No', 'Poli', 'Terdaftar', 'Menunggu', 'Diperiksa', 'Selesai', 'Batal', 'Total'],
        perPoli.map((r, i) => `<tr><td class="c">${i + 1}</td><td>${r.nama}</td><td class="r">${r.terdaftar}</td><td class="r">${r.menunggu}</td><td class="r">${r.diperiksa}</td><td class="r">${r.selesai}</td><td class="r">${r.batal}</td><td class="r"><b>${r.total}</b></td></tr>`).join(''),
      )
    } else if (tab === 'dokter') {
      body = buildTable(
        ['No', 'Dokter', 'Poli', 'Selesai', 'Batal', 'Total'],
        perDokter.map((r, i) => `<tr><td class="c">${i + 1}</td><td>${r.nama}</td><td>${r.poli || '-'}</td><td class="r">${r.selesai}</td><td class="r">${r.batal}</td><td class="r"><b>${r.total}</b></td></tr>`).join(''),
      )
    } else {
      const source = tab === 'batal' ? dibatalkan : rows
      body = buildTable(
        ['No', 'No. Pendaftaran', 'Tanggal', 'No. RM', 'Nama Pasien', 'Poli', 'Dokter', 'Jenis', 'Status'],
        source.map((r, i) => `<tr><td class="c">${i + 1}</td><td class="mono">${r.noPendaftaran || '-'}</td><td>${fmtTanggal(r.tglJamKunjungan)} ${fmtJam(r.tglJamKunjungan)}</td><td class="mono">${r.pasien?.noRm || '-'}</td><td>${r.pasien?.nama || '-'}</td><td>${r.poli?.nama || '-'}</td><td>${r.dokter?.nama || r.dokterPengganti?.nama || '-'}</td><td>${JENIS_LABEL[r.jenisKunjungan] || '-'}</td><td>${STATUS_LABEL[r.status] || r.status}</td></tr>`).join(''),
      )
    }

    const ttd = `
      <div class="ttd">
        <div><p>Mengetahui,</p><p>Kepala Klinik</p><div class="sp"></div><p>(______________________)</p></div>
        <div><p>${dicetak}</p><p>Petugas Pelapor</p><div class="sp"></div><p>(______________________)</p></div>
      </div>`

    w.document.write(`<!doctype html><html><head><title>${judulTab} — Medicore Clinic</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 28px; color: #111; font-size: 12px; }
        .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 6px; }
        .kop h1 { font-size: 19px; margin: 0; letter-spacing: 1px; }
        .kop p { margin: 2px 0; font-size: 11px; }
        h2 { text-align: center; text-decoration: underline; font-size: 14px; margin: 14px 0 2px; }
        .periode { text-align: center; font-size: 11px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 5px 7px; text-align: left; }
        th { background: #eee; font-size: 11px; }
        td { font-size: 11px; }
        .r { text-align: right; } .c { text-align: center; } .mono { font-family: 'Courier New', monospace; }
        tr.tot td { background: #f5f5f5; }
        .ttd { display: flex; justify-content: space-between; margin-top: 36px; }
        .ttd div { width: 200px; text-align: center; font-size: 11px; }
        .ttd p { margin: 2px 0; }
        .sp { height: 44px; }
        @media print { body { margin: 12mm; } }
      </style></head><body>
        <div class="kop">
          <h1>MEDICORE CLINIC</h1>
          <p>Laporan Sistem Informasi Klinik — Branch: <b>${branchName}</b></p>
        </div>
        <h2>${judulTab.toUpperCase()}</h2>
        <p class="periode">Periode: <b>${periodeLabel()}</b></p>
        ${body}
        ${ttd}
      </body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 300)
  }

  // ==================== RENDER ====================

  const filterBar = (
    <Card className="mb-5 p-4">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
          <div>
            <label className="label">Dari Tanggal</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Sampai Tanggal</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Select
              label="Tipe Kunjungan"
              value={tipe}
              onChange={setTipe}
              options={[
                { value: '', label: 'Semua Tipe' },
                { value: 'rawat_jalan', label: 'Rawat Jalan' },
                { value: 'rawat_inap', label: 'Rawat Inap' },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="secondary" size="sm" onClick={() => { setDateFrom(today()); setDateTo(today()) }}>Hari Ini</Btn>
          <Btn variant="secondary" size="sm" onClick={() => { setDateFrom(''); setDateTo('') }}>Semua Tanggal</Btn>
          <Btn variant="secondary" size="sm" onClick={exportExcel} disabled={loading}>Excel</Btn>
          <Btn variant="primary" size="sm" onClick={cetakPdf} disabled={loading}>Cetak / PDF</Btn>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Kunjungan"
        desc={`Data kunjungan branch aktif: ${branchName} • Periode: ${periodeLabel()}`}
        actions={<Badge tone="primary" mono>{rows.length} data</Badge>}
      />

      {filterBar}

      {/* Tab navigasi */}
      <div className="overflow-x-auto border-b border-[var(--border-primary)]">
        <div className="flex min-w-max gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-body-sm font-medium transition-colors ${
                tab === t.key
                  ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card className="p-10 text-center text-body-sm text-[var(--text-muted)]">Memuat data kunjungan…</Card>
      ) : error ? (
        <Card className="p-10 text-center text-body-sm text-[var(--status-danger)]">{error}</Card>
      ) : (
        <>
          {/* ============ TAB: REKAP ============ */}
          {tab === 'rekap' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <StatCard label="Total Kunjungan" value={stats.total} />
                <StatCard label="Rawat Jalan" value={stats.rawatJalan} />
                <StatCard label="Rawat Inap" value={stats.rawatInap} />
                <StatCard label="Selesai" value={stats.selesai} tone="success" />
                <StatCard label="Kunjungan Baru" value={stats.baru} tone="warning" />
                <StatCard label="Dibatalkan" value={stats.batal} tone="danger" />
              </div>

              <ReportTable
                head={[
                  { label: 'No', align: 'center' },
                  { label: 'Status Kunjungan' },
                  { label: 'Rawat Jalan', align: 'right' },
                  { label: 'Rawat Inap', align: 'right' },
                  { label: 'Total', align: 'right' },
                ]}
                footer={
                  <tr className="bg-[var(--bg-secondary)] font-semibold">
                    <td colSpan={2} className="px-4 py-2.5 text-right font-semibold">TOTAL</td>
                    <CellNum value={stats.rawatJalan} />
                    <CellNum value={stats.rawatInap} />
                    <CellNum value={stats.total} />
                  </tr>
                }
              >
                {statusMatrix.map((s, i) => (
                  <tr key={s.status}>
                    <td className="px-4 py-2.5 text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                    <CellTxt><BadgeStatus status={s.status} /></CellTxt>
                    <CellNum value={s.rawatJalan} />
                    <CellNum value={s.rawatInap} />
                    <CellNum value={s.total} />
                  </tr>
                ))}
              </ReportTable>
            </>
          )}

          {/* ============ TAB: HARIAN ============ */}
          {tab === 'harian' && (
            <ReportTable
              head={[
                { label: 'No', align: 'center' },
                { label: 'Tanggal' },
                { label: 'Rawat Jalan', align: 'right' },
                { label: 'Rawat Inap', align: 'right' },
                { label: 'Selesai', align: 'right' },
                { label: 'Batal', align: 'right' },
                { label: 'Total', align: 'right' },
              ]}
              footer={
                <tr className="bg-[var(--bg-secondary)] font-semibold">
                  <td colSpan={2} className="px-4 py-2.5 text-right font-semibold">TOTAL</td>
                  <CellNum value={harian.reduce((a, r) => a + r.rawatJalan, 0)} />
                  <CellNum value={harian.reduce((a, r) => a + r.rawatInap, 0)} />
                  <CellNum value={harian.reduce((a, r) => a + r.selesai, 0)} />
                  <CellNum value={harian.reduce((a, r) => a + r.batal, 0)} />
                  <CellNum value={stats.total} />
                </tr>
              }
            >
              {harian.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-body-sm text-[var(--text-tertiary)]">Tidak ada data pada rentang tanggal ini</td></tr>
              ) : harian.map((r, i) => (
                <tr key={r.tanggal}>
                  <td className="px-4 py-2.5 text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                  <CellTxt>{fmtTanggal(r.tanggal, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</CellTxt>
                  <CellNum value={r.rawatJalan} />
                  <CellNum value={r.rawatInap} />
                  <CellNum value={r.selesai} />
                  <CellNum value={r.batal} />
                  <CellNum value={r.total} />
                </tr>
              ))}
            </ReportTable>
          )}

          {/* ============ TAB: BULANAN ============ */}
          {tab === 'bulanan' && (
            <ReportTable
              head={[
                { label: 'No', align: 'center' },
                { label: 'Bulan' },
                { label: 'Rawat Jalan', align: 'right' },
                { label: 'Rawat Inap', align: 'right' },
                { label: 'Selesai', align: 'right' },
                { label: 'Batal', align: 'right' },
                { label: 'Total', align: 'right' },
              ]}
              footer={
                <tr className="bg-[var(--bg-secondary)] font-semibold">
                  <td colSpan={2} className="px-4 py-2.5 text-right font-semibold">TOTAL</td>
                  <CellNum value={bulanan.reduce((a, r) => a + r.rawatJalan, 0)} />
                  <CellNum value={bulanan.reduce((a, r) => a + r.rawatInap, 0)} />
                  <CellNum value={bulanan.reduce((a, r) => a + r.selesai, 0)} />
                  <CellNum value={bulanan.reduce((a, r) => a + r.batal, 0)} />
                  <CellNum value={stats.total} />
                </tr>
              }
            >
              {bulanan.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-body-sm text-[var(--text-tertiary)]">Tidak ada data pada rentang tanggal ini</td></tr>
              ) : bulanan.map((r, i) => (
                <tr key={r.bulan}>
                  <td className="px-4 py-2.5 text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                  <CellTxt>{r.label}</CellTxt>
                  <CellNum value={r.rawatJalan} />
                  <CellNum value={r.rawatInap} />
                  <CellNum value={r.selesai} />
                  <CellNum value={r.batal} />
                  <CellNum value={r.total} />
                </tr>
              ))}
            </ReportTable>
          )}

          {/* ============ TAB: PER POLI ============ */}
          {tab === 'poli' && (
            <ReportTable
              head={[
                { label: 'No', align: 'center' },
                { label: 'Poli' },
                { label: 'Terdaftar', align: 'right' },
                { label: 'Menunggu', align: 'right' },
                { label: 'Diperiksa', align: 'right' },
                { label: 'Selesai', align: 'right' },
                { label: 'Batal', align: 'right' },
                { label: 'Total', align: 'right' },
              ]}
              footer={
                <tr className="bg-[var(--bg-secondary)] font-semibold">
                  <td colSpan={2} className="px-4 py-2.5 text-right font-semibold">TOTAL</td>
                  <CellNum value={perPoli.reduce((a, r) => a + r.terdaftar, 0)} />
                  <CellNum value={perPoli.reduce((a, r) => a + r.menunggu, 0)} />
                  <CellNum value={perPoli.reduce((a, r) => a + r.diperiksa, 0)} />
                  <CellNum value={perPoli.reduce((a, r) => a + r.selesai, 0)} />
                  <CellNum value={perPoli.reduce((a, r) => a + r.batal, 0)} />
                  <CellNum value={stats.total} />
                </tr>
              }
            >
              {perPoli.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-body-sm text-[var(--text-tertiary)]">Tidak ada data pada rentang tanggal ini</td></tr>
              ) : perPoli.map((r, i) => (
                <tr key={r.nama}>
                  <td className="px-4 py-2.5 text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                  <CellTxt>{r.nama}</CellTxt>
                  <CellNum value={r.terdaftar} />
                  <CellNum value={r.menunggu} />
                  <CellNum value={r.diperiksa} />
                  <CellNum value={r.selesai} />
                  <CellNum value={r.batal} />
                  <CellNum value={r.total} />
                </tr>
              ))}
            </ReportTable>
          )}

          {/* ============ TAB: PER DOKTER ============ */}
          {tab === 'dokter' && (
            <ReportTable
              head={[
                { label: 'No', align: 'center' },
                { label: 'Dokter' },
                { label: 'Poli' },
                { label: 'Selesai', align: 'right' },
                { label: 'Batal', align: 'right' },
                { label: 'Total', align: 'right' },
              ]}
              footer={
                <tr className="bg-[var(--bg-secondary)] font-semibold">
                  <td colSpan={3} className="px-4 py-2.5 text-right font-semibold">TOTAL</td>
                  <CellNum value={perDokter.reduce((a, r) => a + r.selesai, 0)} />
                  <CellNum value={perDokter.reduce((a, r) => a + r.batal, 0)} />
                  <CellNum value={stats.total} />
                </tr>
              }
            >
              {perDokter.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-body-sm text-[var(--text-tertiary)]">Tidak ada data pada rentang tanggal ini</td></tr>
              ) : perDokter.map((r, i) => (
                <tr key={r.nama}>
                  <td className="px-4 py-2.5 text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                  <CellTxt>{r.nama}</CellTxt>
                  <CellTxt muted>{r.poli || '-'}</CellTxt>
                  <CellNum value={r.selesai} />
                  <CellNum value={r.batal} />
                  <CellNum value={r.total} />
                </tr>
              ))}
            </ReportTable>
          )}

          {/* ============ TAB: RINCIAN ============ */}
          {tab === 'rincian' && (
            <DataTable
              rows={rows}
              rowKey={(r) => r.id}
              emptyText="Tidak ada kunjungan pada rentang tanggal ini"
              defaultPageSize={25}
              columns={[
                { key: 'noPendaftaran', label: 'No. Pendaftaran', mono: true, render: (r) => <span className="font-mono text-tiny font-semibold text-[var(--brand-primary)]">{r.noPendaftaran}</span> },
                { key: 'tglJamKunjungan', label: 'Tanggal', render: (r) => (
                  <div>
                    <div>{fmtTanggal(r.tglJamKunjungan)}</div>
                    <div className="text-tiny text-[var(--text-muted)]">{fmtJam(r.tglJamKunjungan)}</div>
                  </div>
                ) },
                { key: 'noRm', label: 'No. RM', mono: true, render: (r) => <span className="font-mono text-tiny">{r.pasien?.noRm || '-'}</span> },
                { key: 'namaPasien', label: 'Nama Pasien', render: (r) => (
                  <div>
                    <div className="font-medium">{r.pasien?.nama || '-'}</div>
                    <div className="text-tiny text-[var(--text-muted)]">{r.pasien?.jenisKelamin === 'L' ? 'Laki-laki' : r.pasien?.jenisKelamin === 'P' ? 'Perempuan' : '-'} • {hitungUsia(r.pasien?.tanggalLahir)}</div>
                  </div>
                ) },
                { key: 'poli', label: 'Poli', render: (r) => r.poli?.nama || '-' },
                { key: 'dokter', label: 'Dokter', render: (r) => r.dokter?.nama || r.dokterPengganti?.nama || '-' },
                { key: 'jenisKunjungan', label: 'Jenis', render: (r) => JENIS_LABEL[r.jenisKunjungan] || r.jenisKunjungan || '-' },
                { key: 'metodePembayaran', label: 'Pembayaran', render: (r) => PEMBAYARAN_LABEL[r.metodePembayaran] || r.metodePembayaran || '-' },
                { key: 'status', label: 'Status', render: (r) => <BadgeStatus status={r.status} /> },
              ]}
            />
          )}

          {/* ============ TAB: DIBATALKAN ============ */}
          {tab === 'batal' && (
            <DataTable
              rows={dibatalkan}
              rowKey={(r) => r.id}
              emptyText="Tidak ada kunjungan dibatalkan pada rentang tanggal ini"
              defaultPageSize={25}
              columns={[
                { key: 'noPendaftaran', label: 'No. Pendaftaran', mono: true, render: (r) => <span className="font-mono text-tiny font-semibold text-[var(--text-primary)]">{r.noPendaftaran}</span> },
                { key: 'tglJamKunjungan', label: 'Tanggal', render: (r) => (
                  <div>
                    <div>{fmtTanggal(r.tglJamKunjungan)}</div>
                    <div className="text-tiny text-[var(--text-muted)]">{fmtJam(r.tglJamKunjungan)}</div>
                  </div>
                ) },
                { key: 'noRm', label: 'No. RM', mono: true, render: (r) => <span className="font-mono text-tiny">{r.pasien?.noRm || '-'}</span> },
                { key: 'namaPasien', label: 'Nama Pasien', render: (r) => r.pasien?.nama || '-' },
                { key: 'poli', label: 'Poli', render: (r) => r.poli?.nama || '-' },
                { key: 'dokter', label: 'Dokter', render: (r) => r.dokter?.nama || r.dokterPengganti?.nama || '-' },
                { key: 'jenisKunjungan', label: 'Jenis', render: (r) => JENIS_LABEL[r.jenisKunjungan] || r.jenisKunjungan || '-' },
                { key: 'metodePembayaran', label: 'Pembayaran', render: (r) => PEMBAYARAN_LABEL[r.metodePembayaran] || r.metodePembayaran || '-' },
                { key: 'status', label: 'Status', render: (r) => <BadgeStatus status={r.status} /> },
              ]}
            />
          )}
        </>
      )}
    </div>
  )
}
