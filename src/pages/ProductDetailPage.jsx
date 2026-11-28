import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import DeleteProductDialog from '../components/products/DeleteProductDialog.jsx'
import ProductFormModal from '../components/products/ProductFormModal.jsx'
import ProductMutationList from '../components/products/ProductMutationList.jsx'
import StockAdjustmentModal from '../components/products/StockAdjustmentModal.jsx'
import { useToast } from '../components/ui/toast-context.js'
import { useCart } from '../context/cart-context.js'
import { productImagePlaceholder } from '../config/images.js'
import { formatDateTime, formatRupiah } from '../lib/format.js'
import {
  adjustStock,
  deactivateProduct,
  deleteProductImage,
  getActiveCategories,
  getProductById,
  getProductMutations,
  updateProduct,
} from '../lib/productService.js'

const LIST_ROUTE_KEY = 'polipop-products-route'
const MUTATIONS_PER_PAGE = 10
const emptyMutations = {
  items: [],
  total: 0,
  page: 1,
  perPage: MUTATIONS_PER_PAGE,
  totalPages: 1,
}

function previousListRoute() {
  try {
    const saved = sessionStorage.getItem(LIST_ROUTE_KEY)
    if (saved?.startsWith('#/products')) return saved.slice(1)
  } catch {
    // sessionStorage tidak tersedia: kembali ke daftar tanpa filter.
  }
  return '/products'
}

function InfoField({ label, children, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{children}</dd>
    </div>
  )
}

export default function ProductDetailPage({ productId, onNavigate }) {
  const { showToast } = useToast()
  const { reload: reloadCart } = useCart()

  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [mutations, setMutations] = useState(emptyMutations)
  const [mutationsLoading, setMutationsLoading] = useState(true)
  const [mutationsError, setMutationsError] = useState(null)

  const backToList = () => onNavigate(previousListRoute())

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getProductById(productId)
        if (active) setProduct(data)
      } catch (err) {
        if (active) {
          setProduct(null)
          setError(err.message || 'Produk tidak ditemukan.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }, 0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [productId, reloadKey])

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setMutationsLoading(true)
      setMutationsError(null)
      try {
        const data = await getProductMutations(productId, {
          perPage: MUTATIONS_PER_PAGE,
        })
        if (active) setMutations(data)
      } catch (err) {
        if (active) {
          setMutations(emptyMutations)
          setMutationsError(err.message || 'Gagal memuat riwayat mutasi.')
        }
      } finally {
        if (active) setMutationsLoading(false)
      }
    }, 0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [productId, reloadKey])

  useEffect(() => {
    let active = true
    getActiveCategories()
      .then((data) => {
        if (active) setCategories(data)
      })
      .catch(() => {
        if (active) setCategories([])
      })
    return () => {
      active = false
    }
  }, [])

  const refreshData = () => {
    setReloadKey((key) => key + 1)
    reloadCart()
  }

  const handleEditSubmit = async (payload) => {
    try {
      await updateProduct(productId, payload)
      showToast('success', 'Produk berhasil diperbarui')
      setFormOpen(false)
      refreshData()
    } catch (err) {
      showToast('error', err.message || 'Gagal memperbarui produk.')
      throw err
    }
  }

  const handleDeleteImage = async (id) => {
    try {
      await deleteProductImage(id)
      showToast('success', 'Gambar produk berhasil dihapus')
      setProduct((current) =>
        current ? { ...current, image: productImagePlaceholder } : current,
      )
      refreshData()
    } catch (err) {
      showToast('error', err.message || 'Gagal menghapus gambar produk.')
      throw err
    }
  }

  const handleAdjustSubmit = async (payload) => {
    try {
      await adjustStock(productId, payload)
      showToast('success', 'Stok berhasil diperbarui')
      setAdjustOpen(false)
      refreshData()
    } catch (err) {
      showToast('error', err.message || 'Gagal memperbarui stok.')
      throw err
    }
  }

  const handleDeleteSubmit = async () => {
    try {
      await deactivateProduct(productId)
      showToast('success', 'Produk berhasil dihapus')
      setDeleteOpen(false)
      onNavigate(previousListRoute())
    } catch (err) {
      showToast('error', err.message || 'Gagal menghapus produk.')
      throw err
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={backToList}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-pink-mist bg-surface px-4 text-xs font-semibold text-ink-muted transition hover:bg-pink-light hover:text-pink-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </button>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            disabled={loading || !product}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-pink-mist bg-surface px-4 text-xs font-semibold text-pink-dark transition hover:bg-pink-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary disabled:opacity-50 sm:w-auto"
          >
            <Pencil className="size-4" />
            Edit Product
          </button>
          <button
            type="button"
            onClick={() => setAdjustOpen(true)}
            disabled={loading || !product}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-pink-dark px-4 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light disabled:opacity-50 sm:w-auto"
          >
            <Plus className="size-4" />
            Atur Stok
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            disabled={loading || !product}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-error/30 bg-surface px-4 text-xs font-semibold text-error transition hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error disabled:opacity-50 sm:w-auto"
          >
            <Trash2 className="size-4" />
            Delete Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-pink-mist bg-surface px-6 py-20 text-center">
          <LoaderCircle className="size-6 animate-spin text-pink-dark" />
          <p className="mt-3 text-sm text-ink-muted">Memuat detail produk...</p>
        </div>
      ) : error || !product ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-error/30 bg-error/5 px-6 py-16 text-center">
          <AlertCircle className="size-8 text-error" />
          <p className="mt-3 text-sm font-semibold text-ink">
            {error || 'Produk tidak ditemukan.'}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Produk mungkin sudah dihapus atau bukan milik akun ini.
          </p>
          <button
            type="button"
            onClick={backToList}
            className="mt-5 rounded-xl bg-pink-dark px-4 py-2.5 text-xs font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-light"
          >
            Kembali ke daftar
          </button>
        </div>
      ) : (
        <>
          <section
            aria-label="Informasi produk"
            className="mt-5 rounded-2xl border border-pink-mist bg-surface p-5 shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)] sm:p-6"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <img
                src={product.image}
                alt={`Gambar produk ${product.name}`}
                className="size-32 shrink-0 rounded-xl border border-pink-mist object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  Product Information
                </p>
                <h1 className="mt-0.5 text-xl font-bold tracking-tight text-ink">
                  {product.name}
                </h1>
                <p className="mt-1 font-mono text-xs text-ink-muted">
                  {product.barcode}
                </p>

                <dl className="mt-5 grid gap-4 border-t border-pink-mist pt-5 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoField label="ID" className="break-all font-mono text-xs">
                    {product.id}
                  </InfoField>
                  <InfoField label="Barcode" className="font-mono text-xs">
                    {product.barcode}
                  </InfoField>
                  <InfoField label="Name">{product.name}</InfoField>
                  <InfoField label="Category">{product.categoryName}</InfoField>
                  <InfoField label="Price">
                    <span className="text-pink-dark">
                      {formatRupiah(product.price)}
                    </span>
                  </InfoField>
                  <InfoField label="Stock">
                    {product.stock} {product.unit}
                  </InfoField>
                  <InfoField label="Unit">{product.unit}</InfoField>
                  <InfoField label="Created At" className="text-xs">
                    {formatDateTime(product.createdAt)}
                  </InfoField>
                  <InfoField label="Updated At" className="text-xs">
                    {formatDateTime(product.updatedAt)}
                  </InfoField>
                </dl>
              </div>
            </div>
          </section>

          <section
            aria-label="Ringkasan stok"
            className="mt-5 flex flex-col gap-4 rounded-2xl border border-pink-mist bg-surface p-5 shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)] sm:flex-row sm:items-center sm:justify-between sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-pink-light text-pink-dark">
                <Package className="size-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                  Stock Summary
                </p>
                <p className="mt-0.5 text-lg font-bold text-ink">
                  {product.stock} {product.unit}
                </p>
              </div>
            </div>
            <p className="text-xs text-ink-muted">
              Gunakan tombol Atur Stok untuk menambah, mengurangi, atau
              menyesuaikan stok.
            </p>
          </section>

          <section
            aria-label="Riwayat mutasi stok"
            className="mt-5 rounded-2xl border border-pink-mist bg-surface p-5 shadow-[0_20px_50px_-38px_rgba(194,96,122,0.55)] sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-ink">
                  Product Mutation History
                </h2>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {mutations.total} mutasi tercatat untuk produk ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onNavigate(
                    `/stock/history?q=${encodeURIComponent(product.name)}`,
                  )
                }
                className="inline-flex h-9 items-center rounded-xl border border-pink-mist bg-surface px-3 text-xs font-semibold text-pink-dark transition hover:bg-pink-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-primary"
              >
                Lihat semua
              </button>
            </div>
            <div className="mt-4">
              <ProductMutationList
                items={mutations.items}
                loading={mutationsLoading}
                error={mutationsError}
                onRetry={() => setReloadKey((key) => key + 1)}
              />
            </div>
          </section>

          {formOpen && (
            <ProductFormModal
              open
              mode="edit"
              product={product}
              categories={categories}
              onSubmit={handleEditSubmit}
              onDeleteImage={handleDeleteImage}
              onClose={() => setFormOpen(false)}
            />
          )}

          {adjustOpen && (
            <StockAdjustmentModal
              open
              product={product}
              allowAdjustment
              onSubmit={handleAdjustSubmit}
              onClose={() => setAdjustOpen(false)}
            />
          )}

          {deleteOpen && (
            <DeleteProductDialog
              open
              product={product}
              title="Delete Product?"
              description="Are you sure you want to delete this product? This action will remove the product from your active product list."
              confirmLabel="Delete Product"
              onSubmit={handleDeleteSubmit}
              onClose={() => setDeleteOpen(false)}
            />
          )}
        </>
      )}
    </main>
  )
}
