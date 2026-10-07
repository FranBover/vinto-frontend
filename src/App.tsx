import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { getTokenExpMs, useAuthStore } from './store/authStore'
import RouteFallback from './components/RouteFallback'

const LandingPage = lazy(() => import('./pages/marketing/LandingPage'))
const MenuPage = lazy(() => import('./pages/client/MenuPage'))
const ProductosPage = lazy(() => import('./pages/client/ProductosPage'))
const ExtrasPage = lazy(() => import('./pages/client/ExtrasPage'))
const CarritoPage = lazy(() => import('./pages/client/CarritoPage'))
const CheckoutPage = lazy(() => import('./pages/client/CheckoutPage'))
const ConfirmacionPage = lazy(() => import('./pages/client/ConfirmacionPage'))
const PagoSuccessPage = lazy(() => import('./pages/client/PagoSuccessPage'))
const PagoFailurePage = lazy(() => import('./pages/client/PagoFailurePage'))
const PagoPendingPage = lazy(() => import('./pages/client/PagoPendingPage'))

const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const PedidosPage = lazy(() => import('./pages/admin/PedidosPage'))
const PedidoDetallePage = lazy(() => import('./pages/admin/PedidoDetallePage'))
const AdminProductosPage = lazy(() => import('./pages/admin/ProductosPage'))
const CategoriasPage = lazy(() => import('./pages/admin/CategoriasPage'))
const ReportesPage = lazy(() => import('./pages/admin/ReportesPage'))
const MiLocalPage = lazy(() => import('./pages/admin/MiLocalPage'))
const StockPage = lazy(() => import('./pages/admin/StockPage'))
const DescuentosPage = lazy(() => import('./pages/admin/DescuentosPage'))
const CuponesPage = lazy(() => import('./pages/admin/CuponesPage'))

function ProtectedRoute() {
  // Suscribirse al token (no a la función isAuthenticated) para re-renderizar al limpiarlo.
  const token = useAuthStore(s => s.token)
  const expirarSesion = useAuthStore(s => s.expirarSesion)

  useEffect(() => {
    if (!token) return
    const expMs = getTokenExpMs(token)
    if (expMs === null) return

    const chequear = () => {
      if (expMs <= Date.now()) expirarSesion()
    }
    // Los timers se atrasan con la pestaña en segundo plano o la PC suspendida:
    // se re-chequea al volver a la pestaña.
    const timer = window.setTimeout(chequear, Math.min(Math.max(expMs - Date.now(), 0), 2 ** 31 - 1))
    document.addEventListener('visibilitychange', chequear)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', chequear)
    }
  }, [token, expirarSesion])

  return token ? <Outlet /> : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* ── Marketing ────────────────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />

        {/* ── Cliente ──────────────────────────────────────────── */}
        <Route path="/:slug" element={<MenuPage />} />
        <Route path="/:slug/productos/:categoriaId" element={<ProductosPage />} />
        <Route path="/:slug/productos/:categoriaId/:productoId" element={<ExtrasPage />} />
        <Route path="/:slug/carrito" element={<CarritoPage />} />
        <Route path="/:slug/checkout" element={<CheckoutPage />} />
        <Route path="/:slug/confirmacion" element={<ConfirmacionPage />} />
        <Route path="/:slug/pago/success" element={<PagoSuccessPage />} />
        <Route path="/:slug/pago/failure" element={<PagoFailurePage />} />
        <Route path="/:slug/pago/pending" element={<PagoPendingPage />} />

        {/* ── Admin público ─────────────────────────────────────── */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* ── Admin protegido ───────────────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/pedidos" element={<PedidosPage />} />
          <Route path="/admin/pedidos/:id" element={<PedidoDetallePage />} />
          <Route path="/admin/productos" element={<AdminProductosPage />} />
          <Route path="/admin/categorias" element={<CategoriasPage />} />
          <Route path="/admin/reportes" element={<ReportesPage />} />
          <Route path="/admin/stock" element={<StockPage />} />
          <Route path="/admin/mi-local" element={<MiLocalPage />} />
          <Route path="/admin/descuentos" element={<DescuentosPage />} />
          <Route path="/admin/cupones" element={<CuponesPage />} />
        </Route>

        {/* ── Fallback ──────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
