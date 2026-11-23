import { useEffect, useState } from 'react'
import AppShell from './components/layout/AppShell.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { findNavItem } from './config/navigation.js'
import CategoryPage from './pages/CategoryPage.jsx'
import KasirPage from './pages/KasirPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import QrPage from './pages/QrPage.jsx'
import TransactionDetailPage from './pages/TransactionDetailPage.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'

const placeholderRoutes = new Set([
  '/discounts',
  '/accounts',
  '/inventory',
  '/settings',
])

function currentRoute() {
  const hash = window.location.hash.replace(/^#/, '') || '/'
  return hash.split('?')[0]
}

function App() {
  const [route, setRoute] = useState(currentRoute)

  useEffect(() => {
    const handleHashChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = (nextRoute) => {
    window.location.hash = nextRoute
    setRoute(currentRoute())
  }

  let content

  if (route === '/login') {
    content = <LoginPage onSuccess={() => navigate('/')} />
  } else {
    content = (
      <AppShell
        route={route}
        onNavigate={navigate}
        onLogout={() => navigate('/login')}
      >
        {route.startsWith('/products/') ? (
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

  return (
    <ToastProvider>
      <CartProvider>{content}</CartProvider>
    </ToastProvider>
  )
}

export default App
