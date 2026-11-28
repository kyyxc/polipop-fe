import { formatDateLong, formatRupiah } from './format.js'

export function formatDiscountValue(discount) {
  if (discount?.type === 'percentage') return `${discount.value}%`
  return formatRupiah(discount?.value)
}

export function formatDiscountPeriod(discount) {
  const start = discount?.startsAt
  const end = discount?.endsAt
  if (!start && !end) return 'Tanpa batas'
  return `${start ? formatDateLong(start) : 'Awal'} – ${
    end ? formatDateLong(end) : 'Akhir'
  }`
}

export function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
