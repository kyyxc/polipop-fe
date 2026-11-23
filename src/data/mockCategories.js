// Data kategori contoh. Kategori memiliki owner (userId) untuk menegakkan
// aturan multi-tenant yang sama seperti endpoint /categories di backend.
export const currentUserId = 'user-01'

export const mockCategories = [
  { id: 'cat-makanan-berat', userId: currentUserId, name: 'Makanan Berat', createdAt: '2026-01-05T08:00:00.000Z' },
  { id: 'cat-minuman', userId: currentUserId, name: 'Minuman', createdAt: '2026-01-08T08:00:00.000Z' },
  { id: 'cat-roti-kue', userId: currentUserId, name: 'Roti & Kue', createdAt: '2026-01-12T08:00:00.000Z' },
  { id: 'cat-mie-instan', userId: currentUserId, name: 'Mie Instan', createdAt: '2026-01-16T08:00:00.000Z' },
  { id: 'cat-air-mineral', userId: currentUserId, name: 'Air Mineral', createdAt: '2026-01-20T08:00:00.000Z' },
  { id: 'cat-snack', userId: currentUserId, name: 'Snack', createdAt: '2026-01-24T08:00:00.000Z' },
  { id: 'cat-bumbu-rempah', userId: currentUserId, name: 'Bumbu & Rempah', createdAt: '2026-02-02T08:00:00.000Z' },
  { id: 'cat-kebutuhan-rumah', userId: currentUserId, name: 'Kebutuhan Rumah', createdAt: '2026-02-06T08:00:00.000Z' },
  { id: 'cat-peralatan-masak', userId: currentUserId, name: 'Peralatan Masak', createdAt: '2026-02-10T08:00:00.000Z' },
  { id: 'cat-produk-beku', userId: currentUserId, name: 'Produk Beku', createdAt: '2026-02-14T08:00:00.000Z' },
  { id: 'cat-buah-sayur', userId: currentUserId, name: 'Buah & Sayur', createdAt: '2026-02-18T08:00:00.000Z' },
  { id: 'cat-susu-yoghurt', userId: currentUserId, name: 'Susu & Yoghurt', createdAt: '2026-02-22T08:00:00.000Z' },
  { id: 'cat-kopi-teh', userId: currentUserId, name: 'Kopi & Teh', createdAt: '2026-03-01T08:00:00.000Z' },
  { id: 'cat-user-lain', userId: 'user-99', name: 'Kategori Pribadi', createdAt: '2026-03-05T08:00:00.000Z' },
]
