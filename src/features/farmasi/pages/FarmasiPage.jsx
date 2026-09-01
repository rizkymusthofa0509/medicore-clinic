// ============================================================
// features/farmasi/pages/FarmasiPage.jsx
// Farmasi — verifikasi & dispensing resep, riwayat mutasi stok.
// Data aktual per branch aktif; stok otomatis berkurang saat dispense.
// ============================================================

import { useEffect, useState } from 'react'

import { Card, Badge, Btn, Input, Spinner, Select, EmptyState } from '../../../shared/components/ui.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import { fetchBranches } from '../../../shared/branches.js'
import { fetchResep, dispenseResep, batalkanResep, fetchMutasiStok } from '../service/farmasiService.js'

const FARMASI_LABEL = { menunggu: 'Menunggu Verifikasi', dispensed: 'Didispensasi', dibatalkan: 'Dibatalkan' }
const FARMASI_TONE = { menunggu: 'warning', dispensed: 'success', dibatalkan: 'neutral' }
const TIPE_LABEL = { masuk: 'Masuk', keluar: 'Keluar', dispensing: 'Dispensing', opname: 'Opname', penyesuaian: 'Penyesuaian' }
const TIPE_TONE = { masuk: 'success', keluar: 'danger', dispensing: 'info', opname: 'warning', penyesuaian: 'warning' }

function fmtCurrency(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v) || 0)
}

function fmtNum(v) {
  return new Intl.NumberFormat('id-ID').format(Number(v) || 0)
}

function fmtTanggal(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export default function FarmasiPage() {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [tab, setTab] = useState('resep') // 'resep' | 'mutasi'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resep, setResep] = useState([])
  const [mutasi, setMutasi] = useState([])
  const [branchName, setBranchName] = useState('-')

  const [detail, setDetail] = useState(null) // resep yang dipilih untuk dispense
  const [catatan, setCatatan] = useState('')
  const [processing, setProcessing] = useState(false)
  const [filterStatus, setFilterStatus] = useState('menunggu')
  const [filterTipe, setFilterTipe] = useState('')

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

  const loadResep = () => {
    if (!branchId) return
    setLoading(true); setError('')
    fetchResep(branchId, { status: filterStatus || '' })
      .then(setResep)
      .catch((e) => setError(e?.response?.data?.message || 'Gagal memuat resep'))
      .finally(() => setLoading(false))
  }

  const loadMutasi = () => {
    if (!branchId) return
    setLoading(true); setError('')
    fetchMutasiStok(branchId, { tipe: filterTipe || '' })
      .then(setMutasi)
      .catch((e) => setError(e?.response?.data?.message || 'Gagal memuat mutasi stok'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { tab === 'resep' ? loadResep() : loadMutasi() }, [branchId, tab, filterStatus, filterTipe])

  const openDetail = (row) => { setDetail(row); setCatatan('') }
  const closeDetail = () => { setDetail(null); setCatatan('') }

  const doDispense = async () => {
    if (!detail || processing) return
    setProcessing(true); setError('')
    try {
      const res = await dispenseResep(branchId, detail.id, catatan)
      if (!res.success) throw new Error(res.message || 'Gagal dispense')
      closeDetail(); loadResep()
    } catch (e) {
      setError(e.message || 'Gagal memproses resep')
    } finally { setProcessing(false) }
  }

  const doBatalkan = async () => {
    if (!detail || processing) return
    if (!window.confirm('Batalkan resep ini? Stok tidak akan berkurang.')) return
    setProcessing(true); setError('')
    try {
      const res = await batalkanResep(branchId, detail.id, catatan || 'Dibatalkan petugas farmasi')
      if (!res.success) throw new Error(res.message || 'Gagal batalkan')
      closeDetail(); loadResep()
    } catch (e) {
      setError(e.message || 'Gagal membatalkan resep')
    } finally { setProcessing(false) }
  }

  const sumObat = (row) => {
    const raw = row.pemberianObat || []
    return raw.reduce((acc, o) => acc + (Number(o.harga) || 0) * (Number(o.jumlah) || 0), 0)
  }

  const totalMenunggu = (resep || []).filter((r) => r.statusFarmasi === 'menunggu').length
  const totalDispensed = (resep || []).filter((r) => r.statusFarmasi === 'dispensed').length

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Farmasi</h1>
          <p className="text-sm text-[var(--text-muted)]">Verifikasi &amp; dispensing resep — branch: <b>{branchName}</b></p>
        </div>
        <div className="flex gap-2">
          <Badge tone="warning">{totalMenunggu} menunggu</Badge>
          <Badge tone="success">{totalDispensed} didispensasi</Badge>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-1 border-b border-[var(--border-primary)]">
        <button className={`btn btn-sm ${tab === 'resep' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('resep')}>
          Verifikasi Resep ({totalMenunggu})
        </button>
        <button className={`btn btn-sm ${tab === 'mutasi' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('mutasi')}>
          Mutasi Stok
        </button>
      </div>

      {error && <div className="px-4 py-2 rounded-lg bg-[var(--status-danger)]/10 text-[var(--status-danger)] text-sm">{error}</div>}

      {tab === 'resep' && (
        <>
          <Card className="p-3.5">
            <div className="flex flex-wrap items-end gap-3">
              <Select
                label="Status"
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { value: 'menunggu', label: 'Menunggu Verifikasi' },
                  { value: 'dispensed', label: 'Didispensasi' },
                  { value: 'dibatalkan', label: 'Dibatalkan' },
                ]}
              />
              <div className="ml-auto"><Btn variant="secondary" size="sm" onClick={loadResep} disabled={loading}>Muat Ulang</Btn></div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            {loading ? (
              <div className="flex items-center gap-2 p-6 text-sm text-[var(--text-tertiary)]"><Spinner size="sm" /> Memuat resep…</div>
            ) : (resep || []).length === 0 ? (
              <EmptyState title="Tidak ada resep" desc="Resep dokter yang menunggu verifikasi akan muncul di sini." />
            ) : (
              <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>No</th><th>Antrean</th><th>Pasien</th><th>Poli</th><th>Dokter</th><th>Tanggal</th>
                      <th className="text-right">Total Obat</th><th>Status Farmasi</th><th className="w-28 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(resep || []).map((r, i) => (
                      <tr key={r.id}>
                        <td className="font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                        <td className="font-mono font-semibold text-[var(--brand-primary)]">{r.noPendaftaran}</td>
                        <td>
                          <div className="font-medium text-[var(--text-primary)]">{r.pasien?.nama || '-'}</div>
                          <div className="font-mono text-caption text-[var(--text-tertiary)]">RM {r.pasien?.noRm || '-'}</div>
                        </td>
                        <td className="text-[var(--text-secondary)]">{r.poli?.nama || '-'}</td>
                        <td className="text-[var(--text-secondary)]">{r.dokter?.nama || '-'}</td>
                        <td className="font-mono text-caption text-[var(--text-tertiary)]">{fmtTanggal(r.tanggal)}</td>
                        <td className="text-right font-mono font-semibold">{fmtCurrency(sumObat(r))}</td>
                        <td><Badge tone={FARMASI_TONE[r.statusFarmasi] || 'neutral'}>{FARMASI_LABEL[r.statusFarmasi] || r.statusFarmasi}</Badge></td>
                        <td className="text-center">
                          {r.statusFarmasi === 'menunggu' ? (
                            <Btn size="sm" variant="primary" onClick={() => openDetail(r)}>Dispense</Btn>
                          ) : (
                            <Btn size="sm" variant="secondary" onClick={() => openDetail(r)}>Detail</Btn>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {tab === 'mutasi' && (
        <>
          <Card className="p-3.5">
            <div className="flex flex-wrap items-end gap-3">
              <Select
                label="Tipe Mutasi"
                value={filterTipe}
                onChange={setFilterTipe}
                options={[
                  { value: '', label: 'Semua Tipe' },
                  { value: 'masuk', label: 'Masuk' },
                  { value: 'keluar', label: 'Keluar' },
                  { value: 'dispensing', label: 'Dispensing' },
                  { value: 'opname', label: 'Opname' },
                  { value: 'penyesuaian', label: 'Penyesuaian' },
                ]}
              />
              <div className="ml-auto"><Btn variant="secondary" size="sm" onClick={loadMutasi} disabled={loading}>Muat Ulang</Btn></div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            {loading ? (
              <div className="flex items-center gap-2 p-6 text-sm text-[var(--text-tertiary)]"><Spinner size="sm" /> Memuat mutasi…</div>
            ) : mutasi.length === 0 ? (
              <EmptyState title="Belum ada mutasi stok" desc="Setiap dispensing / penyesuaian stok akan tercatat di sini." />
            ) : (
              <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>No</th><th>Tanggal</th><th>Obat</th><th>Tipe</th>
                      <th className="text-right">Qty</th><th className="text-right">Stok</th><th>Keterangan</th><th>Oleh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mutasi.map((m, i) => (
                      <tr key={m.id}>
                        <td className="font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                        <td className="font-mono text-caption text-[var(--text-tertiary)]">{fmtTanggal(m.createdAt)}</td>
                        <td className="font-medium text-[var(--text-primary)]">{m.obat?.nama || '-'}</td>
                        <td><Badge tone={TIPE_TONE[m.tipe] || 'neutral'}>{TIPE_LABEL[m.tipe] || m.tipe}</Badge></td>
                        <td className="text-right font-mono font-semibold">{fmtNum(m.qty)}</td>
                        <td className="text-right font-mono text-[var(--text-secondary)]">{fmtNum(m.stokSebelum)} → {fmtNum(m.stokSesudah)}</td>
                        <td className="text-[var(--text-secondary)]">{m.keterangan || '-'}</td>
                        <td className="text-[var(--text-secondary)]">{m.createdBy || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* === Modal detail / dispense === */}
      {detail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-5 py-3">
              <div>
                <h2 className="text-heading-md font-bold text-[var(--text-primary)]">
                  {detail.statusFarmasi === 'menunggu' ? 'Verifikasi & Dispensing Resep' : 'Detail Resep'}
                </h2>
                <p className="text-sm text-[var(--text-muted)]">
                  {detail.noPendaftaran} • {detail.pasien?.nama} • RM {detail.pasien?.noRm}
                </p>
              </div>
              <Btn size="sm" variant="ghost" onClick={closeDetail}>✕</Btn>
            </div>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><p className="text-caption text-[var(--text-tertiary)]">Poli</p><p className="font-medium">{detail.poli?.nama || '-'}</p></div>
                <div><p className="text-caption text-[var(--text-tertiary)]">Dokter</p><p className="font-medium">{detail.dokter?.nama || '-'}</p></div>
                <div><p className="text-caption text-[var(--text-tertiary)]">Tanggal</p><p className="font-medium">{fmtTanggal(detail.tanggal)}</p></div>
                <div><p className="text-caption text-[var(--text-tertiary)]">Status Farmasi</p><p><Badge tone={FARMASI_TONE[detail.statusFarmasi] || 'neutral'}>{FARMASI_LABEL[detail.statusFarmasi] || detail.statusFarmasi}</Badge></p></div>
              </div>

              <div>
                <p className="mb-2 text-caption text-[var(--text-tertiary)]">Daftar Obat Resep</p>
                <table className="table">
                  <thead><tr><th>Obat</th><th className="text-right">Jumlah</th><th className="text-right">Harga</th><th className="text-right">Subtotal</th></tr></thead>
                  <tbody>
                    {(detail.pemberianObat || []).map((o, i) => (
                      <tr key={i}>
                        <td className="font-medium text-[var(--text-primary)]">{o.namaObat || 'Obat tanpa nama'}</td>
                        <td className="text-right font-mono">{fmtNum(o.jumlah)}</td>
                        <td className="text-right font-mono">{fmtCurrency(o.harga)}</td>
                        <td className="text-right font-mono font-semibold">{fmtCurrency((Number(o.harga) || 0) * (Number(o.jumlah) || 0))}</td>
                      </tr>
                    ))}
                    {(detail.pemberianObatRacik || []).map((r, i) => (
                      <tr key={`racik-${i}`}>
                        <td className="text-[var(--text-secondary)]">Racikan: {r.detail || '-'} ({r.aturanPakai || '-'})</td>
                        <td className="text-right font-mono">{fmtNum(r.jumlahKemasan)}</td>
                        <td className="text-right text-[var(--text-tertiary)]">-</td>
                        <td className="text-right text-[var(--text-tertiary)]">-</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr><td colSpan={3} className="text-right font-semibold">Total Obat</td><td className="text-right font-mono font-semibold text-[var(--brand-primary)]">{fmtCurrency(sumObat(detail))}</td></tr>
                  </tfoot>
                </table>
              </div>

              {detail.statusFarmasi === 'menunggu' && (
                <div>
                  <label className="label">Catatan Farmasi (opsional)</label>
                  <Input type="text" placeholder="mis. racikan khusus, pengganti obat…" value={catatan} onChange={setCatatan} />
                </div>
              )}
              {detail.catatanFarmasi && (
                <p className="text-sm text-[var(--text-secondary)]"><b>Catatan:</b> {detail.catatanFarmasi}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[var(--border-primary)] px-5 py-3">
              <Btn size="sm" variant="ghost" onClick={closeDetail}>Tutup</Btn>
              {detail.statusFarmasi === 'menunggu' && (
                <>
                  <Btn size="sm" variant="danger" onClick={doBatalkan} disabled={processing}>Batalkan Resep</Btn>
                  <Btn size="sm" variant="success" onClick={doDispense} disabled={processing}>
                    {processing ? 'Memproses…' : 'Dispense & Kurangi Stok'}
                  </Btn>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
