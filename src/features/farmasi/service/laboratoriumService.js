// ============================================================
// features/farmasi/service/laboratoriumService.js
// Laboratorium — permintaan & hasil, di-scope branch aktif.
// ============================================================

import api from '../../../shared/api.js'

export async function fetchLabPermintaan(branchId, params = {}) {
  if (!branchId) return []
  const res = await api.get('/api/laboratorium', { params: { branch_id: branchId, ...params } })
  return res.data?.data ?? []
}

export async function createLabPermintaan(branchId, payload) {
  const res = await api.post('/api/laboratorium', { branch_id: branchId, ...payload })
  return res.data
}

export async function updateLabPermintaan(branchId, id, payload) {
  const res = await api.put(`/api/laboratorium/${id}`, { branch_id: branchId, ...payload })
  return res.data
}
