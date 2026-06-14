interface RankingItem {
  nombre: string
  valorPrincipal: number
  valorPrincipalFormat: 'currency' | 'count'
  valorSecundario: string
}

interface Props {
  titulo: string
  items: RankingItem[]
  colorBar: string
  vacioMensaje?: string
}

function formatValue(n: number, fmt: 'currency' | 'count'): string {
  if (fmt === 'currency') return `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
  return n.toLocaleString('es-AR')
}

export default function RankingTabla({
  titulo,
  items,
  colorBar,
  vacioMensaje = 'Sin datos en este período.',
}: Props) {
  const max = items.length > 0 ? Math.max(...items.map(i => i.valorPrincipal)) : 1

  return (
    <div className="bg-white border border-[#e8e8e8] px-6 py-5">
      <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-4">
        {titulo}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-[#aaa] py-6 text-center">{vacioMensaje}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const pct = max > 0 ? (item.valorPrincipal / max) * 100 : 0
            return (
              <div key={i} className="relative">
                <div
                  className="absolute inset-y-0 left-0 transition-all"
                  style={{ width: `${pct}%`, backgroundColor: colorBar, opacity: 0.14 }}
                />
                <div className="relative flex items-center justify-between gap-3 py-2 px-2">
                  <p className="text-sm text-[#1a1a1a] truncate flex-1">{item.nombre}</p>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-[#aaa]">{item.valorSecundario}</span>
                    <span
                      className="font-mono tabular-nums font-bold text-sm text-[#1a1a1a]"
                      style={{ minWidth: '90px', textAlign: 'right' }}
                    >
                      {formatValue(item.valorPrincipal, item.valorPrincipalFormat)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
