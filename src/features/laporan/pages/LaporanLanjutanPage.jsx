// ============================================================
// features/laporan/pages/LaporanLanjutanPage.jsx
// Laporan lanjutan — 4 tab: Jasa Medis, Operasional, Rekapitulasi,
// Top 10 Diagnosa. Data aktual per branch aktif, export Excel + cetak.
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as XLSX from 'xlsx'

import { Card, Badge, Btn, PageHeader } from '../../../shared/components/ui.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import { fetchBranches } from '../../../shared/branches.js'
import { fetchLaporanLanjutan } from '../service/laporanLanjutanService.js'

const TABS = [
  { key: 'jasa_medis', label: 'Jasa Medis' },
  { key: 'operasional', label: 'Operasional' },
  { key: 'rekapitulasi', label: 'Rekapitulasi' },
  { key: 'top_diagnosa', label: 'Top 10 Diagnosa' },
]

function today() { return new Date().toISOString().slice(0, 10) }
function fmtRupiah(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v) || 0)
}
function fmtNum(v) { return new Intl.NumberFormat('id-ID').format(Number(v) || 0) }
function fmtTanggal(v, opts) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString('id-ID', opts || { day: '2-digit', month: 'short', year: 'numeric' })
}
function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function ReportTable({ head, children, footer }) {
  return (
    <Card className="overflow-hidden">
      <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
        <table className="table">
          <thead><tr>{head.map((h, i) => <th key={i} className={h.align === 'right' ? 'text-right' : h.align === 'center' ? 'text-center' : ''}>{h.label}</th>)}</tr></thead>
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

function CellTxt({ children, muted = false }) {
  return <td className={`${muted ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>{children}</td>
}

export default function LaporanLanjutanPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'jasa_medis'

  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [branchName, setBranchName] = useState('-')
  const [dateFrom, setDateFrom] = useState(today())
  const [dateTo, setDateTo] = useState(today())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onBranch = () => setBranchId(getCurrentBranchId())
    window.addEventListener('branch:changed', onBranch)
    return () => window.removeEventListener('branch:changed', onBranch)
  }, [])

  useEffect(() => {
    if (!branchId) return
    fetchBranches({ force: true }).then((list) => {
      const b = list.find((x) => String(x.id) === String(branchId))
      setBranchName(b?.name || b?.nama || `Branch ${branchId}`)
    }).catch(() => {})
  }, [branchId])

  useEffect(() => {
    if (!branchId) { setLoading(false); return }
    setLoading(true); setError('')
    fetchLaporanLanjutan(branchId, tab, { date_from: dateFrom || undefined, date_to: dateTo || undefined })
      .then(setData)
      .catch((e) => setError(e?.response?.data?.message || 'Gagal memuat laporan'))
      .finally(() => setLoading(false))
  }, [branchId, tab, dateFrom, dateTo])

  const setTab = (key) => setSearchParams({ tab: key })
  const judul = TABS.find((t) => t.key === tab)?.label || ''
  const periodeLabel = () => {
    if (dateFrom && dateTo && dateFrom === dateTo) return fmtTanggal(dateFrom, { day: 'numeric', month: 'long', year: 'numeric' })
    if (dateFrom && dateTo) return `${fmtTanggal(dateFrom)} s.d. ${fmtTanggal(dateTo)}`
    return 'Semua tanggal'
  }

  // ===== Aggregasi per tab =====
  const jasaMedis = useMemo(() => data || { perDokter: [], perPoli: [], totalTindakan: 0, totalJasaDokter: 0 }, [data])
  const operasional = useMemo(() => data || { jumlahKunjungan: 0, kunjunganHariIni: 0, pasienBaru: 0, pasienLama: 0, totalObatKeluar: 0, nilaiObatKeluar: 0, totalMutasi: 0, metodeBayar: [] }, [data])
  const rekapitulasi = useMemo(() => data || { perPoli: [], perHari: [], perJenis: [], topDiagnosa: [] }, [data])
  const topDiagnosa = useMemo(() => data?.list || [], [data])

  // ===== Export Excel =====
  const exportExcel = () => {
    const header = { 'Klinik': 'Medicore Clinic', 'Branch': branchName, 'Laporan': `Lanjutan — ${judul}`, 'Periode': periodeLabel() }
    let sheets = []
    if (tab === 'jasa_medis') {
      sheets = [{ name: 'Jasa Medis', rows: [header, ...jasaMedis.perDokter.map((r, i) => ({
        No: i + 1, Dokter: r.dokter, 'Jumlah Kunjungan': r.jumlahKunjungan, 'Total Tindakan': fmtRupiah(r.totalTindakan), 'Jasa Dokter': fmtRupiah(r.jasaDokter), 'Jasa Klinik': fmtRupiah(r.jasaKlinik),
      }))] }]
    } else if (tab === 'operasional') {
      sheets = [{ name: 'Operasional', rows: [
        header, {},
        { 'Jumlah Kunjungan': operasional.jumlahKunjungan },
        { 'Kunjungan Hari Ini': operasional.kunjunganHariIni },
        { 'Pasien Baru': operasional.pasienBaru },
        { 'Pasien Lama': operasional.pasienLama },
        { 'Total Obat Keluar': operasional.totalObatKeluar },
        { 'Nilai Obat Keluar': fmtRupiah(operasional.nilaiObatKeluar) },
        { 'Total Mutasi': operasional.totalMutasi },
        {},
        ...(operasional.metodeBayar || []).map((m) => ({ Metode: m.metode || '-', Jumlah: m.jumlah })),
      ] }]
    } else if (tab === 'rekapitulasi') {
      sheets = [
        { name: 'Per Poli', rows: [header, ...(rekapitulasi.perPoli || []).map((r, i) => ({ No: i + 1, Poli: r.nama, Jumlah: r.jumlah }))] },
        { name: 'Per Hari', rows: [header, ...(rekapitulasi.perHari || []).map((r, i) => ({ No: i + 1, Tanggal: fmtTanggal(r.tanggal), Jumlah: r.jumlah }))] },
        { name: 'Per Jenis', rows: [header, ...(rekapitulasi.perJenis || []).map((r, i) => ({ No: i + 1, Jenis: r.jenis, Jumlah: r.jumlah }))] },
      ]
    } else {
      sheets = [{ name: 'Top Diagnosa', rows: [header, ...topDiagnosa.map((r, i) => ({ No: i + 1, Diagnosa: r.diagnosa, Jumlah: r.jumlah }))] }]
    }
    const wb = XLSX.utils.book_new()
    sheets.forEach((s) => {
      const ws = XLSX.utils.json_to_sheet(s.rows, { skipHeader: false })
      XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31))
    })
    XLSX.writeFile(wb, `laporan-${tab}-${dateFrom || 'all'}.xlsx`)
  }

  // ===== Cetak =====
  const cetak = () => {
    const buildTable = (head, body) => `<table cellspacing="0"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`
    let body = ''
    if (tab === 'jasa_medis') {
      body = buildTable(
        ['No', 'Dokter', 'Kunjungan', 'Total Tindakan', 'Jasa Dokter', 'Jasa Klinik'],
        jasaMedis.perDokter.map((r, i) => `<tr><td class="c">${i + 1}</td><td>${escapeHtml(r.dokter)}</td><td class="r">${fmtNum(r.jumlahKunjungan)}</td><td class="r">${fmtRupiah(r.totalTindakan)}</td><td class="r"><b>${fmtRupiah(r.jasaDokter)}</b></td><td class="r">${fmtRupiah(r.jasaKlinik)}</td></tr>`).join('') || '<tr><td colspan="6" class="c">-</td></tr>',
      )
    } else if (tab === 'operasional') {
      body = `
        <table cellspacing="0">
          <tr><td>Jumlah Kunjungan</td><td class="r"><b>${fmtNum(operasional.jumlahKunjungan)}</b></td></tr>
          <tr><td>Kunjungan Hari Ini</td><td class="r">${fmtNum(operasional.kunjunganHariIni)}</td></tr>
          <tr><td>Pasien Baru / Lama</td><td class="r">${fmtNum(operasional.pasienBaru)} / ${fmtNum(operasional.pasienLama)}</td></tr>
          <tr><td>Total Obat Keluar</td><td class="r">${fmtNum(operasional.totalObatKeluar)}</td></tr>
          <tr><td>Nilai Obat Keluar</td><td class="r">${fmtRupiah(operasional.nilaiObatKeluar)}</td></tr>
          <tr><td>Total Mutasi</td><td class="r">${fmtNum(operasional.totalMutasi)}</td></tr>
        </table>
        ${buildTable(['Metode Bayar', 'Jumlah'], (operasional.metodeBayar || []).map((m) => `<tr><td>${escapeHtml(m.metode || '-')}</td><td class="r">${fmtNum(m.jumlah)}</td></tr>`).join('') || '<tr><td colspan="2" class="c">-</td></tr>')}`
    } else if (tab === 'rekapitulasi') {
      body = buildTable(
        ['No', 'Poli', 'Jumlah'],
        (rekapitulasi.perPoli || []).map((r, i) => `<tr><td class="c">${i + 1}</td><td>${escapeHtml(r.nama)}</td><td class="r">${fmtNum(r.jumlah)}</td></tr>`).join('') || '<tr><td colspan="3" class="c">-</td></tr>',
      ) + '<h3>Per Hari</h3>' + buildTable(
        ['No', 'Tanggal', 'Jumlah'],
        (rekapitulasi.perHari || []).map((r, i) => `<tr><td class="c">${i + 1}</td><td>${fmtTanggal(r.tanggal)}</td><td class="r">${fmtNum(r.jumlah)}</td></tr>`).join('') || '<tr><td colspan="3" class="c">-</td></tr>',
      )
    } else {
      body = buildTable(
        ['No', 'Diagnosa', 'Jumlah'],
        topDiagnosa.map((r, i) => `<tr><td class="c">${i + 1}</td><td>${escapeHtml(r.diagnosa)}</td><td class="r">${fmtNum(r.jumlah)}</td></tr>`).join('') || '<tr><td colspan="3" class="c">-</td></tr>',
      )
    }

    const w = window.open('', '_blank', 'width=1100,height=700')
    if (!w) return
    w.document.write(`<!doctype html><html><head><title>${judul} — Medicore Clinic</title>
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
        .r { text-align: right; } .c { text-align: center; }
        @media print { body { margin: 12mm; } }
      </style></head><body>
        <div class="kop">
          <h1>MEDICORE CLINIC</h1>
          <p>Laporan Sistem Informasi Klinik — Branch: <b>${escapeHtml(branchName)}</b></p>
        </div>
        <h2>${judul.toUpperCase()}</h2>
        <p class="periode">Periode: <b>${periodeLabel()}</b></p>
        ${body}
      </body></html>`)
    w.document.close(); w.focus(); setTimeout(() => w.print(), 300)
  }

  const filterBar = (
    <Card className="mb-4 p-4">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div><label className="label">Dari Tanggal</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" /></div>
          <div><label className="label">Sampai Tanggal</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" /></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="secondary" size="sm" onClick={() => { setDateFrom(today()); setDateTo(today()) }}>Hari Ini</Btn>
          <Btn variant="secondary" size="sm" onClick={() => { setDateFrom(''); setDateTo('') }}>Semua Tanggal</Btn>
          <Btn variant="secondary" size="sm" onClick={exportExcel} disabled={loading || !data}>Excel</Btn>
          <Btn variant="primary" size="sm" onClick={cetak} disabled={loading || !data}>Cetak / PDF</Btn>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-4">
      <PageHeader title="Laporan Lanjutan" desc={`Branch: ${branchName} • ${judul}`} />

      {filterBar}

      <div className="overflow-x-auto border-b border-[var(--border-primary)]">
        <div className="flex min-w-max gap-1">
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-body-sm font-medium transition-colors ${
                tab === t.key ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card className="p-10 text-center text-body-sm text-[var(--text-muted)]">Memuat laporan…</Card>
      ) : error ? (
        <Card className="p-10 text-center text-body-sm text-[var(--status-danger)]">{error}</Card>
      ) : (
        <>
          {tab === 'jasa_medis' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Total Tindakan</p><p className="mt-1 text-2xl font-semibold font-mono">{fmtRupiah(jasaMedis.totalTindakan)}</p></Card>
                <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Total Jasa Dokter (60%)</p><p className="mt-1 text-2xl font-semibold font-mono text-[var(--status-success)]">{fmtRupiah(jasaMedis.totalJasaDokter)}</p></Card>
                <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Dokter Aktif</p><p className="mt-1 text-2xl font-semibold font-mono">{fmtNum(jasaMedis.perDokter.length)}</p></Card>
              </div>
              <ReportTable head={[{ label: 'No', align: 'center' }, { label: 'Dokter' }, { label: 'Kunjungan', align: 'right' }, { label: 'Total Tindakan', align: 'right' }, { label: 'Jasa Dokter', align: 'right' }, { label: 'Jasa Klinik', align: 'right' }]}>
                {jasaMedis.perDokter.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-body-sm text-[var(--text-tertiary)]">Belum ada data tindakan pada periode ini</td></tr>
                ) : jasaMedis.perDokter.map((r, i) => (
                  <tr key={r.dokter}>
                    <td className="text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                    <CellTxt>{r.dokter}</CellTxt>
                    <CellNum value={fmtNum(r.jumlahKunjungan)} />
                    <CellNum value={fmtRupiah(r.totalTindakan)} />
                    <CellNum value={fmtRupiah(r.jasaDokter)} bold />
                    <CellNum value={fmtRupiah(r.jasaKlinik)} />
                  </tr>
                ))}
              </ReportTable>
            </>
          )}

          {tab === 'operasional' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Kunjungan</p><p className="mt-1 text-2xl font-semibold font-mono">{fmtNum(operasional.jumlahKunjungan)}</p></Card>
                <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Hari Ini</p><p className="mt-1 text-2xl font-semibold font-mono">{fmtNum(operasional.kunjunganHariIni)}</p></Card>
                <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Baru / Lama</p><p className="mt-1 text-2xl font-semibold font-mono">{fmtNum(operasional.pasienBaru)} / {fmtNum(operasional.pasienLama)}</p></Card>
                <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Nilai Obat Keluar</p><p className="mt-1 text-2xl font-semibold font-mono text-[var(--status-danger)]">{fmtRupiah(operasional.nilaiObatKeluar)}</p></Card>
              </div>
              <ReportTable head={[{ label: 'Metode Bayar' }, { label: 'Jumlah Kunjungan', align: 'right' }]}>
                {(operasional.metodeBayar || []).length === 0 ? (
                  <tr><td colSpan={2} className="py-10 text-center text-body-sm text-[var(--text-tertiary)]">Belum ada data</td></tr>
                ) : (operasional.metodeBayar || []).map((m) => (
                  <tr key={m.metode || '-'}>
                    <CellTxt><Badge tone="neutral">{m.metode || '-'}</Badge></CellTxt>
                    <CellNum value={fmtNum(m.jumlah)} />
                  </tr>
                ))}
              </ReportTable>
            </>
          )}

          {tab === 'rekapitulasi' && (
            <>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <ReportTable head={[{ label: 'No', align: 'center' }, { label: 'Poli' }, { label: 'Jumlah', align: 'right' }]}>
                  {(rekapitulasi.perPoli || []).length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-body-sm text-[var(--text-tertiary)]">Belum ada data</td></tr>
                  ) : (rekapitulasi.perPoli || []).map((r, i) => (
                    <tr key={r.nama}>
                      <td className="text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                      <CellTxt>{r.nama}</CellTxt>
                      <CellNum value={fmtNum(r.jumlah)} />
                    </tr>
                  ))}
                </ReportTable>
                <ReportTable head={[{ label: 'No', align: 'center' }, { label: 'Jenis Kunjungan' }, { label: 'Jumlah', align: 'right' }]}>
                  {(rekapitulasi.perJenis || []).length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-body-sm text-[var(--text-tertiary)]">Belum ada data</td></tr>
                  ) : (rekapitulasi.perJenis || []).map((r, i) => (
                    <tr key={r.jenis}>
                      <td className="text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                      <CellTxt>{r.jenis}</CellTxt>
                      <CellNum value={fmtNum(r.jumlah)} />
                    </tr>
                  ))}
                </ReportTable>
              </div>
              <ReportTable head={[{ label: 'No', align: 'center' }, { label: 'Tanggal' }, { label: 'Jumlah Kunjungan', align: 'right' }]}>
                {(rekapitulasi.perHari || []).length === 0 ? (
                  <tr><td colSpan={3} className="py-8 text-center text-body-sm text-[var(--text-tertiary)]">Belum ada data</td></tr>
                ) : (rekapitulasi.perHari || []).map((r, i) => (
                  <tr key={r.tanggal}>
                    <td className="text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                    <CellTxt>{fmtTanggal(r.tanggal)}</CellTxt>
                    <CellNum value={fmtNum(r.jumlah)} />
                  </tr>
                ))}
              </ReportTable>
            </>
          )}

          {tab === 'top_diagnosa' && (
            <ReportTable head={[{ label: 'No', align: 'center' }, { label: 'Diagnosa' }, { label: 'Jumlah', align: 'right' }]}>
              {topDiagnosa.length === 0 ? (
                <tr><td colSpan={3} className="py-10 text-center text-body-sm text-[var(--text-tertiary)]">Belum ada diagnosa tercatat</td></tr>
              ) : topDiagnosa.map((r, i) => (
                <tr key={`${r.diagnosa}-${i}`}>
                  <td className="text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                  <CellTxt>{r.diagnosa}</CellTxt>
                  <CellNum value={fmtNum(r.jumlah)} bold />
                </tr>
              ))}
            </ReportTable>
          )}
        </>
      )}
    </div>
  )
}
