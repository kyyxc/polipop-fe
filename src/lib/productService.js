import { currentUserId, mockCategories } from '../data/mockCategories.js'
import {
  currentWarungId,
  mockProducts,
  productImagePlaceholder,
} from '../data/mockKasir.js'
import { getCategoryOptions } from './categoryService.js'

// Halaman Produk memakai API. Data lokal/localStorage tetap dipertahankan untuk
// Kasir, QR, dan riwayat stok yang belum tersedia endpoint API-nya.
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

const PRODUCTS_KEY = 'polipop-products'
const CATEGORIES_KEY = 'polipop-categories'
const PRODUCTS_EVENT = 'polipop-products-changed'
const PER_PAGE_OPTIONS = [10, 25, 50]
const SORT_FIELDS = ['name', 'price', 'stock', 'created_at']
const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const DEFAULT_DATE = '2026-01-01T00:00:00'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Menampilkan nama kategori API pada data produk lokal (Kasir/QR).
let categoryNameCache = new Map()

export class ProductApiError extends Error {
  constructor(code, message, fields = {}, status = null) {
    super(message)
    this.name = 'ProductApiError'
    this.code = code
    this.fields = fields
    this.status = status
  }
}

async function readJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function resolveCode(status) {
  if (status === 401 || status === 403) return 'UNAUTHORIZED'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'DUPLICATE'
  if (status === 413 || status === 415) return 'IMAGE'
  if (status === 400 || status === 422) return 'VALIDATION'
  return 'UNKNOWN'
}

function localizeMessage(code, rawMessage) {
  const text = String(rawMessage ?? '').toLocaleLowerCase('id-ID')

  if (text.includes('at most 150 characters')) return 'Maksimal 150 karakter'
  if (text.includes('at most 50 characters')) return 'Maksimal 50 karakter'
  if (text.includes('at most 30 characters')) return 'Maksimal 30 karakter'
  if (text.includes('field required')) return 'Wajib diisi'
  if (text.includes('valid decimal') || text.includes('decimal_places')) {
    return 'Nilai tidak valid'
  }
  if (code === 'UNAUTHORIZED') return 'Sesi Anda tidak valid. Silakan login kembali.'
  if (code === 'NOT_FOUND' || text.includes('not found')) return 'Produk tidak ditemukan.'
  if (text.includes('barcode already')) return 'Barcode sudah digunakan'
  if (text.includes('category not found')) return 'Kategori tidak ditemukan'
  if (text.includes('no fields to update')) return 'Tidak ada perubahan untuk disimpan'
  if (text.includes('at most')) return 'Ukuran gambar maksimal 2 MB'
  if (text.includes('valid jpeg') || text.includes('file is empty')) {
    return 'Format gambar tidak didukung'
  }
  if (code === 'VALIDATION') return 'Periksa kembali data produk.'
  return rawMessage || 'Permintaan gagal. Silakan coba lagi.'
}

function localizeFieldMessage(message) {
  const text = String(message ?? '').toLocaleLowerCase('id-ID')

  if (text.includes('barcode already')) return 'Barcode sudah digunakan'
  if (text.includes('category not found')) return 'Kategori tidak ditemukan'
  if (text.includes('at most 150 characters')) return 'Maksimal 150 karakter'
  if (text.includes('at most 50 characters')) return 'Maksimal 50 karakter'
  if (text.includes('at most 30 characters')) return 'Maksimal 30 karakter'
  if (text.includes('field required')) return 'Wajib diisi'
  if (
    text.includes('valid decimal') ||
    text.includes('decimal_places') ||
    text.includes('greater than or equal to 0')
  ) {
    return 'Nilai tidak valid'
  }
  return message
}

function mapFieldErrors(rawErrors) {
  const fields = {}
  const alias = {
    category_id: 'categoryId',
    stock: 'initial_stock',
    file: 'image',
  }

  rawErrors.forEach((error) => {
    const message = error?.message
    if (!message) return
    const field = alias[error?.field] ?? error?.field
    if (field) fields[field] = localizeFieldMessage(message)
  })

  return fields
}

async function request(path, { method = 'GET', body } = {}) {
  let response
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: isFormData || body === undefined
        ? undefined
        : { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    })
  } catch {
    throw new ProductApiError(
      'NETWORK',
      'Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.',
    )
  }

  const payload = await readJson(response)

  if (!response.ok) {
    const rawErrors = Array.isArray(payload?.errors) ? payload.errors : []
    const rawMessage = rawErrors
      .map((error) => error?.message)
      .filter(Boolean)
      .join(' ')
    const code = resolveCode(response.status)

    throw new ProductApiError(
      code,
      localizeMessage(code, rawMessage),
      mapFieldErrors(rawErrors),
      response.status,
    )
  }

  return payload
}

function normalizeProductFromApi(raw) {
  return {
    id: String(raw?.id ?? ''),
    categoryId: String(raw?.category?.id ?? ''),
    categoryName: raw?.category?.name ?? '-',
    barcode: raw?.barcode ?? '',
    name: String(raw?.name ?? '').trim(),
    image: raw?.image ?? productImagePlaceholder,
    price: Math.max(0, Number(raw?.price) || 0),
    stock: Math.max(0, Number(raw?.stock) || 0),
    unit: String(raw?.unit ?? 'pcs'),
    active: true,
    history: [],
    createdAt: raw?.created_at ?? raw?.createdAt ?? '',
    updatedAt: raw?.updated_at ?? raw?.updatedAt ?? '',
  }
}

function keyOf(value) {
  return String(value ?? '').toLocaleLowerCase('id-ID')
}

// Contoh mutasi agar halaman riwayat stok memiliki data lintas produk saat
// pertama dibuka. Referensi memakai nomor transaksi dari data contoh.
const SEEDED_MUTATIONS = {
  'prod-01': [
    { type: 'masuk', quantity: 10, createdAt: '2026-11-18T08:10:00', notes: 'Penerimaan supplier' },
    { type: 'keluar', quantity: 1, createdAt: '2026-11-22T17:40:00', notes: 'Penjualan', reference: 'TRX-20261122-008' },
    { type: 'keluar', quantity: 2, createdAt: '2026-11-23T14:30:00', notes: 'Penjualan', reference: 'TRX-20261123-006' },
  ],
  'prod-03': [
    { type: 'keluar', quantity: 2, createdAt: '2026-11-21T20:02:00', notes: 'Penjualan', reference: 'TRX-20261121-012' },
    { type: 'keluar', quantity: 1, createdAt: '2026-11-23T11:45:00', notes: 'Penjualan', reference: 'TRX-20261123-004' },
  ],
  'prod-04': [
    { type: 'masuk', quantity: 6, createdAt: '2026-11-17T09:00:00', notes: 'Penerimaan supplier' },
    { type: 'keluar', quantity: 1, createdAt: '2026-11-21T16:25:00', notes: 'Penjualan', reference: 'TRX-20261121-011' },
    { type: 'keluar', quantity: 2, createdAt: '2026-11-22T19:05:00', notes: 'Penjualan', reference: 'TRX-20261122-009' },
  ],
  'prod-05': [
    { type: 'keluar', quantity: 4, createdAt: '2026-11-22T15:18:00', notes: 'Penjualan', reference: 'TRX-20261122-007' },
    { type: 'keluar', quantity: 2, createdAt: '2026-11-23T11:45:00', notes: 'Penjualan', reference: 'TRX-20261123-004' },
  ],
  'prod-07': [
    { type: 'masuk', quantity: 10, createdAt: '2026-11-19T10:15:00', notes: 'Penerimaan supplier' },
    { type: 'keluar', quantity: 2, createdAt: '2026-11-21T20:02:00', notes: 'Penjualan', reference: 'TRX-20261121-012' },
    { type: 'keluar', quantity: 3, createdAt: '2026-11-23T13:12:00', notes: 'Penjualan', reference: 'TRX-20261123-005' },
  ],
}

function seedHistory(product, stock) {
  const examples = SEEDED_MUTATIONS[product.id] ?? []
  const totalDelta = examples.reduce(
    (sum, entry) =>
      sum + (entry.type === 'keluar' ? -entry.quantity : entry.quantity),
    0,
  )
  const initialStock = Math.max(0, stock - totalDelta)
  let cursor = initialStock

  const mutations = examples.map((entry, index) => {
    const change = entry.type === 'keluar' ? -entry.quantity : entry.quantity
    const previousStock = cursor
    cursor += change

    return {
      id: `stock-${product.id}-seed-${index + 1}`,
      type: entry.type,
      quantity: entry.quantity,
      quantityChange: change,
      previousStock,
      stockAfter: cursor,
      notes: entry.notes,
      reference: entry.reference
        ? { type: 'transaction', id: entry.reference, no: entry.reference }
        : null,
      createdAt: entry.createdAt,
      userId: currentUserId,
    }
  })

  return [
    {
      id: `stock-${product.id}-initial`,
      type: 'initial_stock',
      quantity: initialStock,
      quantityChange: initialStock,
      previousStock: 0,
      stockAfter: initialStock,
      notes: 'Stok awal produk',
      createdAt: product.createdAt ?? DEFAULT_DATE,
      userId: currentUserId,
    },
    ...mutations,
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
  const names = new Map([
    ...readCategories().map((category) => [category.id, category.name]),
    ...categoryNameCache,
  ])

  return products.map((product) => ({
    ...product,
    categoryName: names.get(product.categoryId) ?? '-',
  }))
}

function validateImageFile(file) {
  if (!file) return 'Gambar produk wajib diunggah'
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Format gambar tidak didukung'
  if (file.size > MAX_IMAGE_SIZE) return 'Ukuran gambar maksimal 2 MB'
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

function buildProductQuery(filters = {}, { page, perPage } = {}) {
  const params = new URLSearchParams({
    page: String(page ?? filters.page ?? 1),
    per_page: String(perPage ?? filters.perPage ?? filters.per_page ?? 10),
  })

  const sortBy = filters.orderBy ?? filters.sort_by ?? 'name'
  params.set('sort_by', SORT_FIELDS.includes(sortBy) ? sortBy : 'name')
  params.set('order', filters.sort === 'desc' ? 'desc' : 'asc')

  if (filters.q) params.set('search', String(filters.q).trim())
  if (filters.categoryId) params.set('category_id', String(filters.categoryId))
  return params
}

// GET /products?page=&per_page=&search=&category_id=&sort_by=&order=
export async function getProducts(filters = {}) {
  const params = buildProductQuery(filters)
  const payload = await request(`/products?${params.toString()}`)
  const meta = payload?.meta ?? {}
  const items = Array.isArray(payload?.data)
    ? payload.data.map(normalizeProductFromApi)
    : []

  return {
    items,
    total: Number(meta.total ?? items.length) || 0,
    page: Number(meta.page ?? filters.page ?? 1) || 1,
    perPage: Number(meta.per_page ?? filters.perPage ?? 10) || 10,
    totalPages: Math.max(1, Number(meta.total_pages ?? 1) || 1),
  }
}

// GET /products untuk ekspor: ambil seluruh halaman (maks. 100 per request).
export async function getExportProducts(filters = {}) {
  const first = await getProducts({ ...filters, page: 1, perPage: 100 })
  const rows = [...first.items]
  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await getProducts({ ...filters, page, perPage: 100 })
    rows.push(...next.items)
  }
  return rows
}

// GET /products/:id
export async function getProductById(id) {
  const payload = await request(`/products/${encodeURIComponent(id)}`)
  if (!payload?.data) {
    throw new ProductApiError('NOT_FOUND', 'Produk tidak ditemukan.')
  }
  return normalizeProductFromApi(payload.data)
}

// Endpoint mutasi belum tersedia; halaman detail menampilkan pesan ini.
export async function getProductMutations() {
  throw new ProductApiError(
    'UNAVAILABLE',
    'Riwayat mutasi produk belum tersedia.',
    {},
    501,
  )
}

// Simulasi GET /stock/history — menggabungkan mutasi seluruh produk warung.
export async function getStockHistory(filters = {}) {
  await delay(400)

  const query = keyOf(filters.q).trim()
  const type = ['masuk', 'keluar', 'penyesuaian', 'initial_stock'].includes(
    filters.type,
  )
    ? filters.type
    : ''
  const from = filters.from ? String(filters.from) : ''
  const to = filters.to ? String(filters.to) : ''

  const rows = readStore()
    .filter((product) => product.warungId === currentWarungId)
    .flatMap((product) =>
      (Array.isArray(product.history) ? product.history : []).map((entry) => ({
        ...entry,
        productId: product.id,
        productName: product.name,
        productBarcode: product.barcode,
        productUnit: product.unit,
      })),
    )
    .filter((entry) => !query || keyOf(entry.productName).includes(query) || keyOf(entry.productBarcode).includes(query))
    .filter((entry) => !type || entry.type === type)
    .filter((entry) => {
      const date = String(entry.createdAt).slice(0, 10)
      if (from && date < from) return false
      if (to && date > to) return false
      return true
    })
    .sort((left, right) => {
      const byDate = String(right.createdAt).localeCompare(String(left.createdAt))
      return byDate || String(right.id).localeCompare(String(left.id))
    })

  const requestedPerPage = Number(filters.per_page ?? filters.perPage)
  const perPage = PER_PAGE_OPTIONS.includes(requestedPerPage)
    ? requestedPerPage
    : 10
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage))
  const requestedPage = Number(filters.page)
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.min(Math.floor(requestedPage), totalPages)
      : 1

  return {
    items: rows.slice((page - 1) * perPage, page * perPage),
    total: rows.length,
    page,
    perPage,
    totalPages,
  }
}

// GET /categories yang dipakai form produk (data kategori berasal dari API).
export async function getActiveCategories() {
  const categories = await getCategoryOptions()
  categoryNameCache = new Map(categories.map((category) => [category.id, category.name]))
  return categories
}

// PUT /products/:id/image — multipart/form-data dengan field "file".
export async function uploadProductImage(id, file) {
  const formData = new FormData()
  formData.append('file', file)

  const payload = await request(`/products/${encodeURIComponent(id)}/image`, {
    method: 'PUT',
    body: formData,
  })
  return normalizeProductFromApi(payload?.data)
}

// DELETE /products/:id/image
export async function deleteProductImage(id) {
  await request(`/products/${encodeURIComponent(id)}/image`, { method: 'DELETE' })
}

// POST /products. Gambar diunggah terpisah setelah produk berhasil dibuat.
export async function createProduct(payload) {
  const imageFile = payload.imageFile ?? null
  const body = {
    category_id: String(payload.categoryId ?? '').trim(),
    name: String(payload.name ?? '').trim(),
    barcode: String(payload.barcode ?? '').trim() || null,
    price: Number(payload.price),
    stock: Number(payload.initial_stock ?? payload.stock ?? 0),
    unit: String(payload.unit ?? '').trim(),
  }

  const apiPayload = await request('/products', { method: 'POST', body })
  const created = normalizeProductFromApi(apiPayload?.data)

  if (!imageFile) return created

  try {
    return await uploadProductImage(created.id, imageFile)
  } catch (error) {
    // Produk baru gagal mendapat gambar: batalkan agar tidak ada produk yatim.
    try {
      await request(`/products/${encodeURIComponent(created.id)}`, { method: 'DELETE' })
    } catch {
      // Abaikan kegagalan rollback; error upload tetap diteruskan.
    }
    throw error
  }
}

// PATCH /products/:id. Stock sengaja tidak dikirim (backend menolaknya).
export async function updateProduct(id, payload) {
  const body = {}
  if (payload.categoryId) body.category_id = String(payload.categoryId).trim()
  if (payload.name) body.name = String(payload.name).trim()
  if (payload.barcode !== undefined) {
    body.barcode = String(payload.barcode).trim() || null
  }
  if (payload.price !== '' && payload.price !== null && payload.price !== undefined) {
    body.price = Number(payload.price)
  }
  if (payload.unit) body.unit = String(payload.unit).trim()

  if (Object.keys(body).length === 0) {
    throw new ProductApiError('VALIDATION', 'Tidak ada perubahan untuk disimpan.')
  }

  const apiPayload = await request(`/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  })
  let updated = normalizeProductFromApi(apiPayload?.data)
  if (payload.imageFile) {
    updated = await uploadProductImage(id, payload.imageFile)
  }
  return updated
}

// Endpoint penyesuaian stok belum tersedia di backend.
export async function adjustStock() {
  throw new ProductApiError(
    'UNAVAILABLE',
    'Penyesuaian stok belum tersedia.',
    {},
    501,
  )
}

// DELETE /products/:id (soft delete di backend).
export async function deactivateProduct(id) {
  await request(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// Dipakai CartContext saat transaksi selesai: stok berkurang dan riwayat
// mutasi bertipe keluar tetap tercatat.
export function recordSaleStock(paidItems = [], transaction = null) {
  const products = readStore()
  const now = new Date().toISOString()
  const reference = transaction?.id
    ? {
        type: 'transaction',
        id: transaction.id,
        no: transaction.no ?? transaction.id,
      }
    : null
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
          quantityChange: stockAfter - product.stock,
          previousStock: product.stock,
          stockAfter,
          notes: 'Penjualan',
          reference,
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
  return decorate(readStore())
}

export function subscribeProducts(listener) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(PRODUCTS_EVENT, listener)
  return () => window.removeEventListener(PRODUCTS_EVENT, listener)
}

export { validateImageFile, readFileAsDataUrl }
