import { useCallback, useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import AppShell from './components/layout/AppShell.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import { useToast } from './components/ui/toast-context.js'
import { CartProvider } from './context/CartContext.jsx'
import { findNavItem } from './config/navigation.js'
import {
  getCurrentUser,
  getStoredUser,
  logout,
  saveUser,
} from './lib/authService.js'
import AccountPage from './pages/AccountPage.jsx'
import CategoryPage from './pages/CategoryPage.jsx'
import KasirPage from './pages/KasirPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import QrPage from './pages/QrPage.jsx'
import TransactionDetailPage from './pages/TransactionDetailPage.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'

const placeholderRoutes = new Set(['/discounts', '/inventory', '/settings'])

function currentRoute() {
  const hash = window.location.hash.replace(/^#/, '') || '/'
  return hash.split('?')[0]
}

function writeHash(nextRoute) {
  window.location.hash = nextRoute
}

function AppRouter() {
  const { showToast } = useToast()
  const [route, setRoute] = useState(currentRoute)
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(getStoredUser()),
  )
  const [checkingAuth, setCheckingAuth] = useState(() => Boolean(getStoredUser()))
  const [loggingOut, setLoggingOut] = useState(false)
  const pendingRoute = useRef('/')

  const navigate = useCallback((nextRoute) => {
    writeHash(nextRoute)
    setRoute(currentRoute())
  }, [])

  useEffect(() => {
    const handleHashChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    if (!checkingAuth) return undefined

    let active = true
    getCurrentUser()
      .then((user) => {
        if (active) setIsAuthenticated(Boolean(user))
      })
      .catch((error) => {
        // Sesi kedaluwarsa/tidak valid: hapus data akun yang tersimpan.
        if (active && (error.status === 401 || error.status === 403)) {
          saveUser(null)
          setIsAuthenticated(false)
        }
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
      setIsAuthenticated(false)
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
        onSuccess={() => {
          setIsAuthenticated(true)
          navigate(pendingRoute.current || '/')
        }}
      />
    )
  }

  return (
    <AppShell
      route={route}
      onNavigate={navigate}
      onLogout={handleLogout}
      loggingOut={loggingOut}
    >
      {route === '/accounts' ? (
        <AccountPage />
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
      ) : placeholderRoutes.has(route) ? (
        <PlaceholderPage item={findNavItem(route)} onNavigate={navigate} />
      ) : (
        <KasirPage />
      )}
    </AppShell>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <AppRouter />
      </CartProvider>
    </ToastProvider>
  )
}
