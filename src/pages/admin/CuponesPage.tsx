import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getCupones } from '../../api/adminApi'
import type { CuponResponseDTO } from '../../api/adminApi'
import CuponFormModal from '../../components/admin/CuponFormModal'
import CuponMetricasModal from '../../components/admin/CuponMetricasModal'

type Filtro = 'todos' | 'activos' | 'inactivos'

function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function EstadoBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold bg-[#eaf4e8] text-[#2d5a27]">
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold bg-[#f0f0f0] text-[#888]">
      Inactivo
    </span>
  )
}

export default function CuponesPage() {
  const [cupones, setCupones] = useState<CuponResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CuponResponseDTO | null>(null)

  const [metricasOpen, setMetricasOpen] = useState(false)
  const [metricasCupon, setMetricasCupon] = useState<{ id: number; codigo: string } | null>(null)

  useEffect(() => {
    setLoading(true)
    const activo = filtro === 'todos' ? undefined : filtro === 'activos'
    getCupones(activo)
      .then(data => setCupones(data))
      .finally(() => setLoading(false))
  }, [filtro])

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(c: CuponResponseDTO) {
    setEditing(c)
    setFormOpen(true)
  }

  function openMetricas(c: CuponResponseDTO) {
    setMetricasCupon({ id: c.id, codigo: c.codigo })
    setMetricasOpen(true)
  }

  function handleSaved(c: CuponResponseDTO) {
    setCupones(prev => {
      const exists = prev.some(x => x.id === c.id)
      return exists ? prev.map(x => x.id === c.id ? c : x) : [c, ...prev]
    })
    setFormOpen(false)
  }

  const FILTROS: { key: Filtro; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'activos', label: 'Activos' },
    { key: 'inactivos', label: 'Inactivos' },
  ]

  return (
    <AdminLayout
      title="Cupones"
      actions={
        <button
          onClick={openNew}
          className="bg-[#1a1a1a] text-white text-sm font-bold px-4 py-2.5 rounded-none"
        >
          + Nuevo cupón
        </button>
      }
    >
      {/* Filtros */}
      <div className="flex gap-1 mb-4">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-4 py-2 text-sm font-bold rounded-none border transition-colors ${
              filtro === f.key
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : 'bg-white text-[#666] border-[#d0d0d0] hover:border-[#1a1a1a] hover:text-[#1a1a1a]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-sm text-[#aaa] py-8 text-center">Cargando…</p>
      ) : (
        <div className="border border-[#e8e8e8] bg-white overflow-x-auto">
          <table className="w-full text-sm min-w-[780px]">
            <thead>
              <tr className="border-b border-[#e8e8e8]" style={{ backgroundColor: '#fafaf9' }}>
                {['Código', 'Tipo', 'Valor', 'Vencimiento', 'Usos', 'Pedido mín.', 'Estado', ''].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cupones.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[#aaa] text-sm">
                    {filtro === 'todos' ? 'Sin cupones.' : `Sin cupones ${filtro}.`}
                  </td>
                </tr>
              ) : (
                cupones.map(c => (
                  <tr
                    key={c.id}
                    className="border-b border-[#e8e8e8] last:border-b-0 hover:bg-[#fafaf9] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold tracking-widest text-[13px]">{c.codigo}</span>
                    </td>
                    <td className="px-4 py-3 text-[#666]">
                      {c.tipo === 'Porcentaje' ? 'Porcentaje' : 'Monto fijo'}
                    </td>
                    <td className="px-4 py-3 font-bold font-mono text-[13px]">
                      {c.tipo === 'Porcentaje' ? `${c.valor}%` : `$${c.valor.toLocaleString('es-AR')}`}
                    </td>
                    <td className="px-4 py-3 text-[#666] whitespace-nowrap">
                      {c.fechaVencimiento ? formatDate(c.fechaVencimiento) : (
                        <span className="text-[#bbb]">Sin vencimiento</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#666]">
                      {c.limiteUsos != null
                        ? `${c.usosActuales} / ${c.limiteUsos}`
                        : `${c.usosActuales} usos`}
                    </td>
                    <td className="px-4 py-3 text-[#666]">
                      {c.pedidoMinimo != null
                        ? `$${c.pedidoMinimo.toLocaleString('es-AR')}`
                        : <span className="text-[#bbb]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge activo={c.activo} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openMetricas(c)}
                          className="text-xs font-bold text-[#666] border border-[#d0d0d0] px-3 py-1.5 rounded-none hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors whitespace-nowrap"
                        >
                          Métricas
                        </button>
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs font-bold text-[#1a1a1a] border border-[#1a1a1a] px-3 py-1.5 rounded-none hover:bg-[#1a1a1a] hover:text-white transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <CuponFormModal
          cupon={editing}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {metricasOpen && metricasCupon && (
        <CuponMetricasModal
          cuponId={metricasCupon.id}
          codigo={metricasCupon.codigo}
          onClose={() => { setMetricasOpen(false); setMetricasCupon(null) }}
        />
      )}
    </AdminLayout>
  )
}
