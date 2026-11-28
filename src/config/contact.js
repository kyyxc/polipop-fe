// Nomor dummy hanya dipakai saat development. Produksi wajib menyetel
// VITE_ADMIN_WHATSAPP agar tautan tidak mengarah ke nomor contoh.
const fallbackNumber = import.meta.env.DEV ? '6281234567890' : ''
const rawNumber = import.meta.env.VITE_ADMIN_WHATSAPP || fallbackNumber
const adminWhatsappNumber = String(rawNumber).replace(/[^\d]/g, '')

export const ADMIN_WHATSAPP_NUMBER = adminWhatsappNumber
export const HAS_ADMIN_WHATSAPP = adminWhatsappNumber.length > 0

function waLink(message) {
  if (!HAS_ADMIN_WHATSAPP) return '#'
  return `https://wa.me/${adminWhatsappNumber}?text=${encodeURIComponent(message)}`
}

export const ADMIN_WHATSAPP_URL = waLink(
  'Halo admin outlet, saya butuh bantuan terkait akun kasir Polipop.',
)

export const ADMIN_WHATSAPP_REPORT_URL = waLink(
  'Halo admin outlet, saya ingin melaporkan masalah pada aplikasi kasir Polipop.',
)
