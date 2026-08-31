import { useState, useEffect, useMemo } from 'react'

export function TabelMaster({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Cari...',
  emptyMessage = 'Tidak ada data',
  onRowClick,
  compact = false,
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
            <tr className="border-b border-[var(--border-primary)]">
              <th className={`${cellPadding} w-12 text-left`}>
                <span className="text-xs font-medium text-[var(--text-muted)]">No</span>
              </th>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`${cellPadding} text-left ${col.sortable !== false ? 'cursor-pointer hover:text-[var(--text-primary)]' : ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{col.label}</span>
                    {col.sortable !== false && sortConfig.key === col.key && (
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
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className={`${cellPadding} text-center`}>
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
                  {columns.map(col => (
                    <td key={col.key} className={`${cellPadding} text-sm`}>
                      {col.render ? col.render(row[col.key], row) : <span className="text-[var(--text-primary)]">{row[col.key]}</span>}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
