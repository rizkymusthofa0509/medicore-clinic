import { NavLink, useNavigate } from 'react-router-dom'

export function BrandLogo({ light = false, size = 'md', showTagline = true }) {
  const iconSize = size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'
  const textSize = size === 'lg' ? 'text-lg' : 'text-base'

  return (
    <div className="flex items-center gap-2.5">
      <div className={`grid ${iconSize} place-items-center rounded-md bg-[var(--brand-primary)]`}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.5" y="3.5" width="19" height="12" rx="1" fill="none" stroke="white" />
          <rect x="4" y="5" width="6" height="2.5" rx="0.5" fill="var(--accent-primary)" stroke="none" />
          <path d="M9 19h6M12 15.5V19" fill="none" stroke="white" />
        </svg>
      </div>
      <div className="leading-tight min-w-0">
        <p className={`${textSize} font-semibold tracking-tight ${light ? 'text-[var(--text-inverse)]' : 'text-[var(--text-primary)]'} truncate`}>
          Medicore<span style={{ color: 'var(--accent-primary)' }}> Clinic</span>
        </p>
        {showTagline && (
          <p className={`hidden sm:block text-[0.6rem] uppercase ${light ? 'text-[var(--text-inverse)]/70' : 'text-[var(--text-muted)]'} truncate font-medium`}>
            Sistem Manajemen Klinik Multi-Branch
          </p>
        )}
      </div>
    </div>
  )
}
