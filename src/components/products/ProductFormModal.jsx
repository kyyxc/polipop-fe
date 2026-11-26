import { useRef, useState } from 'react'
import { AlertCircle, ImagePlus, LoaderCircle, Trash2, X } from 'lucide-react'
import { productImagePlaceholder } from '../../data/mockKasir.js'
import {
  readFileAsDataUrl,
  validateImageFile,
} from '../../lib/productService.js'
import Select from '../ui/Select.jsx'
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

function TextField({ id, label, error, required, className, ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-semibold text-ink">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass(Boolean(error))}
        {...props}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

function isValidAmount(value) {
  if (String(value ?? '').trim() === '') return false
  if (!/^\d+(\.\d{1,2})?$/.test(String(value).trim())) return false
  return Number(value) >= 0
}

function validateForm(form, imagePreview, isEdit) {
  const errors = {}
  const barcode = form.barcode.trim()
  const name = form.name.trim()
  const unit = form.unit.trim()

  if (!barcode) errors.barcode = 'Barcode wajib diisi'
  else if (barcode.length > 50) errors.barcode = 'Barcode maksimal 50 karakter'

  if (!name) errors.name = 'Nama produk wajib diisi'
  else if (name.length > 150) errors.name = 'Nama produk maksimal 150 karakter'

  if (!form.categoryId) errors.categoryId = 'Kategori wajib dipilih'

  if (!isValidAmount(form.price)) {
    errors.price = 'Harga jual tidak valid'
  }

  if (!isEdit && !isValidAmount(form.initial_stock)) {
    errors.initial_stock = 'Stok awal tidak valid'
  }

  if (!unit) errors.unit = 'Satuan wajib diisi'
  else if (unit.length > 30) errors.unit = 'Satuan maksimal 30 karakter'

  if (!isEdit && !imagePreview) errors.image = 'Gambar produk wajib diunggah'

  return errors
}

export default function ProductFormModal({
  open,
  mode = 'create',
  product = null,
  categories = [],
  onSubmit,
  onDeleteImage,
  onClose,
}) {
  const isEdit = mode === 'edit'
  const fileInputRef = useRef(null)
  const [form, setForm] = useState(() => ({
    barcode: product?.barcode ?? '',
    name: product?.name ?? '',
    categoryId: product?.categoryId ?? '',
    price: product?.price ?? '',
    initial_stock: product?.stock ?? '',
    unit: product?.unit ?? '',
  }))
  const [imagePreview, setImagePreview] = useState(product?.image ?? '')
  const [imageFile, setImageFile] = useState(null)
  const [confirmDeleteImage, setConfirmDeleteImage] = useState(false)
  const [deletingImage, setDeletingImage] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Hanya gambar asli yang sudah tersimpan yang bisa dihapus; placeholder
  // berarti produk memang tidak punya gambar, dan file baru belum diunggah.
  const canDeleteImage =
    isEdit &&
    Boolean(product?.id) &&
    Boolean(product.image) &&
    product.image !== productImagePlaceholder &&
    Boolean(imagePreview) &&
    !imageFile

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => (current[field] ? { ...current, [field]: '' } : current))
  }

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const message = validateImageFile(file)
    if (message) {
      setErrors((current) => ({ ...current, image: message }))
      event.target.value = ''
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setImagePreview(dataUrl)
      setImageFile(file)
      setConfirmDeleteImage(false)
      setErrors((current) => ({ ...current, image: '' }))
    } catch {
      setErrors((current) => ({ ...current, image: 'Gagal membaca gambar.' }))
    }
  }

  const handleDeleteImage = async () => {
    if (!canDeleteImage || deletingImage || submitting || !onDeleteImage) return

    setDeletingImage(true)
    try {
      await onDeleteImage(product.id)
      setImagePreview('')
      setImageFile(null)
      setConfirmDeleteImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setErrors((current) => ({ ...current, image: '' }))
    } catch {
      // Toast error sudah ditampilkan halaman induk; biarkan gambar tetap ada.
    } finally {
      setDeletingImage(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    const nextErrors = validateForm(form, imagePreview, isEdit)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      await onSubmit({
        barcode: form.barcode.trim(),
        name: form.name.trim(),
        categoryId: form.categoryId,
        price: Number(form.price),
        initial_stock: Number(form.initial_stock),
        unit: form.unit.trim(),
        imageFile,
      })
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
      busy={submitting || deletingImage}
      labelledBy="product-form-title"
      describedBy="product-form-description"
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex items-start justify-between gap-4 border-b border-pink-mist px-5 py-4">
          <div>
            <h2 id="product-form-title" className="text-base font-bold">
              {isEdit ? 'Edit Produk' : 'Tambah Produk'}
            </h2>
            <p id="product-form-description" className="mt-0.5 text-xs text-ink-muted">
              {isEdit
                ? 'Perbarui informasi produk. Stok tidak dapat diubah dari form ini.'
                : 'Produk dibuat terlebih dahulu, lalu gambar diunggah otomatis.'}
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
          <TextField
            id="product-barcode"
            label="Barcode"
            required
            value={form.barcode}
            onChange={(event) => updateField('barcode', event.target.value)}
            error={errors.barcode}
            placeholder="Contoh: 899100000011"
            maxLength={50}
            disabled={submitting}
            data-autofocus
          />
          <TextField
            id="product-name"
            label="Nama"
            required
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            error={errors.name}
            placeholder="Contoh: Kopi Susu"
            maxLength={150}
            disabled={submitting}
          />

          <div>
            <label htmlFor="product-category" className="block text-xs font-semibold text-ink">
              Category <span className="text-error">*</span>
            </label>
            <Select
              id="product-category"
              className="mt-1.5 w-full"
              value={form.categoryId}
              onChange={(event) => updateField('categoryId', event.target.value)}
              invalid={Boolean(errors.categoryId)}
              aria-describedby={errors.categoryId ? 'product-category-error' : undefined}
              disabled={submitting}
            >
              <option value="">Pilih kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <FieldError id="product-category-error" message={errors.categoryId} />
          </div>

          <TextField
            id="product-unit"
            label="Unit"
            required
            value={form.unit}
            onChange={(event) => updateField('unit', event.target.value)}
            error={errors.unit}
            placeholder="Contoh: pcs"
            maxLength={30}
            disabled={submitting}
          />

          <TextField
            id="product-price"
            label="Harga"
            required
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={form.price}
            onChange={(event) => updateField('price', event.target.value)}
            error={errors.price}
            placeholder="0"
            disabled={submitting}
          />

          {!isEdit && (
            <TextField
              id="product-initial-stock"
              label="Stok Awal"
              required
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.initial_stock}
              onChange={(event) => updateField('initial_stock', event.target.value)}
              error={errors.initial_stock}
              placeholder="0"
              disabled={submitting}
            />
          )}

          <div className="sm:col-span-2">
            <span className="block text-xs font-semibold text-ink">
              Image {!isEdit && <span className="text-error">*</span>}
            </span>
            <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-pink-mist bg-pink-light/40">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={`Preview gambar ${form.name || 'produk'}`}
                    className="size-full object-cover"
                  />
                ) : (
                  <ImagePlus className="size-7 text-pink-dark/50" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="product-image"
                  className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-pink-mist bg-surface px-3 text-xs font-semibold text-ink-muted transition hover:border-pink-primary hover:bg-pink-light hover:text-pink-dark focus-within:ring-2 focus-within:ring-pink-primary"
                >
                  {imagePreview ? 'Ganti gambar' : 'Pilih gambar'}
                  <input
                    ref={fileInputRef}
                    id="product-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={submitting || deletingImage}
                    aria-invalid={Boolean(errors.image)}
                    aria-describedby={errors.image ? 'product-image-error' : undefined}
                    className="sr-only"
                  />
                </label>
                <p className="mt-1.5 text-[11px] text-ink-muted">
                  JPG, JPEG, PNG, atau WebP. Maksimal 2 MB.
                </p>
                <FieldError id="product-image-error" message={errors.image} />
                {canDeleteImage && !confirmDeleteImage && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteImage(true)}
                    disabled={submitting || deletingImage}
                    className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-xl border border-error/30 px-3 text-xs font-semibold text-error transition hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="size-3.5" />
                    Hapus gambar
                  </button>
                )}
                {canDeleteImage && confirmDeleteImage && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-error/30 bg-error/5 px-3 py-2">
                    <span className="text-xs font-medium text-ink">
                      Yakin hapus gambar ini?
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteImage(false)}
                      disabled={deletingImage}
                      className="h-8 rounded-lg px-2 text-xs font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark disabled:opacity-60"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      disabled={deletingImage || submitting}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-error px-3 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingImage && (
                        <LoaderCircle className="size-3.5 animate-spin" />
                      )}
                      {deletingImage ? 'Menghapus...' : 'Ya, hapus'}
                    </button>
                  </div>
                )}
              </div>
            </div>
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
            {isEdit ? 'Simpan Perubahan' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
