import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Card, Badge, Btn } from '../../../shared/components/ui.jsx'
import {
  getDashboardStats,
  getVisits,
  getBranches,
  getCurrentBranchId,
  setCurrentBranch,
} from '../../../shared/store/clinic.js'

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalKunjungan: 0, pending: 0, criticalObat: 0, revenue: 0, todayVisits: [] })
  const [branchId] = useState(() => getCurrentBranchId())
  const location = useLocation()

  useEffect(() => {
    const s = getDashboardStats(branchId)
    setStats(s)
  }, [branchId])

  const activeFilter = location.pathname.includes('menunggu')
    ? 'Menunggu'
    : location.pathname.includes('diperiksa')
    ? 'Diperiksa'
    : location.pathname.includes('apotek')
    ? 'Apotek'
    : location.pathname.includes('kasir')
    ? 'Kasir'
    : location.pathname.includes('selesai')
    ? 'Selesai'
    : 'Semua'

  const statusCounts = {
    Menunggu: stats.todayVisits.filter(v => v.status === 'Menunggu').length,
    Diperiksa: stats.todayVisits.filter(v => v.status === 'Diperiksa').length,
    Apotek: stats.todayVisits.filter(v => v.status === 'Apotek').length,
    Kasir: stats.todayVisits.filter(v => v.status === 'Kasir').length,
    Selesai: stats.todayVisits.filter(v => v.status === 'Selesai').length,
  }

  const pageTitle = activeFilter === 'Semua' ? 'Antrian Hari Ini' : `Antrian ${activeFilter}`
  const filteredVisits = activeFilter === 'Semua'
    ? stats.todayVisits
    : stats.todayVisits.filter(v => v.status === activeFilter)

  return (
    <div className="space-y-6">
      {/* Status Branch Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="btn btn-ghost btn-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="page-title">Dashboard Klinik</h1>
            <p className="page-desc">
              {getBranches().find(b => b.id === branchId)?.nama || 'Klinik Medicore'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-body-sm">
          <span className="text-[var(--text-muted)]">Branch:</span>
          <select
            value={branchId}
            onChange={e => { setCurrentBranch(e.target.value) }}
            className="input input-sm flex-none w-40"
          >
            {getBranches().map(b => (
              <option key={b.id} value={b.id}>{b.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Kunjungan Hari Ini"
          value={stats.totalKunjungan}
          subtitle="Pasien masuk klinik"
          icon="users"
          colorVar="var(--brand-primary)"
        />
        <KpiCard
          title="Pasien Menunggu"
          value={stats.pending}
          subtitle="Dalam antrean"
          icon="clock"
          colorVar="var(--accent-primary)"
          alert={stats.pending > 5}
        />
        <KpiCard
          title="Stok Obat Kritis"
          value={stats.criticalObat}
          subtitle="Perlu pengisian ulang"
          icon="alert-triangle"
          colorVar="var(--text-danger)"
          alert={stats.criticalObat > 0}
        />
        <KpiCard
          title="Pendapatan Hari Ini"
          value={stats.revenue}
          subtitle="Total transaksi kasir"
          icon="dollar"
          colorVar="var(--text-success)"
          format="currency"
        />
      </div>

      {/* Antrian Real-time */}
      <Card className="p-5">
        <div className="page-header">
          <div>
            <div className="font-display text-display-lg font-bold text-[var(--text-primary)]">{pageTitle}</div>
            <p className="text-body text-[var(--text-secondary)] mt-0.5">
              {filteredVisits.length} pasien • {activeFilter === 'Semua' ? 'Semua status' : activeFilter}
            </p>
          </div>
          <div className="flex gap-1">
            {(['Semua','Menunggu','Diperiksa','Apotek','Kasir','Selesai']).map(s => (
              <button
                key={s}
                onClick={() => { window.location.href = s === 'Semua' ? '/' : `/#/${s.toLowerCase()}` }}
                className={`btn ${s === activeFilter ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              >
                {s} ({statusCounts[s] || 0})
              </button>
            ))}
          </div>
        </div>

        <div className="table-container mt-4">
          <table className="table">
            <thead>
              <tr>
                <th>No. Antrean</th>
                <th>Pasien</th>
                <th>Poli</th>
                <th>Dokter</th>
                <th>Waktu Datang</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-[var(--text-muted)]">
                    Belum ada pasien dalam antrean
                  </td>
                </tr>
              ) : (
                filteredVisits.map(vis => (
                  <tr key={vis.id}>
                    <td className="font-medium">{vis.noAntrean}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] font-medium">
                          {vis.patient?.nama?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-body">{vis.patient?.nama || '-'}</div>
                          <div className="text-tiny text-[var(--text-muted)]">{vis.patient?.noRM || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant="primary">{vis.poli?.nama || '-'}</Badge>
                    </td>
                    <td>{vis.dokter?.nama || '-'}</td>
                    <td className="text-body-sm text-[var(--text-secondary)]">
                      {vis.createdAt ? new Date(vis.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td>
                      <StatusBadge status={vis.status} />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {vis.status === 'Menunggu' && (
                          <Btn variant="primary" size="sm" onClick={() => alert(`📋 Detail Kunjungan: ${vis.noAntrean}`)}>
                            Detail
                          </Btn>
                        )}
                        {vis.status === 'Diperiksa' && (
                          <Btn variant="secondary" size="sm" onClick={() => window.location.href = '/rme'}>
                            RME
                          </Btn>
                        )}
                        {vis.status === 'Apotek' && (
                          <Btn variant="secondary" size="sm" onClick={() => window.location.href = '/farmasi'}>
                            Farmasi
                          </Btn>
                        )}
                        {vis.status === 'Kasir' && (
                          <Btn variant="primary" size="sm" onClick={() => window.location.href = '/kasir'}>
                            Bayar
                          </Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Info footer */}
      <div className="flex items-center justify-between text-caption text-[var(--text-muted)] pt-4 border-t border-[var(--border-primary)]">
        <span>Medicore Clinic • Sistem Informasi Klinik</span>
        <span>Branch: {getBranches().find(b => b.id === branchId)?.nama}</span>
      </div>
    </div>
  )
}

function KpiCard({ title, value, subtitle, icon, colorVar, alert, format }) {
  const formattedValue = format === 'currency'
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
    : value

  return (
    <Card className={`p-5 kpi-card ${alert ? 'border-[var(--accent-primary)]' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-tiny text-[var(--text-muted)] uppercase tracking-wide">{title}</div>
          <div className={`font-display text-display-xl font-bold mt-2 ${alert ? 'text-[var(--accent-primary)]' : ''}`}>
            {formattedValue}
          </div>
          <div className="text-body-sm text-[var(--text-secondary)] mt-1">{subtitle}</div>
        </div>
        <div className={`p-3 rounded-xl ${alert ? 'bg-[var(--accent-light)]' : 'bg-[var(--brand-light)]'}`}>
          {renderIcon(icon, colorVar, alert)}
        </div>
      </div>
    </Card>
  )
}

function renderIcon(icon, colorVar, alert) {
  const svgColor = alert ? 'var(--accent-primary)' : colorVar
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={svgColor} strokeWidth="2">
      {icon === 'users' && (
        <>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      )}
      {icon === 'clock' && (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </>
      )}
      {icon === 'alert-triangle' && (
        <>
          <path d="M10.29 3.86L1.82 18a2 2 0 1 0 2 2h16.95a2 2 0 1 0 2-2L13.71 3.86a2 2 0 0 0-2 2z" />
          <path d="M12 9v4M12 17h.01" />
        </>
      )}
      {icon === 'dollar' && (
        <>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </>
      )}
    </svg>
  )
}

function StatusBadge({ status }) {
  const config = {
    Menunggu: { label: 'Menunggu', variant: 'neutral' },
    Diperiksa: { label: 'Diperiksa', variant: 'primary' },
    Apotek: { label: 'Apotek', variant: 'info' },
    Kasir: { label: 'Kasir', variant: 'warning' },
    Selesai: { label: 'Selesai', variant: 'success' },
  }
  const c = config[status] || config['Menunggu']
  return <Badge variant={c.variant}>{c.label}</Badge>
}
