import { useState, useEffect, useMemo, useRef } from 'react'

// ==================== ACTION DROPDOWN (Vertical Dots) ====================
export function ActionDropdown({ actions, rowIndex }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
        title="Aksi"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-xl py-1.5 z-[9999]"
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                action.onClick?.(rowIndex)
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                action.danger 
                  ? 'text-[var(--status-danger)] hover:bg-red-50 dark:hover:bg-red-900/20' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              {action.icon && <span className="w-4 h-4 shrink-0">{action.icon}</span>}
              <span className="truncate">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== TABLE MASTER ====================
export function TabelMaster({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Cari...',
  emptyMessage = 'Tidak ada data',
  onRowClick,
  compact = false,
  actions,
  loading = false,
}) {
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const filteredData = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase().trim()
    const keys = Array.isArray(searchKey) ? searchKey : [searchKey]
    return data.filter(row =>
      keys.some(key => {
        const val = row[key]
        return val != null && String(val).toLowerCase().includes(q)
      })
    )
  }, [data, search, searchKey])

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? ''
      const bVal = b[sortConfig.key] ?? ''
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortConfig])

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3'

  // Tambah kolom actions jika ada
  const allColumns = actions 
    ? [...columns, { key: '__actions__', label: 'Aksi', sortable: false, align: 'right' }]
    : columns

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="input pl-10"
          />
        </div>
        <span className="text-sm text-[var(--text-muted)]">
          {sortedData.length} dari {data.length} data
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
              <th className={`${cellPadding} w-12 text-left`}>
                <span className="text-xs font-semibold text-[var(--text-muted)]">No</span>
              </th>
              {allColumns.map(col => (
                <th
                  key={col.key}
                  className={`${cellPadding} ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.sortable !== false && col.key !== '__actions__' ? 'cursor-pointer hover:text-[var(--text-primary)]' : ''}`}
                  onClick={() => col.sortable !== false && col.key !== '__actions__' && handleSort(col.key)}
                  style={{ width: col.width }}
                >
                  <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{col.label}</span>
                    {col.sortable !== false && col.key !== '__actions__' && sortConfig.key === col.key && (
                      <svg className="w-3 h-3 text-[var(--brand-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {sortConfig.direction === 'asc' ? <path d="M12 5l-7 7h14l-7-7z" /> : <path d="M12 19l7-7H5l7 7z" />}
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={allColumns.length + 1} className={`${cellPadding} text-center`}>
                  <div className="py-12 text-[var(--text-muted)]">Loading...</div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={allColumns.length + 1} className={`${cellPadding} text-center`}>
                  <div className="py-12">
                    <svg className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-50 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm text-[var(--text-muted)]">
                      {search ? `Tidak ditemukan "${search}"` : emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className={`border-b border-[var(--border-primary)] last:border-b-0 ${onRowClick ? 'cursor-pointer' : ''} hover:bg-[var(--bg-hover)] transition-colors`}
                  onClick={() => onRowClick?.(row)}
                >
                  <td className={`${cellPadding} text-sm text-[var(--text-muted)]`}>{idx + 1}</td>
                  {allColumns.map(col => {
                    if (col.key === '__actions__') {
                      return (
                        <td key={col.key} className={`${cellPadding} text-right`}>
                          {actions && <ActionDropdown actions={actions} row={row} rowIndex={idx} />}
                        </td>
                      )
                    }
                    return (
                      <td key={col.key} className={`${cellPadding} text-sm`}>
                        {col.render ? col.render(row[col.key], row) : <span className="text-[var(--text-primary)]">{row[col.key]}</span>}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
