import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import Pagination from '../components/categories/Pagination.jsx'
import DeleteDiscountDialog from '../components/discounts/DeleteDiscountDialog.jsx'
import DiscountDetailModal from '../components/discounts/DiscountDetailModal.jsx'
import DiscountFormModal from '../components/discounts/DiscountFormModal.jsx'
import DiscountTable from '../components/discounts/DiscountTable.jsx'
import Select from '../components/ui/Select.jsx'
import { useToast } from '../components/ui/toast-context.js'
import {
  createDiscount,
  deleteDiscount,
  DISCOUNT_SCOPES,
  DISCOUNT_SORT_FIELDS,
  DISCOUNT_STATUSES,
  DISCOUNT_TYPES,
  FORM_ERROR_CODES,
  getDiscounts,
  getDiscountById,
  updateDiscount,
} from '../lib/discountService.js'
import { buildHash, readQueryParams } from '../lib/hashQuery.js'
import { getExportProducts } from '../lib/productService.js'

const PAGE_PATH = '/discounts'
const PER_PAGE_OPTIONS = [10, 25, 50]
const SORT_LABELS = {
  created_at: 'Tanggal dibuat',
  name: 'Nama diskon',
  discount_value: 'Nilai diskon',
  starts_at: 'Tanggal mulai',
  ends_at: 'Tanggal akhir',
}
const SCOPE_LABELS = {
  product: 'Produk',
  transaction: 'Transaksi',
}
const TYPE_LABELS = {
  percentage: 'Persentase',
  fixed: 'Nominal',
}
const STATUS_LABELS = {
  active: 'Aktif',
  scheduled: 'Dijadwalkan',
  expired: 'Kedaluwarsa',
  inactive: 'Nonaktif',
}

function initialFilters() {
  const params = readQueryParams()
  const page = Number(params.get('page'))
  const perPage = Number(params.get('per_page'))
  const orderBy = params.get('order_by')
  const sort = params.get('sort')
  const scope = params.get('scope')
  const type = params.get('type')
  const status = params.get('status')

  return {
    q: params.get('q') ?? '',
    scope: DISCOUNT_SCOPES.includes(scope) ? scope : '',
    type: DISCOUNT_TYPES.includes(type) ? type : '',
    status: DISCOUNT_STATUSES.includes(status) ? status : '',
    orderBy: DISCOUNT_SORT_FIELDS.includes(orderBy) ? orderBy : 'created_at',
    sort: sort === 'asc' ? 'asc' : 'desc',
    page: Number.isFinite(page) && page > 0 ? page : 1,
    perPage: PER_PAGE_OPTIONS.includes(perPage) ? perPage : 10,
  }
}

function emptyDetail() {
  return { open: false, id: null, discount: null, loading: false, error: '' }
}

export default function DiscountPage() {
  const { showToast } = useToast()
  const [filters, setFilters] = useState(initialFilters)
  const [searchInput, setSearchInput] = useState(filters.q)
  const [products, setProducts] = useState([])
  const [productsError, setProductsError] = useState('')
  const [result, setResult] = useState({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
    perPage: 10,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [formState, setFormState] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [detail, setDetail] = useState(emptyDetail)

  const filtersRef = useRef(filters)
  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  // Debounce pencarian; halaman kembali ke 1 saat kata kunci berubah.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) =>
        current.q === searchInput ? current : { ...current, q: searchInput, page: 1 },
      )
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Filter dan pagination disimpan di hash agar tetap ada saat halaman dimuat ulang.
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.scope) params.set('scope', filters.scope)
    if (filters.type) params.set('type', filters.type)
    if (filters.status) params.set('status', filters.status)
    if (filters.orderBy !== 'created_at') params.set('order_by', filters.orderBy)
    if (filters.sort !== 'desc') params.set('sort', filters.sort)
    if (filters.page !== 1) params.set('page', String(filters.page))
    if (filters.perPage !== 10) params.set('per_page', String(filters.perPage))

    const nextHash = buildHash(PAGE_PATH, params)
    if (window.location.hash !== nextHash) window.location.hash = nextHash
  }, [filters])

  useEffect(() => {
    let active = true
    getExportProducts()
      .then((rows) => {
        if (active) setProducts(rows)
      })
      .catch((err) => {
        if (active) setProductsError(err.message || 'Gagal memuat daftar produk.')
      })
    return () => {
      active = false
    }
  }, [])

  const requestKey = [
    filters.q,
    filters.scope,
    filters.type,
    filters.status,
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
        const data = await getDiscounts(filtersRef.current)
        if (!active) return
        setResult(data)
        if (data.page !== filtersRef.current.page) {
          setFilters((current) => ({ ...current, page: data.page }))
        }
      } catch (err) {
        if (active) setError(err.message || 'Gagal memuat daftar diskon.')
      } finally {
        if (active) setLoading(false)
      }
    }, 0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [requestKey])

  const refresh = useCallback(() => setReloadKey((key) => key + 1), [])

  const loadDetail = async (id) => {
    setDetail((current) => ({ ...current, loading: true, error: '', discount: null }))
    try {
      const discount = await getDiscountById(id)
      setDetail((current) => ({ ...current, discount, loading: false }))
    } catch (err) {
      setDetail((current) => ({
        ...current,
        loading: false,
        error: err.message || 'Gagal memuat detail diskon.',
      }))
    }
  }

  const openDetail = (discount) => {
    setDetail({ open: true, id: discount.id, discount: null, loading: true, error: '' })
    loadDetail(discount.id)
  }

  const closeDetail = () => setDetail(emptyDetail())

  const handleFormSubmit = async (payload) => {
    const isEdit = formState?.mode === 'edit'
    try {
      if (isEdit) {
        await updateDiscount(formState.discount.id, payload)
        showToast('success', 'Diskon berhasil diperbarui')
      } else {
        await createDiscount(payload)
        showToast('success', 'Diskon berhasil ditambahkan')
      }
      setFormState(null)
      if (!isEdit && filtersRef.current.page !== 1) {
        setFilters((current) => ({ ...current, page: 1 }))
      } else {
        refresh()
      }
    } catch (err) {
      if (FORM_ERROR_CODES.has(err.code)) throw err
      showToast('error', err.message || 'Gagal menyimpan diskon.')
    }
  }

  const handleDelete = async () => {
    if (!deleting) return { ok: false }
    try {
      await deleteDiscount(deleting.id)
      showToast('success', 'Diskon berhasil dihapus')
      setDeleting(null)
      if (result.items.length === 1 && filtersRef.current.page > 1) {
        setFilters((current) => ({ ...current, page: current.page - 1 }))
      } else {
        refresh()
      }
      return { ok: true }
    } catch (err) {
      showToast('error', err.message || 'Gagal menghapus diskon.')
      return { ok: false, error: err }
    }
  }

  const resetFilters = () => {
    setSearchInput('')
    setFilters({
      q: '',
      scope: '',
      type: '',
      status: '',
      orderBy: 'created_at',
      sort: 'desc',
      page: 1,
      perPage: 10,
    })
  }

  const isFiltered =
    Boolean(filters.q || filters.scope || filters.type || filters.status) ||
    filters.orderBy !== 'created_at' ||
    filters.sort !== 'desc'
  const currentPage = filters.page
  const pageSize = result.perPage || 10
  const totalPages = Math.max(1, result.totalPages || 1)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Diskon
          </h1>
          <p className="mt-1 text-xs text-ink-muted sm:text-sm">
            Kelola diskon produk dan transaksi, termasuk periode dan statusnya.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormState({ mode: 'create', discount: null })}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-pink-dark px-4 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_#c2607a] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
        >
          <Plus className="size-4" />
          Tambah Diskon
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[220px] flex-1">
          <label
            htmlFor="discount-search"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted"
          >
            Cari diskon
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <input
              id="discount-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Nama diskon atau produk..."
              className="h-11 w-full rounded-xl border border-pink-mist bg-surface pl-9 pr-3.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-pink-primary focus:ring-4 focus:ring-pink-light/70"
            />
          </div>
        </div>

        <div className="w-full sm:w-40">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Cakupan
          </span>
          <Select
            value={filters.scope}
            aria-label="Filter cakupan diskon"
            onChange={(event) =>
              setFilters((current) => ({ ...current, scope: event.target.value, page: 1 }))
            }
          >
            <option value="">Semua</option>
            {DISCOUNT_SCOPES.map((scope) => (
              <option key={scope} value={scope}>
                {SCOPE_LABELS[scope] ?? scope}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full sm:w-40">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Jenis
          </span>
          <Select
            value={filters.type}
            aria-label="Filter jenis diskon"
            onChange={(event) =>
              setFilters((current) => ({ ...current, type: event.target.value, page: 1 }))
            }
          >
            <option value="">Semua</option>
            {DISCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type] ?? type}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full sm:w-40">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Status
          </span>
          <Select
            value={filters.status}
            aria-label="Filter status diskon"
            onChange={(event) =>
              setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))
            }
          >
            <option value="">Semua</option>
            {DISCOUNT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status] ?? status}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full sm:w-44">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Urutkan
          </span>
          <Select
            value={filters.orderBy}
            aria-label="Urutkan diskon"
            onChange={(event) =>
              setFilters((current) => ({ ...current, orderBy: event.target.value, page: 1 }))
            }
          >
            {DISCOUNT_SORT_FIELDS.map((field) => (
              <option key={field} value={field}>
                {SORT_LABELS[field] ?? field}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full sm:w-32">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Arah
          </span>
          <Select
            value={filters.sort}
            aria-label="Arah pengurutan"
            onChange={(event) =>
              setFilters((current) => ({ ...current, sort: event.target.value, page: 1 }))
            }
          >
            <option value="desc">Menurun</option>
            <option value="asc">Menaik</option>
          </Select>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={resetFilters}
            className="h-11 rounded-xl border border-pink-mist bg-surface px-4 text-xs font-semibold text-pink-dark transition hover:bg-pink-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
          >
            Reset filter
          </button>
        )}
      </div>

      <section
        aria-label="Daftar diskon"
        className="mt-5 overflow-hidden rounded-2xl border border-pink-mist bg-surface shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)]"
      >
        <DiscountTable
          discounts={result.items}
          loading={loading}
          error={error}
          page={currentPage}
          pageSize={pageSize}
          onRetry={() => refresh()}
          onAdd={() => setFormState({ mode: 'create', discount: null })}
          onDetail={openDetail}
          onEdit={(discount) => setFormState({ mode: 'edit', discount })}
          onDelete={setDeleting}
        />
      </section>

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        total={result.total}
        pageSize={pageSize}
        noun="diskon"
        onChange={(page) => setFilters((current) => ({ ...current, page }))}
      />

      {formState && (
        <DiscountFormModal
          key={formState.mode === 'edit' ? formState.discount.id : 'create'}
          open
          mode={formState.mode}
          discount={formState.discount}
          products={products}
          productsError={productsError}
          onSubmit={handleFormSubmit}
          onClose={() => setFormState(null)}
        />
      )}

      <DiscountDetailModal
        open={detail.open}
        discount={detail.discount}
        loading={detail.loading}
        error={detail.error}
        onRetry={() => detail.id && loadDetail(detail.id)}
        onEdit={(discount) => {
          closeDetail()
          setFormState({ mode: 'edit', discount })
        }}
        onClose={closeDetail}
      />

      <DeleteDiscountDialog
        open={Boolean(deleting)}
        discount={deleting}
        onSubmit={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
