import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getCategorias, createCategoria, updateCategoria, deleteCategoria, getProductos } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import type { Categoria } from '../../types'

export default function CategoriasPage() {
  const adminId = useAuthStore(s => s.adminId)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productoCount, setProductoCount] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  useEffect(() => {
    if (!adminId) return
    Promise.all([getCategorias(adminId), getProductos(adminId)])
      .then(([cats, prods]) => {
        setCategorias(cats)
        const counts: Record<number, number> = {}
        prods.forEach(p => {
          counts[p.categoriaId] = (counts[p.categoriaId] ?? 0) + 1
        })
        setProductoCount(counts)
      })
      .finally(() => setLoading(false))
  }, [adminId])

  function openNew() {
    setEditingCategoria(null)
    setNombre('')
    setModalOpen(true)
  }

  function openEdit(c: Categoria) {
    setEditingCategoria(c)
    setNombre(c.nombre)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingCategoria(null)
    setNombre('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminId || !nombre.trim()) return
    setSaving(true)
    try {
      if (editingCategoria) {
        const updated = await updateCategoria(editingCategoria.id, { nombre: nombre.trim() })
        setCategorias(prev => prev.map(c => c.id === updated.id ? updated : c))
      } else {
        const created = await createCategoria({ nombre: nombre.trim(), administradorId: adminId })
        setCategorias(prev => [...prev, created])
      }
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    await deleteCategoria(id)
    setCategorias(prev => prev.filter(c => c.id !== id))
    setConfirmDeleteId(null)
  }

  return (
    <AdminLayout
      title="Categorías"
      actions={
        <button
          onClick={openNew}
          className="bg-[#1a1a1a] text-white text-sm font-bold px-4 py-2.5 rounded-none"
        >
          + Nueva categoría
        </button>
      }
    >
      {loading ? (
        <p className="text-sm text-[#aaa] py-8 text-center">Cargando…</p>
      ) : (
        <div className="border border-[#e8e8e8] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8e8e8]" style={{ backgroundColor: '#fafaf9' }}>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Nombre</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Productos</th>
                <th className="px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {categorias.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-[#aaa] text-sm">Sin categorías.</td>
                </tr>
              ) : (
                categorias.map(c => (
                  <tr key={c.id} className="border-b border-[#e8e8e8] last:border-b-0 hover:bg-[#fafaf9] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#1a1a1a]">{c.nombre}</td>
                    <td className="px-4 py-3 text-[#aaa]">{productoCount[c.id] ?? 0}</td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-xs font-bold text-[#1a1a1a] border border-[#1a1a1a] px-3 py-1.5 rounded-none hover:bg-[#1a1a1a] hover:text-white transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(c.id)}
                        className="text-xs font-bold text-red-600 border border-red-300 px-3 py-1.5 rounded-none hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white w-full max-w-sm border border-[#e8e8e8]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
              <h2 className="font-bold text-[15px]">
                {editingCategoria ? 'Editar categoría' : 'Nueva categoría'}
              </h2>
              <button onClick={closeModal} className="text-[#aaa] hover:text-[#1a1a1a] text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSave} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5">
                  Nombre
                </label>
                <input
                  autoFocus
                  className="w-full border border-[#d0d0d0] px-3 py-2.5 text-sm rounded-none outline-none focus:border-[#1a1a1a] bg-white"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#1a1a1a] text-white py-3 font-bold text-sm rounded-none disabled:opacity-50"
              >
                {saving ? 'Guardando…' : editingCategoria ? 'Guardar' : 'Crear'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white w-full max-w-xs border border-[#e8e8e8] p-6 text-center">
            <p className="font-bold text-[15px] mb-2">¿Eliminar categoría?</p>
            <p className="text-sm text-[#666] mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 border border-[#d0d0d0] py-2.5 text-sm font-bold rounded-none hover:bg-[#fafaf9]"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 bg-red-600 text-white py-2.5 text-sm font-bold rounded-none hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
