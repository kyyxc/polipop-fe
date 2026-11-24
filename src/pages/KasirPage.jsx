import { useEffect, useMemo, useRef, useState } from 'react'
import { ShoppingCart, X } from 'lucide-react'
import CartPanel from '../components/kasir/CartPanel.jsx'
import ProductGrid from '../components/kasir/ProductGrid.jsx'
import SuccessDialog from '../components/kasir/SuccessDialog.jsx'
import { useCart } from '../context/cart-context.js'
import { currentUserId } from '../data/mockCategories.js'
import { currentWarungId, mockDiscounts } from '../data/mockKasir.js'
import { formatRupiah } from '../lib/format.js'
import {
  createTransactionNo,
  saveTransaction,
} from '../lib/transactionService.js'

export default function KasirPage() {
  const {
    visibleProducts,
    loading,
    loadError,
    reload,
    cart,
    cartError,
    setCartError,
    addToCart,
    setQty,
    removeItem,
    clearCart,
    decrementStock,
  } = useCart()

  const [search, setSearch] = useState('')
  const [discountId, setDiscountId] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [paymentTouched, setPaymentTouched] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const submitTimer = useRef(null)

  useEffect(() => () => clearTimeout(submitTimer.current), [])

  useEffect(() => {
    if (!sheetOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSheetOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sheetOpen])

  const discounts = useMemo(
    () => mockDiscounts.filter((discount) => discount.active),
    [],
  )

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return visibleProducts
    return visibleProducts.filter((product) =>
      product.name.toLowerCase().includes(query),
    )
  }, [visibleProducts, search])

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart],
  )

  const selectedDiscount = discounts.find((discount) => discount.id === discountId)
  const discountAmount = selectedDiscount
    ? Math.min(selectedDiscount.amount, subtotal)
    : 0
  const total = Math.max(0, subtotal - discountAmount)
  const paidAmount = Number(amountPaid) || 0
  const change = Math.max(0, paidAmount - total)
  const paymentError =
    cart.length > 0 &&
    paidAmount < total &&
    (paymentTouched || amountPaid !== '')
      ? 'Uang diterima kurang dari total'
      : ''

  const handleRetry = () => reload()

  const handleAddProduct = (product) => {
    if (addToCart(product).ok) setSubmitError('')
  }

  const handleQtyChange = (productId, nextQty) => setQty(productId, nextQty)

  const handleRemoveItem = (productId) => removeItem(productId)

  const handleSubmit = () => {
    if (processing) return

    if (cart.length === 0) {
      setCartError('Keranjang masih kosong')
      return
    }
    if (paidAmount < total) {
      setPaymentTouched(true)
      return
    }

    setSubmitError('')
    setPaymentTouched(false)
    setProcessing(true)

    // Simulasi POST transaksi + mutasi stok (frontend saja).
    submitTimer.current = setTimeout(() => {
      const paidItems = cart.map((item) => ({ ...item }))
      const no = createTransactionNo()

      const transaction = {
        id: no,
        no,
        userId: currentUserId,
        warungId: currentWarungId,
        items: paidItems,
        subtotal,
        discountAmount,
        total,
        paid: paidAmount,
        change,
        createdAt: new Date().toISOString(),
      }

      decrementStock(paidItems, transaction)
      saveTransaction(transaction)

      setSuccess(transaction)
      clearCart()
      setDiscountId('')
      setAmountPaid('')
      setProcessing(false)
      setSheetOpen(false)
    }, 900)
  }

  const cartPanelProps = {
    cart,
    products: visibleProducts,
    discounts,
    discountId,
    onDiscountChange: setDiscountId,
    amountPaid,
    onAmountChange: (value) => {
      setAmountPaid(value.replace(/\D/g, ''))
      setSubmitError('')
    },
    subtotal,
    discountAmount,
    total,
    change,
    cartError,
    paymentError,
    submitError,
    processing,
    onSubmit: handleSubmit,
    onQtyChange: handleQtyChange,
    onRemove: handleRemoveItem,
  }

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 lg:px-6 lg:pb-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <ProductGrid
            products={filteredProducts}
            totalProducts={visibleProducts.length}
            loading={loading}
            error={loadError}
            search={search}
            onSearchChange={setSearch}
            onRetry={handleRetry}
            onAdd={handleAddProduct}
          />

          <aside className="hidden lg:block">
            <div className="sticky top-[84px] h-[calc(100vh-6.5rem)] overflow-hidden rounded-2xl border border-pink-mist bg-surface shadow-[0_20px_50px_-34px_rgba(194,96,122,0.5)]">
              <CartPanel className="h-full" {...cartPanelProps} />
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-pink-mist bg-surface/95 p-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium text-ink-muted">Total</p>
            <p aria-live="polite" className="text-base font-bold text-ink">
              {formatRupiah(total)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-pink-dark px-4 py-3 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
          >
            <ShoppingCart className="size-4" />
            Lihat keranjang
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
              {cart.length}
            </span>
          </button>
        </div>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Tutup keranjang"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Keranjang"
            className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl border-t border-pink-mist bg-surface shadow-2xl"
          >
            <div className="relative flex shrink-0 justify-center pb-1 pt-3">
              <span className="h-1 w-10 rounded-full bg-pink-mist" />
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Tutup keranjang"
                className="absolute right-3 top-2 flex size-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
              >
                <X className="size-4" />
              </button>
            </div>
            <CartPanel className="min-h-0 flex-1" {...cartPanelProps} />
          </div>
        </div>
      )}

      <SuccessDialog
        transaction={success}
        onClose={() => setSuccess(null)}
      />
    </>
  )
}
