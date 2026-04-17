import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { useMenuStore } from '../../store/menuStore'
import { crearPedido } from '../../api/publicApi'
import type { FormaPago, FormaEntrega, CrearPedidoDto } from '../../types'
import DireccionAutocomplete from '../../components/DireccionAutocomplete'

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
  const [lat, setLat] = useState(0)
  const [lon, setLon] = useState(0)
  const [referencia, setReferencia] = useState('')
  const [tipoEdificacion, setTipoEdificacion] = useState<
    'Casa' | 'Barrio cerrado' | 'Edificio / Condominio' | 'Centro comercial / Local comercial' | 'Otro' | ''
  >('')
  const [nombreBarrio, setNombreBarrio] = useState('')
  const [manzanaLote, setManzanaLote] = useState('')
  const [nombreEdificio, setNombreEdificio] = useState('')
  const [pisoDpto, setPisoDpto] = useState('')
  const [nombreComercio, setNombreComercio] = useState('')
  const [nombreLugar, setNombreLugar] = useState('')
  const [montoPago, setMontoPago] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) navigate(`/${slug}`)
  }, [items.length, navigate, slug])

  if (items.length === 0) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!menu) return

    if (formaPago === 'Efectivo' && !montoPago) {
      setError('Ingresá con cuánto vas a pagar')
      return
    }

    setLoading(true)
    setError(null)

    // Build referenciaDireccion from edificación type + fields
    let referenciaDireccion = ''
    if (tipoEdificacion === 'Casa') {
      referenciaDireccion = referencia.trim()
    } else if (tipoEdificacion === 'Barrio cerrado') {
      const parts = [`Barrio cerrado: ${nombreBarrio.trim()}`]
      if (manzanaLote.trim()) parts.push(manzanaLote.trim())
      if (referencia.trim()) parts.push(referencia.trim())
      referenciaDireccion = parts.join(', ')
    } else if (tipoEdificacion === 'Edificio / Condominio') {
      const parts = [`Edificio / Condominio: ${nombreEdificio.trim()}`]
      if (pisoDpto.trim()) parts.push(pisoDpto.trim())
      if (referencia.trim()) parts.push(referencia.trim())
      referenciaDireccion = parts.join(', ')
    } else if (tipoEdificacion === 'Centro comercial / Local comercial') {
      const parts = [`Centro comercial / Local comercial: ${nombreComercio.trim()}`]
      if (referencia.trim()) parts.push(referencia.trim())
      referenciaDireccion = parts.join(', ')
    } else if (tipoEdificacion === 'Otro') {
      const parts = [nombreLugar.trim()]
      if (referencia.trim()) parts.push(referencia.trim())
      referenciaDireccion = parts.filter(Boolean).join(', ')
    }

    const dto: CrearPedidoDto = {
      administradorId: menu.local.id,
      nombreCliente: nombre.trim(),
      telefonoCliente: telefono.trim(),
      formaPago,
      formaEntrega,
      detalles: items.map(item => ({
        productoId: item.producto.id,
        cantidad: item.cantidad,
        extrasSeleccionados: item.extras.map(e => e.id),
        varianteProductoId: item.varianteId ?? null,
      })),
      ...(formaEntrega === 'Delivery' && {
        direccionCliente: direccion.trim(),
        ...(referenciaDireccion && { referenciaDireccion }),
        ubicacionUrl:
          lat && lon
            ? `https://www.google.com/maps?q=${lat},${lon}`
            : `https://www.google.com/maps/search/?q=${encodeURIComponent(direccion.trim())}`,
      }),
      ...(formaPago === 'Efectivo' && montoPago && {
        montoPagoEfectivo: parseFloat(montoPago),
      }),
    }

    try {
      const pedido = await crearPedido(slug!, dto)
      navigate(`/${slug}/confirmacion`, {
        state: {
          pedido,
          local: menu.local,
          items,
          nombreCliente: nombre.trim(),
          telefono: telefono.trim(),
          formaPago,
          formaEntrega,
          direccionCliente: formaEntrega === 'Delivery' ? direccion.trim() : undefined,
          referencia: formaEntrega === 'Delivery' && referenciaDireccion ? referenciaDireccion : undefined,
          ubicacionUrl: formaEntrega === 'Delivery' && lat && lon
            ? `https://www.google.com/maps?q=${lat},${lon}`
            : undefined,
          montoPagoEfectivo: formaPago === 'Efectivo' && montoPago ? parseFloat(montoPago) : undefined,
        },
      })
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
              <label className={labelCls}>Dirección</label>
              <DireccionAutocomplete
                value={direccion}
                onChange={(d, la, lo) => { setDireccion(d); setLat(la); setLon(lo) }}
                inputClassName={inputCls}
                zonaEnvio={menu?.local.zonaEnvio}
                ciudadReferencia={menu?.local.direccion}
              />
            </div>

            {/* Tipo de edificación */}
            <div>
              <p className={labelCls}>Tipo de edificación</p>
              <div className="border border-[#d0d0d0]">
                {(
                  ['Casa', 'Barrio cerrado', 'Edificio / Condominio', 'Centro comercial / Local comercial', 'Otro'] as const
                ).map((tipo, i) => (
                  <div
                    key={tipo}
                    onClick={() => tipoEdificacion !== tipo && setTipoEdificacion(tipo)}
                    className={`flex items-center justify-between px-3 py-3 text-sm cursor-pointer ${
                      i < 4 ? 'border-b border-[#e8e8e8]' : ''
                    } ${tipoEdificacion === tipo ? 'bg-[#f5f5f5]' : 'hover:bg-[#fafafa]'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex-shrink-0 w-4 h-4 border border-[#1a1a1a] flex items-center justify-center">
                        {tipoEdificacion === tipo && (
                          <span className="w-2 h-2 bg-[#1a1a1a] block" />
                        )}
                      </span>
                      <span>{tipo}</span>
                    </span>
                    {tipoEdificacion === tipo && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setTipoEdificacion('') }}
                        className="text-sm text-[#aaa] hover:text-[#1a1a1a] ml-2 flex-shrink-0"
                        aria-label="Cambiar tipo de edificación"
                      >
                        ✏
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Conditional fields per edificación type */}
            {tipoEdificacion === 'Casa' && (
              <div>
                <label className={labelCls}>Referencias</label>
                <textarea
                  value={referencia}
                  onChange={e => setReferencia(e.target.value)}
                  placeholder="Ej: portón negro, timbre 2"
                  className={`${inputCls} resize-none`}
                  rows={2}
                />
              </div>
            )}

            {tipoEdificacion === 'Barrio cerrado' && (
              <>
                <div>
                  <label className={labelCls}>Nombre del barrio</label>
                  <input
                    type="text"
                    value={nombreBarrio}
                    onChange={e => setNombreBarrio(e.target.value)}
                    placeholder="Ej: Privadas del Sol"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Manzana / lote / número de casa</label>
                  <input
                    type="text"
                    value={manzanaLote}
                    onChange={e => setManzanaLote(e.target.value)}
                    placeholder="Ej: Manzana 5 Lote 8"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Referencias</label>
                  <textarea
                    value={referencia}
                    onChange={e => setReferencia(e.target.value)}
                    placeholder="Ej: frente al parque"
                    className={`${inputCls} resize-none`}
                    rows={2}
                  />
                </div>
              </>
            )}

            {tipoEdificacion === 'Edificio / Condominio' && (
              <>
                <div>
                  <label className={labelCls}>Nombre del edificio / condominio</label>
                  <input
                    type="text"
                    value={nombreEdificio}
                    onChange={e => setNombreEdificio(e.target.value)}
                    placeholder="Ej: Edificio Palmeras"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Torre / Piso / Departamento</label>
                  <input
                    type="text"
                    value={pisoDpto}
                    onChange={e => setPisoDpto(e.target.value)}
                    placeholder="Ej: Torre A, Piso 3, Dpto 12"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Referencias</label>
                  <textarea
                    value={referencia}
                    onChange={e => setReferencia(e.target.value)}
                    placeholder="Ej: portón azul"
                    className={`${inputCls} resize-none`}
                    rows={2}
                  />
                </div>
              </>
            )}

            {tipoEdificacion === 'Centro comercial / Local comercial' && (
              <>
                <div>
                  <label className={labelCls}>Nombre del comercio / número del local</label>
                  <input
                    type="text"
                    value={nombreComercio}
                    onChange={e => setNombreComercio(e.target.value)}
                    placeholder="Ej: Local 42 — Patio Olmos"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Referencias</label>
                  <textarea
                    value={referencia}
                    onChange={e => setReferencia(e.target.value)}
                    placeholder="Ej: planta baja, frente a la escalera"
                    className={`${inputCls} resize-none`}
                    rows={2}
                  />
                </div>
              </>
            )}

            {tipoEdificacion === 'Otro' && (
              <>
                <div>
                  <label className={labelCls}>Nombre del lugar</label>
                  <input
                    type="text"
                    value={nombreLugar}
                    onChange={e => setNombreLugar(e.target.value)}
                    placeholder="Ej: Club Náutico"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Referencias</label>
                  <textarea
                    value={referencia}
                    onChange={e => setReferencia(e.target.value)}
                    placeholder="Ej: entrada principal"
                    className={`${inputCls} resize-none`}
                    rows={2}
                    required
                  />
                </div>
              </>
            )}
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
              ¿Con cuánto pagás?
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
              const precioUnitario = (item.producto.precio ?? 0) + extrasTotal
              return (
                <div
                  key={`${item.producto.id}-${item.extras.map(e => e.id).join(',')}${item.varianteId != null ? `:${item.varianteId}` : ''}`}
                  className="flex justify-between text-sm"
                >
                  <span className="text-[#666]">
                    {item.cantidad}× {item.producto.nombre}
                    {(item.varianteDescripcion || item.extras.length > 0) && (
                      <span className="text-[#aaa]">
                        {' '}({[
                          item.varianteDescripcion,
                          item.extras.length > 0 ? item.extras.map(e => e.nombre).join(', ') : null,
                        ].filter(Boolean).join(' · ')})
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
          {formaEntrega === 'Delivery' && menu?.local.costoEnvio != null && (
            <div className="px-4 py-2 border-t border-[#e8e8e8] flex justify-between text-sm text-[#666]">
              <span>Costo de envío</span>
              <span>${menu.local.costoEnvio.toLocaleString('es-AR')}</span>
            </div>
          )}
          <div className="px-4 py-3 border-t border-[#e8e8e8] flex justify-between font-bold">
            <span>Total</span>
            <span>
              ${(
                formaEntrega === 'Delivery' && menu?.local.costoEnvio != null
                  ? total + menu.local.costoEnvio
                  : total
              ).toLocaleString('es-AR')}
            </span>
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
