import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  LoaderCircle,
  Package,
  PackagePlus,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import Pagination from '../components/categories/Pagination.jsx'
import DeleteProductDialog from '../components/products/DeleteProductDialog.jsx'
import ProductFormModal from '../components/products/ProductFormModal.jsx'
import StockAdjustmentModal from '../components/products/StockAdjustmentModal.jsx'
import { useToast } from '../components/ui/toast-context.js'
import { useCart } from '../context/cart-context.js'
import { formatDateTime, formatRupiah } from '../lib/format.js'
import { buildHash, readQueryParams } from '../lib/hashQuery.js'
import {
  adjustStock,
  deactivateProduct,
  getActiveCategories,
  getProductById,
  getProductMutations,
  updateProduct,
} from '../lib/productService.js'

const LIST_ROUTE_KEY = 'polipop-products-route'
const PER_PAGE_OPTIONS = [10, 25, 50]
const MUTATION_TYPES = ['masuk', 'keluar', 'penyesuaian', 'initial_stock']

const MUTATION_LABELS = {
  initial_stock: 'Stok Awal',
  masuk: 'Tambah Stok',
  keluar: 'Kurangi Stok',
  penyesuaian: 'Penyesuaian',
}

function previousListRoute() {
  try {
    const saved = sessionStorage.getItem(LIST_ROUTE_KEY)
    if (saved?.startsWith('#/products')) return saved.slice(1)
  } catch {
    // sessionStorage tidak tersedia: kembali ke daftar tanpa filter.
  }
  return '/products'
}

function defaultFilters() {
  return { type: '', startDate: '', endDate: '', page: 1, perPage: 10 }
}

function initialFilters() {
  const params = readQueryParams()
  const page = Number(params.get('page'))
  const perPage = Number(params.get('per_page'))
  const type = params.get('type')

  return {
    type: MUTATION_TYPES.includes(type) ? type : '',
    startDate: params.get('start_date') ?? '',
    endDate: params.get('end_date') ?? '',
    page: Number.isFinite(page) && page > 0 ? page : 1,
    perPage: PER_PAGE_OPTIONS.includes(perPage) ? perPage : 10,
  }
}

function mutationQty(entry, unit) {
  if (entry.type === 'penyesuaian') {
    return (
      <>
        <span className="sr-only">Stok akhir menjadi </span>
        <span aria-hidden="true">→</span> {entry.quantity} {unit}
      </>
    )
  }

  const change =
    entry.quantityChange ??
    (entry.type === 'keluar' ? -entry.quantity : entry.quantity)
  const sign = change > 0 ? '+' : change < 0 ? '−' : ''
  return `${sign}${Math.abs(change)} ${unit}`
}

function InfoField({ label, children, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{children}</dd>
    </div>
  )
}

export default function ProductDetailPage({ productId, onNavigate }) {
  const { showToast } = useToast()
  const { reload: reloadCart } = useCart()
  const detailPath = `/products/${encodeURIComponent(productId)}`

  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [filters, setFilters] = useState(initialFilters)
  const [mutations, setMutations] = useState({ items: [], total: 0, page: 1, totalPages: 1 })
  const [mutationsLoading, setMutationsLoading] = useState(true)
  const [mutationsError, setMutationsError] = useState(null)
  const [filterError, setFilterError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [stockOpen, setStockOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const filtersRef = useRef(filters)
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  const backToList = () => onNavigate(previousListRoute())

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

  useEffect(() => {
    let active = true
    getActiveCategories()
      .then((data) => {
        if (active) setCategories(data)
      })
      .catch(() => {
        if (active) setCategories([])
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.type) params.set('type', filters.type)
    if (filters.startDate) params.set('start_date', filters.startDate)
    if (filters.endDate) params.set('end_date', filters.endDate)
    if (filters.page !== 1) params.set('page', String(filters.page))
    if (filters.perPage !== 10) params.set('per_page', String(filters.perPage))

    const nextHash = buildHash(detailPath, params)
    if (window.location.hash !== nextHash) window.location.hash = nextHash
  }, [filters, detailPath])

  const requestKey = [
    filters.type,
    filters.startDate,
    filters.endDate,
    filters.page,
    filters.perPage,
    reloadKey,
  ].join('\u0000')

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setMutationsLoading(true)
      setMutationsError(null)
      try {
        const current = filtersRef.current
        const data = await getProductMutations(productId, {
          type: current.type,
          start_date: current.startDate,
          end_date: current.endDate,
          page: current.page,
          per_page: current.perPage,
        })
        if (!active) return
        setMutations(data)
        if (data.page !== current.page) {
          setFilters((state) => ({ ...state, page: data.page }))
        }
      } catch (err) {
        if (active) setMutationsError(err.message || 'Gagal memuat riwayat mutasi.')
      } finally {
        if (active) setMutationsLoading(false)
      }
    }, 0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [requestKey, productId])

  const refreshData = () => {
    setReloadKey((key) => key + 1)
    reloadCart()
  }

  const handleEditSubmit = async (payload) => {
    try {
      await updateProduct(productId, payload)
      showToast('success', 'Produk berhasil diperbarui')
      setFormOpen(false)
      refreshData()
    } catch (err) {
      showToast('error', err.message || 'Gagal memperbarui produk.')
      throw err
    }
  }

  const handleStockSubmit = async (payload) => {
    try {
      await adjustStock(productId, payload)
      const message =
        payload.type === 'masuk'
          ? 'Stok berhasil ditambahkan'
          : payload.type === 'keluar'
            ? 'Stok berhasil dikurangi'
            : 'Stok berhasil disesuaikan'
      showToast('success', message)
      setStockOpen(false)
      refreshData()
    } catch (err) {
      showToast('error', err.message || 'Gagal mengubah stok produk.')
      throw err
    }
  }

  const handleDeleteSubmit = async () => {
    try {
      await deactivateProduct(productId)
      showToast('success', 'Produk berhasil dinonaktifkan')
      setDeleteOpen(false)
      onNavigate(previousListRoute())
    } catch (err) {
      showToast('error', err.message || 'Gagal menonaktifkan produk.')
      throw err
    }
  }

  const applyDateFilter = (field, value) => {
    const next = { ...filters, [field]: value, page: 1 }
    if (next.startDate && next.endDate && next.startDate > next.endDate) {
      setFilterError('Tanggal awal tidak boleh lebih besar dari tanggal akhir')
      return
    }
    setFilterError('')
    setFilters(next)
  }

  const resetFilters = () => {
    setFilterError('')
    setFilters(defaultFilters())
  }

  const hasMutationFilters = Boolean(
    filters.type || filters.startDate || filters.endDate,
  )

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={backToList}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-pink-mist bg-surface px-4 text-xs font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </button>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            disabled={loading || !product}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-pink-mist bg-surface px-4 text-xs font-semibold text-pink-dark transition hover:bg-pink-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary disabled:opacity-50 sm:w-auto"
          >
            <Pencil className="size-4" />
            Edit Product
          </button>
          <button
            type="button"
            onClick={() => setStockOpen(true)}
            disabled={loading || !product}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-pink-dark px-4 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light disabled:opacity-50 sm:w-auto"
          >
            <PackagePlus className="size-4" />
            Stock Adjustment
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            disabled={loading || !product}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-error/30 bg-surface px-4 text-xs font-semibold text-error transition hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error disabled:opacity-50 sm:w-auto"
          >
            <Trash2 className="size-4" />
            Delete Product
          </button>
        </div>
      </div>

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
            Produk mungkin sudah dihapus atau bukan milik warung ini.
          </p>
          <button
            type="button"
            onClick={backToList}
            className="mt-5 rounded-xl bg-pink-dark px-4 py-2.5 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
          >
            Kembali ke daftar
          </button>
        </div>
      ) : (
        <>
          <section
            aria-label="Informasi produk"
            className="mt-5 rounded-2xl border border-pink-mist bg-surface p-5 shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)] sm:p-6"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <img
                src={product.image}
                alt={`Gambar produk ${product.name}`}
                className="size-32 shrink-0 rounded-xl border border-pink-mist object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  Product Information
                </p>
                <h1 className="mt-0.5 text-xl font-bold tracking-tight text-ink">
                  {product.name}
                </h1>
                <p className="mt-1 font-mono text-xs text-ink-muted">
                  {product.barcode}
                </p>

                <dl className="mt-5 grid gap-4 border-t border-pink-mist pt-5 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoField label="ID" className="break-all font-mono text-xs">
                    {product.id}
                  </InfoField>
                  <InfoField label="Barcode" className="font-mono text-xs">
                    {product.barcode}
                  </InfoField>
                  <InfoField label="Name">{product.name}</InfoField>
                  <InfoField label="Category">{product.categoryName}</InfoField>
                  <InfoField label="Price">
                    <span className="text-pink-dark">
                      {formatRupiah(product.price)}
                    </span>
                  </InfoField>
                  <InfoField label="Stock">
                    {product.stock} {product.unit}
                  </InfoField>
                  <InfoField label="Unit">{product.unit}</InfoField>
                  <InfoField label="Created At" className="text-xs">
                    {formatDateTime(product.createdAt)}
                  </InfoField>
                  <InfoField label="Updated At" className="text-xs">
                    {formatDateTime(product.updatedAt)}
                  </InfoField>
                </dl>
              </div>
            </div>
          </section>

          <section
            aria-label="Ringkasan stok"
            className="mt-5 flex flex-col gap-4 rounded-2xl border border-pink-mist bg-surface p-5 shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)] sm:flex-row sm:items-center sm:justify-between sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-pink-light text-pink-dark">
                <Package className="size-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  Stock Summary
                </p>
                <p className="mt-0.5 text-lg font-bold text-ink">
                  {product.stock} {product.unit}
                </p>
              </div>
            </div>
            <p className="text-xs text-ink-muted">
              Stok diperbarui setelah Stock Adjustment berhasil.
            </p>
          </section>

          <section
            aria-label="Riwayat mutasi stok"
            className="mt-5 overflow-hidden rounded-2xl border border-pink-mist bg-surface shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pink-mist px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-ink">
                  Product Mutation History
                </h2>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Seluruh perubahan stok produk ini.
                </p>
              </div>
              {hasMutationFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-pink-mist bg-surface px-3 text-xs font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                >
                  <RotateCcw className="size-3.5" />
                  Reset Filter
                </button>
              )}
            </div>

            <div className="grid gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
              <div>
                <label htmlFor="mutation-type" className="block text-xs font-semibold text-ink">
                  Mutation Type
                </label>
                <select
                  id="mutation-type"
                  value={filters.type}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      type: event.target.value,
                      page: 1,
                    }))
                  }
                  className="mt-1.5 h-11 w-full rounded-xl border border-pink-mist bg-surface px-3 text-sm text-ink outline-none transition focus:border-pink-primary focus:ring-4 focus:ring-pink-light/70"
                >
                  <option value="">All Types</option>
                  <option value="masuk">Masuk</option>
                  <option value="keluar">Keluar</option>
                  <option value="penyesuaian">Penyesuaian</option>
                  <option value="initial_stock">Initial Stock</option>
                </select>
              </div>

              <div>
                <label htmlFor="mutation-start" className="block text-xs font-semibold text-ink">
                  From Date
                </label>
                <input
                  id="mutation-start"
                  type="date"
                  value={filters.startDate}
                  max={filters.endDate || undefined}
                  onChange={(event) => applyDateFilter('startDate', event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-pink-mist bg-surface px-3 text-sm text-ink outline-none transition focus:border-pink-primary focus:ring-4 focus:ring-pink-light/70"
                />
              </div>

              <div>
                <label htmlFor="mutation-end" className="block text-xs font-semibold text-ink">
                  To Date
                </label>
                <input
                  id="mutation-end"
                  type="date"
                  value={filters.endDate}
                  min={filters.startDate || undefined}
                  onChange={(event) => applyDateFilter('endDate', event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-pink-mist bg-surface px-3 text-sm text-ink outline-none transition focus:border-pink-primary focus:ring-4 focus:ring-pink-light/70"
                />
              </div>

              <div>
                <label htmlFor="mutation-per-page" className="block text-xs font-semibold text-ink">
                  Per halaman
                </label>
                <select
                  id="mutation-per-page"
                  value={filters.perPage}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      perPage: Number(event.target.value),
                      page: 1,
                    }))
                  }
                  className="mt-1.5 h-11 w-full rounded-xl border border-pink-mist bg-surface px-3 text-sm text-ink outline-none transition focus:border-pink-primary focus:ring-4 focus:ring-pink-light/70"
                >
                  {PER_PAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {filterError && (
                <p role="alert" className="text-xs font-medium text-error sm:col-span-2 lg:col-span-4">
                  {filterError}
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                <thead className="bg-pink-light/50 text-[11px] uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th scope="col" className="w-14 px-4 py-3 font-semibold">
                      No
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">
                      Qty
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Mutation Type
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Notes
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-mist">
                  {mutationsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <LoaderCircle className="mx-auto size-5 animate-spin text-pink-dark" />
                        <p className="mt-2 text-xs text-ink-muted">
                          Memuat riwayat mutasi...
                        </p>
                      </td>
                    </tr>
                  ) : mutationsError ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <AlertCircle className="mx-auto size-6 text-error" />
                        <p className="mt-2 text-xs font-semibold text-ink">
                          {mutationsError}
                        </p>
                        <button
                          type="button"
                          onClick={() => setReloadKey((key) => key + 1)}
                          className="mt-3 rounded-xl bg-pink-dark px-4 py-2 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
                        >
                          Coba Lagi
                        </button>
                      </td>
                    </tr>
                  ) : mutations.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <Package className="mx-auto size-7 text-pink-dark/50" />
                        <p className="mt-2 text-sm font-semibold text-ink">
                          Tidak ada riwayat mutasi.
                        </p>
                        {hasMutationFilters && (
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="mt-3 rounded-xl border border-pink-mist bg-surface px-4 py-2 text-xs font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                          >
                            Reset Filter
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    mutations.items.map((entry, index) => (
                      <tr key={entry.id} className="align-top">
                        <td className="px-4 py-3 text-ink-muted">
                          {(mutations.page - 1) * filters.perPage + index + 1}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-ink">
                          {mutationQty(entry, product.unit)}
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
                        <td className="px-4 py-3 text-ink-muted">
                          {entry.notes || '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                          {formatDateTime(entry.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 pb-5">
              <Pagination
                page={mutations.page}
                totalPages={mutations.totalPages}
                total={mutations.total}
                pageSize={filters.perPage}
                onChange={(page) =>
                  setFilters((current) => ({ ...current, page }))
                }
                noun="mutasi stok"
              />
            </div>
          </section>

          {formOpen && (
            <ProductFormModal
              open
              mode="edit"
              product={product}
              categories={categories}
              onSubmit={handleEditSubmit}
              onClose={() => setFormOpen(false)}
            />
          )}

          {stockOpen && (
            <StockAdjustmentModal
              open
              allowAdjustment
              product={product}
              onSubmit={handleStockSubmit}
              onClose={() => setStockOpen(false)}
            />
          )}

          {deleteOpen && (
            <DeleteProductDialog
              open
              product={product}
              title="Delete Product?"
              description="Are you sure you want to delete this product? This action will remove the product from your active product list."
              confirmLabel="Delete Product"
              onSubmit={handleDeleteSubmit}
              onClose={() => setDeleteOpen(false)}
            />
          )}
        </>
      )}
    </main>
  )
}
