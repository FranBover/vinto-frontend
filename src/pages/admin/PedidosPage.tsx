import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getPedidos } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import type { Pedido, FormaPago, FormaEntrega } from '../../types'

const ESTADO_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  // Valores del tipo TypeScript
  Pendiente:     { label: 'Pendiente',      bg: '#fef9c3', color: '#854d0e' },
  EnPreparacion: { label: 'En preparación', bg: '#dbeafe', color: '#1e40af' },
  Listo:         { label: 'Listo',          bg: '#d1fae5', color: '#065f46' },
  Entregado:     { label: 'Entregado',      bg: '#f3f4f6', color: '#6b7280' },
  Cancelado:     { label: 'Cancelado',      bg: '#fee2e2', color: '#991b1b' },
  // Valores que devuelve el backend
  Confirmado:    { label: 'Confirmado',     bg: '#dbeafe', color: '#1e40af' },
  'En camino':   { label: 'En camino',      bg: '#ede9fe', color: '#5b21b6' },
}

const FALLBACK_ESTADO = { label: 'Desconocido', bg: '#f3f4f6', color: '#6b7280' }

const FORMA_PAGO_LABEL: Record<FormaPago, string> = {
  Efectivo:      'Efectivo',
  Transferencia: 'Transferencia',
  Tarjeta:       'Tarjeta',
}

const FORMA_ENTREGA_LABEL: Record<FormaEntrega, string> = {
  Local:   'Retiro',
  Delivery: 'Delivery',
}

function formatFecha(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function todayLabel() {
  return new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PedidosPage() {
  const navigate = useNavigate()
  const adminId = useAuthStore(s => s.adminId)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminId) return
    getPedidos(adminId)
      .then(data => {
        // Sort newest first
        setPedidos([...data].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()))
      })
      .catch(() => setError('No se pudieron cargar los pedidos.'))
      .finally(() => setLoading(false))
  }, [adminId])

  return (
    <AdminLayout title="Pedidos" subtitle={todayLabel()}>
      {loading && (
        <p className="text-sm text-[#aaa] py-8 text-center">Cargando pedidos…</p>
      )}
      {error && (
        <p className="text-sm text-red-600 py-8 text-center">{error}</p>
      )}
      {!loading && !error && (
        <div className="border border-[#e8e8e8] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8e8e8]" style={{ backgroundColor: '#fafaf9' }}>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest w-16">#</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Cliente</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Estado</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Total</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Pago</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Entrega</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#aaa] text-sm">
                    No hay pedidos todavía.
                  </td>
                </tr>
              ) : (
                pedidos.map(p => {
                  const cfg = ESTADO_CONFIG[p.estado] ?? FALLBACK_ESTADO
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/admin/pedidos/${p.id}`)}
                      className="border-b border-[#e8e8e8] hover:bg-[#fafaf9] cursor-pointer transition-colors last:border-b-0"
                    >
                      <td className="px-4 py-3 font-mono text-[#aaa]">#{p.id}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-[#1a1a1a]">{p.nombreCliente}</span>
                        <span className="block text-xs text-[#aaa]">{p.telefonoCliente}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2 py-0.5 text-xs font-semibold"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold">${p.total.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-[#666]">{FORMA_PAGO_LABEL[p.formaPago]}</td>
                      <td className="px-4 py-3 text-[#666]">{FORMA_ENTREGA_LABEL[p.formaEntrega]}</td>
                      <td className="px-4 py-3 text-[#aaa] text-xs">{formatFecha(p.fecha)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
