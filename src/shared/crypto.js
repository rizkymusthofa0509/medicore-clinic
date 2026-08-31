// ============================================================
// shared/crypto.js — Enkripsi & dekripsi sederhana untuk localStorage
// Pakai kombinasi ROT + Base64 + salt unik per-browser
// ============================================================

const SALT_PREFIX = 'mc_'
const SALT_KEY = 'medicore_salt'

// Generate/retrieve salt unik per browser (localStorage agar persist)
function getSalt() {
  let salt = localStorage.getItem(SALT_KEY)
  if (!salt) {
    salt = SALT_PREFIX + Math.random().toString(36).slice(2, 12) + Date.now().toString(36)
    localStorage.setItem(SALT_KEY, salt)
  }
  return salt
}

// Simple ROT-like cipher
function rotCipher(text, direction = 1) {
  const shift = 7
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0)
      if (code >= 32 && code <= 126) {
        const range = 95
        const shifted = ((code - 32 + direction * shift + range) % range) + 32
        return String.fromCharCode(shifted)
      }
      return char
    })
    .join('')
}

// Encode: cipher + base64 + salt
export function encrypt(data) {
  const json = JSON.stringify(data)
  const salted = `${getSalt()}:${json}`
  const ciphered = rotCipher(salted, 1)
  try {
    return btoa(ciphered)
  } catch {
    return null
  }
}

// Decode: salt check + base64 + decipher
export function decrypt(encoded) {
  if (!encoded) return null
  try {
    const ciphered = atob(encoded)
    const salted = rotCipher(ciphered, -1)
    const [salt, ...rest] = salted.split(':')
    if (salt !== getSalt()) return null
    return JSON.parse(rest.join(':'))
  } catch {
    return null
  }
}

// Hash sederhana untuk integrity check
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return hash.toString(36)
}

// Simpan data terenkripsi ke localStorage
export function secureStore(key, data) {
  const encrypted = encrypt(data)
  if (!encrypted) return false
  try {
    localStorage.setItem(key, encrypted)
    localStorage.setItem(`${key}_hash`, simpleHash(encrypted))
    return true
  } catch {
    return false
  }
}

// Ambil & dekripsi data dari localStorage
export function secureRetrieve(key) {
  const encrypted = localStorage.getItem(key)
  if (!encrypted) return null

  // Cek integrity
  const storedHash = localStorage.getItem(`${key}_hash`)
  if (storedHash && storedHash !== simpleHash(encrypted)) {
    localStorage.removeItem(key)
    localStorage.removeItem(`${key}_hash`)
    return null
  }

  // Coba decrypt dengan salt saat ini
  const decrypted = decrypt(encrypted)
  if (decrypted) return decrypted

  // Fallback: coba parse sebagai JSON plain (data lama)
  try {
    const parsed = JSON.parse(encrypted)
    secureStore(key, parsed)
    return parsed
  } catch {
    return null
  }
}

// Hapus data terenkripsi
export function secureRemove(key) {
  localStorage.removeItem(key)
  localStorage.removeItem(`${key}_hash`)
}
