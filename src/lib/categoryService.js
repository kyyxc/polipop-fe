const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export const FORM_ERROR_CODES = new Set([
  'VALIDATION',
  'DUPLICATE',
  'NOT_FOUND',
  'UNAUTHORIZED',
])

export class CategoryApiError extends Error {
  constructor(message, { code = 'UNKNOWN', status = null, fieldErrors = {} } = {}) {
    super(message)
    this.name = 'CategoryApiError'
    this.code = code
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

async function readJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function parseErrors(payload) {
  const rawErrors = Array.isArray(payload?.errors) ? payload.errors : []
  const messages = []
  const fieldErrors = {}

  rawErrors.forEach((error) => {
    const message = typeof error === 'string' ? error : error?.message
    if (!message) return

    messages.push(message)

    const field = typeof error === 'string' ? null : error?.field
    if (field) {
      fieldErrors[field] = fieldErrors[field]
        ? `${fieldErrors[field]} ${message}`
        : message
    }
  })

  if (messages.length === 0) {
    const fallback = payload?.message ?? payload?.detail
    if (typeof fallback === 'string' && fallback) messages.push(fallback)
  }

  return { messages, fieldErrors }
}

function resolveCode(status, message) {
  const text = String(message ?? '').toLocaleLowerCase('id-ID')

  if (status === 401 || status === 403) return 'UNAUTHORIZED'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) {
    return text.includes('product') || text.includes('digunakan') ? 'IN_USE' : 'DUPLICATE'
  }
  if (status === 400 || status === 422) return 'VALIDATION'
  return 'UNKNOWN'
}

function localizeMessage(code, rawMessage) {
  const text = String(rawMessage ?? '').toLocaleLowerCase('id-ID')

  if (code === 'DUPLICATE' || text.includes('already exists')) {
    return 'Nama kategori sudah digunakan'
  }
  if (code === 'IN_USE' || text.includes('still has product')) {
    return 'Kategori masih digunakan oleh produk dan tidak dapat dihapus.'
  }
  if (code === 'NOT_FOUND' || text.includes('not found')) {
    return 'Kategori tidak ditemukan.'
  }
  if (code === 'UNAUTHORIZED') {
    return 'Sesi Anda tidak valid. Silakan login kembali.'
  }
  if (code === 'VALIDATION') {
    return 'Nama kategori wajib diisi dan maksimal 100 karakter.'
  }
  return rawMessage || 'Permintaan gagal. Silakan coba lagi.'
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
    throw new CategoryApiError(
      'Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.',
      { code: 'NETWORK' },
    )
  }

  const payload = await readJson(response)

  if (!response.ok) {
    const { messages, fieldErrors } = parseErrors(payload)
    const rawMessage = messages.join(' ')
    const code = resolveCode(response.status, rawMessage)

    throw new CategoryApiError(localizeMessage(code, rawMessage), {
      code,
      status: response.status,
      fieldErrors,
    })
  }

  return payload
}

function normalizeCategory(raw) {
  return {
    id: String(raw?.id ?? ''),
    name: String(raw?.name ?? '').trim(),
    totalProduct: Number(raw?.total_product ?? raw?.totalProduct ?? 0) || 0,
    createdAt: raw?.created_at ?? raw?.createdAt ?? '',
    updatedAt: raw?.updated_at ?? raw?.updatedAt ?? '',
  }
}

function validateName(name) {
  const clean = String(name ?? '').trim()
  if (!clean || clean.length > 100) {
    throw new CategoryApiError('Nama kategori wajib diisi dan maksimal 100 karakter.', {
      code: 'VALIDATION',
      fieldErrors: { name: 'Nama kategori wajib diisi dan maksimal 100 karakter.' },
    })
  }
  return clean
}

// GET /categories?page=&per_page=&search=
export async function getCategories({ page = 1, perPage = 10, search = '' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })
  if (search) params.set('search', String(search).trim())

  const payload = await request(`/categories?${params.toString()}`)
  const meta = payload?.meta ?? {}
  const items = Array.isArray(payload?.data)
    ? payload.data.map(normalizeCategory)
    : []

  return {
    items,
    total: Number(meta.total ?? items.length) || 0,
    page: Number(meta.page ?? page) || 1,
    perPage: Number(meta.per_page ?? perPage) || perPage,
    totalPages: Math.max(1, Number(meta.total_pages ?? 1) || 1),
  }
}

// Dipakai form produk: backend membatasi per_page maksimal 100.
export async function getCategoryOptions() {
  const { items } = await getCategories({ page: 1, perPage: 100 })
  return items
    .map(({ id, name }) => ({ id, name }))
    .sort((left, right) => left.name.localeCompare(right.name, 'id-ID'))
}

// POST /categories
export async function createCategory(name) {
  const clean = validateName(name)
  const payload = await request('/categories', {
    method: 'POST',
    body: { name: clean },
  })
  return normalizeCategory(payload?.data)
}

// PUT /categories/:id
export async function updateCategory(id, name) {
  const clean = validateName(name)
  const payload = await request(`/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { name: clean },
  })
  return normalizeCategory(payload?.data)
}

// DELETE /categories/:id
export async function deleteCategory(id) {
  await request(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
