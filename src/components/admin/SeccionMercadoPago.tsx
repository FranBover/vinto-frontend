import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getEstadoMercadoPago,
  getOAuthUrlMercadoPago,
  desconectarMercadoPago,
} from '../../api/adminApi'
import type { EstadoMercadoPagoResponse } from '../../types'

const labelCls =
  'block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5'

interface Props {
  localCompleto: boolean
}

type BannerInfo =
  | { tipo: 'success'; mensaje: string }
  | { tipo: 'error'; mensaje: string }
  | null

export default function SeccionMercadoPago({ localCompleto }: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [estado, setEstado] = useState<EstadoMercadoPagoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [accionando, setAccionando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmDesconectar, setShowConfirmDesconectar] = useState(false)
  const [banner, setBanner] = useState<BannerInfo>(null)

  // Leer y limpiar query params de retorno OAuth (?mp=success | ?mp=error | ?mp=denied)
  useEffect(() => {
    const mp = searchParams.get('mp')
    const motivo = searchParams.get('motivo')

    if (mp === 'success') {
      setBanner({ tipo: 'success', mensaje: 'Mercado Pago conectado correctamente.' })
    } else if (mp === 'denied') {
      setBanner({ tipo: 'error', mensaje: 'Cancelaste la autorización en Mercado Pago.' })
    } else if (mp === 'error') {
      setBanner({
        tipo: 'error',
        mensaje: motivo
          ? `Hubo un error al conectar: ${motivo}`
          : 'Hubo un error al conectar con Mercado Pago.',
      })
    }

    if (mp) {
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('mp')
      newParams.delete('motivo')
      setSearchParams(newParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Cargar estado MP
  useEffect(() => {
    if (!localCompleto) {
      setLoading(false)
      return
    }
    getEstadoMercadoPago()
      .then(setEstado)
      .catch(() => setError('No se pudo cargar el estado de Mercado Pago.'))
      .finally(() => setLoading(false))
  }, [localCompleto])

  const handleConectar = async () => {
    setAccionando(true)
    setError(null)
    try {
      const { url } = await getOAuthUrlMercadoPago()
      window.location.href = url
    } catch {
      setError('No se pudo iniciar la conexión con Mercado Pago.')
      setAccionando(false)
    }
  }

  const handleConfirmarDesconexion = async () => {
    setAccionando(true)
    setError(null)
    try {
      await desconectarMercadoPago()
      setEstado({ conectado: false })
      setShowConfirmDesconectar(false)
      setBanner({ tipo: 'success', mensaje: 'Mercado Pago desconectado.' })
    } catch {
      setError('No se pudo desconectar Mercado Pago.')
    } finally {
      setAccionando(false)
    }
  }

  if (!localCompleto) return null

  if (loading) {
    return (
      <div className="border border-[#e8e8e8] bg-white px-6 py-5">
        <p className="text-sm text-[#aaa]">Cargando Mercado Pago…</p>
      </div>
    )
  }

  const tokenExpiresAt = estado?.tokenExpiraEn
    ? new Date(estado.tokenExpiraEn)
    : null
  const tokenExpirado = tokenExpiresAt ? tokenExpiresAt < new Date() : false

  return (
    <div className="border border-[#e8e8e8] bg-white px-6 py-5 space-y-4">
      <p className="font-bold text-[13px]">Mercado Pago</p>

      {banner && (
        <div
          className={
            banner.tipo === 'success'
              ? 'bg-[#eaf4e8] text-[#2d5a27] border-l-4 border-[#2d5a27] px-4 py-3 text-sm'
              : 'bg-[#fdecec] text-[#a92020] border-l-4 border-[#a92020] px-4 py-3 text-sm'
          }
        >
          {banner.mensaje}
        </div>
      )}

      {estado?.conectado && tokenExpirado && (
        <div className="bg-[#fdecec] text-[#a92020] border-l-4 border-[#a92020] px-4 py-3 text-sm">
          El token de Mercado Pago expiró. Volvé a conectar para seguir recibiendo pagos.
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!estado?.conectado ? (
        <>
          <p className="text-sm text-[#666] leading-relaxed">
            Conectá tu cuenta de Mercado Pago para que los clientes puedan pagar online.
            Los pagos van directamente a tu cuenta.
          </p>
          <button
            type="button"
            onClick={handleConectar}
            disabled={accionando}
            className="text-sm font-bold text-white px-5 py-2.5 rounded-none disabled:opacity-50 transition-colors"
            style={{ backgroundColor: accionando ? '#aaa' : '#2d5a27' }}
          >
            {accionando ? 'Conectando…' : 'Conectar con Mercado Pago'}
          </button>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <div>
              <p className={labelCls}>Estado</p>
              <p className="text-sm font-bold text-[#2d5a27]">Conectado ✓</p>
            </div>
            {estado.mercadoPagoUserId && (
              <div>
                <p className={labelCls}>ID de Mercado Pago</p>
                <p className="text-sm font-mono">{estado.mercadoPagoUserId}</p>
              </div>
            )}
            {tokenExpiresAt && (
              <div>
                <p className={labelCls}>El token vence el</p>
                <p className="text-sm">
                  {tokenExpiresAt.toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmDesconectar(true)}
            disabled={accionando}
            className="text-sm font-bold text-white px-5 py-2.5 rounded-none disabled:opacity-50 transition-colors bg-[#a92020] hover:bg-[#8a1818]"
          >
            Desconectar
          </button>
        </>
      )}

      {showConfirmDesconectar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="bg-white max-w-md w-full p-6 space-y-4">
            <p className="font-bold text-base">¿Desconectar Mercado Pago?</p>
            <p className="text-sm text-[#666] leading-relaxed">
              Vas a desconectar Mercado Pago. Tendrás que volver a autorizar para
              recibir pagos online. Los pedidos en curso siguen activos.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDesconectar(false)}
                disabled={accionando}
                className="flex-1 border border-[#d0d0d0] px-4 py-2.5 text-sm font-bold rounded-none disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarDesconexion}
                disabled={accionando}
                className="flex-1 text-sm font-bold text-white px-4 py-2.5 rounded-none disabled:opacity-50 bg-[#a92020] hover:bg-[#8a1818]"
              >
                {accionando ? 'Desconectando…' : 'Sí, desconectar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
