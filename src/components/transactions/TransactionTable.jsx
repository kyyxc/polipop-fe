import {
  AlertCircle,
  ArrowUpRight,
  FolderOpen,
  RefreshCw,
  SearchX,
} from 'lucide-react'
import { formatDateTime, formatRupiah } from '../../lib/format.js'
import {
  calculateTotals,
  getItemCount,
} from '../../lib/transactionService.js'

const COLUMN_COUNT = 8

function SkeletonRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr key={index} className="border-b border-pink-mist last:border-0">
      {Array.from({ length: COLUMN_COUNT }, (_, cell) => (
        <td key={cell} className="px-4 py-4">
          <div className="h-3 w-16 animate-pulse rounded bg-pink-light" />
        </td>
      ))}
    </tr>
  ))
}

export default function TransactionTable({
  transactions,
  loading,
  error,
  page,
  pageSize,
  hasFilters,
  onRetry,
  onDetail,
}) {
  return (
    <div className="max-h-[70vh] overflow-auto">
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-pink-light/95 text-[11px] uppercase tracking-wide text-ink-muted backdrop-blur">
          <tr>
            <th scope="col" className="w-14 px-4 py-3 font-semibold">
              No.
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              No. Transaksi
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Tanggal &amp; Waktu
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              Jumlah Item
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              Subtotal
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              Diskon
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              Total
            </th>
            <th scope="col" className="w-24 px-4 py-3 text-right font-semibold">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pink-mist">
          {loading ? (
            <SkeletonRows />
          ) : error ? (
            <tr>
              <td colSpan={COLUMN_COUNT} className="px-4 py-14 text-center">
                <AlertCircle className="mx-auto size-8 text-error" />
                <p className="mt-3 text-sm font-semibold text-ink">
                  Gagal memuat transaksi.
                </p>
                <p className="mt-1 text-xs text-ink-muted">{error}</p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-pink-mist bg-surface px-4 py-2 text-xs font-semibold text-pink-dark transition hover:border-pink-primary hover:bg-pink-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                >
                  <RefreshCw className="size-3.5" />
                  Coba lagi
                </button>
              </td>
            </tr>
          ) : transactions.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_COUNT} className="px-4 py-16 text-center">
                {hasFilters ? (
                  <SearchX className="mx-auto size-8 text-ink-muted" />
                ) : (
                  <FolderOpen className="mx-auto size-8 text-ink-muted" />
                )}
                <p className="mt-3 text-sm font-semibold text-ink">
                  {hasFilters
                    ? 'Tidak ada transaksi yang cocok dengan filter.'
                    : 'Belum ada transaksi.'}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {hasFilters
                    ? 'Coba ubah kata kunci atau rentang tanggal.'
                    : 'Transaksi dari Kasir akan muncul di sini.'}
                </p>
              </td>
            </tr>
          ) : (
            transactions.map((transaction, index) => {
              const totals = calculateTotals(transaction)
              const totalDiscount =
                totals.productDiscount + totals.transactionDiscount

                return (
                  <tr
                    key={transaction.id}
                    tabIndex={0}
                    aria-label={`Lihat detail transaksi ${transaction.no}`}
                    onClick={() => onDetail(transaction.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onDetail(transaction.id)
                      }
                    }}
                    className="cursor-pointer transition-colors hover:bg-pink-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-primary"
                  >
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-ink">
                      {transaction.no}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-muted">
                      {formatDateTime(transaction.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-ink-muted">
                      {getItemCount(transaction)} item
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-ink">
                      {formatRupiah(totals.subtotal)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-ink-muted">
                      {formatRupiah(totalDiscount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold text-pink-dark">
                      {formatRupiah(totals.total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDetail(transaction.id)
                        }}
                        aria-label={`Detail transaksi ${transaction.no}`}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-pink-mist bg-surface px-2.5 text-[11px] font-semibold text-pink-dark transition hover:border-pink-primary hover:bg-pink-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                      >
                        Detail
                        <ArrowUpRight className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })
          )}
        </tbody>
      </table>
    </div>
  )
}
