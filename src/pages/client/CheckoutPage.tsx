import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { useMenuStore } from '../../store/menuStore'
import { crearPedido } from '../../api/publicApi'
import { crearPreferenciaMP } from '../../api/mercadoPagoApi'
import type { FormaPago, FormaEntrega, CrearPedidoDto } from '../../types'
import DireccionAutocomplete from '../../components/DireccionAutocomplete'
import CuponInput, { type CuponAplicado } from '../../components/client/CuponInput'

const SERIF = "'Fraunces', Georgia, serif"

const LABEL_FORMA_PAGO: Record<FormaPago, string> = {
  Efectivo: 'Efectivo',
  Transferencia: 'Transferencia',
  Tarjeta: 'Mercado Pago',
}

const DESC_FORMA_PAGO: Record<FormaPago, string> = {
  Efectivo: 'Pagás en efectivo',
  Transferencia: 'Pagás por transferencia',
  Tarjeta: 'Pagás online con Mercado Pago',
}

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const items = useCartStore(s => s.items)
  const menu = useMenuStore(s => (slug ? s.data[slug] : null))
  const [cuponAplicado, setCuponAplicado] = useState<CuponAplicado | null>(null)

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

  // Si MP se deshabilita y el cliente tenía Tarjeta seleccionada, resetear
  useEffect(() => {
    if (formaPago === 'Tarjeta' && !menu?.local.mercadoPagoHabilitado) {
      setFormaPago('Efectivo')
    }
  }, [menu?.local.mercadoPagoHabilitado, formaPago])

  if (items.length === 0) return null

  const subtotalBase = items.reduce((sum, i) => {
    const extrasTotal = i.extras.reduce((s, e) => s + e.precioAdicional, 0)
    return sum + ((i.producto.precio ?? 0) + extrasTotal) * i.cantidad
  }, 0)

  const subtotalConDescuentos = items.reduce((sum, i) => {
    const extrasTotal = i.extras.reduce((s, e) => s + e.precioAdicional, 0)
    return sum + ((i.producto.precioConDescuento ?? i.producto.precio ?? 0) + extrasTotal) * i.cantidad
  }, 0)

  const descuentoProductos = subtotalBase - subtotalConDescuentos
  const descuentoCupon = cuponAplicado?.montoDescuento ?? 0
  const costoEnvio = formaEntrega === 'Delivery' && menu?.local.costoEnvio != null ? menu.local.costoEnvio : 0
  const totalFinal = subtotalConDescuentos - descuentoCupon + costoEnvio

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
      ...(cuponAplicado && { codigoCupon: cuponAplicado.codigo }),
    }

    try {
      const pedido = await crearPedido(slug!, dto)

      // Si pagó con Mercado Pago, redirigir a la preferencia
      if (formaPago === 'Tarjeta') {
        try {
          const preferencia = await crearPreferenciaMP(
            slug!,
            pedido.pedidoId,
            pedido.codigoSeguimiento,
          )
          // No vaciamos carrito acá — se hace en PagoSuccess/Pending o al tocar WhatsApp en failure
          window.location.href = preferencia.initPoint
          return
        } catch {
          setError(
            'El pedido se creó pero no se pudo iniciar el pago con Mercado Pago. ' +
            'Contactá al local por WhatsApp con el código ' + pedido.codigoSeguimiento + '.'
          )
          setLoading(false)
          return
        }
      }

      // Flujo normal para Efectivo / Transferencia
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

  // Opciones de forma de pago disponibles según el local
  const opcionesFormaPago: FormaPago[] = ['Efectivo', 'Transferencia']
  if (menu?.local.mercadoPagoHabilitado) {
    opcionesFormaPago.push('Tarjeta')
  }

  const inputCls =
    'w-full border border-[#1a1a1a] px-3 py-2.5 text-sm rounded-none outline-none bg-white text-[#1a1a1a] placeholder:text-[#6b6258] transition-shadow focus:ring-2 focus:ring-[#73223a] focus:ring-offset-0'
  const labelCls =
    'block text-xs text-[#6b6258] mb-1.5'
  const eyebrowCls =
    'block text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6258] mb-4'

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#1a1a1a]">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#faf8f4]/95 backdrop-blur-sm border-b border-[#e8e1d4] h-14 flex items-center px-5">
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="text-xl leading-none text-[#1a1a1a] w-8 text-left shrink-0"
        >
          ←
        </button>
        <h1
          className="flex-1 text-center px-2 text-[#1a1a1a]"
          style={{ fontFamily: SERIF, fontSize: '19px', fontWeight: 400, letterSpacing: '0.01em' }}
        >
          Finalizar pedido
        </h1>
        <div className="w-8 shrink-0" />
      </header>

      <form onSubmit={handleSubmit} className="mx-auto w-full px-5 pt-7 pb-36" style={{ maxWidth: '560px' }}>

        {/* ── TUS DATOS ──────────────────────────────────────────── */}
        <p className={eyebrowCls}>Tus datos</p>
        <div className="mb-4">
          <label htmlFor="nombre" className={labelCls}>Nombre completo</label>
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
        <div className="mb-4">
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

        {/* ── ENTREGA ────────────────────────────────────────────── */}
        <p className={`${eyebrowCls} mt-10`}>Entrega</p>
        <div className="flex flex-col gap-2">
          {(['Local', 'Delivery'] as FormaEntrega[]).map(opt => {
            const selected = formaEntrega === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setFormaEntrega(opt)}
                className={`text-left border border-[#1a1a1a] rounded-none px-4 py-3 transition-colors ${
                  selected ? 'bg-[#1a1a1a] text-[#faf8f4]' : 'bg-white text-[#1a1a1a] hover:bg-[#ede5d3]/40'
                }`}
              >
                <p className="text-sm font-medium">
                  {opt === 'Local' ? 'Retiro en local' : 'Delivery'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: selected ? '#d4cbb8' : '#6b6258' }}>
                  {opt === 'Local'
                    ? 'Retirás en el local'
                    : menu?.local.costoEnvio != null
                      ? `Envío $${menu.local.costoEnvio.toLocaleString('es-AR')}`
                      : 'Coordinás el envío'}
                </p>
              </button>
            )
          })}
        </div>

        {/* Delivery fields */}
        {formaEntrega === 'Delivery' && (
          <div className="space-y-4 mt-4">
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
              <div className="border border-[#1a1a1a]">
                {(
                  ['Casa', 'Barrio cerrado', 'Edificio / Condominio', 'Centro comercial / Local comercial', 'Otro'] as const
                ).map((tipo, i) => (
                  <div
                    key={tipo}
                    onClick={() => tipoEdificacion !== tipo && setTipoEdificacion(tipo)}
                    className={`flex items-center justify-between px-3 py-3 text-sm cursor-pointer ${
                      i < 4 ? 'border-b border-[#e8e1d4]' : ''
                    } ${tipoEdificacion === tipo ? 'bg-[#ede5d3]/50' : 'hover:bg-[#ede5d3]/25'}`}
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
                        className="text-sm text-[#6b6258] hover:text-[#1a1a1a] ml-2 flex-shrink-0"
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
                  rows={3}
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
                    rows={3}
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
                    rows={3}
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
                    rows={3}
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
                    rows={3}
                    required
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Retiro: local address */}
        {formaEntrega === 'Local' && menu?.local.direccion && (
          <div className="mt-4 px-4 py-4" style={{ backgroundColor: '#ede5d3' }}>
            <p className="text-[10px] font-medium uppercase text-[#6b6258] mb-1.5" style={{ letterSpacing: '0.2em' }}>
              Dirección del local
            </p>
            <p className="text-sm text-[#1a1a1a]">{menu.local.direccion}</p>
          </div>
        )}

        {/* ── PAGO ───────────────────────────────────────────────── */}
        <p className={`${eyebrowCls} mt-10`}>Pago</p>
        <div className="flex flex-col gap-2">
          {opcionesFormaPago.map(opt => {
            const selected = formaPago === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setFormaPago(opt)}
                className={`text-left border border-[#1a1a1a] rounded-none px-4 py-3 transition-colors ${
                  selected ? 'bg-[#1a1a1a] text-[#faf8f4]' : 'bg-white text-[#1a1a1a] hover:bg-[#ede5d3]/40'
                }`}
              >
                <p className="text-sm font-medium">{LABEL_FORMA_PAGO[opt]}</p>
                <p className="text-xs mt-0.5" style={{ color: selected ? '#d4cbb8' : '#6b6258' }}>
                  {DESC_FORMA_PAGO[opt]}
                </p>
              </button>
            )
          })}
        </div>

        {/* Monto en efectivo */}
        {formaPago === 'Efectivo' && (
          <div className="mt-4">
            <label htmlFor="monto" className={labelCls}>
              ¿Con cuánto pagás?
            </label>
            <input
              id="monto"
              type="number"
              value={montoPago}
              onChange={e => setMontoPago(e.target.value)}
              placeholder={`Mín. $${totalFinal.toLocaleString('es-AR')}`}
              min={totalFinal}
              className={inputCls}
            />
          </div>
        )}

        {/* ── TU PEDIDO ──────────────────────────────────────────── */}
        <p className={`${eyebrowCls} mt-10`}>Tu pedido</p>

        {/* Items */}
        <div className="space-y-2">
          {items.map(item => {
            const extrasTotal = item.extras.reduce((s, e) => s + e.precioAdicional, 0)
            const precioUnitario = (item.producto.precioConDescuento ?? item.producto.precio ?? 0) + extrasTotal
            return (
              <div
                key={`${item.producto.id}-${item.extras.map(e => e.id).join(',')}${item.varianteId != null ? `:${item.varianteId}` : ''}`}
                className="flex justify-between text-sm"
              >
                <span className="text-[#1a1a1a]">
                  {item.cantidad} × {item.producto.nombre}
                  {(item.varianteDescripcion || item.extras.length > 0) && (
                    <span className="text-[#6b6258]">
                      {' '}({[
                        item.varianteDescripcion,
                        item.extras.length > 0 ? item.extras.map(e => e.nombre).join(', ') : null,
                      ].filter(Boolean).join(' · ')})
                    </span>
                  )}
                </span>
                <span className="font-mono tabular-nums shrink-0 ml-3 text-[#1a1a1a]">
                  ${(precioUnitario * item.cantidad).toLocaleString('es-AR')}
                </span>
              </div>
            )
          })}
        </div>

        {/* Coupon input */}
        <div className="mt-5 pt-5 border-t border-[#e8e1d4]">
          <p className={labelCls}>Cupón de descuento</p>
          <CuponInput
            slug={slug!}
            subtotal={subtotalConDescuentos}
            onCuponAplicado={setCuponAplicado}
          />
        </div>

        {/* Totals breakdown */}
        <div className="mt-5 pt-5 border-t border-[#e8e1d4] space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6b6258]">Subtotal</span>
            <span className="font-mono tabular-nums text-[#1a1a1a]">${subtotalBase.toLocaleString('es-AR')}</span>
          </div>
          {descuentoProductos > 0 && (
            <div className="flex justify-between">
              <span className="text-[#6b6258]">Descuentos en productos</span>
              <span className="font-mono tabular-nums" style={{ color: '#2d5a27' }}>
                −${descuentoProductos.toLocaleString('es-AR')}
              </span>
            </div>
          )}
          {cuponAplicado && (
            <div className="flex justify-between">
              <span className="text-[#6b6258]">Cupón {cuponAplicado.codigo}</span>
              <span className="font-mono tabular-nums" style={{ color: '#2d5a27' }}>
                −${cuponAplicado.montoDescuento.toLocaleString('es-AR')}
              </span>
            </div>
          )}
          {formaEntrega === 'Delivery' && menu?.local.costoEnvio != null && (
            <div className="flex justify-between">
              <span className="text-[#6b6258]">Envío</span>
              <span className="font-mono tabular-nums text-[#1a1a1a]">${menu.local.costoEnvio.toLocaleString('es-AR')}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-[#e8e1d4]">
            <span className="text-sm text-[#1a1a1a]">Total</span>
            <span className="text-base font-mono tabular-nums font-medium text-[#1a1a1a]">
              ${totalFinal.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-8 p-3 border" style={{ backgroundColor: '#fef2f2', borderColor: '#a92020' }}>
            <p className="text-sm" style={{ color: '#a92020' }}>{error}</p>
          </div>
        )}

        {/* ── CTA fixed — submit dentro del form ─────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[#e8e1d4]">
          <div className="mx-auto flex items-center justify-between gap-4 px-5 py-3" style={{ maxWidth: '560px' }}>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-medium text-[#6b6258] uppercase mb-1" style={{ letterSpacing: '0.2em' }}>
                Total
              </span>
              <span className="font-mono tabular-nums font-bold text-[17px] text-[#1a1a1a]">
                ${totalFinal.toLocaleString('es-AR')}
              </span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 text-[12px] font-medium uppercase rounded-none text-[#faf8f4] bg-[#73223a] hover:bg-[#651d33] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{ letterSpacing: '0.15em' }}
            >
              {loading ? 'Procesando…' : formaPago === 'Tarjeta' ? 'Ir al pago' : 'Confirmar pedido'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
