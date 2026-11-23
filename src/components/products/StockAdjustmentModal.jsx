import { useState } from 'react'
import { AlertCircle, LoaderCircle, X } from 'lucide-react'
import Modal from './Modal.jsx'

const inputClass = (hasError) =>
  [
    'mt-1.5 h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:ring-4 disabled:opacity-70',
    hasError
      ? 'border-error focus:border-error focus:ring-error/10'
      : 'border-pink-mist focus:border-pink-primary focus:ring-pink-light/70',
  ].join(' ')

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-error">
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
      {message}
    </p>
  )
}

export default function StockAdjustmentModal({
  open,
  product,
  onSubmit,
  onClose,
}) {
  const [type, setType] = useState('masuk')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const currentStock = Number(product?.stock) || 0
  const unit = product?.unit || 'pcs'
  const parsedQuantity = Number(quantity)
  const validQuantity =
    quantity !== '' && Number.isInteger(parsedQuantity) && parsedQuantity > 0
      ? parsedQuantity
      : 0
  const previewStock =
    type === 'keluar'
      ? Math.max(0, currentStock - validQuantity)
      : currentStock + validQuantity

  const validate = () => {
    const nextErrors = {}
    if (type !== 'masuk' && type !== 'keluar') {
      nextErrors.type = 'Jenis mutasi wajib dipilih'
    }
    if (quantity === '' || !Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      nextErrors.quantity = 'Jumlah stok harus lebih besar dari 0'
    } else if (type === 'keluar' && parsedQuantity > currentStock) {
      nextErrors.quantity = 'Stok tidak mencukupi'
    }
    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      await onSubmit({ type, quantity: parsedQuantity, notes })
    } catch (err) {
      if (err?.fields) setErrors(err.fields)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      labelledBy="stock-modal-title"
      describedBy="stock-modal-description"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex items-start justify-between gap-4 border-b border-pink-mist px-5 py-4">
          <div>
            <h2 id="stock-modal-title" className="text-base font-bold">
              Atur Stok
            </h2>
            <p id="stock-modal-description" className="mt-0.5 text-xs text-ink-muted">
              Catatan perubahan stok akan tersimpan pada riwayat produk.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <div>
            <span className="block text-xs font-semibold text-ink">Product Name</span>
            <p className="mt-1.5 rounded-xl border border-pink-mist bg-pink-light/40 px-3.5 py-2.5 text-sm font-semibold text-ink">
              {product?.name ?? '-'}
            </p>
          </div>
          <div>
            <span className="block text-xs font-semibold text-ink">Current Stock</span>
            <p className="mt-1.5 rounded-xl border border-pink-mist bg-pink-light/40 px-3.5 py-2.5 text-sm font-semibold text-ink">
              {currentStock} {unit}
            </p>
          </div>

          <div>
            <label htmlFor="stock-type" className="block text-xs font-semibold text-ink">
              Mutation Type <span className="text-error">*</span>
            </label>
            <select
              id="stock-type"
              value={type}
              onChange={(event) => {
                setType(event.target.value)
                setErrors((current) => ({ ...current, type: '', quantity: '' }))
              }}
              disabled={submitting}
              aria-invalid={Boolean(errors.type)}
              aria-describedby={errors.type ? 'stock-type-error' : undefined}
              className={inputClass(Boolean(errors.type))}
            >
              <option value="masuk">Tambah Stok (masuk)</option>
              <option value="keluar">Kurangi Stok (keluar)</option>
            </select>
            <FieldError id="stock-type-error" message={errors.type} />
          </div>

          <div>
            <label htmlFor="stock-quantity" className="block text-xs font-semibold text-ink">
              Quantity <span className="text-error">*</span>
            </label>
            <input
              id="stock-quantity"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value)
                setErrors((current) => ({ ...current, quantity: '' }))
              }}
              disabled={submitting}
              placeholder="0"
              data-autofocus
              aria-invalid={Boolean(errors.quantity)}
              aria-describedby={errors.quantity ? 'stock-quantity-error' : undefined}
              className={inputClass(Boolean(errors.quantity))}
            />
            <FieldError id="stock-quantity-error" message={errors.quantity} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="stock-notes" className="block text-xs font-semibold text-ink">
              Notes <span className="font-normal text-ink-muted">(opsional)</span>
            </label>
            <textarea
              id="stock-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={submitting}
              rows={3}
              placeholder="Contoh: Penambahan stok dari supplier"
              className="mt-1.5 w-full resize-none rounded-xl border border-pink-mist bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-pink-primary focus:ring-4 focus:ring-pink-light/70 disabled:opacity-70"
            />
          </div>

          <div
            aria-live="polite"
            className="sm:col-span-2 rounded-xl border border-pink-mist bg-pink-light/40 px-4 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              Stock preview
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {currentStock} {unit}
              <span className="mx-2 text-pink-dark" aria-hidden="true">
                {type === 'masuk' ? '+' : '−'}
              </span>
              {validQuantity} {unit}
              <span className="mx-2 text-ink-muted" aria-hidden="true">
                =
              </span>
              <span className="font-bold text-pink-dark">
                {previewStock} {unit}
              </span>
            </p>
            <p className="sr-only">
              Perkiraan stok setelah perubahan: {previewStock} {unit}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-pink-mist px-5 py-4">
          <button
            type="button"
            onClick={onClose}
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
            Simpan Perubahan
          </button>
        </div>
      </form>
    </Modal>
  )
}
