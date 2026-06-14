import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { reportesColors } from './colors'
import type { PuntoSerie } from '../../../types'

interface Props {
  data: PuntoSerie[]
}

interface TooltipPayload {
  payload: PuntoSerie
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="bg-white border border-[#1a1a1a] px-3 py-2 text-xs">
      <p className="font-bold mb-1">{label}</p>
      <p className="font-mono tabular-nums">${point.total.toLocaleString('es-AR')}</p>
      <p className="text-[#666] text-[11px]">
        {point.cantidad} pedido{point.cantidad !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

function formatYAxis(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`
  return `$${n}`
}

export default function SerieVentasChart({ data }: Props) {
  const totalGeneral = data.reduce((s, d) => s + d.total, 0)

  return (
    <div className="bg-white border border-[#e8e8e8] px-6 py-5">
      <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-5">
        Recaudado por período
      </p>
      {totalGeneral === 0 ? (
        <p className="text-sm text-[#aaa] py-12 text-center">Sin ventas en este período.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
            <CartesianGrid stroke={reportesColors.gridLine} vertical={false} />
            <XAxis
              dataKey="etiqueta"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: reportesColors.textoAxis }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: reportesColors.textoAxis }}
              tickFormatter={formatYAxis}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#00000005' }} />
            <Bar dataKey="total" fill={reportesColors.primario} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
