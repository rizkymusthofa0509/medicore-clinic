// ============================================================
// features/master/service/poliService.js
// ============================================================

import api from '../../../shared/api.js'

export async function fetchPoli(branchId, extraParams = {}) {
  if (!branchId) return []
  const res = await api.get('/api/poli', { params: { branch_id: branchId, ...extraParams } })
  return res.data?.data ?? []
}

export async function createPoli(payload) {
  const res = await api.post('/api/poli', payload)
  return res.data?.data
}

export async function updatePoli(id, payload) {
  const res = await api.put(`/api/poli/${id}`, payload)
  return res.data?.data
}

export async function deletePoli(id) {
  const res = await api.delete(`/api/poli/${id}`)
  return res.data
}
