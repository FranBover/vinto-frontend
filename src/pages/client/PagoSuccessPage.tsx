import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { consultarEstadoPago } from '../../api/mercadoPagoApi'
import type { EstadoPagoPublicoResponse } from '../../types'

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

  // ── No encontrado ─────────────────────────────────────────
  if (status === 'not-found') {
    return (
      <div className="min-h-screen bg-white text-[#1a1a1a] font-sans flex flex-col items-center justify-center px-8 gap-6">
        <p className="font-bold text-lg text-center">Pedido no encontrado</p>
        <p className="text-sm text-[#999] text-center">
          No pudimos encontrar el pedido. Si pensás que es un error, contactá al local.
        </p>
        <button
          onClick={() => navigate(`/${slug}`)}
          className="bg-[#1a1a1a] text-white px-6 py-3 font-bold text-sm rounded-none"
        >
          Volver al menú
        </button>
      </div>
    )
  }

  // ── Polling ───────────────────────────────────────────────
  if (status === 'polling') {
    return (
      <div className="min-h-screen bg-white text-[#1a1a1a] font-sans flex flex-col items-center justify-center px-8 gap-4">
        <p className="font-bold text-lg text-center">Confirmando tu pago…</p>
        <p className="text-sm text-[#999] text-center">
          Estamos verificando con Mercado Pago. Esto suele tardar unos segundos.
        </p>
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

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans pb-10">
      <header className="border-b border-[#1a1a1a] h-14 flex items-center px-4">
        <h1 className="font-bold text-[15px]">
          {isConfirmed ? 'Pago aprobado' : 'Pago en proceso'}
        </h1>
      </header>

      <div
        className={`px-4 py-3 border-b ${
          isConfirmed
            ? 'bg-[#eaf4e8] text-[#2d5a27] border-[#d0e8cc]'
            : 'bg-[#fff8e1] text-[#7d5e00] border-[#f0e0a0]'
        }`}
      >
        <p className="text-[11px] font-bold uppercase tracking-widest">Estado</p>
        <p className="font-bold text-base mt-0.5">
          {isConfirmed
            ? '¡Pago confirmado!'
            : 'Procesando tu pago — te avisaremos por WhatsApp'}
        </p>
      </div>

      <div className="px-4 py-6 space-y-5">
        {data?.nombreCliente && (
          <div>
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1">
              Nombre
            </p>
            <p className="font-bold text-base">{data.nombreCliente}</p>
          </div>
        )}

        {data?.total != null && (
          <div className="border-t border-[#e8e8e8] pt-5 flex items-center justify-between">
            <p className="font-bold text-base">Total</p>
            <p className="font-bold text-2xl">${data.total.toLocaleString('es-AR')}</p>
          </div>
        )}
      </div>

      {textoWhatsApp && (
        <div className="px-4 pb-6">
          <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-2">
            Resumen
          </p>
          <pre className="text-xs text-[#444] whitespace-pre-wrap font-sans leading-relaxed bg-[#f5f5f5] px-4 py-4 overflow-auto">
            {textoWhatsApp}
          </pre>
        </div>
      )}

      <div className="px-4 pt-2 pb-8 space-y-4">
        {!isConfirmed && (
          <p className="text-sm text-[#666] leading-relaxed">
            Tu pago se está procesando. Enviá el comprobante por WhatsApp para confirmar tu pedido apenas se acredite.
          </p>
        )}
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full bg-[#1a1a1a] text-white py-4 font-bold text-sm rounded-none"
          >
            <span className="w-2 h-2 rounded-full bg-[#2d5a27] shrink-0" />
            Confirmar por WhatsApp
          </a>
        ) : (
          <div className="w-full bg-[#e8e8e8] text-[#999] py-4 font-bold text-sm text-center">
            WhatsApp no disponible
          </div>
        )}
        <button
          onClick={() => navigate(`/${slug}`)}
          className="w-full border border-[#e8e8e8] text-[#1a1a1a] py-3.5 text-sm font-bold rounded-none"
        >
          Volver al menú
        </button>
      </div>
    </div>
  )
}
