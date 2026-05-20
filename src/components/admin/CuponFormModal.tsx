import { useState } from 'react'
import { createCupon, updateCupon } from '../../api/adminApi'
import type { CuponResponseDTO } from '../../api/adminApi'

interface FormState {
  codigo: string
  tipo: 'Porcentaje' | 'MontoFijo'
  valor: string
  fechaVencimiento: string
  limiteUsos: string
  pedidoMinimo: string
  activo: boolean
}

interface Errors {
  codigo?: string
  valor?: string
  limiteUsos?: string
  pedidoMinimo?: string
}

interface Props {
  cupon: CuponResponseDTO | null
  onClose: () => void
  onSaved: (c: CuponResponseDTO) => void
}

function isoToDate(iso?: string): string {
  if (!iso) return ''
  return iso.split('T')[0]
}

function generarCodigo(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

const inputCls =
  'w-full border border-[#d0d0d0] px-3 py-2.5 text-sm rounded-none outline-none focus:border-[#1a1a1a] bg-white transition-colors disabled:bg-[#f5f5f5] disabled:text-[#aaa] disabled:cursor-not-allowed'
const labelCls =
  'block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5'

export default function CuponFormModal({ cupon, onClose, onSaved }: Props) {
  const isEditing = cupon !== null
  const locked = isEditing && cupon.usosActuales > 0

  const [form, setForm] = useState<FormState>(() =>
    cupon
      ? {
          codigo: cupon.codigo,
          tipo: cupon.tipo,
          valor: String(cupon.valor),
          fechaVencimiento: isoToDate(cupon.fechaVencimiento),
          limiteUsos: cupon.limiteUsos != null ? String(cupon.limiteUsos) : '',
          pedidoMinimo: cupon.pedidoMinimo != null ? String(cupon.pedidoMinimo) : '',
          activo: cupon.activo,
        }
      : {
          codigo: '',
          tipo: 'Porcentaje',
          valor: '',
          fechaVencimiento: '',
          limiteUsos: '',
          pedidoMinimo: '',
          activo: true,
        }
  )

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function handleCodigo(raw: string) {
    set('codigo', raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 30))
  }

  function validate(): Errors {
    const e: Errors = {}
    const code = form.codigo.trim()
    if (!code) {
      e.codigo = 'El código es obligatorio'
    } else if (code.length < 3) {
      e.codigo = 'Mínimo 3 caracteres'
    } else if (!/^[A-Z0-9]+$/.test(code)) {
      e.codigo = 'Solo letras y números'
    }

    const v = parseFloat(form.valor)
    if (!form.valor || isNaN(v) || v <= 0) {
      e.valor = 'Ingresá un valor mayor a 0'
    } else if (form.tipo === 'Porcentaje' && v > 100) {
      e.valor = 'El porcentaje no puede superar 100'
    }

    if (form.limiteUsos) {
      const l = parseInt(form.limiteUsos)
      if (isNaN(l) || l <= 0) e.limiteUsos = 'Debe ser mayor a 0'
    }

    if (form.pedidoMinimo) {
      const p = parseFloat(form.pedidoMinimo)
      if (isNaN(p) || p <= 0) e.pedidoMinimo = 'Debe ser mayor a 0'
    }

    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (locked) {
      // Only activo can change when locked
      if (!cupon) return
      setSaving(true)
      try {
        const result = await updateCupon(cupon.id, {
          codigo: cupon.codigo,
          tipo: cupon.tipo,
          valor: cupon.valor,
          fechaVencimiento: cupon.fechaVencimiento,
          limiteUsos: cupon.limiteUsos,
          pedidoMinimo: cupon.pedidoMinimo,
          activo: form.activo,
        })
        onSaved(result)
      } finally {
        setSaving(false)
      }
      return
    }

    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSaving(true)
    try {
      const base = {
        codigo: form.codigo.trim(),
        tipo: form.tipo,
        valor: parseFloat(form.valor),
        fechaVencimiento: form.fechaVencimiento || undefined,
        limiteUsos: form.limiteUsos ? parseInt(form.limiteUsos) : undefined,
        pedidoMinimo: form.pedidoMinimo ? parseFloat(form.pedidoMinimo) : undefined,
      }

      let result: CuponResponseDTO
      if (isEditing) {
        result = await updateCupon(cupon.id, { ...base, activo: form.activo })
      } else {
        result = await createCupon(base)
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
            {isEditing ? 'Editar cupón' : 'Nuevo cupón'}
          </h2>
          <button onClick={onClose} className="text-[#aaa] hover:text-[#1a1a1a] text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {/* Warning locked */}
          {locked && (
            <div className="bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 leading-snug">
              Este cupón ya tiene usos y no puede modificarse. Podés desactivarlo y crear uno nuevo.
            </div>
          )}

          {/* Código */}
          <div>
            <label className={labelCls}>Código</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.codigo}
                onChange={e => handleCodigo(e.target.value)}
                disabled={locked}
                className={`${inputCls} font-mono tracking-widest uppercase flex-1`}
                placeholder="VERANO25"
                maxLength={30}
              />
              {!locked && (
                <button
                  type="button"
                  onClick={() => set('codigo', generarCodigo())}
                  className="px-3 py-2 text-xs font-bold border border-[#d0d0d0] text-[#666] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors rounded-none whitespace-nowrap"
                >
                  Generar
                </button>
              )}
            </div>
            {errors.codigo && <p className="text-xs text-red-600 mt-1">{errors.codigo}</p>}
          </div>

          {/* Tipo + Valor */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelCls}>Tipo</label>
              <select
                value={form.tipo}
                onChange={e => set('tipo', e.target.value as 'Porcentaje' | 'MontoFijo')}
                disabled={locked}
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
                disabled={locked}
                className={inputCls}
                placeholder={form.tipo === 'Porcentaje' ? '10' : '500'}
              />
              {errors.valor && <p className="text-xs text-red-600 mt-1">{errors.valor}</p>}
            </div>
          </div>

          {/* Vencimiento + Límite de usos */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelCls}>Vencimiento (opcional)</label>
              <input
                type="date"
                value={form.fechaVencimiento}
                onChange={e => set('fechaVencimiento', e.target.value)}
                disabled={locked}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Límite de usos</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.limiteUsos}
                onChange={e => set('limiteUsos', e.target.value)}
                disabled={locked}
                className={inputCls}
                placeholder="Ilimitado"
              />
              {errors.limiteUsos && <p className="text-xs text-red-600 mt-1">{errors.limiteUsos}</p>}
            </div>
          </div>

          {/* Pedido mínimo */}
          <div>
            <label className={labelCls}>Pedido mínimo (opcional)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.pedidoMinimo}
              onChange={e => set('pedidoMinimo', e.target.value)}
              disabled={locked}
              className={inputCls}
              placeholder="$0 — sin mínimo"
            />
            {errors.pedidoMinimo && <p className="text-xs text-red-600 mt-1">{errors.pedidoMinimo}</p>}
          </div>

          {/* Activo toggle (solo edición) */}
          {isEditing && (
            <div className="flex items-center justify-between py-1">
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
