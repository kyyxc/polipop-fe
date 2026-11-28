import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  Search,
} from 'lucide-react'
import Pagination from '../components/categories/Pagination.jsx'
import TransactionTable from '../components/transactions/TransactionTable.jsx'
import {
  DropdownMenu,
  DropdownMenuItem,
} from '../components/ui/DropdownMenu.jsx'
import DateInput from '../components/ui/DateInput.jsx'
import Select from '../components/ui/Select.jsx'
import { useToast } from '../components/ui/toast-context.js'
import { buildHash, readQueryParams } from '../lib/hashQuery.js'
import {
  downloadTransactionsExcel,
  downloadTransactionsPdf,
} from '../lib/transactionExport.js'
import {
  getExportTransactions,
  getTransactions,
} from '../lib/transactionService.js'

const PAGE_PATH = '/transactions'
const PER_PAGE_OPTIONS = [10, 25, 50]

const EMPTY_RESULT = {
  items: [],
  total: 0,
  page: 1,
  perPage: 10,
  totalPages: 1,
}

function initialFilters() {
  const params = readQueryParams()
  const perPage = Number(params.get('perPage'))
  const page = Number(params.get('page'))

  return {
    q: params.get('q') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    page: Number.isFinite(page) && page > 0 ? page : 1,
    perPage: PER_PAGE_OPTIONS.includes(perPage) ? perPage : 10,
  }
}

function ExportButton({
  format,
  activeFormat,
  onClick,
  children,
  className,
  role,
}) {
  const busy = activeFormat === format
  return (
    <button
      type="button"
      role={role}
      onClick={() => onClick(format)}
      disabled={Boolean(activeFormat)}
      className={className}
    >
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

export default function TransactionsPage({ onNavigate }) {
  const { showToast } = useToast()
  const [filters, setFilters] = useState(initialFilters)
  const [searchInput, setSearchInput] = useState(filters.q)
  const [dateError, setDateError] = useState('')
  const [datePanelOpen, setDatePanelOpen] = useState(false)
  const [exporting, setExporting] = useState(null)
  const [exportError, setExportError] = useState('')
  const [result, setResult] = useState(EMPTY_RESULT)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const filtersRef = useRef(filters)
  const totalPages = Math.max(1, result.totalPages)
  const currentPage = Math.min(filters.page, totalPages)
  const requestFilters = useMemo(
    () => ({ ...filters, page: currentPage }),
    [filters, currentPage],
  )

  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  // Debounce pencarian nomor transaksi.
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

  // Filter tercermin di query string hash agar bisa dibagikan/di-refresh.
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (currentPage !== 1) params.set('page', String(currentPage))
    if (filters.perPage !== 10) params.set('perPage', String(filters.perPage))

    const nextHash = buildHash(PAGE_PATH, params)
    if (window.location.hash !== nextHash) window.location.hash = nextHash

    // Dipakai halaman detail agar tombol Kembali dapat memulihkan filter.
    try {
      sessionStorage.setItem('polipop-transactions-route', nextHash)
    } catch {
      // sessionStorage tidak tersedia: kembali ke daftar tanpa filter.
    }
  }, [filters, currentPage])

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getTransactions(requestFilters)
        if (active) setResult(data)
      } catch (err) {
        if (active) setError(err.message || 'Gagal memuat daftar transaksi.')
      } finally {
        if (active) setLoading(false)
      }
    }, 0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [requestFilters, reloadKey])

  const transactions = result.items
  const hasFilters = Boolean(filters.q || filters.from || filters.to)

  const applyDateFilter = (field, value) => {
    const next = { ...filters, [field]: value, page: 1 }
    if (next.from && next.to && next.from > next.to) {
      setDateError('Tanggal akhir tidak boleh sebelum tanggal mulai')
      return
    }
    setDateError('')
    setFilters(next)
  }

  const handleExport = async (format) => {
    setExportError('')
    setExporting(format)
    try {
      const rows = await getExportTransactions(filtersRef.current)
      if (rows.length === 0) {
        const message = 'Tidak ada transaksi untuk diekspor.'
        setExportError(message)
        showToast('error', message)
        return
      }
      if (format === 'pdf') {
        await downloadTransactionsPdf(rows, filtersRef.current)
        showToast('success', 'File PDF berhasil dibuat')
      } else {
        await downloadTransactionsExcel(rows)
        showToast('success', 'File Excel berhasil dibuat')
      }
    } catch (err) {
      const message = err.message || 'Gagal mengekspor transaksi.'
      setExportError(message)
      showToast('error', message)
    } finally {
      setExporting(null)
    }
  }

  const primaryExportClass =
    'inline-flex h-10 items-center gap-2 rounded-xl border border-pink-mist bg-surface px-3.5 text-xs font-semibold text-ink-muted transition hover:border-pink-primary hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary disabled:cursor-not-allowed disabled:opacity-50'
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Transaksi
          </h1>
          <p className="mt-1 text-xs text-ink-muted sm:text-sm">
            Lihat riwayat transaksi penjualan dan unduh laporannya.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            variant="primary"
            className="w-36 sm:hidden"
            menuClassName="w-44"
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
        </div>
      </div>

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
        aria-label="Filter transaksi"
        className="mt-5 rounded-2xl border border-pink-mist bg-surface p-4 shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)]"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="transaction-search"
              className="block text-xs font-semibold text-ink"
            >
              Cari nomor transaksi
            </label>
            <div className="relative mt-1.5">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-muted"
              />
              <input
                id="transaction-search"
                type="search"
                maxLength={50}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Contoh: TRX-20261123-001"
                className="h-11 w-full rounded-xl border border-pink-mist bg-surface pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-pink-primary focus:ring-4 focus:ring-pink-light/70"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDatePanelOpen((open) => !open)}
            aria-expanded={datePanelOpen}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-pink-mist bg-surface px-3 text-xs font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary sm:hidden"
          >
            Filter tanggal
            <ChevronDown
              className={`size-4 transition-transform ${datePanelOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <div
            className={`${datePanelOpen ? 'grid' : 'hidden'} gap-3 sm:grid sm:grid-cols-2 sm:items-end`}
          >
            <div>
              <label
                htmlFor="transaction-from"
                className="block text-xs font-semibold text-ink"
              >
                Tanggal mulai
              </label>
              <DateInput
                id="transaction-from"
                className="mt-1.5 w-full"
                value={filters.from}
                max={filters.to || undefined}
                onChange={(event) => applyDateFilter('from', event.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="transaction-to"
                className="block text-xs font-semibold text-ink"
              >
                Tanggal akhir
              </label>
              <DateInput
                id="transaction-to"
                className="mt-1.5 w-full"
                value={filters.to}
                min={filters.from || undefined}
                onChange={(event) => applyDateFilter('to', event.target.value)}
              />
            </div>
          </div>

          <div className="sm:w-32">
            <label
              htmlFor="transaction-per-page"
              className="block text-xs font-semibold text-ink"
            >
              Per halaman
            </label>
            <Select
              id="transaction-per-page"
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

        {dateError && (
          <p role="alert" className="mt-3 text-xs font-medium text-error">
            {dateError}
          </p>
        )}
      </section>

      <p aria-live="polite" className="sr-only">
        {loading
          ? 'Memuat daftar transaksi'
          : `${result.total} transaksi ditemukan`}
      </p>

      <section
        aria-label="Daftar transaksi"
        className="mt-5 overflow-hidden rounded-2xl border border-pink-mist bg-surface shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)]"
      >
        <TransactionTable
          transactions={transactions}
          loading={loading}
          error={error}
          page={currentPage}
          pageSize={filters.perPage}
          hasFilters={hasFilters}
          onRetry={() => setReloadKey((key) => key + 1)}
          onDetail={(id) => onNavigate(`${PAGE_PATH}/${encodeURIComponent(id)}`)}
        />
      </section>

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        total={result.total}
        pageSize={filters.perPage}
        onChange={(page) => setFilters((current) => ({ ...current, page }))}
        noun="transaksi"
      />
    </main>
  )
}
