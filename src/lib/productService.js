import { currentUserId, mockCategories } from '../data/mockCategories.js'
import {
  currentWarungId,
  mockProducts,
  productImagePlaceholder,
} from '../data/mockKasir.js'

// Implementasi lokal untuk simulasi endpoint /products. Seluruh perubahan
// disimpan di localStorage agar tetap konsisten dengan halaman Kasir/QR.
const PRODUCTS_KEY = 'polipop-products'
const CATEGORIES_KEY = 'polipop-categories'
const PRODUCTS_EVENT = 'polipop-products-changed'
const PER_PAGE_OPTIONS = [10, 25, 50]
const SORT_FIELDS = ['name', 'price', 'stock']
const MAX_IMAGE_SIZE = 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const DEFAULT_DATE = '2026-01-01T00:00:00'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export class ProductApiError extends Error {
  constructor(code, message, fields = {}) {
    super(message)
    this.name = 'ProductApiError'
    this.code = code
    this.fields = fields
  }
}

function keyOf(value) {
  return String(value ?? '').toLocaleLowerCase('id-ID')
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function seedHistory(product, stock) {
  return [
    {
      id: `stock-${product.id}-initial`,
      type: 'initial_stock',
      quantity: stock,
      previousStock: 0,
      stockAfter: stock,
      notes: 'Stok awal produk',
      createdAt: product.createdAt ?? DEFAULT_DATE,
      userId: currentUserId,
    },
  ]
}

function normalizeProduct(raw) {
  const stock = Math.max(0, Number(raw.stock) || 0)

  return {
    id: raw.id,
    warungId: raw.warungId ?? currentWarungId,
    categoryId: raw.categoryId ?? '',
    barcode: raw.barcode ?? `PRD-${raw.id}`,
    name: raw.name ?? '',
    price: Math.max(0, Math.round(Number(raw.price) || 0)),
    stock,
    unit: raw.unit ?? 'pcs',
    image: raw.image ?? productImagePlaceholder,
    active: raw.active !== false,
    history:
      Array.isArray(raw.history) && raw.history.length > 0
        ? raw.history
        : seedHistory(raw, stock),
    createdAt: raw.createdAt ?? DEFAULT_DATE,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? DEFAULT_DATE,
  }
}

function readStore() {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(normalizeProduct)
    }
  } catch {
    // Data rusak: gunakan data contoh agar halaman tetap dapat dipakai.
  }
  return mockProducts.map(normalizeProduct)
}

function writeStore(products) {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
  } catch {
    // localStorage tidak tersedia: perubahan tetap berlaku dalam sesi ini.
  }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(PRODUCTS_EVENT))
  }
}

function readCategories() {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // Abaikan data kategori yang rusak.
  }
  return mockCategories.map((category) => ({ ...category }))
}

function decorate(products) {
  const names = new Map(readCategories().map((category) => [category.id, category.name]))

  return products.map((product) => ({
    ...product,
    categoryName: names.get(product.categoryId) ?? '-',
  }))
}

function filterProducts(filters = {}) {
  const query = keyOf(filters.q).trim()
  const orderBy = SORT_FIELDS.includes(filters.order_by)
    ? filters.order_by
    : 'name'
  const direction = filters.sort === 'desc' ? -1 : 1

  const rows = readStore().filter(
    (product) => product.active && product.warungId === currentWarungId,
  )
  const decorated = decorate(rows)
  const matched = query
    ? decorated.filter(
        (product) =>
          keyOf(product.barcode).includes(query) ||
          keyOf(product.name).includes(query) ||
          keyOf(product.categoryName).includes(query),
      )
    : decorated

  return matched.sort((left, right) => {
    let result
    if (orderBy === 'price') result = left.price - right.price
    else if (orderBy === 'stock') result = left.stock - right.stock
    else result = left.name.localeCompare(right.name, 'id-ID')

    if (result === 0) result = left.name.localeCompare(right.name, 'id-ID')
    return result * direction
  })
}

function validateImageFile(file) {
  if (!file) return 'Gambar produk wajib diunggah'
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Format gambar tidak didukung'
  if (file.size > MAX_IMAGE_SIZE) return 'Ukuran gambar maksimal 1 MB'
  return ''
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Gagal membaca gambar.'))
    reader.readAsDataURL(file)
  })
}

function validateProductPayload(payload, { categories, products, editing = false }) {
  const fields = {}
  const barcode = String(payload.barcode ?? '').trim()
  const name = String(payload.name ?? '').trim()
  const categoryId = String(payload.categoryId ?? '').trim()
  const unit = String(payload.unit ?? '').trim()
  const price = Number(payload.price)
  const stock = Number(payload.initial_stock)
  const ownActiveProducts = products.filter(
    (product) => product.active && product.warungId === currentWarungId,
  )
  const isDuplicate = (field, value) =>
    ownActiveProducts.some(
      (product) =>
        product.id !== (editing ? payload.id : null) &&
        keyOf(product[field]) === keyOf(value),
    )

  if (!barcode) {
    fields.barcode = 'Barcode wajib diisi'
  } else if (!/^[A-Za-z0-9-]{4,32}$/.test(barcode)) {
    // Standar barcode masih open decision; pola ini sengaja dibuat permissif
    // (alphanumerik dan tanda hubung) sampai keputusan final ditetapkan.
    fields.barcode = 'Format barcode tidak valid'
  } else if (isDuplicate('barcode', barcode)) {
    fields.barcode = 'Barcode sudah digunakan'
  }

  if (!name) {
    fields.name = 'Nama produk wajib diisi'
  } else if (name.length > 100) {
    fields.name = 'Nama produk maksimal 100 karakter'
  } else if (isDuplicate('name', name)) {
    fields.name = 'Nama produk sudah digunakan'
  }

  if (!categoryId || !categories.some((category) => category.id === categoryId)) {
    fields.categoryId = 'Kategori wajib dipilih'
  }

  if (
    payload.price === '' ||
    payload.price === null ||
    payload.price === undefined ||
    !Number.isInteger(price) ||
    price < 0
  ) {
    fields.price = 'Harga jual tidak valid'
  }

  if (!editing) {
    if (
      payload.initial_stock === '' ||
      payload.initial_stock === null ||
      payload.initial_stock === undefined ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      fields.initial_stock = 'Stok awal tidak valid'
    }
  }

  if (!unit) {
    fields.unit = 'Satuan wajib diisi'
  } else if (unit.length > 20) {
    fields.unit = 'Satuan maksimal 20 karakter'
  }

  if (!editing && !payload.image) {
    fields.image = 'Gambar produk wajib diunggah'
  } else if (
    payload.image &&
    typeof payload.image === 'string' &&
    !payload.image.startsWith('data:image/')
  ) {
    fields.image = 'Format gambar tidak didukung'
  }

  return fields
}

function assertNoErrors(fields) {
  if (Object.keys(fields).length > 0) {
    throw new ProductApiError('VALIDATION', 'Periksa kembali data produk.', fields)
  }
}

// Simulasi GET /products — hanya produk aktif milik warung/user aktif.
export async function getProducts(filters = {}) {
  await delay(500)
  const all = filterProducts(filters)
  const perPage = PER_PAGE_OPTIONS.includes(Number(filters.per_page))
    ? Number(filters.per_page)
    : 10
  const totalPages = Math.max(1, Math.ceil(all.length / perPage))
  const requestedPage = Number(filters.page)
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.min(Math.floor(requestedPage), totalPages)
      : 1

  return {
    items: all.slice((page - 1) * perPage, page * perPage),
    total: all.length,
    page,
    perPage,
    totalPages,
  }
}

// Simulasi GET /api/products/export — tidak terikat pagination.
export async function getExportProducts(filters = {}) {
  await delay(350)
  return filterProducts(filters)
}

// Simulasi GET /products/:id.
export async function getProductById(id) {
  await delay(400)
  const product = decorate(readStore()).find(
    (entry) =>
      entry.id === id && entry.active && entry.warungId === currentWarungId,
  )
  if (!product) {
    throw new ProductApiError('NOT_FOUND', 'Produk tidak ditemukan.')
  }
  return product
}

// Simulasi GET /api/categories yang dipakai form produk.
export async function getActiveCategories() {
  await delay(300)
  return readCategories()
    .filter((category) => category.userId === currentUserId)
    .map((category) => ({ id: category.id, name: category.name }))
    .sort((left, right) => left.name.localeCompare(right.name, 'id-ID'))
}

// Simulasi POST /products (multipart/form-data).
export async function createProduct(payload) {
  await delay(600)
  const products = readStore()
  const categories = readCategories().filter(
    (category) => category.userId === currentUserId,
  )
  const fields = validateProductPayload(payload, { categories, products })
  assertNoErrors(fields)

  const stock = Number(payload.initial_stock)
  const id = generateId()
  const now = new Date().toISOString()
  const created = normalizeProduct({
    id,
    warungId: currentWarungId,
    categoryId: String(payload.categoryId).trim(),
    barcode: String(payload.barcode).trim(),
    name: String(payload.name).trim(),
    price: Number(payload.price),
    stock,
    unit: String(payload.unit).trim(),
    image: payload.image,
    active: true,
    history: [
      {
        id: `stock-${id}-initial`,
        type: 'initial_stock',
        quantity: stock,
        previousStock: 0,
        stockAfter: stock,
        notes: 'Stok awal produk',
        createdAt: now,
        userId: currentUserId,
      },
    ],
    createdAt: now,
    updatedAt: now,
  })

  writeStore([...products, created])
  return decorate([created])[0]
}

// Simulasi PUT /products/:id. Stok sengaja tidak diubah di sini.
export async function updateProduct(id, payload) {
  await delay(600)
  const products = readStore()
  const index = products.findIndex(
    (product) =>
      product.id === id && product.active && product.warungId === currentWarungId,
  )
  if (index === -1) {
    throw new ProductApiError('NOT_FOUND', 'Produk tidak ditemukan.')
  }

  const categories = readCategories().filter(
    (category) => category.userId === currentUserId,
  )
  const fields = validateProductPayload(
    { ...payload, id },
    { categories, products, editing: true },
  )
  assertNoErrors(fields)

  const now = new Date().toISOString()
  const updated = {
    ...products[index],
    barcode: String(payload.barcode).trim(),
    name: String(payload.name).trim(),
    categoryId: String(payload.categoryId).trim(),
    price: Number(payload.price),
    unit: String(payload.unit).trim(),
    image: payload.image || products[index].image,
    updatedAt: now,
  }
  const next = [...products]
  next[index] = updated
  writeStore(next)
  return decorate([updated])[0]
}

// Simulasi POST /products/:id/stock. Perubahan stok + mutasi ditulis sekaligus.
export async function adjustStock(id, payload) {
  await delay(600)
  const products = readStore()
  const index = products.findIndex(
    (product) =>
      product.id === id && product.active && product.warungId === currentWarungId,
  )
  if (index === -1) {
    throw new ProductApiError('NOT_FOUND', 'Produk tidak ditemukan.')
  }

  const fields = {}
  const type = payload.type
  const quantity = Number(payload.quantity)
  const product = products[index]

  if (type !== 'masuk' && type !== 'keluar') {
    fields.type = 'Jenis mutasi wajib dipilih'
  }
  if (
    payload.quantity === '' ||
    payload.quantity === null ||
    payload.quantity === undefined ||
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    fields.quantity = 'Jumlah stok harus lebih besar dari 0'
  } else if (type === 'keluar' && quantity > product.stock) {
    // Pemeriksaan ulang terhadap stok terbaru di "database" lokal.
    fields.quantity = 'Stok tidak mencukupi'
  }
  assertNoErrors(fields)

  const now = new Date().toISOString()
  const stockAfter =
    type === 'masuk' ? product.stock + quantity : product.stock - quantity
  const mutation = {
    id: `stock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    quantity,
    previousStock: product.stock,
    stockAfter,
    notes: String(payload.notes ?? '').trim(),
    createdAt: now,
    userId: currentUserId,
  }
  const updated = {
    ...product,
    stock: stockAfter,
    history: [...product.history, mutation],
    updatedAt: now,
  }
  const next = [...products]
  next[index] = updated
  writeStore(next)
  return decorate([updated])[0]
}

// Simulasi DELETE /products/:id (soft delete).
export async function deactivateProduct(id) {
  await delay(600)
  const products = readStore()
  const index = products.findIndex(
    (product) =>
      product.id === id && product.active && product.warungId === currentWarungId,
  )
  if (index === -1) {
    throw new ProductApiError('NOT_FOUND', 'Produk tidak ditemukan.')
  }

  const updated = { ...products[index], active: false, updatedAt: new Date().toISOString() }
  const next = [...products]
  next[index] = updated
  writeStore(next)
  return decorate([updated])[0]
}

// Dipakai CartContext saat transaksi selesai: stok berkurang dan riwayat
// mutasi bertipe keluar tetap tercatat.
export function recordSaleStock(paidItems = []) {
  const products = readStore()
  const now = new Date().toISOString()
  let changed = false

  const next = products.map((product) => {
    const item = paidItems.find((entry) => entry.productId === product.id)
    const quantity = Math.max(0, Number(item?.qty) || 0)
    if (
      !item ||
      !quantity ||
      !product.active ||
      product.warungId !== currentWarungId
    ) {
      return product
    }

    changed = true
    const stockAfter = Math.max(0, product.stock - quantity)
    return {
      ...product,
      stock: stockAfter,
      history: [
        ...product.history,
        {
          id: `stock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'keluar',
          quantity,
          previousStock: product.stock,
          stockAfter,
          notes: 'Penjualan',
          createdAt: now,
          userId: currentUserId,
        },
      ],
      updatedAt: now,
    }
  })

  if (changed) writeStore(next)
  return next
}

// Pembacaan sinkron untuk shared state Kasir/QR.
export function getAllProducts() {
  return readStore()
}

export function subscribeProducts(listener) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(PRODUCTS_EVENT, listener)
  return () => window.removeEventListener(PRODUCTS_EVENT, listener)
}

export { validateImageFile, readFileAsDataUrl }
