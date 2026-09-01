// ============================================================
// features/kasir/pages/KasirPage.jsx
// Kasir & Pembayaran — data aktual dari BE, di-scope branch aktif.
// Menutup siklus pendapatan: registrasi → pemeriksaan → kasir → cetak struk.
// ============================================================

import { useEffect, useState } from 'react'

import { Card, Badge, Btn, Input, Spinner } from '../../../shared/components/ui.jsx'
import SelectSearch from '../../../shared/components/SelectSearch.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import { fetchBranches } from '../../../shared/branches.js'
import { fetchTagihan, bayarTagihan } from '../service/kasirService.js'

const METODE = ['tunai', 'qris', 'transfer', 'asuransi', 'bpjs']
const METODE_LABEL = { tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer Bank', asuransi: 'Asuransi', bpjs: 'BPJS' }
const STATUS_LABEL = { belum_bayar: 'Belum Bayar', persetujuan: 'Persetujuan', lunas: 'Lunas' }
const STATUS_TONE = { belum_bayar: 'danger', persetujuan: 'warning', lunas: 'success' }

function fmtCurrency(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val) || 0)
}

function fmtTanggal(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function KasirPage() {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [branches, setBranches] = useState([])
  const [tagihan, setTagihan] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('tagihan')

  const [selected, setSelected] = useState(null) // kunjungan yang akan dibayar
  const [paying, setPaying] = useState(false)
  const [struk, setStruk] = useState(null)

  useEffect(() => {
    const onBranch = () => setBranchId(getCurrentBranchId())
    window.addEventListener('branch:changed', onBranch)
    return () => window.removeEventListener('branch:changed', onBranch)
  }, [])

  const loadAll = () => {
    if (!branchId) return
    setLoading(true); setError('')
    Promise.all([
      fetchBranches({ force: true }).catch(() => []),
      fetchTagihan(branchId, { status: 'belum_bayar' }).catch(() => []),
      fetchTagihan(branchId, { status: 'lunas', limit: 100 }).catch(() => []),
    ]).then(([br, tg, hi]) => { setBranches(br); setTagihan(tg); setHistory(hi); setError('') })
      .catch(() => setError('Gagal memuat data kasir'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [branchId])

  const submitBayar = async () => {
    if (!selected) return
    const total = Number(selected.totalTagihan)
    const bayar = Number(selected.bayarForm?.jumlah_dibayarkan ?? 0)
    if (bayar < total) return alert('Jumlah dibayarkan kurang dari total tagihan')
    const payload = selected.bayarForm
    const res = await bayarTagihan(branchId, selected.id, {
      jumlah_dibayarkan: payload.jumlah_dibayarkan,
      metode_pembayaran: payload.metode_pembayaran,
      catatan: payload.catatan,
    })
    if (res.success) {
      setStruk({ ...res.data, pasien: selected.pasien, rincian: selected.rincian, noPendaftaran: selected.noPendaftaran })
      loadAll()
    } else {
      alert(res.message || 'Pembayaran gagal')
    }
  }

  const closeBayar = () => { setPaying(false); setSelected(null) }

  const activeBranch = branches.find((b) => String(b.id) === String(branchId))
  const branchNama = activeBranch?.name || activeBranch?.nama || `Branch ${branchId}`
  const branchAlamat = activeBranch?.address || activeBranch?.alamat || ''
  const branchTelp = activeBranch?.phone || activeBranch?.telepon || ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Kasir &amp; Pembayaran</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {branchNama} • {tagihan.length} pasien menunggu pembayaran
        </p>
      </div>

      {/* Tab */}
      <div className="flex gap-1 border-b border-[var(--border-primary)]">
        <button
          className={`btn btn-sm ${activeTab === 'tagihan' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('tagihan')}
        >Tagihan Antrian ({tagihan.length})</button>
        <button
          className={`btn btn-sm ${activeTab === 'riwayat' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('riwayat')}
        >Riwayat Pembayaran ({history.length})</button>
      </div>

      {/* Error */}
      {error && <div className="px-4 py-2 rounded-lg bg-[var(--status-danger)]/10 text-[var(--status-danger)] text-sm">{error}</div>}

      {/* === TAB: Tagihan antrian === */}
      {activeTab === 'tagihan' && (
        <Card className="p-0">
          {loading && <div className="p-6"><Spinner size="sm" /> Memuat…</div>}
          {!loading && tagihan.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
              <p className="text-[var(--text-secondary)]">Belum ada pasien menunggu pembayaran</p>
            </div>
          ) : (
            <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Antrean</th>
                    <th>Pasien</th>
                    <th>Poli</th>
                    <th>Dokter</th>
                    <th className="text-right">Pendaftaran</th>
                    <th className="text-right">Obat</th>
                    <th className="text-right">Tindakan</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Sisa</th>
                    <th className="w-28 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {tagihan.map((row, i) => (
                    <tr key={row.id}>
                      <td className="font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                      <td className="font-mono font-semibold text-[var(--brand-primary)]">{row.noPendaftaran}</td>
                      <td>
                        <div className="font-medium text-[var(--text-primary)]">{row.pasien?.nama || '-'}</div>
                        <div className="font-mono text-caption text-[var(--text-tertiary)]">RM {row.pasien?.noRm || '-'}</div>
                      </td>
                      <td><Badge tone="info">{row.poli?.nama || '-'}</Badge></td>
                      <td className="text-[var(--text-secondary)]">{row.dokter?.nama || '-'}</td>
                      <td className="text-right font-mono">{fmtCurrency(row.rincian?.pendaftaran)}</td>
                      <td className="text-right font-mono">{fmtCurrency(row.rincian?.obat)}</td>
                      <td className="text-right font-mono">{fmtCurrency(row.rincian?.tindakan)}</td>
                      <td className="font-semibold text-right text-[var(--brand-primary)]">{fmtCurrency(row.totalTagihan)}</td>
                      <td className={`font-semibold text-right ${row.utang > 0 ? 'text-[var(--status-danger)]' : 'text-[var(--status-success)]'}`}>
                        {row.utang > 0 ? fmtCurrency(row.utang) : 'Lunas'}
                      </td>
                      <td className="text-center">
                        <Btn size="sm" variant="primary" onClick={() => {
                          setSelected({ ...row, bayarForm: { jumlah_dibayarkan: Number(row.totalTagihan), metode_pembayaran: 'tunai', catatan: '' } })
                          setPaying(true)
                        }}>
                          Bayar
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* === TAB: Riwayat pembayaran === */}
      {activeTab === 'riwayat' && (
        <Card className="p-0">
          {loading && <div className="p-6"><Spinner size="sm" /> Memuat…</div>}
          {!loading && history.length === 0 ? (
            <div className="px-6 py-12 text-center text-[var(--text-secondary)]">Belum ada riwayat pembayaran.</div>
          ) : (
            <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>No</th><th>Antrean</th><th>Pasien</th><th>Tanggal Bayar</th><th>Total</th><th>Metode</th><th>Kasir</th><th className="w-24 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, i) => (
                    <tr key={row.id}>
                      <td className="font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                      <td className="font-mono text-[var(--brand-primary)]">{row.noPendaftaran}</td>
                      <td className="font-medium text-[var(--text-primary)]">{row.pasien?.nama || '-'}</td>
                      <td className="text-caption text-[var(--text-secondary)]">{fmtTanggal(row.tanggalBayar)}</td>
                      <td className="font-mono font-semibold">{fmtCurrency(row.totalTagihan)}</td>
                      <td><Badge tone={row.metodePembayaran === 'tunai' ? 'success' : 'primary'}>{METODE_LABEL[row.metodePembayaran] || row.metodePembayaran}</Badge></td>
                      <td className="text-[var(--text-secondary)]">{row.kasirNama || '-'}</td>
                      <td className="text-center">
                        <Btn size="sm" variant="secondary" onClick={() => setStruk({ pasien: row.pasien, rincian: row.rincian, noPendaftaran: row.noPendaftaran, totalTagihan: row.totalTagihan, metodePembayaran: row.metodePembayaran, kasirNama: row.kasirNama, tanggalBayar: row.tanggalBayar, lunas: true })}>
                          Struk
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* === Modal proses pembayaran === */}
      {paying && selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-5 py-3">
              <div>
                <h2 className="text-heading-md font-bold text-[var(--text-primary)]">Proses Pembayaran</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  {selected.noPendaftaran} • {selected.pasien?.nama} • RM {selected.pasien?.noRm}
                </p>
              </div>
              <Btn size="sm" variant="ghost" onClick={closeBayar}>✕</Btn>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* Rincian biaya */}
              <div>
                <p className="text-caption text-[var(--text-muted)] mb-2">Rincian Biaya</p>
                <table className="table">
                  <thead><tr><th>Komponen</th><th className="text-right">Jumlah</th></tr></thead>
                  <tbody>
                    <tr><td>Pendaftaran</td><td className="text-right font-mono">{fmtCurrency(selected.rincian?.pendaftaran)}</td></tr>
                    <tr><td>Obat</td><td className="text-right font-mono">{fmtCurrency(selected.rincian?.obat)}</td></tr>
                    <tr><td>Tindakan</td><td className="text-right font-mono">{fmtCurrency(selected.rincian?.tindakan)}</td></tr>
                    <tr className="font-bold">
                      <td>Total Tagihan</td>
                      <td className="text-right font-mono text-[var(--brand-primary)]">{fmtCurrency(selected.totalTagihan)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Form pembayaran */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Jumlah Dibayarkan</label>
                  <Input type="number" min={Number(selected.totalTagihan)} step="1000"
                    value={selected.bayarForm?.jumlah_dibayarkan ?? selected.totalTagihan}
                    onChange={(e) => setSelected({ ...selected, bayarForm: { ...(selected.bayarForm || {}), jumlah_dibayarkan: Number(e.target.value) } })} />
                  {Number(selected.bayarForm?.jumlah_dibayarkan ?? selected.totalTagihan) > Number(selected.totalTagihan) && (
                    <p className="text-caption text-[var(--status-success)] mt-1">Kembali: {fmtCurrency(Number(selected.bayarForm?.jumlah_dibayarkan ?? selected.totalTagihan) - Number(selected.totalTagihan))}</p>
                  )}
                </div>
                <div>
                  <SelectSearch
                    label="Metode Pembayaran"
                    value={selected.bayarForm?.metode_pembayaran ?? 'tunai'}
                    onChange={(v) => setSelected({ ...selected, bayarForm: { ...(selected.bayarForm || {}), metode_pembayaran: v } })}
                    options={METODE.map((m) => ({ value: m, label: METODE_LABEL[m] }))}
                  />
                </div>
              </div>
              <div>
                <label className="label">Catatan (opsional)</label>
                <Input type="text" placeholder="mis. BPJS ditolak, diskon khusus..."
                  value={selected.bayarForm?.catatan ?? ''}
                  onChange={(e) => setSelected({ ...selected, bayarForm: { ...(selected.bayarForm || {}), catatan: e.target.value } })} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[var(--border-primary)] px-5 py-3">
              <Btn size="sm" variant="ghost" onClick={closeBayar}>Batal</Btn>
              <Btn size="sm" variant="success" onClick={submitBayar}>
                Konfirmasi Pembayaran
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* === Struk / Cetak === */}
      {struk && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <StrukModal
            branch={{ nama: branchNama, alamat: branchAlamat, telp: branchTelp }}
            data={struk}
            onClose={() => setStruk(null)}
          />
        </div>
      )}
    </div>
  )
}

// Komponen statis (tidak pakai state tambahan)

// Struk print
function StrukModal({ branch, data, onClose }) {
  const printStruk = () => {
    const rincian = data.rincian || {}
    const itemsObat = (rincian.items?.obat || []).filter((i) => Number(i.nilai) > 0)
    const itemsTindakan = (rincian.items?.tindakan || []).filter((i) => Number(i.nilai) > 0)

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Struk Kasir</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 8px; color: #111; }
        .kop { text-align: center; font-weight: bold; font-size: 15px; margin-bottom: 4px; }
        .kop small { font-size: 10px; display: block; font-weight: normal; color: #555; }
        .row { display: flex; justify-content: space-between; }
        .rincian td { padding: 1px 2px; }
        .total { font-weight: bold; border-top: 1px double #111; }
        hr { border: none; border-top: 1px dashed #aaa; margin: 6px 0; }
      </style>
    </head><body>
      <div class="kop">
        ${branch.nama || 'MEDICORE CLINIC'}<br />
        <small>${[branch.alamat, branch.telp].filter(Boolean).join(' • ') || 'Klinik Utama'}</small>
      </div>
      <hr />
      <div class="row"><span>No. Pendaftaran</span><span>${data.noPendaftaran || '-'}</span></div>
      <div class="row"><span>Pasien</span><span>${data.pasien?.nama || '-'} (RM ${data.pasien?.noRm || '-'})</span></div>
      <div class="row"><span>Tanggal</span><span>${fmtTanggal(data.tanggalBayar || data.tanggal || new Date().toISOString())}</span></div>
      <div class="row"><span>Metode</span><span>${METODE_LABEL[data.metodePembayaran] || data.metodePembayaran || '-'}</span></div>
      <hr />
      <table class="rincian" width="100%">
        <tr><td>Pendaftaran</td><td align="right">${fmtCurrency(rincian.pendaftaran || rincian.totalPendaftaran || 0)}</td></tr>
        ${itemsObat.map((i) => `<tr><td>Obat: ${i.nama} x${i.jumlah}</td><td align="right">${fmtCurrency(i.nilai)}</td></tr>`).join('')}
        ${itemsTindakan.map((i) => `<tr><td>Tindakan: ${i.nama} x${i.jumlah}</td><td align="right">${fmtCurrency(i.nilai)}</td></tr>`).join('')}
        <tr class="total"><td>Total Tagihan</td><td align="right">${fmtCurrency(data.totalTagihan || rincian.total)}</td></tr>
        <tr><td>Dibayar (${METODE_LABEL[data.metodePembayaran] || ''} )</td><td align="right">${fmtCurrency(data.jumlahDibayarkan || data.totalTagihan)}</td></tr>
      </table>
      <div class="row total"><span>Kembalian</span><span>${fmtCurrency(data.kembalian || 0)}</span></div>
      <hr />
      <div class="row"><span>Kasir</span><span>${data.kasirNama || '-'}</span></div>
      <p style="text-align:center;margin-top:8px;text-decoration:underline">TERIMA KASIH</p>
    </body></html>`

    const win = window.open('', '_blank', 'width=360,height=640')
    win.document.write(html); win.document.close(); win.focus(); win.print()
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-4 py-2">
        <h2 className="font-bold text-[var(--text-primary)]">Struk / Kuitansi</h2>
        <Btn size="sm" variant="ghost" onClick={onClose}>✕</Btn>
      </div>
      <div className="p-4 text-sm space-y-1">
        <div><b>{branch.nama || 'MEDICORE CLINIC'}</b></div>
        <div className="text-caption text-[var(--text-secondary)]">{[branch.alamat, branch.telp].filter(Boolean).join(' • ')}</div>
        <hr className="my-2 border-[var(--border-primary)]" />
        <div className="flex justify-between"><span>No. Pendaftaran</span><span className="font-mono">{data.noPendaftaran || '-'}</span></div>
        <div className="flex justify-between"><span>Pasien</span><span>{data.pasien?.nama || '-'} (RM {data.pasien?.noRm || '-'})</span></div>
        <div className="flex justify-between"><span>Total</span><span className="font-bold text-[var(--brand-primary)]">{fmtCurrency(data.totalTagihan)}</span></div>
        <div className="flex justify-between"><span>Metode</span><span>{METODE_LABEL[data.metodePembayaran] || data.metodePembayaran}</span></div>
        <div className="flex justify-between"><span>Kasir</span><span>{data.kasirNama || '-'}</span></div>
        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-primary)]">
          <Btn size="sm" variant="ghost" onClick={onClose}>Tutup</Btn>
          <Btn size="sm" variant="primary" onClick={printStruk}>Cetak Struk</Btn>
        </div>
      </div>
    </div>
  )
}
