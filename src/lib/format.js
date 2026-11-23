export function formatRupiah(value) {
  const amount = Number(value) || 0
  return `Rp${amount.toLocaleString('id-ID')}`
}

export function formatDateTime(value) {
  return `${formatDateLong(value)}, ${formatTime(value)}`
}

export function formatDateLong(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date
    .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    .replace('.', ':')
}
