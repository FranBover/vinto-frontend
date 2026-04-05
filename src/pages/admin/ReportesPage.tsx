import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getPedidos } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import type { Pedido } from '../../types'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function calcularMetrics(pedidos: Pedido[]) {
  const hoy = startOfDay(new Date())
  const haceSiete = hoy - 6 * 86400000 // 7 days including today

  const pedidosHoy = pedidos.filter(p => startOfDay(new Date(p.fecha)) === hoy)
  const pedidosSemana = pedidos.filter(p => startOfDay(new Date(p.fecha)) >= haceSiete)

  const recaudadoHoy = pedidosHoy.reduce((s, p) => s + p.total, 0)
  const recaudadoSemana = pedidosSemana.reduce((s, p) => s + p.total, 0)

  // Build last-7-days chart: { label, total }
  const ventasPorDia = Array.from({ length: 7 }, (_, i) => {
    const dayTs = haceSiete + i * 86400000
    const label = DIAS[new Date(dayTs).getDay()]
    const total = pedidos
      .filter(p => startOfDay(new Date(p.fecha)) === dayTs)
      .reduce((s, p) => s + p.total, 0)
    return { fecha: label, total }
  })

  // Count by estado
  const pedidosPorEstado: Record<string, number> = {}
  pedidos.forEach(p => {
    pedidosPorEstado[p.estado] = (pedidosPorEstado[p.estado] ?? 0) + 1
  })

  return {
    pedidosHoy: pedidosHoy.length,
    recaudadoHoy,
    pedidosSemana: pedidosSemana.length,
    recaudadoSemana,
    ventasPorDia,
    pedidosPorEstado,
  }
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#e8e8e8] px-6 py-5">
      <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-bold text-[#1a1a1a]">{value}</p>
    </div>
  )
}

export default function ReportesPage() {
  const adminId = useAuthStore(s => s.adminId)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminId) return
    getPedidos(adminId)
      .then(data => setPedidos(data))
      .catch(() => setError('No se pudieron cargar los pedidos.'))
      .finally(() => setLoading(false))
  }, [adminId])

  const metrics = calcularMetrics(pedidos)
  const maxBarValue = Math.max(...metrics.ventasPorDia.map(d => d.total), 1)

  return (
    <AdminLayout title="Reportes">
      {loading ? (
        <p className="text-sm text-[#aaa] py-8 text-center">Cargando…</p>
      ) : error ? (
        <p className="text-sm text-red-600 py-8 text-center">{error}</p>
      ) : (
        <div className="space-y-6">

          {/* Metric cards */}
          <div className="grid grid-cols-4 gap-4">
            <MetricCard label="Pedidos hoy" value={String(metrics.pedidosHoy)} />
            <MetricCard label="Recaudado hoy" value={`$${metrics.recaudadoHoy.toLocaleString('es-AR')}`} />
            <MetricCard label="Pedidos semana" value={String(metrics.pedidosSemana)} />
            <MetricCard label="Recaudado semana" value={`$${metrics.recaudadoSemana.toLocaleString('es-AR')}`} />
          </div>

          {/* Bar chart — ventas por día (últimos 7 días) */}
          <div className="bg-white border border-[#e8e8e8] px-6 py-5">
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-5">
              Recaudado por día — últimos 7 días
            </p>
            <div className="flex items-end gap-3 h-40">
              {metrics.ventasPorDia.map((day, i) => {
                const heightPct = (day.total / maxBarValue) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-[#aaa]">
                      {day.total > 0 ? `$${(day.total / 1000).toFixed(1)}k` : ''}
                    </span>
                    <div className="w-full relative" style={{ height: 112 }}>
                      <div
                        className="absolute bottom-0 left-0 right-0 transition-all"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: '#2d5a27',
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-[#666] font-medium">{day.fecha}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Estado breakdown */}
          {Object.keys(metrics.pedidosPorEstado).length > 0 && (
            <div className="bg-white border border-[#e8e8e8] px-6 py-5">
              <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-4">
                Pedidos por estado
              </p>
              <div className="space-y-2">
                {Object.entries(metrics.pedidosPorEstado).map(([estado, count]) => (
                  <div key={estado} className="flex items-center justify-between text-sm">
                    <span className="text-[#666]">{estado}</span>
                    <span className="font-bold text-[#1a1a1a]">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </AdminLayout>
  )
}
