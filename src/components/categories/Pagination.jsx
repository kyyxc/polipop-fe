import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
  noun = 'kategori',
}) {
  if (total === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-ink-muted">
        Menampilkan <span className="font-semibold text-ink">{start}</span>–
        <span className="font-semibold text-ink">{end}</span> dari{' '}
        <span className="font-semibold text-ink">{total}</span> {noun}
      </p>
      <nav aria-label={`Pagination ${noun}`} className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Halaman sebelumnya"
          className="flex size-8 items-center justify-center rounded-lg border border-pink-mist bg-surface text-ink-muted transition hover:border-pink-primary hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-current={value === page ? 'page' : undefined}
            className={[
              'flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary',
              value === page
                ? 'bg-pink-dark text-white'
                : 'border border-pink-mist bg-surface text-ink-muted hover:border-pink-primary hover:text-pink-dark',
            ].join(' ')}
          >
            {value}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Halaman berikutnya"
          className="flex size-8 items-center justify-center rounded-lg border border-pink-mist bg-surface text-ink-muted transition hover:border-pink-primary hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </nav>
    </div>
  )
}
