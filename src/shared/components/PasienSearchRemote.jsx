// ============================================================
// shared/components/PasienSearchRemote.jsx
// Remote-search pasien dengan konsep ul/li + debounce.
// Scope otomatis mengikuti branchId yang aktif.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { fetchPasien } from '../../features/front-office/service/pasienService.js'

function initialsOf(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function PasienSearchRemote({
  branchId,
  value,
  onSelect,
  onClear,
  placeholder = 'Cari nama / No RM / NIK pasien…',
  error,
  label = 'Cari Pasien',
  required = false,
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // Sync query dari value (selected) → tampilkan chip
  useEffect(() => {
    if (value && value.nama) {
      setQuery('')
    } else if (!value) {
      setQuery('')
    }
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    const onMouse = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  // Debounced remote search
  useEffect(() => {
    if (!open) return
    if (!branchId) {
      setResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await fetchPasien(branchId, query.trim())
        setResults(data.slice(0, 10))
        setActiveIdx(-1)
      } catch (err) {
        console.error('[PasienSearchRemote] gagal mencari pasien:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, branchId, open])

  const handleSelect = (pasien) => {
    onSelect?.(pasien)
    setOpen(false)
    setQuery('')
  }

  const handleClear = () => {
    onClear?.()
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && results[activeIdx]) handleSelect(results[activeIdx])
    }
  }

  const hasValue = Boolean(value && value.nama)

  return (
    <div className="w-full min-w-0" ref={wrapRef}>
      <label className="label">
        {label}
        {required && <span className="text-[var(--status-danger)] ml-0.5">*</span>}
      </label>

      {hasValue ? (
        <div className={`input flex items-center gap-2 py-1.5 ${error ? 'input-error' : ''}`}>
          <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] font-bold text-xs">
            {initialsOf(value.nama)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-body-sm truncate text-[var(--text-primary)]">
              {value.gelar ? `${value.gelar} ` : ''}{value.nama}
            </div>
            <div className="text-tiny text-[var(--text-muted)] truncate">
              {value.noRm || '-'} • {value.nik || '-'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            title="Ganti pasien"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`input pl-10 ${error ? 'input-error' : ''}`}
            autoComplete="off"
            spellCheck={false}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-4 w-4 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="m22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          )}

          {open && (
            <div className="absolute z-[99999] left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-md border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg">
              {!branchId ? (
                <div className="px-3 py-2.5 text-caption text-[var(--text-tertiary)]">
                  Pilih branch aktif terlebih dahulu.
                </div>
              ) : query.trim().length < 2 ? (
                <div className="px-3 py-2.5 text-caption text-[var(--text-tertiary)]">
                  Ketik minimal 2 karakter untuk mencari.
                </div>
              ) : loading ? (
                <div className="px-3 py-2.5 text-caption text-[var(--text-tertiary)]">Mencari…</div>
              ) : results.length === 0 ? (
                <div className="px-3 py-2.5 text-caption text-[var(--text-tertiary)]">
                  Tidak ada pasien ditemukan untuk branch ini.
                </div>
              ) : (
                <ul className="py-1">
                  {results.map((p, i) => (
                    <li
                      key={p.id}
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(p) }}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                        activeIdx === i ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand-primary)] font-bold text-xs">
                        {initialsOf(p.nama)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-body-sm truncate text-[var(--text-primary)]">
                          {p.gelar ? `${p.gelar} ` : ''}{p.nama}
                        </div>
                        <div className="text-tiny text-[var(--text-muted)] truncate">
                          <span className="font-mono">{p.noRm || '-'}</span>
                          {p.nik ? ` • NIK ${p.nik}` : ''}
                          {p.jenisKelamin ? ` • ${p.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}` : ''}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1.5 text-caption text-[var(--status-danger)]" role="alert">{error}</p>}
    </div>
  )
}