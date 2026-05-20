import { useState, useEffect, useRef } from 'react'
import { validarCupon } from '../../api/publicApi'

export interface CuponAplicado {
  codigo: string
  montoDescuento: number
}

interface Props {
  slug: string
  subtotal: number
  onCuponAplicado: (cupon: CuponAplicado | null) => void
}

export default function CuponInput({ slug, subtotal, onCuponAplicado }: Props) {
  const [codigo, setCodigo] = useState('')
  const [cupon, setCupon] = useState<CuponAplicado | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removedMsg, setRemovedMsg] = useState<string | null>(null)

  // Stable refs so the re-validation effect doesn't need them in deps
  const cuponRef = useRef<CuponAplicado | null>(null)
  cuponRef.current = cupon
  const onCuponRef = useRef(onCuponAplicado)
  onCuponRef.current = onCuponAplicado

  // Re-validate applied coupon whenever the subtotal changes (debounced)
  useEffect(() => {
    if (!cuponRef.current) return
    const timer = setTimeout(async () => {
      const c = cuponRef.current
      if (!c) return
      try {
        const res = await validarCupon(slug, c.codigo, subtotal)
        if (!res.valido) {
          setCupon(null)
          onCuponRef.current(null)
          setRemovedMsg(`El cupón fue removido: ${res.motivo ?? 'ya no es válido'}`)
          setError(null)
        } else if (res.montoDescuento != null) {
          const updated: CuponAplicado = { codigo: c.codigo, montoDescuento: res.montoDescuento }
          setCupon(updated)
          onCuponRef.current(updated)
        }
      } catch {
        // silent — don't remove coupon on network error
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [subtotal, slug]) // cupon intentionally read via ref to avoid re-validation loops

  const handleAplicar = async () => {
    const trimmed = codigo.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    setRemovedMsg(null)
    try {
      const res = await validarCupon(slug, trimmed, subtotal)
      if (!res.valido) {
        setError(res.motivo ?? 'Cupón inválido')
      } else {
        const applied: CuponAplicado = { codigo: trimmed, montoDescuento: res.montoDescuento ?? 0 }
        setCupon(applied)
        onCuponAplicado(applied)
        setError(null)
      }
    } catch {
      setError('No se pudo validar el cupón. Revisá tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuitar = () => {
    setCupon(null)
    onCuponAplicado(null)
    setCodigo('')
    setError(null)
    setRemovedMsg(null)
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Cupón de descuento</p>

      {cupon ? (
        <div className="flex items-center justify-between border border-[#2d5a27] px-3 py-3 bg-[#f0f7ef]">
          <span className="text-sm text-[#2d5a27] font-bold">
            ✓ {cupon.codigo}: -${cupon.montoDescuento.toLocaleString('es-AR')}
          </span>
          <button
            type="button"
            onClick={handleQuitar}
            className="text-xs text-[#aaa] hover:text-[#1a1a1a] ml-3 shrink-0"
          >
            Quitar
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={codigo}
            onChange={e => {
              setCodigo(e.target.value.toUpperCase())
              setError(null)
              setRemovedMsg(null)
            }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void handleAplicar() } }}
            placeholder="CÓDIGO"
            className="flex-1 border border-[#d0d0d0] px-3 py-3 text-sm rounded-none outline-none focus:border-[#1a1a1a] bg-white uppercase tracking-wider transition-colors"
          />
          <button
            type="button"
            onClick={() => void handleAplicar()}
            disabled={loading || !codigo.trim()}
            className="px-4 py-3 bg-[#1a1a1a] text-white text-sm font-bold rounded-none disabled:opacity-40 shrink-0"
          >
            {loading ? '…' : 'Aplicar'}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-[#ef4444]">{error}</p>}
      {removedMsg && !cupon && <p className="text-xs text-[#f59e0b]">{removedMsg}</p>}
    </div>
  )
}
