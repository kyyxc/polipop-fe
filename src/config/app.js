// Identitas aplikasi/outlet. Backend belum menyediakan endpoint pengaturan
// warung, sehingga nilai ini dikonfigurasi lewat environment saat build.
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Polipop'

export const OUTLET_NAME = import.meta.env.VITE_OUTLET_NAME || APP_NAME
