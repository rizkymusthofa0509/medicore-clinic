// ============================================================
// features/laporan/pages/CetakSuratPage.jsx
// Cetak Dokumen standar klinik — Resep, Surat Rujukan, Surat Sakit.
// Data diambil dari kunjungan + pemeriksaan dokter aktual (per branch aktif),
// dicetak dengan kop klinik standar (window.print).
// ============================================================

import { useEffect, useState } from 'react'

import { Card, Badge, Btn, Input, Spinner, EmptyState } from '../../../shared/components/ui.jsx'
import SelectSearch from '../../../shared/components/SelectSearch.jsx'
import { getCurrentBranchId } from '../../../shared/store/clinic.js'
import { fetchBranches } from '../../../shared/branches.js'
import { fetchKunjungan } from '../../front-office/service/kunjunganService.js'
import { fetchPemeriksaanDokter } from '../../front-office/service/pemeriksaanDokterService.js'

const JENIS = [
  { value: 'resep', label: 'Resep Obat' },
  { value: 'rujukan', label: 'Surat Rujukan' },
  { value: 'sakit', label: 'Surat Keterangan Sakit' },
]

function fmtTanggal(v, opts) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleDateString('id-ID', opts || { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtJam(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function hitungUsia(tglLahir) {
  if (!tglLahir) return '-'
  const birth = new Date(tglLahir)
  if (Number.isNaN(birth.getTime())) return '-'
  const now = new Date()
  let th = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) th--
  if (th < 1) {
    const bln = Math.max(0, (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth())
    return `${bln} bulan`
  }
  return `${th} tahun`
}

export default function CetakSuratPage() {
  const [branchId, setBranchId] = useState(() => getCurrentBranchId())
  const [branch, setBranch] = useState(null)
  const [jenis, setJenis] = useState('resep')
  const [kunjunganList, setKunjunganList] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [exam, setExam] = useState(null)
  const [kunjungan, setKunjungan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Field khusus surat
  const [tujuanRujukan, setTujuanRujukan] = useState('')
  const [diagnosaRujukan, setDiagnosaRujukan] = useState('')
  const [lamaSakit, setLamaSakit] = useState('')
  const [alasanSakit, setAlasanSakit] = useState('')
  const [tglSakit, setTglSakit] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    const onBranch = () => setBranchId(getCurrentBranchId())
    window.addEventListener('branch:changed', onBranch)
    return () => window.removeEventListener('branch:changed', onBranch)
  }, [])

  useEffect(() => {
    if (!branchId) return
    fetchBranches({ force: true }).then((list) => {
      const b = list.find((x) => String(x.id) === String(branchId))
      setBranch(b ? { nama: b.name || b.nama, alamat: b.address, telp: b.phone } : null)
    }).catch(() => {})
  }, [branchId])

  // Muat kunjungan selesai (yang sudah diperiksa) untuk dipilih
  useEffect(() => {
    if (!branchId) return
    setLoading(true); setError('')
    fetchKunjungan(branchId, { status: 'selesai', limit: 100 })
      .then((rows) => setKunjunganList(rows))
      .catch(() => setKunjunganList([]))
      .finally(() => setLoading(false))
  }, [branchId])

  // Muat pemeriksaan dokter saat kunjungan dipilih
  useEffect(() => {
    if (!selectedId) { setExam(null); setKunjungan(null); return }
    const row = kunjunganList.find((k) => String(k.id) === String(selectedId))
    setKunjungan(row || null)
    if (!row) return
    setLoading(true); setError('')
    fetchPemeriksaanDokter(row.encodedId)
      .then((pd) => setExam(pd))
      .catch(() => setExam(null))
      .finally(() => setLoading(false))
  }, [selectedId, kunjunganList])

  const cetak = (title, bodyHtml) => {
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 28px; color: #111; font-size: 12px; }
        .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 12px; }
        .kop h1 { font-size: 19px; margin: 0; letter-spacing: 1px; }
        .kop p { margin: 2px 0; font-size: 11px; }
        h2 { text-align: center; text-decoration: underline; font-size: 14px; margin: 12px 0 14px; }
        .meta { margin-bottom: 14px; }
        .meta table { border-collapse: collapse; }
        .meta td { padding: 1px 6px 1px 0; }
        .isi { margin: 10px 0 18px; line-height: 1.7; }
        table.resep { width: 100%; border-collapse: collapse; }
        table.resep th, table.resep td { border: 1px solid #000; padding: 5px 7px; text-align: left; }
        table.resep th { background: #eee; }
        .sign { display: flex; justify-content: space-between; margin-top: 44px; }
        .sign div { width: 220px; text-align: center; font-size: 11px; }
        .sign p { margin: 2px 0; }
        .sp { height: 44px; }
        @media print { body { margin: 12mm; } }
      </style></head><body>
        <div class="kop">
          <h1>${branch?.nama || 'MEDICORE CLINIC'}</h1>
          <p>${branch?.alamat || ''}${branch?.telp ? ' • Telp ' + branch.telp : ''}</p>
        </div>
        <h2>${title}</h2>
        ${bodyHtml}
      </body></html>`)
    w.document.close(); w.focus(); setTimeout(() => w.print(), 300)
  }

  const buildResep = () => {
    if (!exam) return
    const p = kunjungan?.pasien
    const meta = `
      <div class="meta"><table>
        <tr><td><b>Nama</b></td><td>: ${p?.nama || '-'}</td><td style="width:60px"></td><td><b>No. RM</b></td><td>: ${p?.noRm || '-'}</td></tr>
        <tr><td><b>Umur</b></td><td>: ${hitungUsia(p?.tanggalLahir)}</td><td></td><td><b>Tanggal</b></td><td>: ${fmtTanggal(kunjungan?.tglJamKunjungan)}</td></tr>
        <tr><td><b>Alamat</b></td><td colspan="4">: ${p?.alamat || '-'}</td></tr>
      </table></div>`

    const rows = (exam.pemberianObat || []).map((o, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${o.namaObat || '-'}</td>
        <td style="text-align:center">${o.jumlah ?? '-'}</td>
        <td style="text-align:center">${o.aturanPakai || o.dosis || '-'}</td>
        <td style="text-align:center">${o.satuan || '-'}</td>
      </tr>`).join('')
    const racik = (exam.pemberianObatRacik || []).map((r, i) => `
      <tr>
        <td>R${i + 1}</td>
        <td>${r.detail || '-'}</td>
        <td style="text-align:center">${r.jumlahKemasan ?? '-'}</td>
        <td style="text-align:center">${r.aturanPakai || '-'}</td>
        <td style="text-align:center">Racikan</td>
      </tr>`).join('')
    const kosong = `<tr><td colspan="5" style="text-align:center;color:#888">Tidak ada obat dalam resep</td></tr>`

    const body = `
      ${meta}
      <table class="resep">
        <thead><tr><th>No</th><th>Nama Obat</th><th style="width:60px">Jumlah</th><th style="width:140px">Aturan Pakai</th><th style="width:90px">Satuan</th></tr></thead>
        <tbody>${rows}${racik}${(!rows && !racik) ? kosong : ''}</tbody>
      </table>
      <div class="sign">
        <div><p>Diberikan kepada,</p><p class="sp"></p><p>( ${p?.nama || '____________'} )</p></div>
        <div><p>Dokter Penanggung Jawab,</p><p class="sp"></p><p>( ${kunjungan?.dokter?.nama || '____________'} )</p></div>
      </div>`
    cetak('RESEP OBAT', body)
  }

  const buildRujukan = () => {
    if (!kunjungan) return
    const p = kunjungan.pasien
    const diagnosa = diagnosaRujukan || (exam?.catatan || []).map((c) => c.diagnosa).filter(Boolean).join(', ') || '-'
    const body = `
      <div class="meta"><table>
        <tr><td><b>Nomor</b></td><td>: ${kunjungan.noPendaftaran}</td></tr>
        <tr><td><b>Nama Pasien</b></td><td>: ${p?.nama || '-'} (RM ${p?.noRm || '-'})</td></tr>
        <tr><td><b>Umur / JK</b></td><td>: ${hitungUsia(p?.tanggalLahir)} / ${p?.jenisKelamin === 'L' ? 'Laki-laki' : p?.jenisKelamin === 'P' ? 'Perempuan' : '-'}</td></tr>
        <tr><td><b>Alamat</b></td><td>: ${p?.alamat || '-'}</td></tr>
        <tr><td><b>Diagnosa</b></td><td>: ${diagnosa}</td></tr>
        <tr><td><b>Tujuan</b></td><td>: ${tujuanRujukan || '______________________'}</td></tr>
      </table></div>
      <div class="isi">
        Dengan hormat,<br />
        Mohon kiranya Bapak/Ibu dapat memeriksa dan memberikan penanganan lebih lanjut kepada pasien tersebut di atas.<br />
        Atas perhatian dan kerja samanya, kami ucapkan terima kasih.
      </div>
      <div class="sign">
        <div><p>&nbsp;</p></div>
        <div><p>${fmtTanggal(new Date().toISOString())}</p><p>Dokter Pengirim,</p><p class="sp"></p><p>( ${kunjungan.dokter?.nama || '____________'} )</p></div>
      </div>`
    cetak('SURAT RUJUKAN', body)
  }

  const buildSakit = () => {
    if (!kunjungan) return
    const p = kunjungan.pasien
    const body = `
      <div class="meta"><table>
        <tr><td><b>Nama</b></td><td>: ${p?.nama || '-'}</td><td style="width:60px"></td><td><b>No. RM</b></td><td>: ${p?.noRm || '-'}</td></tr>
        <tr><td><b>Umur</b></td><td>: ${hitungUsia(p?.tanggalLahir)}</td><td></td><td><b>JK</b></td><td>: ${p?.jenisKelamin === 'L' ? 'Laki-laki' : p?.jenisKelamin === 'P' ? 'Perempuan' : '-'}</td></tr>
        <tr><td><b>Alamat</b></td><td colspan="4">: ${p?.alamat || '-'}</td></tr>
      </table></div>
      <div class="isi">
        Yang bertanda tangan di bawah ini, dokter yang memeriksa pasien tersebut di atas, menerangkan bahwa yang
        bersangkutan dalam keadaan <b>sakit</b> sehingga tidak dapat melakukan aktivitas seperti biasa, terhitung
        sejak <b>${fmtTanggal(tglSakit)}</b> selama <b>${lamaSakit || '___'} hari</b>${alasanSakit ? ', dengan alasan: ' + alasanSakit : '.'}
      </div>
      <div class="sign">
        <div><p>&nbsp;</p></div>
        <div><p>${fmtTanggal(new Date().toISOString())}</p><p>Dokter Pemeriksa,</p><p class="sp"></p><p>( ${kunjungan.dokter?.nama || '____________'} )</p></div>
      </div>`
    cetak('SURAT KETERANGAN SAKIT', body)
  }

  const onCetak = () => {
    if (!selectedId) { setError('Pilih kunjungan pasien terlebih dahulu'); return }
    if (jenis === 'resep') buildResep()
    else if (jenis === 'rujukan') buildRujukan()
    else buildSakit()
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Cetak Dokumen</h1>
        <p className="text-sm text-[var(--text-muted)]">Resep, surat rujukan &amp; surat keterangan sakit — kop klinik otomatis</p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SelectSearch label="Jenis Dokumen" value={jenis} onChange={setJenis} options={JENIS.map((j) => ({ value: j.value, label: j.label }))} />
          <div className="sm:col-span-2">
            <SelectSearch
              label="Pilih Kunjungan (status selesai)"
              value={selectedId}
              onChange={(v) => { setSelectedId(v); setError('') }}
              placeholder="Ketik nama / no. pendaftaran…"
              options={kunjunganList.map((k) => ({
                value: String(k.id),
                label: `${k.noPendaftaran} • ${k.pasien?.nama || '-'}`,
                sub: `RM ${k.pasien?.noRm || '-'} • ${fmtTanggal(k.tglJamKunjungan)}`,
              }))}
            />
            {kunjunganList.length === 0 && (
              <p className="text-caption text-[var(--text-tertiary)] mt-1">Belum ada kunjungan selesai pada branch ini.</p>
            )}
          </div>
        </div>
      </Card>

      {jenis === 'rujukan' && (
        <Card className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Tujuan Rujukan (rumah sakit / poli)" type="text" placeholder="mis. RSUD Kabupaten" value={tujuanRujukan} onChange={setTujuanRujukan} />
            <Input label="Diagnosa (kosongkan utk pakai diagnosa pemeriksaan)" type="text" value={diagnosaRujukan} onChange={setDiagnosaRujukan} />
          </div>
        </Card>
      )}

      {jenis === 'sakit' && (
        <Card className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Tanggal Mulai Sakit" type="date" value={tglSakit} onChange={setTglSakit} />
            <Input label="Lama Sakit (hari)" type="number" min={1} value={lamaSakit} onChange={setLamaSakit} />
            <Input label="Alasan / Keterangan (opsional)" type="text" placeholder="mis. demam, kelelahan" value={alasanSakit} onChange={setAlasanSakit} />
          </div>
        </Card>
      )}

      {error && <div className="px-4 py-2 rounded-lg bg-[var(--status-danger)]/10 text-[var(--status-danger)] text-sm">{error}</div>}

      {selectedId && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-[var(--text-primary)]">
                {kunjungan?.pasien?.nama} — <span className="text-[var(--text-secondary)]">{kunjungan?.poli?.nama}</span>
              </p>
              <p className="text-caption text-[var(--text-tertiary)]">
                Dokter: {kunjungan?.dokter?.nama || '-'} • {fmtTanggal(kunjungan?.tglJamKunjungan)} {fmtJam(kunjungan?.tglJamKunjungan)}
              </p>
            </div>
            <Btn variant="primary" size="sm" onClick={onCetak} disabled={loading}>
              {loading ? 'Memuat…' : `Cetak ${JENIS.find((j) => j.value === jenis)?.label || ''}`}
            </Btn>
          </div>
          {exam && exam.pemberianObat?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="info">{exam.pemberianObat.length} obat</Badge>
              {exam.pemberianObatRacik?.length > 0 && <Badge tone="warning">{exam.pemberianObatRacik.length} racikan</Badge>}
            </div>
          )}
        </Card>
      )}

      {!selectedId && !loading && (
        <EmptyState title="Belum memilih kunjungan" desc="Pilih pasien di atas untuk mencetak dokumen." />
      )}
    </div>
  )
}
