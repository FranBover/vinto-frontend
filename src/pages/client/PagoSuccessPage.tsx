import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { consultarEstadoPago } from '../../api/mercadoPagoApi'
import type { EstadoPagoPublicoResponse } from '../../types'

const SERIF = "'Fraunces', Georgia, serif"

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 30000

function getWhatsAppNumber(linkWhatsapp: string | null | undefined): string | null {
  if (!linkWhatsapp) return null
  const match = linkWhatsapp.match(/wa\.me\/(\d+)/)
  if (match) return match[1]
  const digits = linkWhatsapp.replace(/\D/g, '')
  return digits || null
}

type Status = 'polling' | 'confirmed' | 'timeout' | 'not-found'

export default function PagoSuccessPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const limpiarCarrito = useCartStore(s => s.limpiarCarrito)

  const codigo = searchParams.get('codigo')
  const [status, setStatus] = useState<Status>('polling')
  const [data, setData] = useState<EstadoPagoPublicoResponse | null>(null)
  const [showResumen, setShowResumen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cartClearedRef = useRef(false)

  useEffect(() => {
    if (!codigo) {
      setStatus('not-found')
      return
    }

    const cleanup = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    const checkStatus = async () => {
      try {
        const resp = await consultarEstadoPago(codigo)
        setData(resp)

        if (!resp.encontrado) {
          setStatus('not-found')
          cleanup()
          return
        }

        // Estado confirmado o ya cobrado
        if (resp.estado === 'Confirmado' || resp.mercadoPagoStatus === 'approved') {
          setStatus('confirmed')
          if (!cartClearedRef.current) {
            limpiarCarrito()
            cartClearedRef.current = true
          }
          cleanup()
        }
      } catch {
        // En error de red seguimos intentando
      }
    }

    // Primera consulta inmediata
    void checkStatus()

    // Polling cada 2s
    intervalRef.current = setInterval(checkStatus, POLL_INTERVAL_MS)

    // Timeout a los 30s
    timeoutRef.current = setTimeout(() => {
      setStatus(prev => (prev === 'polling' ? 'timeout' : prev))
      if (!cartClearedRef.current) {
        limpiarCarrito()
        cartClearedRef.current = true
      }
      cleanup()
    }, POLL_TIMEOUT_MS)

    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo])

  // ── Polling ───────────────────────────────────────────────
  if (status === 'polling') {
    return (
      <div className="min-h-screen bg-[#faf8f4] text-[#1a1a1a] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] mb-5" style={{ color: '#6b6258' }}>
          Verificando pago
        </p>
        <div className="mb-6" style={{ width: '32px', height: '1.5px', backgroundColor: '#6b6258' }} />
        <h1
          className="leading-tight mb-4 text-[#1a1a1a]"
          style={{ fontFamily: SERIF, fontSize: '32px', fontWeight: 400, letterSpacing: '0.01em' }}
        >
          Confirmando tu pago…
        </h1>
        <p className="text-[15px] text-[#6b6258] mx-auto" style={{ maxWidth: '380px', lineHeight: 1.6 }}>
          Estamos verificando con Mercado Pago. Esto suele tardar unos segundos.
        </p>
      </div>
    )
  }

  // ── No encontrado ─────────────────────────────────────────
  if (status === 'not-found') {
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

  // ── Timeout (procesando) o confirmed ──────────────────────
  const waNumber = getWhatsAppNumber(data?.linkWhatsapp)
  const isConfirmed = status === 'confirmed'

  const textoWhatsApp = data?.resumenWhatsApp ?? ''
  const waLink = waNumber && textoWhatsApp
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(textoWhatsApp)}`
    : null

  const accent = isConfirmed ? '#2d5a27' : '#6b6258'
  const eyebrow = isConfirmed ? 'Pago aprobado' : 'Pago en proceso'
  const titulo = isConfirmed ? 'Tu pago fue aprobado' : 'Tu pago está en proceso'
  const mensaje = isConfirmed
    ? 'Tu pago se confirmó y el local ya fue notificado de tu pedido.'
    : 'Tu pago se está procesando. Enviá el comprobante por WhatsApp para confirmar tu pedido apenas se acredite.'

  const rows: { label: string; value: string; mono?: boolean }[] = [
    ...(data?.nombreCliente ? [{ label: 'Nombre', value: data.nombreCliente }] : []),
    ...(data?.total != null ? [{ label: 'Total', value: `$${data.total.toLocaleString('es-AR')}`, mono: true }] : []),
  ]

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#1a1a1a]">
      <div className="mx-auto px-6 pt-16 pb-32" style={{ maxWidth: '480px' }}>

        <p className="text-[11px] font-medium uppercase tracking-[0.22em] mb-5 text-center" style={{ color: accent }}>
          {eyebrow}
        </p>
        <div className="mx-auto mb-6" style={{ width: '32px', height: '1.5px', backgroundColor: accent }} />
        <h1
          className="leading-tight text-center mb-4 text-[#1a1a1a]"
          style={{ fontFamily: SERIF, fontSize: '34px', fontWeight: 400, letterSpacing: '0.01em' }}
        >
          {titulo}
        </h1>
        <p className="text-[15px] text-[#6b6258] text-center mx-auto mb-10" style={{ maxWidth: '380px', lineHeight: 1.6 }}>
          {mensaje}
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

        {textoWhatsApp && (
          <div className="mx-auto" style={{ maxWidth: '360px' }}>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6258] mb-2">
              Resumen del pedido
            </p>
            <button
              type="button"
              onClick={() => setShowResumen(v => !v)}
              className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6258] hover:text-[#73223a] underline underline-offset-4 decoration-1 decoration-[#e8e1d4] hover:decoration-[#73223a] transition-colors"
            >
              {showResumen ? 'Ocultar detalle' : 'Ver detalle'}
            </button>
            {showResumen && (
              <pre
                className="mt-3 text-xs whitespace-pre-wrap font-sans leading-relaxed px-4 py-4 overflow-auto text-[#1a1a1a]"
                style={{ backgroundColor: '#ede5d3' }}
              >
                {textoWhatsApp}
              </pre>
            )}
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
