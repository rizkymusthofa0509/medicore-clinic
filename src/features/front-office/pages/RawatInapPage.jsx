// ============================================================
// features/front-office/pages/RawatInapPage.jsx
// Rawat Inap — status implementasi + data kunjungan rawat inap aktual.
// ============================================================

import { useEffect, useState } from 'react'

import { Card, Badge, Btn, Spinner, EmptyState, PageHeader } from '../../../shared/components/ui.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import { fetchBranches } from '../../../shared/branches.js'
import { fetchKunjungan } from '../../front-office/service/kunjunganService.js'

function fmtTanggal(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function RawatInapPage() {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [branchName, setBranchName] = useState('-')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

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
    fetchKunjungan(branchId, { tipe: 'rawat_inap', limit: 200 })
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [branchId])

  return (
    <div className="space-y-4">
      <PageHeader title="Rawat Inap" desc={`Modul rawat inap lengkap (kamar, admisi, visite, discharge) dalam pengembangan. Berikut data kunjungan rawat inap aktual branch: ${branchName}.`} />

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-[var(--text-tertiary)]"><Spinner size="sm" /> Memuat…</div>
        ) : rows.length === 0 ? (
          <EmptyState title="Belum ada kunjungan rawat inap" desc="Kunjungan tipe rawat_inap akan muncul di sini." />
        ) : (
          <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>No</th><th>No. Pendaftaran</th><th>Pasien</th><th>Poli</th><th>Dokter</th><th>Tanggal</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((k, i) => (
                  <tr key={k.id}>
                    <td className="font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                    <td className="font-mono font-semibold text-[var(--brand-primary)]">{k.noPendaftaran}</td>
                    <td>
                      <div className="font-medium text-[var(--text-primary)]">{k.pasien?.nama || '-'}</div>
                      <div className="font-mono text-caption text-[var(--text-tertiary)]">RM {k.pasien?.noRm || '-'}</div>
                    </td>
                    <td className="text-[var(--text-secondary)]">{k.poli?.nama || '-'}</td>
                    <td className="text-[var(--text-secondary)]">{k.dokter?.nama || '-'}</td>
                    <td className="font-mono text-caption text-[var(--text-tertiary)]">{fmtTanggal(k.tglJamKunjungan)}</td>
                    <td><Badge tone={k.status === 'selesai' ? 'success' : k.status === 'batal' ? 'danger' : 'warning'}>{k.status}</Badge></td>
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
