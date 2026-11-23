import { ArrowLeft } from 'lucide-react'

export default function PlaceholderPage({ item, onNavigate }) {
  const Icon = item.icon

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-6">
      <section className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-dashed border-pink-mist bg-surface/60 px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-pink-light text-pink-dark">
          <Icon className="size-7" />
        </span>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-pink-dark">
          Segera hadir
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
          {item.label}
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
          Halaman {item.label.toLowerCase()} belum tersedia. Untuk sementara,
          lanjutkan transaksi melalui menu Kasir.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-pink-dark px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Kasir
        </button>
      </section>
    </div>
  )
}
