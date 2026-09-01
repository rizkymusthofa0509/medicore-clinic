import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { Card, Badge, Btn, toast } from '../../../shared/components/ui.jsx'
import { showKunjungan, fetchNursingAssessment, saveNursingAssessment } from '../service/kunjunganService.js'

const STATUS_BADGE = {
  terdaftar: 'info',
  menunggu: 'warning',
  diperiksa: 'success',
  selesai: 'success',
  batal: 'danger',
}

const PRIORITY_BADGE = {
  emergency: 'danger',
  urgent: 'warning',
  normal: 'success',
}

const SOAPIE_FIELDS = [
  { key: 'subjektif', label: 'Subjektif', placeholder: 'Keluhan / pengelihatan pasien...' },
  { key: 'objektif', label: 'Objektif', placeholder: 'Data vital / temuan fisik...' },
  { key: 'asesmen', label: 'Asesmen', placeholder: 'Asesmen keperawatan / diagnosis...' },
  { key: 'plan', label: 'Plan (Rencana)', placeholder: 'Rencana asesmen/keperawatan...' },
  { key: 'implementasi', label: 'Implementasi', placeholder: 'Implementasi / intervensi...' },
  { key: 'evaluasi', label: 'Evaluasi', placeholder: 'Evaluasi / hasil intervensi...' },
]

function formatDateID(dt) {
  if (!dt) return '-'
  const d = new Date(dt)
  if (isNaN(d.getTime())) return dt
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-tiny text-[var(--text-secondary)]">{label}:</span>
      <span className={
        'text-sm text-[var(--text-primary)] text-right truncate ' +
        (mono ? 'font-mono text-tiny' : '')
      }>
        {value || '-'}
      </span>
    </div>
  )
}

function TextAreaField({ label, placeholder, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="block text-tiny font-semibold text-[var(--text-secondary)]">{label}</label>
      <textarea
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="input w-full resize-y"
      />
    </div>
  )
}

export default function NursingAssessmentPage() {
  const params = useParams()
  const navigate = useNavigate()
  const kunjunganId = params?.kunjunganId

  const [kunjungan, setKunjungan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({
    subjektif: '', objektif: '', asesmen: '', plan: '', implementasi: '', evaluasi: '',
  })
  const [isEditMode, setIsEditMode] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!kunjunganId) {
      setLoading(false)
      setErrorMsg('ID kunjungan tidak ditemukan')
      return
    }
    let cancelled = false
    Promise.all([
      showKunjungan(kunjunganId),
      fetchNursingAssessment(kunjunganId).catch(() => null),  // null if not exist yet
    ]).then(([kunjunganData, naData]) => {
      if (cancelled) return
      setKunjungan(kunjunganData)
      if (naData) {
        setForm({
          subjektif: naData.subjektif || '',
          objektif: naData.objektif || '',
          asesmen: naData.asesmen || '',
          plan: naData.plan || '',
          implementasi: naData.implementasi || '',
          evaluasi: naData.evaluasi || '',
        })
        setIsEditMode(true)
      }
    }).catch((err) => {
      if (cancelled) return
      setErrorMsg(err?.response?.data?.message || 'Gagal memuat data')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [kunjunganId])

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!kunjunganId) return
    setSaving(true)
    try {
      await saveNursingAssessment(kunjunganId, form)
      toast(isEditMode ? 'Asesmen Keperawatan berhasil diperbarui' : 'Asesmen Keperawatan berhasil disimpan', 'success')
      navigate('/pendaftaran-lama')
    } catch (err) {
      console.error('[Assessment] gagal simpan:', err)
      toast(err?.response?.data?.message || 'Gagal menyimpan asesmen', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-[var(--text-muted)]">Memuat data kunjungan…</div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="p-4">
        <div className="relative overflow-hidden rounded-lg border border-[var(--status-danger)] bg-[var(--status-danger)]/10 p-3 text-[var(--status-danger)]">
          <span className="ml-8 text-sm">{errorMsg}</span>
        </div>
        <button onClick={() => navigate('/pendaftaran-lama')} className="btn btn-ghost mt-3">
          Kembali ke Daftar Kunjungan
        </button>
      </div>
    )
  }

  const p = kunjungan?.pasien
  const usia = p?.tanggal_lahir
    ? Math.floor((Date.now() - new Date(p.tanggal_lahir)) / (365.25 * 24 * 60 * 60 * 1000)) + ' th'
    : '-'

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-secondary)]">
      <div className="p-4 md:p-6 xl:p-8">

        {/* STICKY PAGE TITLE */}
        <div className="sticky top-0 z-[5] -mx-4 md:-mx-6 xl:-mx-8 bg-[var(--bg-secondary)]/95 border-b border-[var(--border-primary)] px-4 md:px-6 xl:px-8 py-4 mb-4">
          <div className="flex items-center gap-2 text-tiny text-[var(--text-muted)]">
            <span>Front Office</span>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            <span>Pendaftaran Kunjungan</span>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            <span className="text-[var(--text-primary)] font-medium">{isEditMode ? 'Update Asesmen Keperawatan' : 'Assesment Keperawatan'}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center" style={{ color: 'var(--border-primary)' }}>
            <div className="w-full border-t border-[var(--border-primary)]" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-secondary)] uppercase tracking-wider">
              Asesmen Keperawatan (SOAPIE)
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-[70%_30%] gap-6 items-start">

          {/* ===== KOLOM KIRI (70%): Form SOAPIE ===== */}
          <div className="space-y-4">
            {SOAPIE_FIELDS.map((f) => (
              <Card key={f.key} className="p-4">
                <TextAreaField
                  label={f.label}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={(v) => setField(f.key, v)}
                />
              </Card>
            ))}
          </div>

          {/* ===== KOLOM KANAN (30%): Patient Profile ===== */}
          <div>
            <Card className="p-5 sticky top-[72px]">
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-primary)]">
                <div className="w-14 h-14 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] text-2xl">
                  {p?.nama?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-[var(--text-primary)] truncate">{p?.nama || '-'}</h3>
                  <p className="text-tiny text-[var(--text-muted)] font-mono">{p?.noRm || '-'}</p>
                </div>
                <Badge tone={STATUS_BADGE[kunjungan?.status] || 'neutral'} variant="soft">{kunjungan?.status || ''}</Badge>
              </div>

              <div className="space-y-2.5 text-sm mt-3">
                <InfoRow label="No. Pendaftaran" value={kunjungan?.noPendaftaran} mono />
                <InfoRow label="No. Rekam Medis" value={p?.noRm} mono />
                <InfoRow label="Tanggal Lahir" value={p?.tanggal_lahir ? formatDateID(p.tanggal_lahir) : '-'} />
                <InfoRow label="Usia" value={usia} />
                <InfoRow label="Jenis Kelamin" value={p?.jenis_kelamin === 'L' ? 'Laki-laki' : p?.jenis_kelamin === 'P' ? 'Perempuan' : p?.jenis_kelamin || '-'} />
                <InfoRow label="Alamat" value={p?.alamat} />
                <InfoRow label="No. KTP" value={p?.nik} mono />
                <InfoRow label="No. HP" value={p?.noHp} mono />
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-primary)] space-y-1.5 text-sm">
                <InfoRow label="Poli" value={kunjungan?.poli?.nama} />
                <InfoRow label="Dokter" value={kunjungan?.dokter?.nama} />
                <InfoRow label="Ruangan" value={kunjungan?.ruangan?.namaRuangan} />
                <InfoRow label="Penanggung Jawab" value={kunjungan?.penanggungJawab} />
                <InfoRow label="Tanggal Kunjungan" value={kunjungan?.tglJamKunjungan ? formatDateID(kunjungan.tglJamKunjungan) : '-'} />
              </div>

              {kunjungan?.hasNursingAssessment && (
                <div className="mt-4 pt-3 border-t border-[var(--border-primary)]">
                  <Badge tone="success" variant="soft">Asesmen pernah disimpan</Badge>
                </div>
              )}
            </Card>
          </div>

          {/* STICKY ACTION FOOTER */}
          <div className="xl:col-span-2 sticky bottom-0 left-0 right-0 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] px-4 md:px-6 xl:px-8 py-3 flex justify-end gap-2 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
            <Btn variant="ghost" size="sm" type="button" disabled={saving} onClick={() => navigate('/pendaftaran-lama')}>
              Kembali
            </Btn>
            <Btn variant="primary" size="sm" type="submit" disabled={saving}>
              {saving ? 'Menyimpan…' : (isEditMode ? 'Perbarui Asesmen' : 'Simpan Asesmen')}
            </Btn>
          </div>
        </form>
      </div>
    </div>
  )
}
