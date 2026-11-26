import { AlertCircle, Package } from 'lucide-react'
import { formatDateTime } from '../../lib/format.js'
import { signedQuantity } from '../../lib/mutationDisplay.js'
import MutationTypeBadge from '../stock/MutationTypeBadge.jsx'

export default function ProductMutationList({ items = [], loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="space-y-2" aria-label="Memuat riwayat mutasi">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-xl bg-pink-light/50"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-6 text-center">
        <AlertCircle className="mx-auto size-6 text-error" />
        <p className="mt-2 text-xs font-semibold text-ink">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-xl bg-pink-dark px-3 py-2 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-pink-mist bg-pink-light/30 px-4 py-6 text-center">
        <Package className="mx-auto size-6 text-pink-dark/50" />
        <p className="mt-2 text-xs font-semibold text-ink">
          Belum ada mutasi stok untuk produk ini.
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-pink-mist overflow-hidden rounded-xl border border-pink-mist">
      {items.map((entry) => (
        <li
          key={entry.id}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-xs"
        >
          <span className="w-32 shrink-0 text-ink-muted">
            {formatDateTime(entry.createdAt)}
          </span>
          <MutationTypeBadge type={entry.type} />
          <span className="font-semibold text-ink">
            {signedQuantity(entry)} {entry.productUnit}
          </span>
          <span className="text-ink-muted">
            {entry.previousStock} → {entry.stockAfter}
          </span>
          {entry.notes && (
            <span className="w-full text-[11px] text-ink-muted">
              {entry.notes}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
