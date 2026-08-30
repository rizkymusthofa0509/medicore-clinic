import { useState, useEffect } from 'react'

import { Card, Badge, Btn, Input } from '../../../shared/components/ui.jsx'
import {
  getVisits,
  buatTagihan,
  updateKunjunganStatus,
  getCurrentBranchId,
  getBranches,
} from '../../../shared/store/clinic.js'

export default function KasirPage() {
  const branchId = getCurrentBranchId()
  const [activeTab, setActiveTab] = useState('tagihan') // 'tagihan' | 'riwayat'

  // Daftar tagihan pasien yang sudah diperiksa
  const [tagihanList, setTagihanList] = useState([])
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Form pembayaran
  const [paymentForm, setPaymentForm] = useState({
    biayaKonsultasi: 50000,
    biayaTindakan: 0,
    metodePembayaran: 'Tunai',
    notes: '',
  })
  const [paymentSaved, setPaymentSaved] = useState(false)

  // Load
  useEffect(() => {
    const visits = getVisits(branchId)
    setTagihanList(visits.filter(v => v.status === 'Apotek'))
  }, [branchId])

  const loadDetails = (visit) => {
    setSelectedVisit(visit)
    setPaymentForm({
      biayaKonsultasi: 50000,
      biayaTindakan: 0,
      metodePembayaran: 'Tunai',
      notes: '',
    })
    setShowPaymentModal(true)
    setPaymentSaved(false)
  }

  const handleBayar = () => {
    if (!selectedVisit) return
    buatTagihan(selectedVisit.id, paymentForm)
    setPaymentSaved(true)
    setTimeout(() => {
      setShowPaymentModal(false)
      const visits = getVisits(branchId)
      setTagihanList(visits.filter(v => v.status === 'Apotek'))
      setSelectedVisit(null)
    }, 800)
  }

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Kasir & Pembayaran</h1>
          <p className="page-desc">Tagihan pasien & proses pembayaran</p>
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

      {/* Tab */}
      <div className="flex gap-1 border-b border-[var(--border-primary)]">
        <button
          onClick={() => setActiveTab('tagihan')}
          className={`btn btn-sm ${activeTab === 'tagihan' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg>
          Tagihan Antrian ({tagihanList.length})
        </button>
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`btn btn-sm ${activeTab === 'riwayat' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
          Riwayat Transaksi
        </button>
      </div>

      {/* === TAB: Tagihan === */}
      {activeTab === 'tagihan' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading-lg font-bold text-[var(--text-primary)]">Tagihan Pasien</h2>
          </div>

          {tagihanList.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M9.5 13c1.11 0 2.08-.402 2.599-1M14.5 13c1.11 0 2.08-.402 2.599-1M8 21a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>
              <p className="text-body text-[var(--text-secondary)]">Belum ada pasien menunggu pembayaran</p>
              <p className="text-caption text-[var(--text-muted)] mt-1">Pasien yang sudah diperiksa dokter akan muncul di sini.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Antrean</th>
                    <th>Pasien</th>
                    <th>Poli</th>
                    <th>Dokter</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {tagihanList.map(vis => (
                    <tr key={vis.id}>
                      <td className="font-medium">{vis.noAntrean}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] text-tiny font-bold">
                            {vis.patient?.nama?.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium">{vis.patient?.nama}</span>
                            <span className="text-caption text-[var(--text-muted)] ml-1">({vis.patient?.noRM})</span>
                          </div>
                        </div>
                      </td>
                      <td><Badge variant="primary">{vis.poli?.nama}</Badge></td>
                      <td className="text-body-sm">{vis.dokter?.nama}</td>
                      <td>
                        <Badge variant="warning">Apotek</Badge>
                      </td>
                      <td>
                        <button
                          onClick={() => loadDetails(vis)}
                          className="btn btn-primary btn-sm"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
                          Bayar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* === TAB: Riwayat Transaksi === */}
      {activeTab === 'riwayat' && (
        <Card className="p-5">
          <h2 className="text-heading-lg font-bold text-[var(--text-primary)] mb-4">Riwayat Transaksi Pembayaran</h2>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>No. Antrean</th>
                  <th>Pasien</th>
                  <th>Tanggal</th>
                  <th>Total Bayar</th>
                  <th>Metode</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tagihanList.map((vis, i) => (
                  <tr key={i}>
                    <td className="font-medium">{vis.noAntrean}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] text-tiny font-bold">
                          {vis.patient?.nama?.charAt(0)}
                        </div>
                        <span className="font-medium">{vis.patient?.nama}</span>
                      </div>
                    </td>
                    <td className="text-body-sm">{vis.tanggal}</td>
                    <td className="font-medium text-success">
                      {vis.tagihan ? formatRupiah(vis.tagihan.totalBayar) : '-'}
                    </td>
                    <td>
                      <Badge variant={vis.tagihan?.metodePembayaran === 'Tunai' ? 'success' : 'primary'}>
                        {vis.tagihan?.metodePembayaran || 'Tunai'}
                      </Badge>
                    </td>
                    <td>
                      <button
                        onClick={() => loadDetails(vis)}
                        className="btn btn-secondary btn-sm"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        Cetak Struk
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <Card className="p-6 border-[var(--brand-primary)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading-lg font-bold text-[var(--text-primary)]">Proses Pembayaran</h2>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="btn btn-ghost btn-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              Batal
            </button>
          </div>

          {/* Info pasien */}
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] font-bold">
                {selectedVisit?.patient?.nama?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-body">{selectedVisit?.patient?.nama}</p>
                <p className="text-caption text-[var(--text-muted)]">
                  No RM: {selectedVisit?.patient?.noRM} • {selectedVisit?.noAntrean} • {selectedVisit?.poli?.nama}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Rincian biaya */}
            <div className="p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              <p className="text-caption text-[var(--text-muted)] mb-2">Rincian Biaya</p>
              <div className="space-y-2 text-body-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Biaya Konsultasi</span>
                  <span className="font-medium">
                    <input
                      type="number"
                      value={paymentForm.biayaKonsultasi}
                      onChange={e => setPaymentForm({ ...paymentForm, biayaKonsultasi: parseInt(e.target.value, 10) || 0 })}
                      className="input w-32"
                      min={0}
                    />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Biaya Tindakan</span>
                  <span className="font-medium">
                    <input
                      type="number"
                      value={paymentForm.biayaTindakan}
                      onChange={e => setPaymentForm({ ...paymentForm, biayaTindakan: parseInt(e.target.value, 10) || 0 })}
                      className="input w-32"
                      min={0}
                    />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Total Obat</span>
                  <span className="font-medium text-caption text-[var(--text-muted)]">
                    (Dihitung otomatis dari resep)
                  </span>
                </div>
                <div className="border-t border-[var(--border-primary)] mt-2 pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Bayar</span>
                    <span className="font-bold text-lg text-[var(--brand-primary)]">
                      {formatRupiah(paymentForm.biayaKonsultasi + paymentForm.biayaTindakan)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metode pembayaran */}
            <div>
              <label className="label">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2">
                {['Tunai', 'QRIS', 'Transfer Bank'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentForm({ ...paymentForm, metodePembayaran: method })}
                    className={`btn ${paymentForm.metodePembayaran === method ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label">Catatan (opsional)</label>
              <textarea
                value={paymentForm.notes}
                onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="input"
                placeholder="Catatan tambahan..."
                rows={2}
              />
            </div>

            {/* Tombol */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
              <button onClick={() => setShowPaymentModal(false)} className="btn btn-ghost">
                Batal
              </button>
              <button
                onClick={handleBayar}
                className="btn btn-success btn-lg"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
                {paymentSaved ? '✓ Berhasil' : 'Konfirmasi Pembayaran'}
              </button>
            </div>
          </div>

          {/* Struk / Kuitansi (jika sudah berhasil) */}
          {paymentSaved && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
                </div>
                <h3 className="text-heading-md font-bold text-emerald-700 dark:text-emerald-300">Pembayaran Berhasil</h3>
                <p className="text-caption text-emerald-600 dark:text-emerald-400 mt-1">
                  Total: <strong>{formatRupiah(paymentForm.biayaKonsultasi + paymentForm.biayaTindakan)}</strong> • Metode: <strong>{paymentForm.metodePembayaran}</strong>
                </p>
                <div className="mt-3 flex gap-2 justify-center">
                  <button className="btn btn-secondary btn-sm">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
                    Cetak Struk
                  </button>
                  <button onClick={() => setShowPaymentModal(false)} className="btn btn-primary btn-sm">
                    Selesai
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
