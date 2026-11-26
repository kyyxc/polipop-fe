import { AlertCircle, History, Link2, Package } from 'lucide-react'
import { formatDateTime } from '../../lib/format.js'
import { signedQuantity } from '../../lib/mutationDisplay.js'
import MutationTypeBadge from './MutationTypeBadge.jsx'

function ReferenceCell({ reference, onTransaction }) {
  if (!reference?.id) return <span className="text-ink-muted">-</span>

  if (reference.linkable === false) {
    return (
      <span
        title={reference.id}
        className="font-mono text-[11px] text-ink-muted"
      >
        {reference.no}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onTransaction(reference.id)}
      aria-label={`Buka transaksi ${reference.no}`}
      className="inline-flex items-center gap-1 rounded font-mono text-[11px] font-semibold text-pink-dark transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
    >
      <Link2 className="size-3" />
      {reference.no}
    </button>
  )
}

function SkeletonRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr key={index} className="animate-pulse">
      <td className="px-4 py-4" colSpan={7}>
        <div className="flex items-center gap-4">
          <div className="h-3 w-28 rounded bg-pink-light" />
          <div className="h-3 w-40 rounded bg-pink-light" />
          <div className="h-5 w-20 rounded-full bg-pink-light" />
          <div className="ml-auto h-3 w-16 rounded bg-pink-light" />
        </div>
      </td>
    </tr>
  ))
}

function StateContent({ error, hasFilters, onRetry }) {
  if (error) {
    return (
      <div className="flex flex-col items-center text-center">
        <AlertCircle className="size-7 text-error" />
        <p className="mt-3 text-sm font-semibold text-ink">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-pink-dark px-4 py-2 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center">
      <Package className="size-8 text-pink-dark/50" />
      <p className="mt-3 text-sm font-semibold text-ink">
        {hasFilters
          ? 'Tidak ada mutasi yang cocok dengan filter.'
          : 'Belum ada perubahan stok.'}
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        {hasFilters
          ? 'Coba ubah kata kunci, tipe, atau rentang tanggal.'
          : 'Mutasi stok akan muncul setelah stok ditambahkan atau transaksi dibuat.'}
      </p>
    </div>
  )
}

export default function StockHistoryList({
  items,
  loading,
  error,
  page,
  pageSize,
  hasFilters,
  onRetry,
  onProduct,
  onHistory,
  onTransaction,
}) {
  const showState = loading || Boolean(error) || items.length === 0

  return (
    <div className="overflow-hidden rounded-2xl border border-pink-mist bg-surface shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)]">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-xs">
          <thead className="bg-pink-light/50 text-[11px] uppercase tracking-wide text-ink-muted">
            <tr>
              <th scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                Waktu
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Produk
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Tipe
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Jumlah
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Alasan
              </th>
              <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">
                Referensi
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-mist">
            {loading ? (
              <SkeletonRows />
            ) : showState ? (
              <tr>
                <td colSpan={7} className="px-4 py-14">
                  <StateContent
                    error={error}
                    hasFilters={hasFilters}
                    onRetry={onRetry}
                  />
                </td>
              </tr>
            ) : (
              items.map((entry) => (
                <tr key={entry.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                    {formatDateTime(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onProduct(entry.productId)}
                      className="rounded text-left text-sm font-semibold text-ink transition hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                    >
                      {entry.productName}
                    </button>
                    {entry.productBarcode && (
                      <p className="mt-0.5 font-mono text-[11px] text-ink-muted">
                        {entry.productBarcode}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <MutationTypeBadge type={entry.type} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-ink">
                    {signedQuantity(entry)}{' '}
                    <span className="font-normal text-ink-muted">
                      {entry.productUnit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {entry.notes || '-'}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <ReferenceCell
                      reference={entry.reference}
                      onTransaction={onTransaction}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onHistory(entry.productId)}
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-pink-mist bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-ink-muted transition hover:border-pink-primary hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                    >
                      <History className="size-3.5" />
                      Riwayat
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!showState && (
          <p className="border-t border-pink-mist px-4 py-2 text-[11px] text-ink-muted">
            Menampilkan {(page - 1) * pageSize + 1}–
            {(page - 1) * pageSize + items.length} mutasi pada halaman ini.
          </p>
        )}
      </div>

      <div className="md:hidden">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="animate-pulse space-y-2 rounded-xl border border-pink-mist p-4"
              >
                <div className="h-3 w-24 rounded bg-pink-light" />
                <div className="h-4 w-40 rounded bg-pink-light" />
                <div className="h-5 w-20 rounded-full bg-pink-light" />
              </div>
            ))}
          </div>
        ) : showState ? (
          <div className="px-4 py-14">
            <StateContent
              error={error}
              hasFilters={hasFilters}
              onRetry={onRetry}
            />
          </div>
        ) : (
          <ul className="divide-y divide-pink-mist">
            {items.map((entry) => (
              <li key={entry.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onProduct(entry.productId)}
                      className="rounded text-left text-sm font-semibold text-ink transition hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                    >
                      {entry.productName}
                    </button>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                  <MutationTypeBadge type={entry.type} />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-cream/50 px-3 py-2.5">
                  <span className="text-xs font-semibold text-ink">
                    {signedQuantity(entry)} {entry.productUnit}
                  </span>
                  <span className="truncate text-[11px] text-ink-muted">
                    {entry.notes || '-'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onHistory(entry.productId)}
                    className="inline-flex items-center gap-1 rounded-lg border border-pink-mist bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-ink-muted transition hover:border-pink-primary hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                  >
                    <History className="size-3.5" />
                    Riwayat
                  </button>
                  {entry.reference?.id && (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-pink-mist bg-surface px-2.5 py-1.5 font-mono text-[11px] font-semibold text-pink-dark">
                      <Link2 className="size-3.5" />
                      <ReferenceCell
                        reference={entry.reference}
                        onTransaction={onTransaction}
                      />
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
