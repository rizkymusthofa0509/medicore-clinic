// ============================================================
// features/master/service/unitLokasiService.js
// ============================================================

import api from '../../../shared/api.js'

export async function fetchUnitLokasi(branchId) {
  if (!branchId) return []
  const res = await api.get('/api/unit-lokasi', { params: { branch_id: branchId } })
  return res.data?.data ?? []
}

export async function createUnitLokasi(payload) {
  const res = await api.post('/api/unit-lokasi', payload)
  return res.data?.data
}

export async function updateUnitLokasi(id, payload) {
  const res = await api.put(`/api/unit-lokasi/${id}`, payload)
  return res.data?.data
}

export async function deleteUnitLokasi(id) {
  const res = await api.delete(`/api/unit-lokasi/${id}`)
  return res.data
}
