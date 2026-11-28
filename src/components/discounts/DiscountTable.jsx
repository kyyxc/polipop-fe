import {
  AlertCircle,
  BadgePercent,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import {
  DiscountScopeLabel,
  DiscountStatusBadge,
  DiscountTypeBadge,
} from './DiscountBadges.jsx'
import {
  formatDiscountPeriod,
  formatDiscountValue,
} from '../../lib/discountDisplay.js'

function SkeletonRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr key={index} className="border-b border-pink-mist last:border-0">
      {Array.from({ length: 7 }, (__, cell) => (
        <td key={cell} className="px-4 py-4">
          <div
            className={`h-3 animate-pulse rounded bg-pink-light ${
              cell === 0 ? 'w-6' : cell === 6 ? 'ml-auto w-24' : 'w-24'
            }`}
          />
        </td>
      ))}
    </tr>
  ))
}

export default function DiscountTable({
  discounts,
  loading,
  error,
  page,
  pageSize,
  onRetry,
  onAdd,
  onDetail,
  onEdit,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <thead className="bg-pink-light/50 text-[11px] uppercase tracking-wide text-ink-muted">
          <tr>
            <th scope="col" className="w-16 px-4 py-3 font-semibold">
              No.
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Nama Diskon
            </th>
            <th scope="col" className="w-40 px-4 py-3 font-semibold">
              Cakupan
            </th>
            <th scope="col" className="w-32 px-4 py-3 font-semibold">
              Nilai
            </th>
            <th scope="col" className="w-52 px-4 py-3 font-semibold">
              Periode
            </th>
            <th scope="col" className="w-32 px-4 py-3 font-semibold">
              Status
            </th>
            <th scope="col" className="w-44 px-4 py-3 text-right font-semibold">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pink-mist">
          {loading ? (
            <SkeletonRows />
          ) : error ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center">
                <AlertCircle className="mx-auto size-7 text-error" />
                <p className="mt-3 text-sm font-semibold text-ink">
                  Gagal memuat diskon.
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
          ) : discounts.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-14 text-center">
                <BadgePercent className="mx-auto size-8 text-ink-muted" />
                <p className="mt-3 text-sm font-semibold text-ink">
                  Belum ada diskon
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  Buat diskon pertama untuk produk atau transaksi Anda.
                </p>
                <button
                  type="button"
                  onClick={onAdd}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-pink-dark px-4 py-2 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
                >
                  <Plus className="size-3.5" />
                  Tambah diskon
                </button>
              </td>
            </tr>
          ) : (
            discounts.map((discount, index) => (
              <tr
                key={discount.id}
                className="transition-colors hover:bg-pink-light/30"
              >
                <td className="px-4 py-3 text-xs text-ink-muted">
                  {(page - 1) * pageSize + index + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1.5">
                    <span className="font-medium text-ink">{discount.name}</span>
                    <DiscountTypeBadge type={discount.type} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <DiscountScopeLabel scope={discount.scope} />
                    <span className="max-w-40 truncate text-xs text-ink-muted">
                      {discount.productName || 'Semua transaksi'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-ink">
                  {formatDiscountValue(discount)}
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">
                  {formatDiscountPeriod(discount)}
                </td>
                <td className="px-4 py-3">
                  <DiscountStatusBadge status={discount.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onDetail(discount)}
                      aria-label={`Detail ${discount.name}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-pink-mist bg-surface px-2 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-pink-primary hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                    >
                      <Eye className="size-3.5" />
                      Detail
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(discount)}
                      aria-label={`Edit ${discount.name}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-pink-mist bg-surface px-2 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-pink-primary hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(discount)}
                      aria-label={`Hapus ${discount.name}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-error/25 bg-surface px-2 py-1.5 text-xs font-semibold text-error transition hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
                    >
                      <Trash2 className="size-3.5" />
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
