import { useEffect, useId, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'

const toneStyles = {
  danger: {
    icon: AlertTriangle,
    iconClass: 'bg-error/10 text-error',
    confirmClass: 'bg-error text-white shadow-[0_12px_24px_-12px_rgba(220,38,38,0.7)] hover:brightness-95 focus-visible:ring-error/20',
  },
  primary: {
    icon: AlertTriangle,
    iconClass: 'bg-pink-light text-pink-dark',
    confirmClass: 'bg-pink-dark text-white shadow-[0_12px_24px_-12px_#c2607a] hover:brightness-95 focus-visible:ring-pink-light',
  },
}

export default function ConfirmDialog({
  open,
  icon: IconProp,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  busyLabel,
  cancelLabel = 'Batal',
  tone = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId()
  const descriptionId = useId()
  const confirmRef = useRef(null)
  const style = toneStyles[tone] ?? toneStyles.primary
  const Icon = IconProp ?? style.icon
  const { iconClass, confirmClass } = style

  useEffect(() => {
    if (!open) return undefined

    confirmRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Tutup dialog"
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-md rounded-3xl border border-pink-mist bg-surface p-6 shadow-[0_30px_70px_-30px_rgba(26,26,26,0.5)] sm:p-7"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Tutup"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
        >
          <X className="size-4" />
        </button>

        <span
          className={`flex size-11 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="size-5" />
        </span>

        <h2
          id={titleId}
          className="mt-4 pr-6 text-lg font-bold tracking-tight text-ink"
        >
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-ink-muted">
          {description}
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 rounded-xl border border-pink-mist bg-surface px-4 text-sm font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${confirmClass}`}
          >
            {loading ? busyLabel || confirmLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
