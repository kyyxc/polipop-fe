const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export const TRANSACTION_SORT_FIELDS = ['created_at', 'total']

export const FORM_ERROR_CODES = new Set([
  'VALIDATION',
  'CONFLICT',
  'NOT_FOUND',
  'UNAUTHORIZED',
])

export class TransactionApiError extends Error {
  constructor(code, message, fields = {}, status = null) {
    super(message)
    this.name = 'TransactionApiError'
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
  if (status === 409) return 'CONFLICT'
  if (status === 400 || status === 422) return 'VALIDATION'
  return 'UNKNOWN'
}

function localizeMessage(code, rawMessage) {
  const text = String(rawMessage ?? '').toLocaleLowerCase('id-ID')

  if (text.includes('transaction not found')) return 'Transaksi tidak ditemukan.'
  if (text.includes('one or more products were not found')) {
    return 'Satu atau beberapa produk tidak ditemukan.'
  }
  if (text.includes('cash received is less than the total')) {
    return 'Uang diterima kurang dari total transaksi.'
  }
  if (text.includes('insufficient stock')) {
    return 'Stok produk tidak mencukupi. Periksa jumlah keranjang dan coba lagi.'
  }
  if (text.includes('amount is too large')) return 'Nominal transaksi terlalu besar.'
  if (text.includes('each product may appear only once')) {
    return 'Setiap produk hanya boleh muncul sekali dalam keranjang.'
  }
  if (text.includes('date_from must not be after date_to')) {
    return 'Tanggal akhir tidak boleh sebelum tanggal mulai.'
  }
  if (text.includes('could not generate a transaction number')) {
    return 'Gagal membuat nomor transaksi. Silakan coba lagi.'
  }
  if (text.includes('could not save the transaction')) {
    return 'Gagal menyimpan transaksi. Silakan coba lagi.'
  }
  if (code === 'UNAUTHORIZED') return 'Sesi Anda tidak valid. Silakan login kembali.'
  if (code === 'NOT_FOUND') return 'Data tidak ditemukan.'
  if (code === 'CONFLICT') return 'Data bertentangan dengan kondisi server.'
  if (code === 'VALIDATION') return 'Periksa kembali data transaksi.'
  return rawMessage || 'Permintaan gagal. Silakan coba lagi.'
}

function localizeFieldMessage(message) {
  const text = String(message ?? '').toLocaleLowerCase('id-ID')

  if (text.includes('cash received is less than the total')) {
    return 'Uang diterima kurang dari total'
  }
  if (text.includes('insufficient stock')) return 'Stok tidak mencukupi'
  if (text.includes('one or more products were not found')) {
    return 'Produk tidak ditemukan'
  }
  if (text.includes('date_from must not be after date_to')) {
    return 'Tidak boleh sebelum tanggal mulai'
  }
  if (text.includes('each product may appear only once')) {
    return 'Produk duplikat'
  }
  if (text.includes('greater than 0')) return 'Harus lebih besar dari 0'
  if (text.includes('field required')) return 'Wajib diisi'
  return message
}

function mapFieldErrors(rawErrors) {
  const fields = {}
  const alias = {
    cash_received: 'cashReceived',
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

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new TransactionApiError(
      'NETWORK',
      'Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.',
    )
  }

  const payload = await readJson(response)

  if (!response.ok) {
    const rawErrors = Array.isArray(payload?.errors) ? payload.errors : []
    const rawMessage =
      rawErrors
        .map((error) => error?.message)
        .filter(Boolean)
        .join(' ') || payload?.message || payload?.detail || ''
    const code = resolveCode(response.status)

    throw new TransactionApiError(
      code,
      localizeMessage(code, rawMessage),
      mapFieldErrors(rawErrors),
      response.status,
    )
  }

  return payload
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function normalizeSnapshotDiscount(raw) {
  if (!raw) return null
  return {
    id: raw.id == null ? null : String(raw.id),
    name: String(raw.name ?? ''),
    type: String(raw.discount_type ?? raw.type ?? ''),
    value: toNumber(raw.discount_value ?? raw.value),
    amount: toNumber(raw.amount),
  }
}

function normalizeItem(raw) {
  const price = toNumber(raw?.unit_price ?? raw?.price)
  const qty = toNumber(raw?.quantity ?? raw?.qty)
  const discount = toNumber(raw?.discount_amount ?? raw?.discount)

  return {
    id: String(raw?.id ?? ''),
    productId: raw?.product_id ?? raw?.productId ?? null,
    name: String(raw?.product_name ?? raw?.name ?? ''),
    price,
    qty,
    discount,
    subtotal:
      raw?.subtotal != null
        ? Math.max(0, toNumber(raw.subtotal))
        : Math.max(0, price * qty - discount),
    unitPrice: price,
    quantity: qty,
    discountType: raw?.discount_type ?? null,
    discountValue:
      raw?.discount_value == null ? null : toNumber(raw.discount_value),
  }
}

function normalizeTransaction(raw) {
  const items = Array.isArray(raw?.items) ? raw.items.map(normalizeItem) : []

  return {
    id: String(raw?.id ?? ''),
    no: String(raw?.transaction_number ?? raw?.no ?? ''),
    items,
    itemCount:
      raw?.item_count == null ? items.length : toNumber(raw.item_count),
    subtotal: toNumber(raw?.subtotal),
    productDiscount: toNumber(raw?.product_discount_total),
    discountAmount: toNumber(raw?.transaction_discount_amount),
    total: toNumber(raw?.total),
    paid: toNumber(raw?.cash_received ?? raw?.paid),
    change: toNumber(raw?.change_amount ?? raw?.change),
    discount: normalizeSnapshotDiscount(raw?.discount),
    createdAt: raw?.created_at ?? raw?.createdAt ?? '',
    updatedAt: raw?.updated_at ?? raw?.updatedAt ?? '',
  }
}

function normalizePreview(raw) {
  const items = Array.isArray(raw?.items) ? raw.items.map(normalizeItem) : []

  return {
    items,
    subtotal: toNumber(raw?.subtotal),
    productDiscount: toNumber(raw?.product_discount_total),
    transactionDiscount: toNumber(raw?.transaction_discount_amount),
    discount: normalizeSnapshotDiscount(raw?.discount),
    total: toNumber(raw?.total),
  }
}

function normalizeRequestItems(items) {
  if (!Array.isArray(items)) return []
  return items.map((item) => ({
    product_id: String(item?.product_id ?? item?.productId ?? ''),
    quantity: toNumber(item?.quantity ?? item?.qty),
  }))
}

function buildTransactionQuery(filters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    per_page: String(filters.perPage ?? filters.per_page ?? 10),
  })

  const search = filters.q ?? filters.search
  const dateFrom = filters.from ?? filters.date_from
  const dateTo = filters.to ?? filters.date_to
  const sortBy = filters.sortBy ?? filters.sort_by
  const order = filters.order ?? filters.sort

  if (search) params.set('search', String(search).trim())
  if (dateFrom) params.set('date_from', String(dateFrom))
  if (dateTo) params.set('date_to', String(dateTo))
  if (TRANSACTION_SORT_FIELDS.includes(sortBy)) params.set('sort_by', sortBy)
  if (order === 'asc' || order === 'desc') params.set('order', order)
  return params
}

// POST /transactions/preview — hitung total tanpa menyimpan transaksi.
export async function previewTransaction(items = []) {
  const payload = await request('/transactions/preview', {
    method: 'POST',
    body: { items: normalizeRequestItems(items) },
  })
  return normalizePreview(payload?.data)
}

// POST /transactions — diskon dipilih otomatis oleh server, stok dikurangi di server.
export async function createTransaction({ items = [], cashReceived = 0 } = {}) {
  const payload = await request('/transactions', {
    method: 'POST',
    body: {
      items: normalizeRequestItems(items),
      cash_received: toNumber(cashReceived),
    },
  })
  return normalizeTransaction(payload?.data)
}

// GET /transactions?page=&per_page=&search=&date_from=&date_to=&sort_by=&order=
export async function getTransactions(filters = {}) {
  const params = buildTransactionQuery(filters)
  const payload = await request(`/transactions?${params.toString()}`)
  const meta = payload?.meta ?? {}
  const items = Array.isArray(payload?.data)
    ? payload.data.map(normalizeTransaction)
    : []

  return {
    items,
    total: toNumber(meta.total ?? items.length),
    page: toNumber(meta.page ?? filters.page ?? 1) || 1,
    perPage: toNumber(meta.per_page ?? filters.perPage ?? 10) || 10,
    totalPages: Math.max(1, toNumber(meta.total_pages) || 1),
  }
}

// Export mengambil seluruh halaman dari endpoint list yang sama.
export async function getExportTransactions(filters = {}) {
  const first = await getTransactions({ ...filters, page: 1, perPage: 100 })
  const rows = [...first.items]

  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await getTransactions({ ...filters, page, perPage: 100 })
    rows.push(...next.items)
  }
  return rows
}

// GET /transactions/:id
export async function getTransactionById(id) {
  const payload = await request(`/transactions/${encodeURIComponent(id)}`)
  if (!payload?.data) {
    throw new TransactionApiError('NOT_FOUND', 'Transaksi tidak ditemukan.')
  }
  return normalizeTransaction(payload.data)
}

// Ringkasan list tidak membawa item; gunakan angka dari server bila items kosong.
export function calculateTotals(transaction) {
  const rawItems = Array.isArray(transaction?.items) ? transaction.items : []

  if (rawItems.length === 0) {
    const subtotal = toNumber(transaction?.subtotal)
    const productDiscount = toNumber(
      transaction?.productDiscount ?? transaction?.product_discount_total,
    )
    const transactionDiscount = toNumber(
      transaction?.discountAmount ?? transaction?.transaction_discount_amount,
    )
    const total =
      toNumber(transaction?.total) ||
      Math.max(0, subtotal - productDiscount - transactionDiscount)
    const paid = toNumber(transaction?.paid ?? transaction?.cash_received)
    const change = toNumber(transaction?.change ?? transaction?.change_amount)

    return {
      items: [],
      subtotal,
      productDiscount,
      afterProductDiscount: Math.max(0, subtotal - productDiscount),
      transactionDiscount,
      total,
      paid,
      change: change || Math.max(0, paid - total),
    }
  }

  const items = rawItems.map(normalizeItem)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const productDiscount = items.reduce((sum, item) => sum + item.discount, 0)
  const afterProductDiscount = Math.max(0, subtotal - productDiscount)
  const transactionDiscount = Math.max(
    0,
    toNumber(transaction?.discountAmount ?? transaction?.transaction_discount_amount),
  )
  const total =
    toNumber(transaction?.total) ||
    Math.max(0, afterProductDiscount - transactionDiscount)
  const paid = toNumber(transaction?.paid ?? transaction?.cash_received)

  return {
    items,
    subtotal,
    productDiscount,
    afterProductDiscount,
    transactionDiscount,
    total,
    paid,
    change: toNumber(transaction?.change ?? transaction?.change_amount) || Math.max(0, paid - total),
  }
}

export function getItemCount(transaction) {
  const items = Array.isArray(transaction?.items) ? transaction.items : []
  if (items.length === 0) {
    return toNumber(transaction?.itemCount ?? transaction?.item_count)
  }
  return items.reduce((total, item) => total + (toNumber(item.qty) || 0), 0)
}
