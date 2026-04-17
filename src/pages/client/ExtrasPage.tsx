import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMenuStore } from '../../store/menuStore'
import { useCartStore } from '../../store/cartStore'
import type { Producto, ProductoExtra, TipoVarianteMenu, VarianteMenu } from '../../types'
import { BASE_URL } from '../../config'

function resolveImages(producto: Producto): string[] {
  if (producto.imagenes && producto.imagenes.length > 0) {
    return producto.imagenes
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map(i => BASE_URL + i.url)
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

export default function ExtrasPage() {
  const { slug, categoriaId, productoId } = useParams<{
    slug: string
    categoriaId: string
    productoId: string
  }>()
  const navigate = useNavigate()
  const { data, fetchMenu } = useMenuStore()
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

  if (!menu || !producto) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm text-[#999]">Producto no encontrado.</p>
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

  const variantesDisponibles = variantesMenu.filter(isVarianteAvailable)
  const minPrecioVariantes = variantesDisponibles.length > 0
    ? Math.min(...variantesDisponibles.map(v => v.precio))
    : 0

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
    ? (varianteActiva?.precio ?? 0)
    : (producto.precio ?? 0)
  const precioUnitario = basePrecio + extrasTotal
  const totalItem = precioUnitario * cantidad

  const precioDisplay = tieneVariantes
    ? varianteActiva
      ? `$${varianteActiva.precio.toLocaleString('es-AR')}`
      : variantesDisponibles.length > 0
        ? `Desde $${minPrecioVariantes.toLocaleString('es-AR')}`
        : 'Agotado'
    : `$${(producto.precio ?? 0).toLocaleString('es-AR')}`

  const canAdd = isOpen && (!tieneVariantes || (varianteActiva !== null && isVarianteAvailable(varianteActiva)))

  const handleAgregar = () => {
    if (!canAdd) return
    const precioFinal = tieneVariantes && varianteActiva
      ? varianteActiva.precio
      : (producto.precio ?? 0)
    agregarItem(
      { ...producto, precio: precioFinal },
      selectedExtras,
      cantidad,
      varianteActiva?.id,
      varianteActiva?.descripcion,
    )
    navigate(`/${slug}/productos/${categoriaId}`)
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans flex flex-col">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#1a1a1a] h-14 flex items-center gap-4 px-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="font-bold text-base leading-none"
        >
          ←
        </button>
        <h1 className="font-bold text-[15px] flex-1 truncate">{producto.nombre}</h1>
      </header>

      {/* ── Scrollable content ─────────────────────────────────── */}
      <div className="flex-1 overflow-auto pb-24">

        {/* Hero / Carousel */}
        <div
          className="product-hero relative w-full bg-[#f5f5f5] overflow-hidden"
          style={{ height: 260 }}
        >
          {images.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl select-none" role="img" aria-label="Plato">🍽️</span>
            </div>
          ) : (
            <>
              {imgErrors[activeIndex] ? (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl select-none" role="img" aria-label="Plato">🍽️</span>
                </div>
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white flex items-center justify-center"
                    style={{ borderRadius: 0 }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setImgIndex(i => (i + 1) % images.length)}
                    aria-label="Siguiente"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white flex items-center justify-center"
                    style={{ borderRadius: 0 }}
                  >
                    ›
                  </button>
                </>
              )}

              {canNavigate && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIndex(i)}
                      aria-label={`Imagen ${i + 1}`}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: i === activeIndex ? '#1a1a1a' : '#ccc' }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <style>{`@media (min-width: 768px) { .product-hero { height: 380px !important; } }`}</style>

        {/* Product info */}
        <div className="px-4 py-5 border-b border-[#e8e8e8]">
          <h2 className="font-bold text-xl leading-tight">{producto.nombre}</h2>
          {producto.descripcion && (
            <p className="text-sm text-[#666] mt-1.5 leading-relaxed">
              {producto.descripcion}
            </p>
          )}
          <p className="font-bold text-base mt-3">{precioDisplay}</p>
        </div>

        {/* ── Variantes ──────────────────────────────────────────── */}
        {tieneVariantes && tiposSorted.length > 0 && (
          <>
            {tiposSorted.map((tipo, tipoIndex) => {
              const opcionesSorted = [...tipo.opciones].sort((a, b) => a.orden - b.orden)
              const tipo1Selection = tipo1 ? selectedOpciones[tipo1.id] : undefined
              return (
                <div key={tipo.id} className="px-4 py-4 border-b border-[#e8e8e8]">
                  <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-3">
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
                          className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-none ${
                            !available
                              ? 'bg-[#e0e0e0] text-[#999] cursor-not-allowed'
                              : isSelected
                                ? 'text-white'
                                : 'bg-[#f0f0f0] text-[#1a1a1a]'
                          }`}
                          style={isSelected && available ? { backgroundColor: '#2d5a27' } : undefined}
                        >
                          {!available
                            ? <s>{opcion.valor}</s>
                            : opcion.valor}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* Extras */}
        {producto.extras.length > 0 && (
          <>
            <div className="px-4 py-3 border-b border-[#e8e8e8]">
              <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">
                Extras
              </p>
            </div>
            <ul>
              {producto.extras.map(extra => {
                const checked = selectedExtras.some(e => e.id === extra.id)
                return (
                  <li key={extra.id}>
                    <label className="flex items-center justify-between px-4 py-4 border-b border-[#e8e8e8] cursor-pointer hover:bg-[#f9f9f9]">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleExtra(extra)}
                          className="w-5 h-5 accent-[#2d5a27]"
                        />
                        <span className="text-sm font-medium">{extra.nombre}</span>
                      </div>
                      <span className="text-sm text-[#666]">
                        +${extra.precioAdicional.toLocaleString('es-AR')}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        {/* Quantity */}
        <div className="px-4 py-5 flex items-center justify-between border-b border-[#e8e8e8]">
          <p className="font-bold text-sm">Cantidad</p>
          <div className="flex items-center gap-0">
            <button
              onClick={() => setCantidad(q => Math.max(1, q - 1))}
              className="w-10 h-10 bg-[#f0f0f0] text-[#1a1a1a] font-bold text-lg flex items-center justify-center rounded-none"
            >
              −
            </button>
            <span className="w-12 text-center font-bold text-base tabular-nums">
              {cantidad}
            </span>
            <button
              onClick={() => setCantidad(q => q + 1)}
              className="w-10 h-10 bg-[#f0f0f0] text-[#1a1a1a] font-bold text-lg flex items-center justify-center rounded-none"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* ── Agregar bar ────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 text-white"
        style={{ backgroundColor: canAdd ? '#2d5a27' : '#999' }}
      >
        <button
          onClick={handleAgregar}
          disabled={!canAdd}
          className="w-full flex items-center justify-between px-4 py-4 disabled:cursor-not-allowed"
        >
          <span className="font-bold text-sm">
            {!isOpen
              ? 'Local cerrado'
              : tieneVariantes && !varianteActiva
                ? 'Seleccioná una variante'
                : 'Agregar al pedido'}
          </span>
          {canAdd && (
            <span className="font-bold">${totalItem.toLocaleString('es-AR')}</span>
          )}
        </button>
      </div>
    </div>
  )
}
