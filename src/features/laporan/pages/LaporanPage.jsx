import { useEffect, useMemo, useState } from 'react'
import { masterProjects, masterMaterials } from '../../../shared/apiMaster.js'
import { masterStocks } from '../../../shared/apiStock.js'
import { stockApi } from '../../../shared/apiLedger.js'
import { settingsApi } from '../../../shared/apiApp.js'
import { Card, PageHeader, Btn, Select, Spinner, Input, Badge } from '../../../shared/components/ui.jsx'
import { exportToExcel, printPdf, fmtCurrency, fmtNum, fmtDate } from '../../../shared/export.js'

const TABS = [
  ['stok', 'Stok Material'],
  ['biaya', 'Biaya Material'],
]

const TYPE_LABEL = {
  IN: 'Masuk',
  OUT: 'Keluar (SPB)',
  TRANSFER_IN: 'Transfer Masuk',
  TRANSFER_OUT: 'Transfer Keluar',
  ADJUST: 'Penyesuaian',
}

const TYPE_TONE = {
  IN: 'success',
  TRANSFER_IN: 'success',
  OUT: 'danger',
  TRANSFER_OUT: 'warning',
  ADJUST: 'warning',
}

export default function LaporanPage() {
  const [tab, setTab] = useState('stok')
  const [stocks, setStocks] = useState([])
  const [ledgers, setLedgers] = useState([])
  const [projects, setProjects] = useState([])
  const [materials, setMaterials] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    Promise.all([
      masterStocks.list().catch(() => []),
      stockApi.list({}).catch(() => []),
      masterProjects.list().catch(() => []),
      masterMaterials.list().catch(() => []),
      settingsApi.get().catch(() => ({})),
    ])
      .then(([st, l, p, m, set]) => {
        if (!alive) return
        setStocks(st || [])
        setLedgers(l || [])
        setProjects(p || [])
        setMaterials(m || [])
        setSettings(set || {})
      })
      .catch((e) => alive && setError(e?.message || 'Gagal memuat data'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const materialMap = useMemo(() => {
    const map = new Map()
    for (const m of materials) {
      map.set(m.id, {
        price: Number(m.price || 0),
        unit: m.unit?.name || '',
      })
    }
    return map
  }, [materials])

  return (
    <div>
      <PageHeader
        title="Laporan"
        desc="Stok Material: snapshot persediaan per gudang. Biaya Material: mutasi nilai (IN/OUT/Transfer) untuk hitung biaya proyek."
      />

      <div className="tabs-row mb-4">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            className={`relative px-4 py-2.5 text-body-sm font-medium transition-colors ${
              tab === k
                ? 'text-[var(--text-primary)] after:absolute after:left-0 after:right-0 after:bottom-[-1px] after:h-0.5 after:bg-[var(--accent-primary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'stok' && (
        <StokTab
          loading={loading}
          error={error}
          stocks={stocks}
          projects={projects}
          materialMap={materialMap}
          settings={settings}
        />
      )}
      {tab === 'biaya' && (
        <BiayaTab
          loading={loading}
          error={error}
          ledgers={ledgers}
          projects={projects}
          materialMap={materialMap}
          settings={settings}
        />
      )}
    </div>
  )
}

// =====================================================================
// Tab 1: Stok Material — snapshot per material-gudang
// =====================================================================
function StokTab({ loading, error, stocks, projects, materialMap, settings }) {
  const [f, setF] = useState({ project_id: '' })

  const rows = useMemo(() => {
    const filtered = f.project_id
      ? stocks.filter((s) => Number(s.warehouse?.project_id) === Number(f.project_id))
      : stocks
    return filtered.map((r) => {
      const extra = materialMap.get(r.material_id) || {}
      return {
        ...r,
        material: {
          ...r.material,
          price: r.material?.price ?? extra.price ?? 0,
          unit: r.material?.unit || (extra.unit ? { name: extra.unit } : null),
        },
      }
    })
  }, [stocks, f.project_id, materialMap])

  const totalStock = useMemo(
    () => rows.reduce((acc, r) => acc + Number(r.qty || 0), 0),
    [rows],
  )
  const totalValue = useMemo(
    () => rows.reduce((acc, r) => acc + Number(r.qty || 0) * Number(r.material?.price || 0), 0),
    [rows],
  )

  const exportExcel = () => exportToExcel('laporan-stok-material', [{
    name: 'Stok Material',
    rows: rows.map((r, i) => ({
      No: i + 1,
      Project: r.warehouse?.project?.name || '-',
      Warehouse: r.warehouse?.name || '-',
      Material: formatMaterial(r.material),
      Stock: Number(r.qty || 0),
      'Estimasi Price': Number(r.material?.price || 0),
      'Total Price': Number(r.qty || 0) * Number(r.material?.price || 0),
    })),
  }])

  const exportPdf = () => printPdf({
    title: 'Laporan Stok Material',
    companyHeader: settings?.company_header,
    orientation: 'landscape',
    bodyHtml: buildStokHtml(rows, { totalStock, totalValue }),
  })

  return (
    <>
      <Card className="mb-4 p-3.5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label="Proyek"
            value={f.project_id}
            onChange={(v) => setF((s) => ({ ...s, project_id: v }))}
            options={[
              { value: '', label: 'Semua Proyek' },
              ...projects.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
            ]}
          />
          <div className="flex items-end gap-2 sm:col-span-2 sm:justify-end">
            <Btn variant="secondary" onClick={exportExcel} disabled={loading || rows.length === 0}>Excel</Btn>
            <Btn variant="secondary" onClick={exportPdf} disabled={loading || rows.length === 0}>PDF</Btn>
          </div>
        </div>
      </Card>

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-3">
          <p className="text-caption text-[var(--text-tertiary)]">Total Baris</p>
          <p className="font-mono text-h4 font-semibold text-[var(--text-primary)]">{fmtNum(rows.length)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-[var(--text-tertiary)]">Total Stok</p>
          <p className="font-mono text-h4 font-semibold text-[var(--text-primary)]">{fmtNum(totalStock)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-[var(--text-tertiary)]">Total Estimasi Nilai</p>
          <p className="font-mono text-h4 font-semibold text-[var(--text-primary)]">{fmtCurrency(totalValue)}</p>
        </Card>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center gap-2 px-4 py-10 text-body-sm text-[var(--text-tertiary)]">
            <Spinner size="sm" /> Memuat data…
          </div>
        ) : error ? (
          <div className="px-4 py-10 text-center text-body-sm text-[var(--status-danger)]">{error}</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-body-sm text-[var(--text-tertiary)]">
            Tidak ada data pada filter ini
          </div>
        ) : (
          <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12 text-center">No</th>
                  <th>Project</th>
                  <th>Warehouse</th>
                  <th>Material</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Estimasi Price</th>
                  <th className="text-right">Total Price</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id ?? `${r.material_id}-${r.warehouse_id}-${i}`}>
                    <td className="text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                    <td>
                      <p className="font-medium text-[var(--text-primary)]">{r.warehouse?.project?.name || '-'}</p>
                      {r.warehouse?.project?.code && (
                        <p className="font-mono text-caption text-[var(--text-tertiary)]">{r.warehouse.project.code}</p>
                      )}
                    </td>
                    <td className="text-[var(--text-secondary)]">{r.warehouse?.name || '-'}</td>
                    <td>
                      <p className="font-medium text-[var(--text-primary)]">{formatMaterial(r.material)}</p>
                      {r.material?.code && (
                        <p className="font-mono text-caption text-[var(--text-tertiary)]">{r.material.code}</p>
                      )}
                    </td>
                    <td className="text-right font-mono font-semibold text-[var(--text-primary)]">{fmtNum(r.qty || 0)}</td>
                    <td className="text-right font-mono text-[var(--text-secondary)]">{fmtCurrency(r.material?.price || 0)}</td>
                    <td className="text-right font-mono font-semibold text-[var(--text-primary)]">
                      {fmtCurrency(Number(r.qty || 0) * Number(r.material?.price || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

// =====================================================================
// Tab 2: Biaya Material — mutasi detail (FIFO)
// =====================================================================
function BiayaTab({ loading, error, ledgers, projects, materialMap, settings }) {
  const [f, setF] = useState({ project_id: '', date_from: '', date_to: '', type: '' })

  const rows = useMemo(() => {
    const sorted = [...ledgers].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0
      const db = b.date ? new Date(b.date).getTime() : 0
      if (da !== db) return da - db
      return (a.id || 0) - (b.id || 0)
    })

    const lastInPrice = new Map()
    const computed = []

    for (const l of sorted) {
      const mat = l.material || {}
      const extra = materialMap.get(l.material_id) || {}
      const fallbackPrice = Number(l.unit_price ?? mat.price ?? extra.price ?? 0)
      const t = (l.type || '').toUpperCase()
      const qty = Number(l.qty || 0)
      const absQty = Math.abs(qty)

      let price = 0
      if (t === 'IN' || t === 'TRANSFER_IN' || t === 'ADJUST') {
        price = fallbackPrice
        if (t === 'IN' && price > 0) {
          lastInPrice.set(l.material_id, { price, date: l.date })
        }
      } else if (t === 'OUT' || t === 'TRANSFER_OUT') {
        const last = lastInPrice.get(l.material_id)
        price = last && last.price > 0 ? last.price : fallbackPrice
      } else {
        price = fallbackPrice
      }

      computed.push({
        ...l,
        material: {
          ...mat,
          price: mat.price ?? extra.price ?? 0,
          unit: mat.unit || (extra.unit ? { name: extra.unit } : null),
        },
        _price: price,
        _total: absQty * price,
        _sign: qty,
      })
    }

    return computed.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0
      const db = b.date ? new Date(b.date).getTime() : 0
      if (da !== db) return db - da
      return (b.id || 0) - (a.id || 0)
    })
  }, [ledgers, materialMap])

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (f.project_id && Number(r.warehouse?.project_id) !== Number(f.project_id)) return false
      if (f.date_from && r.date && r.date < f.date_from) return false
      if (f.date_to && r.date && r.date > f.date_to) return false
      if (f.type && (r.type || '').toUpperCase() !== f.type) return false
      return true
    })
  }, [rows, f])

  const totalMasuk = useMemo(
    () => filteredRows.filter((r) => r._sign > 0).reduce((acc, r) => acc + r._total, 0),
    [filteredRows],
  )
  const totalKeluar = useMemo(
    () => filteredRows.filter((r) => r._sign < 0).reduce((acc, r) => acc + r._total, 0),
    [filteredRows],
  )

  const exportExcel = () => exportToExcel('laporan-biaya-material', [{
    name: 'Biaya Material',
    rows: filteredRows.map((r, i) => ({
      No: i + 1,
      Tanggal: r.date,
      Tipe: TYPE_LABEL[(r.type || '').toUpperCase()] || r.type,
      Project: r.warehouse?.project?.name || '-',
      Warehouse: r.warehouse?.name || '-',
      Material: formatMaterial(r.material),
      Qty: Number(r._sign || 0),
      Harga: Number(r._price || 0),
      Total: Number(r._total || 0),
      'No. Ref': r.ref_no || '-',
      PO: r.po_no || '-',
      Keterangan: r.note || '-',
    })),
  }])

  const exportPdf = () => printPdf({
    title: 'Laporan Biaya Material',
    companyHeader: settings?.company_header,
    orientation: 'landscape',
    bodyHtml: buildBiayaHtml(filteredRows, { totalMasuk, totalKeluar }),
  })

  return (
    <>
      <Card className="mb-4 p-3.5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <Select
            label="Proyek"
            value={f.project_id}
            onChange={(v) => setF((s) => ({ ...s, project_id: v }))}
            options={[
              { value: '', label: 'Semua Proyek' },
              ...projects.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
            ]}
          />
          <Input
            label="Dari Tanggal"
            type="date"
            value={f.date_from}
            onChange={(v) => setF((s) => ({ ...s, date_from: v }))}
          />
          <Input
            label="Sampai Tanggal"
            type="date"
            value={f.date_to}
            onChange={(v) => setF((s) => ({ ...s, date_to: v }))}
          />
          <Select
            label="Tipe Mutasi"
            value={f.type}
            onChange={(v) => setF((s) => ({ ...s, type: v }))}
            options={[
              { value: '', label: 'Semua' },
              { value: 'IN', label: 'Masuk' },
              { value: 'OUT', label: 'Keluar (SPB)' },
              { value: 'TRANSFER_IN', label: 'Transfer Masuk' },
              { value: 'TRANSFER_OUT', label: 'Transfer Keluar' },
              { value: 'ADJUST', label: 'Penyesuaian' },
            ]}
          />
          <div className="flex items-end gap-2 sm:justify-end">
            <Btn variant="secondary" onClick={exportExcel} disabled={loading || filteredRows.length === 0}>Excel</Btn>
            <Btn variant="secondary" onClick={exportPdf} disabled={loading || filteredRows.length === 0}>PDF</Btn>
          </div>
        </div>
      </Card>

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-3">
          <p className="text-caption text-[var(--text-tertiary)]">Total Nilai Masuk</p>
          <p className="font-mono text-h4 font-semibold text-[var(--status-success)]">{fmtCurrency(totalMasuk)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-[var(--text-tertiary)]">Total Nilai Keluar (Biaya Proyek)</p>
          <p className="font-mono text-h4 font-semibold text-[var(--status-danger)]">{fmtCurrency(totalKeluar)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-[var(--text-tertiary)]">Jumlah Baris</p>
          <p className="font-mono text-h4 font-semibold text-[var(--text-primary)]">{fmtNum(filteredRows.length)}</p>
        </Card>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center gap-2 px-4 py-10 text-body-sm text-[var(--text-tertiary)]">
            <Spinner size="sm" /> Memuat data…
          </div>
        ) : error ? (
          <div className="px-4 py-10 text-center text-body-sm text-[var(--status-danger)]">{error}</div>
        ) : filteredRows.length === 0 ? (
          <div className="px-4 py-10 text-center text-body-sm text-[var(--text-tertiary)]">
            Tidak ada mutasi pada filter ini
          </div>
        ) : (
          <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th className="w-12 text-center">No</th>
                  <th>Tanggal</th>
                  <th>Tipe</th>
                  <th>Project</th>
                  <th>Warehouse</th>
                  <th>Material</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Harga</th>
                  <th className="text-right">Total</th>
                  <th>No. Ref</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r, i) => {
                  const t = (r.type || '').toUpperCase()
                  const tone = TYPE_TONE[t] || 'default'
                  const signed = Number(r._sign || 0)
                  return (
                    <tr key={r.id ?? i}>
                      <td className="text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                      <td className="whitespace-nowrap font-mono text-caption text-[var(--text-tertiary)]">{fmtDate(r.date)}</td>
                      <td>
                        <Badge tone={tone}>{TYPE_LABEL[t] || r.type}</Badge>
                        {r.po_no && (
                          <span className="ml-1.5 font-mono text-caption text-[var(--text-tertiary)]">{r.po_no}</span>
                        )}
                      </td>
                      <td>
                        <p className="text-[var(--text-primary)]">{r.warehouse?.project?.name || '-'}</p>
                        {r.warehouse?.project?.code && (
                          <p className="font-mono text-caption text-[var(--text-tertiary)]">{r.warehouse.project.code}</p>
                        )}
                      </td>
                      <td className="text-[var(--text-secondary)]">{r.warehouse?.name || '-'}</td>
                      <td>
                        <p className="font-medium text-[var(--text-primary)]">{formatMaterial(r.material)}</p>
                        {r.material?.code && (
                          <p className="font-mono text-caption text-[var(--text-tertiary)]">{r.material.code}</p>
                        )}
                      </td>
                      <td className={`text-right font-mono font-semibold ${
                        signed >= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'
                      }`}>
                        {signed > 0 ? '+' : ''}{fmtNum(signed)}
                      </td>
                      <td className="text-right font-mono text-[var(--text-secondary)]">{fmtCurrency(r._price || 0)}</td>
                      <td className="text-right font-mono font-semibold text-[var(--text-primary)]">{fmtCurrency(r._total || 0)}</td>
                      <td className="font-mono text-caption text-[var(--text-tertiary)]">{r.ref_no || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

function formatMaterial(m) {
  if (!m) return '-'
  const unit = m.unit?.name
  return unit ? `${m.name} (${unit})` : m.name
}

function buildStokHtml(rows, totals) {
  const head = `
    <thead>
      <tr>
        <th style="width:40px">No</th>
        <th>Project</th>
        <th>Warehouse</th>
        <th>Material</th>
        <th style="text-align:right">Stock</th>
        <th style="text-align:right">Estimasi Price</th>
        <th style="text-align:right">Total Price</th>
      </tr>
    </thead>`
  const body = rows.map((r, i) => {
    const qty = Number(r.qty || 0)
    const price = Number(r.material?.price || 0)
    return `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${escapeHtml(r.warehouse?.project?.name || '-')}</td>
        <td>${escapeHtml(r.warehouse?.name || '-')}</td>
        <td>${escapeHtml(formatMaterial(r.material))}</td>
        <td style="text-align:right;font-family:monospace">${fmtNum(qty)}</td>
        <td style="text-align:right;font-family:monospace">${fmtCurrency(price)}</td>
        <td style="text-align:right;font-family:monospace">${fmtCurrency(qty * price)}</td>
      </tr>`
  }).join('')
  const foot = `
    <tfoot>
      <tr>
        <td colspan="4" style="text-align:right;font-weight:700">Total</td>
        <td style="text-align:right;font-family:monospace;font-weight:700">${fmtNum(totals.totalStock)}</td>
        <td></td>
        <td style="text-align:right;font-family:monospace;font-weight:700">${fmtCurrency(totals.totalValue)}</td>
      </tr>
    </tfoot>`
  return `<table>${head}<tbody>${body}</tbody>${foot}</table>`
}

function buildBiayaHtml(rows, totals) {
  const head = `
    <thead>
      <tr>
        <th style="width:32px">No</th>
        <th>Tanggal</th>
        <th>Tipe</th>
        <th>Project</th>
        <th>Warehouse</th>
        <th>Material</th>
        <th style="text-align:right">Qty</th>
        <th style="text-align:right">Harga</th>
        <th style="text-align:right">Total</th>
        <th>No. Ref</th>
      </tr>
    </thead>`
  const body = rows.map((r, i) => {
    const t = (r.type || '').toUpperCase()
    const signed = Number(r._sign || 0)
    return `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${escapeHtml(fmtDate(r.date))}</td>
        <td>${escapeHtml(TYPE_LABEL[t] || r.type || '-')}${r.po_no ? ' <span style="color:#64748b">' + escapeHtml(r.po_no) + '</span>' : ''}</td>
        <td>${escapeHtml(r.warehouse?.project?.name || '-')}</td>
        <td>${escapeHtml(r.warehouse?.name || '-')}</td>
        <td>${escapeHtml(formatMaterial(r.material))}</td>
        <td style="text-align:right;font-family:monospace;color:${signed >= 0 ? '#16a34a' : '#dc2626'}">${signed > 0 ? '+' : ''}${fmtNum(signed)}</td>
        <td style="text-align:right;font-family:monospace">${fmtCurrency(r._price || 0)}</td>
        <td style="text-align:right;font-family:monospace">${fmtCurrency(r._total || 0)}</td>
        <td style="font-family:monospace">${escapeHtml(r.ref_no || '-')}</td>
      </tr>`
  }).join('')
  const foot = `
    <tfoot>
      <tr>
        <td colspan="8" style="text-align:right;font-weight:700">Total Nilai Masuk</td>
        <td style="text-align:right;font-family:monospace;font-weight:700;color:#16a34a">${fmtCurrency(totals.totalMasuk)}</td>
        <td></td>
      </tr>
      <tr>
        <td colspan="8" style="text-align:right;font-weight:700">Total Nilai Keluar (Biaya Proyek)</td>
        <td style="text-align:right;font-family:monospace;font-weight:700;color:#dc2626">${fmtCurrency(totals.totalKeluar)}</td>
        <td></td>
      </tr>
      <tr>
        <td colspan="8" style="text-align:right;font-weight:700">Selisih (Masuk − Keluar)</td>
        <td style="text-align:right;font-family:monospace;font-weight:700">${fmtCurrency(totals.totalMasuk - totals.totalKeluar)}</td>
        <td></td>
      </tr>
    </tfoot>`
  return `<table>${head}<tbody>${body}</tbody>${foot}</table>`
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
