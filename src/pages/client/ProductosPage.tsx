import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMenuStore } from '../../store/menuStore'
import CartBar from '../../components/client/CartBar'

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
  const productos = menu?.productos.filter(p => p.categoriaId === catId && p.disponible) ?? []

  if (loading && !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm text-[#999]">Cargando…</p>
      </div>
    )
  }

  if (!menu || !categoria) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-8">
        <p className="text-sm text-center">Categoría no encontrada.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans pb-20">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#1a1a1a] h-14 flex items-center gap-4 px-4">
        <button
          onClick={() => navigate(`/${slug}`)}
          aria-label="Volver"
          className="font-bold text-base leading-none"
        >
          ←
        </button>
        <h1 className="font-bold text-[15px] flex-1 truncate">{categoria.nombre}</h1>
      </header>

      {/* ── Product list ───────────────────────────────────────── */}
      <ul>
        {productos.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-[#999]">
            No hay productos disponibles en esta categoría.
          </li>
        ) : (
          productos.map(producto => (
            <li key={producto.id} className="border-b border-[#e8e8e8]">
              <div className="flex items-start justify-between gap-4 px-4 py-5">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[15px] leading-tight">{producto.nombre}</p>
                  {producto.descripcion && (
                    <p className="text-sm text-[#888] mt-1 leading-snug line-clamp-2">
                      {producto.descripcion}
                    </p>
                  )}
                  <p className="font-bold text-sm mt-2">
                    ${producto.precio.toLocaleString('es-AR')}
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigate(`/${slug}/productos/${categoriaId}/${producto.id}`)
                  }
                  aria-label={`Agregar ${producto.nombre}`}
                  className="shrink-0 w-9 h-9 bg-[#1a1a1a] text-white flex items-center justify-center font-bold text-xl rounded-none self-end"
                >
                  +
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      {/* ── Cart bar ───────────────────────────────────────────── */}
      <CartBar slug={slug!} />
    </div>
  )
}
