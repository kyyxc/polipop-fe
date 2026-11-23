import { useState } from 'react'
import { AlertTriangle, LoaderCircle, X } from 'lucide-react'
import Modal from './Modal.jsx'

export default function DeleteProductDialog({
  open,
  product,
  title = 'Nonaktifkan Produk',
  description = 'Yakin ingin menonaktifkan produk ini?',
  confirmLabel = 'Hapus',
  onSubmit,
  onClose,
}) {
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await onSubmit(product)
    } catch {
      // Toast error sudah ditampilkan halaman induk; dialog sengaja tetap terbuka.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      labelledBy="delete-product-title"
      describedBy="delete-product-description"
      className="max-w-md"
    >
      <div className="flex items-start justify-between gap-4 border-b border-pink-mist px-5 py-4">
        <h2 id="delete-product-title" className="text-base font-bold text-ink">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup dialog"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="px-5 py-5">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-error/10 text-error">
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <p id="delete-product-description" className="text-sm font-semibold text-ink">
              {description}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              <span className="font-semibold text-ink">{product?.name ?? '-'}</span>{' '}
              ({product?.barcode ?? '-'}) akan hilang dari daftar produk aktif dan
              tidak dapat dipakai pada transaksi baru. Riwayat transaksi dan
              mutasi stok tetap tersimpan.
            </p>
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
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-error px-4 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error/20 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting && <LoaderCircle className="size-4 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
