import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getPedidos } from '../../api/adminApi'
import type { PedidosFiltros } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import { useNotificationsStore } from '../../store/notificationsStore'
import type { Pedido, FormaPago, FormaEntrega } from '../../types'

const FILTROS_VACIOS: PedidosFiltros = {
  estado: '', desde: '', hasta: '', formaPago: '', formaEntrega: '',
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

// Tope de toasts por reconexión; la lista igual muestra todos.
const MAX_AVISOS_RECONEXION = 5

const PAGE_SIZE = 25

const FALLBACK_ESTADO = { label: 'Desconocido', bg: '#f3f4f6', color: '#6b7280' }

const FORMA_PAGO_LABEL: Record<FormaPago, string> = {
  Efectivo:      'Efectivo',
  Transferencia: 'Transferencia',
  Tarjeta:       'Tarjeta',
}

const FORMA_ENTREGA_LABEL: Record<FormaEntrega, string> = {
  Retira:  'Retiro',
  Delivery: 'Delivery',
}

function formatFecha(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

// Números a mostrar: primera, última y ventana de ±1 alrededor de la actual; null = "…".
function paginasVisibles(actual: number, ultima: number): (number | null)[] {
  const nums = new Set([1, ultima, actual - 1, actual, actual + 1].filter(n => n >= 1 && n <= ultima))
  const orden = [...nums].sort((a, b) => a - b)
  const out: (number | null)[] = []
  orden.forEach((n, i) => {
    if (i > 0 && n - orden[i - 1] > 1) out.push(null)
    out.push(n)
  })
  return out
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
  const [draftFiltros, setDraftFiltros] = useState<PedidosFiltros>(FILTROS_VACIOS)
  const [activeFiltros, setActiveFiltros] = useState<PedidosFiltros>(FILTROS_VACIOS)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const hayFiltros = Object.values(activeFiltros).some(Boolean)

  const ultimoNuevoPedido = useNotificationsStore(s => s.ultimoNuevoPedido)
  const ultimoPagoConfirmado = useNotificationsStore(s => s.ultimoPagoConfirmado)

  const reconexiones = useNotificationsStore(s => s.reconexiones)
  const avisarPedidosPerdidos = useNotificationsStore(s => s.avisarPedidosPerdidos)
  // Arranca en el valor actual: una reconexión anterior a este montaje no cuenta.
  const reconexionesVistas = useRef(reconexiones)
  // Ids de la última lista cargada con éxito; null = todavía no hay base de comparación.
  const idsPrevios = useRef<Set<number> | null>(null)

  // Descarta respuestas de pedidos viejos si el admin cambió de página/filtros mientras cargaba.
  const requestId = useRef(0)

  const fetchPedidos = useCallback((avisarNuevos = false) => {
    if (!adminId) return
    const miRequest = ++requestId.current
    getPedidos(adminId, activeFiltros, page, PAGE_SIZE)
      .then(data => {
        if (miRequest !== requestId.current) return
        // Pasó el último (ej. se achicó la lista): volver a la última página real.
        if (data.items.length === 0 && data.total > 0 && page > data.totalPages) {
          setPage(data.totalPages)
          return
        }
        // El diff de "perdidos" solo es válido en la página 1 sin filtros: ahí caen los nuevos.
        const esVistaEnVivo = page === 1 && !hayFiltros
        if (esVistaEnVivo) {
          if (avisarNuevos && idsPrevios.current) {
            const previos = idsPrevios.current
            // El backend ya ordena por fecha DESC, id DESC.
            const perdidos = data.items
              .filter(p => !previos.has(p.id))
              .slice(0, MAX_AVISOS_RECONEXION)
            if (perdidos.length > 0) {
              avisarPedidosPerdidos(perdidos.map(p => ({
                pedidoId: p.id,
                codigoSeguimiento: '',
                nombreCliente: p.nombreCliente,
                total: p.total,
                fechaCreacion: p.fecha,
              })))
            }
          }
          idsPrevios.current = new Set(data.items.map(p => p.id))
        } else {
          idsPrevios.current = null
        }
        setPedidos(data.items)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setError(null)
        setLoading(false)
      })
      .catch(() => {
        if (miRequest !== requestId.current) return
        setError('No se pudieron cargar los pedidos.')
        setLoading(false)
      })
  }, [adminId, activeFiltros, page, hayFiltros, avisarPedidosPerdidos])

  useEffect(() => {
    fetchPedidos()
  }, [fetchPedidos])

  // Reconexión real del hub: SignalR no reenvía lo perdido, hay que volver a pedir la lista.
  useEffect(() => {
    if (reconexiones === reconexionesVistas.current) return
    reconexionesVistas.current = reconexiones
    fetchPedidos(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconexiones])

  useEffect(() => {
    if (ultimoNuevoPedido) fetchPedidos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimoNuevoPedido])

  useEffect(() => {
    if (ultimoPagoConfirmado) fetchPedidos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimoPagoConfirmado])

  // Filtros nuevos = otra lista: vuelve a la página 1 y la base del diff ya no sirve.
  const aplicarFiltros = (filtros: PedidosFiltros) => {
    idsPrevios.current = null
    setLoading(true)
    setError(null)
    setPage(1)
    setActiveFiltros(filtros)
  }

  const irAPagina = (nueva: number) => {
    if (nueva === page || nueva < 1 || nueva > totalPages) return
    setLoading(true)
    setPage(nueva)
  }

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
          <option value="Retira">Retira</option>
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
          onClick={() => aplicarFiltros({ ...draftFiltros })}
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
          onClick={() => { setDraftFiltros(FILTROS_VACIOS); aplicarFiltros(FILTROS_VACIOS) }}
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
        <p className="mb-2 text-xs text-[#666]">
          {total} {total === 1 ? 'pedido' : 'pedidos'}
          {totalPages > 1 && ` · página ${page} de ${totalPages}`}
        </p>
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
      {!loading && !error && totalPages > 1 && (
        <nav
          aria-label="Paginación de pedidos"
          className="mt-4 flex flex-wrap items-center justify-center gap-2"
        >
          <button
            onClick={() => irAPagina(page - 1)}
            disabled={page === 1}
            className="px-4 py-1.5 text-[13px] font-semibold border border-[#1a1a1a] bg-white text-[#1a1a1a] rounded-none cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            Anterior
          </button>
          {paginasVisibles(page, totalPages).map((n, i) =>
            n === null ? (
              <span key={`gap-${i}`} className="px-1 text-[13px] text-[#aaa]">…</span>
            ) : (
              <button
                key={n}
                onClick={() => irAPagina(n)}
                aria-current={n === page ? 'page' : undefined}
                className={`min-w-9 px-3 py-1.5 text-[13px] font-semibold border border-[#1a1a1a] rounded-none cursor-pointer ${
                  n === page
                    ? 'bg-[#1a1a1a] text-white'
                    : 'bg-white text-[#1a1a1a] hover:bg-[#fafaf9]'
                }`}
              >
                {n}
              </button>
            ),
          )}
          <button
            onClick={() => irAPagina(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-1.5 text-[13px] font-semibold border border-[#1a1a1a] bg-white text-[#1a1a1a] rounded-none cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            Siguiente
          </button>
        </nav>
      )}
    </AdminLayout>
  )
}
