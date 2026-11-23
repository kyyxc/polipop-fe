# 🌸 Polipop — Frontend

**Polipop** adalah aplikasi kasir (Point of Sale) berbasis web untuk warung dan UMKM. Frontend ini dibangun dengan React + Vite, menampilkan alur penjualan yang cepat: pilih produk, susun keranjang, bayar, dan cetak struk.

> Repositori ini berisi **frontend** saja. Aplikasi terhubung ke backend API terpisah (default: `http://localhost:8000`).

## ✨ Fitur

| Fitur | Deskripsi | Status |
|---|---|---|
| 🛒 **Kasir** | Grid produk, keranjang, diskon, hitung kembalian otomatis, cetak struk | ✅ |
| 🔐 **Login & Akun** | Autentikasi berbasis cookie/session, edit profil & ganti password | ✅ |
| 📦 **Produk** | Daftar produk, detail produk, ekspor data produk | ✅ |
| 🏷️ **Kategori** | Manajemen kategori produk | ✅ |
| 🧾 **Transaksi** | Riwayat transaksi, detail transaksi, ekspor data | ✅ |
| 📷 **Scan QR** | Demo pemindaian QR produk | 🧪 Demo |
| 💸 **Diskon** | Manajemen diskon | 🚧 Coming soon |
| 📊 **Inventori** | Riwayat mutasi stok | 🚧 Coming soon |
| ⚙️ **Pengaturan** | Pengaturan warung | 🚧 Coming soon |

Fitur tambahan:

- 📱 **Responsif** — layout dua kolom di desktop, satu kolom + bottom sheet keranjang di mobile.
- ♿ **Aksesibel** — navigasi keyboard, `aria-live` untuk perubahan total, focus trap pada dialog.
- 🎨 **Tema Pink Sakura** — palet warna brand yang konsisten (lihat [`design/color-palete.md`](design/color-palete.md)).

## 🛠️ Tech Stack

- [React 19](https://react.dev/) — UI library
- [Vite 8](https://vite.dev/) — build tool & dev server
- [Tailwind CSS 4](https://tailwindcss.com/) — styling
- [shadcn/ui](https://ui.shadcn.com/) + [Base UI](https://base-ui.com/) — komponen UI
- [Lucide React](https://lucide.dev/) — ikon
- [ESLint](https://eslint.org/) — linting

## 🚀 Memulai

### Prasyarat

- **Node.js** versi 20.19+ atau 22.12+ (sesuai syarat Vite 8)
- **npm**
- Backend API Polipop yang berjalan (untuk login dan data asli)

### Instalasi

```bash
# 1. Clone repositori
git clone https://github.com/<username>/polipop-fe.git
cd polipop-fe

# 2. Install dependensi
npm install

# 3. (Opsional) Buat file .env untuk mengatur URL backend
#    Lihat bagian "Environment Variables" di bawah

# 4. Jalankan dev server
npm run dev
```

Aplikasi berjalan di `http://localhost:5173`.

### Environment Variables

Buat file `.env` di root proyek:

```env
# URL backend API (default: http://localhost:8000)
VITE_API_URL=http://localhost:8000
```

> Autentikasi menggunakan cookie (`credentials: 'include'`), jadi pastikan backend mengizinkan origin frontend (CORS dengan credentials).

## 📜 Scripts

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan dev server dengan HMR |
| `npm run build` | Build produksi ke folder `dist/` |
| `npm run preview` | Preview hasil build secara lokal |
| `npm run lint` | Menjalankan ESLint |

## 📁 Struktur Proyek

```
polipop-fe/
├── design/                  # Dokumen desain (palet warna, dll.)
├── public/                  # Aset statis
├── src/
│   ├── assets/              # Gambar & aset yang di-import
│   ├── components/
│   │   ├── categories/      # Komponen halaman kategori
│   │   ├── kasir/           # Komponen halaman kasir
│   │   ├── layout/          # AppShell, sidebar, header
│   │   ├── products/        # Komponen halaman produk
│   │   ├── transactions/    # Komponen halaman transaksi
│   │   └── ui/              # Komponen UI reusable (shadcn/Base UI)
│   ├── config/              # Konfigurasi navigasi
│   ├── context/             # React Context (Cart, dll.)
│   ├── data/                # Mock data (kasir, kategori, transaksi)
│   ├── lib/                 # Service API & utilitas
│   │   ├── authService.js   # Login, logout, akun
│   │   ├── productService.js
│   │   ├── categoryService.js
│   │   ├── transactionService.js
│   │   ├── productExport.js / transactionExport.js
│   │   └── format.js, utils.js, ...
│   ├── pages/               # Halaman aplikasi + spesifikasi (*.md)
│   ├── App.jsx              # Router (hash-based) & provider
│   └── main.jsx             # Entry point
├── components.json          # Konfigurasi shadcn/ui
├── vite.config.js           # Konfigurasi Vite + alias "@" → src/
└── package.json
```

## 🧭 Routing

Aplikasi menggunakan **hash-based routing** (tanpa React Router):

| Route | Halaman |
|---|---|
| `#/login` | Login |
| `#/` | Kasir (halaman utama) |
| `#/QR` | Scan QR (demo) |
| `#/products` | Daftar produk |
| `#/products/:id` | Detail produk |
| `#/categories` | Kategori |
| `#/accounts` | Akun |
| `#/transactions` | Riwayat transaksi |
| `#/transactions/:id` | Detail transaksi |
| `#/discounts`, `#/inventory`, `#/settings` | Placeholder (coming soon) |

## 🎨 Desain

Palet warna utama (**Pink Sakura**):

| Token | Hex | Kegunaan |
|---|---|---|
| `--pink-primary` | `#F2A7BB` | Warna brand, highlight |
| `--pink-dark` | `#C2607A` | Tombol utama, hover |
| `--pink-light` | `#FDE8EE` | Background aktif, badge |
| `--bg` | `#FDF6F0` | Background halaman |
| `--surface` | `#FFFAF5` | Card, modal, sidebar |

Detail lengkap dan aturan penggunaan: [`design/color-palete.md`](design/color-palete.md).

## 📖 Dokumentasi Halaman

Spesifikasi tiap halaman (layout, interaksi, validasi, acceptance criteria) tersedia sebagai file Markdown di samping kodenya, contoh: [`src/pages/kasir.md`](src/pages/kasir.md).

## 🚢 Build & Deploy

```bash
npm run build
```

Hasil build berada di `dist/` dan dapat di-deploy ke hosting statis apa pun (Netlify, Vercel, GitHub Pages, Nginx, dll.). Karena menggunakan hash routing, tidak diperlukan konfigurasi rewrite khusus di server.

Pastikan `VITE_API_URL` di-set saat build agar menunjuk ke backend produksi.

## 📝 Catatan

- Beberapa halaman masih menggunakan **mock data** (`src/data/`) dan akan dihubungkan penuh ke backend secara bertahap.
- Proyek ini menggunakan JavaScript (bukan TypeScript) dengan JSDoc-friendly tooling dan path alias `@/`.

## 📄 Lisensi

Proyek privat — hak cipta pemilik repositori.
c