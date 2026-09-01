import { useState } from 'react'
import { Badge } from '../../../shared/components/ui.jsx'
import {
  createRuangan,
  deleteRuangan,
} from '../service/ruanganService.js'

/**
 * Komponen inline untuk mengelola ruangan per poli.
 * Props:
 *  - poli: object poli
 *  - branchId: id branch aktif
 *  - ruangan: array ruangan untuk poli ini (sudah di-load dari parent)
 *  - onChange: callback dipanggil setelah ada perubahan
 */
export default function RuanganInline({ poli, branchId, ruangan, onChange }) {
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleAdd = async () => {
    if (!input.trim() || submitting) return
    setSubmitting(true)
    setErrorMsg('')
    try {
      await createRuangan({
        branch_id: Number(branchId),
        poli_id: poli.id,
        kode: input.trim(),
        nama_ruangan: input.trim(),
      })
      setInput('')
      onChange?.()
    } catch (err) {
      const data = err.response?.data
      if (data?.errors?.kode) {
        setErrorMsg(data.errors.kode[0])
      } else {
        setErrorMsg(data?.message || 'Gagal menambah ruangan')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus ruangan ini?')) return
    try {
      await deleteRuangan(id)
      onChange?.()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus ruangan')
    }
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-primary)]">
      <div className="flex-1 min-w-0">
        <span className="font-medium text-body-sm">{poli.nama}</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {ruangan.length === 0 ? (
            <span className="text-tiny text-[var(--text-muted)]">Belum ada</span>
          ) : ruangan.map(r => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--brand-light)] text-[var(--brand-primary)] text-tiny"
            >
              {r.kode}
              <button
                type="button"
                onClick={() => handleDelete(r.id)}
                className="ml-1 text-[var(--text-muted)] hover:text-[var(--status-danger)]"
                title="Hapus ruangan"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {errorMsg && <p className="text-tiny text-red-500 mt-1">{errorMsg}</p>}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="R-GI-01"
          className="input w-28"
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          disabled={submitting}
        />
        <button
          onClick={handleAdd}
          className="btn btn-secondary btn-sm"
          disabled={!input.trim() || submitting}
        >
          +
        </button>
      </div>
    </div>
  )
}
