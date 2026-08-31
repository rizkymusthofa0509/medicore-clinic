// ============================================================
// shared/store/clinic.js — Store lokal untuk data cabang & dummy
// Data master lainnya akan diambil dari API
// ============================================================

const BRANCH_KEY = 'medicore_branch'

// Default branches
const DEFAULT_BRANCHES = [
  { id: '1', nama: 'Klinik Medicore Pusat', code: 'BR-001' },
  { id: '2', nama: 'Klinik Medicore Kelapa Gading', code: 'BR-002' },
]

export function getBranches() {
  return DEFAULT_BRANCHES
}

export function getBranchById(id) {
  return DEFAULT_BRANCHES.find(b => b.id === id)
}

export function getCurrentBranchId() {
  return localStorage.getItem(BRANCH_KEY) || '1'
}

export function setCurrentBranch(id) {
  localStorage.setItem(BRANCH_KEY, id)
}

export function getDashboardStats(branchId) {
  return {
    totalKunjungan: 156,
    pending: 8,
    criticalObat: 3,
    revenue: 4500000,
    todayVisits: getVisits(branchId),
  }
}

export function getVisits(branchId) {
  return [
    { id: '1', pasien: 'Ahmad S.', poli: 'Umum', dokter: 'Dr. Andi', waktu: '08:30', status: 'Selesai' },
    { id: '2', pasien: 'Siti R.', poli: 'Gigi', dokter: 'Dr. Budi', waktu: '09:00', status: 'Diperiksa' },
    { id: '3', pasien: 'Budi P.', poli: 'Umum', dokter: 'Dr. Andi', waktu: '09:15', status: 'Menunggu' },
    { id: '4', pasien: 'Dewi L.', poli: 'KIA', dokter: 'Dr. Siti', waktu: '09:30', status: 'Apotek' },
    { id: '5', pasien: 'Rudi H.', poli: 'THT', dokter: 'Dr. Andi', waktu: '10:00', status: 'Kasir' },
  ]
}

export function getPoli(branchId) {
  return [
    { id: '1', nama: 'Poli Umum', kode: 'PL-UM', jenisPoli: 'Umum', unitStok: 'Depo Utama', status: 'aktif', antrianFTKP: true, ruangan: ['R-UM-01', 'R-UM-02'] },
    { id: '2', nama: 'Poli Gigi', kode: 'PL-GI', jenisPoli: 'Gigi', unitStok: 'Depo Utama', status: 'aktif', antrianFTKP: true, ruangan: ['R-GI-01'] },
    { id: '3', nama: 'Poli KIA', kode: 'PL-KI', jenisPoli: 'Kebidanan', unitStok: 'Depo Utama', status: 'aktif', antrianFTKP: true, ruangan: [] },
    { id: '4', nama: 'Poli THT', kode: 'PL-TH', jenisPoli: 'THT', unitStok: 'Depo Utama', status: 'aktif', antrianFTKP: false, ruangan: [] },
    { id: '5', nama: 'Poli Mata', kode: 'PL-MT', jenisPoli: 'Mata', unitStok: 'Depo Utama', status: 'aktif', antrianFTKP: false, ruangan: [] },
  ]
}

export function addPoli(data) {
  return { ...data, id: Date.now().toString() }
}

export function addRuangan(poliId, ruangan) {
  return true
}

export function getDoctors(branchId) {
  return [
    { id: '1', nama: 'Dr. Andi Sp.PD' },
    { id: '2', nama: 'Dr. Budi Sp.KG' },
    { id: '3', nama: 'Dr. Siti Sp.A' },
  ]
}

export function getPatients(branchId) {
  return [
    { id: '1', nama: 'Ahmad S.', noRM: '000001', nik: '3175010101900001', tglLahir: '1990-01-01', alamat: 'Jakarta' },
    { id: '2', nama: 'Siti R.', noRM: '000002', nik: '3175014101920002', tglLahir: '1992-01-01', alamat: 'Bekasi' },
    { id: '3', nama: 'Budi P.', noRM: '000003', nik: '3175015101950003', tglLahir: '1995-01-01', alamat: 'Depok' },
  ]
}

export function searchPatient(query) {
  if (!query) return []
  const q = query.toLowerCase()
  const patients = getPatients('1')
  return patients.filter(p =>
    p.nama.toLowerCase().includes(q) ||
    p.noRM.includes(q) ||
    p.nik.includes(q)
  )
}

export function registerNewPatient(data) {
  return { ...data, id: Date.now().toString() }
}

export function getVisitHistoryByBranch(branchId) {
  return getVisits(branchId)
}

export function hitungUmur(tglLahir) {
  const today = new Date()
  const birth = new Date(tglLahir)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate < birth.getDate())) age--
  return age
}

export function createKunjungan(data) {
  return { ...data, id: Date.now().toString() }
}

export function getDepoObat() {
  return [
    { id: '1', namaDepo: 'Depo Utama', lokasi: 'Lantai 1', keterangan: 'Stok obat utama' },
    { id: '2', namaDepo: 'Depo UGD', lokasi: 'Lantai 1', keterangan: 'Obat darurat' },
    { id: '3', namaDepo: 'Apotek', lokasi: 'Lantai 1', keterangan: 'Penjualan obat' },
  ]
}

export function addDepoObat(data) {
  return { ...data, id: Date.now().toString() }
}

export function getTindakanMedis() {
  return [
    { id: '1', kodeICD9: '87.0', namaTindakan: 'CT Scan Kepala', kelompokTindakan: 'Radiologi', poliId: '5', jumlahBiaya: 1500000, jasaDokter: 0, persentaseDokter: 0, rupiahDokter: 0, jasaAsisten: 0, jasaKlinik: 0 },
    { id: '2', kodeICD9: '99.0', namaTindakan: 'Infus', kelompokTindakan: 'Tindakan Umum', poliId: '1', jumlahBiaya: 200000, jasaDokter: 0, persentaseDokter: 0, rupiahDokter: 0, jasaAsisten: 0, jasaKlinik: 0 },
    { id: '3', kodeICD9: '99.1', namaTindakan: 'Suntikan', kelompokTindakan: 'Tindakan Umum', poliId: '1', jumlahBiaya: 100000, jasaDokter: 0, persentaseDokter: 0, rupiahDokter: 0, jasaAsisten: 0, jasaKlinik: 0 },
  ]
}

export function addTindakanMedis(data) {
  return { ...data, id: Date.now().toString() }
}
