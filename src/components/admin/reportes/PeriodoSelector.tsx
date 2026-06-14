import type { Periodo } from '../../../types'

interface Props {
  periodo: Periodo
  onChange: (p: Periodo) => void
}

const OPTIONS: { value: Periodo; label: string }[] = [
  { value: 'hoy',    label: 'Hoy' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes',    label: 'Mes' },
  { value: 'anio',   label: 'Año' },
]

export default function PeriodoSelector({ periodo, onChange }: Props) {
  return (
    <div className="inline-flex border border-[#1a1a1a] bg-white">
      {OPTIONS.map(opt => {
        const active = opt.value === periodo
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 text-xs font-bold tracking-widest uppercase transition-colors ${
              active
                ? 'bg-[#1a1a1a] text-white'
                : 'bg-white text-[#1a1a1a] hover:bg-[#fafaf9]'
            }`}
            style={{ minWidth: '76px' }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
