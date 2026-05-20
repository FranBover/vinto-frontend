import { useEffect, useState } from 'react'
import { getCategorias, getProductos, createDescuento, updateDescuento } from '../../api/adminApi'
import type { DescuentoResponseDTO } from '../../api/adminApi'
import type { Producto, Categoria } from '../../types'

type AlcanceType = 'producto' | 'categoria' | 'pedido'

interface FormState {
  nombre: string
  tipo: 'Porcentaje' | 'MontoFijo'
  valor: string
  alcance: AlcanceType
  productoId: string
  categoriaId: string
  fechaInicio: string
  fechaFin: string
  activo: boolean
}

interface Errors {
  nombre?: string
  valor?: string
  alcance?: string
  productoId?: string
  categoriaId?: string
  fechas?: string
}

interface Props {
  adminId: number
  descuento: DescuentoResponseDTO | null
  onClose: () => void
  onSaved: (d: DescuentoResponseDTO) => void
}

function isoToDate(iso?: string): string {
  if (!iso) return ''
  return iso.split('T')[0]
}

function buildAlcance(d: DescuentoResponseDTO): AlcanceType {
  if (d.productoId != null) return 'producto'
  if (d.categoriaId != null) return 'categoria'
  return 'pedido'
}

const inputCls =
  'w-full border border-[#d0d0d0] px-3 py-2.5 text-sm rounded-none outline-none focus:border-[#1a1a1a] bg-white transition-colors'
const labelCls =
  'block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5'

export default function DescuentoFormModal({ adminId, descuento, onClose, onSaved }: Props) {
  const isEditing = descuento !== null

  const [form, setForm] = useState<FormState>(() =>
    descuento
      ? {
          nombre: descuento.nombre,
          tipo: descuento.tipo,
          valor: String(descuento.valor),
          alcance: buildAlcance(descuento),
          productoId: String(descuento.productoId ?? ''),
          categoriaId: String(descuento.categoriaId ?? ''),
          fechaInicio: isoToDate(descuento.fechaInicio),
          fechaFin: isoToDate(descuento.fechaFin),
          activo: descuento.activo,
        }
      : {
          nombre: '',
          tipo: 'Porcentaje',
          valor: '',
          alcance: 'pedido',
          productoId: '',
          categoriaId: '',
          fechaInicio: '',
          fechaFin: '',
          activo: true,
        }
  )

  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  useEffect(() => {
    Promise.all([getProductos(adminId), getCategorias(adminId)])
      .then(([prods, cats]) => {
        setProductos(prods)
        setCategorias(cats)
      })
      .finally(() => setLoadingCatalog(false))
  }, [adminId])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function validate(): Errors {
    const e: Errors = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    const v = parseFloat(form.valor)
    if (!form.valor || isNaN(v) || v <= 0) {
      e.valor = 'Ingresá un valor mayor a 0'
    } else if (form.tipo === 'Porcentaje' && v > 100) {
      e.valor = 'El porcentaje no puede superar 100'
    }
    if (form.alcance === 'producto' && !form.productoId) e.productoId = 'Seleccioná un producto'
    if (form.alcance === 'categoria' && !form.categoriaId) e.categoriaId = 'Seleccioná una categoría'
    if (form.fechaInicio && form.fechaFin && form.fechaFin <= form.fechaInicio) {
      e.fechas = 'La fecha de fin debe ser posterior a la de inicio'
    }
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSaving(true)
    try {
      const base = {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        valor: parseFloat(form.valor),
        aplicaAPedidoCompleto: form.alcance === 'pedido',
        productoId: form.alcance === 'producto' ? parseInt(form.productoId) : undefined,
        categoriaId: form.alcance === 'categoria' ? parseInt(form.categoriaId) : undefined,
        fechaInicio: form.fechaInicio || undefined,
        fechaFin: form.fechaFin || undefined,
      }

      let result: DescuentoResponseDTO
      if (isEditing) {
        result = await updateDescuento(descuento.id, { ...base, activo: form.activo })
      } else {
        result = await createDescuento(base)
      }
      onSaved(result)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white w-full max-w-lg border border-[#e8e8e8] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
          <h2 className="font-bold text-[15px]">
            {isEditing ? 'Editar descuento' : 'Nuevo descuento'}
          </h2>
          <button onClick={onClose} className="text-[#aaa] hover:text-[#1a1a1a] text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className={labelCls}>Nombre</label>
            <input
              autoFocus
              type="text"
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              className={inputCls}
              placeholder="Ej: 10% verano"
            />
            {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>}
          </div>

          {/* Tipo + Valor */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelCls}>Tipo</label>
              <select
                value={form.tipo}
                onChange={e => set('tipo', e.target.value as 'Porcentaje' | 'MontoFijo')}
                className={inputCls}
              >
                <option value="Porcentaje">Porcentaje (%)</option>
                <option value="MontoFijo">Monto fijo ($)</option>
              </select>
            </div>
            <div className="flex-1">
              <label className={labelCls}>Valor</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.valor}
                onChange={e => set('valor', e.target.value)}
                className={inputCls}
                placeholder={form.tipo === 'Porcentaje' ? '10' : '500'}
              />
              {errors.valor && <p className="text-xs text-red-600 mt-1">{errors.valor}</p>}
            </div>
          </div>

          {/* Alcance */}
          <div>
            <label className={labelCls}>Aplica a</label>
            <div className="border border-[#d0d0d0]">
              {(['pedido', 'categoria', 'producto'] as const).map((op, i) => (
                <label
                  key={op}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-sm ${
                    i < 2 ? 'border-b border-[#e8e8e8]' : ''
                  } ${form.alcance === op ? 'bg-[#f5f5f5]' : 'hover:bg-[#fafafa]'}`}
                >
                  <span className="flex-shrink-0 w-4 h-4 border border-[#1a1a1a] rounded-full flex items-center justify-center">
                    {form.alcance === op && <span className="w-2 h-2 bg-[#1a1a1a] rounded-full block" />}
                  </span>
                  <input
                    type="radio"
                    className="sr-only"
                    checked={form.alcance === op}
                    onChange={() => set('alcance', op)}
                  />
                  {op === 'pedido' && 'Todo el pedido'}
                  {op === 'categoria' && 'Categoría específica'}
                  {op === 'producto' && 'Producto específico'}
                </label>
              ))}
            </div>
          </div>

          {/* Producto selector */}
          {form.alcance === 'producto' && (
            <div>
              <label className={labelCls}>Producto</label>
              {loadingCatalog ? (
                <p className="text-sm text-[#aaa]">Cargando…</p>
              ) : (
                <select
                  value={form.productoId}
                  onChange={e => set('productoId', e.target.value)}
                  className={inputCls}
                >
                  <option value="">Seleccioná un producto</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              )}
              {errors.productoId && <p className="text-xs text-red-600 mt-1">{errors.productoId}</p>}
            </div>
          )}

          {/* Categoría selector */}
          {form.alcance === 'categoria' && (
            <div>
              <label className={labelCls}>Categoría</label>
              {loadingCatalog ? (
                <p className="text-sm text-[#aaa]">Cargando…</p>
              ) : (
                <select
                  value={form.categoriaId}
                  onChange={e => set('categoriaId', e.target.value)}
                  className={inputCls}
                >
                  <option value="">Seleccioná una categoría</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              )}
              {errors.categoriaId && <p className="text-xs text-red-600 mt-1">{errors.categoriaId}</p>}
            </div>
          )}

          {/* Fechas */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelCls}>Fecha inicio (opcional)</label>
              <input
                type="date"
                value={form.fechaInicio}
                onChange={e => { set('fechaInicio', e.target.value); setErrors(p => ({ ...p, fechas: undefined })) }}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Fecha fin (opcional)</label>
              <input
                type="date"
                value={form.fechaFin}
                onChange={e => { set('fechaFin', e.target.value); setErrors(p => ({ ...p, fechas: undefined })) }}
                className={inputCls}
              />
            </div>
          </div>
          {errors.fechas && <p className="text-xs text-red-600 -mt-2">{errors.fechas}</p>}

          {/* Activo toggle (solo edición) */}
          {isEditing && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Activo</span>
              <button
                type="button"
                onClick={() => set('activo', !form.activo)}
                className={`w-11 h-6 rounded-full transition-colors relative ${form.activo ? 'bg-[#2d5a27]' : 'bg-[#d0d0d0]'}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#d0d0d0] py-2.5 text-sm font-bold rounded-none hover:bg-[#fafaf9] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#1a1a1a] text-white py-2.5 text-sm font-bold rounded-none disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando…' : isEditing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
