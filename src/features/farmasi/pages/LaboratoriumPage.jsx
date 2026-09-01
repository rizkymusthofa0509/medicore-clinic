// ============================================================
// features/farmasi/pages/LaboratoriumPage.jsx
// Laboratorium — permintaan pemeriksaan, input hasil, per branch aktif.
// ============================================================

import { useEffect, useState } from 'react'

import { Card, Badge, Btn, Input, Spinner, EmptyState, Textarea } from '../../../shared/components/ui.jsx'
import SelectSearch from '../../../shared/components/SelectSearch.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import { fetchBranches } from '../../../shared/branches.js'
import { fetchKunjungan } from '../../front-office/service/kunjunganService.js'
import { fetchLabPermintaan, createLabPermintaan, updateLabPermintaan } from '../service/laboratoriumService.js'

const STATUS_LABEL = { menunggu: 'Menunggu', selesai: 'Selesai', dibatalkan: 'Dibatalkan' }
const STATUS_TONE = { menunggu: 'warning', selesai: 'success', dibatalkan: 'neutral' }

function fmtTanggal(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export default function LaboratoriumPage() {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [branchName, setBranchName] = useState('-')
  const [list, setList] = useState([])
  const [kunjunganList, setKunjunganList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [form, setForm] = useState({ kunjungan_id: '', jenis_pemeriksaan: '', catatan: '' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [hasil, setHasil] = useState('')

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
    if (!branchId) return
    setLoading(true); setError('')
    fetchLabPermintaan(branchId, { status: filterStatus || '' })
      .then(setList)
      .catch((e) => setError(e?.response?.data?.message || 'Gagal memuat lab'))
      .finally(() => setLoading(false))
  }, [branchId, filterStatus])

  useEffect(() => {
    if (!branchId) return
    fetchKunjungan(branchId, { status: 'selesai', limit: 100 })
      .then(setKunjunganList)
      .catch(() => setKunjunganList([]))
  }, [branchId])

  const simpan = async () => {
    if (!form.kunjungan_id || !form.jenis_pemeriksaan.trim() || saving) return
    setSaving(true); setError('')
    try {
      const res = await createLabPermintaan(branchId, form)
      if (!res.success) throw new Error(res.message || 'Gagal simpan')
      setForm({ kunjungan_id: '', jenis_pemeriksaan: '', catatan: '' })
      const updated = await fetchLabPermintaan(branchId, {})
      setList(updated)
    } catch (e) {
      setError(e.message || 'Gagal membuat permintaan lab')
    } finally { setSaving(false) }
  }

  const simpanHasil = async (item) => {
    setSaving(true); setError('')
    try {
      const res = await updateLabPermintaan(branchId, item.id, { status: 'selesai', hasil })
      if (!res.success) throw new Error(res.message || 'Gagal simpan hasil')
      setEditId(null); setHasil('')
      const updated = await fetchLabPermintaan(branchId, {})
      setList(updated)
    } catch (e) {
      setError(e.message || 'Gagal menyimpan hasil')
    } finally { setSaving(false) }
  }

  const batalkan = async (item) => {
    if (!window.confirm('Batalkan permintaan lab ini?')) return
    setSaving(true); setError('')
    try {
      await updateLabPermintaan(branchId, item.id, { status: 'dibatalkan' })
      const updated = await fetchLabPermintaan(branchId, {})
      setList(updated)
    } catch (e) {
      setError(e.message || 'Gagal membatalkan')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Laboratorium</h1>
          <p className="text-sm text-[var(--text-muted)]">Branch: <b>{branchName}</b></p>
        </div>
        <Badge tone="warning">{list.filter((l) => l.status === 'menunggu').length} menunggu</Badge>
      </div>

      {error && <div className="px-4 py-2 rounded-lg bg-[var(--status-danger)]/10 text-[var(--status-danger)] text-sm">{error}</div>}

      {/* Form permintaan baru */}
      <Card className="p-4">
        <p className="mb-3 text-caption font-medium text-[var(--text-tertiary)]">Permintaan Pemeriksaan Baru</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SelectSearch
            label="Kunjungan (selesai)"
            value={form.kunjungan_id}
            onChange={(v) => setForm((s) => ({ ...s, kunjungan_id: v }))}
            placeholder="Ketik nama / no. pendaftaran…"
            options={kunjunganList.map((k) => ({
              value: String(k.id),
              label: `${k.noPendaftaran} • ${k.pasien?.nama || '-'}`,
              sub: `RM ${k.pasien?.noRm || '-'}`,
            }))}
          />
          <Input label="Jenis Pemeriksaan" type="text" placeholder="mis. Darah Rutin, Urine, GDS…" value={form.jenis_pemeriksaan} onChange={(v) => setForm((s) => ({ ...s, jenis_pemeriksaan: v }))} />
          <div className="flex items-end">
            <Btn variant="primary" size="sm" onClick={simpan} disabled={saving || !form.kunjungan_id || !form.jenis_pemeriksaan.trim()}>
              {saving ? 'Menyimpan…' : '+ Buat Permintaan'}
            </Btn>
          </div>
        </div>
        <div className="mt-3">
          <Input label="Catatan (opsional)" type="text" placeholder="mis. puasa 8 jam" value={form.catatan} onChange={(v) => setForm((s) => ({ ...s, catatan: v }))} />
        </div>
      </Card>

      {/* Filter + daftar */}
      <Card className="p-3.5">
        <div className="flex flex-wrap items-end gap-3">
          <SelectSearch
            label="Status"
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'menunggu', label: 'Menunggu' },
              { value: 'selesai', label: 'Selesai' },
              { value: 'dibatalkan', label: 'Dibatalkan' },
            ]}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-[var(--text-tertiary)]"><Spinner size="sm" /> Memuat…</div>
        ) : list.length === 0 ? (
          <EmptyState title="Belum ada permintaan lab" desc="Permintaan pemeriksaan lab akan muncul di sini." />
        ) : (
          <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>No</th><th>Tanggal</th><th>Pasien</th><th>Pemeriksaan</th><th>Status</th><th>Hasil</th><th className="w-40 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((l, i) => (
                  <tr key={l.id}>
                    <td className="font-mono text-caption text-[var(--text-tertiary)]">{i + 1}</td>
                    <td className="font-mono text-caption text-[var(--text-tertiary)]">{fmtTanggal(l.tanggal)}</td>
                    <td>
                      <div className="font-medium text-[var(--text-primary)]">{l.pasien?.nama || '-'}</div>
                      <div className="font-mono text-caption text-[var(--text-tertiary)]">RM {l.pasien?.noRm || '-'}</div>
                    </td>
                    <td className="font-medium text-[var(--text-primary)]">{l.jenisPemeriksaan}</td>
                    <td><Badge tone={STATUS_TONE[l.status] || 'neutral'}>{STATUS_LABEL[l.status] || l.status}</Badge></td>
                    <td className="max-w-[200px] truncate text-[var(--text-secondary)]">{l.hasil || '-'}</td>
                    <td className="text-center">
                      {l.status === 'menunggu' ? (
                        <div className="flex justify-center gap-1">
                          <Btn size="sm" variant="primary" onClick={() => { setEditId(l.id); setHasil(l.hasil || '') }}>Input Hasil</Btn>
                          <Btn size="sm" variant="ghost" onClick={() => batalkan(l)}>Batal</Btn>
                        </div>
                      ) : (
                        <span className="text-caption text-[var(--text-tertiary)]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal input hasil */}
      {editId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-5 py-3">
              <h2 className="text-heading-md font-bold text-[var(--text-primary)]">Input Hasil Lab</h2>
              <Btn size="sm" variant="ghost" onClick={() => setEditId(null)}>✕</Btn>
            </div>
            <div className="space-y-4 p-5">
              <Textarea label="Hasil Pemeriksaan" rows={4} placeholder="Tulis hasil laboratorium…" value={hasil} onChange={setHasil} />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[var(--border-primary)] px-5 py-3">
              <Btn size="sm" variant="ghost" onClick={() => setEditId(null)}>Batal</Btn>
              <Btn size="sm" variant="success" onClick={() => { const item = list.find((x) => x.id === editId); if (item) simpanHasil(item) }} disabled={saving || !hasil.trim()}>
                {saving ? 'Menyimpan…' : 'Simpan & Tandai Selesai'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
