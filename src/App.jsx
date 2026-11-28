import { useCallback, useEffect, useRef, useState } from 'react'
import { LoaderCircle, LogOut } from 'lucide-react'
import AppShell from './components/layout/AppShell.jsx'
import ConfirmDialog from './components/ui/ConfirmDialog.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import { useToast } from './components/ui/toast-context.js'
import { CartProvider } from './context/CartContext.jsx'
import { useCart } from './context/cart-context.js'
import { ThemeProvider } from './context/ThemeProvider.jsx'
import { getCurrentUser, logout, saveUser } from './lib/authService.js'
import AccountPage from './pages/AccountPage.jsx'
import CategoryPage from './pages/CategoryPage.jsx'
import DiscountPage from './pages/DiscountPage.jsx'
import KasirPage from './pages/KasirPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import QrPage from './pages/QrPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import StockHistoryPage from './pages/StockHistoryPage.jsx'
import TransactionDetailPage from './pages/TransactionDetailPage.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'

function currentRoute() {
  const hash = window.location.hash.replace(/^#/, '') || '/'
  return hash.split('?')[0]
}

function writeHash(nextRoute) {
  window.location.hash = nextRoute
}

function AppRouter() {
  const { showToast } = useToast()
  const { clearCart } = useCart()
  const [route, setRoute] = useState(currentRoute)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const pendingRoute = useRef('/')

  const navigate = useCallback((nextRoute) => {
    writeHash(nextRoute)
    setRoute(currentRoute())
  }, [])

  const openLogoutDialog = useCallback(() => setLogoutDialogOpen(true), [])
  const closeLogoutDialog = useCallback(() => setLogoutDialogOpen(false), [])

  useEffect(() => {
    const handleHashChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    if (!checkingAuth) return undefined

    let active = true
    getCurrentUser()
      .then((currentUser) => {
        if (!active) return
        setIsAuthenticated(Boolean(currentUser))
        setUser(currentUser)
      })
      .catch(() => {
        // Cookie/source of truth tidak tervalidasi: jangan anggap masih login.
        if (!active) return
        saveUser(null)
        setIsAuthenticated(false)
        setUser(null)
      })
      .finally(() => {
        if (active) setCheckingAuth(false)
      })

    return () => {
      active = false
    }
  }, [checkingAuth])

  useEffect(() => {
    if (checkingAuth) return

    if (!isAuthenticated) {
      if (route !== '/login') {
        pendingRoute.current = route
        writeHash('/login')
      }
      return
    }

    if (route === '/login') {
      writeHash(pendingRoute.current || '/')
    }
  }, [checkingAuth, isAuthenticated, route])

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      showToast('error', error.message || 'Gagal keluar. Silakan coba lagi.')
    } finally {
      setLoggingOut(false)
      setLogoutDialogOpen(false)
      clearCart()
      setIsAuthenticated(false)
      setUser(null)
      navigate('/login')
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4 text-ink">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-muted">
          <LoaderCircle className="size-5 animate-spin text-pink-dark" />
          Memverifikasi sesi...
        </div>
      </div>
    )
  }

  if (!isAuthenticated || route === '/login') {
    return (
      <LoginPage
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser ?? null)
          setIsAuthenticated(true)
          navigate(pendingRoute.current || '/')
        }}
      />
    )
  }

  return (
    <>
      <AppShell
        route={route}
        onNavigate={navigate}
        onLogout={openLogoutDialog}
        loggingOut={loggingOut}
        user={user}
      >
        {route === '/accounts' ? (
          <AccountPage onProfileUpdate={setUser} />
        ) : route.startsWith('/products/') ? (
          <ProductDetailPage
            productId={decodeURIComponent(route.split('/')[2] ?? '')}
            onNavigate={navigate}
          />
        ) : route === '/products' ? (
          <ProductsPage onNavigate={navigate} />
        ) : route.startsWith('/transactions/') ? (
          <TransactionDetailPage
            transactionId={decodeURIComponent(route.split('/')[2] ?? '')}
            onNavigate={navigate}
          />
        ) : route === '/transactions' ? (
          <TransactionsPage onNavigate={navigate} />
        ) : route === '/QR' ? (
          <QrPage onNavigate={navigate} />
        ) : route === '/categories' ? (
          <CategoryPage />
        ) : route === '/discounts' ? (
          <DiscountPage />
        ) : route === '/settings' ? (
          <SettingsPage />
        ) : route === '/stock/history' ? (
          <StockHistoryPage onNavigate={navigate} />
        ) : (
          <KasirPage />
        )}
      </AppShell>

      <ConfirmDialog
        open={logoutDialogOpen}
        icon={LogOut}
        tone="danger"
        title="Keluar dari aplikasi?"
        description="Sesi kasir Anda akan berakhir. Anda perlu login kembali untuk melanjutkan transaksi."
        confirmLabel="Ya, keluar"
        busyLabel="Keluar..."
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={closeLogoutDialog}
      />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
