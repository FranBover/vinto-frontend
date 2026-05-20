import type { DescuentoPedidoCompleto } from '../../types'

interface Props {
  descuentos: DescuentoPedidoCompleto[]
}

function formatDescuento(d: DescuentoPedidoCompleto): string {
  if (d.tipo === 'porcentaje') return `${d.valor}% OFF en todo el pedido`
  return `$${d.valor.toLocaleString('es-AR')} OFF en todo el pedido`
}

export default function BannerDescuentos({ descuentos }: Props) {
  if (descuentos.length === 0) return null

  return (
    <div className="mx-4 my-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-white shadow-md">
      <div className="flex items-start gap-2">
        <span className="text-xl leading-none mt-0.5" role="img" aria-label="Descuento">🎉</span>
        <div className="flex flex-col gap-0.5">
          {descuentos.map((d, i) => (
            <p key={i} className="text-sm font-bold leading-snug">
              {d.nombre}: {formatDescuento(d)}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
