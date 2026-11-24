import { useEffect, useRef, useState } from 'react'
import { AlertCircle, LoaderCircle, X } from 'lucide-react'
import { FORM_ERROR_CODES } from '../../lib/categoryService.js'

export default function CategoryFormModal({
  open,
  mode,
  initialName = '',
  onSubmit,
  onClose,
}) {
  const dialogRef = useRef(null)
  const inputRef = useRef(null)
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isEdit = mode === 'edit'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      setName(initialName)
      setError('')
      setSubmitting(false)
      dialog.showModal()
      requestAnimationFrame(() => inputRef.current?.focus())
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, initialName])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Nama kategori wajib diisi.')
      inputRef.current?.focus()
      return
    }
    if (trimmed.length > 100) {
      setError('Nama kategori maksimal 100 karakter.')
      inputRef.current?.focus()
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await onSubmit(trimmed)
    } catch (err) {
      if (FORM_ERROR_CODES.has(err.code)) {
        setError(err.message)
      }
      // Error server sudah diberikan lewat toast oleh halaman induk.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="category-form-title"
      aria-describedby="category-form-description"
      className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-pink-mist bg-surface p-0 text-ink shadow-2xl"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex items-start justify-between gap-4 border-b border-pink-mist px-5 py-4">
          <div>
            <h2 id="category-form-title" className="text-base font-bold">
              {isEdit ? 'Edit Kategori' : 'Tambah Kategori'}
            </h2>
            <p id="category-form-description" className="mt-0.5 text-xs text-ink-muted">
              {isEdit
                ? 'Perbarui nama kategori ini.'
                : 'Buat kategori baru untuk mengelompokkan produk.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Tutup modal"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          <label htmlFor="category-name" className="block text-xs font-semibold">
            Nama Kategori <span className="text-error">*</span>
          </label>
          <input
            id="category-name"
            ref={inputRef}
            type="text"
            value={name}
            disabled={submitting}
            maxLength={100}
            onChange={(event) => {
              setName(event.target.value)
              if (error) setError('')
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'category-name-error' : undefined}
            placeholder="Contoh: Makanan"
            className={[
              'mt-1.5 h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:ring-4 disabled:opacity-70',
              error
                ? 'border-error focus:border-error focus:ring-error/10'
                : 'border-pink-mist focus:border-pink-primary focus:ring-pink-light/70',
            ].join(' ')}
          />
          {error && (
            <p
              id="category-name-error"
              className="mt-2 flex items-start gap-1.5 text-xs font-medium text-error"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-pink-mist px-5 py-4">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={submitting}
            className="h-10 rounded-xl border border-pink-mist bg-surface px-4 text-sm font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-pink-dark px-4 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting && <LoaderCircle className="size-4 animate-spin" />}
            {isEdit ? 'Simpan Perubahan' : 'Simpan'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
