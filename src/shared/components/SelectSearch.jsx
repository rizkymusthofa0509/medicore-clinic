// ============================================================
// shared/components/SelectSearch.jsx
// Dropdown search berbasis ul/li (bukan <select>) untuk daftar
// options statis / hasil fetch. Mendukung pencarian, keyboard,
// dan tombol hapus (clear). Konsisten dengan MasterSearch.
// ============================================================

import { useEffect, useRef, useState } from 'react'

export default function SelectSearch({
  label = '',
  value = '',            // value terpilih (string) — cocok dengan value opsi
  onChange,              // (value: string) => void
  options = [],          // [{ value, label, sub? }]
  placeholder = 'Pilih…',
  required = false,
  disabled = false,
  error,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef(null)
  const inputRef = useRef(null)

  const selected = options.find((o) => String(o.value) === String(value))

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

  // Filter opsi berdasarkan query
  const filtered = query.trim()
    ? options.filter((o) =>
        (o.label || '').toLowerCase().includes(query.trim().toLowerCase()) ||
        (o.sub || '').toLowerCase().includes(query.trim().toLowerCase())
      )
    : options

  const handleSelect = (opt) => {
    onChange?.(String(opt.value))
    setOpen(false)
    setQuery('')
  }

  const handleClear = () => {
    onChange?.('')
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className={`w-full min-w-0 ${className}`} ref={wrapRef}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-[var(--status-danger)] ml-0.5">*</span>}
        </label>
      )}

      {selected ? (
        <div className={`input flex items-center gap-2 py-1.5 ${error ? 'input-error' : ''}`}>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-body-sm truncate text-[var(--text-primary)]">{selected.label}</div>
            {selected.sub && <div className="text-tiny text-[var(--text-muted)] truncate">{selected.sub}</div>}
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              title="Hapus pilihan"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
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
            placeholder={selected ? selected.label : placeholder}
            className={`input pl-10 ${error ? 'input-error' : ''}`}
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
          />
          {open && (
            <div className="absolute z-[99999] left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-md border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg">
              {filtered.length === 0 ? (
                <div className="px-3 py-2.5 text-caption text-[var(--text-tertiary)]">
                  Tidak ada data ditemukan.
                </div>
              ) : (
                <ul className="py-1">
                  {filtered.map((opt) => (
                    <li
                      key={String(opt.value)}
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(opt) }}
                      className="px-3 py-2 cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
                    >
                      <div className="font-medium text-body-sm truncate text-[var(--text-primary)]">{opt.label}</div>
                      {opt.sub && <div className="text-tiny text-[var(--text-muted)] truncate">{opt.sub}</div>}
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
