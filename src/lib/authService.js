const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const USER_STORAGE_KEY = 'polipop-user'
const REMEMBER_STORAGE_KEY = 'polipop-remember'

const EDITABLE_FIELDS = [
  'username',
  'full_name',
  'current_password',
  'new_password',
]

export class AuthApiError extends Error {
  constructor(message, { fieldErrors = {}, status = null } = {}) {
    super(message)
    this.name = 'AuthApiError'
    this.fieldErrors = fieldErrors
    this.status = status
  }
}

function toFieldName(field) {
  const value = String(field ?? '').split('.').pop()
  return EDITABLE_FIELDS.includes(value) ? value : null
}

function parseErrorPayload(payload) {
  const rawErrors = Array.isArray(payload?.errors) ? payload.errors : []
  const messages = []
  const fieldErrors = {}

  rawErrors.forEach((error) => {
    const message = typeof error === 'string' ? error : error?.message
    if (!message) return

    messages.push(message)

    const field = toFieldName(typeof error === 'string' ? null : error?.field)
    if (field) {
      fieldErrors[field] = fieldErrors[field]
        ? `${fieldErrors[field]} ${message}`
        : message
    }
  })

  if (messages.length === 0) {
    const fallback = payload?.message ?? payload?.detail
    if (typeof fallback === 'string' && fallback) {
      messages.push(fallback)
    }
  }

  return { messages, fieldErrors }
}

async function readJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
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
    throw new AuthApiError(
      'Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.',
    )
  }

  const payload = await readJson(response)

  if (!response.ok) {
    const { messages, fieldErrors } = parseErrorPayload(payload)
    throw new AuthApiError(
      messages.join(' ') || `Permintaan gagal (${response.status}). Silakan coba lagi.`,
      { fieldErrors, status: response.status },
    )
  }

  return payload
}

function extractUser(payload) {
  return payload?.data ?? payload ?? null
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveUser(user) {
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  } catch {
    // localStorage tidak tersedia: data akun hanya dipakai selama sesi ini.
  }
  return user
}

function getRememberPreference() {
  try {
    return localStorage.getItem(REMEMBER_STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

function setRememberPreference(rememberMe) {
  try {
    localStorage.setItem(REMEMBER_STORAGE_KEY, String(Boolean(rememberMe)))
  } catch {
    // Preferensi tidak tersedia: sesi tetap dikendalikan cookie backend.
  }
}

function cacheUser(user) {
  return getRememberPreference() ? saveUser(user) : user
}

export async function login({ username, password, rememberMe = false }) {
  const payload = await request('/users/login', {
    method: 'POST',
    body: { username, password, remember_me: rememberMe },
  })
  const user = extractUser(payload)
  setRememberPreference(rememberMe)
  return cacheUser(rememberMe ? user : null)
}

export async function getCurrentUser() {
  const payload = await request('/users/me')
  return cacheUser(extractUser(payload))
}

export async function logout() {
  try {
    await request('/users/logout', { method: 'POST' })
  } finally {
    saveUser(null)
  }
}

export async function updateProfile({
  currentPassword,
  username,
  fullName,
  newPassword,
}) {
  const body = { current_password: currentPassword }
  if (username) body.username = username
  if (fullName) body.full_name = fullName
  if (newPassword) body.new_password = newPassword

  const payload = await request('/users/me', { method: 'PATCH', body })
  return cacheUser(extractUser(payload))
}
