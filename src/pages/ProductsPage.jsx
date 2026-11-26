import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  Plus,
  Search,
} from 'lucide-react'
import Pagination from '../components/categories/Pagination.jsx'
import DeleteProductDialog from '../components/products/DeleteProductDialog.jsx'
import ProductFormModal from '../components/products/ProductFormModal.jsx'
import ProductTable from '../components/products/ProductTable.jsx'
import {
  DropdownMenu,
  DropdownMenuItem,
} from '../components/ui/DropdownMenu.jsx'
import Select from '../components/ui/Select.jsx'
import { useToast } from '../components/ui/toast-context.js'
import { useCart } from '../context/cart-context.js'
import { productImagePlaceholder } from '../data/mockKasir.js'
import { buildHash, readQueryParams } from '../lib/hashQuery.js'
import { downloadProductsExcel, downloadProductsPdf } from '../lib/productExport.js'
import {
  createProduct,
  deactivateProduct,
  deleteProductImage,
  getActiveCategories,
  getExportProducts,
  getProducts,
  updateProduct,
} from '../lib/productService.js'

const PAGE_PATH = '/products'
const PER_PAGE_OPTIONS = [10, 25, 50]
const SORT_FIELDS = ['name', 'price', 'stock']

function initialFilters() {
  const params = readQueryParams()
  const page = Number(params.get('page'))
  const perPage = Number(params.get('per_page'))
  const orderBy = params.get('order_by')
  const sort = params.get('sort')

  return {
    q: params.get('q') ?? '',
    page: Number.isFinite(page) && page > 0 ? page : 1,
    perPage: PER_PAGE_OPTIONS.includes(perPage) ? perPage : 10,
    orderBy: SORT_FIELDS.includes(orderBy) ? orderBy : 'name',
    sort: sort === 'desc' ? 'desc' : 'asc',
  }
}

function ExportButton({ format, activeFormat, onClick, children, className, role }) {
  const busy = activeFormat === format
  return (
    <button type="button" role={role} onClick={() => onClick(format)} disabled={Boolean(activeFormat)} className={className}>
      {busy ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : format === 'pdf' ? (
        <FileText className="size-4" />
      ) : (
        <FileSpreadsheet className="size-4" />
      )}
      {children}
    </button>
  )
}

export default function ProductsPage({ onNavigate }) {
  const { showToast } = useToast()
  const { reload: reloadCart } = useCart()
  const [filters, setFilters] = useState(initialFilters)
  const [searchInput, setSearchInput] = useState(filters.q)
  const [categories, setCategories] = useState([])
  const [result, setResult] = useState({ items: [], total: 0, page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [exporting, setExporting] = useState(null)
  const [exportError, setExportError] = useState('')
  const [formState, setFormState] = useState(null)
  const [deleteProduct, setDeleteProduct] = useState(null)

  const filtersRef = useRef(filters)
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  // Debounce pencarian, halaman kembali ke 1 saat keyword berubah.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) =>
        current.q === searchInput ? current : { ...current, q: searchInput, page: 1 },
      )
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Query string (di dalam hash) menyimpan filter, sorting, dan pagination.
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.orderBy !== 'name') params.set('order_by', filters.orderBy)
    if (filters.sort !== 'asc') params.set('sort', filters.sort)
    if (filters.page !== 1) params.set('page', String(filters.page))
    if (filters.perPage !== 10) params.set('per_page', String(filters.perPage))

    const nextHash = buildHash(PAGE_PATH, params)
    if (window.location.hash !== nextHash) window.location.hash = nextHash
    try {
      sessionStorage.setItem('polipop-products-route', nextHash)
    } catch {
      // Abaikan bila sessionStorage tidak tersedia.
    }
  }, [filters])

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

  const requestKey = [
    filters.q,
    filters.orderBy,
    filters.sort,
    filters.page,
    filters.perPage,
    reloadKey,
  ].join('\u0000')

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getProducts(filtersRef.current)
        if (!active) return
        setResult(data)
        if (data.page !== filtersRef.current.page) {
          setFilters((current) => ({ ...current, page: data.page }))
        }
      } catch (err) {
        if (active) setError(err.message || 'Gagal memuat daftar produk.')
      } finally {
        if (active) setLoading(false)
      }
    }, 0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [requestKey])

  const hasFilters = Boolean(filters.q)
  const products = result.items

  const refreshData = () => {
    setReloadKey((key) => key + 1)
    reloadCart()
  }

  const openCreate = () => {
    if (categories.length === 0) {
      showToast('error', 'Minimal satu kategori harus tersedia sebelum membuat produk.')
      return
    }
    setFormState({ mode: 'create', product: null })
  }

  const handleFormSubmit = async (payload) => {
    try {
      if (formState?.mode === 'edit') {
        await updateProduct(formState.product.id, payload)
        showToast('success', 'Produk berhasil diperbarui')
      } else {
        await createProduct(payload)
        showToast('success', 'Produk berhasil ditambahkan')
      }
      setFormState(null)
      refreshData()
    } catch (err) {
      showToast('error', err.message || 'Gagal menyimpan produk.')
      throw err
    }
  }

  const handleDeleteImage = async (id) => {
    try {
      await deleteProductImage(id)
      showToast('success', 'Gambar produk berhasil dihapus')
      setFormState((current) =>
        current?.product?.id === id
          ? {
              ...current,
              product: { ...current.product, image: productImagePlaceholder },
            }
          : current,
      )
      refreshData()
    } catch (err) {
      showToast('error', err.message || 'Gagal menghapus gambar produk.')
      throw err
    }
  }

  const handleDeleteSubmit = async (product) => {
    try {
      await deactivateProduct(product.id)
      showToast('success', 'Produk berhasil dinonaktifkan')
      setDeleteProduct(null)
      refreshData()
    } catch (err) {
      showToast('error', err.message || 'Gagal menonaktifkan produk.')
      throw err
    }
  }

  const handleExport = async (format) => {
    setExportError('')
    setExporting(format)
    try {
      const rows = await getExportProducts(filtersRef.current)
      if (format === 'pdf') {
        await downloadProductsPdf(rows, filtersRef.current)
        showToast('success', 'File PDF berhasil dibuat')
      } else {
        await downloadProductsExcel(rows)
        showToast('success', 'File Excel berhasil dibuat')
      }
    } catch (err) {
      const message = err.message || 'Gagal mengekspor produk.'
      setExportError(message)
      showToast('error', message)
    } finally {
      setExporting(null)
    }
  }

  const primaryExportClass =
    'inline-flex h-10 items-center gap-2 rounded-xl border border-pink-mist bg-surface px-3.5 text-xs font-semibold text-ink-muted transition hover:border-pink-primary hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary disabled:cursor-not-allowed disabled:opacity-50'
  const sortLabel = useMemo(
    () =>
      `${filters.orderBy === 'name' ? 'nama' : filters.orderBy === 'price' ? 'harga' : 'stok'} ${
        filters.sort === 'asc' ? 'menaik' : 'menurun'
      }`,
    [filters.orderBy, filters.sort],
  )

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 lg:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Produk
          </h1>
          <p className="mt-1 text-xs text-ink-muted sm:text-sm">
            Kelola produk warung, harga, stok, dan kategori dalam satu halaman.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="hidden gap-2 sm:flex">
            <ExportButton
              format="pdf"
              activeFormat={exporting}
              onClick={handleExport}
              className={primaryExportClass}
            >
              Export PDF
            </ExportButton>
            <ExportButton
              format="xlsx"
              activeFormat={exporting}
              onClick={handleExport}
              className={primaryExportClass}
            >
              Export Excel
            </ExportButton>
          </div>

          <DropdownMenu
            label="Export"
            icon={FileText}
            loading={Boolean(exporting)}
            className="w-full sm:hidden"
            menuClassName="w-full"
          >
            <DropdownMenuItem
              icon={exporting === 'pdf' ? LoaderCircle : FileText}
              iconClassName={exporting === 'pdf' ? 'animate-spin' : ''}
              onSelect={() => handleExport('pdf')}
            >
              Export PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              icon={exporting === 'xlsx' ? LoaderCircle : FileSpreadsheet}
              iconClassName={exporting === 'xlsx' ? 'animate-spin' : ''}
              onSelect={() => handleExport('xlsx')}
            >
              Export Excel
            </DropdownMenuItem>
          </DropdownMenu>

          <button
            type="button"
            onClick={openCreate}
            disabled={categories.length === 0}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-pink-dark px-4 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Plus className="size-4" />
            Tambah Produk
          </button>
        </div>
      </div>

      {categories.length === 0 && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-xl border border-pink-mist bg-pink-light/40 px-4 py-3 text-xs font-medium text-ink-muted"
        >
          <AlertCircle className="mt-px size-4 shrink-0" />
          Minimal satu kategori aktif harus tersedia sebelum produk dapat dibuat.
        </div>
      )}

      {exportError && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-xs font-medium text-error"
        >
          <AlertCircle className="mt-px size-4 shrink-0" />
          {exportError}
        </div>
      )}

      <section
        aria-label="Filter produk"
        className="mt-5 rounded-2xl border border-pink-mist bg-surface p-4 shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)]"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="product-search" className="block text-xs font-semibold text-ink">
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
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Barcode, nama, atau kategori"
                className="h-11 w-full rounded-xl border border-pink-mist bg-surface pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-pink-primary focus:ring-4 focus:ring-pink-light/70"
              />
            </div>
          </div>

          <div>
            <label htmlFor="product-order-by" className="block text-xs font-semibold text-ink">
              Urutkan berdasarkan
            </label>
            <Select
              id="product-order-by"
              className="mt-1.5 w-full"
              value={filters.orderBy}
              onChange={(event) =>
                setFilters((current) => ({ ...current, orderBy: event.target.value, page: 1 }))
              }
            >
              <option value="name">Nama</option>
              <option value="price">Harga</option>
              <option value="stock">Stok</option>
            </Select>
          </div>

          <div>
            <label htmlFor="product-sort" className="block text-xs font-semibold text-ink">
              Arah pengurutan
            </label>
            <Select
              id="product-sort"
              className="mt-1.5 w-full"
              value={filters.sort}
              onChange={(event) =>
                setFilters((current) => ({ ...current, sort: event.target.value, page: 1 }))
              }
            >
              <option value="asc">Ascending (A–Z / terendah)</option>
              <option value="desc">Descending (Z–A / tertinggi)</option>
            </Select>
          </div>

          <div>
            <label htmlFor="product-per-page" className="block text-xs font-semibold text-ink">
              Per halaman
            </label>
            <Select
              id="product-per-page"
              className="mt-1.5 w-full"
              value={filters.perPage}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  perPage: Number(event.target.value),
                  page: 1,
                }))
              }
            >
              {PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      <p aria-live="polite" className="sr-only">
        {loading
          ? 'Memuat daftar produk'
          : `Daftar produk diurutkan berdasarkan ${sortLabel}. ${result.total} produk ditemukan.`}
      </p>

      <section
        aria-label="Daftar produk"
        className="mt-5 overflow-hidden rounded-2xl border border-pink-mist bg-surface shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)]"
      >
        <ProductTable
          products={products}
          loading={loading}
          error={error}
          page={result.page}
          pageSize={filters.perPage}
          hasFilters={hasFilters}
          total={result.total}
          onRetry={() => setReloadKey((key) => key + 1)}
          onAdd={openCreate}
          onDetail={(id) =>
            onNavigate(`${PAGE_PATH}/${encodeURIComponent(id)}`)
          }
          onEdit={(product) => setFormState({ mode: 'edit', product })}
          onDelete={setDeleteProduct}
        />
      </section>

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={filters.perPage}
        onChange={(page) => setFilters((current) => ({ ...current, page }))}
        noun="produk"
      />

      {formState && (
        <ProductFormModal
          open
          mode={formState.mode}
          product={formState.product}
          categories={categories}
          onSubmit={handleFormSubmit}
          onDeleteImage={handleDeleteImage}
          onClose={() => setFormState(null)}
        />
      )}

      {deleteProduct && (
        <DeleteProductDialog
          open
          product={deleteProduct}
          onSubmit={handleDeleteSubmit}
          onClose={() => setDeleteProduct(null)}
        />
      )}
    </main>
  )
}
