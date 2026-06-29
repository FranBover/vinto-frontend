import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { useMenuStore } from '../../store/menuStore'
import { resolveImageUrl as resolveImageSrc } from '../../config'
import type { Producto } from '../../types'

const SERIF = "'Fraunces', Georgia, serif"

function resolveImageUrl(producto: Producto): string | null {
  if (producto.imagenes && producto.imagenes.length > 0) {
    return resolveImageSrc(producto.imagenes[0].url)
  }
  if (producto.imagenUrl) return producto.imagenUrl
  return null
}

export default function CarritoPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const items = useCartStore(s => s.items)
  const quitarItem = useCartStore(s => s.quitarItem)
  const cambiarCantidad = useCartStore(s => s.cambiarCantidad)
  const total = useCartStore(s => s.total())
  const isOpen = useMenuStore(s => (slug ? s.data[slug]?.local.esActivo : undefined)) ?? true
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())

  // Subtotal sin descuentos (precio original × cantidad, + extras) y ahorro total.
  // Los datos de descuento (precio / precioConDescuento / porcentaje) ya vienen
  // bakeados en item.producto desde ExtrasPage, así que el desglose queda
  // consistente con cartStore.total() (que usa el footer).
  const subtotalSinDescuento = items.reduce((sum, i) => {
    const extrasTotal = i.extras.reduce((s, e) => s + e.precioAdicional, 0)
    return sum + ((i.producto.precio ?? 0) + extrasTotal) * i.cantidad
  }, 0)
  const descuentoProductos = subtotalSinDescuento - total
  const hayDescuentos = descuentoProductos > 0

  const Header = () => (
    <header className="sticky top-0 z-30 bg-[#faf8f4]/95 backdrop-blur-sm border-b border-[#e8e1d4] h-14 flex items-center px-5">
      <button
        onClick={() => navigate(`/${slug}`)}
        aria-label="Volver"
        className="text-xl leading-none text-[#1a1a1a] w-8 text-left shrink-0"
      >
        ←
      </button>
      <h1
        className="flex-1 text-center px-2 text-[#1a1a1a]"
        style={{ fontFamily: SERIF, fontSize: '19px', fontWeight: 400, letterSpacing: '0.01em' }}
      >
        Tu pedido
      </h1>
      <div className="w-8 shrink-0" />
    </header>
  )

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf8f4] text-[#1a1a1a]">
        <Header />
        <div className="flex flex-col items-center justify-center h-72 gap-6 px-8">
          <p
            className="text-[18px] text-[#6b6258] text-center"
            style={{ fontFamily: SERIF, fontStyle: 'italic' }}
          >
            Tu pedido está vacío
          </p>
          <button
            onClick={() => navigate(`/${slug}`)}
            className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#73223a] underline underline-offset-4"
          >
            Ver menú
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#1a1a1a] pb-32">
      <Header />

      {/* ── Centered content wrapper ───────────────────────────── */}
      <div className="mx-auto w-full" style={{ maxWidth: '560px' }}>

        {/* ── Cart items ───────────────────────────────────────── */}
        <ul>
          {items.map(item => {
            const extrasIds = item.extras.map(e => e.id)
            const key = `${item.producto.id}-${[...extrasIds].sort().join(',')}${item.varianteId != null ? `:${item.varianteId}` : ''}`
            const extrasTotal = item.extras.reduce((s, e) => s + e.precioAdicional, 0)
            const precioUnitario = (item.producto.precioConDescuento ?? item.producto.precio ?? 0) + extrasTotal
            const precioUnitarioOriginal = (item.producto.precio ?? 0) + extrasTotal
            const hasDiscount = item.producto.precioConDescuento != null
              && item.producto.precioConDescuento < (item.producto.precio ?? 0)
            const pct = item.producto.porcentajeDescuentoTotal ?? 0
            const imgSrc = resolveImageUrl(item.producto)

            return (
              <li key={key} className="border-t border-[#e8e1d4]">
                <div className="flex items-start gap-4 px-5 py-5">

                  {/* ── Foto ──────────────────────────────── */}
                  <div className="relative w-20 h-20 shrink-0 overflow-hidden bg-[#ede5d3]">
                    {imgSrc && !imgErrors.has(key) ? (
                      <img
                        src={imgSrc}
                        alt={item.producto.nombre}
                        className="w-full h-full object-cover"
                        onError={() => setImgErrors(prev => new Set(prev).add(key))}
                      />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                    {hasDiscount && pct > 0 && (
                      <span
                        className="absolute top-0 right-0 text-white text-[9px] font-medium leading-none px-1.5 py-1"
                        style={{ backgroundColor: '#73223a', letterSpacing: '0.05em' }}
                      >
                        -{pct}%
                      </span>
                    )}
                  </div>

                  {/* ── Nombre + variante + extras ────────── */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="leading-tight text-[#1a1a1a]"
                      style={{ fontFamily: SERIF, fontSize: '17px', fontWeight: 400 }}
                    >
                      {item.producto.nombre}
                    </p>
                    {item.varianteDescripcion && (
                      <p className="text-[12px] text-[#6b6258] mt-1 leading-snug">
                        {item.varianteDescripcion}
                      </p>
                    )}
                    {item.extras.length > 0 && (
                      <p className="text-[11px] text-[#6b6258] mt-1 leading-snug">
                        {item.extras.map(e => `+ ${e.nombre}`).join(', ')}
                      </p>
                    )}
                    <p className="text-[11px] text-[#6b6258] mt-1.5 font-mono tabular-nums">
                      ${precioUnitario.toLocaleString('es-AR')} c/u
                    </p>
                  </div>

                  {/* ── Total + contador + quitar ─────────── */}
                  <div className="flex flex-col items-end gap-2.5 shrink-0">
                    {hasDiscount ? (
                      <div className="flex flex-col items-end leading-none">
                        <span className="text-xs text-[#6b6258] line-through font-mono tabular-nums">
                          ${(precioUnitarioOriginal * item.cantidad).toLocaleString('es-AR')}
                        </span>
                        <span className="font-mono tabular-nums font-medium text-[15px] mt-1" style={{ color: '#73223a' }}>
                          ${(precioUnitario * item.cantidad).toLocaleString('es-AR')}
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono tabular-nums font-medium text-[15px] text-[#1a1a1a] leading-none">
                        ${(precioUnitario * item.cantidad).toLocaleString('es-AR')}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cambiarCantidad(item.producto.id, extrasIds, item.cantidad - 1, item.varianteId)}
                        aria-label="Restar"
                        className="w-7 h-7 border border-[#1a1a1a] bg-white text-[#1a1a1a] font-mono text-base leading-none flex items-center justify-center rounded-none"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-mono tabular-nums text-[14px]">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => cambiarCantidad(item.producto.id, extrasIds, item.cantidad + 1, item.varianteId)}
                        aria-label="Sumar"
                        className="w-7 h-7 border border-[#1a1a1a] bg-white text-[#1a1a1a] font-mono text-base leading-none flex items-center justify-center rounded-none"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => quitarItem(item.producto.id, extrasIds, item.varianteId)}
                      className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#6b6258] hover:text-[#a92020] transition-colors"
                    >
                      Quitar
                    </button>
                  </div>

                </div>
              </li>
            )
          })}
        </ul>

        {/* ── Desglose de totales ────────────────────────────────── */}
        <div className="px-5 py-6 border-t border-[#e8e1d4]">
          {hayDescuentos && (
            <>
              <div className="flex items-baseline justify-between py-1">
                <span className="text-sm text-[#6b6258]">Subtotal</span>
                <span className="text-sm font-mono tabular-nums text-[#1a1a1a]">
                  ${subtotalSinDescuento.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex items-baseline justify-between py-1">
                <span className="text-sm text-[#6b6258]">Descuento productos</span>
                <span className="text-sm font-mono tabular-nums" style={{ color: '#2d5a27' }}>
                  −${descuentoProductos.toLocaleString('es-AR')}
                </span>
              </div>
            </>
          )}
          <div className={`flex items-baseline justify-between ${hayDescuentos ? 'mt-3 pt-3 border-t border-[#e8e1d4]' : ''}`}>
            <span className="text-sm text-[#1a1a1a]">Total</span>
            <span className="text-base font-mono tabular-nums font-medium text-[#1a1a1a]">
              ${total.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

      </div>

      {/* ── CTA fixed ──────────────────────────────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[#e8e1d4]">
        {!isOpen && (
          <p className="text-center text-[10px] font-medium uppercase pt-2.5" style={{ color: '#a92020', letterSpacing: '0.2em' }}>
            El local está cerrado temporalmente
          </p>
        )}
        <div className="mx-auto flex items-center justify-between gap-4 px-5 py-3" style={{ maxWidth: '560px' }}>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-medium text-[#6b6258] uppercase mb-1" style={{ letterSpacing: '0.2em' }}>
              Total
            </span>
            <span className="font-mono tabular-nums font-bold text-[17px] text-[#1a1a1a]">
              ${total.toLocaleString('es-AR')}
            </span>
          </div>
          <button
            onClick={() => navigate(`/${slug}/checkout`)}
            disabled={!isOpen}
            className="px-6 py-3 text-[12px] font-medium uppercase rounded-none text-[#faf8f4] bg-[#73223a] hover:bg-[#651d33] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            style={{ letterSpacing: '0.15em' }}
          >
            Continuar
          </button>
        </div>
      </footer>
    </div>
  )
}
