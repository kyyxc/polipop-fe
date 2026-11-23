import { useCallback, useEffect, useMemo, useState } from 'react'
import { currentWarungId } from '../data/mockKasir.js'
import {
  getAllProducts,
  recordSaleStock,
  subscribeProducts,
} from '../lib/productService.js'
import { CartContext } from './cart-context.js'

export function CartProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [cart, setCart] = useState([])
  const [cartError, setCartError] = useState('')

  // Simulasi GET produk: data lokal dari productService, tanpa backend. State
  // produk dan keranjang sengaja global agar /QR bisa menambah barang ke Kasir,
  // dan perubahan dari Products Page langsung terlihat di Kasir.
  useEffect(() => {
    const timer = setTimeout(() => {
      setProducts(getAllProducts())
      setLoadError(null)
      setLoading(false)
    }, 600)
    const unsubscribe = subscribeProducts(() => setProducts(getAllProducts()))
    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [reloadKey])

  const visibleProducts = useMemo(
    () =>
      products.filter(
        (product) => product.active && product.warungId === currentWarungId,
      ),
    [products],
  )

  const reload = useCallback(() => {
    setLoading(true)
    setReloadKey((key) => key + 1)
  }, [])

  const addToCart = useCallback(
    (product) => {
      if (!product) return { ok: false, reason: 'Produk tidak ditemukan.' }
      if (!product.active || product.warungId !== currentWarungId) {
        return { ok: false, reason: 'Produk tidak tersedia untuk warung ini.' }
      }
      if (product.stock === 0) {
        return { ok: false, reason: 'Stok produk habis.' }
      }

      const existing = cart.find((item) => item.productId === product.id)
      if (existing && existing.qty >= product.stock) {
        setCartError('Jumlah melebihi stok tersedia')
        return { ok: false, reason: 'Jumlah melebihi stok tersedia' }
      }

      setCartError('')
      setCart((current) =>
        existing
          ? current.map((item) =>
              item.productId === product.id
                ? { ...item, qty: item.qty + 1 }
                : item,
            )
          : [
              ...current,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                qty: 1,
                discount: 0,
              },
            ],
      )
      return { ok: true, product }
    },
    [cart],
  )

  const setQty = useCallback(
    (productId, nextQty) => {
      const stock =
        products.find((product) => product.id === productId)?.stock ?? 0

      if (nextQty > stock) {
        setCartError('Jumlah melebihi stok tersedia')
        return
      }

      setCartError('')
      if (nextQty < 1) {
        setCart((current) =>
          current.filter((item) => item.productId !== productId),
        )
        return
      }

      setCart((current) =>
        current.map((item) =>
          item.productId === productId ? { ...item, qty: nextQty } : item,
        ),
      )
    },
    [products],
  )

  const removeItem = useCallback((productId) => {
    setCartError('')
    setCart((current) =>
      current.filter((item) => item.productId !== productId),
    )
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setCartError('')
  }, [])

  const decrementStock = useCallback((paidItems) => {
    // Stok dan riwayat mutasi ditulis sekaligus oleh productService.
    setProducts(recordSaleStock(paidItems))
  }, [])

  const value = useMemo(
    () => ({
      products,
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
    }),
    [
      products,
      visibleProducts,
      loading,
      loadError,
      reload,
      cart,
      cartError,
      addToCart,
      setQty,
      removeItem,
      clearCart,
      decrementStock,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
