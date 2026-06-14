import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { reportesColors } from './colors'
import type { DiaPico } from '../../../types'

interface Props {
  data: DiaPico[]
}

const NOMBRES_DIA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const NOMBRES_COMPLETOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const ORDEN_LUNES_PRIMERO = [1, 2, 3, 4, 5, 6, 0]

interface TooltipPayload {
  payload: DiaPico
}

function DiaTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="bg-white border border-[#1a1a1a] px-3 py-2 text-xs">
      <p className="font-bold">{NOMBRES_COMPLETOS[point.diaSemana]}</p>
      <p className="text-[#666]">
        {point.cantidad} pedido{point.cantidad !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export default function DiasPicoChart({ data }: Props) {
  const reordenado = ORDEN_LUNES_PRIMERO.map(
    d => data.find(x => x.diaSemana === d) ?? { diaSemana: d, cantidad: 0 }
  )
  const max = Math.max(...reordenado.map(d => d.cantidad), 1)
  const totalPedidos = reordenado.reduce((s, d) => s + d.cantidad, 0)

  return (
    <div className="bg-white border border-[#e8e8e8] px-6 py-5">
      <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-4">
        Días pico
      </p>
      {totalPedidos === 0 ? (
        <p className="text-sm text-[#aaa] py-12 text-center">Sin pedidos en este período.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={reordenado} margin={{ top: 8, right: 4, left: -16, bottom: 4 }}>
            <CartesianGrid stroke={reportesColors.gridLine} vertical={false} />
            <XAxis
              dataKey="diaSemana"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: reportesColors.textoAxis }}
              tickFormatter={(d: number) => NOMBRES_DIA[d]}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: reportesColors.textoAxis }}
              allowDecimals={false}
            />
            <Tooltip content={<DiaTooltip />} cursor={{ fill: '#00000005' }} />
            <Bar dataKey="cantidad" maxBarSize={40}>
              {reordenado.map((entry, i) => (
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
