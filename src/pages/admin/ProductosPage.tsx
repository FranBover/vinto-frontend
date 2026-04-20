import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  getProductos, createProducto, updateProducto, toggleDisponibilidad,
  getCategorias, getExtras, createExtra, deleteExtra,
  getImagenes, uploadImagen,
} from '../../api/adminApi'
import type { ImagenResponse } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import type { Producto, Categoria, ProductoExtra } from '../../types'
import ImageUploader from '../../components/admin/ImageUploader'
import VariantesSection from '../../components/admin/VariantesSection'
import StockSection from '../../components/admin/StockSection'

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
  // Key estable para VariantesSection — solo cambia al abrir/cerrar el drawer,
  // nunca al guardar el producto, así el componente no se re-monta en cada save
  const [variantesKey, setVariantesKey] = useState<number | null>(null)
  const [variantesActivas, setVariantesActivas] = useState(false)

  // Filters
  const [filterNombre, setFilterNombre] = useState('')
  const [filterCategoriaId, setFilterCategoriaId] = useState('')
  const [filterDisponible, setFilterDisponible] = useState('')

  // Toggle disponibilidad
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // Extras state (only meaningful when editing an existing product)
  const [extras, setExtras] = useState<ProductoExtra[]>([])
  const [newExtraNombre, setNewExtraNombre] = useState('')
  const [newExtraPrecio, setNewExtraPrecio] = useState('')
  const [addingExtra, setAddingExtra] = useState(false)

  // Images state
  const [imagenes, setImagenes] = useState<ImagenResponse[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

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
    setImagenes([])
    setPendingFiles([])
    setDrawerOpen(true)
  }

  async function openEdit(p: Producto) {
    setVariantesKey(p.id)
    setVariantesActivas(p.tieneVariantes ?? false)
    setEditingProducto(p)
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: String(p.precio),
      categoriaId: String(p.categoriaId),
      disponible: p.disponible,
      imagenUrl: p.imagenUrl ?? '',
    })
    setImagenes([])
    setPendingFiles([])
    setDrawerOpen(true)
    const [freshExtras, freshImages] = await Promise.all([
      getExtras(p.id),
      getImagenes('producto', p.id),
    ])
    setExtras(freshExtras)
    setImagenes(freshImages)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setEditingProducto(null)
    setVariantesKey(null)
    setVariantesActivas(false)
    setNewExtraNombre('')
    setNewExtraPrecio('')
    setImagenes([])
    setPendingFiles([])
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
        setEditingProducto({ ...updated, extras, imagenes })
      } else {
        const created = await createProducto({ ...payload, administradorId: adminId } as Parameters<typeof createProducto>[0])
        // Upload any pending images now that we have the product id
        const uploadedImages: ImagenResponse[] = []
        for (let i = 0; i < pendingFiles.length; i++) {
          const img = await uploadImagen(pendingFiles[i], 'producto', created.id, i + 1)
          uploadedImages.push(img)
        }
        setPendingFiles([])
        setImagenes(uploadedImages)
        setEditingProducto({ ...created, extras: [], imagenes: uploadedImages })
        setExtras([])
      }
      const fresh = await getProductos(adminId)
      setProductos(fresh)
    } finally {
      setSaving(false)
    }
  }

  const handleAddExtra = async () => {
    if (!editingProducto || !newExtraNombre.trim()) return
    setAddingExtra(true)
    try {
      await createExtra({
        nombre: newExtraNombre.trim(),
        precioAdicional: parseFloat(newExtraPrecio) || 0,
        productoId: editingProducto.id,
      })
      const freshExtras = await getExtras(editingProducto.id)
      setExtras(freshExtras)
      setProductos(prev => prev.map(p => p.id === editingProducto.id ? { ...p, extras: freshExtras } : p))
      setNewExtraNombre('')
      setNewExtraPrecio('')
    } finally {
      setAddingExtra(false)
    }
  }

  const handleDeleteExtra = async (extraId: number) => {
    if (!editingProducto) return
    await deleteExtra(extraId)
    const freshExtras = await getExtras(editingProducto.id)
    setExtras(freshExtras)
    setProductos(prev => prev.map(p => p.id === editingProducto.id ? { ...p, extras: freshExtras } : p))
  }

  const handleToggleDisponibilidad = async (p: Producto) => {
    if (!adminId) return
    setTogglingId(p.id)
    try {
      await toggleDisponibilidad(p.id, !p.disponible)
      const fresh = await getProductos(adminId)
      setProductos(fresh)
    } finally {
      setTogglingId(null)
    }
  }

  const categoriaNombre = (id: number) =>
    categorias.find(c => c.id === id)?.nombre ?? '—'

  const productosFiltrados = productos.filter(p => {
    if (filterNombre && !p.nombre.toLowerCase().includes(filterNombre.toLowerCase())) return false
    if (filterCategoriaId && p.categoriaId !== Number(filterCategoriaId)) return false
    if (filterDisponible === 'true' && !p.disponible) return false
    if (filterDisponible === 'false' && p.disponible) return false
    return true
  })

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
      {!loading && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={filterNombre}
            onChange={e => setFilterNombre(e.target.value)}
            className="flex-1 border border-[#d0d0d0] px-3 py-2 text-sm rounded-none outline-none focus:border-[#1a1a1a] bg-white transition-colors"
          />
          <select
            value={filterCategoriaId}
            onChange={e => setFilterCategoriaId(e.target.value)}
            className="w-full sm:w-48 border border-[#d0d0d0] px-3 py-2 text-sm rounded-none outline-none focus:border-[#1a1a1a] bg-white transition-colors"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <select
            value={filterDisponible}
            onChange={e => setFilterDisponible(e.target.value)}
            className="w-full sm:w-44 border border-[#d0d0d0] px-3 py-2 text-sm rounded-none outline-none focus:border-[#1a1a1a] bg-white transition-colors"
          >
            <option value="">Todos</option>
            <option value="true">Disponibles</option>
            <option value="false">No disponibles</option>
          </select>
        </div>
      )}
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
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#aaa] text-sm">
                    {productos.length === 0 ? 'Sin productos.' : 'Ningún producto coincide con los filtros.'}
                  </td>
                </tr>
              ) : (
                productosFiltrados.map(p => (
                  <tr
                    key={p.id}
                    className={`border-b border-[#e8e8e8] last:border-b-0 hover:bg-[#fafaf9] transition-colors${p.disponible ? '' : ' opacity-50'}`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-[#1a1a1a]">{p.nombre}</span>
                      {(p.extras ?? []).length > 0 && (
                        <span className="block text-xs text-[#aaa]">{(p.extras ?? []).length} extra{(p.extras ?? []).length !== 1 ? 's' : ''}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#666]">{categoriaNombre(p.categoriaId)}</td>
                    <td className="px-4 py-3 font-bold">${(p.precio ?? 0).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: p.disponible ? '#2d5a27' : '#d0d0d0' }}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-xs font-bold text-[#1a1a1a] border border-[#1a1a1a] px-3 py-1.5 rounded-none hover:bg-[#1a1a1a] hover:text-white transition-colors"
                        >
                          Editar
                        </button>
                        {p.disponible ? (
                          <button
                            onClick={() => handleToggleDisponibilidad(p)}
                            disabled={togglingId === p.id}
                            className="text-xs font-bold text-[#666] border border-[#d0d0d0] px-3 py-1.5 rounded-none hover:bg-[#f5f5f5] transition-colors disabled:opacity-40"
                          >
                            {togglingId === p.id ? '…' : 'Deshabilitar'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleDisponibilidad(p)}
                            disabled={togglingId === p.id}
                            className="text-xs font-bold text-white px-3 py-1.5 rounded-none transition-colors disabled:opacity-40"
                            style={{ backgroundColor: '#2d5a27' }}
                          >
                            {togglingId === p.id ? '…' : 'Habilitar'}
                          </button>
                        )}
                      </div>
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
                <label className={labelCls}>Imágenes</label>
                <ImageUploader
                  imagenes={imagenes}
                  tipo="producto"
                  entidadId={editingProducto?.id}
                  onImagenesChange={setImagenes}
                  deferred={!editingProducto}
                  onPendingFilesChange={setPendingFiles}
                  maxImagenes={5}
                />
                {!editingProducto && pendingFiles.length > 0 && (
                  <p className="mt-1.5 text-xs text-[#aaa]">
                    {pendingFiles.length} imagen{pendingFiles.length !== 1 ? 'es' : ''} se subirá{pendingFiles.length !== 1 ? 'n' : ''} al crear el producto.
                  </p>
                )}
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

            {/* Variantes — only shown when editing an existing product */}
            {variantesKey !== null && editingProducto && (
              <VariantesSection
                key={variantesKey}
                productoId={variantesKey}
                tieneVariantes={editingProducto.tieneVariantes ?? false}
                onToggleChange={setVariantesActivas}
              />
            )}

            {/* Stock — only for products without variants */}
            {editingProducto && !variantesActivas && (
              <StockSection productoId={editingProducto.id} />
            )}

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
