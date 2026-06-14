import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'

interface CartBarProps {
  slug: string
}

export default function CartBar({ slug }: CartBarProps) {
  const navigate = useNavigate()
  const items = useCartStore(s => s.items)
  const total = useCartStore(s => s.total())
  const cantidadTotal = useCartStore(s => s.cantidadTotal())

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[#e8e1d4]">
      <button
        onClick={() => navigate(`/${slug}/carrito`)}
        className="w-full"
      >
        <div className="mx-auto flex items-center justify-between gap-4 px-5 py-3" style={{ maxWidth: '560px' }}>
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#73223a', color: '#faf8f4', fontFamily: "'Fraunces', Georgia, serif", fontSize: '12px', fontWeight: 500 }}
            >
              {cantidadTotal}
            </span>
            <div className="flex flex-col items-start leading-tight min-w-0">
              <span className="text-[11px] text-[#6b6258]" style={{ letterSpacing: '0.05em' }}>
                Tu pedido
              </span>
              <span className="font-mono tabular-nums text-[14px] font-medium text-[#1a1a1a]">
                ${total.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
          <span
            className="shrink-0 px-5 py-2.5 text-[11px] font-medium uppercase text-[#faf8f4] bg-[#73223a] hover:bg-[#651d33] transition-colors"
            style={{ letterSpacing: '0.18em' }}
          >
            Ver pedido
          </span>
        </div>
      </button>
    </div>
  )
}
