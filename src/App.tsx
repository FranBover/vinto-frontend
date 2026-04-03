import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import MenuPage from './pages/client/MenuPage'
import ProductosPage from './pages/client/ProductosPage'
import ExtrasPage from './pages/client/ExtrasPage'
import CarritoPage from './pages/client/CarritoPage'
import CheckoutPage from './pages/client/CheckoutPage'
import ConfirmacionPage from './pages/client/ConfirmacionPage'

import LoginPage from './pages/admin/LoginPage'
import PedidosPage from './pages/admin/PedidosPage'
import PedidoDetallePage from './pages/admin/PedidoDetallePage'
import AdminProductosPage from './pages/admin/ProductosPage'
import CategoriasPage from './pages/admin/CategoriasPage'
import ReportesPage from './pages/admin/ReportesPage'
import MiLocalPage from './pages/admin/MiLocalPage'

function ProtectedRoute() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return isAuthenticated() ? <Outlet /> : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Cliente ──────────────────────────────────────────── */}
        <Route path="/:slug" element={<MenuPage />} />
        <Route path="/:slug/productos/:categoriaId" element={<ProductosPage />} />
        <Route path="/:slug/productos/:categoriaId/:productoId" element={<ExtrasPage />} />
        <Route path="/:slug/carrito" element={<CarritoPage />} />
        <Route path="/:slug/checkout" element={<CheckoutPage />} />
        <Route path="/:slug/confirmacion" element={<ConfirmacionPage />} />

        {/* ── Admin público ─────────────────────────────────────── */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* ── Admin protegido ───────────────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/pedidos" element={<PedidosPage />} />
          <Route path="/admin/pedidos/:id" element={<PedidoDetallePage />} />
          <Route path="/admin/productos" element={<AdminProductosPage />} />
          <Route path="/admin/categorias" element={<CategoriasPage />} />
          <Route path="/admin/reportes" element={<ReportesPage />} />
          <Route path="/admin/mi-local" element={<MiLocalPage />} />
        </Route>

        {/* ── Fallback ──────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
