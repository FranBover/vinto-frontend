import { reportesColors } from './colors'
import type { MetodoPago } from '../../../types'

interface Props {
  data: MetodoPago[]
}

const COLOR_BY_METODO: Record<string, string> = {
  Efectivo:       reportesColors.acentoVerde,
  Transferencia:  reportesColors.primario,
  MercadoPago:    reportesColors.neutro,
  Tarjeta:        reportesColors.terciario,
}

function colorFor(formaPago: string): string {
  return COLOR_BY_METODO[formaPago] ?? reportesColors.secundario
}

export default function MetodosPagoBarras({ data }: Props) {
  return (
    <div className="bg-white border border-[#e8e8e8] px-6 py-5">
      <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-4">
        Métodos de pago
      </p>
      {data.length === 0 ? (
        <p className="text-sm text-[#aaa] py-6 text-center">Sin pagos registrados.</p>
      ) : (
        <div className="space-y-3">
          {data.map((m, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-[#1a1a1a]">{m.formaPago}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#aaa] font-mono tabular-nums">
                    {m.cantidad} ped.
                  </span>
                  <span
                    className="font-mono tabular-nums font-bold text-sm text-[#1a1a1a]"
                    style={{ minWidth: '52px', textAlign: 'right' }}
                  >
                    {m.porcentaje.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-[#fafaf9] overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${m.porcentaje}%`,
                    backgroundColor: colorFor(m.formaPago),
                    minWidth: m.porcentaje > 0 ? '4px' : '0',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
