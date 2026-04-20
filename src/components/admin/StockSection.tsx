import { useState, useEffect } from 'react'
import { getStock, ajustarStock } from '../../api/adminApi'

const labelCls = 'block text-[10px] font-bold text-[#aaa] uppercase tracking-widest'

interface Props {
  productoId: number
}

export default function StockSection({ productoId }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stockInput, setStockInput] = useState('0')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    void getStock(productoId)
      .then(data => {
        setStockInput(data.stockProducto != null ? String(data.stockProducto) : '0')
      })
      .catch(() => setError('Error al cargar stock.'))
      .finally(() => setLoading(false))
  }, [productoId])

  async function handleGuardar() {
    const nuevoStock = parseInt(stockInput, 10)
    if (isNaN(nuevoStock) || nuevoStock < 0) return
    setSaving(true)
    setErrorGuardar(null)
    try {
      await ajustarStock(productoId, { varianteId: null, nuevoStock, motivo: 'Ajuste manual' })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setErrorGuardar('Error al guardar stock.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-6 pb-8 border-t border-[#e8e8e8] pt-5">
      <p className={labelCls + ' mb-4'}>Stock</p>

      {loading && <p className="text-xs text-[#aaa]">Cargando…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="flex items-end gap-3">
          <div>
            <label className={labelCls + ' mb-1.5'}>Stock actual</label>
            <input
              type="number"
              min="0"
              step="1"
              value={stockInput}
              onChange={e => setStockInput(e.target.value)}
              className="w-28 border border-[#d0d0d0] px-3 py-2 text-sm rounded-none outline-none focus:border-[#1a1a1a] bg-white transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleGuardar()}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold bg-[#2d5a27] text-white rounded-none disabled:opacity-40"
          >
            {saving ? 'Guardando…' : 'Guardar stock'}
          </button>
          {saved && (
            <span className="text-xs text-[#2d5a27] font-bold">Guardado ✓</span>
          )}
          {errorGuardar && (
            <span className="text-xs text-red-500">{errorGuardar}</span>
          )}
        </div>
      )}
    </div>
  )
}
