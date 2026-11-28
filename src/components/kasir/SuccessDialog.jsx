import { useEffect, useRef } from 'react'
import { CheckCircle2, Printer, X } from 'lucide-react'
import { OUTLET_NAME } from '../../config/app.js'
import { formatRupiah } from '../../lib/format.js'

export default function SuccessDialog({ transaction, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (transaction && !dialog.open) dialog.showModal()
    if (!transaction && dialog.open) dialog.close()
  }, [transaction])

  return (
    <>
      <dialog
        ref={dialogRef}
        onClose={onClose}
        aria-labelledby="success-title"
        className="w-[calc(100%-2rem)] max-w-md rounded-3xl border border-pink-mist bg-surface p-0 text-ink shadow-2xl"
      >
        {transaction && (
          <div className="p-6">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Tutup dialog"
                className="flex size-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-1 flex flex-col items-center text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="size-7" />
              </span>
              <h2 id="success-title" className="mt-3 text-lg font-bold text-ink">
                Transaksi berhasil
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                No. transaksi {transaction.no}
              </p>
            </div>

            <dl className="mt-5 space-y-2 rounded-2xl border border-pink-mist bg-cream/60 p-4 text-sm">
              {(transaction.productDiscount > 0 ||
                transaction.discountAmount > 0) && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Total diskon</dt>
                  <dd className="font-semibold text-pink-dark">
                    -{formatRupiah(
                      (transaction.productDiscount ?? 0) +
                        (transaction.discountAmount ?? 0),
                    )}
                  </dd>
                </div>
              )}
              {transaction.discount?.name && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Promo</dt>
                  <dd className="font-medium text-ink">
                    {transaction.discount.name}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-pink-mist pt-2">
                <dt className="text-ink-muted">Total</dt>
                <dd className="font-bold text-ink">{formatRupiah(transaction.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Uang diterima</dt>
                <dd className="font-medium text-ink">
                  {formatRupiah(transaction.paid)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-pink-mist pt-2">
                <dt className="font-semibold text-ink">Kembalian</dt>
                <dd className="font-bold text-pink-dark">
                  {formatRupiah(transaction.change)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-pink-mist bg-surface text-xs font-semibold text-pink-dark transition hover:bg-pink-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
              >
                <Printer className="size-4" />
                Cetak struk
              </button>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="h-11 flex-1 rounded-xl bg-pink-dark text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </dialog>

      {transaction && (
        <section className="print-receipt" aria-hidden="true">
          <h1>Polipop Kasir</h1>
          <p>{OUTLET_NAME}</p>
          <p>No. transaksi: {transaction.no}</p>
          <p>
            Tanggal:{' '}
            {new Date(transaction.createdAt).toLocaleString('id-ID')}
          </p>
          <hr />
          {transaction.items.map((item) => (
            <div key={item.productId || item.id}>
              <span>
                {item.name} x {item.qty}
                {item.discount > 0
                  ? ` (diskon -${formatRupiah(item.discount)})`
                  : ''}
              </span>
              <span>
                {formatRupiah(item.subtotal ?? item.price * item.qty)}
              </span>
            </div>
          ))}
          <hr />
          <div>
            <span>Subtotal</span>
            <span>{formatRupiah(transaction.subtotal)}</span>
          </div>
          <div>
            <span>Diskon produk</span>
            <span>-{formatRupiah(transaction.productDiscount ?? 0)}</span>
          </div>
          <div>
            <span>Diskon transaksi</span>
            <span>-{formatRupiah(transaction.discountAmount ?? 0)}</span>
          </div>
          {transaction.discount?.name && (
            <div>
              <span>Diskon diterapkan</span>
              <span>{transaction.discount.name}</span>
            </div>
          )}
          <div>
            <strong>Total</strong>
            <strong>{formatRupiah(transaction.total)}</strong>
          </div>
          <div>
            <span>Uang diterima</span>
            <span>{formatRupiah(transaction.paid)}</span>
          </div>
          <div>
            <strong>Kembalian</strong>
            <strong>{formatRupiah(transaction.change)}</strong>
          </div>
          <hr />
          <p>Terima kasih telah berbelanja.</p>
        </section>
      )}
    </>
  )
}
