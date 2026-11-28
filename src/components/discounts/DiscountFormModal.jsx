import { useEffect, useRef, useState } from 'react'
import { AlertCircle, LoaderCircle, X } from 'lucide-react'
import DateInput from '../ui/DateInput.jsx'
import Select from '../ui/Select.jsx'
import {
  DISCOUNT_SCOPES,
  DISCOUNT_TYPES,
  FORM_ERROR_CODES,
} from '../../lib/discountService.js'
import { toDateInput } from '../../lib/discountDisplay.js'

const scopeLabels = {
  product: 'Diskon produk',
  transaction: 'Diskon transaksi',
}

const typeLabels = {
  percentage: 'Persentase (%)',
  fixed: 'Nominal (Rp)',
}

function initialForm(discount) {
  if (!discount) {
    return {
      name: '',
      scope: 'product',
      productId: '',
      type: 'percentage',
      value: '',
      minTransactionAmount: '',
      startsAt: '',
      endsAt: '',
      isActive: true,
    }
  }

  return {
    name: discount.name ?? '',
    scope: discount.scope ?? 'product',
    productId: discount.productId ?? '',
    type: discount.type ?? 'percentage',
    value: String(discount.value ?? ''),
    minTransactionAmount:
      discount.minTransactionAmount == null
        ? ''
        : String(discount.minTransactionAmount),
    startsAt: toDateInput(discount.startsAt),
    endsAt: toDateInput(discount.endsAt),
    isActive: Boolean(discount.isActive),
  }
}

function inputClass(invalid) {
  return [
    'mt-1.5 h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:ring-4 disabled:opacity-70',
    invalid
      ? 'border-error focus:border-error focus:ring-error/10'
      : 'border-pink-mist focus:border-pink-primary focus:ring-pink-light/70',
  ].join(' ')
}

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1.5 text-[11px] font-medium text-error">
      {message}
    </p>
  )
}

export default function DiscountFormModal({
  open,
  mode,
  discount,
  products = [],
  productsError = '',
  onSubmit,
  onClose,
}) {
  const dialogRef = useRef(null)
  const nameRef = useRef(null)
  const [form, setForm] = useState(() => initialForm(discount))
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const isEdit = mode === 'edit'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      setForm(initialForm(discount))
      setError('')
      setFieldErrors({})
      setSubmitting(false)
      dialog.showModal()
      requestAnimationFrame(() => nameRef.current?.focus())
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, discount])

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (fieldErrors[key]) {
      setFieldErrors((current) => ({ ...current, [key]: undefined }))
    }
    if (error) setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    const errors = {}
    const name = form.name.trim()
    const value = Number(form.value)

    if (!name) errors.name = 'Nama diskon wajib diisi'
    else if (name.length > 150) errors.name = 'Maksimal 150 karakter'

    if (!Number.isFinite(value) || value <= 0) {
      errors.value = 'Harus lebih besar dari 0'
    } else if (form.type === 'percentage' && value > 100) {
      errors.value = 'Persentase maksimal 100%'
    }

    if (form.scope === 'product' && !form.productId) {
      errors.productId = 'Produk wajib dipilih'
    }
    if (
      form.startsAt &&
      form.endsAt &&
      new Date(form.endsAt) < new Date(form.startsAt)
    ) {
      errors.endsAt = 'Tidak boleh sebelum tanggal mulai'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Periksa kembali data diskon.')
      if (errors.name) nameRef.current?.focus()
      return
    }

    setError('')
    setFieldErrors({})
    setSubmitting(true)

    try {
      await onSubmit({
        name,
        scope: form.scope,
        productId: form.scope === 'product' ? form.productId : undefined,
        type: form.type,
        value,
        minTransactionAmount:
          form.scope === 'transaction'
            ? form.minTransactionAmount === ''
              ? null
              : Number(form.minTransactionAmount)
            : null,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        isActive: form.isActive,
      })
    } catch (err) {
      if (FORM_ERROR_CODES.has(err.code)) {
        setError(err.message)
        setFieldErrors(err.fields ?? {})
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="discount-form-title"
      aria-describedby="discount-form-description"
      className="w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-pink-mist bg-surface p-0 text-ink shadow-2xl"
    >
      <form onSubmit={handleSubmit} noValidate className="max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 border-b border-pink-mist px-5 py-4">
          <div>
            <h2 id="discount-form-title" className="text-base font-bold">
              {isEdit ? 'Edit Diskon' : 'Tambah Diskon'}
            </h2>
            <p id="discount-form-description" className="mt-0.5 text-xs text-ink-muted">
              {isEdit
                ? 'Perbarui nilai dan periode diskon ini.'
                : 'Buat diskon untuk produk tertentu atau seluruh transaksi.'}
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

        {error && (
          <p
            role="alert"
            className="mx-5 mt-4 flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-3 py-2.5 text-xs font-medium leading-relaxed text-error"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        )}

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="discount-name" className="block text-xs font-semibold">
              Nama Diskon <span className="text-error">*</span>
            </label>
            <input
              id="discount-name"
              ref={nameRef}
              type="text"
              value={form.name}
              disabled={submitting}
              maxLength={150}
              placeholder="Contoh: Diskon Indomie"
              onChange={(event) => updateField('name', event.target.value)}
              aria-invalid={Boolean(fieldErrors.name)}
              className={inputClass(Boolean(fieldErrors.name))}
            />
            <FieldError id="discount-name-error" message={fieldErrors.name} />
          </div>

          <div>
            <label htmlFor="discount-scope" className="block text-xs font-semibold">
              Cakupan <span className="text-error">*</span>
            </label>
            <Select
              id="discount-scope"
              value={form.scope}
              disabled={submitting || isEdit}
              invalid={Boolean(fieldErrors.scope)}
              aria-label="Cakupan diskon"
              onChange={(event) => updateField('scope', event.target.value)}
            >
              {DISCOUNT_SCOPES.map((scope) => (
                <option key={scope} value={scope}>
                  {scopeLabels[scope] ?? scope}
                </option>
              ))}
            </Select>
            {isEdit && (
              <p className="mt-1.5 text-[11px] text-ink-muted">
                Cakupan tidak dapat diubah.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="discount-type" className="block text-xs font-semibold">
              Jenis Diskon <span className="text-error">*</span>
            </label>
            <Select
              id="discount-type"
              value={form.type}
              disabled={submitting}
              invalid={Boolean(fieldErrors.type)}
              aria-label="Jenis diskon"
              onChange={(event) => updateField('type', event.target.value)}
            >
              {DISCOUNT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type] ?? type}
                </option>
              ))}
            </Select>
            <FieldError id="discount-type-error" message={fieldErrors.type} />
          </div>

          {form.scope === 'product' ? (
            <div className="sm:col-span-2">
              <label htmlFor="discount-product" className="block text-xs font-semibold">
                Produk <span className="text-error">*</span>
              </label>
              <Select
                id="discount-product"
                value={form.productId}
                disabled={submitting || isEdit}
                invalid={Boolean(fieldErrors.productId)}
                aria-label="Produk"
                onChange={(event) => updateField('productId', event.target.value)}
              >
                <option value="">Pilih produk...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
              {fieldErrors.productId ? (
                <FieldError
                  id="discount-product-error"
                  message={fieldErrors.productId}
                />
              ) : products.length === 0 ? (
                <p className="mt-1.5 text-[11px] text-warning">
                  {productsError || 'Belum ada produk yang dapat dipilih.'}
                </p>
              ) : null}
              {isEdit && (
                <p className="mt-1.5 text-[11px] text-ink-muted">
                  Produk tidak dapat diubah.
                </p>
              )}
            </div>
          ) : (
            <div className="sm:col-span-2">
              <label
                htmlFor="discount-min-transaction"
                className="block text-xs font-semibold"
              >
                Minimum Transaksi <span className="text-ink-muted">(opsional)</span>
              </label>
              <input
                id="discount-min-transaction"
                type="number"
                min="0"
                step="0.01"
                value={form.minTransactionAmount}
                disabled={submitting}
                placeholder="Contoh: 50000"
                onChange={(event) =>
                  updateField('minTransactionAmount', event.target.value)
                }
                aria-invalid={Boolean(fieldErrors.minTransactionAmount)}
                className={inputClass(Boolean(fieldErrors.minTransactionAmount))}
              />
              <FieldError
                id="discount-min-transaction-error"
                message={fieldErrors.minTransactionAmount}
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <label htmlFor="discount-value" className="block text-xs font-semibold">
              Nilai Diskon <span className="text-error">*</span>
            </label>
            <input
              id="discount-value"
              type="number"
              min="0"
              step="0.01"
              value={form.value}
              disabled={submitting}
              placeholder={form.type === 'percentage' ? 'Contoh: 10' : 'Contoh: 5000'}
              onChange={(event) => updateField('value', event.target.value)}
              aria-invalid={Boolean(fieldErrors.value)}
              className={inputClass(Boolean(fieldErrors.value))}
            />
            <p className="mt-1.5 text-[11px] text-ink-muted">
              {form.type === 'percentage'
                ? 'Isi dengan angka persentase, misalnya 10 untuk 10%.'
                : 'Nominal potongan dalam rupiah.'}
            </p>
            <FieldError id="discount-value-error" message={fieldErrors.value} />
          </div>

          <div>
            <label htmlFor="discount-starts-at" className="block text-xs font-semibold">
              Tanggal Mulai <span className="text-ink-muted">(opsional)</span>
            </label>
            <DateInput
              id="discount-starts-at"
              className="mt-1.5 w-full"
              value={form.startsAt}
              disabled={submitting}
              onChange={(event) => updateField('startsAt', event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="discount-ends-at" className="block text-xs font-semibold">
              Tanggal Akhir <span className="text-ink-muted">(opsional)</span>
            </label>
            <DateInput
              id="discount-ends-at"
              className="mt-1.5 w-full"
              value={form.endsAt}
              disabled={submitting}
              invalid={Boolean(fieldErrors.endsAt)}
              onChange={(event) => updateField('endsAt', event.target.value)}
            />
            <FieldError id="discount-ends-at-error" message={fieldErrors.endsAt} />
          </div>

          <label className="flex items-center gap-2.5 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              disabled={submitting}
              onChange={(event) => updateField('isActive', event.target.checked)}
              className="size-4 rounded border-pink-mist accent-pink-dark"
            />
            <span className="text-xs font-semibold text-ink">Aktifkan diskon</span>
          </label>
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
