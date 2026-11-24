import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils.js'

const sizeClasses = {
  sm: 'h-10 pl-3 pr-9 text-xs',
  md: 'h-11 pl-3.5 pr-10 text-sm',
}

function optionLabel(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(optionLabel).join('')
  return ''
}

function normalizeOptions(children) {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child) || child.type !== 'option') return []

    const label =
      optionLabel(child.props.children) || String(child.props.value ?? '')

    return [
      {
        value: child.props.value ?? label,
        label,
        disabled: Boolean(child.props.disabled),
      },
    ]
  })
}

/**
 * Select berbasis listbox kustom: item dropdown bisa diberi gaya penuh
 * (hover, aktif, terpilih, disabled) tetapi API-nya tetap seperti `<select>`
 * sehingga pemanggil cukup membaca `event.target.value`.
 */
export default function Select({
  id,
  className,
  size = 'md',
  invalid = false,
  disabled = false,
  value,
  onChange,
  children,
  ...props
}) {
  const generatedId = useId()
  const listId = `${generatedId}-listbox`
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const listRef = useRef(null)

  const options = useMemo(() => normalizeOptions(children), [children])
  const selectedIndex = options.findIndex(
    (option) => String(option.value) === String(value),
  )
  const selectedOption = options[selectedIndex]

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() =>
    selectedIndex >= 0 ? selectedIndex : 0,
  )

  const safeActiveIndex = options.length
    ? Math.min(Math.max(activeIndex, 0), options.length - 1)
    : 0
  const activeOptionId = options[safeActiveIndex]
    ? `${listId}-option-${safeActiveIndex}`
    : undefined

  const closeMenu = (returnFocus = false) => {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }

  const openMenu = () => {
    const firstEnabled = options.findIndex((option) => !option.disabled)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : Math.max(firstEnabled, 0))
    setOpen(true)
  }

  const commit = (option) => {
    if (!option || option.disabled) return
    onChange?.({ target: { value: option.value } })
    closeMenu(true)
  }

  const moveActive = (direction) => {
    setActiveIndex((current) => {
      if (options.length === 0) return 0
      let next = current
      for (let step = 0; step < options.length; step += 1) {
        next = (next + direction + options.length) % options.length
        if (!options[next].disabled) return next
      }
      return current
    })
  }

  const jumpActive = (edge) => {
    const enabled = options
      .map((option, index) => (option.disabled ? null : index))
      .filter((index) => index !== null)
    if (enabled.length === 0) return
    setActiveIndex(edge === 'first' ? enabled[0] : enabled[enabled.length - 1])
  }

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (open) listRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open || !activeOptionId) return
    document
      .getElementById(activeOptionId)
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, activeOptionId])

  const handleButtonKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      openMenu()
    }
  }

  const handleListKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveActive(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveActive(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      jumpActive('first')
    } else if (event.key === 'End') {
      event.preventDefault()
      jumpActive('last')
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      commit(options[safeActiveIndex])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu(true)
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={cn('group relative', className)}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleButtonKeyDown}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border bg-surface font-medium text-ink outline-none transition',
          'text-left hover:border-pink-primary/70 focus:border-pink-primary focus:ring-4 focus:ring-pink-primary/25',
          'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-pink-mist',
          sizeClasses[size] ?? sizeClasses.md,
          invalid && 'border-error hover:border-error focus:border-error focus:ring-error/15',
          !invalid && 'border-pink-mist',
        )}
        {...props}
      >
        <span
          className={cn(
            'truncate',
            !selectedOption || String(selectedOption.value) === ''
              ? 'text-ink-muted'
              : 'text-ink',
          )}
        >
          {selectedOption?.label ?? 'Pilih...'}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'pointer-events-none size-4 shrink-0 text-ink-muted transition',
            'group-hover:text-pink-dark group-focus-within:text-pink-dark',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={activeOptionId}
          onKeyDown={handleListKeyDown}
          className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-pink-mist bg-surface p-1 shadow-[0_20px_45px_-20px_rgba(26,26,26,0.35)] outline-none dark:shadow-black/40"
        >
          {options.length === 0 ? (
            <p className="px-3 py-3 text-xs text-ink-muted">Tidak ada pilihan</p>
          ) : (
            options.map((option, index) => {
              const isSelected = String(option.value) === String(value)
              const isActive = index === safeActiveIndex

              return (
                <button
                  key={`${String(option.value)}-${index}`}
                  id={`${listId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  disabled={option.disabled}
                  onMouseEnter={() => {
                    if (!option.disabled) setActiveIndex(index)
                  }}
                  onClick={() => commit(option)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition',
                    isActive && !option.disabled && 'bg-pink-light text-pink-dark',
                    !isActive && 'text-ink hover:bg-pink-light/60',
                    isSelected && 'font-semibold text-pink-dark',
                    option.disabled && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-md border transition',
                      isSelected
                        ? 'border-pink-primary bg-pink-primary/25 text-pink-dark'
                        : 'border-pink-mist bg-cream/50',
                    )}
                  >
                    {isSelected && <Check className="size-3.5" aria-hidden="true" />}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
