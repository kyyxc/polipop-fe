import { currentWarungId } from '../data/mockKasir.js'

// Demo: menerjemahkan isi QR menjadi produk dari katalog lokal.
// Format yang diterima (tanpa pemanggilan API):
//   - "prod-01"                       -> id produk
//   - "POLIPOP:prod-01"               -> id dengan prefix
//   - "https://.../?productId=prod-01" -> query parameter
//   - '{"productId":"prod-01"}'       -> payload JSON
//   - "Kopi Susu Gula Aren"           -> nama produk (case-insensitive)

function lookup(products, value) {
  const keyword = String(value ?? '').trim().toLocaleLowerCase('id-ID')
  if (!keyword) return null

  return (
    products.find((product) => product.id.toLocaleLowerCase() === keyword) ||
    products.find(
      (product) => product.name.toLocaleLowerCase('id-ID') === keyword,
    ) ||
    null
  )
}

export function resolveProductFromQr(rawValue, products = []) {
  const value = String(rawValue ?? '').trim()
  if (!value) return null

  const available = products.filter(
    (product) => product.active && product.warungId === currentWarungId,
  )

  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object') {
      const payload =
        parsed.productId ?? parsed.id ?? parsed.sku ?? parsed.code ?? parsed.qr
      const fromJson = lookup(available, payload)
      if (fromJson) return fromJson
    }
  } catch {
    // Bukan JSON: lanjutkan ke format teks biasa.
  }

  let url = null
  if (/^https?:\/\//i.test(value)) {
    try {
      url = new URL(value)
    } catch {
      // URL tidak valid: tetap coba format teks di bawah.
    }
  }
  const fromQuery = url?.searchParams.get('productId')
  const fromQueryAlt = url?.searchParams.get('id')
  const fromQueryProduct = url?.searchParams.get('product')

  const withoutPrefix = value.replace(
    /^(POLIPOP|PRODUK|PRODUCT|SKU|QR|BARCODE)\s*[:=]\s*/i,
    '',
  )
  const separated = withoutPrefix.split(/[:=]/).at(-1)?.trim() ?? ''

  return (
    lookup(available, withoutPrefix) ||
    lookup(available, separated) ||
    lookup(available, fromQuery) ||
    lookup(available, fromQueryAlt) ||
    lookup(available, fromQueryProduct) ||
    null
  )
}

export function demoQrPayloads(products = []) {
  return products
    .filter((product) => product.active && product.warungId === currentWarungId)
    .slice(0, 6)
    .map((product) => ({ product, payload: `POLIPOP:${product.id}` }))
}
