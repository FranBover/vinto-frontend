import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMenuStore } from '../../store/menuStore'
import { useCartStore } from '../../store/cartStore'
import type { Producto, ProductoExtra } from '../../types'
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

  const toggleExtra = (extra: ProductoExtra) => {
    setSelectedExtras(prev =>
      prev.some(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra]
    )
  }

  const extrasTotal = selectedExtras.reduce((s, e) => s + e.precioAdicional, 0)
  const precioUnitario = producto.precio + extrasTotal
  const totalItem = precioUnitario * cantidad

  const handleAgregar = () => {
    agregarItem(producto, selectedExtras, cantidad)
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

              {/* Arrows */}
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

              {/* Dots */}
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

        {/* Responsive height override for desktop */}
        <style>{`@media (min-width: 768px) { .product-hero { height: 380px !important; } }`}</style>

        {/* Product info */}
        <div className="px-4 py-5 border-b border-[#e8e8e8]">
          <h2 className="font-bold text-xl leading-tight">{producto.nombre}</h2>
          {producto.descripcion && (
            <p className="text-sm text-[#666] mt-1.5 leading-relaxed">
              {producto.descripcion}
            </p>
          )}
          <p className="font-bold text-base mt-3">
            ${producto.precio.toLocaleString('es-AR')}
          </p>
        </div>

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
        style={{ backgroundColor: isOpen ? '#2d5a27' : '#999' }}
      >
        <button
          onClick={isOpen ? handleAgregar : undefined}
          disabled={!isOpen}
          className="w-full flex items-center justify-between px-4 py-4 disabled:cursor-not-allowed"
        >
          <span className="font-bold text-sm">
            {isOpen ? 'Agregar al pedido' : 'Local cerrado'}
          </span>
          <span className="font-bold">${totalItem.toLocaleString('es-AR')}</span>
        </button>
      </div>
    </div>
  )
}
