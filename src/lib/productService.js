import { productImagePlaceholder } from '../config/images.js'
import { getCategoryOptions } from './categoryService.js'

// Seluruh data produk/kategori/mutasi berasal dari backend. Tidak ada fallback
// localStorage atau data contoh yang dipakai saat runtime.
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

const SORT_FIELDS = ['name', 'price', 'stock', 'created_at']
const MUTATION_TYPES = ['initial', 'restock', 'return', 'sale', 'damaged', 'adjustment']
const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

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
  if (text.includes('insufficient stock')) return 'Stok tidak mencukupi'
  if (text.includes('date_from must not be after date_to')) {
    return 'Tanggal akhir tidak boleh sebelum tanggal mulai'
  }
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
  if (text.includes('insufficient stock')) return 'Stok tidak mencukupi'
  if (text.includes('must not be zero')) return 'Jumlah tidak boleh nol'
  if (text.includes('must be positive')) return 'Jumlah harus positif'
  if (text.includes('must be negative')) return 'Jumlah harus negatif'
  if (text.includes('too large')) return 'Nilai terlalu besar'
  return message
}

function mapFieldErrors(rawErrors) {
  const fields = {}
  const alias = {
    category_id: 'categoryId',
    stock: 'initial_stock',
    file: 'image',
    mutation_type: 'type',
    product_id: 'productId',
    date_from: 'from',
    date_to: 'to',
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
    active:
      raw?.is_active == null && raw?.active == null
        ? true
        : Boolean(raw.is_active ?? raw.active),
    history: [],
    createdAt: raw?.created_at ?? raw?.createdAt ?? '',
    updatedAt: raw?.updated_at ?? raw?.updatedAt ?? '',
  }
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

// GET /mutations mengembalikan mutasi seluruh produk milik user yang login.
function buildMutationQuery(filters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    per_page: String(filters.perPage ?? filters.per_page ?? 10),
  })

  if (filters.q) params.set('search', String(filters.q).trim())
  if (filters.productId) params.set('product_id', String(filters.productId))
  if (MUTATION_TYPES.includes(filters.type)) {
    params.set('mutation_type', filters.type)
  }
  if (filters.from) params.set('date_from', String(filters.from))
  if (filters.to) params.set('date_to', String(filters.to))
  return params
}

function normalizeMutationFromApi(raw) {
  const quantity = Number(raw?.quantity) || 0
  const transactionId = raw?.transaction_id ? String(raw.transaction_id) : ''
  const referenceId = transactionId || (raw?.reference_id ? String(raw.reference_id) : '')
  return {
    id: String(raw?.id ?? ''),
    productId: String(raw?.product?.id ?? ''),
    productName: String(raw?.product?.name ?? '-'),
    // Response API tidak menyertakan barcode produk.
    productBarcode: '',
    productUnit: String(raw?.product?.unit ?? 'pcs'),
    type: MUTATION_TYPES.includes(raw?.mutation_type)
      ? raw.mutation_type
      : String(raw?.mutation_type ?? ''),
    quantity: Math.abs(quantity),
    quantityChange: quantity,
    previousStock: Number(raw?.stock_before) || 0,
    stockAfter: Number(raw?.stock_after) || 0,
    notes: String(raw?.notes ?? ''),
    // Tautan aktif hanya bila backend mengirim transaction_id.
    reference: referenceId
      ? {
          id: referenceId,
          no: String(raw?.transaction_number ?? referenceId.slice(0, 8)),
          linkable: Boolean(transactionId),
        }
      : null,
    createdAt: String(raw?.created_at ?? ''),
  }
}

async function fetchMutations(filters = {}) {
  const params = buildMutationQuery(filters)
  const payload = await request(`/mutations?${params.toString()}`)
  const meta = payload?.meta ?? {}
  const items = Array.isArray(payload?.data)
    ? payload.data.map(normalizeMutationFromApi)
    : []

  return {
    items,
    total: Number(meta.total ?? items.length) || 0,
    page: Number(meta.page ?? filters.page ?? 1) || 1,
    perPage: Number(meta.per_page ?? filters.perPage ?? 10) || 10,
    totalPages: Math.max(1, Number(meta.total_pages ?? 1) || 1),
  }
}

// GET /stock/history — sekarang memakai GET /mutations dari backend.
export async function getStockHistory(filters = {}) {
  return fetchMutations(filters)
}

// GET /mutations?product_id=... untuk riwayat satu produk.
export async function getProductMutations(productId, filters = {}) {
  if (!productId) {
    return { items: [], total: 0, page: 1, perPage: filters.perPage ?? 10, totalPages: 1 }
  }
  return fetchMutations({ ...filters, productId })
}

// GET /categories yang dipakai form produk (data kategori berasal dari API).
export async function getActiveCategories() {
  return getCategoryOptions()
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

// POST /mutations — mencatat mutasi manual dan mengubah stok di backend.
// payload.quantity sudah bertanda: positif untuk restock/return, negatif untuk
// sale/damaged, dan bebas (non-nol) untuk adjustment.
export async function adjustStock(productId, payload) {
  const body = {
    product_id: String(productId),
    mutation_type: String(payload?.type ?? ''),
    quantity: Number(payload?.quantity),
  }
  const notes = String(payload?.notes ?? '').trim()
  if (notes) body.notes = notes

  const apiPayload = await request('/mutations', { method: 'POST', body })
  return normalizeMutationFromApi(apiPayload?.data)
}

// DELETE /products/:id (soft delete di backend).
export async function deactivateProduct(id) {
  await request(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export { validateImageFile, readFileAsDataUrl }
