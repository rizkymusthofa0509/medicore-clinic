import { useState, useEffect } from 'react'

import { Card, Badge, Btn, Input } from '../../../shared/components/ui.jsx'
import {
  getVisits,
  getVisitHistoryByBranch,
  getCurrentBranchId,
  getBranches,
  getObatList,
} from '../../../shared/store/clinic.js'

export default function LaporanKlinikPage() {
  const branchId = getCurrentBranchId()
  const [activeTab, setActiveTab] = useState('pendapatan')
  const [filterTanggal, setFilterTanggal] = useState('')
  const [filterBulan, setFilterBulan] = useState('')

  const [tagihanList, setTagihanList] = useState([])
  const [obatList, setObatList] = useState([])
  const [penjualanObatData, setPenjualanObatData] = useState([])

  useEffect(() => {
    const hist = getVisitHistoryByBranch(branchId)
    const filtered = hist.filter(h => h.tagihan)
    setTagihanList(filtered)

    const obats = getObatList(branchId)
    setObatList(obats)

    const penjualanMap = {}
    hist.forEach(h => {
      if (h.rekamMedis?.resep) {
        h.rekamMedis.resep.forEach(r => {
          penjualanMap[r.obatId] = (penjualanMap[r.obatId] || 0) + (r.qty || 0)
        })
      }
    })
    const penjualanArray = Object.keys(penjualanMap).map(obatId => {
      const ob = obatList.find(o => o.id === obatId)
      return {
        obatId,
        nama: ob?.nama || 'Obat tidak diketahui',
        kategori: ob?.kategori || '-',
        totalTerjual: penjualanMap[obatId],
        hargaJual: ob?.hargaJual || 0,
        totalPendapatan: penjualanMap[obatId] * (ob?.hargaJual || 0),
      }
    })
    setPenjualanObatData(penjualanArray.sort((a, b) => b.totalPendapatan - a.totalPendapatan))
  }, [branchId])

  const filteredTagihan = tagihanList.filter(h => {
    if (!filterTanggal && !filterBulan) return true
    if (filterTanggal && h.tglBayar !== filterTanggal) return false
    if (filterBulan && !h.tglBayar.startsWith(filterBulan.slice(0, 7))) return false
    return true
  })

  const totalSemua = filteredTagihan.reduce((sum, h) => sum + (h.tagihan?.totalBayar || 0), 0)
  const totalTunai = filteredTagihan.filter(h => h.tagihan?.metodePembayaran === 'Tunai').reduce((sum, h) => sum + (h.tagihan?.totalBayar || 0), 0)
  const totalQris = filteredTagihan.filter(h => h.tagihan?.metodePembayaran === 'QRIS').reduce((sum, h) => sum + (h.tagihan?.totalBayar || 0), 0)
  const totalTransfer = filteredTagihan.filter(h => h.tagihan?.metodePembayaran === 'Transfer Bank').reduce((sum, h) => sum + (h.tagihan?.totalBayar || 0), 0)

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Laporan Klinik</h1>
          <p className="page-desc">Pendapatan & analisis penjualan obat</p>
        </div>
        <div>
          <span className="text-caption text-[var(--text-muted)]">Branch:</span>
          <select
            value={branchId}
            onChange={e => {
              // Update branch
            }}
            className="input input-sm flex-none w-48"
          >
            {getBranches().map(b => (
              <option key={b.id} value={b.id}>{b.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Filter Tanggal</label>
            <input
              type="date"
              value={filterTanggal}
              onChange={e => setFilterTanggal(e.target.value)}
              className="input w-40"
            />
          </div>
          <div>
            <label className="label">Filter Bulan</label>
            <select
              value={filterBulan}
              onChange={e => setFilterBulan(e.target.value)}
              className="input w-40"
            >
              <option value="">-- Semua Bulan --</option>
              <option value="2024-01">Januari 2024</option>
              <option value="2024-02">Februari 2024</option>
              <option value="2024-03">Maret 2024</option>
              <option value="2024-04">April 2024</option>
              <option value="2024-05">Mei 2024</option>
              <option value="2024-06">Juni 2024</option>
              <option value="2024-07">Juli 2024</option>
              <option value="2024-08">Agustus 2024</option>
            </select>
          </div>
          {(filterTanggal || filterBulan) && (
            <button
              onClick={() => { setFilterTanggal(''); setFilterBulan('') }}
              className="btn btn-secondary"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              Reset Filter
            </button>
          )}
        </div>
      </Card>

      {/* Tab */}
      <div className="flex gap-1 border-b border-[var(--border-primary)]">
        <button
          onClick={() => setActiveTab('pendapatan')}
          className={`btn btn-sm ${activeTab === 'pendapatan' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Pendapatan
        </button>
        <button
          onClick={() => setActiveTab('penjualan-obat')}
          className={`btn btn-sm ${activeTab === 'penjualan-obat' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          Penjualan Obat
        </button>
      </div>

      {/* === TAB: Pendapatan === */}
      {activeTab === 'pendapatan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <p className="text-caption text-[var(--text-muted)] uppercase tracking-wide">Total Pendapatan</p>
              <p className="font-display text-display-lg font-bold mt-1">{formatRupiah(totalSemua)}</p>
              <p className="text-caption text-[var(--text-muted)] mt-1">{filteredTagihan.length} transaksi</p>
            </Card>
            <Card className="p-5 border-l-4 border-l-emerald-500">
              <p className="text-caption text-[var(--text-muted)] uppercase tracking-wide">Tunai</p>
              <p className="font-display text-display-lg font-bold mt-1 text-emerald-600 dark:text-emerald-400">{formatRupiah(totalTunai)}</p>
            </Card>
            <Card className="p-5 border-l-4 border-l-primary">
              <p className="text-caption text-[var(--text-muted)] uppercase tracking-wide">QRIS</p>
              <p className="font-display text-display-lg font-bold mt-1 text-[var(--brand-primary)]">{formatRupiah(totalQris)}</p>
            </Card>
            <Card className="p-5 border-l-4 border-l-accent">
              <p className="text-caption text-[var(--text-muted)] uppercase tracking-wide">Transfer Bank</p>
              <p className="font-display text-display-lg font-bold mt-1 text-[var(--accent-primary)]">{formatRupiah(totalTransfer)}</p>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="text-heading-lg font-bold text-[var(--text-primary)] mb-4">Detail Transaksi</h2>
            {filteredTagihan.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-body text-[var(--text-secondary)]">Tidak ada data transaksi</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>No. Antrean</th>
                      <th>Pasien</th>
                      <th>Tanggal</th>
                      <th>Biaya Konsultasi</th>
                      <th>Biaya Tindakan</th>
                      <th>Total Obat</th>
                      <th>Total Bayar</th>
                      <th>Metode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTagihan.map((h, i) => (
                      <tr key={i}>
                        <td className="font-medium">{h.noAntrean}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] text-tiny font-bold">
                              {h.patient?.nama?.charAt(0)}
                            </div>
                            <span className="font-medium">{h.patient?.nama}</span>
                          </div>
                        </td>
                        <td className="text-body-sm">{h.tglBayar || h.tanggal}</td>
                        <td className="text-body-sm">{formatRupiah(h.tagihan?.biayaKonsultasi || 0)}</td>
                        <td className="text-body-sm">{formatRupiah(h.tagihan?.biayaTindakan || 0)}</td>
                        <td className="text-body-sm">{formatRupiah(h.tagihan?.totalObat || 0)}</td>
                        <td className="font-bold">{formatRupiah(h.tagihan?.totalBayar || 0)}</td>
                        <td>
                          <Badge variant={h.tagihan?.metodePembayaran === 'Tunai' ? 'success' : 'primary'}>
                            {h.tagihan?.metodePembayaran || 'Tunai'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* === TAB: Penjualan Obat === */}
      {activeTab === 'penjualan-obat' && (
        <Card className="p-5">
          <h2 className="text-heading-lg font-bold text-[var(--text-primary)] mb-4">Obat Terlaris</h2>
          {penjualanObatData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-body text-[var(--text-secondary)]">Belum ada data penjualan obat</p>
            </div>
          ) : (
            <div className="space-y-3">
              {penjualanObatData.map((item, i) => (
                <div
                  key={item.obatId}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] font-bold text-body-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.nama}</p>
                    <p className="text-caption text-[var(--text-muted)]">{item.kategori} • {item.totalTerjual} item terjual</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatRupiah(item.totalPendapatan)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
