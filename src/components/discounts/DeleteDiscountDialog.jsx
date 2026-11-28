import { useEffect, useRef, useState } from 'react'
import { AlertCircle, LoaderCircle } from 'lucide-react'

export default function DeleteDiscountDialog({ open, discount, onSubmit, onClose }) {
  const dialogRef = useRef(null)
  const cancelRef = useRef(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      setError('')
      setDeleting(false)
      dialog.showModal()
      requestAnimationFrame(() => cancelRef.current?.focus())
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, discount?.id])

  const handleDelete = async () => {
    if (deleting) return
    setError('')
    setDeleting(true)
    try {
      const result = await onSubmit()
      if (result && !result.ok) {
        setError(result.error?.message || 'Gagal menghapus diskon.')
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="delete-discount-title"
      aria-describedby="delete-discount-description"
      className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-pink-mist bg-surface p-0 text-ink shadow-2xl"
    >
      <div className="px-5 pb-4 pt-5">
        <span className="flex size-11 items-center justify-center rounded-xl bg-error/10 text-error">
          <AlertCircle className="size-5" />
        </span>
        <h2 id="delete-discount-title" className="mt-4 text-base font-bold">
          Hapus Diskon?
        </h2>
        <p id="delete-discount-description" className="mt-2 text-sm leading-relaxed text-ink-muted">
          Apakah kamu yakin ingin menghapus diskon “
          <span className="font-semibold text-ink">{discount?.name}</span>”? Diskon
          tidak akan digunakan lagi setelah dihapus.
        </p>
        {error && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-3 py-2.5 text-xs font-medium leading-relaxed text-error"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-pink-mist px-5 py-4">
        <button
          ref={cancelRef}
          type="button"
          onClick={() => dialogRef.current?.close()}
          disabled={deleting}
          className="h-10 rounded-xl border border-pink-mist bg-surface px-4 text-sm font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary disabled:opacity-60"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-error px-4 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error/20 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {deleting && <LoaderCircle className="size-4 animate-spin" />}
          Hapus
        </button>
      </div>
    </dialog>
  )
}
