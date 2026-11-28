import {
  AlertCircle,
  BadgePercent,
  LoaderCircle,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Wallet,
} from 'lucide-react'
import { productImagePlaceholder } from '../../config/images.js'
import { formatRupiah } from '../../lib/format.js'

const CASH_DENOMINATIONS = [2000, 5000, 10000, 20000, 50000, 100000]

function denominationLabel(value) {
  return value % 1000 === 0 ? `${value / 1000}rb` : String(value)
}

export default function CartPanel({
  cart,
  products,
  preview,
  previewLoading,
  previewError,
  amountPaid,
  onAmountChange,
  subtotal,
  discountAmount,
  total,
  change,
  cartError,
  paymentError,
  submitError,
  processing,
  onSubmit,
  onQtyChange,
  onRemove,
  className = '',
}) {
  const paidAmount = Number(amountPaid) || 0
  const isPayDisabled =
    cart.length === 0 || !preview || previewLoading || paidAmount < total || processing
  const previewItems = preview?.items ?? []
  const hasDiscount =
    Boolean(preview) && preview.productDiscount + preview.transactionDiscount > 0

  const findPreviewItem = (productId) =>
    previewItems.find(
      (entry) => String(entry.productId ?? entry.id) === productId,
    )

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <header className="flex shrink-0 items-center justify-between border-b border-pink-mist px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-[18px] text-pink-dark" />
          <h2 className="text-sm font-bold text-ink">Keranjang</h2>
        </div>
        <span className="rounded-full bg-pink-light px-2.5 py-1 text-[11px] font-semibold text-pink-dark">
          {cart.length} item
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {cartError && (
          <div
            role="alert"
            className="mb-3 flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-3 py-2.5 text-xs font-medium text-error"
          >
            <AlertCircle className="mt-px size-3.5 shrink-0" />
            {cartError}
          </div>
        )}

        {cart.length === 0 ? (
          <div className="flex h-full min-h-32 flex-col items-center justify-center text-center">
            <ShoppingCart className="size-8 text-ink-muted/60" />
            <p className="mt-3 text-sm font-semibold text-ink">
              Keranjang masih kosong.
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Pilih produk untuk mulai transaksi.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {cart.map((item) => {
              const product = products.find(
                (entry) => entry.id === item.productId,
              )
              const stock = product?.stock ?? item.qty
              const pricedItem = findPreviewItem(item.productId)
              const originalLineTotal = item.price * item.qty
              const lineTotal = pricedItem?.subtotal ?? originalLineTotal
              const lineDiscount = pricedItem?.discount ?? 0

              return (
                <li
                  key={item.productId}
                  className="rounded-xl border border-pink-mist bg-surface p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <img
                        src={product?.image || productImagePlaceholder}
                        alt={`Gambar ${item.name}`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src = productImagePlaceholder
                        }}
                        className="size-9 shrink-0 rounded-lg border border-pink-mist bg-pink-light/40 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-muted">
                          {formatRupiah(item.price)} / item
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item.productId)}
                      aria-label={`Hapus ${item.name} dari keranjang`}
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center rounded-lg border border-pink-mist">
                      <button
                        type="button"
                        aria-label="Kurangi jumlah"
                        onClick={() => onQtyChange(item.productId, item.qty - 1)}
                        className="flex size-8 items-center justify-center rounded-l-lg text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={stock}
                        aria-label={`Jumlah ${item.name}`}
                        value={item.qty}
                        onChange={(event) => {
                          const next = Number(event.target.value)
                          if (Number.isInteger(next) && next >= 1) {
                            onQtyChange(item.productId, next)
                          }
                        }}
                        className="h-8 w-10 border-x border-pink-mist bg-transparent text-center text-xs font-semibold text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        aria-label="Tambah jumlah"
                        onClick={() => onQtyChange(item.productId, item.qty + 1)}
                        className="flex size-8 items-center justify-center rounded-r-lg text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-ink">
                        {formatRupiah(lineTotal)}
                      </p>
                      {lineDiscount > 0 && (
                        <p className="mt-0.5 text-[10px] font-semibold text-pink-dark">
                          Hemat {formatRupiah(lineDiscount)}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 space-y-4 border-t border-pink-mist bg-cream/40 px-5 py-4">
        {previewLoading && (
          <p className="flex items-center gap-2 text-xs text-ink-muted">
            <LoaderCircle className="size-3.5 animate-spin" />
            Menghitung diskon dan total dari server...
          </p>
        )}

        {previewError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-3 py-2.5 text-xs font-medium text-error"
          >
            <AlertCircle className="mt-px size-3.5 shrink-0" />
            <div>
              <p>{previewError}</p>
              <p className="mt-0.5 font-normal text-ink-muted">
                Keranjang tetap disimpan. Ubah jumlah produk untuk menghitung ulang.
              </p>
            </div>
          </div>
        )}

        {preview && (
          <div
            className={[
              'rounded-xl border p-3',
              hasDiscount
                ? 'border-pink-primary/35 bg-pink-light/50'
                : 'border-pink-mist bg-surface/70',
            ].join(' ')}
          >
            <div className="flex items-start gap-2.5">
              <span
                className={[
                  'flex size-8 shrink-0 items-center justify-center rounded-lg',
                  hasDiscount
                    ? 'bg-pink-dark text-white'
                    : 'bg-pink-light text-pink-dark',
                ].join(' ')}
              >
                <BadgePercent className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-pink-dark">
                  {hasDiscount ? 'Diskon otomatis aktif' : 'Belum ada diskon aktif'}
                </p>
                <p className="mt-0.5 text-[10px] text-ink-muted">
                  {hasDiscount
                    ? 'Sudah dihitung pada total di bawah.'
                    : 'Total belum mendapat potongan.'}
                </p>
              </div>
              {hasDiscount && (
                <strong className="shrink-0 text-sm font-bold text-pink-dark">
                  -{formatRupiah(discountAmount)}
                </strong>
              )}
            </div>

            {hasDiscount && (
              <div className="mt-2.5 space-y-1 border-t border-pink-primary/20 pt-2 text-[11px]">
                {preview.productDiscount > 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink-muted">Diskon produk</span>
                    <span className="font-semibold text-ink">
                      -{formatRupiah(preview.productDiscount)}
                    </span>
                  </div>
                )}
                {preview.transactionDiscount > 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink-muted">Diskon transaksi</span>
                    <span className="font-semibold text-ink">
                      -{formatRupiah(preview.transactionDiscount)}
                    </span>
                  </div>
                )}
                {preview.discount?.name && (
                  <p className="pt-0.5 text-[10px] text-ink-muted">
                    Promo:{' '}
                    <span className="font-semibold text-ink">
                      {preview.discount.name}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <dl className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="font-medium text-ink">{formatRupiah(subtotal)}</dd>
          </div>
          {discountAmount > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">Total diskon</dt>
              <dd className="font-medium text-pink-dark">
                -{formatRupiah(discountAmount)}
              </dd>
            </div>
          )}
          <div
            aria-live="polite"
            aria-atomic="true"
            className="flex items-center justify-between border-t border-pink-mist pt-2"
          >
            <dt className="font-bold text-ink">Total</dt>
            <dd className="text-lg font-bold text-ink">{formatRupiah(total)}</dd>
          </div>
        </dl>

        <div className="space-y-1.5">
          <label htmlFor="amount-paid" className="block text-xs font-semibold text-ink">
            Uang diterima
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-muted">
              Rp
            </span>
            <input
              id="amount-paid"
              type="number"
              min="0"
              inputMode="numeric"
              value={amountPaid}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="0"
              aria-invalid={Boolean(paymentError)}
              className="h-11 w-full rounded-xl border border-pink-mist bg-surface pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-pink-primary focus:ring-4 focus:ring-pink-light/70"
            />
          </div>
          {paymentError && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-error">
              <AlertCircle className="size-3.5 shrink-0" />
              {paymentError}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-ink-muted">
              Pecahan uang
            </span>
            <button
              type="button"
              onClick={() => onAmountChange('')}
              disabled={!amountPaid || processing}
              className="text-[11px] font-semibold text-pink-dark transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:no-underline"
            >
              Atur ulang
            </button>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {CASH_DENOMINATIONS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onAmountChange(String(paidAmount + value))}
                disabled={processing}
                title={`Tambah ${formatRupiah(value)}`}
                aria-label={`Tambah ${formatRupiah(value)} ke uang diterima`}
                className="h-8 rounded-lg border border-pink-mist bg-surface text-[11px] font-semibold text-ink transition hover:border-pink-primary hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-pink-mist disabled:hover:bg-surface disabled:hover:text-ink"
              >
                {denominationLabel(value)}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-ink-muted">
            Klik pecahan untuk menambah uang diterima.
          </p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-muted">Kembalian</span>
          <strong className="font-bold text-ink">{formatRupiah(change)}</strong>
        </div>

        {submitError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-3 py-2.5 text-xs font-medium text-error"
          >
            <AlertCircle className="mt-px size-3.5 shrink-0" />
            {submitError}
          </div>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={isPayDisabled}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-pink-dark text-sm font-semibold text-white shadow-[0_12px_24px_-12px_#c2607a] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
        >
          {processing ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Memproses...
            </>
          ) : previewLoading ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Menghitung total...
            </>
          ) : (
            <>
              <Wallet className="size-4" />
              Bayar
            </>
          )}
        </button>
      </div>
    </div>
  )
}
