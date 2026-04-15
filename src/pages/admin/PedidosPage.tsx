import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getPedidos } from '../../api/adminApi'
import type { PedidosFiltros } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import { usePedidosHub } from '../../hooks/usePedidosHub'
import NuevoPedidoToast from '../../components/NuevoPedidoToast'
import type { Pedido, FormaPago, FormaEntrega } from '../../types'

const FILTROS_VACIOS: PedidosFiltros = {
  estado: '', desde: '', hasta: '', formaPago: '', formaEntrega: '',
}

interface NuevoPedidoPayload {
  pedidoId: number
  codigoSeguimiento: string
  nombreCliente: string
  total: number
  fechaCreacion: string
}

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
  const [nuevoPedido, setNuevoPedido] = useState<NuevoPedidoPayload | null>(null)
  const [draftFiltros, setDraftFiltros] = useState<PedidosFiltros>(FILTROS_VACIOS)
  const [activeFiltros, setActiveFiltros] = useState<PedidosFiltros>(FILTROS_VACIOS)

  const fetchPedidos = useCallback(() => {
    if (!adminId) return
    getPedidos(adminId, activeFiltros)
      .then(data => {
        setPedidos([...data].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()))
      })
      .catch(() => setError('No se pudieron cargar los pedidos.'))
      .finally(() => setLoading(false))
  }, [adminId, activeFiltros])

  useEffect(() => {
    fetchPedidos()
  }, [fetchPedidos])

  const handleNuevoPedido = useCallback((pedido: NuevoPedidoPayload) => {
    setNuevoPedido(pedido)
    fetchPedidos()
  }, [fetchPedidos])

  usePedidosHub({ adminId, onNuevoPedido: handleNuevoPedido })

  const inputStyle: React.CSSProperties = {
    border: '1px solid #d0d0d0',
    borderRadius: 0,
    padding: '6px 10px',
    fontSize: '13px',
    color: '#1a1a1a',
    background: '#fff',
    outline: 'none',
  }

  return (
    <AdminLayout title="Pedidos" subtitle={todayLabel()}>
      {/* ── Filtros ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', alignItems: 'flex-end' }}>
        <select
          value={draftFiltros.estado}
          onChange={e => setDraftFiltros(f => ({ ...f, estado: e.target.value }))}
          style={inputStyle}
        >
          <option value="">Estado: todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Confirmado">Confirmado</option>
          <option value="EnPreparacion">En preparación</option>
          <option value="Listo">Listo</option>
          <option value="Entregado">Entregado</option>
          <option value="Cancelado">Cancelado</option>
        </select>

        <select
          value={draftFiltros.formaPago}
          onChange={e => setDraftFiltros(f => ({ ...f, formaPago: e.target.value }))}
          style={inputStyle}
        >
          <option value="">Pago: todos</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
          <option value="MercadoPago">MercadoPago</option>
        </select>

        <select
          value={draftFiltros.formaEntrega}
          onChange={e => setDraftFiltros(f => ({ ...f, formaEntrega: e.target.value }))}
          style={inputStyle}
        >
          <option value="">Entrega: todas</option>
          <option value="Delivery">Delivery</option>
          <option value="Local">Retira</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#888' }}>Desde</label>
          <input
            type="date"
            value={draftFiltros.desde}
            onChange={e => setDraftFiltros(f => ({ ...f, desde: e.target.value }))}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#888' }}>Hasta</label>
          <input
            type="date"
            value={draftFiltros.hasta}
            onChange={e => setDraftFiltros(f => ({ ...f, hasta: e.target.value }))}
            style={inputStyle}
          />
        </div>

        <button
          onClick={() => { setLoading(true); setError(null); setActiveFiltros({ ...draftFiltros }) }}
          style={{
            padding: '6px 16px',
            fontSize: '13px',
            fontWeight: 600,
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #1a1a1a',
            borderRadius: 0,
            cursor: 'pointer',
          }}
        >
          Filtrar
        </button>

        <button
          onClick={() => { setDraftFiltros(FILTROS_VACIOS); setLoading(true); setError(null); setActiveFiltros(FILTROS_VACIOS) }}
          style={{
            padding: '6px 16px',
            fontSize: '13px',
            fontWeight: 600,
            background: '#fff',
            color: '#1a1a1a',
            border: '1px solid #1a1a1a',
            borderRadius: 0,
            cursor: 'pointer',
          }}
        >
          Limpiar
        </button>
      </div>

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
      {nuevoPedido && (
        <NuevoPedidoToast
          pedido={nuevoPedido}
          onClose={() => setNuevoPedido(null)}
        />
      )}
    </AdminLayout>
  )
}
