// ============================================================
// shared/branches.js — Util untuk ambil data branch dari BE.
// ============================================================

import api from './api.js'

/**
 * Ambil daftar branch dari BE.
 * Cached di localStorage agar tidak request berulang-ulang.
 */
export async function fetchBranches({ force = false } = {}) {
  if (!force) {
    try {
      const cached = sessionStorage.getItem('medicore_branches_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Date.now() - parsed.ts < 5 * 60 * 1000) {
          return parsed.data
        }
      }
    } catch {}
  }
  const res = await api.get('/api/settings/branches')
  const data = res.data?.data ?? []
  try {
    sessionStorage.setItem('medicore_branches_cache', JSON.stringify({ ts: Date.now(), data }))
  } catch {}
  return data
}
