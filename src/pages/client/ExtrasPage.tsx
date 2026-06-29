import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMenuStore } from '../../store/menuStore'
import { useCartStore } from '../../store/cartStore'
import type { Producto, ProductoExtra, TipoVarianteMenu, VarianteMenu } from '../../types'
import { resolveImageUrl } from '../../config'

const SERIF = "'Fraunces', Georgia, serif"

function resolveImages(producto: Producto): string[] {
  if (producto.imagenes && producto.imagenes.length > 0) {
    return producto.imagenes
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map(i => resolveImageUrl(i.url))
  }
  if (producto.imagenUrl) return [producto.imagenUrl]
  return []
}

function isVarianteAvailable(v: VarianteMenu): boolean {
  return v.disponible && (v.stock === null || v.stock > 0)
}

function resolveVarianteActiva(
  tiposSorted: TipoVarianteMenu[],
  variantes: VarianteMenu[],
  selected: Record<number, number>,
): VarianteMenu | null {
  const tipo1 = tiposSorted[0]
  const tipo2 = tiposSorted[1]
  if (!tipo1) return null
  const op1 = selected[tipo1.id]
  if (!op1) return null
  if (tipo2) {
    const op2 = selected[tipo2.id]
    if (!op2) return null
    return variantes.find(v => v.opcion1Id === op1 && v.opcion2Id === op2) ?? null
  }
  return variantes.find(v => v.opcion1Id === op1) ?? null
}

function isOpcionAvailable(
  opcionId: number,
  tipoIndex: number,
  variantes: VarianteMenu[],
  tipo1Selection: number | undefined,
): boolean {
  if (tipoIndex === 0) {
    return variantes.some(v => v.opcion1Id === opcionId && isVarianteAvailable(v))
  }
  if (tipo1Selection !== undefined) {
    return variantes.some(v => v.opcion1Id === tipo1Selection && v.opcion2Id === opcionId && isVarianteAvailable(v))
  }
  return variantes.some(v => v.opcion2Id === opcionId && isVarianteAvailable(v))
}

function getPrecioFinal(v: VarianteMenu): number {
  return v.precioConDescuento ?? v.precio
}

export default function ExtrasPage() {
  const { slug, categoriaId, productoId } = useParams<{
    slug: string
    categoriaId: string
    productoId: string
  }>()
  const navigate = useNavigate()
  const { data, loading, fetchMenu } = useMenuStore()
  const agregarItem = useCartStore(s => s.agregarItem)

  const [selectedExtras, setSelectedExtras] = useState<ProductoExtra[]>([])
  const [cantidad, setCantidad] = useState(1)
  const [imgIndex, setImgIndex] = useState(0)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})
  const [selectedOpciones, setSelectedOpciones] = useState<Record<number, number>>({})

  useEffect(() => {
    if (slug) fetchMenu(slug)
  }, [slug, fetchMenu])

  const menu = slug ? data[slug] : null
  const prodId = productoId ? parseInt(productoId, 10) : null
  const producto = menu?.categorias.flatMap(c => c.productos).find(p => p.id === prodId)
  const isOpen = menu?.local.esActivo ?? true

  if (loading && !producto) {
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

  if (!menu || !producto) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f4] px-8">
        <p
          className="text-base text-[#1a1a1a] text-center"
          style={{ fontFamily: SERIF }}
        >
          Producto no encontrado.
        </p>
      </div>
    )
  }

  const images = resolveImages(producto)
  const activeIndex = Math.min(imgIndex, Math.max(0, images.length - 1))
  const canNavigate = images.length > 1

  // ── Variants ──────────────────────────────────────────────────────────────
  const tieneVariantes = producto.tieneVariantes === true
  const tiposVariante = producto.tiposVariante ?? []
  const variantesMenu = producto.variantes ?? []
  const tiposSorted = [...tiposVariante].sort((a, b) => a.orden - b.orden)
  const tipo1 = tiposSorted[0]

  const varianteActiva = tieneVariantes
    ? resolveVarianteActiva(tiposSorted, variantesMenu, selectedOpciones)
    : null

  const maxCantidad = varianteActiva?.stock != null ? varianteActiva.stock : null

  useEffect(() => {
    if (maxCantidad != null && cantidad > maxCantidad) {
      setCantidad(Math.max(1, maxCantidad))
    }
  }, [varianteActiva?.id])

  function handleSelectOpcion(tipoId: number, opcionId: number, tipoIndex: number) {
    setSelectedOpciones(prev => {
      if (prev[tipoId] === opcionId) {
        const next = { ...prev }
        delete next[tipoId]
        if (tipoIndex === 0 && tiposSorted[1]) delete next[tiposSorted[1].id]
        return next
      }
      const next = { ...prev, [tipoId]: opcionId }
      if (tipoIndex === 0 && tiposSorted[1]) delete next[tiposSorted[1].id]
      return next
    })
  }

  // ── Price ──────────────────────────────────────────────────────────────────
  const toggleExtra = (extra: ProductoExtra) => {
    setSelectedExtras(prev =>
      prev.some(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra]
    )
  }

  const extrasTotal = selectedExtras.reduce((s, e) => s + e.precioAdicional, 0)
  const basePrecio = tieneVariantes
    ? (varianteActiva != null ? getPrecioFinal(varianteActiva) : 0)
    : (producto.precioConDescuento ?? producto.precio ?? 0)
  const precioUnitario = basePrecio + extrasTotal
  const totalItem = precioUnitario * cantidad

  const canAdd = isOpen && (!tieneVariantes || (varianteActiva !== null && isVarianteAvailable(varianteActiva)))

  const handleAgregar = () => {
    if (!canAdd) return
    const precioRaw = tieneVariantes && varianteActiva
      ? varianteActiva.precio
      : (producto.precio ?? 0)
    const precioDesc = tieneVariantes && varianteActiva
      ? varianteActiva.precioConDescuento
      : producto.precioConDescuento
    agregarItem(
      {
        ...producto,
        precio: precioRaw,
        precioConDescuento: precioDesc != null && precioDesc < precioRaw ? precioDesc : undefined,
        porcentajeDescuentoTotal: tieneVariantes && varianteActiva
          ? varianteActiva.porcentajeDescuentoTotal
          : producto.porcentajeDescuentoTotal,
      },
      selectedExtras,
      cantidad,
      varianteActiva?.id,
      varianteActiva?.descripcion,
    )
    navigate(`/${slug}/productos/${categoriaId}`)
  }

  // ── Presentational helpers (no behavior) ────────────────────────────────────
  const prodHasDiscount = !tieneVariantes
    && producto.precioConDescuento != null
    && producto.precioConDescuento < (producto.precio ?? 0)

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#1a1a1a]">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#faf8f4]/95 backdrop-blur-sm border-b border-[#e8e1d4] h-14 flex items-center px-5">
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="text-xl leading-none text-[#1a1a1a] w-8 text-left shrink-0"
        >
          ←
        </button>
        <h1
          className="flex-1 text-center truncate px-2 text-[#1a1a1a]"
          style={{ fontFamily: SERIF, fontSize: '19px', fontWeight: 400, letterSpacing: '0.01em' }}
        >
          {producto.nombre}
        </h1>
        <div className="w-8 shrink-0" />
      </header>

      {/* ── Centered content wrapper ───────────────────────────── */}
      <div className="mx-auto w-full pb-32" style={{ maxWidth: '560px' }}>

        {/* ── Hero / Carousel ──────────────────────────────────── */}
        <div
          className="relative w-full bg-[#ede5d3] overflow-hidden"
          style={{ aspectRatio: '3 / 2' }}
        >
          {images.length === 0 ? (
            <div className="w-full h-full" />
          ) : (
            <>
              {imgErrors[activeIndex] ? (
                <div className="w-full h-full" />
              ) : (
                <img
                  key={activeIndex}
                  src={images[activeIndex]}
                  alt={producto.nombre}
                  onError={() => setImgErrors(prev => ({ ...prev, [activeIndex]: true }))}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                />
              )}

              {canNavigate && (
                <>
                  <button
                    onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                    aria-label="Anterior"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#faf8f4]/85 backdrop-blur-sm text-[#1a1a1a] flex items-center justify-center text-lg leading-none"
                    style={{ borderRadius: 0 }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setImgIndex(i => (i + 1) % images.length)}
                    aria-label="Siguiente"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#faf8f4]/85 backdrop-blur-sm text-[#1a1a1a] flex items-center justify-center text-lg leading-none"
                    style={{ borderRadius: 0 }}
                  >
                    ›
                  </button>
                </>
              )}

              {canNavigate && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIndex(i)}
                      aria-label={`Imagen ${i + 1}`}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: i === activeIndex ? '#1a1a1a' : '#c9bfae' }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Product info ─────────────────────────────────────── */}
        <div className="px-6 pt-7 pb-5 border-b border-[#e8e1d4]">
          <h2
            className="leading-tight text-[#1a1a1a]"
            style={{ fontFamily: SERIF, fontSize: '27px', fontWeight: 400, letterSpacing: '0.01em' }}
          >
            {producto.nombre}
          </h2>
          {producto.descripcion && (
            <p className="text-[14px] text-[#6b6258] mt-2 leading-relaxed">
              {producto.descripcion}
            </p>
          )}

          {/* Precio: solo para productos SIN variantes (con variantes el precio
              aparece dinámicamente en el CTA según la opción elegida) */}
          {!tieneVariantes && (
            prodHasDiscount ? (
              <div className="mt-4 flex items-baseline gap-2.5">
                <span
                  className="font-mono tabular-nums font-bold"
                  style={{ color: '#73223a', fontSize: '22px' }}
                >
                  ${producto.precioConDescuento!.toLocaleString('es-AR')}
                </span>
                <span className="font-mono tabular-nums text-[13px] text-[#6b6258] line-through">
                  ${(producto.precio ?? 0).toLocaleString('es-AR')}
                </span>
              </div>
            ) : (
              <p className="mt-4 font-mono tabular-nums font-medium text-[#1a1a1a]" style={{ fontSize: '22px' }}>
                ${(producto.precio ?? 0).toLocaleString('es-AR')}
              </p>
            )
          )}

          {/* Avisos de stock de la variante activa (feedback de comportamiento) */}
          {tieneVariantes && varianteActiva && !isVarianteAvailable(varianteActiva) && (
            <p className="text-[13px] mt-3" style={{ color: '#a92020', fontStyle: 'italic' }}>
              Agotado
            </p>
          )}
          {tieneVariantes && varianteActiva && isVarianteAvailable(varianteActiva) &&
            varianteActiva.stock !== null && varianteActiva.stock <= 3 && (
            <p className="text-[12px] mt-2" style={{ color: '#a16207' }}>
              Últimas {varianteActiva.stock} unidades
            </p>
          )}
        </div>

        {/* ── Variantes ──────────────────────────────────────────── */}
        {tieneVariantes && tiposSorted.length > 0 && (
          <div className="px-6 py-6 border-b border-[#e8e1d4]">
            {tiposSorted.map((tipo, tipoIndex) => {
              const opcionesSorted = [...tipo.opciones].sort((a, b) => a.orden - b.orden)
              const tipo1Selection = tipo1 ? selectedOpciones[tipo1.id] : undefined
              return (
                <div key={tipo.id} className="mb-6 last:mb-0">
                  <p className="text-[10px] font-medium text-[#6b6258] uppercase mb-3" style={{ letterSpacing: '0.2em' }}>
                    {tipo.nombre}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {opcionesSorted.map(opcion => {
                      const available = isOpcionAvailable(opcion.id, tipoIndex, variantesMenu, tipo1Selection)
                      const isSelected = selectedOpciones[tipo.id] === opcion.id
                      return (
                        <button
                          key={opcion.id}
                          type="button"
                          disabled={!available}
                          onClick={() => handleSelectOpcion(tipo.id, opcion.id, tipoIndex)}
                          className={`px-4 py-2.5 text-[13px] font-medium rounded-none border transition-colors ${
                            !available
                              ? 'border-[#e8e1d4] text-[#6b6258] opacity-30 cursor-not-allowed bg-[#faf8f4]'
                              : isSelected
                                ? 'bg-[#1a1a1a] text-[#faf8f4] border-[#1a1a1a]'
                                : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#ede5d3]/30'
                          }`}
                        >
                          {!available ? <s>{opcion.valor}</s> : opcion.valor}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Extras ─────────────────────────────────────────────── */}
        {producto.extras.length > 0 && (
          <div className="px-6 py-6 border-b border-[#e8e1d4]">
            <p className="text-[10px] font-medium text-[#6b6258] uppercase mb-4" style={{ letterSpacing: '0.2em' }}>
              Extras · Opcional
            </p>
            <ul>
              {producto.extras.map((extra, idx) => {
                const checked = selectedExtras.some(e => e.id === extra.id)
                const isLast = idx === producto.extras.length - 1
                return (
                  <li key={extra.id}>
                    <label
                      className={`flex items-center justify-between py-3 cursor-pointer ${
                        isLast ? '' : 'border-b border-[#e8e1d4]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleExtra(extra)}
                          className="sr-only"
                        />
                        <span
                          className="w-[18px] h-[18px] shrink-0 flex items-center justify-center"
                          style={{
                            border: '1.5px solid #1a1a1a',
                            backgroundColor: checked ? '#1a1a1a' : '#ffffff',
                          }}
                        >
                          {checked && (
                            <span className="block w-[7px] h-[7px]" style={{ backgroundColor: '#faf8f4' }} />
                          )}
                        </span>
                        <span className="text-[14px] text-[#1a1a1a] truncate">{extra.nombre}</span>
                      </div>
                      {extra.precioAdicional > 0 ? (
                        <span className="text-[13px] text-[#6b6258] font-mono tabular-nums shrink-0 ml-3">
                          +${extra.precioAdicional.toLocaleString('es-AR')}
                        </span>
                      ) : (
                        <span className="text-[13px] text-[#6b6258] shrink-0 ml-3" style={{ fontStyle: 'italic' }}>
                          Sin costo
                        </span>
                      )}
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* ── Cantidad ───────────────────────────────────────────── */}
        <div className="px-6 py-6 flex items-center justify-between border-b border-[#e8e1d4]">
          <p className="text-[10px] font-medium text-[#6b6258] uppercase" style={{ letterSpacing: '0.2em' }}>
            Cantidad
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCantidad(q => Math.max(1, q - 1))}
              disabled={cantidad <= 1}
              aria-label="Restar"
              className="w-9 h-9 border border-[#1a1a1a] bg-white text-[#1a1a1a] font-mono text-lg leading-none flex items-center justify-center rounded-none disabled:opacity-30 disabled:cursor-not-allowed"
            >
              −
            </button>
            <span className="min-w-9 text-center font-mono tabular-nums text-[18px] font-medium">
              {cantidad}
            </span>
            <button
              onClick={() => setCantidad(q => maxCantidad != null ? Math.min(q + 1, maxCantidad) : q + 1)}
              disabled={maxCantidad != null && cantidad >= maxCantidad}
              aria-label="Sumar"
              className="w-9 h-9 border border-[#1a1a1a] bg-white text-[#1a1a1a] font-mono text-lg leading-none flex items-center justify-center rounded-none disabled:opacity-30 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>

      </div>

      {/* ── CTA Agregar al carrito (fixed) ─────────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[#e8e1d4] px-5 py-3 flex items-center justify-between gap-4">
        {canAdd ? (
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-medium text-[#6b6258] uppercase mb-1" style={{ letterSpacing: '0.2em' }}>
              Total
            </span>
            <span className="font-mono tabular-nums font-bold text-[17px] text-[#1a1a1a]">
              ${totalItem.toLocaleString('es-AR')}
            </span>
          </div>
        ) : (
          <span className="text-[13px] text-[#6b6258]" style={{ fontStyle: 'italic' }}>
            {!isOpen
              ? 'Local cerrado'
              : tieneVariantes && varianteActiva && !isVarianteAvailable(varianteActiva)
                ? 'Agotado'
                : tieneVariantes && !varianteActiva
                  ? 'Seleccioná una variante'
                  : 'No disponible'}
          </span>
        )}
        <button
          onClick={handleAgregar}
          disabled={!canAdd}
          className="px-6 py-3 text-[12px] font-medium uppercase rounded-none text-[#faf8f4] bg-[#73223a] hover:bg-[#651d33] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ letterSpacing: '0.15em' }}
        >
          Agregar al carrito
        </button>
      </footer>
    </div>
  )
}
