import { reportesColors } from './colors'
import type { VentasResumen, RangoFechas } from '../../../types'

interface Props {
  ventas: VentasResumen
  periodo: RangoFechas
  comparacion: RangoFechas
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`
}

function VariacionTag({
  valor,
  comparacionLabel,
}: {
  valor: number | null
  comparacionLabel: string
}) {
  if (valor === null) {
    return <span className="text-xs text-[#aaa]">— sin comparación previa</span>
  }
  const positivo = valor >= 0
  const color = positivo ? reportesColors.exito : reportesColors.error
  return (
    <span className="text-sm font-bold font-mono tabular-nums" style={{ color }}>
      {positivo ? '↑' : '↓'} {formatPercent(Math.abs(valor))}
      <span className="text-[#666] font-normal font-sans ml-2">
        vs {comparacionLabel.toLowerCase()}
      </span>
    </span>
  )
}

export default function KpiHero({ ventas, periodo, comparacion }: Props) {
  return (
    <div className="bg-white border border-[#e8e8e8] px-8 py-8">
      <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-4">
        Recaudado · {periodo.label}
      </p>

      <p
        className="font-mono tabular-nums font-black text-[#1a1a1a] mb-3 leading-none"
        style={{ fontSize: '4.5rem' }}
      >
        {formatCurrency(ventas.total)}
      </p>

      <VariacionTag valor={ventas.variacionPorcentual} comparacionLabel={comparacion.label} />

      <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-[#e8e8e8]">
        <div>
          <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-2">
            Pedidos
          </p>
          <p
            className="font-mono tabular-nums font-bold text-[#1a1a1a] mb-1.5 leading-none"
            style={{ fontSize: '2rem' }}
          >
            {ventas.cantidadPedidos}
          </p>
          <VariacionTag valor={ventas.variacionPedidos} comparacionLabel={comparacion.label} />
        </div>

        <div>
          <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-2">
            Ticket promedio
          </p>
          <p
            className="font-mono tabular-nums font-bold text-[#1a1a1a] mb-1.5 leading-none"
            style={{ fontSize: '2rem' }}
          >
            {formatCurrency(ventas.ticketPromedio)}
          </p>
          <VariacionTag valor={ventas.variacionTicket} comparacionLabel={comparacion.label} />
        </div>
      </div>
    </div>
  )
}
