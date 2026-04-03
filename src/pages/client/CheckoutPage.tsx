import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { useMenuStore } from '../../store/menuStore'
import { crearPedido } from '../../api/publicApi'
import type { FormaPago, FormaEntrega, CrearPedidoDto } from '../../types'

const LABEL_FORMA_PAGO: Record<FormaPago, string> = {
  Efectivo: 'Efectivo',
  Transferencia: 'Transferencia',
  Tarjeta: 'Mercado Pago',
}

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const items = useCartStore(s => s.items)
  const total = useCartStore(s => s.total())
  const menu = useMenuStore(s => (slug ? s.data[slug] : null))

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [formaEntrega, setFormaEntrega] = useState<FormaEntrega>('Local')
  const [formaPago, setFormaPago] = useState<FormaPago>('Efectivo')
  const [direccion, setDireccion] = useState('')
  const [referencia, setReferencia] = useState('')
  const [montoPago, setMontoPago] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if cart is empty
  if (items.length === 0) {
    navigate(`/${slug}`)
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!menu) return
    setLoading(true)
    setError(null)

    const dto: CrearPedidoDto = {
      administradorId: menu.local.id,
      nombreCliente: nombre.trim(),
      telefonoCliente: telefono.trim(),
      formaPago,
      formaEntrega,
      detalles: items.map(item => ({
        productoId: item.producto.id,
        cantidad: item.cantidad,
        precioUnitario:
          item.producto.precio +
          item.extras.reduce((s, e) => s + e.precioAdicional, 0),
        extrasIds: item.extras.map(e => e.id),
      })),
      ...(formaEntrega === 'Delivery' && {
        direccionCliente: direccion.trim(),
        ...(referencia.trim() && { referenciaDireccion: referencia.trim() }),
      }),
      ...(formaPago === 'Efectivo' && montoPago && {
        montoPagoEfectivo: parseFloat(montoPago),
      }),
    }

    try {
      const pedido = await crearPedido(dto)
      navigate(`/${slug}/confirmacion`, { state: { pedido, local: menu.local } })
    } catch {
      setError('No se pudo enviar el pedido. Revisá tu conexión e intentá de nuevo.')
      setLoading(false)
    }
  }

  const inputCls =
    'w-full border border-[#d0d0d0] px-3 py-3 text-sm rounded-none outline-none focus:border-[#1a1a1a] bg-white transition-colors'
  const labelCls =
    'block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5'

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#1a1a1a] h-14 flex items-center gap-4 px-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="font-bold text-base leading-none"
        >
          ←
        </button>
        <h1 className="font-bold text-[15px]">Datos del pedido</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6 pb-28">

        {/* Nombre */}
        <div>
          <label htmlFor="nombre" className={labelCls}>Tu nombre</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
            autoComplete="name"
            placeholder="Ej: María García"
            className={inputCls}
          />
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="telefono" className={labelCls}>Teléfono</label>
          <input
            id="telefono"
            type="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            required
            autoComplete="tel"
            placeholder="Ej: 11 1234-5678"
            className={inputCls}
          />
        </div>

        {/* Forma de entrega */}
        <div>
          <p className={labelCls}>Forma de entrega</p>
          <div className="flex border border-[#1a1a1a]">
            {(['Local', 'Delivery'] as FormaEntrega[]).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setFormaEntrega(opt)}
                className={`flex-1 py-3 text-sm font-bold rounded-none transition-colors ${
                  formaEntrega === opt
                    ? 'bg-[#1a1a1a] text-white'
                    : 'bg-white text-[#1a1a1a] hover:bg-[#f5f5f5]'
                }`}
              >
                {opt === 'Local' ? 'Retiro en local' : 'Delivery'}
              </button>
            ))}
          </div>
        </div>

        {/* Delivery fields */}
        {formaEntrega === 'Delivery' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="direccion" className={labelCls}>Dirección</label>
              <input
                id="direccion"
                type="text"
                value={direccion}
                onChange={e => setDireccion(e.target.value)}
                required
                placeholder="Calle, número, piso / depto"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="referencia" className={labelCls}>
                Referencia (opcional)
              </label>
              <input
                id="referencia"
                type="text"
                value={referencia}
                onChange={e => setReferencia(e.target.value)}
                placeholder="Ej: portón negro, timbre 2"
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* Retiro: local address */}
        {formaEntrega === 'Local' && menu?.local.direccion && (
          <div className="bg-[#f5f5f5] px-4 py-4">
            <p className={labelCls}>Dirección del local</p>
            <p className="text-sm font-bold">{menu.local.direccion}</p>
          </div>
        )}

        {/* Forma de pago */}
        <div>
          <p className={labelCls}>Forma de pago</p>
          <div className="flex border border-[#1a1a1a]">
            {(['Efectivo', 'Transferencia', 'Tarjeta'] as FormaPago[]).map(
              (opt, idx) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFormaPago(opt)}
                  className={`flex-1 py-3 text-xs font-bold rounded-none transition-colors ${
                    formaPago === opt
                      ? 'bg-[#1a1a1a] text-white'
                      : 'bg-white text-[#1a1a1a] hover:bg-[#f5f5f5]'
                  } ${idx < 2 ? 'border-r border-[#1a1a1a]' : ''}`}
                >
                  {LABEL_FORMA_PAGO[opt]}
                </button>
              )
            )}
          </div>
        </div>

        {/* Monto en efectivo */}
        {formaPago === 'Efectivo' && (
          <div>
            <label htmlFor="monto" className={labelCls}>
              ¿Con cuánto pagás? (opcional)
            </label>
            <input
              id="monto"
              type="number"
              value={montoPago}
              onChange={e => setMontoPago(e.target.value)}
              placeholder={`Mín. $${total.toLocaleString('es-AR')}`}
              min={total}
              className={inputCls}
            />
          </div>
        )}

        {/* Order summary */}
        <div className="border border-[#e8e8e8]">
          <div className="px-4 py-3 border-b border-[#e8e8e8]">
            <p className={labelCls}>Resumen del pedido</p>
          </div>
          <div className="px-4 py-3 space-y-2">
            {items.map(item => {
              const extrasTotal = item.extras.reduce(
                (s, e) => s + e.precioAdicional,
                0
              )
              const precioUnitario = item.producto.precio + extrasTotal
              return (
                <div
                  key={`${item.producto.id}-${item.extras.map(e => e.id).join(',')}`}
                  className="flex justify-between text-sm"
                >
                  <span className="text-[#666]">
                    {item.cantidad}× {item.producto.nombre}
                    {item.extras.length > 0 && (
                      <span className="text-[#aaa]">
                        {' '}(+ {item.extras.map(e => e.nombre).join(', ')})
                      </span>
                    )}
                  </span>
                  <span className="font-bold shrink-0 ml-3">
                    ${(precioUnitario * item.cantidad).toLocaleString('es-AR')}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="px-4 py-3 border-t border-[#e8e8e8] flex justify-between font-bold">
            <span>Total</span>
            <span>${total.toLocaleString('es-AR')}</span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}

        {/* ── Submit — fixed, inside form ───────────────────────── */}
        <button
          type="submit"
          disabled={loading}
          className="fixed bottom-0 left-0 right-0 z-20 bg-[#1a1a1a] text-white py-4 font-bold text-sm rounded-none disabled:opacity-50 flex items-center justify-between px-4"
        >
          <span>{loading ? 'Enviando pedido…' : 'Confirmar pedido'}</span>
          {!loading && <span>→</span>}
        </button>
      </form>
    </div>
  )
}
