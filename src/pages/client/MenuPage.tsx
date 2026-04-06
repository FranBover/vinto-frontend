import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMenuStore } from '../../store/menuStore'
import CartBar from '../../components/client/CartBar'

export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data, loading, error, fetchMenu, clearCache } = useMenuStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  useEffect(() => {
    if (slug) fetchMenu(slug)
  }, [slug, fetchMenu])

  const menu = slug ? data[slug] : null

  if (loading && !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm text-[#999]">Cargando menú…</p>
      </div>
    )
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-8 gap-4">
        <p className="text-sm text-[#1a1a1a] text-center">
          {error ?? 'Menú no disponible.'}
        </p>
        <button
          onClick={() => { clearCache(); if (slug) fetchMenu(slug) }}
          className="text-sm font-bold underline text-[#2d5a27]"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const { local, categorias } = menu
  const isOpen = local.esActivo

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans pb-20">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#1a1a1a] h-14 flex items-center justify-between px-4">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menú"
          className="flex flex-col gap-[5px] p-1"
        >
          <span className="block w-5 h-px bg-[#1a1a1a]" />
          <span className="block w-5 h-px bg-[#1a1a1a]" />
          <span className="block w-5 h-px bg-[#1a1a1a]" />
        </button>

        <div className="w-10 h-10 overflow-hidden shrink-0">
          {local.logoUrl ? (
            <img
              src={local.logoUrl}
              alt={local.nombreLocal}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#1a1a1a] text-white flex items-center justify-center font-bold text-base select-none">
              {local.nombreLocal.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="w-7" />
      </header>

      {/* ── Drawer overlay ─────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Drawer ─────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-full w-[280px] bg-[#1a1a1a] text-white z-50 flex flex-col transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 shrink-0 overflow-hidden">
              {local.logoUrl ? (
                <img
                  src={local.logoUrl}
                  alt={local.nombreLocal}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white text-[#1a1a1a] flex items-center justify-center font-bold text-sm select-none">
                  {local.nombreLocal.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <p className="font-bold text-sm leading-tight">{local.nombreLocal}</p>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar"
            className="text-white/50 text-2xl leading-none hover:text-white"
          >
            ×
          </button>
        </div>

        <nav className="flex flex-col py-2">
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-left px-5 py-4 text-sm font-bold border-b border-white/10 hover:bg-white/5 transition-colors"
          >
            Inicio
          </button>
          <button
            onClick={() => { setInfoOpen(true); setDrawerOpen(false) }}
            className="text-left px-5 py-4 text-sm font-bold border-b border-white/10 hover:bg-white/5 transition-colors"
          >
            Información
          </button>
          {(local.ubicacionUrl || local.direccion) && (
            <a
              href={local.ubicacionUrl ?? `https://www.google.com/maps/search/?q=${encodeURIComponent(local.direccion)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setDrawerOpen(false)}
              className="px-5 py-4 text-sm font-bold border-b border-white/10 hover:bg-white/5 transition-colors"
            >
              Ubicación ↗
            </a>
          )}
        </nav>
      </aside>

      {/* ── Status banner ──────────────────────────────────────── */}
      {isOpen ? (
        <div className="bg-[#eaf4e8] text-[#2d5a27] text-center py-2.5 text-[11px] font-bold tracking-widest uppercase">
          Abierto ahora
        </div>
      ) : (
        <div className="bg-[#1a1a1a] text-white text-center py-2.5 text-[11px] font-bold tracking-widest uppercase">
          Cerrado por ahora · Volvemos pronto
        </div>
      )}

      {/* ── Category list ──────────────────────────────────────── */}
      <ul>
        {categorias.map((cat, idx) => {
          const count = cat.productos.length
          const disabled = !isOpen

          return (
            <li key={cat.id}>
              <button
                disabled={disabled}
                onClick={() => navigate(`/${slug}/productos/${cat.id}`)}
                className={`w-full flex items-center gap-4 px-4 py-5 border-b border-[#e8e8e8] text-left ${
                  disabled
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-[#f9f9f9] active:bg-[#f0f0f0] transition-colors'
                }`}
              >
                <span className="text-[11px] font-bold text-[#bbb] w-5 shrink-0 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[15px] leading-tight">{cat.nombre}</p>
                  <p className="text-xs text-[#999] mt-0.5">
                    {count} producto{count !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="font-bold text-base shrink-0">→</span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* ── Info modal ─────────────────────────────────────────── */}
      {infoOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:w-auto sm:min-w-[380px] sm:mx-6">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
              <h2 className="font-bold text-base">{local.nombreLocal}</h2>
              <button
                onClick={() => setInfoOpen(false)}
                className="text-[#aaa] text-2xl leading-none hover:text-[#1a1a1a]"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-5 space-y-5">
              <div>
                <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5">
                  Teléfono / WhatsApp
                </p>
                {local.linkWhatsapp ? (
                  <a
                    href={local.linkWhatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#2d5a27] underline text-sm"
                  >
                    {local.telefono}
                  </a>
                ) : (
                  <p className="text-sm font-bold">{local.telefono}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5">
                  Dirección
                </p>
                <p className="text-sm">{local.direccion}</p>
              </div>
              {local.ubicacionUrl && (
                <div>
                  <a
                    href={local.ubicacionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-[#2d5a27] underline"
                  >
                    Ver en Maps →
                  </a>
                </div>
              )}
              {local.horarios && (
                <div>
                  <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5">
                    Horarios
                  </p>
                  <p className="text-sm whitespace-pre-line">{local.horarios}</p>
                </div>
              )}
            </div>
            <div className="px-5 pb-6 pt-2">
              <button
                onClick={() => setInfoOpen(false)}
                className="w-full bg-[#1a1a1a] text-white py-3.5 font-bold text-sm rounded-none"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cart bar ───────────────────────────────────────────── */}
      <CartBar slug={slug!} />
    </div>
  )
}
