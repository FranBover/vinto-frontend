import { useEffect, useState } from 'react'
import { getCuponMetricas } from '../../api/adminApi'
import type { CuponMetricasDTO } from '../../api/adminApi'

interface Props {
  cuponId: number
  codigo: string
  onClose: () => void
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function pesos(n: number): string {
  return `$${n.toLocaleString('es-AR')}`
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`border px-4 py-3 ${accent ? 'border-[#2d5a27] bg-[#f0f7ef]' : 'border-[#e8e8e8] bg-white'}`}>
      <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1">{label}</p>
      <p className={`font-bold text-xl ${accent ? 'text-[#2d5a27]' : 'text-[#1a1a1a]'}`}>{value}</p>
      {sub && <p className="text-xs text-[#aaa] mt-0.5">{sub}</p>}
    </div>
  )
}

export default function CuponMetricasModal({ cuponId, codigo, onClose }: Props) {
  const [metricas, setMetricas] = useState<CuponMetricasDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCuponMetricas(cuponId)
      .then(setMetricas)
      .catch(() => setError('No se pudieron cargar las métricas.'))
      .finally(() => setLoading(false))
  }, [cuponId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white w-full max-w-lg border border-[#e8e8e8]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
          <div>
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Métricas</p>
            <h2 className="font-bold text-[15px] font-mono tracking-widest mt-0.5">{codigo}</h2>
          </div>
          <button onClick={onClose} className="text-[#aaa] hover:text-[#1a1a1a] text-xl leading-none">×</button>
        </div>

        <div className="px-5 py-5">
          {loading && (
            <p className="text-sm text-[#aaa] text-center py-8">Cargando métricas…</p>
          )}

          {error && (
            <p className="text-sm text-red-600 text-center py-8">{error}</p>
          )}

          {metricas && (
            <div className="space-y-4">
              {/* Usos */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Usos totales" value={metricas.usosTotales} accent />
                <StatCard label="Activos" value={metricas.usosActivos} />
                <StatCard label="Liberados" value={metricas.usosLiberados} sub="pedidos cancelados" />
              </div>

              {/* Montos */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Monto descontado"
                  value={pesos(metricas.montoTotalDescontado)}
                  sub="en pedidos activos"
                  accent
                />
                <StatCard
                  label="Monto liberado"
                  value={pesos(metricas.montoTotalLiberado)}
                  sub="en pedidos cancelados"
                />
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Primer uso" value={formatDate(metricas.primerUso)} />
                <StatCard label="Último uso" value={formatDate(metricas.ultimoUso)} />
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full border border-[#d0d0d0] py-2.5 text-sm font-bold rounded-none hover:bg-[#fafaf9] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
