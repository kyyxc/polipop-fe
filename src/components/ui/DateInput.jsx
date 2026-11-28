import { useRef } from 'react'
import { CalendarDays } from 'lucide-react'
import { cn } from '../../lib/utils.js'

export default function DateInput({
  id,
  className,
  size = 'md',
  invalid = false,
  disabled = false,
  ...props
}) {
  const inputRef = useRef(null)

  const openPicker = () => {
    if (disabled) return
    try {
      inputRef.current?.showPicker?.()
    } catch {
      // Browser lama tetap bisa mengisi tanggal lewat keyboard.
    }
  }

  return (
    <div className={cn('relative', className)}>
      <CalendarDays
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
      />
      <input
        ref={inputRef}
        id={id}
        type="date"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onClick={openPicker}
        className={cn(
          'w-full rounded-xl border bg-surface text-ink outline-none transition',
          'hover:border-pink-primary/70 focus:border-pink-primary focus:ring-4 focus:ring-pink-light/70',
          'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-pink-mist',
          '[&::-webkit-calendar-picker-indicator]:size-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100',
          size === 'sm' ? 'h-10 pl-9 pr-3 text-xs' : 'h-11 pl-10 pr-3 text-sm',
          invalid
            ? 'border-error hover:border-error focus:border-error focus:ring-error/15'
            : 'border-pink-mist',
        )}
        {...props}
      />
    </div>
  )
}
