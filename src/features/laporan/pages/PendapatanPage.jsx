// ============================================================
// features/laporan/pages/PendapatanPage.jsx
// Laporan Pendapatan (URL /pendapatan). Data selalu di-scope
// branch_id aktif (endpoint /api/laporan/pendapatan); beberapa
// jenis report dipisah dalam TAB. Export Excel (xlsx) +
// Cetak/PDF (kop laporan standar klinik).
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { Card, Badge, Btn, PageHeader } from '../../../shared/components/ui.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import { fetchBranches } from '../../../shared/branches.js'
import { fetchLaporanPendapatan } from '../service/pendapatanService.js'

// ==================== KONSTANTA ====================

const TABS = [
  { key: 'ringkasan', label: 'Ringkasan Pendapatan' },
  { key: 'harian', label: 'Pembayaran Harian' },
  { key: 'transaksi', label: 'Detail Transaksi' },
  { key: 'obat', label: 'Penjualan Obat' },
  { key: 'tindakan', label: 'Pendapatan Tindakan' },
]

const METODE_LABEL = { tunai: 'Tunai', transfer: 'Transfer', qris: 'QRIS', asuransi: 'Asuransi', bpjs: 'BPJS' }
const METODE_TONE = { tunai: 'success', transfer: 'accent', qris: 'info', asuransi: 'warning', bpjs: 'warning' }

// ==================== HELPER ====================

function today() { return new Date().toISOString().slice(0, 10) }

function fmtRupiah(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val) || 0)
}

function fmtNum(val) {
  return new Intl.NumberFormat('id-ID').format(Number(val) || 0)
}

function fmtTanggal(val, opts) {
  if (!val) return '-'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return String(val)
  return d.toLocaleDateString('id-ID', opts || { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtTanggalPanjang(val, opts) {
  if (!val) return '-'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return String(val)
  return d.toLocaleDateString('id-ID', opts || { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtJam(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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
      <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
        <table className="table">
          <thead>
            <tr>{head.map((h, i) => (
              <th key={i} className={h.align === 'right' ? 'text-right' : h.align === 'center' ? 'text-center' : ''}>{h.label}</th>
            ))}</tr>
          </thead>
          <tbody>{children}</tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </table>
      </div>
    </Card>
  )
}

function CellNum({ value, bold = false }) {
  return <td className={`text-right font-mono tabular-nums ${bold ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{value}</td>
}

function CellTxt({ children, mono = false, muted = false }) {
  return <td className={`${mono ? 'font-mono' : ''} ${muted ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>{children}</td>
}

function BadgeMetode({ metode }) {
  return <Badge tone={METODE_TONE[metode] || 'neutral'}>{METODE_LABEL[metode] || metode || 'Tunai'}</Badge>
}

// ==================== HALAMAN ====================

export default function PendapatanPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'ringkasan'

  const [branchId, setBranchId] = useState(getCurrentBranchId())
  const [branchName, setBranchName] = useState('-')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter laporan
  const [dateFrom, setDateFrom] = useState(today())
  const [dateTo, setDateTo] = useState(today())

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

  // Muat laporan pendapatan branch aktif sesuai filter
  useEffect(() => {
    if (!branchId) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    setError('')
    const params = {}
    if (dateFrom) params.date_from = dateFrom
    if (dateTo) params.date_to = dateTo
    fetchLaporanPendapatan(branchId, params)
      .then((res) => { if (!cancelled) setData(res) })
      .catch((err) => {
        console.error('[Pendapatan] gagal memuat laporan:', err)
        if (!cancelled) setError(err?.response?.data?.message || 'Gagal memuat laporan pendapatan')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [branchId, dateFrom, dateTo])

  const setTab = (key) => setSearchParams({ tab: key })

  const s = data?.ringkasan || {}
  const transaksi = data?.transaksi || []
  const harian = data?.pembayaranHarian || []
  const perMetode = data?.perMetode || []
  const perPoli = data?.pendapatanPerPoli || []
  const obatList = data?.obatTerlaris || []
  const tindakanList = data?.tindakanTerlaris || []

  const periodeLabel = () => {
    if (dateFrom && dateTo && dateFrom === dateTo) return fmtTanggal(dateFrom, { day: 'numeric', month: 'long', year: 'numeric' })
    if (dateFrom && dateTo) return `${fmtTanggal(dateFrom)} s.d. ${fmtTanggal(dateTo)}`
    if (dateFrom) return `Sejak ${fmtTanggal(dateFrom)}`
    if (dateTo) return `s.d. ${fmtTanggal(dateTo)}`
    return 'Semua tanggal'
  }

  const judulTab = TABS.find((t) => t.key === tab)?.label || ''

  // ==================== EXPORT EXCEL ====================

  const exportExcel = () => {
    const header = {
      'Klinik': 'Medicore Clinic',
      'Branch': branchName,
      'Laporan': `Pendapatan — ${judulTab}`,
      'Periode': periodeLabel(),
    }
    let sheets = []
    if (tab === 'ringkasan') {
      sheets = [{
        name: 'Ringkasan',
        rows: [
          header,
          {},
          { 'Total Pendapatan': fmtRupiah(s.total) },
          { 'Pendapatan Pendaftaran': fmtRupiah(s.pendaftaran) },
          { 'Pendapatan Tindakan': fmtRupiah(s.tindakan) },
          { 'Pendapatan Obat': fmtRupiah(s.obat) },
          { 'Jumlah Transaksi': s.jumlahTransaksi },
          {},
          ...perMetode.map((m) => ({
            Metode: METODE_LABEL[m.metode] || m.metode, 'Jumlah Transaksi': m.jumlahTransaksi, 'Total': fmtRupiah(m.total),
          })),
          {},
          ...perPoli.map((p) => ({
            Poli: p.poli, 'Jumlah Kunjungan': p.jumlahKunjungan, Pendaftaran: fmtRupiah(p.pendaftaran), Tindakan: fmtRupiah(p.tindakan), Obat: fmtRupiah(p.obat), 'Total': fmtRupiah(p.total),
          })),
        ],
      }]
    } else if (tab === 'harian') {
      sheets = [{
        name: 'Pembayaran Harian',
        rows: [header, ...harian.map((r, i) => ({
          No: i + 1,
          Tanggal: fmtTanggal(r.tanggal, { day: '2-digit', month: 'long', year: 'numeric' }),
          'Jumlah Transaksi': r.jumlahTransaksi,
          Tunai: fmtRupiah(r.tunai),
          Transfer: fmtRupiah(r.transfer),
          QRIS: fmtRupiah(r.qris),
          Asuransi: fmtRupiah(r.asuransi),
          BPJS: fmtRupiah(r.bpjs),
          'Total': fmtRupiah(r.total),
        }))],
      }]
    } else if (tab === 'transaksi') {
      sheets = [{
        name: 'Detail Transaksi',
        rows: [header, ...transaksi.map((r, i) => ({
          No: i + 1,
          'No. Pendaftaran': r.noPendaftaran,
          Tanggal: fmtTanggal(r.tanggal),
          Jam: fmtJam(r.tanggal),
          'No. RM': r.pasien?.noRm || '-',
          Pasien: r.pasien?.nama || '-',
          Poli: r.poli?.nama || '-',
          Dokter: r.dokter?.nama || '-',
          Pendaftaran: fmtRupiah(r.pendaftaran),
          Tindakan: fmtRupiah(r.tindakan),
          Obat: fmtRupiah(r.obat),
          'Total': fmtRupiah(r.total),
          Metode: METODE_LABEL[r.metodePembayaran] || r.metodePembayaran || 'Tunai',
        }))],
      }]
    } else if (tab === 'obat') {
      sheets = [{
        name: 'Penjualan Obat',
        rows: [header, ...obatList.map((r, i) => ({
          No: i + 1, 'Nama Obat': r.nama, 'Jumlah Terjual': r.jumlah, 'Total Nilai': fmtRupiah(r.nilai),
        }))],
      }]
    } else if (tab === 'tindakan') {
      sheets = [{
        name: 'Pendapatan Tindakan',
        rows: [header, ...tindakanList.map((r, i) => ({
          No: i + 1, 'Nama Tindakan': r.nama, 'Jumlah': r.jumlah, 'Total Nilai': fmtRupiah(r.nilai),
        }))],
      }]
    }
    const wb = XLSX.utils.book_new()
    sheets.forEach((sh) => {
      const ws = XLSX.utils.json_to_sheet(sh.rows, { skipHeader: false })
      XLSX.utils.book_append_sheet(wb, ws, sh.name.slice(0, 31))
    })
    XLSX.writeFile(wb, `laporan-pendapatan-${tab}-${dateFrom || 'all'}.xlsx`)
  }

  // ==================== CETAK / PDF ====================

  const cetakPdf = () => {
    const w = window.open('', '_blank', 'width=1100,height=700')
    if (!w) return
    const dicetak = fmtTanggal(new Date(), { day: 'numeric', month: 'long', year: 'numeric' })
    const buildTable = (head, bodyRows) => `<table cellspacing="0"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${bodyRows}</tbody></table>`

    let body = ''
    if (tab === 'ringkasan') {
      const ringkas = `
        <table cellspacing="0">
          <tr><td>Total Pendapatan</td><td class="r"><b>${fmtRupiah(s.total)}</b></td></tr>
          <tr><td>Pendapatan Pendaftaran</td><td class="r">${fmtRupiah(s.pendaftaran)}</td></tr>
          <tr><td>Pendapatan Tindakan</td><td class="r">${fmtRupiah(s.tindakan)}</td></tr>
          <tr><td>Pendapatan Obat</td><td class="r">${fmtRupiah(s.obat)}</td></tr>
          <tr><td>Jumlah Transaksi</td><td class="r">${fmtNum(s.jumlahTransaksi)}</td></tr>
        </table>
        <h3>Per Metode Pembayaran</h3>
        ${buildTable(['Metode', 'Jumlah Transaksi', 'Total'],
          perMetode.map((m) => `<tr><td>${METODE_LABEL[m.metode] || m.metode}</td><td class="r">${fmtNum(m.jumlahTransaksi)}</td><td class="r">${fmtRupiah(m.total)}</td></tr>`).join('') || '<tr><td colspan="3" class="c">-</td></tr>')}
        <h3>Pendapatan per Poli</h3>
        ${buildTable(['Poli', 'Kunjungan', 'Pendaftaran', 'Tindakan', 'Obat', 'Total'],
          perPoli.map((p) => `<tr><td>${escapeHtml(p.poli)}</td><td class="r">${fmtNum(p.jumlahKunjungan)}</td><td class="r">${fmtRupiah(p.pendaftaran)}</td><td class="r">${fmtRupiah(p.tindakan)}</td><td class="r">${fmtRupiah(p.obat)}</td><td class="r"><b>${fmtRupiah(p.total)}</b></td></tr>`).join('') || '<tr><td colspan="6" class="c">-</td></tr>')}`
      body = ringkas
    } else if (tab === 'harian') {
      body = buildTable(
        ['No', 'Tanggal', 'Transaksi', 'Tunai', 'Transfer', 'QRIS', 'Asuransi', 'BPJS', 'Total'],
        harian.map((r, i) => `<tr><td class="c">${i + 1}</td><td>${fmtTanggal(r.tanggal, { day: '2-digit', month: 'long', year: 'numeric' })}</td><td class="r">${fmtNum(r.jumlahTransaksi)}</td><td class="r">${fmtRupiah(r.tunai)}</td><td class="r">${fmtRupiah(r.transfer)}</td><td class="r">${fmtRupiah(r.qris)}</td><td class="r">${fmtRupiah(r.asuransi)}</td><td class="r">${fmtRupiah(r.bpjs)}</td><td class="r"><b>${fmtRupiah(r.total)}</b></td></tr>`).join(''),
      )
    } else if (tab === 'transaksi') {
      body = buildTable(
        ['No', 'No. Pendaftaran', 'Tanggal', 'No. RM', 'Nama Pasien', 'Poli', 'Dokter', 'Pendaftaran', 'Tindakan', 'Obat', 'Total', 'Metode'],
        transaksi.map((r, i) => `<tr><td class="c">${i + 1}</td><td class="mono">${escapeHtml(r.noPendaftaran || '-')}</td><td>${fmtTanggal(r.tanggal)} ${fmtJam(r.tanggal)}</td><td class="mono">${escapeHtml(r.pasien?.noRm || '-')}</td><td>${escapeHtml(r.pasien?.nama || '-')}</td><td>${escapeHtml(r.poli?.nama || '-')}</td><td>${escapeHtml(r.dokter?.nama || '-')}</td><td class="r">${fmtRupiah(r.pendaftaran)}</td><td class="r">${fmtRupiah(r.tindakan)}</td><td class="r">${fmtRupiah(r.obat)}</td><td class="r"><b>${fmtRupiah(r.total)}</b></td><td>${METODE_LABEL[r.metodePembayaran] || r.metodePembayaran || 'Tunai'}</td></tr>`).join('') || '<tr><td colspan="12" class="c">-</td></tr>',
      )
    } else if (tab === 'obat') {
      body = buildTable(
        ['No', 'Nama Obat', 'Jumlah Terjual', 'Total Nilai'],
        obatList.map((r, i) => `<tr><td class="c">${i + 1}</td><td>${escapeHtml(r.nama)}</td><td class="r">${fmtNum(r.jumlah)}</td><td class="r"><b>${fmtRupiah(r.nilai)}</b></td></tr>`).join('') || '<tr><td colspan="4" class="c">-</td></tr>',
      )
    } else if (tab === 'tindakan') {
      body = buildTable(
        ['No', 'Nama Tindakan', 'Jumlah', 'Total Nilai'],
        tindakanList.map((r, i) => `<tr><td class="c">${i + 1}</td><td>${escapeHtml(r.nama)}</td><td class="r">${fmtNum(r.jumlah)}</td><td class="r"><b>${fmtRupiah(r.nilai)}</b></td></tr>`).join('') || '<tr><td colspan="4" class="c">-</td></tr>',
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
        h3 { font-size: 12px; margin: 14px 0 4px; }
        .periode { text-align: center; font-size: 11px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 5px 7px; text-align: left; }
        th { background: #eee; font-size: 11px; }
        td { font-size: 11px; }
        .r { text-align: right; } .c { text-align: center; } .mono { font-family: 'Courier New', monospace; }
        .ttd { display: flex; justify-content: space-between; margin-top: 36px; }
        .ttd div { width: 200px; text-align: center; font-size: 11px; }
        .ttd p { margin: 2px 0; }
        .sp { height: 44px; }
        @media print { body { margin: 12mm; } }
      </style></head><body>
        <div class="kop">
          <h1>MEDICORE CLINIC</h1>
          <p>Laporan Sistem Informasi Klinik — Branch: <b>${escapeHtml(branchName)}</b></p>
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
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div>
            <label className="label">Dari Tanggal</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Sampai Tanggal</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="secondary" size="sm" onClick={() => { setDateFrom(today()); setDateTo(today()) }}>Hari Ini</Btn>
          <Btn variant="secondary" size="sm" onClick={() => { setDateFrom(''); setDateTo('') }}>Semua Tanggal</Btn>
          <Btn variant="secondary" size="sm" onClick={exportExcel} disabled={loading || !data}>Excel</Btn>
          <Btn variant="primary" size="sm" onClick={cetakPdf} disabled={loading || !data}>Cetak / PDF</Btn>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Pendapatan"
        desc={`Pendapatan branch aktif: ${branchName} • Periode: ${periodeLabel()}`}
        actions={<Badge tone="primary" mono>{fmtNum(s.jumlahTransaksi || 0)} transaksi</Badge>}
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
        <Card className="p-10 text-center text-body-sm text-[var(--text-muted)]">Memuat laporan pendapatan…</Card>
      ) : error ? (
        <Card className="p-10 text-center text-body-sm text-[var(--status-danger)]">{error}</Card>
      ) : (
        <>
          {/* ============ TAB: RINGKASAN ============ */}
          {tab === 'ringkasan' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                <StatCard label="Total Pendapatan" value={fmtRupiah(s.total)} tone="success" />
                <StatCard label="Pendaftaran" value={fmtRupiah(s.pendaftaran)} />
                <StatCard label="Tindakan" value={fmtRupiah(s.tindakan)} />
                <StatCard label="Obat" value={fmtRupiah(s.obat)} />
                <StatCard label="Transaksi" value={fmtNum(s.jumlahTransaksi)} />
              </div>

              <ReportTable
                head={[
                  { label: 'Metode Pembayaran' },
                  { label: 'Jumlah Transaksi', align: 'right' },
                  { label: 'Total', align: 'right' },
                ]}
                footer={
                  <tr className="bg-[var(--bg-secondary)] font-semibold">
                    <td className="text-right">TOTAL</td>
                    <CellNum value={perMetode.reduce((a, m) => a + m.jumlahTransaksi, 0)} bold />
                    <CellNum value={fmtRupiah(perMetode.reduce((a, m) => a + Number(m.total), 0))} bold />
                  </tr>
                }
              >
                {perMetode.length === 0 ? (
                  <tr><td colSpan={3} className="py-10 text-center text-body-sm text-[var(--text-tertiary)]">Belum ada pembayaran pada rentang tanggal ini</td></tr>
                ) : perMetode.map((m) => (
                  <tr key={m.metode}>
                    <CellTxt><BadgeMetode metode={m.metode} /></CellTxt>
                    <CellNum value={fmtNum(m.jumlahTransaksi)} />
                    <CellNum value={fmtRupiah(m.total)} bold />
                  </tr>
                ))}
              </ReportTable>

              <ReportTable
                head={[
                  { label: 'Poli' },
                  { label: 'Kunjungan', align: 'right' },
                  { label: 'Pendaftaran', align: 'right' },
                  { label: 'Tindakan', align: 'right' },
                  { label: 'Obat', align: 'right' },
                  { label: 'Total', align: 'right' },
                ]}
                footer={
                  <tr className="bg-[var(--bg-secondary)] font-semibold">
                    <td className="text-right">TOTAL</td>
                    <CellNum value={fmtNum(perPoli.reduce((a, p) => a + p.jumlahKunjungan, 0))} bold />
                    <CellNum value={fmtRupiah(perPoli.reduce((a, p) => a + Number(p.pendaftaran), 0))} bold />
                    <CellNum value={fmtRupiah(perPoli.reduce((a, p) => a + Number(p.tindakan), 0))} bold />
                    <CellNum value={fmtRupiah(perPoli.reduce((a, p) => a + Number(p.obat), 0))} bold />
                    <CellNum value={fmtRupiah(perPoli.reduce((a, p) => a + Number(p.total), 0))} bold />
                  </tr>
                }
              >
                {perPoli.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-body-sm text-[var(--text-tertiary)]">Belum ada pendapatan poli pada rentang tanggal ini</td></tr>
                ) : perPoli.map((p) => (
                  <tr key={p.poli}>
                    <CellTxt>{p.poli}</CellTxt>
                    <CellNum value={fmtNum(p.jumlahKunjungan)} />
                    <CellNum value={fmtRupiah(p.pendaftaran)} />
                    <CellNum value={fmtRupiah(p.tindakan)} />
                    <CellNum value={fmtRupiah(p.obat)} />
                    <CellNum value={fmtRupiah(p.total)} bold />
                  </tr>
                ))}
              </ReportTable>
            </>
          )}

          {/* ============ TAB: PEMBAYARAN HARIAN ============ */}
          {tab === 'harian' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard label="Hari Transaksi" value={fmtNum(harian.length)} />
                <StatCard label="Jumlah Transaksi" value={fmtNum(harian.reduce((a, r) => a + r.jumlahTransaksi, 0))} />
                <StatCard label="Total Pendapatan" value={fmtRupiah(harian.reduce((a, r) => a + Number(r.total), 0))} tone="success" />
              </div>
              <ReportTable
                head={[
                  { label: 'No', align: 'center' },
                  { label: 'Tanggal' },
                  { label: 'Transaksi', align: 'right' },
                  { label: 'Tunai', align: 'right' },
                  { label: 'Transfer', align: 'right' },
                  { label: 'QRIS', align: 'right' },
                  { label: 'Asuransi', align: 'right' },
                  { label: 'BPJS', align: 'right' },
                  { label: 'Total', align: 'right' },
                ]}
                footer={
                  <tr className="bg-[var(--bg-secondary)] font-semibold">
                    <td colSpan={2} className="text-right">TOTAL</td>
                    <CellNum value={fmtNum(harian.reduce((a, r) => a + r.jumlahTransaksi, 0))} bold />
                    <CellNum value={fmtRupiah(harian.reduce((a, r) => a + Number(r.tunai), 0))} bold />
                    <CellNum value={fmtRupiah(harian.reduce((a, r) => a + Number(r.transfer), 0))} bold />
                    <CellNum value={fmtRupiah(harian.reduce((a, r) => a + Number(r.qris), 0))} bold />
                    <CellNum value={fmtRupiah(harian.reduce((a, r) => a + Number(r.asuransi), 0))} bold />
                    <CellNum value={fmtRupiah(harian.reduce((a, r) => a + Number(r.bpjs), 0))} bold />
                    <CellNum value={fmtRupiah(harian.reduce((a, r) => a + Number(r.total), 0))} bold />
                  </tr>
                }
              >
                {harian.length === 0 ? (
                  <tr><td colSpan={9} className="py-10 text-center text-body-sm text-[var(--text-tertiary)]">Tidak ada pembayaran pada rentang tanggal ini</td></tr>
                ) : harian.map((r, i) => (
                  <tr key={r.tanggal}>
                    <td className="text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                    <CellTxt>{fmtTanggal(r.tanggal, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</CellTxt>
                    <CellNum value={fmtNum(r.jumlahTransaksi)} />
                    <CellNum value={fmtRupiah(r.tunai)} />
                    <CellNum value={fmtRupiah(r.transfer)} />
                    <CellNum value={fmtRupiah(r.qris)} />
                    <CellNum value={fmtRupiah(r.asuransi)} />
                    <CellNum value={fmtRupiah(r.bpjs)} />
                    <CellNum value={fmtRupiah(r.total)} bold />
                  </tr>
                ))}
              </ReportTable>
            </>
          )}

          {/* ============ TAB: DETAIL TRANSAKSI ============ */}
          {tab === 'transaksi' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Jumlah Transaksi" value={fmtNum(transaksi.length)} />
                <StatCard label="Total Pendaftaran" value={fmtRupiah(transaksi.reduce((a, r) => a + Number(r.pendaftaran), 0))} />
                <StatCard label="Total Tindakan + Obat" value={fmtRupiah(transaksi.reduce((a, r) => a + Number(r.tindakan) + Number(r.obat), 0))} />
                <StatCard label="Total Pendapatan" value={fmtRupiah(transaksi.reduce((a, r) => a + Number(r.total), 0))} tone="success" />
              </div>
              <ReportTable
                head={[
                  { label: 'No', align: 'center' },
                  { label: 'No. Pendaftaran' },
                  { label: 'Tanggal' },
                  { label: 'Pasien' },
                  { label: 'Poli' },
                  { label: 'Dokter' },
                  { label: 'Pendaftaran', align: 'right' },
                  { label: 'Tindakan', align: 'right' },
                  { label: 'Obat', align: 'right' },
                  { label: 'Total', align: 'right' },
                  { label: 'Metode' },
                ]}
                footer={
                  <tr className="bg-[var(--bg-secondary)] font-semibold">
                    <td colSpan={6} className="text-right">TOTAL</td>
                    <CellNum value={fmtRupiah(transaksi.reduce((a, r) => a + Number(r.pendaftaran), 0))} bold />
                    <CellNum value={fmtRupiah(transaksi.reduce((a, r) => a + Number(r.tindakan), 0))} bold />
                    <CellNum value={fmtRupiah(transaksi.reduce((a, r) => a + Number(r.obat), 0))} bold />
                    <CellNum value={fmtRupiah(transaksi.reduce((a, r) => a + Number(r.total), 0))} bold />
                    <td />
                  </tr>
                }
              >
                {transaksi.length === 0 ? (
                  <tr><td colSpan={11} className="py-10 text-center text-body-sm text-[var(--text-tertiary)]">Tidak ada transaksi pada rentang tanggal ini</td></tr>
                ) : transaksi.map((r, i) => (
                  <tr key={`${r.noPendaftaran}-${i}`}>
                    <td className="text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                    <CellTxt mono>{r.noPendaftaran}</CellTxt>
                    <CellTxt muted>{fmtTanggal(r.tanggal)} {fmtJam(r.tanggal)}</CellTxt>
                    <CellTxt>
                      <div className="font-medium">{r.pasien?.nama || '-'}</div>
                      <div className="font-mono text-tiny text-[var(--text-muted)]">RM {r.pasien?.noRm || '-'}</div>
                    </CellTxt>
                    <CellTxt muted>{r.poli?.nama || '-'}</CellTxt>
                    <CellTxt muted>{r.dokter?.nama || '-'}</CellTxt>
                    <CellNum value={fmtRupiah(r.pendaftaran)} />
                    <CellNum value={fmtRupiah(r.tindakan)} />
                    <CellNum value={fmtRupiah(r.obat)} />
                    <CellNum value={fmtRupiah(r.total)} bold />
                    <CellTxt><BadgeMetode metode={r.metodePembayaran} /></CellTxt>
                  </tr>
                ))}
              </ReportTable>
            </>
          )}

          {/* ============ TAB: PENJUALAN OBAT ============ */}
          {tab === 'obat' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard label="Jenis Obat" value={fmtNum(obatList.length)} />
                <StatCard label="Item Terjual" value={fmtNum(obatList.reduce((a, r) => a + Number(r.jumlah), 0))} />
                <StatCard label="Total Penjualan" value={fmtRupiah(obatList.reduce((a, r) => a + Number(r.nilai), 0))} tone="success" />
              </div>
              <ReportTable
                head={[
                  { label: 'No', align: 'center' },
                  { label: 'Nama Obat' },
                  { label: 'Jumlah Terjual', align: 'right' },
                  { label: 'Total Nilai', align: 'right' },
                ]}
                footer={
                  <tr className="bg-[var(--bg-secondary)] font-semibold">
                    <td colSpan={2} className="text-right">TOTAL</td>
                    <CellNum value={fmtNum(obatList.reduce((a, r) => a + Number(r.jumlah), 0))} bold />
                    <CellNum value={fmtRupiah(obatList.reduce((a, r) => a + Number(r.nilai), 0))} bold />
                  </tr>
                }
              >
                {obatList.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-body-sm text-[var(--text-tertiary)]">Belum ada penjualan obat pada rentang tanggal ini</td></tr>
                ) : obatList.map((r, i) => (
                  <tr key={`${r.nama}-${i}`}>
                    <td className="text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                    <CellTxt>{r.nama}</CellTxt>
                    <CellNum value={fmtNum(r.jumlah)} />
                    <CellNum value={fmtRupiah(r.nilai)} bold />
                  </tr>
                ))}
              </ReportTable>
            </>
          )}

          {/* ============ TAB: PENDAPATAN TINDAKAN ============ */}
          {tab === 'tindakan' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard label="Jenis Tindakan" value={fmtNum(tindakanList.length)} />
                <StatCard label="Jumlah Tindakan" value={fmtNum(tindakanList.reduce((a, r) => a + Number(r.jumlah), 0))} />
                <StatCard label="Total Nilai" value={fmtRupiah(tindakanList.reduce((a, r) => a + Number(r.nilai), 0))} tone="success" />
              </div>
              <ReportTable
                head={[
                  { label: 'No', align: 'center' },
                  { label: 'Nama Tindakan' },
                  { label: 'Jumlah', align: 'right' },
                  { label: 'Total Nilai', align: 'right' },
                ]}
                footer={
                  <tr className="bg-[var(--bg-secondary)] font-semibold">
                    <td colSpan={2} className="text-right">TOTAL</td>
                    <CellNum value={fmtNum(tindakanList.reduce((a, r) => a + Number(r.jumlah), 0))} bold />
                    <CellNum value={fmtRupiah(tindakanList.reduce((a, r) => a + Number(r.nilai), 0))} bold />
                  </tr>
                }
              >
                {tindakanList.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-body-sm text-[var(--text-tertiary)]">Belum ada tindakan pada rentang tanggal ini</td></tr>
                ) : tindakanList.map((r, i) => (
                  <tr key={`${r.nama}-${i}`}>
                    <td className="text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                    <CellTxt>{r.nama}</CellTxt>
                    <CellNum value={fmtNum(r.jumlah)} />
                    <CellNum value={fmtRupiah(r.nilai)} bold />
                  </tr>
                ))}
              </ReportTable>
            </>
          )}
        </>
      )}
    </div>
  )
}
