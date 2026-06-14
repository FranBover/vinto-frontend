import { useEffect, useState, useRef } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getDashboardReporte } from '../../api/adminApi'
import PeriodoSelector from '../../components/admin/reportes/PeriodoSelector'
import KpiHero from '../../components/admin/reportes/KpiHero'
import SerieVentasChart from '../../components/admin/reportes/SerieVentasChart'
import RankingTabla from '../../components/admin/reportes/RankingTabla'
import MetodosPagoBarras from '../../components/admin/reportes/MetodosPagoBarras'
import HorasPicoChart from '../../components/admin/reportes/HorasPicoChart'
import DiasPicoChart from '../../components/admin/reportes/DiasPicoChart'
import { reportesColors } from '../../components/admin/reportes/colors'
import type { Periodo, DashboardReporte } from '../../types'

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [reporte, setReporte] = useState<DashboardReporte | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const prevReporte = useRef<DashboardReporte | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getDashboardReporte(periodo)
      .then(data => {
        setReporte(data)
        prevReporte.current = data
      })
      .catch(() => setError('No se pudo cargar el reporte.'))
      .finally(() => setLoading(false))
  }, [periodo])

  const displayed = reporte ?? prevReporte.current

  return (
    <AdminLayout title="Reportes">
      <div className="mb-6">
        <PeriodoSelector periodo={periodo} onChange={setPeriodo} />
      </div>

      {error && !displayed && (
        <p className="text-sm text-[#a92020] py-8 text-center">{error}</p>
      )}

      {!displayed && loading && (
        <p className="text-sm text-[#aaa] py-8 text-center">Cargando…</p>
      )}

      {displayed && (
        <div
          className="space-y-5 transition-opacity"
          style={{ opacity: loading ? 0.5 : 1 }}
        >
          {/* KPI hero */}
          <KpiHero ventas={displayed.ventas} periodo={displayed.periodo} comparacion={displayed.comparacion} />

          {/* Serie de ventas */}
          <SerieVentasChart data={displayed.serieVentas} />

          {/* Top productos / Top categorías */}
          <div className="grid grid-cols-2 gap-5">
            <RankingTabla
              titulo="Top productos"
              items={displayed.topProductos.map(p => ({
                nombre: p.nombre,
                valorPrincipal: p.facturacion,
                valorPrincipalFormat: 'currency',
                valorSecundario: `${p.unidades} ud.`,
              }))}
              colorBar={reportesColors.primario}
              vacioMensaje="Sin ventas en este período."
            />
            <RankingTabla
              titulo="Top categorías"
              items={displayed.topCategorias.map(c => ({
                nombre: c.nombre,
                valorPrincipal: c.facturacion,
                valorPrincipalFormat: 'currency',
                valorSecundario: `${c.unidades} ud.`,
              }))}
              colorBar={reportesColors.terciario}
              vacioMensaje="Sin ventas en este período."
            />
          </div>

          {/* Métodos de pago / Top clientes */}
          <div className="grid grid-cols-2 gap-5">
            <MetodosPagoBarras data={displayed.metodosPago} />
            <RankingTabla
              titulo="Top clientes"
              items={displayed.topClientes.map(c => ({
                nombre: c.nombreCliente,
                valorPrincipal: c.total,
                valorPrincipalFormat: 'currency',
                valorSecundario: `${c.cantidadPedidos} ped.`,
              }))}
              colorBar={reportesColors.acentoVerde}
              vacioMensaje="Sin pedidos en este período."
            />
          </div>

          {/* Horas pico / Días pico */}
          <div className="grid grid-cols-2 gap-5">
            <HorasPicoChart data={displayed.horasPico} />
            <DiasPicoChart data={displayed.diasPico} />
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
