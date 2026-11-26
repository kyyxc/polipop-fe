// Label & warna tipe mutasi dari backend, plus tipe lama dari data lokal.
export const TYPE_META = {
  initial: {
    label: 'Stok awal',
    badge: 'bg-pink-light text-pink-dark',
  },
  restock: {
    label: 'Restock',
    badge: 'bg-success/10 text-success',
  },
  return: {
    label: 'Retur',
    badge: 'bg-success/10 text-success',
  },
  sale: {
    label: 'Penjualan',
    badge: 'bg-error/10 text-error',
  },
  damaged: {
    label: 'Barang rusak',
    badge: 'bg-error/10 text-error',
  },
  adjustment: {
    label: 'Penyesuaian',
    badge: 'bg-warning/15 text-warning',
  },
  masuk: {
    label: 'Masuk',
    badge: 'bg-success/10 text-success',
  },
  keluar: {
    label: 'Keluar',
    badge: 'bg-error/10 text-error',
  },
  penyesuaian: {
    label: 'Penyesuaian',
    badge: 'bg-warning/15 text-warning',
  },
  initial_stock: {
    label: 'Stok awal',
    badge: 'bg-pink-light text-pink-dark',
  },
}

export function signedQuantity(entry) {
  const fallback =
    entry.type === 'keluar' || entry.type === 'sale' || entry.type === 'damaged'
      ? -Math.abs(Number(entry.quantity) || 0)
      : Math.abs(Number(entry.quantity) || 0)
  const raw = Number(entry.quantityChange)
  const change = Number.isFinite(raw) ? raw : fallback
  const sign = change > 0 ? '+' : change < 0 ? '−' : ''

  return `${sign}${Math.abs(change)}`
}
