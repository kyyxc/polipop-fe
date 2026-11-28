import { useEffect, useRef } from 'react'
import { AlertCircle, LoaderCircle, Pencil, RefreshCw, X } from 'lucide-react'
import {
  DiscountScopeLabel,
  DiscountStatusBadge,
  DiscountTypeBadge,
} from './DiscountBadges.jsx'
import {
  formatDiscountPeriod,
  formatDiscountValue,
} from '../../lib/discountDisplay.js'
import { formatDateTime, formatRupiah } from '../../lib/format.js'

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-pink-mist py-2.5 last:border-0">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-right text-xs font-semibold text-ink">{children}</dd>
    </div>
  )
}

export default function DiscountDetailModal({
  open,
  discount,
  loading,
  error,
  onRetry,
  onEdit,
  onClose,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="discount-detail-title"
      className="w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-pink-mist bg-surface p-0 text-ink shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4 border-b border-pink-mist px-5 py-4">
        <div>
          <h2 id="discount-detail-title" className="text-base font-bold">
            Detail Diskon
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Informasi lengkap diskon yang dipilih.
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

      <div className="max-h-[65vh] overflow-y-auto px-5 py-5">
        {loading ? (
          <div className="flex flex-col items-center py-10 text-ink-muted">
            <LoaderCircle className="size-6 animate-spin text-pink-dark" />
            <p className="mt-3 text-xs">Memuat detail diskon...</p>
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <AlertCircle className="mx-auto size-7 text-error" />
            <p className="mt-3 text-sm font-semibold text-ink">
              Gagal memuat detail diskon.
            </p>
            <p className="mt-1 text-xs text-ink-muted">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-pink-mist bg-surface px-4 py-2 text-xs font-semibold text-pink-dark transition hover:bg-pink-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
            >
              <RefreshCw className="size-3.5" />
              Coba lagi
            </button>
          </div>
        ) : discount ? (
          <dl>
            <DetailRow label="Nama">{discount.name}</DetailRow>
            <DetailRow label="Status">
              <DiscountStatusBadge status={discount.status} />
            </DetailRow>
            <DetailRow label="Cakupan">
              <DiscountScopeLabel scope={discount.scope} />
            </DetailRow>
            <DetailRow label="Jenis">
              <DiscountTypeBadge type={discount.type} />
            </DetailRow>
            <DetailRow label="Nilai">
              {formatDiscountValue(discount)}
            </DetailRow>
            <DetailRow label="Produk">
              {discount.productName || '-'}
            </DetailRow>
            <DetailRow label="Minimum transaksi">
              {discount.minTransactionAmount == null
                ? '-'
                : formatRupiah(discount.minTransactionAmount)}
            </DetailRow>
            <DetailRow label="Periode">
              {formatDiscountPeriod(discount)}
            </DetailRow>
            <DetailRow label="Aktif">
              {discount.isActive ? 'Ya' : 'Tidak'}
            </DetailRow>
            <DetailRow label="Dibuat">
              {discount.createdAt ? formatDateTime(discount.createdAt) : '-'}
            </DetailRow>
            <DetailRow label="Diperbarui">
              {discount.updatedAt ? formatDateTime(discount.updatedAt) : '-'}
            </DetailRow>
          </dl>
        ) : null}
      </div>

      <div className="flex justify-end gap-3 border-t border-pink-mist px-5 py-4">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="h-10 rounded-xl border border-pink-mist bg-surface px-4 text-sm font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
        >
          Tutup
        </button>
        <button
          type="button"
          disabled={!discount}
          onClick={() => onEdit(discount)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-pink-dark px-4 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Pencil className="size-4" />
          Edit
        </button>
      </div>
    </dialog>
  )
}
