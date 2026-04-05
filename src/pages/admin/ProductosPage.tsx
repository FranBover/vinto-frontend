import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  getProductos, createProducto, updateProducto,
  getCategorias, createExtra, deleteExtra,
} from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import type { Producto, Categoria, ProductoExtra } from '../../types'

interface ProductoForm {
  nombre: string
  descripcion: string
  precio: string
  categoriaId: string
  disponible: boolean
  imagenUrl: string
}

const EMPTY_FORM: ProductoForm = {
  nombre: '', descripcion: '', precio: '', categoriaId: '', disponible: true, imagenUrl: '',
}

const inputCls =
  'w-full border border-[#d0d0d0] px-3 py-2.5 text-sm rounded-none outline-none focus:border-[#1a1a1a] bg-white transition-colors'
const labelCls =
  'block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5'

export default function ProductosAdminPage() {
  const adminId = useAuthStore(s => s.adminId)
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [form, setForm] = useState<ProductoForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Extras state (only meaningful when editing an existing product)
  const [extras, setExtras] = useState<ProductoExtra[]>([])
  const [newExtraNombre, setNewExtraNombre] = useState('')
  const [newExtraPrecio, setNewExtraPrecio] = useState('')
  const [addingExtra, setAddingExtra] = useState(false)

  useEffect(() => {
    if (!adminId) return
    Promise.all([getProductos(adminId), getCategorias(adminId)])
      .then(([prods, cats]) => {
        setProductos(prods)
        setCategorias(cats)
      })
      .finally(() => setLoading(false))
  }, [adminId])

  function openNew() {
    setEditingProducto(null)
    setForm(EMPTY_FORM)
    setExtras([])
    setDrawerOpen(true)
  }

  function openEdit(p: Producto) {
    setEditingProducto(p)
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: String(p.precio),
      categoriaId: String(p.categoriaId),
      disponible: p.disponible,
      imagenUrl: p.imagenUrl ?? '',
    })
    setExtras(p.extras ?? [])
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setEditingProducto(null)
    setNewExtraNombre('')
    setNewExtraPrecio('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminId) return
    setSaving(true)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precio: parseFloat(form.precio),
        categoriaId: Number(form.categoriaId),
        disponible: form.disponible,
        imagenUrl: form.imagenUrl.trim(),
      }
      if (editingProducto) {
        const updated = await updateProducto(editingProducto.id, payload)
        setProductos(prev => prev.map(p => p.id === updated.id ? { ...updated, extras } : p))
        setEditingProducto({ ...updated, extras })
      } else {
        const created = await createProducto({ ...payload, administradorId: adminId } as Parameters<typeof createProducto>[0])
        setProductos(prev => [...prev, { ...created, extras: [] }])
        setEditingProducto({ ...created, extras: [] })
        setExtras([])
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAddExtra = async () => {
    if (!editingProducto || !newExtraNombre.trim()) return
    setAddingExtra(true)
    try {
      const extra = await createExtra({
        nombre: newExtraNombre.trim(),
        precioAdicional: parseFloat(newExtraPrecio) || 0,
        productoId: editingProducto.id,
      })
      const newExtras = [...extras, extra as ProductoExtra]
      setExtras(newExtras)
      setProductos(prev => prev.map(p => p.id === editingProducto.id ? { ...p, extras: newExtras } : p))
      setNewExtraNombre('')
      setNewExtraPrecio('')
    } finally {
      setAddingExtra(false)
    }
  }

  const handleDeleteExtra = async (extraId: number) => {
    await deleteExtra(extraId)
    const newExtras = extras.filter(e => e.id !== extraId)
    setExtras(newExtras)
    if (editingProducto) {
      setProductos(prev => prev.map(p => p.id === editingProducto.id ? { ...p, extras: newExtras } : p))
    }
  }

  const categoriaNombre = (id: number) =>
    categorias.find(c => c.id === id)?.nombre ?? '—'

  return (
    <AdminLayout
      title="Productos"
      actions={
        <button
          onClick={openNew}
          className="bg-[#1a1a1a] text-white text-sm font-bold px-4 py-2.5 rounded-none"
        >
          + Nuevo producto
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
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Categoría</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Precio</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Disponible</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#aaa] text-sm">Sin productos.</td>
                </tr>
              ) : (
                productos.map(p => (
                  <tr key={p.id} className="border-b border-[#e8e8e8] last:border-b-0 hover:bg-[#fafaf9] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-[#1a1a1a]">{p.nombre}</span>
                      {(p.extras ?? []).length > 0 && (
                        <span className="block text-xs text-[#aaa]">{(p.extras ?? []).length} extra{(p.extras ?? []).length !== 1 ? 's' : ''}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#666]">{categoriaNombre(p.categoriaId)}</td>
                    <td className="px-4 py-3 font-bold">${p.precio.toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: p.disponible ? '#2d5a27' : '#d0d0d0' }}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(p)}
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

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/30"
            onClick={closeDrawer}
          />
          {/* Panel */}
          <div
            className="w-[420px] h-full overflow-y-auto flex flex-col"
            style={{ backgroundColor: '#fff', borderLeft: '1px solid #e8e8e8' }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8] sticky top-0 bg-white z-10"
            >
              <h2 className="font-bold text-[15px]">
                {editingProducto ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button
                onClick={closeDrawer}
                className="text-[#aaa] hover:text-[#1a1a1a] text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4 flex-1">
              <div>
                <label className={labelCls}>Nombre</label>
                <input className={inputCls} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
              </div>
              <div>
                <label className={labelCls}>Descripción</label>
                <textarea
                  className={inputCls + ' resize-none'}
                  rows={3}
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Precio</label>
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio}
                    onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Categoría</label>
                  <select
                    className={inputCls}
                    value={form.categoriaId}
                    onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value }))}
                    required
                  >
                    <option value="">Seleccionar…</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>URL de imagen</label>
                <input
                  className={inputCls}
                  type="url"
                  value={form.imagenUrl}
                  onChange={e => setForm(f => ({ ...f, imagenUrl: e.target.value }))}
                  placeholder="https://…"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="disponible"
                  type="checkbox"
                  checked={form.disponible}
                  onChange={e => setForm(f => ({ ...f, disponible: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="disponible" className="text-sm font-medium text-[#1a1a1a]">
                  Disponible
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#1a1a1a] text-white py-3 font-bold text-sm rounded-none disabled:opacity-50"
              >
                {saving ? 'Guardando…' : editingProducto ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </form>

            {/* Extras — only shown after product exists */}
            {editingProducto && (
              <div className="px-6 pb-8 border-t border-[#e8e8e8] pt-5 space-y-3">
                <p className={labelCls}>Extras</p>
                {extras.length === 0 && (
                  <p className="text-xs text-[#aaa]">Sin extras.</p>
                )}
                {extras.map(ex => (
                  <div key={ex.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{ex.nombre}</span>
                      {ex.precioAdicional > 0 && (
                        <span className="text-[#aaa] ml-2">+${ex.precioAdicional.toLocaleString('es-AR')}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteExtra(ex.id)}
                      className="text-xs text-red-500 hover:text-red-700 ml-3"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <input
                    className={inputCls + ' flex-1'}
                    placeholder="Nombre extra"
                    value={newExtraNombre}
                    onChange={e => setNewExtraNombre(e.target.value)}
                  />
                  <input
                    className={inputCls}
                    style={{ width: 80 }}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="$0"
                    value={newExtraPrecio}
                    onChange={e => setNewExtraPrecio(e.target.value)}
                  />
                  <button
                    onClick={handleAddExtra}
                    disabled={addingExtra || !newExtraNombre.trim()}
                    className="px-3 py-2.5 text-xs font-bold bg-[#1a1a1a] text-white rounded-none disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
