import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import type { LocalPublico, PedidoCreateResponse, FormaPago, FormaEntrega } from '../../types'

const SERIF = "'Fraunces', Georgia, serif"

interface LocationState {
  pedido: PedidoCreateResponse
  local: LocalPublico
  nombreCliente: string
  telefono: string
  formaPago: FormaPago
  formaEntrega: FormaEntrega
  direccionCliente?: string
  referencia?: string
  ubicacionUrl?: string
  montoPagoEfectivo?: number
}

const LABEL_PAGO: Record<FormaPago, string> = {
  Efectivo: 'Efectivo',
  Transferencia: 'Transferencia',
  Tarjeta: 'Mercado Pago',
}

const LABEL_ENTREGA: Record<FormaEntrega, string> = {
  Local: 'Retiro en local',
  Delivery: 'Delivery',
}

const pesos = (n: number) => `$${n.toLocaleString('es-AR')}`

function getWhatsAppNumber(linkWhatsapp: string | null): string | null {
  if (!linkWhatsapp) return null
  const match = linkWhatsapp.match(/wa\.me\/(\d+)/)
  if (match) return match[1]
  const digits = linkWhatsapp.replace(/\D/g, '')
  return digits || null
}

export default function ConfirmacionPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const limpiarCarrito = useCartStore(s => s.limpiarCarrito)
  const [showResumen, setShowResumen] = useState(false)

  const state = location.state as LocationState | null

  useEffect(() => {
    limpiarCarrito()
  }, [limpiarCarrito])

  // Fallback: navegación directa sin state
  if (!state?.pedido || !state?.local) {
    return (
      <div className="min-h-screen bg-[#faf8f4] text-[#1a1a1a]">
        <div className="mx-auto px-6 pt-16 pb-32" style={{ maxWidth: '480px' }}>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] mb-5 text-center" style={{ color: '#73223a' }}>
            Pedido recibido
          </p>
          <div className="mx-auto mb-6" style={{ width: '32px', height: '1.5px', backgroundColor: '#73223a' }} />
          <h1
            className="leading-tight text-center mb-4 text-[#1a1a1a]"
            style={{ fontFamily: SERIF, fontSize: '34px', fontWeight: 400, letterSpacing: '0.01em' }}
          >
            Recibimos tu pedido
          </h1>
          <p className="text-[15px] text-[#6b6258] text-center mx-auto" style={{ maxWidth: '380px', lineHeight: 1.6 }}>
            En breve te contactamos para confirmar.
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

  const { pedido, local, formaPago, formaEntrega, nombreCliente, direccionCliente } = state

  const waNumber = getWhatsAppNumber(local.linkWhatsapp)
  const waLink = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(pedido.resumenWhatsApp)}`
    : null

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Código de seguimiento', value: pedido.codigoSeguimiento, mono: true },
    ...(nombreCliente ? [{ label: 'Nombre', value: nombreCliente }] : []),
    ...(formaEntrega ? [{ label: 'Entrega', value: LABEL_ENTREGA[formaEntrega] }] : []),
    ...(formaPago ? [{ label: 'Pago', value: LABEL_PAGO[formaPago] }] : []),
    ...(formaPago === 'Transferencia' && local.aliasTransferencia
      ? [{ label: 'Alias', value: local.aliasTransferencia, mono: true }]
      : []),
    ...(formaPago === 'Transferencia' && local.titularCuenta
      ? [{ label: 'Titular', value: local.titularCuenta }]
      : []),
    ...(direccionCliente ? [{ label: 'Dirección', value: direccionCliente }] : []),
    ...(formaEntrega === 'Delivery' && local.costoEnvio != null
      ? [{ label: 'Costo de envío', value: pesos(local.costoEnvio), mono: true }]
      : []),
    { label: 'Total', value: pesos(pedido.total), mono: true },
  ]

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#1a1a1a]">
      <div className="mx-auto px-6 pt-16 pb-32" style={{ maxWidth: '480px' }}>

        {/* Eyebrow + line + title + message */}
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] mb-5 text-center" style={{ color: '#73223a' }}>
          Pedido recibido
        </p>
        <div className="mx-auto mb-6" style={{ width: '32px', height: '1.5px', backgroundColor: '#73223a' }} />
        <h1
          className="leading-tight text-center mb-4 text-[#1a1a1a]"
          style={{ fontFamily: SERIF, fontSize: '34px', fontWeight: 400, letterSpacing: '0.01em' }}
        >
          Recibimos tu pedido
        </h1>
        <p className="text-[15px] text-[#6b6258] text-center mx-auto mb-10" style={{ maxWidth: '380px', lineHeight: 1.6 }}>
          El local fue notificado y va a procesar tu pedido. Enviá el comprobante de pago por WhatsApp para confirmarlo.
        </p>

        {/* Datos del pedido */}
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

        {/* Aviso transferencia */}
        {formaPago === 'Transferencia' && local.aliasTransferencia && (
          <p className="mx-auto mb-8 text-xs text-[#6b6258]" style={{ maxWidth: '360px', fontStyle: 'italic', lineHeight: 1.6 }}>
            Transferí a este alias y enviá el comprobante por WhatsApp para confirmar tu pedido.
          </p>
        )}

        {/* Resumen colapsable */}
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
              {pedido.resumenWhatsApp}
            </pre>
          )}
        </div>
      </div>

      {/* Footer fixed CTAs */}
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
