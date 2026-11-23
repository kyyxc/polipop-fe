import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  LogOut,
  Store,
  X,
} from 'lucide-react'
import {
  isActiveRoute,
  mainNavigation,
  secondaryNavigation,
} from '../../config/navigation.js'

function NavItem({ item, active, compact, onNavigate }) {
  const Icon = item.icon

  return (
    <button
      type="button"
      onClick={() => onNavigate(item.route)}
      aria-current={active ? 'page' : undefined}
      title={compact ? item.label : undefined}
      className={[
        'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary',
        compact ? 'lg:justify-center lg:px-0' : '',
        active
          ? 'bg-pink-light text-pink-dark'
          : 'text-ink-muted hover:bg-pink-light/60 hover:text-pink-dark',
      ].join(' ')}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-pink-dark" />
      )}
      <Icon
        className={[
          'size-[18px] shrink-0',
          active ? 'text-pink-dark' : 'text-ink-muted group-hover:text-pink-dark',
        ].join(' ')}
      />
      <span
        className={[
          'min-w-0 flex-1 truncate text-left',
          compact ? 'lg:hidden' : '',
        ].join(' ')}
      >
        {item.label}
      </span>
      {item.badge && (
        <span
          className={[
            'shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-pink-dark',
            compact ? 'lg:hidden' : '',
          ].join(' ')}
        >
          {item.badge}
        </span>
      )}
    </button>
  )
}

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
  activeRoute,
  onNavigate,
  onLogout,
  loggingOut = false,
}) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
        />
      )}

      <aside
        aria-label="Navigasi utama"
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[264px] shrink-0 flex-col border-r border-pink-mist bg-surface',
          'shadow-[12px_0_40px_-24px_rgba(26,26,26,0.5)]',
          'transition-transform duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 lg:shadow-none lg:transition-[width]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-[76px]' : 'lg:w-[264px]',
        ].join(' ')}
      >
        <div
          className={[
            'flex h-16 shrink-0 items-center border-b border-pink-mist px-3',
            collapsed ? 'lg:justify-center' : '',
          ].join(' ')}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pink-dark text-white shadow-[0_8px_16px_-10px_#c2607a]">
            <Store className="size-5" />
          </span>
          <div
            className={[
              'min-w-0 flex-1 pl-3',
              collapsed ? 'lg:hidden' : '',
            ].join(' ')}
          >
            <p className="truncate text-sm font-bold leading-tight tracking-tight text-ink">
              Polipop
            </p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Aplikasi Kasir
            </p>
          </div>
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Tutup menu"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p
            className={[
              'px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted/70',
              collapsed ? 'lg:hidden' : '',
            ].join(' ')}
          >
            Menu Utama
          </p>
          {mainNavigation.map((item) => (
            <NavItem
              key={item.route}
              item={item}
              active={isActiveRoute(activeRoute, item.route)}
              compact={collapsed}
              onNavigate={onNavigate}
            />
          ))}

          <div className="!my-3 border-t border-pink-mist" />

          {secondaryNavigation.map((item) => (
            <NavItem
              key={item.route}
              item={item}
              active={isActiveRoute(activeRoute, item.route)}
              compact={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <div className="shrink-0 border-t border-pink-mist p-3">
          <div
            className={[
              'flex items-center gap-3 rounded-xl bg-pink-light/60 p-2',
              collapsed ? 'lg:justify-center lg:bg-transparent' : '',
            ].join(' ')}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pink-dark text-xs font-bold text-white">
              K3
            </span>
            <div
              className={['min-w-0 flex-1', collapsed ? 'lg:hidden' : ''].join(
                ' ',
              )}
            >
              <p className="truncate text-xs font-semibold text-ink">Kasir 03</p>
              <p className="truncate text-[10px] text-ink-muted">
                Outlet Sudirman
              </p>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              title={collapsed ? 'Keluar' : undefined}
              className={[
                'mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors',
                'hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 disabled:cursor-not-allowed disabled:opacity-60',
                collapsed ? 'lg:justify-center lg:px-0' : '',
              ].join(' ')}
            >
              {loggingOut ? (
                <LoaderCircle className="size-[18px] shrink-0 animate-spin" />
              ) : (
                <LogOut className="size-[18px] shrink-0" />
              )}
              <span className={collapsed ? 'lg:hidden' : ''}>
                {loggingOut ? 'Keluar...' : 'Keluar'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}
            title={collapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}
            className={[
              'mt-1 hidden w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-ink-muted transition-colors',
              'hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary lg:flex',
              collapsed ? 'lg:justify-center lg:px-0' : '',
            ].join(' ')}
          >
            {collapsed ? (
              <ChevronRight className="size-[18px] shrink-0" />
            ) : (
              <ChevronLeft className="size-[18px] shrink-0" />
            )}
            <span className={collapsed ? 'lg:hidden' : ''}>
              Perkecil sidebar
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
