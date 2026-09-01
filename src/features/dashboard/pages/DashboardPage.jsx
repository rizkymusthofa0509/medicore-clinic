// ============================================================
// features/dashboard/pages/DashboardPage.jsx
// Dashboard klinik — semua angka diambil dari data aktual BE,
// di-scope branch aktif (ganti branch → muat ulang otomatis).
// Sumber data:
//   - /api/kunjungan           → antrian & status hari ini
//   - /api/laporan/pendapatan  → pendapatan hari ini
//   - /api/obat-alkes          → obat stok menipis (kritis)
//   - /api/settings/branches   → profil branch aktif
// ============================================================

import { useEffect, useState } from 'react'

import { Card, Badge, Spinner } from '../../../shared/components/ui.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import { fetchBranches } from '../../../shared/branches.js'
import { fetchKunjungan } from '../../front-office/service/kunjunganService.js'
import { fetchLaporanPendapatan } from '../../laporan/service/pendapatanService.js'
import { fetchObatAlkes } from '../../master/service/obatAlkesService.js'

const STATUS_LABEL = { terdaftar: 'Terdaftar', menunggu: 'Menunggu', diperiksa: 'Diperiksa', selesai: 'Selesai', batal: 'Batal' }
const STATUS_TONE = { terdaftar: 'info', menunggu: 'warning', diperiksa: 'accent', selesai: 'success', batal: 'danger' }
const STOK_MIN = 10 // ambang stok menipis untuk kategori obat

function todayStr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function fmtJam(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export default function DashboardPage() {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [branch, setBranch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalKunjungan: 0,
    pending: 0,
    diperiksa: 0,
    selesai: 0,
    batal: 0,
    criticalObat: 0,
    revenue: 0,
    jumlahTransaksi: 0,
    todayVisits: [],
  })

  // Ikuti branch aktif (ganti branch → muat ulang data branch itu)
  useEffect(() => {
    const handleBranchChange = () => setBranchId(getCurrentBranchId())
    window.addEventListener('branch:changed', handleBranchChange)
    return () => window.removeEventListener('branch:changed', handleBranchChange)
  }, [])

  // Muat semua data aktual branch aktif (paralel, tiap sumber toleran gagal)
  useEffect(() => {
    if (!branchId) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    setError('')
    const today = todayStr()

    Promise.all([
      fetchBranches({ force: true }).catch(() => []),
      fetchKunjungan(branchId, { date_from: today, date_to: today, limit: 500 }).catch(() => []),
      fetchLaporanPendapatan(branchId, { date_from: today, date_to: today }).catch(() => null),
      fetchObatAlkes(branchId, { kategori: 'obat' }).catch(() => []),
    ])
      .then(([branches, kunjungans, laporan, obats]) => {
        if (cancelled) return

        const b = branches.find((x) => String(x.id) === String(branchId))
        setBranch(b ? {
          id: String(b.id),
          nama: b.name || b.nama,
          kode: b.code,
          alamat: b.address,
          telepon: b.phone,
          jamOperasional: b.operational_hours,
          status: b.status,
        } : null)

        const count = (s) => kunjungans.filter((k) => k.status === s).length
        setStats({
          totalKunjungan: kunjungans.length,
          pending: count('terdaftar') + count('menunggu'),
          diperiksa: count('diperiksa'),
          selesai: count('selesai'),
          batal: count('batal'),
          criticalObat: obats.filter((o) => (Number(o.stok) || 0) <= STOK_MIN).length,
          revenue: Number(laporan?.ringkasan?.total) || 0,
          jumlahTransaksi: Number(laporan?.ringkasan?.jumlahTransaksi) || 0,
          todayVisits: kunjungans,
        })
      })
      .catch((err) => {
        console.error('[Dashboard] gagal memuat data:', err)
        if (!cancelled) setError('Gagal memuat data dashboard')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [branchId])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard Klinik</h1>
          <p className="text-sm text-[var(--text-muted)]">Ringkasan aktivitas klinik hari ini</p>
        </div>
        {branch && (
          <Card className="p-3.5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--brand-light)] font-mono text-sm font-bold text-[var(--brand-primary)]">
                {String(branch.kode || branch.nama || '?').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-[var(--text-primary)]">{branch.nama}</p>
                  {branch.kode && <span className="font-mono text-caption text-[var(--text-tertiary)]">{branch.kode}</span>}
                </div>
                <p className="text-caption text-[var(--text-secondary)]">
                  {[branch.alamat, branch.telepon, branch.jamOperasional].filter(Boolean).join(' • ') || 'Branch aktif'}
                </p>
              </div>
              <Badge tone={branch.status === 'aktif' ? 'success' : 'danger'}>{branch.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</Badge>
            </div>
          </Card>
        )}
      </div>

      {loading ? (
        <Card>
          <div className="flex items-center gap-2 px-4 py-10 text-body-sm text-[var(--text-tertiary)]">
            <Spinner size="sm" /> Memuat data dashboard…
          </div>
        </Card>
      ) : error ? (
        <Card><div className="px-4 py-10 text-center text-body-sm text-[var(--status-danger)]">{error}</div></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Total Kunjungan" value={stats.totalKunjungan} subtitle="Pasien masuk hari ini" icon="users" color="primary" />
            <KpiCard title="Dalam Antrean" value={stats.pending} subtitle="Terdaftar + menunggu" icon="clock" color="warning" alert={stats.pending > 5} />
            <KpiCard title="Obat Kritis" value={stats.criticalObat} subtitle={`Stok ≤ ${STOK_MIN}`} icon="alert" color="danger" alert={stats.criticalObat > 0} />
            <KpiCard title="Pendapatan" value={stats.revenue} subtitle={`${stats.jumlahTransaksi} transaksi hari ini`} icon="dollar" color="success" format="currency" />
          </div>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Antrian Hari Ini</h2>
                <p className="text-sm text-[var(--text-muted)]">{stats.todayVisits.length} pasien</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {(['terdaftar', 'menunggu', 'diperiksa', 'selesai', 'batal']).map((s) => (
                  <span key={s} className="px-2 py-1 rounded-lg text-xs bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                    {STATUS_LABEL[s]}: {stats.todayVisits.filter((v) => v.status === s).length}
                  </span>
                ))}
              </div>
            </div>

            <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-10 text-center">No</th>
                    <th>Pasien</th>
                    <th>Poli</th>
                    <th>Dokter</th>
                    <th>Jam</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.todayVisits.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-body-sm text-[var(--text-tertiary)]">Belum ada kunjungan hari ini</td></tr>
                  ) : stats.todayVisits.map((k, i) => (
                    <tr key={k.id}>
                      <td className="text-center font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                      <td>
                        <p className="font-medium text-[var(--text-primary)]">{k.pasien?.nama || '-'}</p>
                        <p className="font-mono text-caption text-[var(--text-tertiary)]">RM {k.pasien?.noRm || '-'} • {k.noPendaftaran}</p>
                      </td>
                      <td>{k.poli?.nama ? <Badge tone="primary">{k.poli.nama}</Badge> : <span className="text-[var(--text-tertiary)]">-</span>}</td>
                      <td className="text-[var(--text-secondary)]">{k.dokter?.nama || k.dokterPengganti?.nama || '-'}</td>
                      <td className="font-mono text-caption text-[var(--text-tertiary)]">{fmtJam(k.tglJamKunjungan)}</td>
                      <td><Badge tone={STATUS_TONE[k.status] || 'neutral'}>{STATUS_LABEL[k.status] || k.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function KpiCard({ title, value, subtitle, icon, color, alert, format }) {
  const colors = {
    primary: 'var(--brand-primary)',
    warning: 'var(--status-warning)',
    danger: 'var(--status-danger)',
    success: 'var(--status-success)',
  }
  const formatted = format === 'currency'
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0)
    : new Intl.NumberFormat('id-ID').format(value || 0)

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--text-muted)] uppercase">{title}</p>
          <p className="text-2xl font-bold mt-2" style={{ color: alert ? colors.warning : colors[color] }}>{formatted}</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: `rgba(${color === 'primary' || color === 'success' ? '45 106 79' : color === 'warning' ? '233 196 106' : '231 111 81'} / 0.1)` }}>
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={colors[color]} strokeWidth="2">
            {icon === 'users' && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>}
            {icon === 'clock' && <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
            {icon === 'alert' && <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></>}
            {icon === 'dollar' && <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>}
          </svg>
        </div>
      </div>
    </Card>
  )
}
