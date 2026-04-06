import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getPedidoById, updateEstadoPedido } from '../../api/adminApi'
import type { Pedido, EstadoPedido } from '../../types'

const ESTADOS: EstadoPedido[] = ['Pendiente', 'EnPreparacion', 'Listo', 'Entregado', 'Cancelado']

const ESTADO_LABELS: Record<EstadoPedido, string> = {
  Pendiente:     'Pendiente',
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

  useEffect(() => {
    if (!id) return
    getPedidoById(Number(id))
      .then(p => {
        setPedido(p)
        setEstado(p.estado)
      })
      .catch(() => setError('No se pudo cargar el pedido.'))
      .finally(() => setLoading(false))
  }, [id])

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

  const backBtn = (
    <button
      onClick={() => navigate('/admin/pedidos')}
      className="text-sm text-[#aaa] hover:text-[#1a1a1a] transition-colors"
    >
      ← Volver
    </button>
  )

  if (loading) {
    return (
      <AdminLayout title="Pedido" actions={backBtn}>
        <p className="text-sm text-[#aaa] py-8 text-center">Cargando…</p>
      </AdminLayout>
    )
  }

  if (error || !pedido) {
    return (
      <AdminLayout title="Pedido" actions={backBtn}>
        <p className="text-sm text-red-600 py-8 text-center">{error ?? 'Error desconocido.'}</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={`Pedido #${pedido.id}`} actions={backBtn}>
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
                  {(d.productosExtra ?? []).length > 0 && (
                    <p className="text-xs text-[#aaa] mt-0.5">
                      + {(d.productosExtra ?? []).map(e => e.nombre).join(', ')}
                    </p>
                  )}
                </div>
                <span className="font-bold ml-4 shrink-0">
                  ${(d.precioUnitario * d.cantidad).toLocaleString('es-AR')}
                </span>
              </div>
            ))}
            <div className="pt-3 border-t border-[#e8e8e8] flex justify-between font-bold">
              <span>Total</span>
              <span>${pedido.total.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </Section>

      </div>
    </AdminLayout>
  )
}
