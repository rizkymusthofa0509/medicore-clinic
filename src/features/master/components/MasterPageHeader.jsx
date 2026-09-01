export default function MasterPageHeader({ title, description, branchId, actions }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-desc">{description}</p>}
        {branchId && (
          <p className="mt-1 text-tiny text-[var(--text-muted)]">
            Branch aktif: <span className="font-mono">{branchId}</span>
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
