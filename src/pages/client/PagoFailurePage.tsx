import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { consultarEstadoPago } from '../../api/mercadoPagoApi'
import type { EstadoPagoPublicoResponse } from '../../types'

const MENSAJE_FAILURE_EXTRA =
  '\n\n⚠️ El pago con Mercado Pago no se procesó. Coordinemos otro medio de pago para confirmar este pedido.'

function getWhatsAppNumber(linkWhatsapp: string | null | undefined): string | null {
  if (!linkWhatsapp) return null
  const match = linkWhatsapp.match(/wa\.me\/(\d+)/)
  if (match) return match[1]
  const digits = linkWhatsapp.replace(/\D/g, '')
  return digits || null
}

export default function PagoFailurePage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const limpiarCarrito = useCartStore(s => s.limpiarCarrito)

  const codigo = searchParams.get('codigo')
  const [data, setData] = useState<EstadoPagoPublicoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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

  const handleVolverAlMenu = () => {
    limpiarCarrito()
    navigate(`/${slug}`)
  }

  const handleWhatsApp = () => {
    limpiarCarrito()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-[#1a1a1a] font-sans flex flex-col items-center justify-center px-8">
        <p className="text-sm text-[#999]">Cargando…</p>
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-white text-[#1a1a1a] font-sans flex flex-col items-center justify-center px-8 gap-6">
        <p className="font-bold text-lg text-center">Pedido no encontrado</p>
        <button
          onClick={() => navigate(`/${slug}`)}
          className="bg-[#1a1a1a] text-white px-6 py-3 font-bold text-sm rounded-none"
        >
          Volver al menú
        </button>
      </div>
    )
  }

  const waNumber = getWhatsAppNumber(data.linkWhatsapp)
  const textoWhatsApp = (data.resumenWhatsApp ?? '') + MENSAJE_FAILURE_EXTRA
  const waLink = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(textoWhatsApp)}`
    : null

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans pb-10">
      <header className="border-b border-[#1a1a1a] h-14 flex items-center px-4">
        <h1 className="font-bold text-[15px]">Pago no procesado</h1>
      </header>

      <div className="bg-[#fdecec] text-[#a92020] px-4 py-3 border-b border-[#f0c8c8]">
        <p className="text-[11px] font-bold uppercase tracking-widest">Estado</p>
        <p className="font-bold text-base mt-0.5">El pago con Mercado Pago no se procesó</p>
      </div>

      <div className="px-4 py-6 space-y-5">
        {data.nombreCliente && (
          <div>
            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1">
              Nombre
            </p>
            <p className="font-bold text-base">{data.nombreCliente}</p>
          </div>
        )}

        {data.total != null && (
          <div className="border-t border-[#e8e8e8] pt-5 flex items-center justify-between">
            <p className="font-bold text-base">Total</p>
            <p className="font-bold text-2xl">${data.total.toLocaleString('es-AR')}</p>
          </div>
        )}
      </div>

      {data.resumenWhatsApp && (
        <div className="px-4 pb-6">
          <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-2">
            Resumen
          </p>
          <pre className="text-xs text-[#444] whitespace-pre-wrap font-sans leading-relaxed bg-[#f5f5f5] px-4 py-4 overflow-auto">
            {data.resumenWhatsApp}
          </pre>
        </div>
      )}

      <div className="px-4 pt-2 pb-8 space-y-4">
        <p className="text-sm text-[#666] leading-relaxed">
          Tu pedido se registró correctamente, pero el pago con Mercado Pago no se completó. Coordiná con el local por WhatsApp otra forma de pago.
        </p>
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2.5 w-full bg-[#1a1a1a] text-white py-4 font-bold text-sm rounded-none"
          >
            <span className="w-2 h-2 rounded-full bg-[#2d5a27] shrink-0" />
            Coordinar por WhatsApp
          </a>
        ) : (
          <div className="w-full bg-[#e8e8e8] text-[#999] py-4 font-bold text-sm text-center">
            WhatsApp no disponible
          </div>
        )}
        <button
          onClick={handleVolverAlMenu}
          className="w-full border border-[#e8e8e8] text-[#1a1a1a] py-3.5 text-sm font-bold rounded-none"
        >
          Volver al menú
        </button>
      </div>
    </div>
  )
}
