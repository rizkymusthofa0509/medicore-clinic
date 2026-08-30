// ============================================================
// src/shared/store/clinic.js
// Data store untuk sistem klinik multi-branch (Medicore)
// ============================================================

const uid = () =>
  'id_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
    .padStart(4, '0')

const todayISO = () => new Date().toISOString().slice(0, 10)
const todayDate = () => new Date().toISOString().slice(0, 10).replace(/-/g, '')
const todayDateTime = () => new Date().toISOString().slice(0, 16)

// ---------- Branch context ----------
let currentBranchId = 'br_001'
export function setCurrentBranch(id) {
  if (branches.find(b => b.id === id)) currentBranchId = id
  try { localStorage.setItem('medicore_branch', id) } catch { /* ignore */ }
}
export function getCurrentBranchId() { return currentBranchId }
export function getCurrentBranch() { return branches.find(b => b.id === currentBranchId) || null }

// ---------- Branches ----------
const branches = [
  { id: 'br_001', nama: 'Klinik Medicore Pusat', alamat: 'Jl. Raya Kuningan No. 88, Jakarta Selatan', telepon: '(021) 555-0101', jamOperasional: '08:00 - 20:00', status: 'aktif' },
  { id: 'br_002', nama: 'Klinik Medicore Kelapa Gading', alamat: 'Jl. Kelapa Gading Raya No. 45, Jakarta Utara', telepon: '(021) 555-0202', jamOperasional: '08:00 - 18:00', status: 'aktif' },
]

// ---------- Poli ----------
const polis = [
  { id: 'pl_001', kode: 'PL-UM', nama: 'Poli Umum', jenisPoli: 'Umum', unitStok: 'Depo Utama', status: 'aktif', antrianFTKP: true, branchId: 'br_001' },
  { id: 'pl_002', kode: 'PL-KIA', nama: 'KIA / Kebidanan', jenisPoli: 'Kebidanan', unitStok: 'Depo Utama', status: 'aktif', antrianFTKP: true, branchId: 'br_001' },
  { id: 'pl_003', kode: 'PL-GI', nama: 'Poli Gigi', jenisPoli: 'Gigi', unitStok: 'Depo Gigi', status: 'aktif', antrianFTKP: true, branchId: 'br_001' },
  { id: 'pl_004', kode: 'PL-THT', nama: 'Poli THT', jenisPoli: 'THT', unitStok: 'Depo Gigi', status: 'aktif', antrianFTKP: true, branchId: 'br_001' },
  { id: 'pl_005', kode: 'PL-RAD', nama: 'Poli Radiologi', jenisPoli: 'Radiologi', unitStok: 'Depo Gigi', status: 'aktif', antrianFTKP: false, branchId: 'br_001' },
]

// ---------- Depo Obat ----------
const depoObat = [
  { id: 'dp_001', namaDepo: 'Depo Utama', lokasi: 'Lantai 1', keterangan: 'Depo Utama Klinik' },
  { id: 'dp_002', namaDepo: 'Depo UGD', lokasi: 'Lantai 1', keterangan: 'Depo Gawat Darurat' },
  { id: 'dp_003', namaDepo: 'Depo Gigi', lokasi: 'Lantai 2', keterangan: 'Depo Poli Gigi' },
  { id: 'dp_004', namaDepo: 'Depo Apotek', lokasi: 'Lantai 1', keterangan: 'Depo Apotek' },
]

// ---------- Tindakan Medis ----------
const tindakanMedis = [
  { id: 'td_001', kelompokTindakan: 'Tindakan Umum', kodeICD9: '99.0', namaTindakan: 'Pemeriksaan Umum', poliId: 'pl_001', jumlahBiaya: 50000, jasaDokter: 30000, persentaseDokter: 60, rupiahDokter: 30000, jasaAsisten: 10000, jasaKlinik: 10000 },
  { id: 'td_002', kelompokTindakan: 'Tindakan Gigi', kodeICD9: '23.0', namaTindakan: 'Pemeriksaan Gigi', poliId: 'pl_003', jumlahBiaya: 75000, jasaDokter: 45000, persentaseDokter: 60, rupiahDokter: 45000, jasaAsisten: 15000, jasaKlinik: 15000 },
  { id: 'td_003', kelompokTindakan: 'Tindakan THT', kodeICD9: '21.0', namaTindakan: 'Pemeriksaan THT', poliId: 'pl_004', jumlahBiaya: 80000, jasaDokter: 48000, persentaseDokter: 60, rupiahDokter: 48000, jasaAsisten: 16000, jasaKlinik: 16000 },
]

// ---------- Tenaga Dokter ----------
const doctors = [
  { id: 'dr_001', nip: '198501012010011002', nama: 'dr. Rina Wati, Sp.P', spesialisasi: 'Penyakit Dalam', poliId: 'pl_001', branchId: 'br_001' },
  { id: 'dr_002', nip: '198806152013021005', nama: 'dr. Budi Santoso, Sp.KG', spesialisasi: 'Kedokteran Gigi', poliId: 'pl_003', branchId: 'br_001' },
  { id: 'dr_003', nip: '199010102015011008', nama: 'dr. Sari Dewi, Sp.OG', spesialisasi: 'Kebidanan & Kandungan', poliId: 'pl_002', branchId: 'br_001' },
  { id: 'dr_004', nip: '199203202018011011', nama: 'dr. Eko Prasetyo, Sp.P', spesialisasi: 'Penyakit Dalam', poliId: 'pl_004', branchId: 'br_002' },
]

// ---------- Obat (farmasi) ----------
const obatDefault = [
  { id: 'ob_001', nama: 'Paracetamol 500mg', kategori: 'Analgesik', stok: 120, hargaBeli: 2500, hargaJual: 5000, stokMinimum: 30, satuan: 'tablet' },
  { id: 'ob_002', nama: 'Amoxicillin 500mg', kategori: 'Antibiotik', stok: 80, hargaBeli: 8000, hargaJual: 15000, stokMinimum: 20, satuan: 'kapsul' },
  { id: 'ob_003', nama: 'Cetirizin 10mg', kategori: 'Antihistamin', stok: 90, hargaBeli: 4500, hargaJual: 8000, stokMinimum: 25, satuan: 'tablet' },
  { id: 'ob_004', nama: 'Ibuprofen 400mg', kategori: 'Analgesik NSAID', stok: 65, hargaBeli: 3200, hargaJual: 6000, stokMinimum: 20, satuan: 'tablet' },
  { id: 'ob_005', nama: 'Omeprazole 20mg', kategori: 'Penurun Asam', stok: 40, hargaBeli: 6000, hargaJual: 12000, stokMinimum: 15, satuan: 'kapsul' },
  { id: 'ob_006', nama: 'Metformin 500mg', kategori: 'Antidiabetik', stok: 55, hargaBeli: 7000, hargaJual: 14000, stokMinimum: 20, satuan: 'tablet' },
  { id: 'ob_007', nama: 'Vitamin C 1000mg', kategori: 'Vitamin', stok: 150, hargaBeli: 3000, hargaJual: 5500, stokMinimum: 50, satuan: 'tablet' },
  { id: 'ob_008', nama: 'Oxytocin Injection 10IU', kategori: 'Obat Oxytocin', stok: 25, hargaBeli: 25000, hargaJual: 45000, stokMinimum: 10, satuan: 'vial' },
  { id: 'ob_009', nama: 'Natrium Klorida 0,9%', kategori: 'Infus', stok: 100, hargaBeli: 4000, hargaJual: 8000, stokMinimum: 30, satuan: 'kemasan 500ml' },
  { id: 'ob_010', nama: 'Methylprednisolone 4mg', kategori: 'Kortikosteroid', stok: 35, hargaBeli: 5000, hargaJual: 10000, stokMinimum: 10, satuan: 'tablet' },
]

// ---------- Daftar pasien existing (komprehensive) ----------
const patients = [
  {
    id: 'p_0001', noRM: 'RM-001', noRMLama: '', nama: 'Ayu Lestari', jenisIdentitas: 'KTP',
    nik: '3271011201850001', tempatLahir: 'Jakarta', tglLahir: '1985-12-12', umur: 38, gender: 'Perempuan',
    golonganDarah: 'O', agama: 'Islam', statusPernikahan: 'Menikah', pendidikan: 'S1',
    alamat: 'Jl. Mawar No. 10', kelurahan: 'Mampang', kecamatan: 'Mampang Prapatan', kabupaten: 'Jakarta Selatan', provinsi: 'DKI Jakarta',
    noHP: '081234567890', createdAt: '2024-01-10'
  },
  {
    id: 'p_0002', noRM: 'RM-002', noRMLama: '', nama: 'Budi Hermawan', jenisIdentitas: 'KTP',
    nik: '3271024501900002', tempatLahir: 'Bogor', tglLahir: '1990-04-25', umur: 34, gender: 'Laki-laki',
    golonganDarah: 'A', agama: 'Islam', statusPernikahan: 'Menikah', pendidikan: 'SMA',
    alamat: 'Jl. Melati No. 22', kelurahan: 'Cilandak', kecamatan: 'Cilandak', kabupaten: 'Jakarta Selatan', provinsi: 'DKI Jakarta',
    noHP: '085678901234', createdAt: '2024-02-05'
  },
  {
    id: 'p_0003', noRM: 'RM-003', noRMLama: 'RM-LAMA-003', nama: 'Citra Rahayu', jenisIdentitas: 'KTP',
    nik: '3271033201920003', tempatLahir: 'Bandung', tglLahir: '1992-08-09', umur: 32, gender: 'Perempuan',
    golonganDarah: 'B', agama: 'Islam', statusPernikahan: 'Belum Menikah', pendidikan: 'D3',
    alamat: 'Jl. Anggrek No. 5', kelurahan: 'Kebon Jeruk', kecamatan: 'Kebon Jeruk', kabupaten: 'Jakarta Barat', provinsi: 'DKI Jakarta',
    noHP: '087812345678', createdAt: '2024-03-12'
  },
  {
    id: 'p_0004', noRM: 'RM-004', noRMLama: '', nama: 'Dimas Anggara', jenisIdentitas: 'SIM',
    nik: '3271047601950004', tempatLahir: 'Depok', tglLahir: '1995-03-03', umur: 29, gender: 'Laki-laki',
    golonganDarah: 'AB', agama: 'Islam', statusPernikahan: 'Belum Menikah', pendidikan: 'S1',
    alamat: 'Jl. Bougenvil No. 33', kelurahan: 'Pancoran', kecamatan: 'Pancoran', kabupaten: 'Jakarta Selatan', provinsi: 'DKI Jakarta',
    noHP: '082165432109', createdAt: '2024-04-20'
  },
  {
    id: 'p_0005', noRM: 'RM-005', noRMLama: '', nama: 'Esther Lim', jenisIdentitas: 'KTP',
    nik: '3271058901960005', tempatLahir: 'Medan', tglLahir: '1996-07-17', umur: 28, gender: 'Perempuan',
    golonganDarah: 'O', agama: 'Kristen', statusPernikahan: 'Belum Menikah', pendidikan: 'S1',
    alamat: 'Jl. Dahlia No. 15', kelurahan: 'Menteng', kecamatan: 'Menteng', kabupaten: 'Jakarta Pusat', provinsi: 'DKI Jakarta',
    noHP: '081598765432', createdAt: '2024-05-10'
  },
  {
    id: 'p_0006', noRM: 'RM-006', noRMLama: '', nama: 'Bayi Lestari', jenisIdentitas: 'Tanpa Identitas',
    nik: '', tempatLahir: 'Jakarta', tglLahir: '2024-01-15', umur: 0, gender: 'Perempuan',
    golonganDarah: '', agama: '', statusPernikahan: '', pendidikan: '',
    alamat: 'Jl. Mawar No. 10', kelurahan: 'Mampang', kecamatan: 'Mampang Prapatan', kabupaten: 'Jakarta Selatan', provinsi: 'DKI Jakarta',
    noHP: '', createdAt: '2024-01-15'
  },
]

// ---------- Kunjungan (antrean hari ini) ----------
function createDummyVisits() {
  const today = todayDate()
  return [
    {
      id: 'vis_0001', patientId: 'p_0001', noAntrean: 'A-001', tanggal: today, jam: '08:30',
      statusKunjungan: 'Baru', poliId: 'pl_001', dokterId: 'dr_001', ruangan: 'R-101',
      status: 'Menunggu', penanggungJawab: 'Pasien', namaPenanggungJawab: 'Ayu Lestari',
      penjamin: 'UMUM', noPenjamin: '', catatanPenjamin: '',
      createdAt: new Date().toISOString()
    },
    {
      id: 'vis_0002', patientId: 'p_0002', noAntrean: 'A-002', tanggal: today, jam: '09:00',
      statusKunjungan: 'Baru', poliId: 'pl_001', dokterId: 'dr_001', ruangan: 'R-102',
      status: 'Menunggu', penanggungJawab: 'Pasien', namaPenanggungJawab: 'Budi Hermawan',
      penjamin: 'BPJS', noPenjamin: 'BPJS-123456789', catatanPenjamin: '',
      createdAt: new Date().toISOString()
    },
    {
      id: 'vis_0003', patientId: 'p_0003', noAntrean: 'K-001', tanggal: today, jam: '09:15',
      statusKunjungan: 'Lama', poliId: 'pl_002', dokterId: 'dr_003', ruangan: 'R-201',
      status: 'Diperiksa', penanggungJawab: 'Pasien', namaPenanggungJawab: 'Citra Rahayu',
      penjamin: 'Asuransi', noPenjamin: 'ASR-987654', catatanPenjamin: 'Mandiri Inhealth',
      createdAt: new Date().toISOString()
    },
    {
      id: 'vis_0004', patientId: 'p_0004', noAntrean: 'G-001', tanggal: today, jam: '10:00',
      statusKunjungan: 'Baru', poliId: 'pl_003', dokterId: 'dr_002', ruangan: 'R-301',
      status: 'Menunggu', penanggungJawab: 'Pasien', namaPenanggungJawab: 'Dimas Anggara',
      penjamin: 'UMUM', noPenjamin: '', catatanPenjamin: '',
      createdAt: new Date().toISOString()
    },
    {
      id: 'vis_0005', patientId: 'p_0006', noAntrean: 'K-002', tanggal: today, jam: '10:30',
      statusKunjungan: 'Baru', poliId: 'pl_002', dokterId: 'dr_003', ruangan: 'R-202',
      status: 'Menunggu', penanggungJawab: 'Orang Tua', namaPenanggungJawab: 'Ayu Lestari',
      penjamin: 'UMUM', noPenjamin: '', catatanPenjamin: 'Bayi baru lahir',
      createdAt: new Date().toISOString()
    },
  ]
}

const visits = createDummyVisits()

// ---------- Riwayat kunjungan sebelumnya ----------
function createDummyHistory() {
  const history = []
  history.push({
    id: 'vis_hist_001', patientId: 'p_0001', poliId: 'pl_001', dokterId: 'dr_001', branchId: 'br_001',
    noAntrean: 'A-991', tanggal: '2024-08-10', jam: '09:00', statusKunjungan: 'Lama',
    rekamMedis: { tensi: '120/80', suhu: '36.5', beratBadan: '62 kg', keluhan: 'Demam tinggi 3 hari', diagnosis: 'Influenza', resep: [{ obatId: 'ob_001', dosis: '1 tablet tiap 6 jam', qty: 10 }, { obatId: 'ob_003', dosis: '1 tablet sehari', qty: 5 }] },
    tagihan: { biayaKonsultasi: 50000, biayaTindakan: 0, totalObat: 85000, totalBayar: 135000, metodePembayaran: 'Tunai', tglBayar: '2024-08-10' }
  })
  history.push({
    id: 'vis_hist_002', patientId: 'p_0002', poliId: 'pl_003', dokterId: 'dr_002', branchId: 'br_001',
    noAntrean: 'G-991', tanggal: '2024-07-15', jam: '10:30', statusKunjungan: 'Lama',
    rekamMedis: { tensi: '130/90', suhu: '37.0', beratBadan: '70 kg', keluhan: 'Sakit gigi gerah pada rahang', diagnosis: 'Karies gigi diduga', resep: [{ obatId: 'ob_002', dosis: '1 kapsul tiap 8 jam', qty: 14 }, { obatId: 'ob_010', dosis: '1 tablet tiap 12 jam', qty: 6 }] },
    tagihan: { biayaKonsultasi: 75000, biayaTindakan: 150000, totalObat: 172000, totalBayar: 397000, metodePembayaran: 'QRIS', tglBayar: '2024-07-15' }
  })
  history.push({
    id: 'vis_hist_003', patientId: 'p_0003', poliId: 'pl_002', dokterId: 'dr_003', branchId: 'br_001',
    noAntrean: 'K-991', tanggal: '2024-07-01', jam: '14:00', statusKunjungan: 'Lama',
    rekamMedis: { tensi: '115/75', suhu: '36.2', beratBadan: '58 kg', keluhan: 'Pusing & mual', diagnosis: 'Hamil trimester 1, pukes', resep: [{ obatId: 'ob_007', dosis: '1 tablet sehari', qty: 30 }, { obatId: 'ob_008', dosis: '1 vial per kunjungan', qty: 1 }] },
    tagihan: { biayaKonsultasi: 50000, biayaTindakan: 0, totalObat: 175000, totalBayar: 225000, metodePembayaran: 'Tunai', tglBayar: '2024-07-01' }
  })
  return history
}

const visitHistory = createDummyHistory()

// ============================================================
// Helper hitung umur
// ============================================================
export function hitungUmur(tglLahir) {
  if (!tglLahir) return ''
  const today = new Date()
  const birth = new Date(tglLahir)
  let tahun = today.getFullYear() - birth.getFullYear()
  let bulan = today.getMonth() - birth.getMonth()
  if (bulan < 0 || (bulan === 0 && today.getDate() < birth.getDate())) {
    tahun--
    bulan += 12
  }
  if (tahun > 0) return `${tahun} tahun`
  if (bulan > 0) return `${bulan} bulan`
  const hari = Math.floor((today - birth) / (1000 * 60 * 60 * 24))
  return `${hari} hari`
}

// ============================================================
// Export fungsi query
// ============================================================
export function getBranches() { return branches }
export function getPoli(branchId) { return polis.filter(p => p.branchId === branchId) }
export const getPolis = getPoli

export function getDoctors(branchId, poliId) {
  let list = doctors.filter(d => d.branchId === branchId)
  if (poliId) list = list.filter(d => d.poliId === poliId)
  return list
}

export function getObatList(branchId) { return obatDefault.map(o => ({ ...o, branchId })) }
export function getPatients() { return patients }

export function getVisits(branchId, status) {
  let list = visits.filter(v => v.branchId === branchId)
  if (status) list = list.filter(v => v.status === status)
  return list.map(v => ({
    ...v,
    patient: patients.find(p => p.id === v.patientId) || null,
    poli: polis.find(p => p.id === v.poliId) || null,
    dokter: doctors.find(d => d.id === v.dokterId) || null,
  }))
}

export function getVisitHistoryByBranch(branchId) {
  return visitHistory.filter(h => h.branchId === branchId).map(h => ({
    ...h,
    patient: patients.find(p => p.id === h.patientId) || null,
    poli: polis.find(p => p.id === h.poliId) || null,
    dokter: doctors.find(d => d.id === h.dokterId) || null,
  }))
}

export function getNextNoAntrean(poliId) {
  const vis = visits.filter(v => v.poliId === poliId && v.tanggal === todayDate())
  const prefix = poliId === 'pl_001' ? 'A' : poliId === 'pl_002' ? 'K' : poliId === 'pl_003' ? 'G' : 'X'
  const lastNum = vis.length > 0 ? parseInt(vis[vis.length - 1].noAntrean.replace(/[^0-9]/g, ''), 10) : 0
  return `${prefix}-${String(lastNum + 1).padStart(3, '0')}`
}

export function getTotalPending(branchId) { return visits.filter(v => v.branchId === branchId && v.status === 'Menunggu').length }
export function getTotalSelesai(branchId) { return visits.filter(v => v.branchId === branchId && v.status === 'Selesai').length }

export function getCriticalStock(branchId) { return obatDefault.filter(o => o.stok <= o.stokMinimum).map(o => ({ ...o, branchId })) }

export function getTodayRevenue(branchId) {
  return visitHistory.filter(h => h.branchId === branchId && h.tagihan?.tglBayar === todayDate())
    .reduce((sum, h) => sum + (h.tagihan?.totalBayar || 0), 0)
}

// ============================================================
// Mutations
// ============================================================
export function registerNewPatient(data) {
  const noRM = `RM-${String(patients.length + 1).padStart(3, '0')}`
  const newP = { id: uid(), noRM, createdAt: todayISO(), ...data }
  patients.push(newP)
  return { ...newP, password: undefined }
}

export function searchPatient(query) {
  const q = query.toLowerCase().trim()
  return patients.filter(p =>
    p.nama.toLowerCase().includes(q) ||
    p.nik.includes(q) ||
    p.noRM.toLowerCase().includes(q) ||
    p.noHP.includes(q)
  )
}

export function createAntrean(pasienId, poliId, dokterId) {
  const noAntrean = getNextNoAntrean(poliId)
  const newVis = {
    id: uid(),
    patientId: pasienId,
    poliId,
    dokterId,
    branchId: currentBranchId,
    noAntrean,
    tanggal: todayDate(),
    jam: todayDateTime().slice(11, 16),
    statusKunjungan: 'Baru',
    status: 'Menunggu',
    penanggungJawab: 'Pasien',
    namaPenanggungJawab: '',
    penjamin: 'UMUM',
    noPenjamin: '',
    catatanPenjamin: '',
    createdAt: new Date().toISOString(),
  }
  visits.unshift(newVis)
  return newVis
}

export function createKunjungan(data) {
  const noAntrean = getNextNoAntrean(data.poliId)
  const newVis = {
    id: uid(),
    noAntrean,
    tanggal: data.tanggal || todayDate(),
    jam: data.jam || todayDateTime().slice(11, 16),
    statusKunjungan: data.statusKunjungan || 'Baru',
    status: 'Menunggu',
    branchId: currentBranchId,
    createdAt: new Date().toISOString(),
    ...data,
  }
  visits.unshift(newVis)
  return newVis
}

export function updateKunjunganStatus(visitId, statusBaru) {
  const idx = visits.findIndex(v => v.id === visitId)
  if (idx >= 0) { visits[idx].status = statusBaru; return true }
  return false
}

export function addRekamMedis(visitId, data) {
  const vis = visits.find(v => v.id === visitId)
  if (!vis) return null
  const rmId = uid()
  const rm = {
    id: rmId, visitId, branchId: vis.branchId,
    tensi: data.tensi || '', suhu: data.suhu || '', beratBadan: data.beratBadan || '',
    keluhan: data.keluhan || '', diagnosis: data.diagnosis || '', resep: data.resep || [], tglRekam: todayISO(),
  }
  vis.rekamMedisId = rmId
  vis.status = 'Apotek'
  visitHistory.unshift({
    id: uid(), patientId: vis.patientId, poliId: vis.poliId, dokterId: vis.dokterId, branchId: vis.branchId,
    noAntrean: vis.noAntrean, tanggal: vis.tanggal, status: 'Apotek', rekamMedis: rm, tagihan: null, tglBayar: null,
  })
  return rm
}

export function updateObatStok(obatId, qtyDelta, keterangan) {
  const idx = obatDefault.findIndex(o => o.id === obatId)
  if (idx < 0) return false
  obatDefault[idx].stok = Math.max(0, obatDefault[idx].stok + qtyDelta)
  return true
}

export function buatTagihan(visitId, data) {
  const vis = visits.find(v => v.id === visitId)
  if (!vis) return null
  const total = (data.biayaKonsultasi || 0) + (data.biayaTindakan || 0) + (data.totalObat || 0)
  const tagihan = {
    biayaKonsultasi: data.biayaKonsultasi || 50000, biayaTindakan: data.biayaTindakan || 0,
    totalObat: data.totalObat || 0, totalBayar: total, metodePembayaran: data.metodePembayaran || 'Tunai', tglBayar: todayISO(),
  }
  vis.status = 'Selesai'
  const hist = visitHistory.find(h => h.id === vis.rekamMedisId)
  if (hist) { hist.tagihan = tagihan; hist.tglBayar = todayISO(); hist.status = 'Selesai' }
  return { vis, tagihan }
}

export function getObatById(obatId) { return obatDefault.find(o => o.id === obatId) || null }

export function getAllKunjunganBerstatus(status, branchId) {
  if (branchId) return visits.filter(v => v.branchId === branchId && v.status === status)
  return visits.filter(v => v.status === status)
}

export function addObat(data) {
  obatDefault.push({ id: uid(), ...data, branchId: currentBranchId })
}

export function updateObatData(obatId, data) {
  const idx = obatDefault.findIndex(o => o.id === obatId)
  if (idx >= 0) Object.assign(obatDefault[idx], data)
}

export function addDoctor(data) {
  doctors.push({ id: uid(), ...data })
}

export function updateDoctorData(dokterId, data) {
  const idx = doctors.findIndex(d => d.id === dokterId)
  if (idx >= 0) Object.assign(doctors[idx], data)
}

export function getDashboardStats(branchId) {
  const today = todayDate()
  const todayVisits = visits.filter(v => v.branchId === branchId && v.tanggal === today)
  const revenue = visitHistory.filter(h => h.branchId === branchId && h.tagihan?.tglBayar === today)
    .reduce((s, h) => s + (h.tagihan?.totalBayar || 0), 0)
  return {
    totalKunjungan: todayVisits.length,
    pending: todayVisits.filter(v => v.status === 'Menunggu').length,
    criticalObat: obatDefault.filter(o => o.stok <= o.stokMinimum).length,
    revenue, todayVisits,
  }
}

export function getMostSoldDrugs(limit = 10) {
  return obatDefault.map(o => ({ obat: o, totalTerjual: 0, revenue: 0 })).slice(0, limit)
}

// ==================== DEPO OBAT ====================
export function getDepoObat() { return depoObat }

export function addDepoObat(data) {
  depoObat.push({ id: uid(), ...data })
}

export function updateDepoObat(id, data) {
  const idx = depoObat.findIndex(d => d.id === id)
  if (idx >= 0) Object.assign(depoObat[idx], data)
}

// ==================== TINDAKAN ====================
export function getTindakanMedis() { return tindakanMedis }

export function addTindakanMedis(data) {
  tindakanMedis.push({ id: uid(), ...data })
}

export function updateTindakanMedis(id, data) {
  const idx = tindakanMedis.findIndex(t => t.id === id)
  if (idx >= 0) Object.assign(tindakanMedis[idx], data)
}

// ==================== POLI ====================

export function addPoli(data) {
  polis.push({ id: uid(), ...data })
}

export function updatePoli(id, data) {
  const idx = polis.findIndex(p => p.id === id)
  if (idx >= 0) Object.assign(polis[idx], data)
}

export function addRuangan(poliId, namaRuangan) {
  const poli = polis.find(p => p.id === poliId)
  if (poli && !poli.ruangan) poli.ruangan = []
  if (poli) poli.ruangan.push(namaRuangan)
}
