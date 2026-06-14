import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { reportesColors } from './colors'
import type { HoraPico } from '../../../types'

interface Props {
  data: HoraPico[]
}

interface TooltipPayload {
  payload: HoraPico
}

function HoraTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="bg-white border border-[#1a1a1a] px-3 py-2 text-xs">
      <p className="font-bold">
        {String(point.hora).padStart(2, '0')}:00 — {String(point.hora).padStart(2, '0')}:59
      </p>
      <p className="text-[#666]">
        {point.cantidad} pedido{point.cantidad !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export default function HorasPicoChart({ data }: Props) {
  const max = Math.max(...data.map(d => d.cantidad), 1)
  const totalPedidos = data.reduce((s, d) => s + d.cantidad, 0)

  return (
    <div className="bg-white border border-[#e8e8e8] px-6 py-5">
      <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-4">
        Horas pico
      </p>
      {totalPedidos === 0 ? (
        <p className="text-sm text-[#aaa] py-12 text-center">Sin pedidos en este período.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 4 }}>
            <CartesianGrid stroke={reportesColors.gridLine} vertical={false} />
            <XAxis
              dataKey="hora"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: reportesColors.textoAxis }}
              ticks={[0, 6, 12, 18, 23]}
              tickFormatter={(h: number) => `${h}h`}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: reportesColors.textoAxis }}
              allowDecimals={false}
            />
            <Tooltip content={<HoraTooltip />} cursor={{ fill: '#00000005' }} />
            <Bar dataKey="cantidad" maxBarSize={20}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.cantidad === max && max > 0 ? reportesColors.acentoVino : reportesColors.primario}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
