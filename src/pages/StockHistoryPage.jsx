import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import Pagination from '../components/categories/Pagination.jsx'
import StockHistoryList from '../components/stock/StockHistoryList.jsx'
import DateInput from '../components/ui/DateInput.jsx'
import Select from '../components/ui/Select.jsx'
import { getStockHistory } from '../lib/productService.js'
import { buildHash, readQueryParams } from '../lib/hashQuery.js'

const PAGE_PATH = '/stock/history'
const PER_PAGE_OPTIONS = [10, 25, 50]

const emptyResult = {
  items: [],
  total: 0,
  page: 1,
  perPage: 10,
  totalPages: 1,
}

function initialFilters() {
  const params = readQueryParams()
  const page = Number(params.get('page'))
  const perPage = Number(params.get('per_page'))

  return {
    q: params.get('q') ?? '',
    type: params.get('type') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    page: Number.isFinite(page) && page > 0 ? page : 1,
    perPage: PER_PAGE_OPTIONS.includes(perPage) ? perPage : 10,
  }
}

export default function StockHistoryPage({ onNavigate }) {
  const [filters, setFilters] = useState(initialFilters)
  const [searchInput, setSearchInput] = useState(filters.q)
  const [dateError, setDateError] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [result, setResult] = useState(emptyResult)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const filtersRef = useRef(filters)

  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) =>
        current.q === searchInput
          ? current
          : { ...current, q: searchInput, page: 1 },
      )
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.type) params.set('type', filters.type)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.page !== 1) params.set('page', String(filters.page))
    if (filters.perPage !== 10) params.set('per_page', String(filters.perPage))

    const nextHash = buildHash(PAGE_PATH, params)
    if (window.location.hash !== nextHash) window.location.hash = nextHash
  }, [filters])



  const requestKey = [
    filters.q,
    filters.type,
    filters.from,
    filters.to,
    filters.page,
    filters.perPage,
    reloadKey,
  ].join('\u0000')

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getStockHistory(filtersRef.current)
        if (active) setResult(data)
      } catch (err) {
        if (active) {
          setError(err.message || 'Gagal memuat riwayat stok.')
          setResult(emptyResult)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [requestKey])

  const currentPage = Math.min(filters.page, result.totalPages)
  const hasFilters = Boolean(
    filters.q || filters.type || filters.from || filters.to,
  )

  const applyDateFilter = (field, value) => {
    const next = { ...filters, [field]: value, page: 1 }
    if (next.from && next.to && next.from > next.to) {
      setDateError('Tanggal akhir tidak boleh sebelum tanggal mulai')
      return
    }
    setDateError('')
    setFilters(next)
  }

  const resetFilters = () => {
    setSearchInput('')
    setDateError('')
    setFilters({
      q: '',
      type: '',
      from: '',
      to: '',
      page: 1,
      perPage: filters.perPage,
    })
  }

  const filterPanel = (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <div>
          <label
            htmlFor="stock-search"
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
              id="stock-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Nama produk"
              className="h-11 w-full rounded-xl border border-pink-mist bg-surface pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-pink-primary focus:ring-4 focus:ring-pink-light/70"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="stock-type"
            className="block text-xs font-semibold text-ink"
          >
            Tipe mutasi
          </label>
          <Select
            id="stock-type"
            className="mt-1.5 w-full"
            value={filters.type}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                type: event.target.value,
                page: 1,
              }))
            }
          >
            <option value="">Semua tipe</option>
            <option value="initial">Stok awal</option>
            <option value="restock">Restock</option>
            <option value="return">Retur</option>
            <option value="sale">Penjualan</option>
            <option value="damaged">Barang rusak</option>
            <option value="adjustment">Penyesuaian</option>
          </Select>
        </div>

        <div>
          <label
            htmlFor="stock-from"
            className="block text-xs font-semibold text-ink"
          >
            Tanggal mulai
          </label>
          <DateInput
            id="stock-from"
            className="mt-1.5 w-full"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(event) => applyDateFilter('from', event.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor="stock-to"
            className="block text-xs font-semibold text-ink"
          >
            Tanggal akhir
          </label>
          <DateInput
            id="stock-to"
            className="mt-1.5 w-full"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(event) => applyDateFilter('to', event.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor="stock-per-page"
            className="block text-xs font-semibold text-ink"
          >
            Per halaman
          </label>
          <Select
            id="stock-per-page"
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

        {dateError && (
          <p
            role="alert"
            className="text-xs font-medium text-error md:col-span-2 lg:col-span-5"
          >
            {dateError}
          </p>
        )}
    </div>
  )

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 lg:px-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Riwayat Stok
        </h1>
        <p className="mt-1 text-xs text-ink-muted sm:text-sm">
          Telusuri seluruh perubahan stok produk di warung Anda.
        </p>
      </div>

      <section
        aria-label="Filter mutasi stok"
        className="mt-5 rounded-2xl border border-pink-mist bg-surface p-4 shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)]"
      >
        <div className="flex items-center justify-between gap-3 md:hidden">
          <button
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            aria-expanded={filterOpen}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-pink-mist bg-surface px-3 text-xs font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
          >
            <SlidersHorizontal className="size-4" />
            Filter
            <ChevronDown
              className={`size-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-pink-dark transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          )}
        </div>

        <div className={`${filterOpen ? 'block' : 'hidden'} md:block`}>
          {filterPanel}
        </div>
      </section>

      <p aria-live="polite" className="sr-only">
        {loading
          ? 'Memuat riwayat stok'
          : `${result.total} mutasi stok ditemukan`}
      </p>

      <section aria-label="Daftar mutasi stok" className="mt-5">
        <StockHistoryList
          items={result.items}
          loading={loading}
          error={error}
          page={currentPage}
          pageSize={filters.perPage}
          hasFilters={hasFilters}
          onRetry={() => setReloadKey((key) => key + 1)}
          onProduct={(id) =>
            onNavigate(`/products/${encodeURIComponent(id)}`)
          }
          onHistory={(id) =>
            onNavigate(`/products/${encodeURIComponent(id)}/stock`)
          }
          onTransaction={(id) =>
            onNavigate(`/transactions/${encodeURIComponent(id)}`)
          }
        />
      </section>

      <Pagination
        page={currentPage}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={filters.perPage}
        onChange={(page) => setFilters((current) => ({ ...current, page }))}
        noun="mutasi"
      />
    </main>
  )
}
