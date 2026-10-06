import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { consultarEstadoPago } from '../../api/mercadoPagoApi'
import type { EstadoPagoPublicoResponse } from '../../types'

const SERIF = "'Fraunces', Georgia, serif"

function getWhatsAppNumber(linkWhatsapp: string | null | undefined): string | null {
  if (!linkWhatsapp) return null
  const match = linkWhatsapp.match(/wa\.me\/(\d+)/)
  if (match) return match[1]
  const digits = linkWhatsapp.replace(/\D/g, '')
  return digits || null
}

export default function PagoPendingPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const limpiarCarrito = useCartStore(s => s.limpiarCarrito)

  const codigo = searchParams.get('codigo')
  const [data, setData] = useState<EstadoPagoPublicoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Vaciar carrito al cargar (igual que ConfirmacionPage)
  useEffect(() => {
    limpiarCarrito()
  }, [limpiarCarrito])

  useEffect(() => {
    if (!codigo) {
      setNotFound(true)
      setLoading(false)
      return
    }

    consultarEstadoPago(codigo)
      .then(resp => {
        if (!resp.encontrado) {
          setNotFound(true)
        } else {
          setData(resp)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [codigo])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center px-8">
        <p className="text-sm text-[#6b6258]" style={{ fontFamily: SERIF, fontStyle: 'italic' }}>
          Cargando…
        </p>
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-[#faf8f4] text-[#1a1a1a]">
        <div className="mx-auto px-6 pt-16 pb-32" style={{ maxWidth: '480px' }}>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] mb-5 text-center" style={{ color: '#6b6258' }}>
            Pedido no encontrado
          </p>
          <div className="mx-auto mb-6" style={{ width: '32px', height: '1.5px', backgroundColor: '#6b6258' }} />
          <h1
            className="leading-tight text-center mb-4 text-[#1a1a1a]"
            style={{ fontFamily: SERIF, fontSize: '34px', fontWeight: 400, letterSpacing: '0.01em' }}
          >
            No pudimos encontrar tu pedido
          </h1>
          <p className="text-[15px] text-[#6b6258] text-center mx-auto" style={{ maxWidth: '380px', lineHeight: 1.6 }}>
            No pudimos encontrar el pedido. Si pensás que es un error, contactá al local.
          </p>
        </div>
        <footer className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[#e8e1d4]">
          <div className="mx-auto px-5 py-4" style={{ maxWidth: '560px' }}>
            <button
              onClick={() => navigate(`/${slug}`)}
              className="block w-full text-center bg-[#73223a] hover:bg-[#651d33] text-[#faf8f4] py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] rounded-none transition-colors"
            >
              Volver al menú
            </button>
          </div>
        </footer>
      </div>
    )
  }

  const waNumber = getWhatsAppNumber(data.linkWhatsapp)
  // El mensaje se arma acá con solo el código: el endpoint público no devuelve datos del cliente.
  const textoWhatsApp = `Hola, mi pago del pedido #${codigo} quedó pendiente en Mercado Pago. Les aviso apenas se acredite y les paso el comprobante.`
  const waLink = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(textoWhatsApp)}`
    : null

  const rows: { label: string; value: string; mono?: boolean }[] = [
    ...(data.total != null ? [{ label: 'Total', value: `$${data.total.toLocaleString('es-AR')}`, mono: true }] : []),
  ]

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#1a1a1a]">
      <div className="mx-auto px-6 pt-16 pb-32" style={{ maxWidth: '480px' }}>

        <p className="text-[11px] font-medium uppercase tracking-[0.22em] mb-5 text-center" style={{ color: '#6b6258' }}>
          Pago en proceso
        </p>
        <div className="mx-auto mb-6" style={{ width: '32px', height: '1.5px', backgroundColor: '#6b6258' }} />
        <h1
          className="leading-tight text-center mb-4 text-[#1a1a1a]"
          style={{ fontFamily: SERIF, fontSize: '34px', fontWeight: 400, letterSpacing: '0.01em' }}
        >
          Tu pago está pendiente
        </h1>
        <p className="text-[15px] text-[#6b6258] text-center mx-auto mb-10" style={{ maxWidth: '380px', lineHeight: 1.6 }}>
          Mercado Pago todavía no confirmó tu pago (algunos medios como Rapipago o transferencia tardan más). Avisanos por WhatsApp cuando tengas el comprobante.
        </p>

        {rows.length > 0 && (
          <div className="mx-auto mb-8" style={{ maxWidth: '360px' }}>
            {rows.map((r, i) => (
              <div key={i} className="py-3 border-b border-[#e8e1d4] last:border-b-0">
                <p className="text-[10px] font-medium uppercase text-[#6b6258] mb-1" style={{ letterSpacing: '0.18em' }}>
                  {r.label}
                </p>
                <p className={`text-[15px] text-[#1a1a1a] ${r.mono ? 'font-mono tabular-nums' : ''}`}>
                  {r.value}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[#e8e1d4]">
        <div className="mx-auto px-5 py-4" style={{ maxWidth: '560px' }}>
          {waLink ? (
            <>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#73223a] hover:bg-[#651d33] text-[#faf8f4] py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] rounded-none transition-colors"
              >
                Confirmar por WhatsApp
              </a>
              <button
                onClick={() => navigate(`/${slug}`)}
                className="block mx-auto mt-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6258] hover:text-[#73223a] transition-colors"
              >
                Volver al menú
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate(`/${slug}`)}
              className="block w-full text-center bg-[#73223a] hover:bg-[#651d33] text-[#faf8f4] py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] rounded-none transition-colors"
            >
              Volver al menú
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
