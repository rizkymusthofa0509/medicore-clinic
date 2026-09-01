// ============================================================
// shared/components/MasterSearch.jsx
// Remote search (ul/li) generik untuk master data: obat, tindakan,
// nakes, aturan pakai, dll. Menghindari <select> dengan ribuan opsi.
// ============================================================

import { useEffect, useRef, useState } from 'react'

export default function MasterSearch({
  branchId,              // branch aktif (wajib untuk scope data master)
  fetcher,               // (branchId, query, params) => Promise<Array>
  params = {},           // extra params untuk fetcher (mis. kategori, tipe)
  value = null,          // objek terpilih saat ini
  onSelect,              // (item) => void
  onClear,               // () => void
  placeholder = 'Ketik untuk mencari…',
  label = '',
  required = false,
  disabled = false,
  error,
  renderItem = (item) => ({ title: item.nama || item.aturan || '-', sub: null }),
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // Close dropdown on outside click / escape
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
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!branchId) {
      setResults([])
      setLoading(false)
      return
    }
    if (query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await fetcher(branchId, query.trim(), params)
        setResults((data || []).slice(0, 25))
        setActiveIdx(-1)
      } catch (err) {
        console.error('[MasterSearch] gagal mencari:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open, branchId])

  const handleSelect = (item) => {
    onSelect?.(item)
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

  const selected = value
  const selectedLabel = selected ? (renderItem(selected).title) : ''

  return (
    <div className="w-full min-w-0" ref={wrapRef}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-[var(--status-danger)] ml-0.5">*</span>}
        </label>
      )}

      {selected ? (
        <div className={`input flex items-center gap-2 py-1.5 ${error ? 'input-error' : ''}`}>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-body-sm truncate text-[var(--text-primary)]">{selectedLabel}</div>
            {renderItem(selected).sub && (
              <div className="text-tiny text-[var(--text-muted)] truncate">{renderItem(selected).sub}</div>
            )}
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              title="Ganti"
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
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`input pl-10 ${error ? 'input-error' : ''}`}
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
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
                  Tidak ada data ditemukan.
                </div>
              ) : (
                <ul className="py-1">
                  {results.map((item, i) => {
                    const r = renderItem(item)
                    return (
                      <li
                        key={item.id}
                        onMouseDown={(e) => { e.preventDefault(); handleSelect(item) }}
                        onMouseEnter={() => setActiveIdx(i)}
                        className={`px-3 py-2 cursor-pointer transition-colors ${
                          activeIdx === i ? 'bg-[var(--bg-hover)]' : 'hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        <div className="font-medium text-body-sm truncate text-[var(--text-primary)]">{r.title}</div>
                        {r.sub && <div className="text-tiny text-[var(--text-muted)] truncate">{r.sub}</div>}
                      </li>
                    )
                  })}
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
