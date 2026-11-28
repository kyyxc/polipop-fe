import { AlertCircle, Package, RefreshCw, Search } from 'lucide-react'
import { productImagePlaceholder } from '../../config/images.js'
import { formatRupiah } from '../../lib/format.js'

function ProductSkeleton() {
  return (
    <div className="h-[160px] rounded-2xl border border-pink-mist bg-surface p-4">
      <div className="size-12 animate-pulse rounded-xl bg-pink-light" />
      <div className="mt-4 h-3 w-2/3 animate-pulse rounded bg-pink-light" />
      <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-pink-light" />
    </div>
  )
}

export default function ProductGrid({
  products,
  totalProducts = products.length,
  loading,
  error,
  search,
  onSearchChange,
  onRetry,
  onAdd,
}) {
  return (
    <section aria-labelledby="product-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="product-heading" className="text-lg font-bold tracking-tight text-ink">
            Produk
          </h2>
          <p className="text-xs text-ink-muted">
            Pilih produk untuk menambahkannya ke keranjang.
          </p>
        </div>
        <span className="rounded-full bg-pink-light px-3 py-1 text-xs font-semibold text-pink-dark">
          {products.length} produk
        </span>
      </div>

      <div className="mt-5">
        <label
          htmlFor="product-search"
          className="block text-xs font-semibold text-ink"
        >
          Cari produk
        </label>
        <div className="relative mt-1.5">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-muted"
          />
          <input
            id="product-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari nama produk..."
            className="h-11 w-full rounded-xl border border-pink-mist bg-surface pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-pink-primary focus:ring-4 focus:ring-pink-light/70"
          />
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-error/30 bg-error/5 px-6 py-12 text-center">
            <AlertCircle className="size-7 text-error" />
            <p className="mt-3 text-sm font-semibold text-ink">Gagal memuat produk.</p>
            <p className="mt-1 text-xs text-ink-muted">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-pink-mist bg-surface px-4 py-2 text-xs font-semibold text-pink-dark transition hover:border-pink-primary hover:bg-pink-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
            >
              <RefreshCw className="size-3.5" />
              Coba lagi
            </button>
          </div>
        ) : totalProducts === 0 ? (
          <div className="rounded-2xl border border-pink-mist bg-surface px-6 py-12 text-center">
            <Package className="mx-auto size-7 text-ink-muted" />
            <p className="mt-3 text-sm font-semibold text-ink">
              Belum ada produk. Tambahkan produk terlebih dahulu.
            </p>
            <a
              href="#/products"
              className="mt-4 inline-flex rounded-xl bg-pink-dark px-4 py-2 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
            >
              Tambah produk
            </a>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-pink-mist bg-surface px-6 py-12 text-center">
            <Search className="mx-auto size-7 text-ink-muted" />
            <p className="mt-3 text-sm font-semibold text-ink">
              Produk tidak ditemukan.
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Coba kata kunci lain.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const isSoldOut = product.stock === 0
                const isLowStock = product.stock > 0 && product.stock <= 3

                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => onAdd(product)}
                    className="flex h-[160px] flex-col rounded-2xl border border-pink-mist bg-surface p-4 text-left transition hover:border-pink-primary hover:shadow-[0_12px_24px_-16px_rgba(194,96,122,0.6)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-pink-mist disabled:hover:shadow-none"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <img
                        src={product.image || productImagePlaceholder}
                        alt={`Gambar ${product.name}`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src = productImagePlaceholder
                        }}
                        className="size-12 shrink-0 rounded-xl border border-pink-mist bg-pink-light/40 object-cover"
                      />
                      {isSoldOut ? (
                        <span className="rounded-full bg-error/10 px-2 py-1 text-[10px] font-bold text-error">
                          Habis
                        </span>
                      ) : isLowStock ? (
                        <span
                          className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-muted"
                          title="Stok menipis"
                        >
                          <span className="size-1.5 rounded-full bg-warning" />
                          Stok {product.stock}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-ink-muted">
                          Stok {product.stock}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-ink">
                      {product.name}
                    </p>
                    <p className="mt-auto text-sm font-bold text-pink-dark">
                      {formatRupiah(product.price)}
                    </p>
                  </button>
                )
              })}
            </div>

            {search && (
              <p className="mt-4 text-center text-xs text-ink-muted">
                Menampilkan hasil untuk “{search}”.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  )
}
