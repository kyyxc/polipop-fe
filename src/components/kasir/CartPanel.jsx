import {
  AlertCircle,
  LoaderCircle,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Wallet,
} from 'lucide-react'
import Select from '../ui/Select.jsx'
import { formatRupiah } from '../../lib/format.js'

export default function CartPanel({
  cart,
  products,
  discounts,
  discountId,
  onDiscountChange,
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
  const isPayDisabled = cart.length === 0 || paidAmount < total || processing

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
              const stock =
                products.find((product) => product.id === item.productId)?.stock ??
                item.qty

              return (
                <li
                  key={item.productId}
                  className="rounded-xl border border-pink-mist bg-surface p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-muted">
                        {formatRupiah(item.price)} / item
                      </p>
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
                    <p className="text-sm font-bold text-ink">
                      {formatRupiah(item.price * item.qty)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 space-y-4 border-t border-pink-mist bg-cream/40 px-5 py-4">
        <div className="space-y-1.5">
          <label htmlFor="discount" className="block text-xs font-semibold text-ink">
            Diskon (opsional)
          </label>
          <Select
            id="discount"
            size="sm"
            className="w-full"
            value={discountId}
            onChange={(event) => onDiscountChange(event.target.value)}
          >
            <option value="">Tanpa diskon</option>
            {discounts.map((discount) => (
              <option key={discount.id} value={discount.id}>
                {discount.label}
              </option>
            ))}
          </Select>
        </div>

        <dl className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="font-medium text-ink">{formatRupiah(subtotal)}</dd>
          </div>
          {discountAmount > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">Diskon</dt>
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
