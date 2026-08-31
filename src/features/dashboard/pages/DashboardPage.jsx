import { useEffect, useState } from 'react'
import { getCurrentBranchId, getBranchById, getDashboardStats, getVisits } from '../../../shared/store/clinic.js'
import { Card } from '../../../shared/components/ui.jsx'

export default function DashboardPage() {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [stats, setStats] = useState({ totalKunjungan: 0, pending: 0, criticalObat: 0, revenue: 0, todayVisits: [] })

  useEffect(() => {
    setStats(getDashboardStats(branchId))
  }, [branchId])

  // Listen for branch changes from header
  useEffect(() => {
    const handleBranchChange = () => setBranchId(getCurrentBranchId())
    window.addEventListener('branch:changed', handleBranchChange)
    return () => window.removeEventListener('branch:changed', handleBranchChange)
  }, [])

  const branch = getBranchById(branchId)
  const statusCounts = {
    Menunggu: stats.todayVisits?.filter(v => v.status === 'Menunggu').length || 0,
    Diperiksa: stats.todayVisits?.filter(v => v.status === 'Diperiksa').length || 0,
    Apotek: stats.todayVisits?.filter(v => v.status === 'Apotek').length || 0,
    Kasir: stats.todayVisits?.filter(v => v.status === 'Kasir').length || 0,
    Selesai: stats.todayVisits?.filter(v => v.status === 'Selesai').length || 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard Klinik</h1>
        <p className="page-desc">{branch?.nama || 'Klinik Medicore'}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Kunjungan" value={stats.totalKunjungan} subtitle="Pasien masuk klinik" icon="users" color="primary" />
        <KpiCard title="Menunggu" value={stats.pending} subtitle="Dalam antrean" icon="clock" color="warning" alert={stats.pending > 5} />
        <KpiCard title="Obat Kritis" value={stats.criticalObat} subtitle="Perlu pengisian ulang" icon="alert" color="danger" alert={stats.criticalObat > 0} />
        <KpiCard title="Pendapatan" value={stats.revenue} subtitle="Total transaksi kasir" icon="dollar" color="success" format="currency" />
      </div>

      {/* Antrian */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Antrian Hari Ini</h2>
            <p className="text-sm text-[var(--text-muted)]">{stats.todayVisits?.length || 0} pasien</p>
          </div>
          <div className="flex gap-1">
            {Object.entries(statusCounts).map(([status, count]) => (
              <span key={status} className="px-2 py-1 rounded-lg text-xs bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                {status}: {count}
              </span>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]">No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]">Pasien</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]">Poli</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]">Dokter</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {!stats.todayVisits?.length ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">Belum ada antrian</td></tr>
              ) : (
                stats.todayVisits.map((vis, i) => (
                  <tr key={vis.id} className="border-b border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--bg-hover)]">
                    <td className="px-4 py-3 text-sm">{i + 1}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{vis.pasien}</td>
                    <td className="px-4 py-3"><span className="badge badge-primary">{vis.poli}</span></td>
                    <td className="px-4 py-3 text-sm">{vis.dokter}</td>
                    <td className="px-4 py-3"><StatusBadge status={vis.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
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
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
    : value

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--text-muted)] uppercase">{title}</p>
          <p className={`text-2xl font-bold mt-2 ${alert ? '' : ''}`} style={{ color: alert ? colors.warning : colors[color] }}>{formatted}</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: `rgba(${color === 'primary' ? '45 106 79' : color === 'warning' ? '233 196 106' : color === 'danger' ? '231 111 81' : '45 106 79'} / 0.1)` }}>
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={colors[color]} strokeWidth="2">
            {icon === 'users' && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
            {icon === 'clock' && <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>}
            {icon === 'alert' && <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></>}
            {icon === 'dollar' && <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>}
          </svg>
        </div>
      </div>
    </Card>
  )
}

function StatusBadge({ status }) {
  const config = {
    Menunggu: 'badge-neutral',
    Diperiksa: 'badge-primary',
    Apotek: 'badge-info',
    Kasir: 'badge-warning',
    Selesai: 'badge-success',
  }
  return <span className={`badge ${config[status] || 'badge-neutral'}`}>{status}</span>
}
