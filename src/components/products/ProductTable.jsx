import {
  AlertCircle,
  ArrowUpRight,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  PackagePlus,
} from 'lucide-react'
import { formatRupiah } from '../../lib/format.js'

const COLUMN_COUNT = 8

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: COLUMN_COUNT }).map((__, columnIndex) => (
            <td key={columnIndex} className="px-4 py-4">
              <div className="h-3 w-full max-w-24 animate-pulse rounded bg-pink-light" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function ProductTable({
  products,
  loading,
  error,
  page,
  pageSize,
  hasFilters,
  total,
  onRetry,
  onAdd,
  onDetail,
  onEdit,
  onStock,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead className="bg-pink-light/60 text-[11px] uppercase tracking-wide text-ink-muted">
          <tr>
            <th scope="col" className="sticky top-0 w-14 bg-pink-light/60 px-4 py-3 font-semibold">
              No
            </th>
            <th scope="col" className="sticky top-0 bg-pink-light/60 px-4 py-3 font-semibold">
              Barcode
            </th>
            <th scope="col" className="sticky top-0 bg-pink-light/60 px-4 py-3 font-semibold">
              Nama
            </th>
            <th scope="col" className="sticky top-0 bg-pink-light/60 px-4 py-3 font-semibold">
              Category
            </th>
            <th scope="col" className="sticky top-0 bg-pink-light/60 px-4 py-3 text-right font-semibold">
              Harga
            </th>
            <th scope="col" className="sticky top-0 bg-pink-light/60 px-4 py-3 text-right font-semibold">
              Stock
            </th>
            <th scope="col" className="sticky top-0 bg-pink-light/60 px-4 py-3 font-semibold">
              Unit
            </th>
            <th scope="col" className="sticky top-0 bg-pink-light/60 px-4 py-3 text-right font-semibold">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pink-mist">
          {loading ? (
            <SkeletonRows />
          ) : error ? (
            <tr>
              <td colSpan={COLUMN_COUNT} className="px-4 py-16 text-center">
                <AlertCircle className="mx-auto size-7 text-error" />
                <p className="mt-3 text-sm font-semibold text-ink">{error}</p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-pink-dark px-4 py-2.5 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
                >
                  <RefreshCw className="size-3.5" />
                  Coba Lagi
                </button>
              </td>
            </tr>
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={COLUMN_COUNT} className="px-4 py-16 text-center">
                <PackagePlus className="mx-auto size-8 text-pink-dark/60" />
                <p className="mt-3 text-sm font-semibold text-ink">
                  {hasFilters
                    ? 'Tidak ada produk yang cocok dengan pencarian Anda.'
                    : total === 0
                      ? 'Belum ada produk. Tambahkan produk pertama Anda.'
                      : 'Tidak ada produk pada halaman ini.'}
                </p>
                {!hasFilters && total === 0 && (
                  <button
                    type="button"
                    onClick={onAdd}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-pink-dark px-4 py-2.5 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
                  >
                    <Plus className="size-3.5" />
                    Tambah Produk
                  </button>
                )}
              </td>
            </tr>
          ) : (
            products.map((product, index) => (
              <tr
                key={product.id}
                tabIndex={0}
                aria-label={`Lihat detail produk ${product.name}`}
                onClick={() => onDetail(product.id)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onDetail(product.id)
                  }
                }}
                className="cursor-pointer transition-colors hover:bg-pink-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-primary"
              >
                <td className="px-4 py-3 text-xs text-ink-muted">
                  {(page - 1) * pageSize + index + 1}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-ink-muted">
                  {product.barcode}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt=""
                      className="size-9 shrink-0 rounded-lg border border-pink-mist object-cover"
                    />
                    <span className="text-xs font-semibold text-ink">
                      {product.name}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-muted">
                  {product.categoryName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-ink">
                  {formatRupiah(product.price)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs">
                  <span className="font-semibold text-ink">{product.stock}</span>
                  {product.stock === 0 && (
                    <span className="ml-1.5 rounded-full bg-error/10 px-1.5 py-0.5 text-[10px] font-bold text-error">
                      Habis
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-muted">
                  {product.unit}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onDetail(product.id)
                      }}
                      aria-label={`Detail produk ${product.name}`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-pink-mist bg-surface px-2 text-[11px] font-semibold text-pink-dark transition hover:border-pink-primary hover:bg-pink-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                    >
                      Detail
                      <ArrowUpRight className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onEdit(product)
                      }}
                      aria-label={`Edit produk ${product.name}`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-pink-mist bg-surface px-2 text-[11px] font-semibold text-ink-muted transition hover:border-pink-primary hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onStock(product)
                      }}
                      aria-label={`Atur stok produk ${product.name}`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-pink-mist bg-surface px-2 text-[11px] font-semibold text-ink-muted transition hover:border-pink-primary hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                    >
                      <PackagePlus className="size-3.5" />
                      Atur Stok
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onDelete(product)
                      }}
                      aria-label={`Hapus produk ${product.name}`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-error/30 bg-surface px-2 text-[11px] font-semibold text-error transition hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
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
