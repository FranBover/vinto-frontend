import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getDescuentos } from '../../api/adminApi'
import type { DescuentoResponseDTO } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import DescuentoFormModal from '../../components/admin/DescuentoFormModal'

type Filtro = 'todos' | 'activos' | 'inactivos'

function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function AplicaA({ d }: { d: DescuentoResponseDTO }) {
  if (d.productoNombre) return <span>{d.productoNombre}</span>
  if (d.categoriaNombre) return <span>{d.categoriaNombre}</span>
  return <span className="text-[#2d5a27] font-medium">Pedido completo</span>
}

function ValorBadge({ d }: { d: DescuentoResponseDTO }) {
  return (
    <span className="font-mono font-bold text-[13px]">
      {d.tipo === 'Porcentaje' ? `${d.valor}%` : `$${d.valor.toLocaleString('es-AR')}`}
    </span>
  )
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

export default function DescuentosPage() {
  const adminId = useAuthStore(s => s.adminId)
  const [descuentos, setDescuentos] = useState<DescuentoResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DescuentoResponseDTO | null>(null)

  useEffect(() => {
    setLoading(true)
    const activo = filtro === 'todos' ? undefined : filtro === 'activos'
    getDescuentos(activo)
      .then(data => setDescuentos(data))
      .finally(() => setLoading(false))
  }, [filtro])

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(d: DescuentoResponseDTO) {
    setEditing(d)
    setModalOpen(true)
  }

  function handleSaved(d: DescuentoResponseDTO) {
    setDescuentos(prev => {
      const exists = prev.some(x => x.id === d.id)
      return exists ? prev.map(x => x.id === d.id ? d : x) : [d, ...prev]
    })
    setModalOpen(false)
  }

  const FILTROS: { key: Filtro; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'activos', label: 'Activos' },
    { key: 'inactivos', label: 'Inactivos' },
  ]

  return (
    <AdminLayout
      title="Descuentos"
      actions={
        <button
          onClick={openNew}
          className="bg-[#1a1a1a] text-white text-sm font-bold px-4 py-2.5 rounded-none"
        >
          + Nuevo descuento
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
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-[#e8e8e8]" style={{ backgroundColor: '#fafaf9' }}>
                {['Nombre', 'Tipo', 'Valor', 'Aplica a', 'Fechas', 'Estado', ''].map(h => (
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
              {descuentos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#aaa] text-sm">
                    {filtro === 'todos' ? 'Sin descuentos.' : `Sin descuentos ${filtro}.`}
                  </td>
                </tr>
              ) : (
                descuentos.map(d => (
                  <tr
                    key={d.id}
                    className="border-b border-[#e8e8e8] last:border-b-0 hover:bg-[#fafaf9] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[#1a1a1a]">{d.nombre}</td>
                    <td className="px-4 py-3 text-[#666]">
                      {d.tipo === 'Porcentaje' ? 'Porcentaje' : 'Monto fijo'}
                    </td>
                    <td className="px-4 py-3">
                      <ValorBadge d={d} />
                    </td>
                    <td className="px-4 py-3 text-[#666]">
                      <AplicaA d={d} />
                    </td>
                    <td className="px-4 py-3 text-[#666] whitespace-nowrap">
                      {d.fechaInicio || d.fechaFin ? (
                        <span>
                          {d.fechaInicio ? formatDate(d.fechaInicio) : '—'}
                          {' → '}
                          {d.fechaFin ? formatDate(d.fechaFin) : '—'}
                        </span>
                      ) : (
                        <span className="text-[#bbb]">Sin límite</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge activo={d.activo} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(d)}
                        className="text-xs font-bold text-[#1a1a1a] border border-[#1a1a1a] px-3 py-1.5 rounded-none hover:bg-[#1a1a1a] hover:text-white transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && adminId && (
        <DescuentoFormModal
          adminId={adminId}
          descuento={editing}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </AdminLayout>
  )
}
