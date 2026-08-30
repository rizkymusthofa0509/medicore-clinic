// Komponen UI bersama — design system industrial/utilitarian
// Bukan template SaaS. Terasa seperti aplikasi engineering/teknik lapangan.
import { useEffect, useState, useRef, Fragment } from 'react'

// ==================== PAGE HEADER ====================
export function PageHeader({ title, desc, actions, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 ${className}`}>
      <div className="min-w-0">
        <h1 className="font-display text-heading-lg text-[var(--text-primary)] truncate">{title}</h1>
        {desc && <p className="mt-1.5 text-body-sm text-[var(--text-secondary)] truncate">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">{actions}</div>}
    </div>
  )
}

// ==================== CARD ====================
export function Card({ children, className = '', hover = false, interactive = false, active = false, padded = false }) {
  const base = 'card'
  const hoverClass = interactive ? 'card-interactive' : (hover ? 'card-interactive' : '')
  const activeClass = active ? 'card-active' : ''
  const pad = padded ? 'p-5' : ''
  return <div className={`${base} ${hoverClass} ${activeClass} ${pad} ${className}`}>{children}</div>
}

export function CardHeader({ title, desc, actions, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 px-5 py-4 border-b border-[var(--border-primary)] ${className}`}>
      <div className="min-w-0">
        <h3 className="font-display text-heading-md text-[var(--text-primary)] truncate">{title}</h3>
        {desc && <p className="mt-1 text-body-sm text-[var(--text-secondary)] truncate">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">{actions}</div>}
    </div>
  )
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }) {
  return <div className={`flex flex-wrap items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border-primary)] ${className}`}>{children}</div>
}

// ==================== BUTTONS ====================
const btnBase = 'btn focus-visible:outline-none'

export function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, title, className = '', size = 'md', icon, iconPosition = 'left', ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success',
    accent: 'btn-accent',
    outline: 'btn-outline',
  }
  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
    icon: 'btn-icon',
    'icon-sm': 'btn-icon-sm',
  }
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`${btnBase} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
      {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
    </button>
  )
}

// ==================== FORM CONTROLS ====================
const inputBase = 'input'

function fieldKeys({ onKeyDown, onKeyUp, ...rest } = {}) {
  return {
    ...rest,
    onKeyDown: (e) => {
      e.stopPropagation()
      onKeyDown?.(e)
    },
    onKeyUp: (e) => {
      e.stopPropagation()
      onKeyUp?.(e)
    },
  }
}

export function Input({ label, id, type = 'text', value, onChange, placeholder, required, min, max, step, error, className = '', ...props }) {
  const err = Boolean(error)
  const extra = fieldKeys(props)
  return (
    <div className="w-full min-w-0">
      {label && <label htmlFor={id} className="label">{label}{required && <span className="text-[var(--status-danger)] ml-0.5">*</span>}</label>}
      <input
        id={id}
        name={id}
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        className={`${inputBase} ${err ? 'input-error' : ''} ${className}`}
        aria-invalid={err}
        aria-describedby={err ? `${id}-error` : undefined}
        {...extra}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {err && <p id={`${id}-error`} className="mt-1.5 text-caption text-[var(--status-danger)]" role="alert">{error}</p>}
    </div>
  )
}

export function Select({ label, id, value, onChange, options, required, placeholder = 'Pilih', error, className = '', ...props }) {
  const err = Boolean(error)
  const extra = fieldKeys(props)
  return (
    <div className="w-full min-w-0">
      {label && <label htmlFor={id} className="label">{label}{required && <span className="text-[var(--status-danger)] ml-0.5">*</span>}</label>}
      <select
        id={id}
        name={id}
        value={value ?? ''}
        className={`${inputBase} select ${err ? 'input-error' : ''} ${className}`}
        aria-invalid={err}
        aria-describedby={err ? `${id}-error` : undefined}
        {...extra}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {!required && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {err && <p id={`${id}-error`} className="mt-1.5 text-caption text-[var(--status-danger)]" role="alert">{error}</p>}
    </div>
  )
}

export function Textarea({ label, id, value, onChange, rows = 3, required, placeholder, error, className = '', ...props }) {
  const err = Boolean(error)
  const extra = fieldKeys(props)
  return (
    <div className="w-full min-w-0">
      {label && <label htmlFor={id} className="label">{label}{required && <span className="text-[var(--status-danger)] ml-0.5">*</span>}</label>}
      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        className={`${inputBase} textarea ${err ? 'input-error' : ''} ${className}`}
        aria-invalid={err}
        aria-describedby={err ? `${id}-error` : undefined}
        {...extra}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {err && <p id={`${id}-error`} className="mt-1.5 text-caption text-[var(--status-danger)]" role="alert">{error}</p>}
    </div>
  )
}

export function Checkbox({ label, id, checked, onChange, required, className = '' }) {
  return (
    <label className="inline-flex items-start gap-2.5 cursor-pointer" htmlFor={id}>
      <input
        type="checkbox" id={id} checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        required={required}
        className="mt-0.5 h-4 w-4 rounded-sm border-[var(--border-secondary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] focus:ring-offset-1 focus:ring-offset-[var(--bg-primary)] transition-colors hover:border-[var(--text-primary)] accent-[var(--text-primary)]"
      />
      <span className="text-body-sm text-[var(--text-primary)]">{label}</span>
    </label>
  )
}

export function RadioGroup({ label, id, name, value, onChange, options, required, className = '' }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}{required && <span className="text-[var(--status-danger)] ml-0.5">*</span>}</label>}
      <div className="flex flex-wrap gap-4" role="radiogroup" aria-label={label} aria-required={required}>
        {options.map((o) => (
          <label key={o.value} className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio" name={name} value={o.value} checked={value === o.value}
              onChange={(e) => onChange?.(e.target.value)}
              className="h-4 w-4 border-[var(--border-secondary)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] focus:ring-offset-1 focus:ring-offset-[var(--bg-primary)] accent-[var(--text-primary)]"
            />
            <span className="text-body-sm text-[var(--text-primary)]">{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// ==================== BADGE ====================
const badgeBase = 'badge'

export function Badge({ tone = 'neutral', children, className = '', dot = false, mono = false }) {
  const tones = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    neutral: 'badge-neutral',
    accent: 'badge-accent',
    slate: 'badge-neutral',
    solid: 'badge-solid',
    red: 'badge-danger',
    green: 'badge-success',
    amber: 'badge-warning',
    blue: 'badge-info',
    violet: 'badge-accent',
  }
  return (
    <span className={`${badgeBase} ${tones[tone] || tones.neutral} ${mono ? 'badge-mono' : ''} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  )
}

const SPB_TONE = {
  DRAFT: 'neutral', 'MENUNGGU APPROVAL': 'warning', APPROVED: 'info',
  'BARANG DITERBITKAN': 'success', SELESAI: 'success', DITOLAK: 'danger', DIBATALKAN: 'neutral',
}
export { TabelMaster } from './TabelMaster.jsx'
export function SpbBadge({ status, className = '' }) {
  return <Badge tone={SPB_TONE[status] || 'neutral'} className={className} mono>{status}</Badge>
}

// ==================== MODAL ====================
export function Modal({ open, onClose, title, children, wide = false, className = '' }) {
  if (!open) return null
  return (
    <Fragment>
      <div
        className="modal-overlay"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}
        role="dialog" aria-modal="true" aria-labelledby="modal-title"
      >
        <div
          className={`modal-content ${wide ? 'max-w-3xl' : 'max-w-lg'} ${className}`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-5 py-3.5">
            <h3 id="modal-title" className="font-display text-heading-md text-[var(--text-primary)] pr-3">{title}</h3>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-icon-sm" title="Tutup" aria-label="Tutup dialog">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-5 overflow-y-auto max-h-[calc(88vh_-_56px)]">{children}</div>
        </div>
      </div>
    </Fragment>
  )
}

export function ConfirmDialog({ open, title = 'Konfirmasi', message, confirmLabel = 'Ya, lanjutkan', onConfirm, onCancel, danger, variant = 'default', className = '' }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} className={className}>
      <p className="text-body-sm text-[var(--text-secondary)] leading-relaxed">{message}</p>
      <CardFooter>
        <Btn variant="secondary" onClick={onCancel}>Batal</Btn>
        <Btn variant={danger ? 'danger' : variant === 'success' ? 'success' : 'primary'} onClick={onConfirm}>{confirmLabel}</Btn>
      </CardFooter>
    </Modal>
  )
}

// ==================== COLUMN FILTER (Excel-style checklist) ====================
function getCellDisplayValue(column, row) {
  if (typeof column.raw === 'function') return column.raw(row)
  const v = row[column.key]
  if (v == null) return ''
  if (typeof v === 'object') {
    return v.name || v.code || v.label || v.username || ''
  }
  return v
}

function ColumnFilter({ column, rows, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  // Kumpulkan nilai unik dari baris (pakai display value)
  const counts = new Map()
  for (const r of rows) {
    const v = getCellDisplayValue(column, r)
    const key = v == null || v === '' ? '∅' : String(v)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  const all = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const filtered = query
    ? all.filter(([k]) => k.toLowerCase().includes(query.toLowerCase()))
    : all
  const active = selected.length > 0
  const activeCount = selected.length

  const toggle = (val) => {
    if (val === '__BLANK__') {
      if (selected.includes('__BLANK__')) onChange(selected.filter((v) => v !== '__BLANK__'))
      else onChange([...selected, '__BLANK__'])
    } else {
      if (selected.includes(val)) onChange(selected.filter((v) => v !== val))
      else onChange([...selected, val])
    }
  }

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        title={active ? `Filter aktif (${activeCount})` : 'Filter'}
        aria-label={`Filter ${column.label}`}
        className={`inline-flex items-center justify-center h-5 w-5 rounded-sm transition-colors ${
          active
            ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
            : 'text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-tertiary)]'
        } ${open ? 'opacity-100' : ''}`}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M6 12h12M10 18h4" />
        </svg>
        {active && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-[var(--accent-primary)] text-[var(--text-inverse)] text-[9px] font-bold font-mono leading-[14px] text-center">
            {activeCount}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-30 w-64 max-h-80 flex flex-col rounded-md border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-[var(--border-primary)] p-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Cari nilai…"
              className="input text-body-sm"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-caption text-[var(--text-tertiary)]">Tidak ada nilai.</div>
            )}
            {filtered.map(([val, count]) => {
              const isBlank = val === '∅'
              const checked = isBlank ? selected.includes('__BLANK__') : selected.includes(val)
              return (
                <label key={val} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--bg-tertiary)] cursor-pointer text-body-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(isBlank ? '__BLANK__' : val)}
                    className="h-3.5 w-3.5 rounded-sm border-[var(--border-secondary)] accent-[var(--text-primary)]"
                  />
                  <span className="flex-1 truncate text-[var(--text-primary)]">
                    {isBlank ? <span className="italic text-[var(--text-tertiary)]">(kosong)</span> : val}
                  </span>
                  <span className="text-caption font-mono text-[var(--text-tertiary)]">{count}</span>
                </label>
              )
            })}
          </div>
          <div className="border-t border-[var(--border-primary)] p-2 flex justify-between">
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={selected.length === 0}
              className="text-caption font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Bersihkan
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-caption font-medium text-[var(--accent-primary)] hover:underline"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </span>
  )
}

// ==================== DATA TABLE ====================
function cellSearchText(column, row) {
  if (column.searchable === false) return ''
  if (typeof column.raw === 'function') return String(column.raw(row) ?? '')
  const v = row[column.key]
  if (v == null) return ''
  if (typeof v === 'object') {
    return [v.name, v.code, v.label, v.username].filter(Boolean).join(' ')
  }
  return String(v)
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 0] // 0 = semua

export function DataTable({
  columns, rows,
  searchable = true,
  filterable = true,
  emptyText = 'Belum ada data',
  toolbar,
  rowKey = (r) => r.id,
  striped = false,
  dense = false,
  defaultPageSize = 10,
}) {
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState({}) // { [columnKey]: string[] }
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [page, setPage] = useState(1)

  const setColumnFilter = (key, values) => {
    setFilters((f) => {
      const next = { ...f }
      if (!values || values.length === 0) delete next[key]
      else next[key] = values
      return next
    })
    setPage(1)
  }

  // Apply search + column filter
  const needle = q.trim().toLowerCase()
  const filtered = rows.filter((r) => {
    if (needle) {
      const haystack = columns.map((c) => cellSearchText(c, r)).join(' ').toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    for (const [key, vals] of Object.entries(filters)) {
      if (!vals.length) continue
      const col = columns.find((c) => c.key === key)
      if (!col) continue
      const v = getCellDisplayValue(col, r)
      const str = v == null || v === '' ? '∅' : String(v)
      const isBlank = str === '∅'
      const matchBlank = isBlank && vals.includes('__BLANK__')
      const matchVal = !isBlank && vals.includes(str)
      if (!matchBlank && !matchVal) return false
    }
    return true
  })

  // Pagination
  const totalRows = filtered.length
  const effectivePageSize = pageSize === 0 ? totalRows || 1 : pageSize
  const totalPages = Math.max(1, Math.ceil(totalRows / effectivePageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * effectivePageSize
  const paged = pageSize === 0 ? filtered : filtered.slice(start, start + effectivePageSize)
  const showRange = pageSize === 0
    ? `1–${totalRows}`
    : totalRows === 0
      ? '0'
      : `${start + 1}–${Math.min(start + effectivePageSize, totalRows)}`

  const activeFilterCount = Object.values(filters).filter((v) => v.length > 0).length

  return (
    <Card className="overflow-hidden">
      {(searchable || toolbar || filterable) && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 border-b border-[var(--border-primary)] p-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {searchable && (
              <form className="relative w-full sm:w-72 min-w-0" onSubmit={(e) => e.preventDefault()} role="search">
                <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input
                  type="search"
                  name="table-search"
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1) }}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  placeholder="Cari di tabel…"
                  autoComplete="off"
                  spellCheck={false}
                  className="input pl-9"
                  aria-label="Cari tabel"
                />
              </form>
            )}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => { setFilters({}); setPage(1) }}
                className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md border border-[var(--border-primary)] bg-[var(--bg-primary)] text-caption font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)]"
                title="Bersihkan semua filter"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                {activeFilterCount} filter
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {toolbar}
            <label className="inline-flex items-center gap-1.5 text-caption text-[var(--text-tertiary)]">
              <span className="hidden sm:inline">Tampilkan</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                onKeyDown={(e) => e.stopPropagation()}
                className="input h-9 py-0 pl-2 pr-7 text-caption font-medium"
                aria-label="Jumlah data per halaman"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n === 0 ? 'Semua' : `${n} / hal`}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`group ${c.thClass || ''} ${c.align ? `text-${c.align}` : ''}`}>
                  <span className={`inline-flex items-center gap-1.5 ${c.align === 'right' ? 'flex-row-reverse' : ''}`}>
                    <span>{c.label}</span>
                    {filterable && c.filterable !== false && c.key !== '_actions' && (
                      <ColumnFilter
                        column={c}
                        rows={rows}
                        selected={filters[c.key] || []}
                        onChange={(vals) => setColumnFilter(c.key, vals)}
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-body-sm text-[var(--text-tertiary)]">{emptyText}</td></tr>
            )}
            {paged.map((r, i) => (
              <tr key={rowKey(r, i)} className={`${striped && i % 2 === 1 ? 'bg-[var(--bg-secondary)]/40' : ''}`}>
                {columns.map((c) => (
                  <td key={c.key} className={`${c.tdClass || ''} ${c.align ? `text-${c.align}` : ''} ${c.numeric ? 'table-numeric' : ''} ${c.mono ? 'table-mono' : ''}`}>
                    {c.render ? c.render(r, i) : (r[c.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(searchable || activeFilterCount > 0) && totalRows > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-[var(--border-primary)] px-4 py-2.5 text-caption text-[var(--text-tertiary)]">
          <div>
            Menampilkan <span className="font-mono font-medium text-[var(--text-secondary)]">{showRange}</span> dari{' '}
            <span className="font-mono font-medium text-[var(--text-secondary)]">{totalRows}</span> data
            {totalRows !== rows.length && (
              <span className="text-[var(--text-tertiary)]"> (dari {rows.length} total)</span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-ghost btn-icon-sm"
                title="Halaman sebelumnya"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <span className="font-mono px-1.5 text-[var(--text-secondary)]">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-ghost btn-icon-sm"
                title="Halaman berikutnya"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ==================== TOAST ====================
let toastFn = null
export function registerToast(fn) { toastFn = fn }
export function toast(message, tone = 'success', duration = 3800) {
  toastFn?.(message, tone, duration)
}

export function ToastHost() {
  const [items, setItems] = useState([])
  useEffect(() => {
    registerToast((message, tone, duration) => {
      const id = Date.now() + Math.random()
      setItems((prev) => [...prev, { id, message, tone }])
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), duration)
    })
    return () => { registerToast(null) }
  }, [])

  const toneStyles = {
    success: 'badge-solid',
    error: 'badge-solid-danger',
    info: 'badge-solid',
    warning: 'badge-solid',
  }
  const toneBg = {
    success: 'bg-[var(--status-success)] text-white',
    error: 'bg-[var(--status-danger)] text-white',
    info: 'bg-[var(--text-primary)] text-[var(--text-inverse)]',
    warning: 'bg-[var(--status-warning)] text-white',
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end">
      {items.map((t) => (
        <div key={t.id} className={`pointer-events-auto toast-content text-body-sm ${toneBg[t.tone] || toneBg.success}`}>
          {t.tone === 'error' ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
          ) : t.tone === 'warning' ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4m0 4h.01"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          )}
          <span className="flex-1 font-medium">{t.message}</span>
        </div>
      ))}
    </div>
  )
}

// ==================== KPI CARD ====================
// "Engine gauge" style — bukan icon-box-kanan pattern
export function KpiCard({ title, value, change, changeLabel, icon, trend = 'neutral', className = '', accent = false, sub, mono = true }) {
  const trendColors = {
    up: 'text-[var(--status-success)]',
    down: 'text-[var(--status-danger)]',
    neutral: 'text-[var(--text-tertiary)]',
  }
  const trendIcons = {
    up: <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 14l5-5 5 5" /></svg>,
    down: <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 10l5 5 5-5" /></svg>,
    neutral: <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /></svg>,
  }
  return (
    <div className={`kpi-card ${className}`}>
      {accent && <div className="kpi-card-flag" />}
      <p className="text-caption font-medium text-[var(--text-tertiary)]">{title}</p>
      <p className={`mt-1.5 text-3xl font-semibold tracking-tight text-[var(--text-primary)] ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</p>
      {(change != null || sub) && (
        <div className="mt-2 flex items-center gap-1.5">
          {change != null && (
            <>
              <span className={`inline-flex items-center gap-0.5 ${trendColors[trend]}`}>{trendIcons[trend]}</span>
              <span className={`text-caption font-medium ${trendColors[trend]}`}>
                {change > 0 ? '+' : ''}{change}{changeLabel ? ` ${changeLabel}` : ''}
              </span>
            </>
          )}
          {sub && <span className="text-caption text-[var(--text-tertiary)]">{sub}</span>}
        </div>
      )}
    </div>
  )
}

// ==================== EMPTY STATE ====================
export function EmptyState({ title = 'Belum ada data', desc, action, icon, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      {icon && <div className="mb-4 grid h-12 w-12 place-items-center rounded-md border border-[var(--border-primary)] text-[var(--text-tertiary)]">{icon}</div>}
      <h3 className="font-display text-heading-md text-[var(--text-primary)]">{title}</h3>
      {desc && <p className="mt-2 text-body-sm text-[var(--text-secondary)] max-w-sm">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ==================== AVATAR ====================
export function Avatar({ src, name, size = 'md', className = '' }) {
  const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-xs', lg: 'h-11 w-11 text-sm', xl: 'h-14 w-14 text-base' }
  const initials = name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <div className={`relative inline-flex shrink-0 ${sizes[size]} ${className}`}>
      {src ? (
        <img src={src} alt="" className="h-full w-full rounded-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] font-mono font-semibold text-[var(--text-primary)]">{initials}</div>
      )}
    </div>
  )
}

// ==================== DIVIDER ====================
export function Divider({ className = '', vertical = false }) {
  return <hr className={`border-[var(--border-primary)] ${vertical ? 'h-12 w-px my-0' : 'my-4'} ${className}`} role="separator" />
}

// ==================== LOADING ====================
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-5 w-5 border-2', lg: 'h-7 w-7 border-[2.5px]' }
  return (
    <svg className={`animate-spin text-[var(--text-primary)] ${sizes[size]} ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="status" aria-label="Memuat">
      <circle className="text-[var(--border-primary)]" cx="12" cy="12" r="10" strokeWidth="2" />
      <path className="stroke-current" d="M12 2a10 10 0 0 1 10 10" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function Skeleton({ className = '', variant = 'text', width, height, count = 1 }) {
  const base = 'animate-pulse bg-[var(--bg-tertiary)] rounded'
  if (variant === 'circular') {
    return <div className={`${base} rounded-full ${className}`} style={{ width: height || 40, height: height || 40 }} />
  }
  if (variant === 'rect') {
    return <div className={`${base} ${className}`} style={{ width: width || '100%', height: height || 16 }} />
  }
  return (
    <div className={`space-y-2.5 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`${base} h-3.5 ${i === count - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  )
}

// ==================== TOOLTIP ====================
export function Tooltip({ content, children, position = 'top', delay = 200 }) {
  const [visible, setVisible] = useState(false)
  let timer = null
  const show = () => { timer = setTimeout(() => setVisible(true), delay) }
  const hide = () => { clearTimeout(timer); setVisible(false) }
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }
  return (
    <span className="relative inline-block" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {visible && (
        <div className={`absolute ${positions[position]} z-50 flex items-center gap-1.5 px-2 py-1 rounded-sm text-caption font-medium text-[var(--text-inverse)] bg-[var(--text-primary)] whitespace-nowrap animate-in fade-in-150`}>
          {content}
        </div>
      )}
    </span>
  )
}
