import { currentUserId } from '../data/mockCategories.js'
import { currentWarungId } from '../data/mockKasir.js'
import { mockTransactions } from '../data/mockTransactions.js'

const STORAGE_KEY = 'polipop-transactions'
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export class TransactionApiError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'TransactionApiError'
    this.code = code
  }
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = mockTransactions.map((transaction) => ({ ...transaction }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
      return seeded
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('Format data tidak valid')
    return parsed
  } catch {
    // localStorage tidak tersedia: pakai data contoh selama sesi ini.
    return mockTransactions.map((transaction) => ({ ...transaction }))
  }
}

function writeStore(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  } catch {
    // Abaikan: transaksi tetap tampil di sesi ini.
  }
}

function normalizeItem(item) {
  const price = Number(item.price) || 0
  const qty = Number(item.qty) || 0
  const discount = Math.min(Math.max(Number(item.discount) || 0, 0), price * qty)

  return {
    ...item,
    price,
    qty,
    discount,
    subtotal: Math.max(0, price * qty - discount),
  }
}

function normalizeTransaction(transaction) {
  const no = transaction.no ?? transaction.id ?? ''
  const items = Array.isArray(transaction.items)
    ? transaction.items.map(normalizeItem)
    : []
  const subtotal = Number(transaction.subtotal) || 0
  const discountAmount = Number(transaction.discountAmount) || 0

  return {
    ...transaction,
    id: transaction.id ?? no,
    no,
    items,
    subtotal,
    discountAmount,
    total: Number(transaction.total) || Math.max(0, subtotal - discountAmount),
    paid: Number(transaction.paid) || 0,
    change: Number(transaction.change) || 0,
    createdAt: transaction.createdAt ?? '',
  }
}

// Data lama yang belum punya field owner tetap ditampilkan (kompatibilitas demo).
function isOwned(transaction) {
  return (
    (!transaction.userId || transaction.userId === currentUserId) &&
    (!transaction.warungId || transaction.warungId === currentWarungId)
  )
}

function matchesFilters(transaction, filters = {}) {
  const query = String(filters.q ?? '').trim().toLocaleLowerCase('id-ID')
  if (query && !transaction.no.toLocaleLowerCase('id-ID').includes(query)) {
    return false
  }

  const date = transaction.createdAt.slice(0, 10)
  if (filters.from && date < filters.from) return false
  if (filters.to && date > filters.to) return false

  return true
}

function queryStore(filters) {
  return readStore()
    .map(normalizeTransaction)
    .filter(isOwned)
    .filter((transaction) => matchesFilters(transaction, filters))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// Simulasi GET /transactions?q=&from=&to=
export async function getTransactions(filters = {}) {
  await delay(550)
  return queryStore(filters)
}

// Simulasi GET /api/transactions/export — sama seperti filter halaman,
// tetapi mengembalikan seluruh hasil tanpa pagination.
export async function getExportTransactions(filters = {}) {
  await delay(250)
  return queryStore(filters)
}

export async function getTransactionById(id) {
  await delay(450)
  const transaction = queryStore({}).find((entry) => entry.id === id)
  if (!transaction) {
    throw new TransactionApiError('NOT_FOUND', 'Transaksi tidak ditemukan.')
  }
  if (transaction.items.length === 0) {
    throw new TransactionApiError('INVALID', 'Transaksi tidak memiliki item.')
  }
  return transaction
}

// Perhitungan ulang dari snapshot item agar tampilan detail konsisten
// dengan aturan: diskon produk -> diskon transaksi -> total -> kembalian.
export function calculateTotals(transaction) {
  const items = (transaction?.items ?? []).map(normalizeItem)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const productDiscount = items.reduce((sum, item) => sum + item.discount, 0)
  const afterProductDiscount = Math.max(0, subtotal - productDiscount)
  const transactionDiscount = Math.max(
    0,
    Number(transaction?.discountAmount) || 0,
  )
  const total = Math.max(0, afterProductDiscount - transactionDiscount)
  const paid = Number(transaction?.paid) || 0

  return {
    items,
    subtotal,
    productDiscount,
    afterProductDiscount,
    transactionDiscount,
    total,
    paid,
    change: Math.max(0, paid - total),
  }
}

export function getItemCount(transaction) {
  return (transaction?.items ?? []).reduce(
    (total, item) => total + (Number(item.qty) || 0),
    0,
  )
}

export function createTransactionNo() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `TRX-${today}-`
  const sequences = readStore()
    .filter(
      (transaction) =>
        isOwned(transaction) && String(transaction.no ?? '').startsWith(prefix),
    )
    .map((transaction) => Number(String(transaction.no).slice(prefix.length)) || 0)

  return `${prefix}${String(Math.max(0, ...sequences) + 1).padStart(3, '0')}`
}

export function saveTransaction(transaction) {
  writeStore([transaction, ...readStore()])
}
