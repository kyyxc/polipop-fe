import { currentUserId, mockCategories } from '../data/mockCategories.js'
import { currentWarungId } from '../data/mockKasir.js'
import { getAllProducts } from './productService.js'

const STORAGE_KEY = 'polipop-categories'
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export class CategoryApiError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'CategoryApiError'
    this.code = code
  }
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return mockCategories.map((category) => ({ ...category }))
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('Format data tidak valid')
    return parsed
  } catch {
    return mockCategories.map((category) => ({ ...category }))
  }
}

function writeStore(categories) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
  } catch {
    // localStorage tidak tersedia: perubahan tetap berlaku selama sesi ini.
  }
}

function normalizeName(name) {
  return String(name ?? '').trim()
}

function keyOf(name) {
  return name.toLocaleLowerCase('id-ID')
}

function countProducts(categoryId) {
  return getAllProducts().filter(
    (product) =>
      product.active &&
      product.categoryId === categoryId &&
      product.warungId === currentWarungId,
  ).length
}

function withCount(category) {
  return { ...category, totalProduct: countProducts(category.id) }
}

function assertUnique(categories, name, exceptId = null) {
  const duplicate = categories.some(
    (category) =>
      category.userId === currentUserId &&
      category.id !== exceptId &&
      keyOf(category.name) === keyOf(name),
  )
  if (duplicate) {
    throw new CategoryApiError('DUPLICATE', 'Nama kategori sudah digunakan')
  }
}

// Simulasi GET /categories — hanya mengembalikan kategori milik user aktif.
export async function getCategories() {
  await delay(550)
  return readStore()
    .filter((category) => category.userId === currentUserId)
    .map(withCount)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// Simulasi POST /categories.
export async function createCategory(name) {
  await delay(600)
  const clean = normalizeName(name)
  if (!clean) {
    throw new CategoryApiError('VALIDATION', 'Nama kategori wajib diisi.')
  }

  const categories = readStore()
  assertUnique(categories, clean)

  const created = {
    id: `cat-${Date.now()}`,
    userId: currentUserId,
    name: clean,
    createdAt: new Date().toISOString(),
  }
  writeStore([...categories, created])
  return withCount(created)
}

// Simulasi PATCH /categories/:id.
export async function updateCategory(id, name) {
  await delay(600)
  const clean = normalizeName(name)
  if (!clean) {
    throw new CategoryApiError('VALIDATION', 'Nama kategori wajib diisi.')
  }

  const categories = readStore()
  const index = categories.findIndex(
    (category) => category.id === id && category.userId === currentUserId,
  )
  if (index === -1) {
    throw new CategoryApiError('NOT_FOUND', 'Kategori tidak ditemukan.')
  }
  assertUnique(categories, clean, id)

  const updated = { ...categories[index], name: clean }
  const next = [...categories]
  next[index] = updated
  writeStore(next)
  return withCount(updated)
}

// Simulasi DELETE /categories/:id.
export async function deleteCategory(id) {
  await delay(600)
  const categories = readStore()
  const target = categories.find(
    (category) => category.id === id && category.userId === currentUserId,
  )
  if (!target) {
    throw new CategoryApiError('NOT_FOUND', 'Kategori tidak ditemukan.')
  }

  // Kebijakan sementara: kategori yang masih dipakai produk tidak dihapus dan
  // relasi produk tidak diubah otomatis sampai keputusan final ditetapkan.
  const usedBy = countProducts(id)
  if (usedBy > 0) {
    throw new CategoryApiError(
      'IN_USE',
      `Kategori masih digunakan oleh ${usedBy} produk dan tidak dapat dihapus.`,
    )
  }

  writeStore(categories.filter((category) => category.id !== id))
}
