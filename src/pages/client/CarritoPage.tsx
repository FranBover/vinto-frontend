import { useParams, useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { useMenuStore } from '../../store/menuStore'

export default function CarritoPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const items = useCartStore(s => s.items)
  const quitarItem = useCartStore(s => s.quitarItem)
  const cambiarCantidad = useCartStore(s => s.cambiarCantidad)
  const total = useCartStore(s => s.total())
  const isOpen = useMenuStore(s => (slug ? s.data[slug]?.local.esActivo : undefined)) ?? true

  const Header = () => (
    <header className="sticky top-0 z-30 bg-white border-b border-[#1a1a1a] h-14 flex items-center gap-4 px-4">
      <button
        onClick={() => navigate(`/${slug}`)}
        aria-label="Volver"
        className="font-bold text-base leading-none"
      >
        ←
      </button>
      <h1 className="font-bold text-[15px]">Tu pedido</h1>
    </header>
  )

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white text-[#1a1a1a] font-sans">
        <Header />
        <div className="flex flex-col items-center justify-center h-64 gap-4 px-8">
          <p className="text-sm text-[#999]">Tu pedido está vacío.</p>
          <button
            onClick={() => navigate(`/${slug}`)}
            className="text-sm font-bold underline"
          >
            Volver al menú
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans pb-32">
      <Header />

      {/* ── Cart items ─────────────────────────────────────────── */}
      <ul>
        {items.map(item => {
          const extrasIds = item.extras.map(e => e.id)
          const key = `${item.producto.id}-${[...extrasIds].sort().join(',')}${item.varianteId != null ? `:${item.varianteId}` : ''}`
          const extrasTotal = item.extras.reduce((s, e) => s + e.precioAdicional, 0)
          const precioUnitario = (item.producto.precioConDescuento ?? item.producto.precio ?? 0) + extrasTotal

          return (
            <li key={key} className="border-b border-[#e8e8e8] px-4 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[15px] leading-tight">
                    {item.producto.nombre}
                  </p>
                  {(item.varianteDescripcion || item.extras.length > 0) && (
                    <p className="text-xs text-[#888] mt-0.5">
                      {[
                        item.varianteDescripcion,
                        item.extras.length > 0 ? item.extras.map(e => e.nombre).join(', ') : null,
                      ].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-xs text-[#999] mt-1">
                    ${precioUnitario.toLocaleString('es-AR')} c/u
                  </p>
                </div>
                <button
                  onClick={() => quitarItem(item.producto.id, extrasIds, item.varianteId)}
                  aria-label="Eliminar"
                  className="text-[#ccc] text-sm hover:text-[#1a1a1a] transition-colors shrink-0 mt-0.5"
                >
                  ✕
                </button>
              </div>

              {/* Quantity + subtotal */}
              <div className="flex items-center mt-4 gap-0">
                <button
                  onClick={() => cambiarCantidad(item.producto.id, extrasIds, item.cantidad - 1, item.varianteId)}
                  className="w-8 h-8 bg-[#f0f0f0] font-bold text-base flex items-center justify-center rounded-none"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-bold tabular-nums">
                  {item.cantidad}
                </span>
                <button
                  onClick={() => cambiarCantidad(item.producto.id, extrasIds, item.cantidad + 1, item.varianteId)}
                  className="w-8 h-8 bg-[#f0f0f0] font-bold text-base flex items-center justify-center rounded-none"
                >
                  +
                </button>
                <span className="ml-auto font-bold text-sm">
                  ${(precioUnitario * item.cantidad).toLocaleString('es-AR')}
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      {/* ── Total ──────────────────────────────────────────────── */}
      <div className="px-4 py-5 flex items-center justify-between border-b border-[#1a1a1a]">
        <p className="font-bold text-base">Total</p>
        <p className="font-bold text-xl">${total.toLocaleString('es-AR')}</p>
      </div>

      {/* ── Bottom buttons ─────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[#e8e8e8]">
        {!isOpen && (
          <p className="text-center text-[11px] font-bold text-[#999] uppercase tracking-widest py-2">
            El local está cerrado temporalmente
          </p>
        )}
        <button
          onClick={() => navigate(`/${slug}/checkout`)}
          disabled={!isOpen}
          className="w-full bg-[#1a1a1a] text-white py-4 font-bold text-sm rounded-none flex items-center justify-between px-4 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span>Confirmar pedido</span>
          <span>→</span>
        </button>
        <button
          onClick={() => navigate(`/${slug}`)}
          className="w-full bg-white text-[#1a1a1a] py-3.5 font-bold text-sm rounded-none"
        >
          ← Seguir eligiendo
        </button>
      </div>
    </div>
  )
}
