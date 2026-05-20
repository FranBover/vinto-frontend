import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getPedidoById, updateEstadoPedido, getComentariosPedido, addComentarioPedido, getComanda, getTicket } from '../../api/adminApi'
import type { ComentarioPedido, ComandaResponseDTO, TicketResponseDTO } from '../../api/adminApi'
import ImpresionModal from '../../components/admin/ImpresionModal'
import PagoMercadoPagoBadge from '../../components/admin/PagoMercadoPagoBadge'
import type { Pedido, EstadoPedido } from '../../types'

const MAX_CHARS = 500

function formatComentarioFecha(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

const ESTADOS: EstadoPedido[] = ['Pendiente', 'Confirmado', 'EnPreparacion', 'Listo', 'Entregado', 'Cancelado']

const ESTADO_LABELS: Record<EstadoPedido, string> = {
  Pendiente:     'Pendiente',
  Confirmado:    'Confirmado',
  EnPreparacion: 'En preparación',
  Listo:         'Listo',
  Entregado:     'Entregado',
  Cancelado:     'Cancelado',
}

const labelCls = 'block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#e8e8e8] bg-white">
      <div className="px-5 py-3 border-b border-[#e8e8e8]" style={{ backgroundColor: '#fafaf9' }}>
        <p className={labelCls}>{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

export default function PedidoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [estado, setEstado] = useState<EstadoPedido>('Pendiente')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [comentarios, setComentarios] = useState<ComentarioPedido[]>([])
  const [comentariosLoading, setComentariosLoading] = useState(true)
  const [comentariosError, setComentariosError] = useState<string | null>(null)
  const [nuevoTexto, setNuevoTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [envioError, setEnvioError] = useState<string | null>(null)

  type ModalState =
    | { tipo: 'comanda'; datos: ComandaResponseDTO }
    | { tipo: 'ticket';  datos: TicketResponseDTO  }
    | null
  const [modal, setModal] = useState<ModalState>(null)
  const [loadingComanda, setLoadingComanda] = useState(false)
  const [loadingTicket, setLoadingTicket] = useState(false)

  const handleOpenComanda = async () => {
    if (!id || !pedido) return
    setLoadingComanda(true)
    try {
      const datos = await getComanda(Number(id))
      setModal({
        tipo: 'comanda',
        datos: {
          ...datos,
          fecha: datos.fecha || pedido.fecha,
          items: datos.items.map((item, i) => ({
            ...item,
            varianteDescripcion: pedido.detalles[i]?.varianteDescripcion,
          })),
        },
      })
    } finally {
      setLoadingComanda(false)
    }
  }

  const handleOpenTicket = async () => {
    if (!id || !pedido) return
    setLoadingTicket(true)
    try {
      const datos = await getTicket(Number(id))
      setModal({
        tipo: 'ticket',
        datos: {
          ...datos,
          fecha: datos.fecha || pedido.fecha,
          items: datos.items.map((item, i) => ({
            ...item,
            varianteDescripcion: pedido.detalles[i]?.varianteDescripcion,
          })),
        },
      })
    } finally {
      setLoadingTicket(false)
    }
  }

  useEffect(() => {
    if (!id) return
    getPedidoById(Number(id))
      .then(p => {
        setPedido(p)
        setEstado(p.estado)
      })
      .catch(() => setError('No se pudo cargar el pedido.'))
      .finally(() => setLoading(false))
    getComentariosPedido(Number(id))
      .then(data => setComentarios(data.sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime())))
      .catch(() => setComentariosError('No se pudieron cargar los comentarios.'))
      .finally(() => setComentariosLoading(false))
  }, [id])

  const handleAddComentario = async () => {
    if (!id || !nuevoTexto.trim()) return
    setEnviando(true)
    setEnvioError(null)
    try {
      const creado = await addComentarioPedido(Number(id), nuevoTexto.trim())
      setComentarios(prev => [...prev, creado])
      setNuevoTexto('')
    } catch {
      setEnvioError('No se pudo agregar el comentario.')
    } finally {
      setEnviando(false)
    }
  }

  const handleSaveEstado = async () => {
    if (!pedido) return
    setSaving(true)
    try {
      await updateEstadoPedido(pedido.id, { estado })
      setPedido({ ...pedido, estado })
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 2500)
    } catch {
      setSaveError('No se pudo actualizar el estado.')
      setTimeout(() => setSaveError(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const printBtnStyle: React.CSSProperties = {
    padding: '5px 14px', fontSize: 12, fontWeight: 600,
    background: '#fff', color: '#1a1a1a',
    border: '1px solid #1a1a1a', borderRadius: 0, cursor: 'pointer',
  }

  const headerActions = (
    <>
      <button
        onClick={handleOpenComanda}
        disabled={loadingComanda}
        style={{ ...printBtnStyle, opacity: loadingComanda ? 0.5 : 1 }}
      >
        {loadingComanda ? '…' : 'Imprimir comanda'}
      </button>
      <button
        onClick={handleOpenTicket}
        disabled={loadingTicket}
        style={{ ...printBtnStyle, opacity: loadingTicket ? 0.5 : 1 }}
      >
        {loadingTicket ? '…' : 'Imprimir ticket'}
      </button>
      <button
        onClick={() => navigate('/admin/pedidos')}
        className="text-sm text-[#aaa] hover:text-[#1a1a1a] transition-colors"
      >
        ← Volver
      </button>
    </>
  )

  if (loading) {
    return (
      <AdminLayout title="Pedido" actions={headerActions}>
        <p className="text-sm text-[#aaa] py-8 text-center">Cargando…</p>
      </AdminLayout>
    )
  }

  if (error || !pedido) {
    return (
      <AdminLayout title="Pedido" actions={headerActions}>
        <p className="text-sm text-red-600 py-8 text-center">{error ?? 'Error desconocido.'}</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={`Pedido #${pedido.id}`} actions={headerActions}>
      <div className="max-w-2xl space-y-5">

        {/* Estado selector */}
        <div className="border border-[#e8e8e8] bg-white px-5 py-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label htmlFor="estado" className={labelCls}>Estado del pedido</label>
              <select
                id="estado"
                value={estado}
                onChange={e => setEstado(e.target.value as EstadoPedido)}
                className="w-full border border-[#d0d0d0] px-3 py-2.5 text-sm rounded-none outline-none focus:border-[#1a1a1a] bg-white"
              >
                {ESTADOS.map(s => (
                  <option key={s} value={s}>{ESTADO_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSaveEstado}
              disabled={saving || estado === pedido.estado}
              className="mt-5 px-5 py-2.5 text-sm font-bold text-white rounded-none disabled:opacity-40 transition-colors"
              style={{ backgroundColor: '#2d5a27' }}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
          {savedMsg && (
            <p className="text-sm font-medium" style={{ color: '#2d5a27' }}>Estado actualizado</p>
          )}
          {saveError && (
            <p className="text-sm text-red-600">{saveError}</p>
          )}
        </div>

        {/* Cliente */}
        <Section title="Cliente">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={labelCls}>Nombre</p>
              <p className="text-sm font-medium">{pedido.nombreCliente}</p>
            </div>
            <div>
              <p className={labelCls}>Teléfono</p>
              <p className="text-sm font-medium">{pedido.telefonoCliente}</p>
            </div>
          </div>
        </Section>

        {/* Entrega */}
        <Section title="Entrega">
          <div className="space-y-3">
            <div>
              <p className={labelCls}>Forma de entrega</p>
              <p className="text-sm font-medium">{pedido.formaEntrega === 'Local' ? 'Retiro en local' : 'Delivery'}</p>
            </div>
            {pedido.formaEntrega === 'Delivery' && (
              <>
                {pedido.direccionCliente && (
                  <div>
                    <p className={labelCls}>Dirección</p>
                    <p className="text-sm font-medium">{pedido.direccionCliente}</p>
                  </div>
                )}
                {pedido.referenciaDireccion && (
                  <div>
                    <p className={labelCls}>Referencia</p>
                    <p className="text-sm text-[#666]">{pedido.referenciaDireccion}</p>
                  </div>
                )}
                {pedido.ubicacionUrl && (
                  <div>
                    <p className={labelCls}>Ubicación</p>
                    <a
                      href={pedido.ubicacionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline"
                      style={{ color: '#2d5a27' }}
                    >
                      Ver ubicación →
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </Section>

        {/* Pago */}
        <Section title="Pago">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={labelCls}>Forma de pago</p>
              <p className="text-sm font-medium">{pedido.formaPago}</p>
            </div>
            {pedido.formaPago === 'Efectivo' && pedido.montoPagoEfectivo != null && (
              <div>
                <p className={labelCls}>Paga con</p>
                <p className="text-sm font-medium">${pedido.montoPagoEfectivo.toLocaleString('es-AR')}</p>
              </div>
            )}
          </div>
          <PagoMercadoPagoBadge
            status={pedido.mercadoPagoStatus}
            statusDetail={pedido.mercadoPagoStatusDetail}
            paymentId={pedido.mercadoPagoPaymentId}
            fechaPago={pedido.mercadoPagoFechaPago}
          />
        </Section>

        {/* Productos */}
        <Section title="Productos">
          <div className="space-y-3">
            {(pedido.detalles ?? []).map(d => (
              <div key={d.id} className="flex justify-between items-start text-sm">
                <div>
                  <span className="font-medium">
                    {d.cantidad}× {d.nombreProducto ?? `Producto #${d.productoId}`}
                  </span>
                  {d.varianteDescripcion && (
                    <p className="text-xs mt-0.5" style={{ color: '#666' }}>{d.varianteDescripcion}</p>
                  )}
                  {(d.extras ?? []).length > 0 && (
                    <div className="mt-1">
                      {(d.extras ?? []).map((e, i) => (
                        <p key={i} className="text-xs pl-3" style={{ color: '#666' }}>
                          + {e.nombre} — ${e.precioAdicional.toLocaleString('es-AR')}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <span className="font-bold ml-4 shrink-0">
                  ${(d.precioUnitario * d.cantidad).toLocaleString('es-AR')}
                </span>
              </div>
            ))}
            <div className="pt-3 border-t border-[#e8e8e8] space-y-1.5">
              {((pedido.montoDescuentoProductos ?? 0) > 0 || (pedido.montoDescuentoCupon ?? 0) > 0) && (
                <div className="flex justify-between text-sm text-[#666]">
                  <span>Subtotal sin descuentos</span>
                  <span>${(pedido.subtotalSinDescuentos ?? 0).toLocaleString('es-AR')}</span>
                </div>
              )}
              {(pedido.montoDescuentoProductos ?? 0) > 0 && (
                <div className="flex justify-between text-sm" style={{ color: '#ef4444' }}>
                  <span>Descuentos en productos</span>
                  <span>-${(pedido.montoDescuentoProductos ?? 0).toLocaleString('es-AR')}</span>
                </div>
              )}
              {(pedido.montoDescuentoCupon ?? 0) > 0 && (
                <div className="flex justify-between text-sm" style={{ color: '#ef4444' }}>
                  <span>Cupón {pedido.codigoCupon}</span>
                  <span>-${(pedido.montoDescuentoCupon ?? 0).toLocaleString('es-AR')}</span>
                </div>
              )}
              {pedido.subtotal != null && (
                <div className="flex justify-between text-sm text-[#666]">
                  <span>Subtotal</span>
                  <span>${pedido.subtotal.toLocaleString('es-AR')}</span>
                </div>
              )}
              {(pedido.costoEnvio ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-[#666]">
                  <span>Envío</span>
                  <span>${(pedido.costoEnvio ?? 0).toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1.5 border-t border-[#e8e8e8]">
                <span>Total</span>
                <span>${pedido.total.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Comentarios internos */}
        <div style={{ background: '#f5f5f5', border: '1px solid #e8e8e8' }}>
          <div className="px-5 py-3 border-b border-[#e8e8e8]" style={{ backgroundColor: '#efefef' }}>
            <p className={labelCls}>Comentarios internos</p>
            <p className="text-xs text-[#aaa] mt-0.5">Solo visibles para el administrador</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            {comentariosLoading && (
              <p className="text-sm text-[#aaa]">Cargando comentarios…</p>
            )}
            {comentariosError && (
              <p className="text-sm text-red-600">{comentariosError}</p>
            )}
            {!comentariosLoading && !comentariosError && comentarios.length === 0 && (
              <p className="text-sm text-[#aaa]">Sin comentarios internos.</p>
            )}
            {!comentariosLoading && !comentariosError && comentarios.length > 0 && (
              <div className="space-y-0">
                {comentarios.map((c, i) => (
                  <div key={c.id}>
                    <div className="py-3">
                      <p className="text-sm text-[#1a1a1a] whitespace-pre-wrap">{c.texto}</p>
                      <p className="text-xs text-[#aaa] mt-1">{formatComentarioFecha(c.fechaCreacion)}</p>
                    </div>
                    {i < comentarios.length - 1 && (
                      <div style={{ borderTop: '1px solid #e0e0e0' }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Formulario */}
            <div className="space-y-2 pt-2">
              <div style={{ position: 'relative' }}>
                <textarea
                  value={nuevoTexto}
                  onChange={e => setNuevoTexto(e.target.value.slice(0, MAX_CHARS))}
                  placeholder="Escribir comentario interno…"
                  rows={3}
                  style={{
                    width: '100%',
                    border: '1px solid #1a1a1a',
                    borderRadius: 0,
                    padding: '8px 10px',
                    fontSize: '13px',
                    resize: 'vertical',
                    outline: 'none',
                    background: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#aaa' }}>
                  {nuevoTexto.length}/{MAX_CHARS}
                </span>
                <button
                  onClick={handleAddComentario}
                  disabled={enviando || nuevoTexto.trim().length === 0}
                  style={{
                    padding: '6px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: '#1a1a1a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 0,
                    cursor: enviando || nuevoTexto.trim().length === 0 ? 'not-allowed' : 'pointer',
                    opacity: enviando || nuevoTexto.trim().length === 0 ? 0.4 : 1,
                  }}
                >
                  {enviando ? 'Enviando…' : 'Agregar comentario'}
                </button>
              </div>
              {envioError && (
                <p className="text-sm text-red-600">{envioError}</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {modal && (
        <ImpresionModal {...modal} onClose={() => setModal(null)} />
      )}
    </AdminLayout>
  )
}
