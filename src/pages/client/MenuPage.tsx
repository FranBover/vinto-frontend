import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMenuStore } from '../../store/menuStore'
import { useCartStore } from '../../store/cartStore'
import { BASE_URL, WHATSAPP_URL } from '../../config'
import CartBar from '../../components/client/CartBar'
import BannerDescuentos from '../../components/client/BannerDescuentos'

const SERIF = "'Fraunces', Georgia, serif"

export default function MenuPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data, loading, error, fetchMenu, clearCache } = useMenuStore()
  const asegurarSlug = useCartStore(s => s.asegurarSlug)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    if (slug) fetchMenu(slug)
  }, [slug, fetchMenu])

  useEffect(() => {
    if (slug) asegurarSlug(slug)
  }, [slug, asegurarSlug])

  const menu = slug ? data[slug] : null

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

  if (error || !menu) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f4] px-8 gap-6">
        <p
          className="text-base text-[#1a1a1a] text-center"
          style={{ fontFamily: SERIF }}
        >
          {error ?? 'Menú no disponible.'}
        </p>
        <button
          onClick={() => { clearCache(); if (slug) fetchMenu(slug) }}
          className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#73223a] underline underline-offset-4"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const { local, categorias, descuentosPedidoCompleto } = menu
  const isOpen = local.esActivo
  const logoSrc = local.logoImagenUrl || local.logoUrl

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#1a1a1a] pb-24">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#faf8f4]/95 backdrop-blur-sm border-b border-[#e8e1d4] h-14 flex items-center justify-between px-5">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menú"
          className="flex flex-col gap-[5px] p-1"
        >
          <span className="block w-5 h-px bg-[#1a1a1a]" />
          <span className="block w-5 h-px bg-[#1a1a1a]" />
          <span className="block w-5 h-px bg-[#1a1a1a]" />
        </button>

        <div className="w-9 h-9 overflow-hidden rounded-full shrink-0">
          {logoSrc && !logoError ? (
            <img
              src={logoSrc}
              alt={local.nombreLocal}
              className="w-full h-full object-cover"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div
              className="w-full h-full bg-[#ede5d3] text-[#3d2817] flex items-center justify-center select-none"
              style={{ fontFamily: SERIF, fontSize: '14px', fontWeight: 500 }}
            >
              {local.nombreLocal.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="w-7" />
      </header>

      {/* ── Drawer overlay ──────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Drawer ──────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-full w-[280px] bg-[#faf8f4] text-[#1a1a1a] z-50 flex flex-col transition-transform duration-300 border-r border-[#e8e1d4] ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8e1d4]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 overflow-hidden rounded-full">
              {logoSrc && !logoError ? (
                <img
                  src={logoSrc}
                  alt={local.nombreLocal}
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div
                  className="w-full h-full bg-[#ede5d3] text-[#3d2817] flex items-center justify-center select-none"
                  style={{ fontFamily: SERIF, fontSize: '14px', fontWeight: 500 }}
                >
                  {local.nombreLocal.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <p
              className="leading-tight truncate"
              style={{ fontFamily: SERIF, fontSize: '16px', fontWeight: 400, letterSpacing: '0.01em' }}
            >
              {local.nombreLocal}
            </p>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar"
            className="text-[#6b6258] text-2xl leading-none hover:text-[#1a1a1a] shrink-0 ml-2"
          >
            ×
          </button>
        </div>

        <nav className="flex flex-col py-2">
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-left px-6 py-4 text-[11px] font-medium tracking-[0.2em] uppercase border-b border-[#e8e1d4] hover:bg-[#ede5d3]/40 transition-colors"
          >
            Inicio
          </button>
          <button
            onClick={() => { setInfoOpen(true); setDrawerOpen(false) }}
            className="text-left px-6 py-4 text-[11px] font-medium tracking-[0.2em] uppercase border-b border-[#e8e1d4] hover:bg-[#ede5d3]/40 transition-colors"
          >
            Información
          </button>
          {(local.ubicacionUrl || local.direccion) && (
            <a
              href={local.ubicacionUrl ?? `https://www.google.com/maps/search/?q=${encodeURIComponent(local.direccion)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setDrawerOpen(false)}
              className="px-6 py-4 text-[11px] font-medium tracking-[0.2em] uppercase border-b border-[#e8e1d4] hover:bg-[#ede5d3]/40 transition-colors"
            >
              Ubicación ↗
            </a>
          )}
        </nav>

        {/* ── Promo Vinto (footer del drawer) ─────────────────── */}
        <div className="mt-auto border-t border-[#e8e1d4] px-6 py-5">
          <p className="text-sm text-[#6b6258] mb-3" style={{ lineHeight: 1.5 }}>
            ¿Tenés un negocio?
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[11px] font-medium uppercase tracking-[0.18em] text-[#73223a] underline underline-offset-4 decoration-1 decoration-[#e8e1d4] hover:decoration-[#73223a] transition-colors"
          >
            Quiero una tienda →
          </a>
        </div>
      </aside>

      {/* ── Centered content wrapper (mobile-first + desktop centered column) ── */}
      <div className="mx-auto" style={{ maxWidth: '560px' }}>

        {/* ── Title block (hero) ────────────────────────────── */}
        <div className="pt-10 pb-2 px-6 text-center">
          <h1
            className="leading-none text-[#1a1a1a] break-words"
            style={{ fontFamily: SERIF, fontSize: '44px', fontWeight: 400, letterSpacing: '0.03em', margin: 0 }}
          >
            {local.nombreLocal}
          </h1>
          {/* Accent decorative line — borgoña */}
          <div className="mx-auto mt-5" style={{ width: '28px', height: '1.5px', backgroundColor: '#73223a' }} />
        </div>

        {/* ── Status (sin banner, como eyebrow editorial) ───── */}
        <div className="text-center pb-8 pt-5 px-6">
          <span
            className="text-[10px] font-medium uppercase"
            style={{ color: isOpen ? '#2d5a27' : '#a92020', letterSpacing: '0.28em' }}
          >
            {isOpen ? 'Abierto ahora' : 'Cerrado por ahora'}
          </span>
        </div>

        {/* ── Discount banner (componente intacto) ──────────── */}
        {descuentosPedidoCompleto && descuentosPedidoCompleto.length > 0 && (
          <BannerDescuentos descuentos={descuentosPedidoCompleto} />
        )}

        {/* ── Category list ─────────────────────────────────── */}
        <div>
          {categorias.map((cat) => {
            const count = cat.productos.length
            const disabled = !isOpen
            const imgSrc = cat.imagenUrl ? BASE_URL + cat.imagenUrl : null

            return (
              <button
                key={cat.id}
                disabled={disabled}
                onClick={() => navigate(`/${slug}/productos/${cat.id}`)}
                className={`block w-full text-left border-t border-[#e8e1d4] ${
                  disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-[#ede5d3]/20 active:bg-[#ede5d3]/40 transition-colors'
                }`}
              >
                <div
                  className="w-full flex items-center justify-center overflow-hidden"
                  style={{ aspectRatio: '3 / 2' }}
                >
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={cat.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center px-4"
                      style={{ backgroundColor: '#ede5d3' }}
                    >
                      <span
                        className="select-none text-[#3d2817] text-center break-words"
                        style={{
                          fontFamily: SERIF,
                          fontSize: '36px',
                          fontStyle: 'italic',
                          fontWeight: 400,
                          letterSpacing: '-0.01em',
                          lineHeight: 1,
                        }}
                      >
                        {cat.nombre}
                      </span>
                    </div>
                  )}
                </div>
                <div className="px-6 py-5 text-center">
                  <h2
                    className="text-[#1a1a1a]"
                    style={{ fontFamily: SERIF, fontSize: '24px', fontWeight: 400, letterSpacing: '0.01em', margin: 0 }}
                  >
                    {cat.nombre}
                  </h2>
                  <p
                    className="text-[10px] uppercase mt-2.5 font-medium"
                    style={{ color: '#6b6258', letterSpacing: '0.2em' }}
                  >
                    {count} producto{count !== 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

      </div>

      {/* ── Promo Vinto (footer promocional) ──────────────────── */}
      <div className="mx-auto px-5 py-14 text-center border-t border-[#e8e1d4]" style={{ maxWidth: '480px' }}>
        <p className="text-[#6b6258] mb-4" style={{ fontSize: '14px', lineHeight: 1.6 }}>
          ¿Tenés un negocio y querés vender así?
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[11px] font-medium uppercase tracking-[0.18em] text-[#73223a] underline underline-offset-4 decoration-1 decoration-[#e8e1d4] hover:decoration-[#73223a] transition-colors"
        >
          Quiero una tienda →
        </a>
      </div>

      {/* ── Info modal ────────────────────────────────────────── */}
      {infoOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-[#faf8f4] w-full sm:w-auto sm:min-w-[380px] sm:mx-6 border border-[#e8e1d4]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8e1d4]">
              <h2
                className="text-[#1a1a1a]"
                style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 400, letterSpacing: '0.02em', margin: 0 }}
              >
                {local.nombreLocal}
              </h2>
              <button
                onClick={() => setInfoOpen(false)}
                aria-label="Cerrar"
                className="text-[#6b6258] text-2xl leading-none hover:text-[#1a1a1a]"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-6 space-y-5">
              <div>
                <p className="text-[10px] font-medium uppercase text-[#6b6258] mb-2" style={{ letterSpacing: '0.2em' }}>
                  Teléfono / WhatsApp
                </p>
                {local.linkWhatsapp ? (
                  <a
                    href={local.linkWhatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#73223a] underline underline-offset-4 text-sm"
                  >
                    {local.telefono}
                  </a>
                ) : (
                  <p className="text-sm text-[#1a1a1a]">{local.telefono}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase text-[#6b6258] mb-2" style={{ letterSpacing: '0.2em' }}>
                  Dirección
                </p>
                <p className="text-sm text-[#1a1a1a]">{local.direccion}</p>
              </div>
              {local.ubicacionUrl && (
                <div>
                  <a
                    href={local.ubicacionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#73223a] underline underline-offset-4"
                  >
                    Ver en Maps →
                  </a>
                </div>
              )}
              {local.horarios && (
                <div>
                  <p className="text-[10px] font-medium uppercase text-[#6b6258] mb-2" style={{ letterSpacing: '0.2em' }}>
                    Horarios
                  </p>
                  <p className="text-sm text-[#1a1a1a] whitespace-pre-line">{local.horarios}</p>
                </div>
              )}
            </div>
            <div className="px-6 pb-6 pt-2">
              <button
                onClick={() => setInfoOpen(false)}
                className="w-full bg-[#1a1a1a] text-[#faf8f4] py-3.5 text-[11px] font-medium tracking-[0.2em] uppercase"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cart bar (componente intacto) ────────────────────── */}
      <CartBar slug={slug!} />
    </div>
  )
}
