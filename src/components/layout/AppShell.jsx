import { useEffect, useState } from 'react'
import { Menu, PanelLeft } from 'lucide-react'
import { findNavItem } from '../../config/navigation.js'
import Sidebar from './Sidebar.jsx'

const STORAGE_KEY = 'polipop-sidebar-collapsed'

export default function AppShell({ route, onNavigate, onLogout, children }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeItem = findNavItem(route)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed))
    } catch {
      // localStorage tidak tersedia: state sidebar tetap berlaku di sesi ini.
    }
  }, [collapsed])

  useEffect(() => {
    if (!mobileOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  const handleNavigate = (nextRoute) => {
    onNavigate(nextRoute)
    setMobileOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-cream text-ink">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        activeRoute={route}
        onNavigate={handleNavigate}
        onLogout={onLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-pink-mist bg-surface/85 px-4 backdrop-blur lg:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-pink-mist bg-surface text-ink-muted transition hover:border-pink-primary hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary lg:hidden"
          >
            <Menu className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}
            className="hidden size-9 shrink-0 items-center justify-center rounded-xl border border-pink-mist bg-surface text-ink-muted transition hover:border-pink-primary hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary lg:flex"
          >
            <PanelLeft className="size-[18px]" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight tracking-tight">
              {activeItem.label}
            </p>
            <p className="truncate text-[11px] text-ink-muted">
              Outlet Sudirman
            </p>
          </div>

          <span className="ml-auto hidden rounded-full bg-pink-light px-3 py-1 text-xs font-semibold text-pink-dark sm:inline">
            Kasir
          </span>
        </header>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
