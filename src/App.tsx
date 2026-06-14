import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import LandingPage from './pages/marketing/LandingPage'
import MenuPage from './pages/client/MenuPage'
import ProductosPage from './pages/client/ProductosPage'
import ExtrasPage from './pages/client/ExtrasPage'
import CarritoPage from './pages/client/CarritoPage'
import CheckoutPage from './pages/client/CheckoutPage'
import ConfirmacionPage from './pages/client/ConfirmacionPage'
import PagoSuccessPage from './pages/client/PagoSuccessPage'
import PagoFailurePage from './pages/client/PagoFailurePage'
import PagoPendingPage from './pages/client/PagoPendingPage'

import LoginPage from './pages/admin/LoginPage'
import PedidosPage from './pages/admin/PedidosPage'
import PedidoDetallePage from './pages/admin/PedidoDetallePage'
import AdminProductosPage from './pages/admin/ProductosPage'
import CategoriasPage from './pages/admin/CategoriasPage'
import ReportesPage from './pages/admin/ReportesPage'
import MiLocalPage from './pages/admin/MiLocalPage'
import StockPage from './pages/admin/StockPage'
import DescuentosPage from './pages/admin/DescuentosPage'
import CuponesPage from './pages/admin/CuponesPage'

function ProtectedRoute() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return isAuthenticated() ? <Outlet /> : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
