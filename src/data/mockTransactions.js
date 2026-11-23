import { currentUserId, mockCategories } from './mockCategories.js'
import { currentWarungId, mockProducts } from './mockKasir.js'

const product = (id, qty, discount = 0) => {
  const item = mockProducts.find((entry) => entry.id === id)
  return {
    productId: item.id,
    name: item.name,
    price: item.price,
    qty,
    discount,
  }
}

function makeTransaction({ day, sequence, hour, minute, items, discount = 0 }) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const productDiscount = items.reduce((sum, item) => sum + item.discount, 0)
  const total = Math.max(0, subtotal - productDiscount - discount)
  const paid = Math.ceil(total / 5000) * 5000
  const no = `TRX-202611${String(day).padStart(2, '0')}-${String(sequence).padStart(3, '0')}`

  return {
    id: no,
    no,
    userId: currentUserId,
    warungId: currentWarungId,
    items,
    subtotal,
    discountAmount: discount,
    total,
    paid,
    change: paid - total,
    createdAt: `2026-11-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
  }
}

// Data awal untuk keperluan development: transaksi milik user/warung lain
// sengaja disertakan agar aturan multi-tenant bisa diverifikasi.
export const mockTransactions = [
  makeTransaction({ day: 23, sequence: 6, hour: 14, minute: 30, items: [product('prod-01', 2, 2000), product('prod-03', 1, 1000)], discount: 5000 }),
  makeTransaction({ day: 23, sequence: 5, hour: 13, minute: 12, items: [product('prod-07', 3), product('prod-08', 2)] }),
  makeTransaction({ day: 23, sequence: 4, hour: 11, minute: 45, items: [product('prod-03', 1), product('prod-02', 2, 1000), product('prod-05', 2)], discount: 10000 }),
  makeTransaction({ day: 22, sequence: 9, hour: 19, minute: 5, items: [product('prod-04', 2)] }),
  makeTransaction({ day: 22, sequence: 8, hour: 17, minute: 40, items: [product('prod-01', 1), product('prod-08', 1, 1500)], discount: 5000 }),
  makeTransaction({ day: 22, sequence: 7, hour: 15, minute: 18, items: [product('prod-05', 4)] }),
  makeTransaction({ day: 21, sequence: 12, hour: 20, minute: 2, items: [product('prod-03', 2), product('prod-07', 2)], discount: 10000 }),
  makeTransaction({ day: 21, sequence: 11, hour: 16, minute: 25, items: [product('prod-04', 1), product('prod-02', 1)] }),
  makeTransaction({ day: 20, sequence: 15, hour: 12, minute: 10, items: [product('prod-01', 3)] }),
  makeTransaction({ day: 20, sequence: 14, hour: 9, minute: 35, items: [product('prod-08', 3), product('prod-07', 1)], discount: 5000 }),
  makeTransaction({ day: 19, sequence: 10, hour: 18, minute: 55, items: [product('prod-05', 2)] }),
  makeTransaction({ day: 19, sequence: 9, hour: 10, minute: 15, items: [product('prod-03', 1), product('prod-04', 1)] }),
  makeTransaction({ day: 18, sequence: 7, hour: 14, minute: 8, items: [product('prod-02', 5), product('prod-08', 1)] }),
  makeTransaction({ day: 17, sequence: 4, hour: 8, minute: 50, items: [product('prod-01', 1), product('prod-07', 2)] }),
  {
    ...makeTransaction({ day: 23, sequence: 99, hour: 12, minute: 0, items: [product('prod-01', 1)] }),
    userId: mockCategories.find((category) => category.userId !== currentUserId).userId,
  },
  {
    ...makeTransaction({ day: 23, sequence: 98, hour: 11, minute: 0, items: [product('prod-01', 1)] }),
    warungId: 'warung-lain',
  },
]
