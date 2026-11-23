import {
  BadgePercent,
  Boxes,
  LayoutGrid,
  Package,
  ReceiptText,
  ScanQrCode,
  Settings2,
  ShoppingCart,
  UsersRound,
} from 'lucide-react'

export const mainNavigation = [
  { label: 'Kasir', route: '/', icon: ShoppingCart, badge: 'Utama' },
  { label: 'Scan QR', route: '/QR', icon: ScanQrCode, badge: 'Demo' },
  { label: 'Produk', route: '/products', icon: Package },
  { label: 'Diskon', route: '/discounts', icon: BadgePercent },
  { label: 'Kategori', route: '/categories', icon: LayoutGrid },
  { label: 'Akun', route: '/accounts', icon: UsersRound },
  { label: 'Inventori', route: '/inventory', icon: Boxes },
  { label: 'Transaksi', route: '/transactions', icon: ReceiptText },
]

export const secondaryNavigation = [
  { label: 'Pengaturan', route: '/settings', icon: Settings2 },
]

export const navigation = [...mainNavigation, ...secondaryNavigation]

export function isActiveRoute(route, itemRoute) {
  return route === itemRoute || route.startsWith(`${itemRoute}/`)
}

export function findNavItem(route) {
  return (
    navigation.find((item) => isActiveRoute(route, item.route)) ??
    mainNavigation[0]
  )
}
