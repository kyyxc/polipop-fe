import { Check, Moon, Sun } from 'lucide-react'
import { APP_NAME, OUTLET_NAME } from '../config/app.js'
import {
  ADMIN_WHATSAPP_NUMBER,
  HAS_ADMIN_WHATSAPP,
} from '../config/contact.js'
import { useTheme } from '../context/theme-context.js'

const themeOptions = [
  {
    value: 'light',
    label: 'Light mode',
    description: 'Tampilan terang dengan palet pink yang lembut.',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark mode',
    description: 'Tampilan gelap untuk penggunaan di malam hari.',
    icon: Moon,
  },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Pengaturan
        </h1>
        <p className="mt-1 text-xs text-ink-muted sm:text-sm">
          Lihat identitas aplikasi dan sesuaikan tampilan kasir sesuai kebutuhan Anda.
        </p>
      </div>

      <section className="mt-6 rounded-3xl border border-pink-mist bg-surface p-5 shadow-[0_20px_50px_-30px_rgba(194,96,122,0.45)] sm:p-6">
        <div>
          <h2 className="text-base font-bold text-ink">Identitas aplikasi</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Nilai berikut dipakai pada struk dan tautan bantuan.
          </p>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-pink-mist bg-cream/40 px-3 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
              Nama aplikasi
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink">{APP_NAME}</dd>
          </div>
          <div className="rounded-xl border border-pink-mist bg-cream/40 px-3 py-2.5">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
              Nama outlet
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink">{OUTLET_NAME}</dd>
          </div>
          <div className="rounded-xl border border-pink-mist bg-cream/40 px-3 py-2.5 sm:col-span-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
              Kontak admin
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink">
              {HAS_ADMIN_WHATSAPP ? ADMIN_WHATSAPP_NUMBER : 'Belum dikonfigurasi'}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
          Backend belum menyediakan endpoint pengaturan warung. Ubah nilai lewat
          variabel environment (`VITE_APP_NAME`, `VITE_OUTLET_NAME`,
          `VITE_ADMIN_WHATSAPP`) saat build.
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-pink-mist bg-surface p-5 shadow-[0_20px_50px_-30px_rgba(194,96,122,0.45)] sm:p-6">
        <div>
          <h2 className="text-base font-bold text-ink">Tampilan</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Pilih tema yang paling nyaman digunakan. Pilihan tersimpan otomatis
            di perangkat ini.
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Tema aplikasi"
          className="mt-5 grid gap-3 sm:grid-cols-2"
        >
          {themeOptions.map((option) => {
            const Icon = option.icon
            const active = theme === option.value

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(option.value)}
                className={[
                  'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition',
                  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light',
                  active
                    ? 'border-pink-primary bg-pink-light/60'
                    : 'border-pink-mist bg-cream/40 hover:border-pink-primary hover:bg-pink-light/30',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'flex size-10 shrink-0 items-center justify-center rounded-xl',
                    active
                      ? 'bg-pink-dark text-white'
                      : 'bg-pink-light text-pink-dark',
                  ].join(' ')}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-muted">
                    {option.description}
                  </span>
                </span>
                {active && (
                  <Check
                    aria-hidden="true"
                    className="mt-1 size-5 shrink-0 text-pink-dark"
                  />
                )}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
