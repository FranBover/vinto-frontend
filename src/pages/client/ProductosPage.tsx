import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMenuStore } from '../../store/menuStore'
import CartBar from '../../components/client/CartBar'
import { BASE_URL } from '../../config'
import type { Producto } from '../../types'

const SERIF = "'Fraunces', Georgia, serif"

interface PrecioInfo {
  precioBase: number
  precioFinal: number
  porcentaje: number
  prefijo: string
}

function getPrecioInfo(producto: Producto): PrecioInfo {
  if (producto.tieneVariantes && producto.variantes?.length) {
    const disponibles = producto.variantes.filter(v => v.disponible && (v.stock === null || v.stock > 0))
    if (disponibles.length === 0) {
      return { precioBase: 0, precioFinal: 0, porcentaje: 0, prefijo: 'Agotado' }
    }
    const minBase = Math.min(...disponibles.map(v => v.precio))
    const minFinal = Math.min(...disponibles.map(v => v.precioConDescuento ?? v.precio))
    const maxPct = Math.max(...disponibles.map(v => v.porcentajeDescuentoTotal ?? 0))
    return { precioBase: minBase, precioFinal: minFinal, porcentaje: maxPct, prefijo: 'Desde ' }
  }
  return {
    precioBase: producto.precio ?? 0,
    precioFinal: producto.precioConDescuento ?? producto.precio ?? 0,
    porcentaje: producto.porcentajeDescuentoTotal ?? 0,
    prefijo: '',
  }
}

function resolveImageUrl(producto: Producto): string | null {
  if (producto.imagenes && producto.imagenes.length > 0) {
    return BASE_URL + producto.imagenes[0].url
  }
  if (producto.imagenUrl) return producto.imagenUrl
  return null
}

export default function ProductosPage() {
  const { slug, categoriaId } = useParams<{ slug: string; categoriaId: string }>()
  const navigate = useNavigate()
  const { data, loading, fetchMenu } = useMenuStore()

  useEffect(() => {
    if (slug) fetchMenu(slug)
  }, [slug, fetchMenu])

  const menu = slug ? data[slug] : null
  const catId = categoriaId ? parseInt(categoriaId, 10) : null
  const categoria = menu?.categorias.find(c => c.id === catId)
  const productos = categoria?.productos.filter(p => p.disponible) ?? []
  const isOpen = menu?.local.esActivo ?? true
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set())

  if (loading && !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f4]">
        <p
          className="text-sm text-[#6b6258]"
          style={{ fontFamily: SERIF, fontStyle: 'italic' }}
        >
          Cargando…
        </p>
      </div>
    )
  }

  if (!menu || !categoria) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f4] px-8">
        <p
          className="text-base text-[#1a1a1a] text-center"
          style={{ fontFamily: SERIF }}
        >
          Categoría no encontrada.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#1a1a1a] pb-24">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#faf8f4]/95 backdrop-blur-sm border-b border-[#e8e1d4] h-14 flex items-center px-5">
        <button
          onClick={() => navigate(`/${slug}`)}
          aria-label="Volver"
          className="text-xl leading-none text-[#1a1a1a] w-8 text-left shrink-0"
        >
          ←
        </button>
        <h1
          className="flex-1 text-center truncate px-2 text-[#1a1a1a]"
          style={{ fontFamily: SERIF, fontSize: '19px', fontWeight: 400, letterSpacing: '0.01em' }}
        >
          {categoria.nombre}
        </h1>
        <div className="w-8 shrink-0" />
      </header>

      {/* ── Centered content wrapper ───────────────────────────── */}
      <div className="mx-auto" style={{ maxWidth: '560px' }}>

        {/* ── Closed banner (eyebrow editorial) ────────────────── */}
        {!isOpen && (
          <div className="text-center py-7 px-6">
            <span
              className="text-[10px] font-medium uppercase"
              style={{ color: '#a92020', letterSpacing: '0.28em' }}
            >
              El local está cerrado
            </span>
          </div>
        )}

        {/* ── Product list ───────────────────────────────────────── */}
        <ul>
          {productos.length === 0 ? (
            <li
              className="px-5 py-12 text-center text-sm text-[#6b6258]"
              style={{ fontFamily: SERIF, fontStyle: 'italic' }}
            >
              No hay productos disponibles en esta categoría.
            </li>
          ) : (
            productos.map(producto => {
              const imgSrc = resolveImageUrl(producto)
              const { precioBase, precioFinal, porcentaje, prefijo } = getPrecioInfo(producto)
              const hasDiscount = porcentaje > 0 && precioFinal < precioBase
              const isAgotado = producto.tieneVariantes &&
                producto.variantes?.filter(v => v.disponible && (v.stock === null || v.stock > 0)).length === 0
              return (
                <li key={producto.id} className="border-t border-[#e8e1d4]">
                  <div className="flex items-start gap-4 px-5 py-5">

                    {/* ── Foto ──────────────────────────────── */}
                    <div
                      className={`relative w-[88px] h-[88px] shrink-0 overflow-hidden bg-[#ede5d3] ${
                        isAgotado ? 'opacity-50' : ''
                      }`}
                    >
                      {imgSrc && !imgErrors.has(producto.id) ? (
                        <img
                          src={imgSrc}
                          alt={producto.nombre}
                          className="w-full h-full object-cover"
                          onError={() => setImgErrors(prev => new Set(prev).add(producto.id))}
                        />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                      {hasDiscount && (
                        <span
                          className="absolute top-0 right-0 text-white text-[9px] font-medium leading-none px-1.5 py-1"
                          style={{ backgroundColor: '#73223a', letterSpacing: '0.05em' }}
                        >
                          -{porcentaje}%
                        </span>
                      )}
                    </div>

                    {/* ── Nombre + descripción ──────────────── */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="leading-snug text-[#1a1a1a]"
                        style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400 }}
                      >
                        {producto.nombre}
                      </p>
                      {producto.descripcion && (
                        <p className="text-[13px] text-[#6b6258] mt-1 leading-snug line-clamp-2">
                          {producto.descripcion}
                        </p>
                      )}
                    </div>

                    {/* ── Precio + botón ────────────────────── */}
                    <div className="flex flex-col items-end gap-2.5 shrink-0">
                      {isAgotado ? (
                        <span
                          className="text-[13px] text-[#6b6258]"
                          style={{ fontStyle: 'italic' }}
                        >
                          Agotado
                        </span>
                      ) : hasDiscount ? (
                        <div className="flex flex-col items-end leading-none">
                          <span className="text-[11px] text-[#6b6258] line-through font-mono tabular-nums">
                            ${precioBase.toLocaleString('es-AR')}
                          </span>
                          <span
                            className="text-[16px] font-mono tabular-nums font-bold mt-1"
                            style={{ color: '#73223a' }}
                          >
                            {prefijo}${precioFinal.toLocaleString('es-AR')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[15px] font-mono tabular-nums font-medium text-[#1a1a1a] leading-none">
                          {prefijo}${precioBase.toLocaleString('es-AR')}
                        </span>
                      )}
                      <button
                        onClick={() =>
                          navigate(`/${slug}/productos/${categoriaId}/${producto.id}`)
                        }
                        disabled={!isOpen || isAgotado}
                        aria-label={`Agregar ${producto.nombre}`}
                        className="w-9 h-9 bg-[#1a1a1a] text-[#faf8f4] flex items-center justify-center font-light text-xl rounded-none disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>

                  </div>
                </li>
              )
            })
          )}
        </ul>

      </div>

      {/* ── Cart bar ───────────────────────────────────────────── */}
      <CartBar slug={slug!} />
    </div>
  )
}
