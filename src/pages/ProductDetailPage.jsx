import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, LoaderCircle, Package } from 'lucide-react'
import { formatDateLong, formatRupiah, formatTime } from '../lib/format.js'
import { getProductById } from '../lib/productService.js'

const LIST_ROUTE_KEY = 'polipop-products-route'

function previousListRoute() {
  try {
    const saved = sessionStorage.getItem(LIST_ROUTE_KEY)
    if (saved?.startsWith('#/products')) return saved.slice(1)
  } catch {
    // sessionStorage tidak tersedia: kembali ke daftar tanpa filter.
  }
  return '/products'
}

const MUTATION_LABELS = {
  initial_stock: 'Stok Awal',
  masuk: 'Tambah Stok',
  keluar: 'Kurangi Stok',
}

export default function ProductDetailPage({ productId, onNavigate }) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getProductById(productId)
        if (active) setProduct(data)
      } catch (err) {
        if (active) {
          setProduct(null)
          setError(err.message || 'Produk tidak ditemukan.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }, 0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [productId, reloadKey])

  const backToList = () => onNavigate(previousListRoute())
  const history = product ? [...product.history].reverse() : []

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 lg:px-6">
      <button
        type="button"
        onClick={backToList}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-pink-mist bg-surface px-4 text-xs font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
      >
        <ArrowLeft className="size-4" />
        Kembali ke produk
      </button>

      {loading ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-pink-mist bg-surface px-6 py-20 text-center">
          <LoaderCircle className="size-6 animate-spin text-pink-dark" />
          <p className="mt-3 text-sm text-ink-muted">Memuat detail produk...</p>
        </div>
      ) : error || !product ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-error/30 bg-error/5 px-6 py-16 text-center">
          <AlertCircle className="size-8 text-error" />
          <p className="mt-3 text-sm font-semibold text-ink">
            {error || 'Produk tidak ditemukan.'}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Produk mungkin sudah dinonaktifkan atau bukan milik warung ini.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="rounded-xl bg-pink-dark px-4 py-2.5 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
            >
              Coba lagi
            </button>
            <button
              type="button"
              onClick={backToList}
              className="rounded-xl border border-pink-mist bg-surface px-4 py-2.5 text-xs font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
            >
              Kembali ke daftar
            </button>
          </div>
        </div>
      ) : (
        <>
          <section className="mt-6 rounded-2xl border border-pink-mist bg-surface p-5 shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)] sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <img
                src={product.image}
                alt={`Gambar produk ${product.name}`}
                className="size-28 shrink-0 rounded-xl border border-pink-mist object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pink-light text-pink-dark sm:hidden">
                    <Package className="size-5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Detail produk
                    </p>
                    <h1 className="mt-0.5 text-xl font-bold tracking-tight text-ink">
                      {product.name}
                    </h1>
                    <p className="mt-1 font-mono text-xs text-ink-muted">
                      {product.barcode}
                    </p>
                  </div>
                </div>

                <dl className="mt-5 grid gap-4 border-t border-pink-mist pt-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Harga
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-pink-dark">
                      {formatRupiah(product.price)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Stok
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">
                      {product.stock} {product.unit}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Kategori
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">
                      {product.categoryName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Satuan
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-ink">
                      {product.unit}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <section
            aria-label="Riwayat mutasi stok"
            className="mt-5 overflow-hidden rounded-2xl border border-pink-mist bg-surface shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)]"
          >
            <div className="border-b border-pink-mist px-5 py-4">
              <h2 className="text-sm font-bold text-ink">Riwayat Stok</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                <thead className="bg-pink-light/50 text-[11px] uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th scope="col" className="w-12 px-4 py-3 font-semibold">
                      No
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Tanggal
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Jenis
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                      Jumlah
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                      Stok Setelah
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Catatan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-mist">
                  {history.map((entry, index) => (
                    <tr key={entry.id} className="align-top">
                      <td className="px-4 py-3 text-ink-muted">{index + 1}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                        {formatDateLong(entry.createdAt)}, {formatTime(entry.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            entry.type === 'keluar'
                              ? 'bg-error/10 text-error'
                              : 'bg-success/10 text-success'
                          }`}
                        >
                          {MUTATION_LABELS[entry.type] ?? entry.type}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-ink">
                        {entry.type === 'keluar' ? '−' : '+'}
                        {entry.quantity} {product.unit}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-ink">
                        {entry.stockAfter} {product.unit}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {entry.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
