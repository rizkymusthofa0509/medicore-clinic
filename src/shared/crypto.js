// ============================================================
// shared/crypto.js — Simple base64 encode/decode untuk localStorage
// ============================================================

// Store data as base64
export function secureStore(key, data) {
  try {
    const json = JSON.stringify(data)
    const encoded = btoa(unescape(encodeURIComponent(json)))
    localStorage.setItem(key, encoded)
    return true
  } catch {
    return false
  }
}

// Retrieve and decode data
export function secureRetrieve(key) {
  const encoded = localStorage.getItem(key)
  if (!encoded) return null

  // Try base64 decode
  try {
    const json = decodeURIComponent(escape(atob(encoded)))
    return JSON.parse(json)
  } catch {
    // Try plain JSON
    try {
      return JSON.parse(encoded)
    } catch {
      // Last resort: return as token string
      if (key === 'medicore_token') return { token: encoded }
      return null
    }
  }
}

// Remove data
export function secureRemove(key) {
  localStorage.removeItem(key)
}
