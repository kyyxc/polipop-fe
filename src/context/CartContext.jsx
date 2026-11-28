import { useCallback, useEffect, useMemo, useState } from 'react'
import { getExportProducts } from '../lib/productService.js'
import { CartContext } from './cart-context.js'

const CART_STORAGE_KEY = 'polipop-cart'

function readStoredCart() {
  try {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.productId === 'string' &&
          Number.isFinite(Number(item.price)) &&
          Number.isInteger(Number(item.qty)) &&
          Number(item.qty) > 0,
      )
      .map((item) => ({
        productId: item.productId,
        name: String(item.name ?? ''),
        price: Math.max(0, Number(item.price)),
        qty: Number(item.qty),
        discount: Math.max(0, Number(item.discount) || 0),
      }))
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [cart, setCart] = useState(readStoredCart)
  const [cartError, setCartError] = useState('')

  useEffect(() => {
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // Keranjang tetap dipakai dalam sesi ini bila storage tidak tersedia.
    }
  }, [cart])

  // Kasir dan QR memakai produk dari API yang sama dengan halaman Produk.
  // Stok di server menjadi sumber kebenaran; transaksi yang berhasil dibuat
  // memicu reload agar kartu produk menampilkan stok terbaru.
  useEffect(() => {
    let active = true

    async function loadProducts() {
      setLoading(true)
      try {
        const rows = await getExportProducts()
        if (!active) return
        setProducts(rows)
        setLoadError(null)
        // Keranjang yang dipulihkan bisa berisi produk yang sudah dihapus atau
        // stoknya berubah. Buang item tersebut setelah katalog API dimuat.
        setCart((current) => {
          const valid = current.filter((item) =>
            rows.some(
              (product) =>
                product.id === item.productId && product.stock >= item.qty,
            ),
          )
          return valid.length === current.length ? current : valid
        })
      } catch (err) {
        if (active) setLoadError(err.message || 'Gagal memuat produk.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProducts()
    return () => {
      active = false
    }
  }, [reloadKey])

  const visibleProducts = useMemo(
    () => products.filter((product) => product.active !== false),
    [products],
  )

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1)
  }, [])

  const addToCart = useCallback(
    (product) => {
      if (!product) return { ok: false, reason: 'Produk tidak ditemukan.' }
      if (product.active === false) {
        return { ok: false, reason: 'Produk tidak tersedia.' }
      }
      if (product.stock <= 0) {
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
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
