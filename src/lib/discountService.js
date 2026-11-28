const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export const DISCOUNT_SCOPES = ['product', 'transaction']
export const DISCOUNT_TYPES = ['percentage', 'fixed']
export const DISCOUNT_STATUSES = ['active', 'scheduled', 'expired', 'inactive']
export const DISCOUNT_SORT_FIELDS = [
  'created_at',
  'name',
  'discount_value',
  'starts_at',
  'ends_at',
]

export const FORM_ERROR_CODES = new Set([
  'VALIDATION',
  'CONFLICT',
  'NOT_FOUND',
  'UNAUTHORIZED',
])

export class DiscountApiError extends Error {
  constructor(code, message, fields = {}, status = null) {
    super(message)
    this.name = 'DiscountApiError'
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

  if (text.includes('discount not found')) return 'Diskon tidak ditemukan.'
  if (text.includes('product not found')) return 'Produk tidak ditemukan.'
  if (text.includes('already has an active discount')) {
    return 'Produk sudah memiliki diskon aktif.'
  }
  if (text.includes('product_id is required')) {
    return 'Produk wajib dipilih untuk diskon produk.'
  }
  if (text.includes('product_id must be empty')) {
    return 'Produk tidak boleh diisi untuk diskon transaksi.'
  }
  if (text.includes('min_transaction_amount must be empty')) {
    return 'Minimum transaksi tidak berlaku untuk diskon produk.'
  }
  if (text.includes('percentage must not exceed 100')) {
    return 'Persentase diskon maksimal 100%.'
  }
  if (text.includes('fixed discount must not exceed')) {
    return 'Nominal diskon tidak boleh melebihi harga produk.'
  }
  if (text.includes('ends_at must not be before starts_at')) {
    return 'Tanggal akhir tidak boleh sebelum tanggal mulai.'
  }
  if (text.includes('no fields to update')) {
    return 'Tidak ada perubahan untuk disimpan.'
  }
  if (code === 'UNAUTHORIZED') return 'Sesi Anda tidak valid. Silakan login kembali.'
  if (code === 'NOT_FOUND') return 'Diskon tidak ditemukan.'
  if (code === 'VALIDATION') return 'Periksa kembali data diskon.'
  return rawMessage || 'Permintaan gagal. Silakan coba lagi.'
}

function localizeFieldMessage(message) {
  const text = String(message ?? '').toLocaleLowerCase('id-ID')

  if (text.includes('discount not found')) return 'Diskon tidak ditemukan.'
  if (text.includes('product not found')) return 'Produk tidak ditemukan.'
  if (text.includes('already has an active discount')) {
    return 'Produk sudah memiliki diskon aktif.'
  }
  if (text.includes('product_id is required')) {
    return 'Produk wajib dipilih'
  }
  if (text.includes('product_id must be empty')) {
    return 'Produk tidak boleh diisi'
  }
  if (text.includes('min_transaction_amount must be empty')) {
    return 'Minimum transaksi tidak berlaku untuk diskon produk'
  }
  if (text.includes('percentage must not exceed 100')) {
    return 'Persentase maksimal 100%'
  }
  if (text.includes('fixed discount must not exceed')) {
    return 'Nominal tidak boleh melebihi harga produk'
  }
  if (text.includes('ends_at must not be before starts_at')) {
    return 'Tanggal akhir tidak boleh sebelum tanggal mulai'
  }
  if (text.includes('greater than 0')) return 'Harus lebih besar dari 0'
  if (text.includes('at most 150 characters')) return 'Maksimal 150 karakter'
  if (text.includes('field required')) return 'Wajib diisi'
  return message
}

function mapFieldErrors(rawErrors) {
  const fields = {}
  const alias = {
    discount_scope: 'scope',
    discount_type: 'type',
    discount_value: 'value',
    min_transaction_amount: 'minTransactionAmount',
    starts_at: 'startsAt',
    ends_at: 'endsAt',
    product_id: 'productId',
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
    throw new DiscountApiError(
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

    throw new DiscountApiError(
      code,
      localizeMessage(code, rawMessage),
      mapFieldErrors(rawErrors),
      response.status,
    )
  }

  return payload
}

function deriveStatus(isActive, startsAt, endsAt) {
  if (!isActive) return 'inactive'
  const now = Date.now()
  if (startsAt && new Date(startsAt).getTime() > now) return 'scheduled'
  if (endsAt && new Date(endsAt).getTime() < now) return 'expired'
  return 'active'
}

function normalizeDiscount(raw) {
  const product = raw?.product
  const isActive = Boolean(raw?.is_active)
  const startsAt = raw?.starts_at ?? null
  const endsAt = raw?.ends_at ?? null

  return {
    id: String(raw?.id ?? ''),
    name: String(raw?.name ?? '').trim(),
    scope: String(raw?.discount_scope ?? ''),
    productId: product ? String(product.id ?? '') : '',
    productName: product ? String(product.name ?? '') : '',
    productPrice: product ? Number(product.price) || 0 : 0,
    productUnit: product ? String(product.unit ?? 'pcs') : '',
    type: String(raw?.discount_type ?? ''),
    value: Number(raw?.discount_value) || 0,
    minTransactionAmount:
      raw?.min_transaction_amount == null
        ? null
        : Number(raw.min_transaction_amount) || 0,
    startsAt,
    endsAt,
    isActive,
    status: String(raw?.status ?? deriveStatus(isActive, startsAt, endsAt)),
    createdAt: raw?.created_at ?? '',
    updatedAt: raw?.updated_at ?? '',
  }
}

function buildDiscountQuery(filters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    per_page: String(filters.perPage ?? filters.per_page ?? 10),
  })

  const search = filters.q ?? filters.search
  const scope = filters.scope ?? filters.discountScope
  const type = filters.type ?? filters.discountType
  const sortBy = filters.sortBy ?? filters.sort_by
  const order = filters.sort ?? filters.order

  if (search) params.set('search', String(search).trim())
  if (DISCOUNT_SCOPES.includes(scope)) params.set('scope', scope)
  if (DISCOUNT_TYPES.includes(type)) params.set('type', type)
  if (DISCOUNT_STATUSES.includes(filters.status)) {
    params.set('status', filters.status)
  }
  if (filters.productId) params.set('product_id', String(filters.productId))
  if (DISCOUNT_SORT_FIELDS.includes(sortBy)) params.set('sort_by', sortBy)
  if (order === 'asc' || order === 'desc') params.set('order', order)
  return params
}

function positiveAmount(value, field) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new DiscountApiError(
      'VALIDATION',
      `${field} harus lebih besar dari 0`,
      { [field]: 'Harus lebih besar dari 0' },
    )
  }
  return amount
}

function dateInput(value) {
  if (value === null || value === undefined || value === '') return null
  const text = String(value).trim()
  if (!text) return null
  // Input date hanya mengirim YYYY-MM-DD; lengkapi jadi datetime.
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00` : text
}

function buildCreateBody(payload) {
  const name = String(payload?.name ?? '').trim()
  if (!name || name.length > 150) {
    throw new DiscountApiError(
      'VALIDATION',
      'Nama diskon wajib diisi dan maksimal 150 karakter',
      { name: 'Wajib diisi dan maksimal 150 karakter' },
    )
  }

  const scope = String(payload?.scope ?? payload?.discountScope ?? '')
  const type = String(payload?.type ?? payload?.discountType ?? '')
  if (!DISCOUNT_SCOPES.includes(scope)) {
    throw new DiscountApiError('VALIDATION', 'Pilih ruang lingkup diskon', {
      scope: 'Wajib dipilih',
    })
  }
  if (!DISCOUNT_TYPES.includes(type)) {
    throw new DiscountApiError('VALIDATION', 'Pilih jenis diskon', {
      type: 'Wajib dipilih',
    })
  }

  const value = positiveAmount(payload?.value ?? payload?.discountValue, 'value')
  if (type === 'percentage' && value > 100) {
    throw new DiscountApiError('VALIDATION', 'Persentase diskon maksimal 100%', {
      value: 'Maksimal 100%',
    })
  }

  const body = {
    name,
    discount_scope: scope,
    discount_type: type,
    discount_value: value,
    is_active: payload?.isActive ?? true,
  }

  if (scope === 'product') {
    body.product_id = String(payload?.productId ?? '').trim()
    if (!body.product_id) {
      throw new DiscountApiError('VALIDATION', 'Produk wajib dipilih', {
        productId: 'Wajib dipilih',
      })
    }
  } else if (payload?.minTransactionAmount !== null && payload?.minTransactionAmount !== undefined && payload?.minTransactionAmount !== '') {
    body.min_transaction_amount = positiveAmount(
      payload.minTransactionAmount,
      'minTransactionAmount',
    )
  }

  const startsAt = dateInput(payload?.startsAt)
  const endsAt = dateInput(payload?.endsAt)
  if (startsAt) body.starts_at = startsAt
  if (endsAt) body.ends_at = endsAt
  if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
    throw new DiscountApiError(
      'VALIDATION',
      'Tanggal akhir tidak boleh sebelum tanggal mulai',
      { endsAt: 'Tidak boleh sebelum tanggal mulai' },
    )
  }

  return body
}

function buildUpdateBody(payload) {
  const body = {}

  if (payload?.name !== undefined) {
    const name = String(payload.name).trim()
    if (!name || name.length > 150) {
      throw new DiscountApiError(
        'VALIDATION',
        'Nama diskon wajib diisi dan maksimal 150 karakter',
        { name: 'Wajib diisi dan maksimal 150 karakter' },
      )
    }
    body.name = name
  }

  const type = payload?.type ?? payload?.discountType
  if (type !== undefined) {
    if (!DISCOUNT_TYPES.includes(String(type))) {
      throw new DiscountApiError('VALIDATION', 'Pilih jenis diskon', {
        type: 'Tidak valid',
      })
    }
    body.discount_type = String(type)
  }

  const value = payload?.value ?? payload?.discountValue
  if (value !== undefined) {
    const amount = positiveAmount(value, 'value')
    if (body.discount_type === 'percentage' && amount > 100) {
      throw new DiscountApiError('VALIDATION', 'Persentase diskon maksimal 100%', {
        value: 'Maksimal 100%',
      })
    }
    body.discount_value = amount
  }

  // null dikirim sengaja untuk mengosongkan field opsional di backend.
  if (payload?.minTransactionAmount !== undefined) {
    const min = payload.minTransactionAmount
    body.min_transaction_amount = min === null || min === '' ? null : positiveAmount(min, 'minTransactionAmount')
  }
  if (payload?.startsAt !== undefined) body.starts_at = dateInput(payload.startsAt)
  if (payload?.endsAt !== undefined) body.ends_at = dateInput(payload.endsAt)
  if (payload?.isActive !== undefined) body.is_active = Boolean(payload.isActive)

  if (Object.keys(body).length === 0) {
    throw new DiscountApiError('VALIDATION', 'Tidak ada perubahan untuk disimpan')
  }

  return body
}

// GET /discounts?page=&per_page=&search=&scope=&type=&status=&product_id=&sort_by=&order=
export async function getDiscounts(filters = {}) {
  const params = buildDiscountQuery(filters)
  const apiPayload = await request(`/discounts?${params.toString()}`)
  const meta = apiPayload?.meta ?? {}
  const items = Array.isArray(apiPayload?.data)
    ? apiPayload.data.map(normalizeDiscount)
    : []

  return {
    items,
    total: Number(meta.total ?? items.length) || 0,
    page: Number(meta.page ?? filters.page ?? 1) || 1,
    perPage: Number(meta.per_page ?? filters.perPage ?? 10) || 10,
    totalPages: Math.max(1, Number(meta.total_pages ?? 1) || 1),
  }
}

// GET /discounts/:id
export async function getDiscountById(id) {
  const apiPayload = await request(`/discounts/${encodeURIComponent(id)}`)
  if (!apiPayload?.data) {
    throw new DiscountApiError('NOT_FOUND', 'Diskon tidak ditemukan.')
  }
  return normalizeDiscount(apiPayload.data)
}

// POST /discounts
export async function createDiscount(payload) {
  const apiPayload = await request('/discounts', {
    method: 'POST',
    body: buildCreateBody(payload),
  })
  return normalizeDiscount(apiPayload?.data)
}

// PATCH /discounts/:id — discount_scope dan product_id tidak bisa diubah.
export async function updateDiscount(id, payload) {
  const apiPayload = await request(`/discounts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: buildUpdateBody(payload),
  })
  return normalizeDiscount(apiPayload?.data)
}

// DELETE /discounts/:id (soft delete di backend).
export async function deleteDiscount(id) {
  await request(`/discounts/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
