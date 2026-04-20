import { useState, useEffect, useCallback } from 'react'
import {
  getTiposVariante, createTipoVariante, deleteTipoVariante,
  getOpcionesVariante, createOpcionVariante, deleteOpcionVariante,
  getVariantes, generarVariantes, updateVariante, deleteAllVariantes,
  getStock,
} from '../../api/adminApi'
import type { MovimientoStock } from '../../api/adminApi'
import type { TipoVariante, Variante } from '../../types'

const labelCls = 'block text-[10px] font-bold text-[#aaa] uppercase tracking-widest'

function formatFecha(fechaStr: string): string {
  const d = new Date(fechaStr)
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function MovimientosTable({ movimientos }: { movimientos: MovimientoStock[] }) {
  return (
    <div>
      <p className={labelCls + ' mb-2'}>Últimos movimientos</p>
      <div className="border border-[#e8e8e8] overflow-hidden">
        <div className="overflow-y-auto" style={{ maxHeight: 140 }}>
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-[#f5f5f5]">
              <tr className="border-b border-[#e8e8e8]">
                <th className="text-left px-2 py-2 text-[#aaa] font-bold whitespace-nowrap">Fecha</th>
                <th className="text-left px-2 py-2 text-[#aaa] font-bold">Tipo</th>
                <th className="text-right px-2 py-2 text-[#aaa] font-bold">Cant.</th>
                <th className="text-left px-2 py-2 text-[#aaa] font-bold whitespace-nowrap">Ant → Nuevo</th>
                <th className="text-left px-2 py-2 text-[#aaa] font-bold">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m, i) => (
                <tr key={i} className="border-b border-[#e8e8e8] last:border-b-0">
                  <td className="px-2 py-1.5 whitespace-nowrap text-[#666]">{formatFecha(m.fecha)}</td>
                  <td className="px-2 py-1.5 text-[#1a1a1a]">{m.tipo}</td>
                  <td className="px-2 py-1.5 text-right font-medium">{m.cantidad}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-[#666]">
                    {m.stockAnterior} → {m.stockNuevo}
                  </td>
                  <td className="px-2 py-1.5 text-[#aaa]">{m.motivo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const smallInputCls =
  'flex-1 border border-[#d0d0d0] px-3 py-2 text-sm rounded-none outline-none focus:border-[#1a1a1a] bg-white transition-colors'

interface FilaEdit {
  precio: string
  stock: string
  disponible: boolean
}

interface Props {
  productoId: number
  tieneVariantes: boolean
  onToggleChange?: (value: boolean) => void
}

function getVarianteLabel(v: Variante): string {
  if (v.descripcion) return v.descripcion
  if (v.label) return v.label
  if (v.opcionesSeleccionadas?.length)
    return v.opcionesSeleccionadas.map(o => o.opcionVarianteValor).join(' / ')
  return `Variante #${v.id}`
}

export default function VariantesSection({ productoId, tieneVariantes, onToggleChange }: Props) {
  const [toggleOn, setToggleOn] = useState(() => tieneVariantes ?? false)
  const [tipos, setTipos] = useState<TipoVariante[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showConfirmDisable, setShowConfirmDisable] = useState(false)
  const [disabling, setDisabling] = useState(false)

  const [newTipoNombre, setNewTipoNombre] = useState('')
  const [addingTipo, setAddingTipo] = useState(false)
  const [showAddTipoForm, setShowAddTipoForm] = useState(false)

  const [opcionInputs, setOpcionInputs] = useState<Record<number, string>>({})
  const [addingOpcion, setAddingOpcion] = useState<Record<number, boolean>>({})

  const [variantes, setVariantes] = useState<Variante[]>([])
  const [loadingVariantes, setLoadingVariantes] = useState(false)
  const [errorVariantes, setErrorVariantes] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const [filaEdits, setFilaEdits] = useState<Record<number, FilaEdit>>({})
  const [savingTodas, setSavingTodas] = useState(false)
  const [savedTodas, setSavedTodas] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)

  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([])

  // fetchTipos y fetchVariantes se usan en los handlers de agregar/eliminar ejes y opciones
  const fetchTipos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const raw = await getTiposVariante(productoId)
      const withOpciones: TipoVariante[] = await Promise.all(
        raw.map(async t => ({ ...t, opciones: await getOpcionesVariante(t.id) }))
      )
      setTipos(withOpciones)
    } catch {
      setError('Error al cargar ejes.')
    } finally {
      setLoading(false)
    }
  }, [productoId])

  const fetchVariantes = useCallback(async () => {
    setLoadingVariantes(true)
    setErrorVariantes(null)
    try {
      const data = await getVariantes(productoId)
      setVariantes(data)
      setFilaEdits(
        data.reduce<Record<number, FilaEdit>>((acc, v) => ({
          ...acc,
          [v.id]: {
            precio: String(v.precio),
            stock: v.stock != null ? String(v.stock) : '',
            disponible: v.disponible,
          },
        }), {})
      )
    } catch {
      setErrorVariantes('Error al cargar combinaciones.')
    } finally {
      setLoadingVariantes(false)
    }
  }, [productoId])

  // Auto-detect al montar: si tieneVariantes no llegó pero el producto ya tiene tipos en DB
  useEffect(() => {
    if (tieneVariantes) return
    void getTiposVariante(productoId)
      .then(raw => { if (raw.length > 0) setToggleOn(true) })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // El efecto principal: solo corre cuando toggleOn o productoId cambian.
  // Llama la API directo para no depender de las referencias de los callbacks.
  useEffect(() => {
    if (!toggleOn) {
      setTipos([])
      setVariantes([])
      setFilaEdits({})
      return
    }

    setLoading(true)
    setError(null)
    void getTiposVariante(productoId)
      .then(raw =>
        Promise.all(raw.map(async t => ({ ...t, opciones: await getOpcionesVariante(t.id) })))
      )
      .then(withOpciones => { setTipos(withOpciones) })
      .catch(() => { setError('Error al cargar ejes.') })
      .finally(() => { setLoading(false) })

    setLoadingVariantes(true)
    setErrorVariantes(null)
    void getVariantes(productoId)
      .then(data => {
        setVariantes(data)
        setFilaEdits(
          data.reduce<Record<number, FilaEdit>>((acc, v) => ({
            ...acc,
            [v.id]: {
              precio: String(v.precio),
              stock: v.stock != null ? String(v.stock) : '',
              disponible: v.disponible,
            },
          }), {})
        )
      })
      .catch(() => { setErrorVariantes('Error al cargar combinaciones.') })
      .finally(() => { setLoadingVariantes(false) })
  }, [toggleOn, productoId])

  useEffect(() => {
    if (!toggleOn || variantes.length === 0) return
    void getStock(productoId)
      .then(data => setMovimientos(data.ultimos_movimientos ?? []))
      .catch(() => {})
  }, [toggleOn, variantes.length, productoId])

  function handleToggle() {
    if (toggleOn) {
      setShowConfirmDisable(true)
    } else {
      setToggleOn(true)
      onToggleChange?.(true)
    }
  }

  async function handleDisableConfirm() {
    setDisabling(true)
    setError(null)
    try {
      await Promise.all(tipos.map(t => deleteTipoVariante(productoId, t.id)))
      setTipos([])
      setVariantes([])
      setFilaEdits({})
      setToggleOn(false)
      onToggleChange?.(false)
      setShowConfirmDisable(false)
      setShowAddTipoForm(false)
      setNewTipoNombre('')
    } catch {
      setError('Error al deshabilitar variantes.')
    } finally {
      setDisabling(false)
    }
  }

  async function handleAddTipo() {
    if (!newTipoNombre.trim()) return
    setAddingTipo(true)
    setError(null)
    try {
      await createTipoVariante(productoId, { nombre: newTipoNombre.trim(), orden: tipos.length + 1 })
      setNewTipoNombre('')
      setShowAddTipoForm(false)
      await fetchTipos()
    } catch {
      setError('Error al agregar eje.')
    } finally {
      setAddingTipo(false)
    }
  }

  async function handleDeleteTipo(tipoId: number) {
    setError(null)
    try {
      await deleteAllVariantes(productoId)
      await deleteTipoVariante(productoId, tipoId)
      await Promise.all([fetchTipos(), fetchVariantes()])
    } catch {
      setError('Error al eliminar eje.')
    }
  }

  async function handleAddOpcion(tipoId: number) {
    const valor = (opcionInputs[tipoId] ?? '').trim()
    if (!valor) return
    setAddingOpcion(prev => ({ ...prev, [tipoId]: true }))
    setError(null)
    try {
      const tipo = tipos.find(t => t.id === tipoId)
      await createOpcionVariante(tipoId, { valor, orden: (tipo?.opciones.length ?? 0) + 1 })
      setOpcionInputs(prev => ({ ...prev, [tipoId]: '' }))
      await fetchTipos()
    } catch {
      setError('Error al agregar opción.')
    } finally {
      setAddingOpcion(prev => ({ ...prev, [tipoId]: false }))
    }
  }

  async function handleDeleteOpcion(tipoId: number, opcionId: number) {
    setError(null)
    try {
      await deleteAllVariantes(productoId)
      await deleteOpcionVariante(tipoId, opcionId)
      await Promise.all([fetchTipos(), fetchVariantes()])
    } catch {
      setError('Error al eliminar opción.')
    }
  }

  async function handleGenerar() {
    setGenerando(true)
    setErrorVariantes(null)
    try {
      await generarVariantes(productoId)
      await fetchVariantes()
    } catch {
      setErrorVariantes('Error al generar combinaciones.')
    } finally {
      setGenerando(false)
    }
  }

  async function handleEliminarTodas() {
    setEliminando(true)
    setErrorVariantes(null)
    try {
      await deleteAllVariantes(productoId)
      setVariantes([])
      setFilaEdits({})
    } catch {
      setErrorVariantes('Error al eliminar. Intentá de nuevo.')
    } finally {
      setEliminando(false)
    }
  }

  async function handleGuardarTodas() {
    setSavingTodas(true)
    setErrorGuardar(null)
    try {
      const filas = variantes.filter(v => {
        const edit = filaEdits[v.id]
        if (!edit) return false
        const precio = parseFloat(edit.precio)
        return !isNaN(precio) && precio > 0
      })
      await Promise.all(
        filas.map(v => {
          const edit = filaEdits[v.id]
          return updateVariante(v.id, {
            precio: parseFloat(edit.precio),
            stock: edit.stock.trim() === '' ? null : parseInt(edit.stock, 10),
            disponible: edit.disponible,
            sku: v.sku ?? null,
          })
        })
      )
      setSavedTodas(true)
      setTimeout(() => setSavedTodas(false), 2500)
    } catch {
      setErrorGuardar('Error al guardar. Revisá los precios e intentá de nuevo.')
    } finally {
      setSavingTodas(false)
    }
  }

  const hayOpcionesDefined = tipos.some(t => t.opciones.length > 0)
  const hayFilasValidas = variantes.some(v => {
    const edit = filaEdits[v.id]
    if (!edit) return false
    const precio = parseFloat(edit.precio)
    return !isNaN(precio) && precio > 0
  })

  return (
    <div className="px-6 pb-8 border-t border-[#e8e8e8] pt-5">
      <p className={labelCls + ' mb-4'}>Variantes</p>

      {/* Toggle switch */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={handleToggle}
          role="switch"
          aria-checked={toggleOn}
          className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
            toggleOn ? 'bg-[#2d5a27]' : 'bg-[#d0d0d0]'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              toggleOn ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className="text-sm text-[#1a1a1a]">
          {toggleOn ? 'Este producto tiene variantes' : 'Activar variantes para este producto'}
        </span>
      </div>

      {/* Confirm disable */}
      {showConfirmDisable && (
        <div className="mb-4 border border-[#e8e8e8] p-4 bg-[#fafaf9]">
          <p className="text-sm text-[#1a1a1a] mb-3">
            ¿Seguro? Esto eliminará todos los tipos, opciones y variantes generadas del producto.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDisableConfirm}
              disabled={disabling}
              className="px-3 py-2 text-xs font-bold bg-red-600 text-white rounded-none disabled:opacity-40"
            >
              {disabling ? 'Eliminando…' : 'Confirmar'}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDisable(false)}
              className="px-3 py-2 text-xs font-bold border border-[#d0d0d0] text-[#1a1a1a] rounded-none"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      {toggleOn && !showConfirmDisable && (
        <div className="space-y-4">
          {loading && <p className="text-xs text-[#aaa]">Cargando ejes…</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Existing tipos */}
          {tipos.map(tipo => (
            <div key={tipo.id} className="border border-[#e8e8e8] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-[#1a1a1a]">{tipo.nombre}</span>
                <button
                  type="button"
                  onClick={() => void handleDeleteTipo(tipo.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Eliminar eje
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {tipo.opciones.length === 0 && (
                  <span className="text-xs text-[#aaa]">Sin opciones.</span>
                )}
                {tipo.opciones.map(op => (
                  <span
                    key={op.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#f0f0f0] text-[#1a1a1a]"
                  >
                    {op.valor}
                    <button
                      type="button"
                      onClick={() => void handleDeleteOpcion(tipo.id, op.id)}
                      className="leading-none hover:text-red-500 ml-0.5"
                      aria-label={`Eliminar ${op.valor}`}
                      title={variantes.length > 0 ? 'Eliminar esta opción borrará todas las combinaciones generadas. Podés regenerarlas después.' : undefined}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  className={smallInputCls}
                  placeholder="Nueva opción (ej: S, M, Rojo…)"
                  value={opcionInputs[tipo.id] ?? ''}
                  onChange={e => setOpcionInputs(prev => ({ ...prev, [tipo.id]: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); void handleAddOpcion(tipo.id) }
                  }}
                />
                <button
                  type="button"
                  onClick={() => void handleAddOpcion(tipo.id)}
                  disabled={addingOpcion[tipo.id] || !(opcionInputs[tipo.id] ?? '').trim()}
                  className="px-3 py-2 text-xs font-bold bg-[#1a1a1a] text-white rounded-none disabled:opacity-40"
                >
                  {addingOpcion[tipo.id] ? '…' : '+'}
                </button>
              </div>
            </div>
          ))}

          {/* Add tipo form */}
          {(tipos.length === 0 || showAddTipoForm) && (
            <div className="border border-dashed border-[#d0d0d0] p-4">
              <p className="text-xs text-[#aaa] mb-2">
                {tipos.length === 0
                  ? 'Agrega el primer eje de variante (ej: Talle, Color, Tamaño)'
                  : 'Nuevo eje'}
              </p>
              <div className="flex gap-2">
                <input
                  className={smallInputCls}
                  placeholder="Nombre del eje"
                  value={newTipoNombre}
                  onChange={e => setNewTipoNombre(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); void handleAddTipo() }
                  }}
                />
                <button
                  type="button"
                  onClick={() => void handleAddTipo()}
                  disabled={addingTipo || !newTipoNombre.trim()}
                  className="px-3 py-2 text-xs font-bold bg-[#2d5a27] text-white rounded-none disabled:opacity-40 whitespace-nowrap"
                >
                  {addingTipo ? '…' : 'Agregar eje'}
                </button>
                {showAddTipoForm && (
                  <button
                    type="button"
                    onClick={() => { setShowAddTipoForm(false); setNewTipoNombre('') }}
                    className="px-3 py-2 text-xs font-bold border border-[#d0d0d0] text-[#666] rounded-none"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}

          {tipos.length === 1 && !showAddTipoForm && (
            <button
              type="button"
              onClick={() => setShowAddTipoForm(true)}
              className="text-xs font-bold text-[#2d5a27] border border-[#2d5a27] px-3 py-2 rounded-none hover:bg-[#2d5a27] hover:text-white transition-colors"
            >
              + Agregar otro eje
            </button>
          )}

          {/* ── Combinaciones ─────────────────────────────────────────────── */}
          {tipos.length > 0 && (
            <div className="border-t border-[#e8e8e8] pt-4 mt-2">
              <div className="mb-3">
                <p className={labelCls}>Combinaciones</p>
              </div>

              {errorVariantes && (
                <p className="text-xs text-red-500 mb-3">{errorVariantes}</p>
              )}

              {/* Generate button — shown when no variantes exist yet */}
              {!loadingVariantes && variantes.length === 0 && (
                <div className="text-center py-4">
                  {!hayOpcionesDefined ? (
                    <p className="text-xs text-[#aaa] mb-3">
                      Agrega opciones a los ejes para poder generar combinaciones.
                    </p>
                  ) : (
                    <p className="text-xs text-[#aaa] mb-3">
                      Genera las combinaciones de variantes a partir de los ejes definidos.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleGenerar()}
                    disabled={generando || !hayOpcionesDefined}
                    className="w-full py-3 text-sm font-bold bg-[#2d5a27] text-white rounded-none disabled:opacity-40 hover:opacity-90 transition-opacity"
                  >
                    {generando ? 'Generando…' : 'Generar combinaciones'}
                  </button>
                </div>
              )}

              {loadingVariantes && (
                <p className="text-xs text-[#aaa] py-2">Cargando combinaciones…</p>
              )}

              {/* Variantes table */}
              {variantes.length > 0 && (
                <>
                  <div className="border border-[#e8e8e8] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }} className="border-b border-[#e8e8e8]">
                          <th className="text-left px-3 py-2.5 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">
                            Variante
                          </th>
                          <th className="text-left px-3 py-2.5 text-[10px] font-bold text-[#aaa] uppercase tracking-widest w-24">
                            Precio
                          </th>
                          <th className="text-left px-3 py-2.5 text-[10px] font-bold text-[#aaa] uppercase tracking-widest w-24">
                            Stock
                          </th>
                          <th className="text-center px-3 py-2.5 text-[10px] font-bold text-[#aaa] uppercase tracking-widest w-20">
                            Disp.
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {variantes.map(v => {
                          const edit = filaEdits[v.id]
                          if (!edit) return null
                          const precioInvalid = !edit.precio || isNaN(parseFloat(edit.precio)) || parseFloat(edit.precio) <= 0
                          return (
                            <tr key={v.id} className="border-b border-[#e8e8e8] last:border-b-0">
                              <td className="px-3 py-2.5 text-[#1a1a1a] font-medium text-xs">
                                {getVarianteLabel(v)}
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={edit.precio}
                                  onChange={e =>
                                    setFilaEdits(prev => ({
                                      ...prev,
                                      [v.id]: { ...prev[v.id], precio: e.target.value },
                                    }))
                                  }
                                  className={`w-20 border px-2 py-1.5 text-xs rounded-none outline-none bg-white transition-colors ${
                                    precioInvalid ? 'border-red-300' : 'border-[#d0d0d0] focus:border-[#1a1a1a]'
                                  }`}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={edit.stock}
                                  placeholder="∞"
                                  onChange={e =>
                                    setFilaEdits(prev => ({
                                      ...prev,
                                      [v.id]: { ...prev[v.id], stock: e.target.value },
                                    }))
                                  }
                                  className="w-20 border border-[#d0d0d0] px-2 py-1.5 text-xs rounded-none outline-none focus:border-[#1a1a1a] bg-white transition-colors"
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFilaEdits(prev => ({
                                      ...prev,
                                      [v.id]: { ...prev[v.id], disponible: !prev[v.id].disponible },
                                    }))
                                  }
                                  role="switch"
                                  aria-checked={edit.disponible}
                                  className={`relative w-8 h-4 rounded-full transition-colors mx-auto block flex-shrink-0 ${
                                    edit.disponible ? 'bg-[#2d5a27]' : 'bg-[#d0d0d0]'
                                  }`}
                                >
                                  <span
                                    className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                                      edit.disponible ? 'translate-x-4' : 'translate-x-0.5'
                                    }`}
                                  />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions below table */}
                  <div className="pt-3 mt-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void handleGuardarTodas()}
                        disabled={savingTodas || eliminando || !hayFilasValidas}
                        className="px-4 py-2 text-xs font-bold bg-[#2d5a27] text-white rounded-none disabled:opacity-40 whitespace-nowrap hover:opacity-90 transition-opacity"
                      >
                        {savingTodas ? 'Guardando…' : 'Guardar combinaciones'}
                      </button>
                      {savedTodas && (
                        <span className="text-xs text-[#2d5a27] font-bold">Guardado ✓</span>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleEliminarTodas()}
                        disabled={eliminando || savingTodas}
                        className="ml-auto text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-40 whitespace-nowrap"
                      >
                        {eliminando ? 'Eliminando…' : 'Eliminar todas las combinaciones'}
                      </button>
                    </div>
                    {errorGuardar && (
                      <p className="text-xs text-red-500">{errorGuardar}</p>
                    )}
                  </div>

                  {/* Historial de movimientos */}
                  {movimientos.length > 0 && (
                    <div className="mt-4">
                      <MovimientosTable movimientos={movimientos} />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
