// Aplikasi memakai hash router, sehingga "query string" transaksi disimpan
// di dalam hash, misalnya: #/transactions?q=TRX&from=2026-11-01&page=2

export function readQueryParams() {
  const hash = window.location.hash.replace(/^#/, '')
  const query = hash.split('?')[1] ?? ''
  return new URLSearchParams(query)
}

export function buildHash(pathname, params) {
  const query = params.toString()
  return `#${pathname}${query ? `?${query}` : ''}`
}
