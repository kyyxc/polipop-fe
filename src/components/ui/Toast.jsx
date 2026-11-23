import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { ToastContext } from './toast-context.js'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
  }, [])

  const showToast = useCallback(
    (type, message) => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, type, message }])
      timers.current.set(id, setTimeout(() => dismiss(id), 4500))
    },
    [dismiss],
  )

  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer))
      activeTimers.clear()
    }
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((toast) => {
          const Icon = toast.type === 'error' ? AlertCircle : CheckCircle2
          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className={[
                'pointer-events-auto flex items-start gap-3 rounded-xl border bg-surface px-4 py-3 shadow-[0_16px_36px_-20px_rgba(26,26,26,0.5)]',
                toast.type === 'error'
                  ? 'border-error/30'
                  : 'border-success/30',
              ].join(' ')}
            >
              <Icon
                aria-hidden="true"
                className={[
                  'mt-0.5 size-4 shrink-0',
                  toast.type === 'error' ? 'text-error' : 'text-success',
                ].join(' ')}
              />
              <p className="flex-1 text-xs font-medium leading-relaxed text-ink">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Tutup notifikasi"
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
