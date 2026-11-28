import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Printer,
  ReceiptText,
} from 'lucide-react'
import { OUTLET_NAME } from '../config/app.js'
import { useCart } from '../context/cart-context.js'
import { formatDateLong, formatRupiah, formatTime } from '../lib/format.js'
import {
  calculateTotals,
  getItemCount,
  getTransactionById,
} from '../lib/transactionService.js'

const LIST_ROUTE_KEY = 'polipop-transactions-route'

function previousListRoute() {
  try {
    const saved = sessionStorage.getItem(LIST_ROUTE_KEY)
    if (saved?.startsWith('#/transactions')) return saved.slice(1)
  } catch {
    // Abaikan bila sessionStorage tidak tersedia.
  }
  return '/transactions'
}

function SummaryRow({ label, value, emphasized = false }) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${emphasized ? 'border-t border-pink-mist pt-3' : ''}`}
    >
      <dt
        className={`text-xs ${emphasized ? 'font-bold text-ink' : 'text-ink-muted'}`}
      >
        {label}
      </dt>
      <dd
        className={`shrink-0 text-right text-xs ${emphasized ? 'font-bold text-pink-dark' : 'font-semibold text-ink'}`}
      >
        {value}
      </dd>
    </div>
  )
}

export default function TransactionDetailPage({ transactionId, onNavigate }) {
  const { visibleProducts } = useCart()
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getTransactionById(transactionId)
        if (active) setTransaction(data)
      } catch (err) {
        if (active) setError(err.message || 'Transaksi tidak ditemukan.')
      } finally {
        if (active) setLoading(false)
      }
    }, 0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [transactionId, reloadKey])

  const availableProductIds = useMemo(
    () => new Set(visibleProducts.map((product) => product.id)),
    [visibleProducts],
  )

  const totals = useMemo(
    () => (transaction ? calculateTotals(transaction) : null),
    [transaction],
  )

  const backToList = () => onNavigate(previousListRoute())

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={backToList}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-pink-mist bg-surface px-4 text-xs font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </button>

        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-pink-light text-pink-dark">
            <ReceiptText className="size-5" />
          </span>
          <h1 className="text-lg font-bold tracking-tight text-ink">
            Detail Transaksi
          </h1>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="hidden h-10 items-center gap-2 rounded-xl bg-pink-dark px-4 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light sm:inline-flex"
        >
          <Printer className="size-4" />
          Cetak struk
        </button>
      </div>

      {loading ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-pink-mist bg-surface px-6 py-20 text-center">
          <LoaderCircle className="size-6 animate-spin text-pink-dark" />
          <p className="mt-3 text-sm text-ink-muted">Memuat detail transaksi...</p>
        </div>
      ) : error ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-error/30 bg-error/5 px-6 py-16 text-center">
          <AlertCircle className="size-8 text-error" />
          <p className="mt-3 text-sm font-semibold text-ink">{error}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="inline-flex items-center gap-2 rounded-xl bg-pink-dark px-4 py-2.5 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
            >
              Coba lagi
            </button>
            <button
              type="button"
              onClick={backToList}
              className="inline-flex items-center gap-2 rounded-xl border border-pink-mist bg-surface px-4 py-2.5 text-xs font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
            >
              <ArrowLeft className="size-4" />
              Kembali ke daftar
            </button>
          </div>
        </div>
      ) : (
        transaction &&
        totals && (
          <>
            <section
              aria-label="Informasi transaksi"
              className="mt-5 rounded-2xl border border-pink-mist bg-surface p-5 shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)] sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    No. Transaksi
                  </p>
                  <p className="mt-1 text-lg font-bold tracking-tight text-ink">
                    {transaction.no}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-bold text-success">
                    <CheckCircle2 className="size-3.5" />
                    Transaksi berhasil
                  </p>
                </div>
                <dl className="flex flex-wrap gap-x-8 gap-y-3">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Tanggal
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">
                      {formatDateLong(transaction.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Waktu
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">
                      {formatTime(transaction.createdAt)}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
              <section
                aria-label="Item transaksi"
                className="overflow-hidden rounded-2xl border border-pink-mist bg-surface shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)]"
              >
                <div className="border-b border-pink-mist px-5 py-4">
                  <h2 className="text-sm font-bold text-ink">Item transaksi</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                    <thead className="bg-pink-light/50 text-[11px] uppercase tracking-wide text-ink-muted">
                      <tr>
                        <th scope="col" className="w-12 px-4 py-3 font-semibold">
                          No.
                        </th>
                        <th scope="col" className="px-4 py-3 font-semibold">
                          Produk
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-right font-semibold"
                        >
                          Harga Satuan
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-right font-semibold"
                        >
                          Qty
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-right font-semibold"
                        >
                          Diskon
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-right font-semibold"
                        >
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pink-mist">
                      {totals.items.map((item, index) => (
                        <tr key={item.productId} className="align-top">
                          <td className="px-4 py-3 text-ink-muted">{index + 1}</td>
                          <td className="min-w-40 px-4 py-3 font-medium text-ink">
                            {availableProductIds.has(item.productId) ? (
                              <button
                                type="button"
                                onClick={() =>
                                  onNavigate(
                                    `/products/${encodeURIComponent(item.productId)}`,
                                  )
                                }
                                aria-label={`Lihat produk ${item.name}`}
                                className="text-left font-semibold text-pink-dark underline decoration-pink-light underline-offset-2 transition hover:decoration-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                              >
                                {item.name}
                              </button>
                            ) : (
                              <span>{item.name}</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-ink-muted">
                            {formatRupiah(item.price)}
                          </td>
                          <td className="px-4 py-3 text-right text-ink-muted">
                            {item.qty}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-ink-muted">
                            {formatRupiah(item.discount)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-ink">
                            {formatRupiah(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="border-t border-pink-mist px-5 py-3 text-[11px] text-ink-muted">
                  Total {getItemCount(transaction)} item
                </p>
              </section>

              <section
                aria-label="Ringkasan pembayaran"
                className="h-fit rounded-2xl border border-pink-mist bg-surface p-5 shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)]"
              >
                <h2 className="text-sm font-bold text-ink">
                  Ringkasan Pembayaran
                </h2>
                <dl className="mt-4 space-y-3">
                  <SummaryRow
                    label="Subtotal"
                    value={formatRupiah(totals.subtotal)}
                  />
                  <SummaryRow
                    label="Diskon Produk"
                    value={formatRupiah(totals.productDiscount)}
                  />
                  <SummaryRow
                    label="Subtotal Setelah Diskon Produk"
                    value={formatRupiah(totals.afterProductDiscount)}
                  />
                  <SummaryRow
                    label="Diskon Transaksi"
                    value={formatRupiah(totals.transactionDiscount)}
                  />
                  {transaction.discount?.name && (
                    <SummaryRow
                      label="Diskon Diterapkan"
                      value={transaction.discount.name}
                    />
                  )}
                  <SummaryRow
                    label="Total"
                    value={formatRupiah(totals.total)}
                    emphasized
                  />
                  <SummaryRow
                    label="Uang Diterima"
                    value={formatRupiah(totals.paid)}
                  />
                  <SummaryRow
                    label="Kembalian"
                    value={formatRupiah(totals.change)}
                  />
                </dl>
              </section>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-pink-dark text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light sm:hidden"
            >
              <Printer className="size-4" />
              Cetak struk
            </button>

            <section className="print-receipt" aria-hidden="true">
              <h1>Polipop Kasir</h1>
              <p>{OUTLET_NAME}</p>
              <hr />
              <div className="receipt-row">
                <span>No. Transaksi</span>
                <span>{transaction.no}</span>
              </div>
              <div className="receipt-row">
                <span>Tanggal</span>
                <span>{formatDateLong(transaction.createdAt)}</span>
              </div>
              <div className="receipt-row">
                <span>Waktu</span>
                <span>{formatTime(transaction.createdAt)}</span>
              </div>
              <hr />
              <table className="receipt-table">
                <thead>
                  <tr>
                    <th scope="col">Produk</th>
                    <th scope="col">Qty</th>
                    <th scope="col">Diskon</th>
                    <th scope="col">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {totals.items.map((item) => (
                    <tr key={item.productId}>
                      <td>{item.name}</td>
                      <td>{item.qty}</td>
                      <td>{formatRupiah(item.discount)}</td>
                      <td>{formatRupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <hr />
              <div className="receipt-row">
                <span>Subtotal</span>
                <span>{formatRupiah(totals.subtotal)}</span>
              </div>
              <div className="receipt-row">
                <span>Diskon Produk</span>
                <span>{formatRupiah(totals.productDiscount)}</span>
              </div>
              <div className="receipt-row">
                <span>Subtotal Setelah Diskon Produk</span>
                <span>{formatRupiah(totals.afterProductDiscount)}</span>
              </div>
              <div className="receipt-row">
                <span>Diskon Transaksi</span>
                <span>{formatRupiah(totals.transactionDiscount)}</span>
              </div>
              {transaction.discount?.name && (
                <div className="receipt-row">
                  <span>Diskon Diterapkan</span>
                  <span>{transaction.discount.name}</span>
                </div>
              )}
              <hr />
              <div className="receipt-row receipt-total">
                <span>Total</span>
                <span>{formatRupiah(totals.total)}</span>
              </div>
              <div className="receipt-row">
                <span>Uang Diterima</span>
                <span>{formatRupiah(totals.paid)}</span>
              </div>
              <div className="receipt-row">
                <span>Kembalian</span>
                <span>{formatRupiah(totals.change)}</span>
              </div>
              <hr />
              <p className="receipt-thanks">Terima kasih telah berbelanja.</p>
            </section>
          </>
        )
      )}
    </main>
  )
}
