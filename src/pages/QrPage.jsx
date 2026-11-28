import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Info,
  ScanLine,
  Send,
  ShoppingCart,
  VideoOff,
  X,
} from 'lucide-react'
import { useCart } from '../context/cart-context.js'
import { useToast } from '../components/ui/toast-context.js'
import { resolveProductFromQr, sampleQrPayloads } from '../lib/qrProduct.js'
import { formatRupiah } from '../lib/format.js'

const SCAN_COOLDOWN_MS = 1500

function cameraErrorMessage(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return 'Akses kamera ditolak. Izinkan kamera di browser lalu coba lagi.'
  }
  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') {
    return 'Kamera tidak ditemukan pada perangkat ini.'
  }
  if (error?.name === 'NotReadableError') {
    return 'Kamera sedang digunakan aplikasi lain.'
  }
  if (!window.isSecureContext) {
    return 'Pemindaian kamera hanya tersedia di HTTPS atau localhost.'
  }
  return error?.message || 'Kamera gagal diaktifkan.'
}

export default function QrPage({ onNavigate }) {
  const { visibleProducts, loading, cart, addToCart } = useCart()
  const { showToast } = useToast()

  const [manualValue, setManualValue] = useState('')
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({ success: 0, failed: 0 })
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState('')

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const detectorRef = useRef(null)
  const detectingRef = useRef(false)
  const lastSeenRef = useRef(new Map())
  const entryIdRef = useRef(0)

  const detectorSupported =
    typeof window !== 'undefined' && 'BarcodeDetector' in window
  const cameraSupported = detectorSupported && Boolean(window.navigator?.mediaDevices?.getUserMedia)

  const pushHistory = useCallback((entry) => {
    setHistory((current) =>
      [{ id: ++entryIdRef.current, time: new Date(), ...entry }, ...current].slice(
        0,
        8,
      ),
    )
  }, [])

  const handleScan = useCallback(
    (rawValue, source) => {
      const value = String(rawValue ?? '').trim()
      if (!value) return

      // Hindari satu kode yang sama terbaca berulang kali saat kamera menyala.
      const now = Date.now()
      if (now - (lastSeenRef.current.get(value) ?? 0) < SCAN_COOLDOWN_MS) return
      lastSeenRef.current.set(value, now)

      const product = resolveProductFromQr(value, visibleProducts)
      if (!product) {
        const message = 'Kode QR tidak dikenali dalam katalog produk.'
        pushHistory({ payload: value, source, ok: false, message })
        setStats((current) => ({ ...current, failed: current.failed + 1 }))
        showToast('error', message)
        return
      }

      const result = addToCart(product)
      if (!result.ok) {
        pushHistory({ payload: value, source, ok: false, message: result.reason, product })
        setStats((current) => ({ ...current, failed: current.failed + 1 }))
        showToast('error', result.reason)
        return
      }

      const message = `${product.name} ditambahkan ke keranjang`
      pushHistory({ payload: value, source, ok: true, message, product })
      setStats((current) => ({ ...current, success: current.success + 1 }))
      showToast('success', message)
    },
    [visibleProducts, addToCart, pushHistory, showToast],
  )

  const stopScanner = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    detectorRef.current = null
    detectingRef.current = false
    setScanning(false)
  }, [])

  const startScanner = async () => {
    setCameraError('')
    if (!detectorSupported || !cameraSupported) {
      setCameraError(
        'Browser ini tidak mendukung deteksi QR otomatis. Gunakan input manual atau tombol simulasi di bawah.',
      )
      return
    }

    try {
      const stream = await window.navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] })
      setScanning(true)
    } catch (error) {
      stopScanner()
      setCameraError(cameraErrorMessage(error))
    }
  }

  // Loop deteksi dijalankan interval agar proses detect() yang async tidak
  // bertumpuk seperti halnya requestAnimationFrame.
  useEffect(() => {
    if (!scanning) return undefined

    const timer = window.setInterval(async () => {
      if (detectingRef.current) return
      const video = videoRef.current
      if (!video || video.readyState < 2 || !detectorRef.current) return

      detectingRef.current = true
      try {
        const codes = await detectorRef.current.detect(video)
        codes.forEach((code) => handleScan(code.rawValue, 'Kamera'))
      } catch {
        // Decode gagal sesaat biasanya normal saat kamera belum fokus.
      } finally {
        detectingRef.current = false
      }
    }, 350)

    return () => window.clearInterval(timer)
  }, [scanning, handleScan])

  useEffect(() => () => stopScanner(), [stopScanner])

  const sampleCodes = sampleQrPayloads(visibleProducts)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0)

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-pink-light text-pink-dark">
              <ScanLine className="size-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Uji Deteksi QR
            </h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Pindai QR produk untuk menambahkannya ke keranjang Kasir. Kode contoh
            disediakan jika ingin mencoba tanpa mencetak QR fisik.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-pink-mist bg-surface px-4 text-sm font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
        >
          Ke kasir
          <ArrowRight className="size-4" />
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {/* Pemindai kamera */}
          <section className="overflow-hidden rounded-2xl border border-pink-mist bg-surface shadow-[0_20px_50px_-34px_rgba(194,96,122,0.5)]">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-pink-mist px-5 py-4">
              <div className="flex items-center gap-2">
                <Camera className="size-[18px] text-pink-dark" />
                <h2 className="text-sm font-bold text-ink">Pemindai kamera</h2>
              </div>
              <span className="rounded-full bg-pink-light px-2.5 py-1 text-[11px] font-semibold text-pink-dark">
                {scanning ? 'Deteksi aktif' : 'Nonaktif'}
              </span>
            </header>

            <div className="p-5">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-ink/90">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  aria-label="Pratinjau kamera pemindai QR"
                  className="size-full object-cover"
                />
                {!scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-white/80">
                    <VideoOff className="size-8" />
                    <p className="text-sm font-semibold">Kamera belum aktif</p>
                    <p className="text-xs text-white/60">
                      Aktifkan kamera untuk memindai QR secara langsung.
                    </p>
                  </div>
                )}
                {scanning && (
                  <span className="pointer-events-none absolute inset-6 rounded-xl border-2 border-white/50" />
                )}
              </div>

              {cameraError && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-3 py-2.5 text-xs font-medium text-error"
                >
                  <AlertCircle className="mt-px size-3.5 shrink-0" />
                  {cameraError}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {scanning ? (
                  <button
                    type="button"
                    onClick={stopScanner}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-pink-mist bg-surface px-4 text-sm font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                  >
                    <X className="size-4" />
                    Matikan kamera
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startScanner}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-pink-dark px-4 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
                  >
                    <Camera className="size-4" />
                    Aktifkan kamera
                  </button>
                )}
                <p className="text-xs text-ink-muted">
                  {detectorSupported
                    ? 'Menggunakan BarcodeDetector bawaan browser (format qr_code).'
                    : 'BarcodeDetector tidak tersedia di browser ini.'}
                </p>
              </div>
            </div>
          </section>

          {/* Input manual / simulasi */}
          <section className="rounded-2xl border border-pink-mist bg-surface p-5 shadow-[0_20px_50px_-34px_rgba(194,96,122,0.5)]">
            <h2 className="text-sm font-bold text-ink">
              Simulasikan hasil scan
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Masukkan isi QR seperti <code>POLIPOP:prod-01</code> atau nama
              produk, lalu tekan Enter.
            </p>
            <form
              className="mt-4 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                handleScan(manualValue, 'Input manual')
                setManualValue('')
              }}
            >
              <input
                value={manualValue}
                onChange={(event) => setManualValue(event.target.value)}
                placeholder="POLIPOP:prod-01"
                aria-label="Isi kode QR"
                className="h-11 flex-1 rounded-xl border border-pink-mist bg-surface px-4 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-pink-primary focus:ring-4 focus:ring-pink-light/70"
              />
              <button
                type="submit"
                disabled={!manualValue.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-pink-dark px-4 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="size-4" />
                Proses QR
              </button>
            </form>

            <div className="mt-5 border-t border-pink-mist pt-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                  Kode QR contoh
                </p>
                <span className="text-[11px] text-ink-muted">Klik untuk menguji</span>
              </div>
              {loading ? (
                <p className="mt-3 text-xs text-ink-muted">
                  Memuat katalog produk...
                </p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {sampleCodes.map(({ product, payload }) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleScan(payload, 'Simulasi')}
                      className="flex items-center justify-between gap-3 rounded-xl border border-pink-mist bg-cream/60 px-3 py-2.5 text-left transition hover:border-pink-primary hover:bg-pink-light/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-ink">
                          {product.name}
                        </span>
                        <code className="mt-0.5 block truncate text-[10px] text-ink-muted">
                          {payload}
                        </code>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-xs font-semibold text-pink-dark">
                          {formatRupiah(product.price)}
                        </span>
                        <span
                          className={`block text-[10px] ${product.stock === 0 ? 'text-error' : 'text-ink-muted'}`}
                        >
                          {product.stock === 0 ? 'Stok habis' : `Stok ${product.stock}`}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Riwayat deteksi */}
          <section className="rounded-2xl border border-pink-mist bg-surface p-5 shadow-[0_20px_50px_-34px_rgba(194,96,122,0.5)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-ink">Riwayat deteksi</h2>
              <div className="flex gap-2 text-[11px] font-semibold">
                <span className="rounded-full bg-success/10 px-2.5 py-1 text-success">
                  Berhasil {stats.success}
                </span>
                <span className="rounded-full bg-error/10 px-2.5 py-1 text-error">
                  Gagal {stats.failed}
                </span>
              </div>
            </div>

            {history.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-pink-mist px-4 py-8 text-center text-xs text-ink-muted">
                Belum ada QR yang dipindai.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {history.map((entry) => {
                  const Icon = entry.ok ? CheckCircle2 : AlertCircle
                  return (
                    <li
                      key={entry.id}
                      className="flex items-start gap-3 rounded-xl border border-pink-mist bg-cream/50 px-3 py-2.5"
                    >
                      <Icon
                        className={`mt-0.5 size-4 shrink-0 ${entry.ok ? 'text-success' : 'text-error'}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-ink">
                          {entry.message}
                        </p>
                        <code className="mt-0.5 block truncate text-[10px] text-ink-muted">
                          {entry.payload}
                        </code>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-semibold text-ink-muted">
                          {entry.source}
                        </p>
                        <p className="text-[10px] text-ink-muted/70">
                          {entry.time.toLocaleTimeString('id-ID')}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Ringkasan keranjang */}
        <aside className="lg:sticky lg:top-[84px] lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-pink-mist bg-surface shadow-[0_20px_50px_-34px_rgba(194,96,122,0.5)]">
            <header className="flex items-center justify-between border-b border-pink-mist px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-[18px] text-pink-dark" />
                <h2 className="text-sm font-bold text-ink">Keranjang</h2>
              </div>
              <span className="rounded-full bg-pink-light px-2.5 py-1 text-[11px] font-semibold text-pink-dark">
                {totalQty} barang
              </span>
            </header>

            <div className="max-h-[320px] overflow-y-auto px-5 py-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <ShoppingCart className="size-8 text-ink-muted/60" />
                  <p className="mt-3 text-xs font-semibold text-ink">
                    Keranjang masih kosong
                  </p>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    Hasil scan QR akan muncul di sini.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {cart.map((item) => (
                    <li
                      key={item.productId}
                      className="flex items-start justify-between gap-2 rounded-xl border border-pink-mist px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-ink-muted">
                          {formatRupiah(item.price)} × {item.qty}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs font-bold text-pink-dark">
                        {formatRupiah(item.price * item.qty)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-pink-mist px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">Subtotal</span>
                <span className="font-bold text-ink">{formatRupiah(subtotal)}</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-pink-dark text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
              >
                Lanjut ke kasir
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-pink-mist bg-pink-light/50 px-3 py-3 text-[11px] leading-relaxed text-ink-muted">
            <Info className="mt-0.5 size-3.5 shrink-0 text-pink-dark" />
            <p>
              Produk dan stok berasal dari API. Kode contoh di atas hanya untuk
              mencoba pemindaian; pembayaran tetap diproses di menu Kasir.
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
