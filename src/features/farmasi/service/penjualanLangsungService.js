// ============================================================
// features/farmasi/service/penjualanLangsungService.js
// Penjualan Obat Langsung (OTC) — di-scope branch aktif.
// ============================================================

import api from '../../../shared/api.js'

export async function fetchPenjualanLangsung(branchId, params = {}) {
  if (!branchId) return []
  const res = await api.get('/api/penjualan-langsung', { params: { branch_id: branchId, ...params } })
  return res.data?.data ?? []
}

export async function fetchNextNomorOtc(branchId) {
  if (!branchId) return null
  const res = await api.get('/api/penjualan-langsung/next-nomor', { params: { branch_id: branchId } })
  return res.data?.data?.no_transaksi ?? null
}

export async function createPenjualanLangsung(branchId, payload) {
  const res = await api.post('/api/penjualan-langsung', { branch_id: branchId, ...payload })
  return res.data
}
