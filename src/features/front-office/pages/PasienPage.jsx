import { useState, useEffect } from 'react'

import { Card, Badge, Btn, Input } from '../../../shared/components/ui.jsx'
import {
  getPatients,
  getVisitHistoryByBranch,
  getCurrentBranchId,
} from '../../../shared/store/clinic.js'

export default function PasienPage() {
  const branchId = getCurrentBranchId()
  const [searchQuery, setSearchQuery] = useState('')
  const [patientList, setPatientList] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showRiwayat, setShowRiwayat] = useState(false)

  useEffect(() => {
    const all = getPatients()
    setPatientList(all)
    setFilteredPatients(all)
  }, [branchId])

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      setFilteredPatients(
        patientList.filter(p =>
          p.nama.toLowerCase().includes(q) ||
          p.nik.includes(q) ||
          p.noRM.toLowerCase().includes(q) ||
          p.noHP.includes(q)
        )
      )
    } else {
      setFilteredPatients(patientList)
    }
  }, [searchQuery, patientList])

  const handleSelectPatient = (pasien) => {
    setSelectedPatient(pasien)
    setShowRiwayat(true)
  }

  const getRiwayatPasien = (pasienId) => {
    return getVisitHistoryByBranch(branchId).filter(h => h.patientId === pasienId)
  }

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Data Pasien</h1>
          <p className="page-desc">Lihat data pasien & riwayat RME</p>
        </div>
        <span className="text-caption text-[var(--text-muted)]">{filteredPatients.length} pasien terdaftar</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1: Pencarian & Daftar */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <div className="mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama / NIK / No RM"
                className="input"
              />
            </div>

            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-body-sm text-[var(--text-muted)]">Tidak ada pasien ditemukan</p>
                </div>
              ) : (
                filteredPatients.map(p => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-colors ${selectedPatient?.id === p.id ? 'bg-[var(--brand-light)] border border-[var(--brand-primary)]/30' : 'hover:bg-[var(--bg-hover)] border border-transparent'}`}
                    onClick={() => handleSelectPatient(p)}
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] font-bold">
                      {p.nama.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-body-sm truncate">{p.nama}</p>
                      <p className="text-tiny text-[var(--text-muted)] truncate">{p.noRM} • {p.nik}</p>
                    </div>
                    <Badge variant="primary">{p.gender === 'Laki-laki' ? 'L' : 'P'}</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Kolom 2: Detail Pasien & Riwayat */}
        <div className="lg:col-span-2">
          {!selectedPatient ? (
            <Card className="p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <p className="text-body text-[var(--text-secondary)]">Pilih pasien untuk melihat detail & riwayat RME</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Detail Pasien */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-heading-md font-bold text-[var(--text-primary)]">Detail Pasien</h3>
                  <Badge variant="info">{selectedPatient.noRM}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-body-sm">
                  <div>
                    <p className="text-tiny text-[var(--text-muted)]">Nama</p>
                    <p className="font-medium">{selectedPatient.nama}</p>
                  </div>
                  <div>
                    <p className="text-tiny text-[var(--text-muted)]">NIK</p>
                    <p className="font-medium">{selectedPatient.nik}</p>
                  </div>
                  <div>
                    <p className="text-tiny text-[var(--text-muted)]">Tgl Lahir</p>
                    <p className="font-medium">{selectedPatient.tglLahir}</p>
                  </div>
                  <div>
                    <p className="text-tiny text-[var(--text-muted)]">Gender</p>
                    <p className="font-medium">{selectedPatient.gender}</p>
                  </div>
                  <div>
                    <p className="text-tiny text-[var(--text-muted)]">No HP</p>
                    <p className="font-medium">{selectedPatient.noHP}</p>
                  </div>
                  <div>
                    <p className="text-tiny text-[var(--text-muted)]">Terdaftar</p>
                    <p className="font-medium">{selectedPatient.createdAt}</p>
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <p className="text-tiny text-[var(--text-muted)]">Alamat</p>
                    <p className="font-medium">{selectedPatient.alamat}</p>
                  </div>
                </div>
              </Card>

              {/* Riwayat RME */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-heading-md font-bold text-[var(--text-primary)]">Riwayat RME</h3>
                  <span className="text-caption text-[var(--text-muted)]">
                    {getRiwayatPasien(selectedPatient.id).length} kunjungan
                  </span>
                </div>

                {getRiwayatPasien(selectedPatient.id).length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    <p className="text-body-sm">Belum ada riwayat rekam medis</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getRiwayatPasien(selectedPatient.id).map((hist, i) => (
                      <div key={hist.id} className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-[var(--border-primary)]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] font-bold text-body-sm">
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-medium text-body-sm">{hist.tanggal}</p>
                              <p className="text-tiny text-[var(--text-muted)]">{hist.poli?.nama} • {hist.dokter?.nama}</p>
                            </div>
                          </div>
                          <Badge variant={hist.status === 'Selesai' ? 'success' : 'warning'}>{hist.status}</Badge>
                        </div>

                        {/* Content */}
                        {hist.rekamMedis && (
                          <div className="p-3 space-y-2">
                            <div className="grid grid-cols-3 gap-3 text-body-sm">
                              <div>
                                <p className="text-tiny text-[var(--text-muted)]">Tensi</p>
                                <p className="font-medium">{hist.rekamMedis.tensi || '-'}</p>
                              </div>
                              <div>
                                <p className="text-tiny text-[var(--text-muted)]">Suhu</p>
                                <p className="font-medium">{hist.rekamMedis.suhu || '-'}°C</p>
                              </div>
                              <div>
                                <p className="text-tiny text-[var(--text-muted)]">BB</p>
                                <p className="font-medium">{hist.rekamMedis.beratBadan || '-'}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-tiny text-[var(--text-muted)]">Keluhan</p>
                              <p className="text-body-sm">{hist.rekamMedis.keluhan || '-'}</p>
                            </div>
                            <div>
                              <p className="text-tiny text-[var(--text-muted)]">Diagnosis</p>
                              <p className="text-body-sm">{hist.rekamMedis.diagnosis || '-'}</p>
                            </div>
                            {hist.rekamMedis.resep && hist.rekamMedis.resep.length > 0 && (
                              <div>
                                <p className="text-tiny text-[var(--text-muted)] mb-1">Resep</p>
                                <div className="flex flex-wrap gap-1">
                                  {hist.rekamMedis.resep.map((r, ri) => (
                                    <Badge key={ri} variant="primary">{r.obat?.nama || 'Obat'} • {r.dosis}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Footer tagihan */}
                        {hist.tagihan && (
                          <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                            <span className="text-body-sm text-emerald-700 dark:text-emerald-300">Total: {formatRupiah(hist.tagihan.totalBayar)}</span>
                            <Badge variant="success">{hist.tagihan.metodePembayaran}</Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
