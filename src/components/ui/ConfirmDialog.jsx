import { useEffect, useId, useRef } from 'react'
import { LoaderCircle } from 'lucide-react'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  busyLabel = 'Memproses...',
  loading = false,
  tone = 'primary',
  icon: Icon,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !open) return undefined

    const handleCancel = (event) => {
      event.preventDefault()
      if (!loading) onCancel()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [open, loading, onCancel])

  const handleBackdropClick = (event) => {
    if (event.target === dialogRef.current && !loading) onCancel()
  }

  const isDanger = tone === 'danger'
  const iconClass = isDanger
    ? 'bg-error/10 text-error'
    : 'bg-pink-light text-pink-dark'
  const confirmClass = isDanger
    ? 'bg-error text-white hover:brightness-95 focus-visible:ring-error/20'
    : 'bg-pink-dark text-white hover:brightness-95 focus-visible:ring-pink-light'

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="w-[min(420px,calc(100vw-2rem))] rounded-3xl border border-pink-mist bg-surface p-0 text-ink shadow-[0_28px_70px_-30px_rgba(26,26,26,0.6)] backdrop:bg-ink/40"
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start gap-4">
          {Icon && (
            <span
              aria-hidden="true"
              className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
            >
              <Icon className="size-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-bold tracking-tight text-ink">
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-2 text-sm leading-relaxed text-ink-muted"
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 rounded-xl border border-pink-mist bg-surface px-4 text-sm font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${confirmClass}`}
          >
            {loading && <LoaderCircle className="size-4 animate-spin" />}
            {loading ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
