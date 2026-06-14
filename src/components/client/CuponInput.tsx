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
      {cupon ? (
        <div
          className="flex items-center justify-between px-3 py-2.5"
          style={{ backgroundColor: '#f4ede0', border: '1px solid #1a1a1a' }}
        >
          <span className="flex items-center gap-2 text-sm min-w-0">
            <span className="font-mono font-medium text-[#1a1a1a] truncate">{cupon.codigo}</span>
            <span className="text-[#6b6258] shrink-0">·</span>
            <span className="font-mono shrink-0" style={{ color: '#2d5a27' }}>
              −${cupon.montoDescuento.toLocaleString('es-AR')}
            </span>
          </span>
          <button
            type="button"
            onClick={handleQuitar}
            aria-label="Quitar cupón"
            className="w-6 h-6 shrink-0 ml-3 border border-[#1a1a1a] flex items-center justify-center text-lg leading-none text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-[#faf8f4] transition-colors"
          >
            ×
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
            placeholder="Ingresá el código"
            className={`flex-1 border px-3 py-2.5 text-sm rounded-none outline-none bg-white text-[#1a1a1a] placeholder:text-[#6b6258] transition-shadow focus:ring-2 focus:ring-[#73223a] focus:ring-offset-0 ${
              error ? 'border-[#a92020]' : 'border-[#1a1a1a]'
            }`}
          />
          <button
            type="button"
            onClick={() => void handleAplicar()}
            disabled={loading || !codigo.trim()}
            className="px-4 py-2.5 bg-[#1a1a1a] text-[#faf8f4] text-[11px] font-medium uppercase tracking-[0.18em] rounded-none disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? '…' : 'Aplicar'}
          </button>
        </div>
      )}

      {error && <p className="text-xs mt-1" style={{ color: '#a92020' }}>{error}</p>}
      {removedMsg && !cupon && <p className="text-xs mt-1" style={{ color: '#a16207' }}>{removedMsg}</p>}
    </div>
  )
}
