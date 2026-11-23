import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  LoaderCircle,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useToast } from '../components/ui/toast-context.js'
import {
  getCurrentUser,
  getStoredUser,
  updateProfile,
} from '../lib/authService.js'

const FIELD_ALIASES = {
  current_password: 'currentPassword',
  new_password: 'newPassword',
  full_name: 'fullName',
}

function normalizeFieldErrors(fieldErrors = {}) {
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, message]) => [
      FIELD_ALIASES[field] ?? field,
      message,
    ]),
  )
}

function Field({ id, label, icon: Icon, error, hint, ...props }) {
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
            'h-11 w-full rounded-xl border bg-surface text-sm text-ink outline-none transition',
            'placeholder:text-ink-muted/70 focus:ring-4 disabled:opacity-70',
            Icon ? 'pl-11' : 'pl-4',
            error
              ? 'border-error focus:border-error focus:ring-error/10'
              : 'border-pink-mist focus:border-pink-primary focus:ring-pink-light/70',
          ].join(' ')}
          {...props}
        />
      </div>
      {error ? (
        <p className="flex items-start gap-1.5 text-xs font-medium text-error">
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="text-[11px] text-ink-muted">{hint}</p>
      )}
    </div>
  )
}

export default function AccountPage() {
  const { showToast } = useToast()
  const [profile, setProfile] = useState(() => getStoredUser())
  const [form, setForm] = useState(() => {
    const user = getStoredUser()
    return {
      username: user?.username ?? '',
      fullName: user?.full_name ?? '',
      newPassword: '',
      currentPassword: '',
    }
  })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)

  const applyProfile = useCallback((user) => {
    setProfile(user)
    setForm((current) => ({
      ...current,
      username: user?.username ?? '',
      fullName: user?.full_name ?? '',
    }))
  }, [])

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      applyProfile(await getCurrentUser())
    } catch (error) {
      setLoadError(error.message || 'Gagal memuat data akun.')
    } finally {
      setLoading(false)
    }
  }, [applyProfile])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const user = await getCurrentUser()
        if (active) applyProfile(user)
      } catch (error) {
        if (active) setLoadError(error.message || 'Gagal memuat data akun.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [applyProfile])

  const handleChange = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return

    const nextErrors = {}
    const username = form.username.trim()
    const fullName = form.fullName.trim()

    if (!username) {
      nextErrors.username = 'Username wajib diisi.'
    } else if (username.length < 3) {
      nextErrors.username = 'Username minimal 3 karakter.'
    }
    if (!fullName) {
      nextErrors.fullName = 'Nama lengkap wajib diisi.'
    }
    if (!form.currentPassword) {
      nextErrors.currentPassword = 'Password saat ini wajib diisi.'
    }
    if (form.newPassword && form.newPassword.length < 8) {
      nextErrors.newPassword = 'Password baru minimal 8 karakter.'
    }

    setErrors(nextErrors)
    setNotice(null)

    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      const updated = await updateProfile({
        currentPassword: form.currentPassword,
        username,
        fullName,
        newPassword: form.newPassword || undefined,
      })
      applyProfile(updated)
      setForm((current) => ({ ...current, newPassword: '', currentPassword: '' }))
      showToast('success', 'Data akun berhasil diperbarui')
    } catch (error) {
      setErrors(normalizeFieldErrors(error.fieldErrors))
      setNotice({
        type: 'error',
        message: error.message || 'Gagal memperbarui data akun.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    applyProfile(profile)
    setForm((current) => ({ ...current, newPassword: '', currentPassword: '' }))
    setErrors({})
    setNotice(null)
  }

  const NoticeIcon = notice?.type === 'error' ? AlertCircle : ShieldCheck

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Akun Saya
        </h1>
        <p className="mt-1 text-xs text-ink-muted sm:text-sm">
          Perbarui username, nama lengkap, dan password akun kasir Anda.
        </p>
      </div>

      <section className="mt-6 rounded-3xl border border-pink-mist bg-surface p-5 shadow-[0_20px_50px_-30px_rgba(194,96,122,0.45)] sm:p-6">
        <div className="flex flex-wrap items-center gap-4 border-b border-pink-mist pb-5">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-pink-light text-pink-dark">
            <UserRound className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">
              {profile?.full_name || 'Akun kasir'}
            </p>
            <p className="truncate text-xs text-ink-muted">
              @{profile?.username || '-'}
              {profile?.created_at &&
                ` · Bergabung ${new Date(profile.created_at).toLocaleDateString('id-ID')}`}
            </p>
          </div>
          {loading && (
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
              <LoaderCircle className="size-3.5 animate-spin" />
              Memuat profil...
            </span>
          )}
        </div>

        {loadError && (
          <div
            role="alert"
            className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-error/30 bg-error/10 px-3.5 py-3 text-xs leading-relaxed text-ink"
          >
            <AlertCircle className="size-4 shrink-0 text-error" />
            <span className="flex-1">{loadError}</span>
            <button
              type="button"
              onClick={loadProfile}
              className="rounded font-semibold text-pink-dark transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
            >
              Coba lagi
            </button>
          </div>
        )}

        {notice && (
          <div
            role={notice.type === 'error' ? 'alert' : 'status'}
            aria-live={notice.type === 'error' ? 'assertive' : 'polite'}
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-error/30 bg-error/10 px-3.5 py-3 text-xs leading-relaxed text-ink"
          >
            <NoticeIcon aria-hidden="true" className="mt-px size-4 shrink-0 text-error" />
            <span>{notice.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="account-username"
              label="Username"
              icon={UserRound}
              autoComplete="username"
              maxLength={50}
              value={form.username}
              disabled={loading || saving}
              onChange={handleChange('username')}
              error={errors.username}
            />
            <Field
              id="account-full-name"
              label="Nama Lengkap"
              autoComplete="name"
              maxLength={100}
              value={form.fullName}
              disabled={loading || saving}
              onChange={handleChange('fullName')}
              error={errors.fullName}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="account-new-password"
              label="Password Baru"
              type="password"
              autoComplete="new-password"
              placeholder="Kosongkan jika tidak diubah"
              value={form.newPassword}
              disabled={loading || saving}
              onChange={handleChange('newPassword')}
              error={errors.newPassword}
              hint="Minimal 8 karakter jika diisi."
            />
            <Field
              id="account-current-password"
              label="Password Saat Ini"
              type="password"
              icon={ShieldCheck}
              autoComplete="current-password"
              placeholder="Wajib untuk menyimpan perubahan"
              value={form.currentPassword}
              disabled={loading || saving}
              onChange={handleChange('currentPassword')}
              error={errors.currentPassword}
              hint="Diperlukan untuk mengonfirmasi identitas Anda."
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-pink-mist pt-5">
            <button
              type="button"
              onClick={handleReset}
              disabled={loading || saving}
              className="h-11 rounded-xl border border-pink-mist bg-surface px-4 text-sm font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-pink-dark px-5 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
