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
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#1a1a1a] text-white">
      <button
        onClick={() => navigate(`/${slug}/carrito`)}
        className="w-full flex items-center justify-between px-4 py-4"
      >
        <div>
          <span className="font-bold text-sm">Tu pedido</span>
          <span className="text-white/60 text-sm ml-1.5">
            · {cantidadTotal} producto{cantidadTotal !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm">${total.toLocaleString('es-AR')}</span>
          <span className="bg-white text-[#1a1a1a] px-3 py-1.5 text-xs font-bold">
            Ver →
          </span>
        </div>
      </button>
    </div>
  )
}
