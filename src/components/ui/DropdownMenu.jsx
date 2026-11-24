import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { ChevronDown, LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/utils.js'

const DropdownMenuContext = createContext(null)

const triggerVariants = {
  outline:
    'border border-pink-mist bg-surface text-ink-muted hover:border-pink-primary hover:bg-pink-light hover:text-pink-dark',
  primary: 'bg-pink-dark text-white hover:brightness-95',
}

/**
 * Menu dropdown ringan berbasis elemen native. Menutup saat klik di luar atau
 * Escape, serta menempelkan role ARIA yang sesuai untuk menu.
 */
export function DropdownMenu({
  label,
  icon: Icon,
  loading = false,
  disabled = false,
  variant = 'outline',
  align = 'right',
  className,
  menuClassName,
  children,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const closeMenu = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) closeMenu()
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeMenu()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, closeMenu])

  return (
    <DropdownMenuContext.Provider value={closeMenu}>
      <div ref={rootRef} className={cn('relative', className)}>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-haspopup="menu"
          disabled={disabled || loading}
          className={cn(
            'inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-semibold transition',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-primary/25',
            'disabled:cursor-not-allowed disabled:opacity-60',
            triggerVariants[variant] ?? triggerVariants.outline,
          )}
        >
          {loading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : Icon ? (
            <Icon className="size-4" />
          ) : null}
          {label}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-4 transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>

        {open && (
          <div
            role="menu"
            className={cn(
              'absolute z-50 mt-2 min-w-44 overflow-hidden rounded-xl border border-pink-mist bg-surface p-1',
              'shadow-[0_20px_45px_-20px_rgba(26,26,26,0.35)] dark:shadow-black/40',
              align === 'left' ? 'left-0' : 'right-0',
              menuClassName,
            )}
          >
            {children}
          </div>
        )}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuItem({
  icon: Icon,
  iconClassName,
  children,
  onSelect,
  className,
  disabled = false,
  ...props
}) {
  const closeMenu = useContext(DropdownMenuContext)

  const handleClick = () => {
    closeMenu?.()
    onSelect?.()
  }

  return (
    <button
      type="button"
      role="menuitem"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs font-semibold transition',
        'hover:bg-pink-light hover:text-pink-dark active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-primary',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink-muted',
        className,
      )}
      {...props}
    >
      {Icon && (
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg border border-pink-mist bg-cream/50 text-ink-muted transition',
            'group-hover:border-pink-primary/40 group-hover:bg-surface group-hover:text-pink-dark',
          )}
        >
          <Icon
            className={cn('size-4', iconClassName)}
            aria-hidden="true"
          />
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  )
}
