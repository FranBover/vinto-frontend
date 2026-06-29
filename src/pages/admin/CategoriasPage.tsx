import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  reordenarCategorias,
  getProductos,
  uploadImagen,
  getImagenes,
} from '../../api/adminApi'
import type { ImagenResponse } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import type { Categoria } from '../../types'
import { resolveImageUrl } from '../../config'
import ImageUploader from '../../components/admin/ImageUploader'

// ── Sortable row ────────────────────────────────────────────────────────────
function SortableRow({
  categoria,
  productCount,
  onEdit,
  onDelete,
}: {
  categoria: Categoria
  productCount: number
  onEdit: (c: Categoria) => void
  onDelete: (id: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: categoria.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 'auto',
  } as React.CSSProperties

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-3 border-b border-[#e8e8e8] last:border-b-0 bg-white"
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#bbb] hover:text-[#1a1a1a] p-1 touch-none"
        aria-label="Arrastrar para reordenar"
        title="Arrastrar para reordenar"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="4" cy="3" r="1.2" />
          <circle cx="10" cy="3" r="1.2" />
          <circle cx="4" cy="7" r="1.2" />
          <circle cx="10" cy="7" r="1.2" />
          <circle cx="4" cy="11" r="1.2" />
          <circle cx="10" cy="11" r="1.2" />
        </svg>
      </button>

      {/* Thumbnail */}
      <div className="w-12 h-12 flex-shrink-0 bg-[#f5f5f5] border border-[#e8e8e8] flex items-center justify-center overflow-hidden">
        {categoria.imagenUrl ? (
          <img
            src={resolveImageUrl(categoria.imagenUrl)}
            alt={categoria.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[#bbb] font-bold text-base select-none">
            {categoria.nombre.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name + count */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#1a1a1a] text-sm truncate">{categoria.nombre}</p>
        <p className="text-xs text-[#aaa] mt-0.5">
          {productCount} producto{productCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onEdit(categoria)}
          className="text-xs font-bold text-[#1a1a1a] border border-[#1a1a1a] px-3 py-1.5 rounded-none hover:bg-[#1a1a1a] hover:text-white transition-colors"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(categoria.id)}
          className="text-xs font-bold text-red-600 border border-red-300 px-3 py-1.5 rounded-none hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function CategoriasPage() {
  const adminId = useAuthStore(s => s.adminId)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productoCount, setProductoCount] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [nombre, setNombre] = useState('')
  const [imagenes, setImagenes] = useState<ImagenResponse[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // dnd sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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
    setImagenes([])
    setPendingFiles([])
    setModalOpen(true)
  }

  async function openEdit(c: Categoria) {
    setEditingCategoria(c)
    setNombre(c.nombre)
    setPendingFiles([])
    // Hydrate imagenes from the backend (we need the full ImagenResponse for the uploader)
    if (c.imagenUrl) {
      try {
        const imgs = await getImagenes('categoria', c.id)
        setImagenes(imgs)
      } catch {
        setImagenes([])
      }
    } else {
      setImagenes([])
    }
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingCategoria(null)
    setNombre('')
    setImagenes([])
    setPendingFiles([])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminId || !nombre.trim()) return
    setSaving(true)
    try {
      if (editingCategoria) {
        await updateCategoria(editingCategoria.id, {
          nombre: nombre.trim(),
          administradorId: adminId,
        })
      } else {
        const created = await createCategoria({
          nombre: nombre.trim(),
          administradorId: adminId,
        })
        // Upload any pending images selected before the category existed
        for (const file of pendingFiles) {
          await uploadImagen(file, 'categoria', created.id, 0)
        }
      }
      // Refetch to reflect name change and/or new image URL
      const fresh = await getCategorias(adminId)
      setCategorias(fresh)
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categorias.findIndex(c => c.id === active.id)
    const newIndex = categorias.findIndex(c => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const previous = categorias
    const reordered = arrayMove(categorias, oldIndex, newIndex)
    setCategorias(reordered)

    try {
      await reordenarCategorias(reordered.map(c => c.id))
    } catch (err) {
      // rollback on error
      setCategorias(previous)
      console.error('Error al reordenar categorías:', err)
      alert('No se pudo guardar el nuevo orden. Intentá de nuevo.')
    }
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
      ) : categorias.length === 0 ? (
        <div className="border border-[#e8e8e8] bg-white py-12 text-center">
          <p className="text-sm text-[#aaa]">Sin categorías.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categorias.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="border border-[#e8e8e8] bg-white">
              {categorias.map(c => (
                <SortableRow
                  key={c.id}
                  categoria={c}
                  productCount={productoCount[c.id] ?? 0}
                  onEdit={openEdit}
                  onDelete={(id) => setConfirmDeleteId(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
              <div>
                <label className="block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5">
                  Foto
                </label>
                <ImageUploader
                  imagenes={imagenes}
                  tipo="categoria"
                  entidadId={editingCategoria?.id}
                  onImagenesChange={setImagenes}
                  onPendingFilesChange={setPendingFiles}
                  maxImagenes={1}
                  deferred={!editingCategoria}
                />
                <p className="text-[10px] text-[#aaa] mt-1.5">Opcional · 1 foto · máx 5 MB</p>
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
