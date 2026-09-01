// ============================================================
// features/master/service/ruanganService.js
// ============================================================

import api from '../../../shared/api.js'

export async function fetchRuangan(branchId, poliId = null) {
  if (!branchId) return []
  const params = { branch_id: branchId }
  if (poliId) params.poli_id = poliId
  const res = await api.get('/api/ruangan', { params })
  return res.data?.data ?? []
}

export async function createRuangan(payload) {
  const res = await api.post('/api/ruangan', payload)
  return res.data?.data
}

export async function updateRuangan(id, payload) {
  const res = await api.put(`/api/ruangan/${id}`, payload)
  return res.data?.data
}

export async function deleteRuangan(id) {
  const res = await api.delete(`/api/ruangan/${id}`)
  return res.data
}
