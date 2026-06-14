import { Link } from 'react-router-dom'
import { WHATSAPP_URL, DEMO_URL } from '../../config'

const SERIF = "'Fraunces', Georgia, serif"

const FEATURES: { titulo: string; desc: string }[] = [
  { titulo: 'Menú con foto', desc: 'Productos con foto, descripción y precio. Organizados en categorías.' },
  { titulo: 'Cobros con MercadoPago', desc: 'Tus clientes pagan con tarjeta o transferencia. Vos recibís el dinero directo.' },
  { titulo: 'Pedidos por WhatsApp', desc: 'Cada pedido te llega como mensaje listo, con todos los datos del cliente.' },
  { titulo: 'Descuentos y cupones', desc: 'Aplicá descuentos por producto o categoría. Creá cupones con códigos.' },
  { titulo: 'Panel administrador', desc: 'Gestioná pedidos, productos y precios desde cualquier dispositivo.' },
  { titulo: 'Estadísticas', desc: 'Tus ventas, productos más vendidos y métricas en tiempo real.' },
  { titulo: 'Multi-rubro', desc: 'Sirve igual para gastronomía, ropa, kioscos, tecnología o lo que vendas.' },
  { titulo: 'Tu link único', desc: 'vinto.app/tu-negocio. Compartilo en redes, perfil de WhatsApp, donde quieras.' },
  { titulo: 'Sin login del cliente', desc: 'Tu cliente entra y pide. Sin contraseñas, sin formularios extra.' },
]

const STEPS: { num: string; titulo: string; desc: string }[] = [
  { num: '1', titulo: 'Hablamos', desc: 'Me escribís por WhatsApp y vemos qué necesita tu negocio.' },
  { num: '2', titulo: 'Te configuramos', desc: 'Cargamos tu catálogo, tu logo, tus datos de pago.' },
  { num: '3', titulo: 'Empezás a vender', desc: 'Compartís tu link y empezás a recibir pedidos.' },
]

const MOCK_CATEGORIAS = ['Hamburguesas', 'Bebidas', 'Pizzas']

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
            <p className="text-xs font-medium uppercase tracking-[0.18em] mb-4" style={{ color: '#73223a' }}>
              Vinto · Comercio online
            </p>
            <div className="mb-6" style={{ width: '32px', height: '1.5px', backgroundColor: '#73223a' }} />
            <h1
              className="text-[#1a1a1a] mb-5"
              style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.01em', fontSize: 'clamp(36px, 5vw, 56px)' }}
            >
              Tu negocio, vendiendo online. Sin complicaciones.
            </h1>
            <p className="text-[#6b6258] mb-8" style={{ fontSize: '17px', lineHeight: 1.6 }}>
              Vinto te da una tienda online lista para usar, donde tus clientes piden sin registrarse y vos gestionás todo desde un panel simple.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#73223a] hover:bg-[#651d33] text-[#faf8f4] px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] rounded-none transition-colors"
              >
                Quiero mi tienda
              </a>
              <Link
                to={DEMO_URL}
                className="inline-block py-3.5 pl-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6258] hover:text-[#73223a] transition-colors"
              >
                Ver un ejemplo →
              </Link>
            </div>
          </div>

          {/* Derecha — mockup del MenuPage */}
          <div className="w-full md:w-2/5 flex justify-center">
            <div
              className="w-full bg-[#ede5d3] p-5 rounded-3xl"
              style={{ maxWidth: '320px', aspectRatio: '4 / 5' }}
            >
              <div className="h-full flex flex-col">
                <p className="text-[10px] font-medium uppercase tracking-widest text-center" style={{ color: '#2d5a27' }}>
                  Abierto ahora
                </p>
                <h2
                  className="text-center mt-3 text-[#1a1a1a]"
                  style={{ fontFamily: SERIF, fontSize: '26px', fontWeight: 400 }}
                >
                  Carripollo
                </h2>
                <div className="mx-auto mt-3 mb-5" style={{ width: '24px', height: '1.5px', backgroundColor: '#73223a' }} />
                <div className="flex flex-col gap-2">
                  {MOCK_CATEGORIAS.map(nombre => (
                    <div key={nombre} className="bg-white p-3" style={{ border: '0.5px solid #e8e1d4' }}>
                      <div className="w-full" style={{ height: '54px', backgroundColor: '#d9cdb3' }} />
                      <p className="mt-2 text-[#1a1a1a]" style={{ fontFamily: SERIF, fontSize: '14px', fontWeight: 400 }}>
                        {nombre}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
          {FEATURES.map(f => (
            <div key={f.titulo}>
              <h3
                className="text-[#1a1a1a] mb-2 leading-tight"
                style={{ fontFamily: SERIF, fontSize: '19px', fontWeight: 400 }}
              >
                {f.titulo}
              </h3>
              <p className="text-[#6b6258]" style={{ fontSize: '14.5px', lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
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
          {STEPS.map(s => (
            <div key={s.num}>
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
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section className="py-20 md:py-32" style={{ backgroundColor: '#ede5d3' }}>
        <div className="max-w-[700px] mx-auto px-5 text-center">
          <h2
            className="text-[#1a1a1a] mb-4"
            style={{ fontFamily: SERIF, fontWeight: 400, lineHeight: 1.1, fontSize: 'clamp(40px, 5vw, 56px)' }}
          >
            ¿Empezamos?
          </h2>
          <p className="text-[#6b6258] mb-10" style={{ fontSize: '17px', lineHeight: 1.6 }}>
            Conversemos por WhatsApp y te muestro cómo funciona.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#73223a] hover:bg-[#651d33] text-[#faf8f4] px-10 py-4 text-xs font-medium uppercase tracking-[0.18em] rounded-none transition-colors"
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
