import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

// Pembungkus <dialog> native: native showModal sudah menyediakan backdrop dan
// focus return; trap Tab ditambahkan untuk konsistensi lintas browser.
export default function Modal({
  open,
  onClose,
  busy = false,
  labelledBy,
  describedBy,
  className = '',
  children,
}) {
  const dialogRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      previousFocusRef.current = document.activeElement
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }

    if (open) {
      // Dijalankan pada setiap setup effect agar fokus kembali ke dalam dialog
      // setelah siklus StrictMode development melakukan cleanup/remount.
      requestAnimationFrame(() => {
        if (!dialog.open) return
        const target =
          dialog.querySelector('[data-autofocus]') ||
          dialog.querySelector(FOCUSABLE)
        target?.focus()
      })
    }
  }, [open])

  // Modal dirender bersyarat oleh halaman, jadi pastikan fokus kembali ke
  // tombol pemicu ketika komponen dilepas dari DOM.
  useEffect(
    () => () => {
      previousFocusRef.current?.focus?.()
    },
    [],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog) return undefined

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return
      const focusables = Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      )
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)
    return () => dialog.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const requestClose = () => {
    if (busy) return
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={(event) => {
        if (busy) event.preventDefault()
      }}
      onClose={() => {
        onClose?.()
        previousFocusRef.current?.focus?.()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) requestClose()
      }}
      className={`w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-pink-mist bg-surface p-0 text-ink shadow-2xl ${className}`}
    >
      {children}
    </dialog>
  )
}
