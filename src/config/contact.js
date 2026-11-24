// Nomor placeholder. Ganti lewat VITE_ADMIN_WHATSAPP di file .env saat deploy.
const rawNumber = import.meta.env.VITE_ADMIN_WHATSAPP || '6281234567890'
const adminWhatsappNumber = String(rawNumber).replace(/[^\d]/g, '')

export const ADMIN_WHATSAPP_NUMBER = adminWhatsappNumber

function waLink(message) {
  return `https://wa.me/${adminWhatsappNumber}?text=${encodeURIComponent(message)}`
}

export const ADMIN_WHATSAPP_URL = waLink(
  'Halo admin outlet, saya butuh bantuan terkait akun kasir Polipop.',
)

export const ADMIN_WHATSAPP_REPORT_URL = waLink(
  'Halo admin outlet, saya ingin melaporkan masalah pada aplikasi kasir Polipop.',
)
