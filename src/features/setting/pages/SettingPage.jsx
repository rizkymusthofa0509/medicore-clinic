import { useState } from 'react'
import BranchTab from './BranchTab.jsx'
import AccountTab from './AccountTab.jsx'

export default function SettingPage() {
  const [activeTab, setActiveTab] = useState('branch')

  const tabs = [
    { key: 'branch', label: 'Branch' },
    { key: 'account', label: 'Account' },
    { key: 'menu', label: 'Menu', comingSoon: true },
    { key: 'role', label: 'Role Access', comingSoon: true },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Setting Aplikasi</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Kelola branch, akun, menu dan role akses</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-primary)] overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => !tab.comingSoon && setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab.comingSoon 
                ? 'text-[var(--text-muted)] cursor-not-allowed' 
                : activeTab === tab.key
                  ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]'
                  : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)]'
            }`}
          >
            {tab.label}
            {tab.comingSoon && <span className="ml-1 text-[10px] text-[var(--text-muted)]">(Coming Soon)</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'branch' && <BranchTab />}
      {activeTab === 'account' && <AccountTab />}
      {activeTab === 'menu' && <ComingSoonTab />}
      {activeTab === 'role' && <ComingSoonTab />}
    </div>
  )
}

function ComingSoonTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
      <svg viewBox="0 0 24 24" className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-lg font-medium">Coming Soon</p>
      <p className="text-sm mt-1">Fitur ini sedang dalam pengembangan.</p>
    </div>
  )
}
