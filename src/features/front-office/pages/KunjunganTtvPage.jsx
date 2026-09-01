import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { Card, Badge, Btn, toast } from '../../../shared/components/ui.jsx'
import { showKunjungan, saveTtv } from '../service/kunjunganService.js'

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

const KESEDARAN_OPTIONS = ['Compos mentis', 'Apatis', 'Somnolen', 'Kagul', 'Delirium']

const INITIAL_TTV = {
  keluhan_utama: '',
  suhu: '',
  saturasi_oksigen: '',
  kesadaran: 'Compos mentis',
  tinggi_badan: '',
  berat_badan: '',
  lingkar_perut: '',
  imt: '',
  sistole: '',
  diastole: '',
  respiratory_rate: '',
  heart_rate: '',
  catatan_ttv: '',
}

// Format a datetime/date string (Y-m-d or Y-m-d H:i:s) to Indonesia locale
function formatDateID(dt) {
  if (!dt) return '-'
  const d = new Date(dt)
  if (isNaN(d.getTime())) return dt
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function KunjunganTtvPage() {
  const params = useParams()
  const navigate = useNavigate()
  const kunjunganId = params?.kunjunganId

  const [kunjungan, setKunjungan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [ttvForm, setTtvForm] = useState(INITIAL_TTV)
  const [saving, setSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    if (!kunjunganId) {
      setLoading(false)
      setErrorMsg('ID kunjungan tidak ditemukan')
      return
    }

    setLoading(true)
    setErrorMsg('')
    showKunjungan(kunjunganId)
      .then((data) => {
        setKunjungan(data)
        // Jika sudah ada data TTV → buka form dalam mode EDIT (update)
        if (data?.dataTtv) {
          setTtvForm((prev) => ({ ...prev, ...data.dataTtv }))
          setIsEditMode(true)
        }
      })
      .catch((err) => {
        console.error('[TTV] gagal load:', err)
        setErrorMsg(err?.response?.data?.message || 'Gagal memuat data kunjungan')
      })
      .finally(() => setLoading(false))
  }, [kunjunganId])

  const setField = (key, value) => {
    setTtvForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    try {
      await saveTtv(kunjunganId, ttvForm)
      toast('Tanda Tanda Vital berhasil disimpan', 'success')
      navigate('/pendaftaran-lama')
    } catch (err) {
      console.error('[TTV] gagal simpan:', err)
      toast(err?.response?.data?.message || 'Gagal menyimpan TTV', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Hitung IMT otomatis ketika tinggi & berat valid (hindari overflow decimal & input tak realistis)
  useEffect(() => {
    const t = parseFloat(ttvForm.tinggi_badan)
    const b = parseFloat(ttvForm.berat_badan)
    if (!isNaN(t) && !isNaN(b) && t >= 30 && t <= 300 && b > 0 && b <= 600) {
      const imt = (b / ((t / 100) ** 2)).toFixed(1)
      setField('imt', parseFloat(imt) <= 99.99 ? imt : '')
    } else {
      setField('imt', '')
    }
  }, [ttvForm.tinggi_badan, ttvForm.berat_badan])

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
          <svg className="w-5 h-5 absolute left-3 top-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9v4M12 17h.01"/></svg>
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
        {/* STICKY PAGE TITLE + DIVIDER */}
        <div className="sticky top-0 z-[5] -mx-4 md:-mx-6 xl:-mx-8 bg-[var(--bg-secondary)]/95 border-b border-[var(--border-primary)] px-4 md:px-6 xl:px-8 py-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-tiny text-[var(--text-muted)]">
              <span>Front Office</span>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              <span>Pendaftaran Kunjungan</span>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              <span className="text-[var(--text-primary)] font-medium">{isEditMode ? 'Update Tanda Tanda Vital' : 'Pemeriksaan Tanda Tanda Vital (TTV)'}</span>
            </div>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center" style={{ color: 'var(--border-primary)' }}>
            <div className="w-full border-t border-[var(--border-primary)]" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-secondary)] uppercase tracking-wider">
              Pemeriksaan Tanda Tanda Vital (TTV)
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-[70%_30%] gap-6 items-start">

          {/* ===== KOLOM KIRI (70%): Form TTV ===== */}
          <div className="space-y-4">

            {/* Keluhan Utama */}
            <Card className="p-4">
              <label className="block text-tiny font-semibold text-[var(--text-secondary)] mb-1.5">
                Keluhan Utama
              </label>
              <textarea
                placeholder="Keluhan Utama Pasien"
                value={ttvForm.keluhan_utama}
                onChange={(e) => setField('keluhan_utama', e.target.value)}
                rows={3}
                className="input w-full resize-y"
              />
            </Card>

            {/* Vital Signs */}
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Tanda Tanda Vital</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <NumberField
                  label="Suhu"
                  suffix="°C"
                  placeholder="36.5"
                  value={ttvForm.suhu}
                  onChange={(v) => setField('suhu', v)}
                />
                <NumberField
                  label="Saturasi Oksigen"
                  suffix="%"
                  placeholder="98"
                  value={ttvForm.saturasi_oksigen}
                  onChange={(v) => setField('saturasi_oksigen', v)}
                />
                <div className="md:col-span-2">
                  <label className="block text-tiny font-semibold text-[var(--text-secondary)] mb-1">Kesadaran</label>
                  <select
                    value={ttvForm.kesadaran}
                    onChange={(e) => setField('kesadaran', e.target.value)}
                    className="input w-full"
                  >
                    {KESEDARAN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Antropometri */}
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Antropometri</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <NumberField label="Tinggi Badan" suffix="cm" placeholder="160" value={ttvForm.tinggi_badan} onChange={(v) => setField('tinggi_badan', v)} />
                <NumberField label="Berat Badan" suffix="kg" placeholder="60" value={ttvForm.berat_badan} onChange={(v) => setField('berat_badan', v)} />
                <NumberField label="Lingkar Perut" suffix="cm" placeholder="90" value={ttvForm.lingkar_perut} onChange={(v) => setField('lingkar_perut', v)} />
                <NumberField label="IMT" suffix="kg/m²" placeholder="21.5" value={ttvForm.imt} onChange={(v) => setField('imt', v)} readOnly computed />
              </div>
            </Card>

            {/* Tekanan Darah / RR / HR */}
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Tekanan Darah & Frekuensi</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <NumberField label="Sistole" suffix="mmHg" placeholder="120" value={ttvForm.sistole} onChange={(v) => setField('sistole', v)} />
                <NumberField label="Diastole" suffix="mmHg" placeholder="80" value={ttvForm.diastole} onChange={(v) => setField('diastole', v)} />
                <NumberField label="Respiratory Rate" suffix="/ minute" placeholder="16" value={ttvForm.respiratory_rate} onChange={(v) => setField('respiratory_rate', v)} />
                <NumberField label="Heart Rate" suffix="bpm" placeholder="72" value={ttvForm.heart_rate} onChange={(v) => setField('heart_rate', v)} />
              </div>
            </Card>

            {/* Catatan Tambahan */}
            <Card className="p-4">
              <label className="block text-tiny font-semibold text-[var(--text-secondary)] mb-1.5">
                Catatan Tambahan
              </label>
              <input
                type="text"
                placeholder="Catatan Tambahan TTV (Opsional)"
                value={ttvForm.catatan_ttv}
                onChange={(e) => setField('catatan_ttv', e.target.value)}
                className="input w-full"
              />
            </Card>

          </div>

          {/* ===== KOLOM KANAN (30%): Patient Profile ===== */}
          <div>
            <Card className="p-5 sticky top-[72px]">
              {/* Patient header */}
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
                <InfoRow label="Hubungan" value={kunjungan?.hubunganPj} />
                <InfoRow label="Penjamin / Asuransi" value={kunjungan?.asuransi?.namaPerusahaan} />
                <InfoRow label="Tanggal Kunjungan" value={kunjungan?.tglJamKunjungan ? formatDateID(kunjungan.tglJamKunjungan) : '-'} />
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-primary)]">
                <Badge tone={PRIORITY_BADGE[kunjungan?.statusPrioritas] || 'normal'} variant="soft">
                  Prioritas: {kunjungan?.statusPrioritas || 'normal'}
                </Badge>
              </div>
            </Card>
          </div>

          {/* STICKY ACTION FOOTER (sticky bottom, stays visible on scroll) */}
          <div className="xl:col-span-2 sticky bottom-0 left-0 right-0 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] px-4 md:px-6 xl:px-8 py-3 flex justify-end gap-2 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
            <Btn variant="ghost" size="sm" type="button" disabled={saving} onClick={() => navigate('/pendaftaran-lama')}>
              Kembali
            </Btn>
            <Btn variant="primary" size="sm" type="submit" disabled={saving}>
              {saving ? 'Menyimpan…' : (isEditMode ? 'Perbarui TTV' : 'Simpan TTV')}
            </Btn>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ===== Helper Components ===== */

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

function NumberField({ label, suffix, placeholder, value, onChange, readOnly, computed }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-tiny font-semibold text-[var(--text-secondary)]">{label}</label>
      <div className="relative">
        <input
          type="number"
          step="0.1"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          className={"input w-full pr-12 " + (computed ? "bg-[var(--bg-secondary)]" : "")}
        />
        {suffix && (
          <span className="absolute inset-y-0 right-3 flex items-center text-tiny text-[var(--text-muted)] pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}
