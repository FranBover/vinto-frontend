import { useEffect, useState, type SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import { WHATSAPP_URL, DEMO_URL } from '../../config'
import { Reveal } from '../../hooks/useReveal'

const SERIF = "'Fraunces', Georgia, serif"

const FEATURES: { titulo: string; desc: string }[] = [
  { titulo: 'Tu catálogo online en minutos', desc: 'Productos con foto, descripción y precio, organizados por categoría. Lo cargás una vez y lo editás cuando quieras.' },
  { titulo: 'El pedido te llega listo por WhatsApp', desc: 'Con los productos, la dirección, la forma de pago y el vuelto calculado. No anotás nada a mano.' },
  { titulo: 'Cobrá con tarjeta sin poner un posnet', desc: 'MercadoPago integrado. El dinero entra directo a tu cuenta: no pasa por Vinto.' },
  { titulo: 'Tu cliente entra y pide. Nada más.', desc: 'Sin registro, sin contraseñas, sin descargar una app. Menos pasos, menos pedidos abandonados.' },
  { titulo: 'Gestionás todo desde el celular', desc: 'Pedidos en vivo, cambios de precio, productos sin stock. Desde donde estés.' },
]

const EXTRAS: { titulo: string; desc: string }[] = [
  { titulo: 'Descuentos y cupones', desc: 'Descuentos por producto o categoría, y cupones con código.' },
  { titulo: 'Estadísticas', desc: 'Tus ventas y tus productos más vendidos, en tiempo real.' },
]

const STEPS: { num: string; titulo: string; desc: string }[] = [
  { num: '1', titulo: 'Hablamos', desc: 'Me escribís por WhatsApp y vemos qué necesita tu negocio.' },
  { num: '2', titulo: 'Te configuramos', desc: 'Cargamos tu catálogo, tu logo, tus datos de pago.' },
  { num: '3', titulo: 'Empezás a vender', desc: 'Compartís tu link (vintoapp.com/tu-negocio) en redes o en tu perfil de WhatsApp y empezás a recibir pedidos.' },
]

function DemoPhone() {
  const [montar, setMontar] = useState(false)
  const [cargado, setCargado] = useState(false)

  // Montar el iframe recién después del load de la landing para no competir con el render inicial
  useEffect(() => {
    if (document.readyState === 'complete') {
      const t = window.setTimeout(() => setMontar(true), 0)
      return () => window.clearTimeout(t)
    }
    const onLoad = () => setMontar(true)
    window.addEventListener('load', onLoad, { once: true })
    return () => window.removeEventListener('load', onLoad)
  }, [])

  const handleLoad = (e: SyntheticEvent<HTMLIFrameElement>) => {
    setCargado(true)
    // Mismo origen: interceptamos el primer clic/tap dentro de la tienda y lo mandamos a una pestaña nueva.
    // El scroll no genera "click", así que recorrer el menú sigue funcionando.
    try {
      const doc = e.currentTarget.contentDocument
      if (!doc) return
      doc.addEventListener(
        'click',
        ev => {
          ev.preventDefault()
          ev.stopPropagation()
          window.open(DEMO_URL, '_blank', 'noopener,noreferrer')
        },
        true,
      )
      // Dejar que el gesto vertical encadene al scroll de la landing al llegar al borde del menú
      doc.documentElement.style.overscrollBehaviorY = 'auto'
      doc.body.style.cursor = 'pointer'
      // Ocultar la barra de scroll del teléfono sin perder el scroll
      const estilo = doc.createElement('style')
      estilo.textContent = 'html{scrollbar-width:none}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}'
      doc.head.appendChild(estilo)
    } catch {
      // Si el documento no es accesible, el CTA primario sigue llevando a la tienda
    }
  }

  return (
    <div className="w-full flex flex-col items-center" style={{ maxWidth: '320px' }}>
    <div className="bg-[#1a1a1a] p-2 rounded-[36px] w-full">
      <div className="relative bg-[#faf8f4] rounded-[28px] overflow-hidden h-[440px] md:h-[560px]">
        {/* Placeholder mientras carga */}
        <div
          className="absolute inset-0 flex flex-col items-center px-5 pt-8 transition-opacity duration-300"
          style={{ opacity: cargado ? 0 : 1, pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: '#2d5a27' }}>
            Abierto ahora
          </p>
          <p className="mt-3 text-[#1a1a1a]" style={{ fontFamily: SERIF, fontSize: '26px', fontWeight: 400 }}>
            Ejemplo
          </p>
          <div className="mt-3 mb-5" style={{ width: '24px', height: '1.5px', backgroundColor: '#73223a' }} />
          <div className="w-full flex flex-col gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-white p-3" style={{ border: '0.5px solid #e8e1d4' }}>
                <div className="w-full animate-pulse" style={{ height: '54px', backgroundColor: '#ede5d3' }} />
                <div className="mt-2 animate-pulse" style={{ height: '10px', width: '55%', backgroundColor: '#ede5d3' }} />
              </div>
            ))}
          </div>
        </div>

        {montar && (
          <iframe
            src={DEMO_URL}
            title="Vista previa de la tienda demo de Vinto. Tocá para abrirla en una pestaña nueva."
            loading="lazy"
            tabIndex={-1}
            onLoad={handleLoad}
            className="absolute inset-0 w-full h-full border-0 transition-opacity duration-300"
            style={{ opacity: cargado ? 1 : 0 }}
          />
        )}
      </div>
    </div>
    <p className="mt-4 text-center text-[#6b6258]" style={{ fontSize: '12.5px', lineHeight: 1.5 }}>
      Una tienda real, funcionando. Tocala para abrirla.
    </p>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#1a1a1a]">

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="max-w-[1100px] mx-auto px-5 md:px-8 py-5 md:py-6 flex justify-between items-center">
        <span className="text-[#1a1a1a]" style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 400 }}>
          Vinto
        </span>
        <Link
          to="/admin/login"
          className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6258] hover:text-[#73223a] transition-colors"
        >
          Ingresar
        </Link>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="max-w-[1100px] mx-auto px-5 md:px-8 pt-10 md:pt-16 pb-16 md:pb-24">
        <div className="flex flex-col md:flex-row md:items-center gap-12">

          {/* Izquierda — texto */}
          <div className="w-full md:w-3/5">
            <h1
              className="text-[#1a1a1a] mb-5"
              style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.01em', fontSize: 'clamp(36px, 5vw, 56px)' }}
            >
              Tu negocio, vendiendo online. Sin complicaciones.
            </h1>
            <p className="text-[#6b6258] mb-8" style={{ fontSize: '17px', lineHeight: 1.6 }}>
              Vinto te da una tienda online lista para usar, sea gastronomía, ropa, kioscos o lo que vendas. Tus clientes piden sin registrarse y vos gestionás todo desde un panel simple.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#73223a] hover:bg-[#651d33] text-[#faf8f4] px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] rounded-none transform transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Ver la tienda demo
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-3.5 pl-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6258] hover:text-[#73223a] transition-colors"
              >
                Escribime por WhatsApp
              </a>
            </div>
          </div>

          {/* Derecha — tienda demo real */}
          <div className="w-full md:w-2/5 flex justify-center">
            <DemoPhone />
          </div>

        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="max-w-[1100px] mx-auto px-5 md:px-8 py-20 md:py-28">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] mb-3 text-[#6b6258]">
            Qué incluye Vinto
          </p>
          <div className="mx-auto mb-4" style={{ width: '32px', height: '1.5px', backgroundColor: '#6b6258' }} />
          <h2
            className="text-[#1a1a1a] mb-12 md:mb-16"
            style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(28px, 3.5vw, 40px)' }}
          >
            Todo lo que necesitás para vender
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
          {FEATURES.map((f, i) => (
            <Reveal key={f.titulo} delay={i * 60}>
              <h3
                className="text-[#1a1a1a] mb-2 leading-tight"
                style={{ fontFamily: SERIF, fontSize: '19px', fontWeight: 400 }}
              >
                {f.titulo}
              </h3>
              <p className="text-[#6b6258]" style={{ fontSize: '14.5px', lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </Reveal>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 mt-14 pt-8 border-t border-[#e8e1d4]">
          {EXTRAS.map(e => (
            <p key={e.titulo} className="text-[#6b6258]" style={{ fontSize: '13.5px', lineHeight: 1.6 }}>
              <span className="text-[#1a1a1a]">{e.titulo}.</span> {e.desc}
            </p>
          ))}
        </div>
      </section>

      {/* ── CÓMO ARRANCA ─────────────────────────────────────── */}
      <section className="max-w-[1100px] mx-auto px-5 md:px-8 py-20 md:py-28">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] mb-3 text-[#6b6258]">
            Cómo arranca
          </p>
          <div className="mx-auto mb-4" style={{ width: '32px', height: '1.5px', backgroundColor: '#6b6258' }} />
          <h2
            className="text-[#1a1a1a] mb-16"
            style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(28px, 3.5vw, 40px)' }}
          >
            En tres pasos
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {STEPS.map((s, i) => (
            <Reveal key={s.num} delay={i * 60}>
              <p
                className="mb-4"
                style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300, color: '#73223a', lineHeight: 1, fontSize: 'clamp(56px, 6vw, 80px)' }}
              >
                {s.num}
              </p>
              <h3 className="text-[#1a1a1a] mb-2" style={{ fontFamily: SERIF, fontSize: '20px', fontWeight: 400 }}>
                {s.titulo}
              </h3>
              <p className="text-[#6b6258]" style={{ fontSize: '14.5px', lineHeight: 1.6 }}>
                {s.desc}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section className="py-20 md:py-32" style={{ backgroundColor: '#ede5d3' }}>
        <div className="max-w-[700px] mx-auto px-5 text-center">
          <Reveal>
            <h2
              className="text-[#1a1a1a] mb-4"
              style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1.1, fontSize: 'clamp(40px, 5vw, 56px)' }}
            >
              ¿Empezamos?
            </h2>
            <p className="text-[#6b6258] mb-10" style={{ fontSize: '17px', lineHeight: 1.6 }}>
              Conversemos por WhatsApp y te muestro cómo funciona.
            </p>
          </Reveal>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#73223a] hover:bg-[#651d33] text-[#faf8f4] px-10 py-4 text-xs font-medium uppercase tracking-[0.18em] rounded-none transform transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Escribime por WhatsApp
          </a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="bg-[#faf8f4] border-t border-[#e8e1d4]">
        <div className="max-w-[1100px] mx-auto px-5 py-8 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <p className="text-[#1a1a1a]" style={{ fontFamily: SERIF, fontSize: '18px', fontWeight: 400 }}>
            Vinto
          </p>
          <p className="text-[11px] text-[#6b6258]" style={{ letterSpacing: '0.05em' }}>
            © 2026 · Hecho en Argentina
          </p>
        </div>
      </footer>

    </div>
  )
}
