import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { getAlertas } from '../../api/adminApi'
import type { StockAlertaDTO } from '../../types'

export default function StockPage() {
  const navigate = useNavigate()
  const [alertas, setAlertas] = useState<StockAlertaDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void getAlertas()
      .then(setAlertas)
      .catch(() => setError('Error al cargar alertas.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout title="Alertas de stock">
      {loading ? (
        <p className="text-sm text-[#aaa] py-8 text-center">Cargando…</p>
      ) : error ? (
        <p className="text-sm text-red-500 py-8 text-center">{error}</p>
      ) : alertas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-3xl mb-3">✓</span>
          <p className="text-sm text-[#aaa]">Todo el stock está en orden</p>
        </div>
      ) : (
        <div className="border border-[#e8e8e8] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8e8e8]" style={{ backgroundColor: '#fafaf9' }}>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">
                  Producto
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">
                  Variante
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">
                  Stock actual
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {alertas.map((a, i) => (
                <tr
                  key={i}
                  onClick={() => navigate('/admin/productos')}
                  className="border-b border-[#e8e8e8] last:border-b-0 hover:bg-[#fafaf9] transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">{a.nombreProducto}</td>
                  <td className="px-4 py-3 text-[#666]">
                    {a.varianteDescripcion ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#1a1a1a]">{a.stockActual}</td>
                  <td className="px-4 py-3">
                    {a.tipo === 'agotado' ? (
                      <span
                        className="inline-block px-2.5 py-1 text-[11px] font-bold rounded-none"
                        style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                      >
                        Agotado
                      </span>
                    ) : (
                      <span
                        className="inline-block px-2.5 py-1 text-[11px] font-bold rounded-none"
                        style={{ backgroundColor: '#fef9c3', color: '#a16207' }}
                      >
                        Stock bajo
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
