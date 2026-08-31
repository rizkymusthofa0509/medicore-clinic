const BRANCH_KEY = 'medicore_branch'

export function getCurrentBranchId() {
  return localStorage.getItem(BRANCH_KEY) || '1'
}

export function setCurrentBranch(id) {
  localStorage.setItem(BRANCH_KEY, String(id))
  console.log('[Store] setCurrentBranch:', id, 'dispatched branch:changed')
  window.dispatchEvent(new Event('branch:changed'))
}

export function getBranchById(id) {
  // Will be populated from API
  return { id, nama: 'Branch ' + id, code: 'BR-' + id }
}

export function setUserBranches(branches) {
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(branches))))
    localStorage.setItem('medicore_user_branches', encoded)
  } catch {}
}

// Dummy data functions
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
  ]
}

export function getPoli(branchId) {
  return [
    { id: '1', nama: 'Poli Umum', kode: 'PL-UM' },
    { id: '2', nama: 'Poli Gigi', kode: 'PL-GI' },
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
  ]
}

export function getPatients(branchId) {
  return [
    { id: '1', nama: 'Ahmad S.', noRM: '000001' },
    { id: '2', nama: 'Siti R.', noRM: '000002' },
  ]
}

export function searchPatient(query) {
  if (!query) return []
  const q = query.toLowerCase()
  return getPatients('1').filter(p => p.nama.toLowerCase().includes(q))
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
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function createKunjungan(data) {
  return { ...data, id: Date.now().toString() }
}

export function getDepoObat() {
  return [
    { id: '1', namaDepo: 'Depo Utama', lokasi: 'Lantai 1' },
  ]
}

export function addDepoObat(data) {
  return { ...data, id: Date.now().toString() }
}

export function getTindakanMedis() {
  return [
    { id: '1', kodeICD9: '87.0', namaTindakan: 'CT Scan', poliId: '1', jumlahBiaya: 1500000 },
  ]
}

export function addTindakanMedis(data) {
  return { ...data, id: Date.now().toString() }
}
