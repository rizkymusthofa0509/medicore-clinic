// ============================================================
// features/laporan/pages/LaporanSisaPage.jsx
// Halaman laporan berbasis data aktual untuk menu yang tersisa:
// Stok Opname, Mutasi Barang, Pesanan Pembelian, Penjualan Obat,
// Kunjungan Terhapus. Semua di-scope branch aktif.
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import * as XLSX from 'xlsx'

import { Card, Badge, Btn, PageHeader, Spinner, EmptyState } from '../../../shared/components/ui.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import { fetchBranches } from '../../../shared/branches.js'
import { fetchKunjungan } from '../../front-office/service/kunjunganService.js'
import { fetchObatAlkes } from '../../master/service/obatAlkesService.js'
import { fetchMutasiStok } from '../../farmasi/service/farmasiService.js'
import { fetchPenjualanLangsung } from '../../farmasi/service/penjualanLangsungService.js'

function fmtCurrency(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v) || 0)
}
function fmtNum(v) { return new Intl.NumberFormat('id-ID').format(Number(v) || 0) }
function fmtTanggal(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const META = {
  'stok-opname': { title: 'Laporan Stok Opname', desc: 'Snapshot stok obat saat ini — dasar perbandingan stok fisik.' },
  'mutasi-barang': { title: 'Laporan Mutasi Barang', desc: 'Seluruh mutasi stok (masuk/keluar/dispensing/penyesuaian).' },
  'pesanan-pembelian': { title: 'Pesanan Pembelian', desc: 'Daftar obat dengan stok menipis — kandidat pembelian.' },
  'penjualan-obat': { title: 'Laporan Penjualan Obat', desc: 'Penjualan obat dari resep (dispensing) + penjualan langsung.' },
  'kunjungan-terhapus': { title: 'Kunjungan Terhapus', desc: 'Kunjungan yang dihapus (soft delete) pada branch ini.' },
}

export default function LaporanSisaPage() {
  const location = useLocation()
  const key = location.pathname.split('/').filter(Boolean).pop() || 'stok-opname'
  const meta = META[key] || META['stok-opname']

  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [branchName, setBranchName] = useState('-')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [obatList, setObatList] = useState([])
  const [mutasi, setMutasi] = useState([])
  const [penjualan, setPenjualan] = useState([])
  const [kunjungan, setKunjungan] = useState([])
  const [trashed, setTrashed] = useState([])

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
    if (!branchId) { setLoading(false); return }
    setLoading(true); setError('')
    Promise.all([
      fetchObatAlkes(branchId, {}).catch(() => []),
      fetchMutasiStok(branchId, {}).catch(() => []),
      fetchPenjualanLangsung(branchId, { limit: 200 }).catch(() => []),
      fetchKunjungan(branchId, { limit: 500 }).catch(() => []),
    ])
      .then(([obat, mut, pjl, kun]) => {
        setObatList(obat); setMutasi(mut); setPenjualan(pjl); setKunjungan(kun)
        setTrashed(kun.filter((k) => k.status === 'batal'))
      })
      .catch(() => setError('Gagal memuat data'))
      .finally(() => setLoading(false))
  }, [branchId])

  const nilaiStok = useMemo(() => obatList.reduce((a, o) => a + (Number(o.stok) || 0) * (Number(o.hargaJual) || 0), 0), [obatList])
  const stokKritis = useMemo(() => obatList.filter((o) => (Number(o.stok) || 0) <= 10), [obatList])
  const totalDispensing = useMemo(() => mutasi.filter((m) => m.tipe === 'dispensing').reduce((a, m) => a + Number(m.qty), 0), [mutasi])

  const exportExcel = () => {
    const header = { 'Klinik': 'Medicore Clinic', 'Branch': branchName, 'Laporan': meta.title }
    let rows = []
    if (key === 'stok-opname') {
      rows = [header, ...obatList.map((o, i) => ({ No: i + 1, Obat: o.nama, Kategori: o.kategori, Stok: o.stok, 'Harga Jual': fmtCurrency(o.hargaJual), 'Nilai Stok': fmtCurrency((Number(o.stok) || 0) * (Number(o.hargaJual) || 0)) }))]
    } else if (key === 'mutasi-barang') {
      rows = [header, ...mutasi.map((m, i) => ({ No: i + 1, Tanggal: fmtTanggal(m.createdAt), Obat: m.obat?.nama || '-', Tipe: m.tipe, Qty: m.qty, 'Stok Sebelum': m.stokSebelum, 'Stok Sesudah': m.stokSesudah, Keterangan: m.keterangan || '-' }))]
    } else if (key === 'pesanan-pembelian') {
      rows = [header, ...stokKritis.map((o, i) => ({ No: i + 1, Obat: o.nama, Stok: o.stok, 'Harga Jual': fmtCurrency(o.hargaJual) }))]
    } else if (key === 'penjualan-obat') {
      rows = [header, ...penjualan.map((p, i) => ({ No: i + 1, 'No. Transaksi': p.noTransaksi, Obat: p.namaObat, Qty: p.qty, Total: fmtCurrency(p.total), Metode: p.metodePembayaran, Tanggal: fmtTanggal(p.createdAt) }))]
    } else if (key === 'kunjungan-terhapus') {
      rows = [header, ...trashed.map((k, i) => ({ No: i + 1, 'No. Pendaftaran': k.noPendaftaran, Pasien: k.pasien?.nama || '-', 'No. RM': k.pasien?.noRm || '-', Tanggal: fmtTanggal(k.tglJamKunjungan), Poli: k.poli?.nama || '-' }))]
    }
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false })
    XLSX.utils.book_append_sheet(wb, ws, meta.title.slice(0, 31))
    XLSX.writeFile(wb, `${key}-${branchId}.xlsx`)
  }

  const renderTable = () => {
    if (key === 'stok-opname') {
      return (
        <table className="table">
          <thead><tr><th>No</th><th>Obat</th><th>Kategori</th><th className="text-right">Stok</th><th className="text-right">Harga Jual</th><th className="text-right">Nilai Stok</th><th>Status</th></tr></thead>
          <tbody>
            {obatList.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-[var(--text-tertiary)]">Belum ada data obat</td></tr>}
            {obatList.map((o, i) => {
              const kritis = (Number(o.stok) || 0) <= 10
              return (
                <tr key={o.id}>
                  <td className="font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                  <td className="font-medium text-[var(--text-primary)]">{o.nama}</td>
                  <td><Badge tone="neutral">{o.kategori}</Badge></td>
                  <td className={`text-right font-mono font-semibold ${kritis ? 'text-[var(--status-danger)]' : ''}`}>{fmtNum(o.stok)}</td>
                  <td className="text-right font-mono text-[var(--text-secondary)]">{fmtCurrency(o.hargaJual)}</td>
                  <td className="text-right font-mono">{fmtCurrency((Number(o.stok) || 0) * (Number(o.hargaJual) || 0))}</td>
                  <td>{kritis ? <Badge tone="danger">Kritis</Badge> : <Badge tone="success">Normal</Badge>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )
    }
    if (key === 'mutasi-barang') {
      return (
        <table className="table">
          <thead><tr><th>No</th><th>Tanggal</th><th>Obat</th><th>Tipe</th><th className="text-right">Qty</th><th className="text-right">Stok</th><th>Keterangan</th></tr></thead>
          <tbody>
            {mutasi.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-[var(--text-tertiary)]">Belum ada mutasi</td></tr>}
            {mutasi.map((m, i) => (
              <tr key={m.id}>
                <td className="font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                <td className="font-mono text-caption text-[var(--text-tertiary)]">{fmtTanggal(m.createdAt)}</td>
                <td className="font-medium text-[var(--text-primary)]">{m.obat?.nama || '-'}</td>
                <td><Badge tone={m.tipe === 'dispensing' ? 'info' : m.tipe === 'masuk' ? 'success' : 'warning'}>{m.tipe}</Badge></td>
                <td className="text-right font-mono font-semibold">{fmtNum(m.qty)}</td>
                <td className="text-right font-mono text-[var(--text-secondary)]">{fmtNum(m.stokSebelum)} → {fmtNum(m.stokSesudah)}</td>
                <td className="text-[var(--text-secondary)]">{m.keterangan || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    if (key === 'pesanan-pembelian') {
      return (
        <table className="table">
          <thead><tr><th>No</th><th>Obat</th><th>Kategori</th><th className="text-right">Stok Saat Ini</th><th className="text-right">Harga Jual</th><th>Status</th></tr></thead>
          <tbody>
            {stokKritis.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-[var(--text-tertiary)]">Semua stok aman — tidak ada kandidat pembelian</td></tr>}
            {stokKritis.map((o, i) => (
              <tr key={o.id}>
                <td className="font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                <td className="font-medium text-[var(--text-primary)]">{o.nama}</td>
                <td><Badge tone="neutral">{o.kategori}</Badge></td>
                <td className="text-right font-mono font-semibold text-[var(--status-danger)]">{fmtNum(o.stok)}</td>
                <td className="text-right font-mono text-[var(--text-secondary)]">{fmtCurrency(o.hargaJual)}</td>
                <td><Badge tone="danger">Perlu Beli</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    if (key === 'penjualan-obat') {
      return (
        <table className="table">
          <thead><tr><th>No</th><th>No. Transaksi</th><th>Tanggal</th><th>Obat</th><th className="text-right">Qty</th><th className="text-right">Total</th><th>Metode</th></tr></thead>
          <tbody>
            {penjualan.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-[var(--text-tertiary)]">Belum ada penjualan obat langsung</td></tr>}
            {penjualan.map((p, i) => (
              <tr key={p.id}>
                <td className="font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                <td className="font-mono font-semibold text-[var(--brand-primary)]">{p.noTransaksi}</td>
                <td className="font-mono text-caption text-[var(--text-tertiary)]">{fmtTanggal(p.createdAt)}</td>
                <td className="font-medium text-[var(--text-primary)]">{p.namaObat}</td>
                <td className="text-right font-mono">{fmtNum(p.qty)}</td>
                <td className="text-right font-mono font-semibold">{fmtCurrency(p.total)}</td>
                <td><Badge tone="info">{p.metodePembayaran}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    // kunjungan-terhapus
    return (
      <table className="table">
        <thead><tr><th>No</th><th>No. Pendaftaran</th><th>Pasien</th><th>Tanggal</th><th>Poli</th><th>Status</th></tr></thead>
        <tbody>
          {trashed.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-[var(--text-tertiary)]">Tidak ada kunjungan dibatalkan</td></tr>}
          {trashed.map((k, i) => (
            <tr key={k.id}>
              <td className="font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
              <td className="font-mono text-[var(--text-primary)]">{k.noPendaftaran}</td>
              <td className="font-medium text-[var(--text-primary)]">{k.pasien?.nama || '-'}</td>
              <td className="font-mono text-caption text-[var(--text-tertiary)]">{fmtTanggal(k.tglJamKunjungan)}</td>
              <td className="text-[var(--text-secondary)]">{k.poli?.nama || '-'}</td>
              <td><Badge tone="danger">Batal</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={meta.title}
        desc={`${meta.desc} Branch: ${branchName}`}
        actions={<Btn variant="secondary" size="sm" onClick={exportExcel} disabled={loading}>Excel</Btn>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {key === 'stok-opname' && (
          <>
            <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Jenis Obat</p><p className="mt-1 text-2xl font-semibold font-mono">{fmtNum(obatList.length)}</p></Card>
            <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Total Stok</p><p className="mt-1 text-2xl font-semibold font-mono">{fmtNum(obatList.reduce((a, o) => a + (Number(o.stok) || 0), 0))}</p></Card>
            <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Nilai Stok</p><p className="mt-1 text-2xl font-semibold font-mono">{fmtCurrency(nilaiStok)}</p></Card>
            <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Stok Kritis</p><p className="mt-1 text-2xl font-semibold font-mono text-[var(--status-danger)]">{fmtNum(stokKritis.length)}</p></Card>
          </>
        )}
        {key === 'mutasi-barang' && (
          <>
            <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Total Mutasi</p><p className="mt-1 text-2xl font-semibold font-mono">{fmtNum(mutasi.length)}</p></Card>
            <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Dispensing</p><p className="mt-1 text-2xl font-semibold font-mono">{fmtNum(totalDispensing)}</p></Card>
            <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Masuk</p><p className="mt-1 text-2xl font-semibold font-mono">{fmtNum(mutasi.filter((m) => m.tipe === 'masuk').reduce((a, m) => a + Number(m.qty), 0))}</p></Card>
            <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Keluar</p><p className="mt-1 text-2xl font-semibold font-mono">{fmtNum(mutasi.filter((m) => m.tipe === 'keluar').reduce((a, m) => a + Number(m.qty), 0))}</p></Card>
          </>
        )}
        {key === 'pesanan-pembelian' && (
          <>
            <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Obat Kritis</p><p className="mt-1 text-2xl font-semibold font-mono text-[var(--status-danger)]">{fmtNum(stokKritis.length)}</p></Card>
            <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Total Obat</p><p className="mt-1 text-2xl font-semibold font-mono">{fmtNum(obatList.length)}</p></Card>
          </>
        )}
        {key === 'penjualan-obat' && (
          <>
            <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Transaksi OTC</p><p className="mt-1 text-2xl font-semibold font-mono">{fmtNum(penjualan.length)}</p></Card>
            <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Total Penjualan</p><p className="mt-1 text-2xl font-semibold font-mono text-[var(--status-success)]">{fmtCurrency(penjualan.reduce((a, p) => a + Number(p.total), 0))}</p></Card>
          </>
        )}
        {key === 'kunjungan-terhapus' && (
          <>
            <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Dibatalkan</p><p className="mt-1 text-2xl font-semibold font-mono text-[var(--status-danger)]">{fmtNum(trashed.length)}</p></Card>
            <Card className="p-4"><p className="text-caption text-[var(--text-tertiary)]">Total Kunjungan</p><p className="mt-1 text-2xl font-semibold font-mono">{fmtNum(kunjungan.length)}</p></Card>
          </>
        )}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-[var(--text-tertiary)]"><Spinner size="sm" /> Memuat…</div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-[var(--status-danger)]">{error}</div>
        ) : (
          <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>{renderTable()}</div>
        )}
      </Card>
    </div>
  )
}
