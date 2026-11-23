import { AlertCircle, FolderOpen, Pencil, Plus, RefreshCw, Tag, Trash2 } from 'lucide-react'

function SkeletonRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr key={index} className="border-b border-pink-mist last:border-0">
      <td className="px-4 py-4">
        <div className="h-3 w-6 animate-pulse rounded bg-pink-light" />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="size-8 animate-pulse rounded-lg bg-pink-light" />
          <div className="h-3 w-32 animate-pulse rounded bg-pink-light" />
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="ml-auto h-3 w-16 animate-pulse rounded bg-pink-light" />
      </td>
      <td className="px-4 py-4">
        <div className="ml-auto flex justify-end gap-2">
          <div className="h-8 w-14 animate-pulse rounded-lg bg-pink-light" />
          <div className="h-8 w-14 animate-pulse rounded-lg bg-pink-light" />
        </div>
      </td>
    </tr>
  ))
}

export default function CategoryTable({
  categories,
  loading,
  error,
  page,
  pageSize,
  onRetry,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead className="bg-pink-light/50 text-[11px] uppercase tracking-wide text-ink-muted">
          <tr>
            <th scope="col" className="w-16 px-4 py-3 font-semibold">
              No.
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Nama Kategori
            </th>
            <th scope="col" className="w-40 px-4 py-3 text-right font-semibold">
              Total Product
            </th>
            <th scope="col" className="w-36 px-4 py-3 text-right font-semibold">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pink-mist">
          {loading ? (
            <SkeletonRows />
          ) : error ? (
            <tr>
              <td colSpan={4} className="px-4 py-12 text-center">
                <AlertCircle className="mx-auto size-7 text-error" />
                <p className="mt-3 text-sm font-semibold text-ink">
                  Gagal memuat kategori.
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
          ) : categories.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-14 text-center">
                <FolderOpen className="mx-auto size-8 text-ink-muted" />
                <p className="mt-3 text-sm font-semibold text-ink">
                  Belum ada kategori
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  Tambahkan kategori pertama untuk mengelompokkan produk.
                </p>
                <button
                  type="button"
                  onClick={onAdd}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-pink-dark px-4 py-2 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
                >
                  <Plus className="size-3.5" />
                  Tambah kategori
                </button>
              </td>
            </tr>
          ) : (
            categories.map((category, index) => (
              <tr
                key={category.id}
                className="transition-colors hover:bg-pink-light/30"
              >
                <td className="px-4 py-3 text-xs text-ink-muted">
                  {(page - 1) * pageSize + index + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pink-light text-pink-dark">
                      <Tag className="size-4" />
                    </span>
                    <span className="font-medium text-ink">{category.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-ink">
                    {category.totalProduct} produk
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(category)}
                      aria-label={`Edit ${category.name}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-pink-mist bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-pink-primary hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(category)}
                      aria-label={`Hapus ${category.name}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-error/25 bg-surface px-2.5 py-1.5 text-xs font-semibold text-error transition hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
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
