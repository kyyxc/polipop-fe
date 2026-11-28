import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react'
import {
  ADMIN_WHATSAPP_URL,
  HAS_ADMIN_WHATSAPP,
} from '../config/contact.js'
import { login } from '../lib/authService.js'

const accessSteps = [
  {
    number: '01',
    title: 'Masukkan kredensial',
    description: 'Gunakan username dan password kasir Anda.',
  },
  {
    number: '02',
    title: 'Verifikasi otomatis',
    description: 'Perangkat dan akses Anda diperiksa sistem.',
  },
  {
    number: '03',
    title: 'Siap transaksi',
    description: 'Dashboard kasir langsung terbuka.',
  },
]

const statusStyles = {
  success: {
    wrapper: 'border-success/30 bg-success/10',
    icon: CheckCircle2,
    iconClass: 'text-success',
  },
  error: {
    wrapper: 'border-error/30 bg-error/10',
    icon: AlertCircle,
    iconClass: 'text-error',
  },
  info: {
    wrapper: 'border-pink-mist bg-pink-light',
    icon: ShieldCheck,
    iconClass: 'text-pink-dark',
  },
}

function TextField({ id, label, icon: Icon, error, trailing, ...props }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-muted"
          />
        )}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          className={[
            'h-12 w-full rounded-xl border bg-surface text-sm text-ink outline-none transition',
            'placeholder:text-ink-muted/70 focus:ring-4',
            Icon ? 'pl-11' : 'pl-4',
            trailing ? 'pr-11' : 'pr-4',
            error
              ? 'border-error focus:border-error focus:ring-error/10'
              : 'border-pink-mist focus:border-pink-primary focus:ring-pink-light/70',
          ].join(' ')}
          {...props}
        />
        {trailing && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {trailing}
          </div>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-error">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2 text-xs text-ink-muted">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span className="flex size-[18px] items-center justify-center rounded-[5px] border border-pink-mist bg-surface text-transparent transition peer-checked:border-pink-dark peer-checked:bg-pink-dark peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-pink-light">
        <Check className="size-3" strokeWidth={3} />
      </span>
      {label}
    </label>
  )
}

function VisibilityToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
      className="flex size-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
    >
      {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  )
}

function AdminContactLink({ children, className }) {
  if (!HAS_ADMIN_WHATSAPP) {
    return <span className={`${className} cursor-not-allowed opacity-60`}>{children}</span>
  }

  return (
    <a
      href={ADMIN_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  )
}

function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center justify-center rounded-2xl bg-pink-dark text-white shadow-[0_10px_20px_-10px_#c2607a] ${compact ? 'size-10' : 'size-11'}`}
      >
        <Store className={compact ? 'size-5' : 'size-6'} />
      </div>
      <div>
        <p className="text-lg font-bold leading-tight tracking-tight text-ink">
          Polipop
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-ink-muted">
          Aplikasi Kasir
        </p>
      </div>
    </div>
  )
}

export default function LoginPage({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const redirectTimer = useRef(null)

  useEffect(
    () => () => {
      clearTimeout(redirectTimer.current)
    },
    [],
  )

  useEffect(() => {
    if (!status) return undefined
    const timer = setTimeout(() => setStatus(null), 4500)
    return () => clearTimeout(timer)
  }, [status])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return

    const nextErrors = {}

    if (!username.trim()) {
      nextErrors.username = 'Username wajib diisi.'
    }
    if (!password) {
      nextErrors.password = 'Password wajib diisi.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setStatus({
        type: 'error',
        message: 'Periksa kembali username dan password Anda.',
      })
      return
    }

    setStatus(null)
    setLoading(true)

    try {
      const loggedInUser = await login({
        username: username.trim(),
        password,
        rememberMe: remember,
      })

      setStatus({
        type: 'success',
        message: 'Login berhasil. Membuka dashboard kasir...',
      })
      if (onSuccess) {
        redirectTimer.current = setTimeout(() => onSuccess(loggedInUser), 700)
      }
    } catch (error) {
      setErrors(error.fieldErrors ?? {})
      setStatus({
        type: 'error',
        message: error.message || 'Login gagal. Silakan coba lagi.',
      })
    } finally {
      setLoading(false)
    }
  }

  const StatusIcon = status ? statusStyles[status.type].icon : null

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-8 text-ink sm:px-6 lg:px-10">
      <div className="grid w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-8">
        <section className="relative hidden overflow-hidden rounded-[32px] border border-pink-mist bg-gradient-to-br from-pink-light via-surface to-cream p-10 lg:flex lg:flex-col">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-pink-primary/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -left-20 size-72 rounded-full bg-pink-primary/20 blur-3xl"
          />

          <div className="relative">
            <BrandMark />
          </div>

          <div className="relative mt-12">
            <h2 className="text-[38px] font-bold leading-[1.15] tracking-tight text-ink xl:text-[42px]">
              Buka kasir lebih cepat.
              <br />
              <span className="text-pink-dark">Cukup username & password.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
              Masuk dengan akun kasir Anda untuk mengelola transaksi dan stok
              dengan aman dalam hitungan detik.
            </p>
          </div>

          <div className="relative space-y-2.5">
            {accessSteps.map((step) => (
              <div
                key={step.number}
                className="flex items-start gap-3 rounded-2xl border border-pink-mist/80 bg-surface/70 px-4 py-3"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-pink-light text-xs font-bold text-pink-dark">
                  {step.number}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{step.title}</p>
                  <p className="text-xs text-ink-muted">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-6 flex items-center gap-2 text-xs text-ink-muted">
            <ShieldCheck className="size-4 text-pink-dark" />
            Data transaksi tersimpan otomatis dan terenkripsi.
          </div>
        </section>

        <section className="flex flex-col rounded-[28px] border border-pink-mist bg-surface p-6 shadow-[0_24px_60px_-30px_rgba(194,96,122,0.45)] sm:p-8">
          <div className="lg:hidden">
            <BrandMark compact />
          </div>

          <div className="mt-8 lg:mt-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-pink-dark">
              Selamat datang kembali
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
              Masuk ke aplikasi kasir
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Gunakan username dan password yang diberikan administrator outlet.
            </p>
          </div>

          {status && (
            <div
              role={status.type === 'error' ? 'alert' : 'status'}
              aria-live={status.type === 'error' ? 'assertive' : 'polite'}
              className={`mt-5 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs leading-relaxed text-ink ${statusStyles[status.type].wrapper}`}
            >
              <StatusIcon
                aria-hidden="true"
                className={`mt-px size-4 shrink-0 ${statusStyles[status.type].iconClass}`}
              />
              <span>{status.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <TextField
              id="username"
              label="Username"
              icon={UserRound}
              autoComplete="username"
              placeholder="Masukkan username kasir"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                setErrors((current) => ({ ...current, username: undefined }))
              }}
              error={errors.username}
            />

            <TextField
              id="password"
              label="Password"
              icon={LockKeyhole}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Masukkan password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setErrors((current) => ({ ...current, password: undefined }))
              }}
              error={errors.password}
              trailing={<VisibilityToggle visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />}
            />

            <div className="flex items-center justify-between gap-3">
              <Checkbox
                label="Ingat perangkat ini"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <AdminContactLink className="rounded text-xs font-semibold text-pink-dark transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary">
                Lupa password?
              </AdminContactLink>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-pink-dark text-sm font-semibold text-white shadow-[0_12px_24px_-12px_#c2607a] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk ke Kasir
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-muted">
            Belum punya akun kasir?{' '}
            <AdminContactLink className="rounded font-semibold text-pink-dark transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary">
              Hubungi admin outlet
            </AdminContactLink>
          </p>
        </section>
      </div>
    </main>
  )
}
