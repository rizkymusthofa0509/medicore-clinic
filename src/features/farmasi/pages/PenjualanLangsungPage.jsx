// ============================================================
// features/farmasi/pages/PenjualanLangsungPage.jsx
// Penjualan Obat Langsung (OTC) — tanpa kunjungan, kurangi stok otomatis.
// ============================================================

import { useEffect, useState } from 'react'

import { Card, Badge, Btn, Input, Spinner, EmptyState } from '../../../shared/components/ui.jsx'
import SelectSearch from '../../../shared/components/SelectSearch.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import { fetchBranches } from '../../../shared/branches.js'
import { fetchObatAlkes } from '../../master/service/obatAlkesService.js'
import { fetchPenjualanLangsung, fetchNextNomorOtc, createPenjualanLangsung } from '../service/penjualanLangsungService.js'

const METODE = ['tunai', 'qris', 'transfer']
const METODE_LABEL = { tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer Bank' }

function fmtCurrency(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v) || 0)
}
function fmtTanggal(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export default function PenjualanLangsungPage() {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [branchName, setBranchName] = useState('-')
  const [riwayat, setRiwayat] = useState([])
  const [obatList, setObatList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ obat_alkes_id: '', qty: 1, metode_pembayaran: 'tunai', keterangan: '' })
  const [saving, setSaving] = useState(false)
  const [noTransaksi, setNoTransaksi] = useState('-')

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
    if (!branchId) return
    setLoading(true); setError('')
    Promise.all([
      fetchObatAlkes(branchId, {}).catch(() => []),
      fetchPenjualanLangsung(branchId, { limit: 100 }).catch(() => []),
      fetchNextNomorOtc(branchId).catch(() => null),
    ]).then(([obat, riw, no]) => { setObatList(obat); setRiwayat(riw); if (no) setNoTransaksi(no) })
      .catch(() => setError('Gagal memuat data'))
      .finally(() => setLoading(false))
  }, [branchId])

  const selectedObat = obatList.find((o) => String(o.id) === String(form.obat_alkes_id))
  const total = (Number(selectedObat?.hargaJual) || 0) * (Number(form.qty) || 0)

  const simpan = async () => {
    if (!form.obat_alkes_id || !form.qty || form.qty < 1 || saving) return
    setSaving(true); setError('')
    try {
      const res = await createPenjualanLangsung(branchId, form)
      if (!res.success) throw new Error(res.message || 'Gagal simpan')
      const no = await fetchNextNomorOtc(branchId)
      if (no) setNoTransaksi(no)
      setForm((s) => ({ ...s, obat_alkes_id: '', qty: 1, keterangan: '' }))
      const riw = await fetchPenjualanLangsung(branchId, { limit: 100 })
      setRiwayat(riw)
    } catch (e) {
      setError(e.message || 'Gagal menyimpan penjualan')
    } finally { setSaving(false) }
  }

  const totalHariIni = riwayat.reduce((a, r) => a + Number(r.total || 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Penjualan Obat Langsung</h1>
          <p className="text-sm text-[var(--text-muted)]">Branch: <b>{branchName}</b> • No. transaksi berikut: <span className="font-mono">{noTransaksi}</span></p>
        </div>
        <Badge tone="success">{fmtCurrency(totalHariIni)} (riwayat tampil)</Badge>
      </div>

      {error && <div className="px-4 py-2 rounded-lg bg-[var(--status-danger)]/10 text-[var(--status-danger)] text-sm">{error}</div>}

      {/* Form penjualan */}
      <Card className="p-4">
        <p className="mb-3 text-caption font-medium text-[var(--text-tertiary)]">Transaksi Baru</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SelectSearch
            label="Obat / Alkes"
            value={form.obat_alkes_id}
            onChange={(v) => setForm((s) => ({ ...s, obat_alkes_id: v }))}
            placeholder="Ketik nama obat…"
            options={obatList.map((o) => ({ value: o.id, label: o.nama, sub: `stok ${o.stok} • ${fmtCurrency(o.hargaJual)}` }))}
          />
          <Input label="Jumlah" type="number" min={1} value={form.qty} onChange={(v) => setForm((s) => ({ ...s, qty: Number(v) }))} />
          <SelectSearch
            label="Metode Bayar"
            value={form.metode_pembayaran}
            onChange={(v) => setForm((s) => ({ ...s, metode_pembayaran: v }))}
            options={METODE.map((m) => ({ value: m, label: METODE_LABEL[m] }))}
          />
          <div className="flex items-end">
            <div className="w-full">
              <p className="label">Total</p>
              <div className="flex items-center justify-between rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2">
                <span className="font-mono font-semibold text-[var(--brand-primary)]">{fmtCurrency(total)}</span>
                <Btn size="sm" variant="success" onClick={simpan} disabled={saving || !form.obat_alkes_id || !form.qty}>
                  {saving ? 'Menyimpan…' : 'Simpan Penjualan'}
                </Btn>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Input label="Keterangan (opsional)" type="text" placeholder="mis. pembeli umum, tanpa resep" value={form.keterangan} onChange={(v) => setForm((s) => ({ ...s, keterangan: v }))} />
        </div>
      </Card>

      {/* Riwayat */}
      <Card className="overflow-hidden">
        <div className="border-b border-[var(--border-primary)] px-4 py-3">
          <h2 className="font-semibold text-[var(--text-primary)]">Riwayat Penjualan Langsung</h2>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-[var(--text-tertiary)]"><Spinner size="sm" /> Memuat…</div>
        ) : riwayat.length === 0 ? (
          <EmptyState title="Belum ada penjualan langsung" desc="Transaksi OTC akan muncul di sini." />
        ) : (
          <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>No. Transaksi</th><th>Tanggal</th><th>Obat</th>
                  <th className="text-right">Qty</th><th className="text-right">Harga</th><th className="text-right">Total</th><th>Metode</th><th>Kasir</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((r, i) => (
                  <tr key={r.id}>
                    <td className="font-mono font-semibold text-[var(--brand-primary)]">{r.noTransaksi}</td>
                    <td className="font-mono text-caption text-[var(--text-tertiary)]">{fmtTanggal(r.createdAt)}</td>
                    <td className="font-medium text-[var(--text-primary)]">{r.namaObat}</td>
                    <td className="text-right font-mono">{r.qty}</td>
                    <td className="text-right font-mono text-[var(--text-secondary)]">{fmtCurrency(r.hargaSatuan)}</td>
                    <td className="text-right font-mono font-semibold">{fmtCurrency(r.total)}</td>
                    <td><Badge tone={r.metodePembayaran === 'tunai' ? 'success' : 'info'}>{METODE_LABEL[r.metodePembayaran] || r.metodePembayaran}</Badge></td>
                    <td className="text-[var(--text-secondary)]">{r.kasirNama || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
