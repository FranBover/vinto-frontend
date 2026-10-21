import { useEffect, useState } from 'react'
import { getTokenExpMs, useAuthStore } from '../../store/authStore'
import { cuandoVence } from '../../utils/sesion'

const AVISO_ANTES_MS = 30 * 60_000
const URGENTE_ANTES_MS = 5 * 60_000
const REVISAR_CADA_MS = 30_000

/**
 * Pre-aviso en el panel: la sesión vence pronto y, al vencer, se corta el aviso de pedidos nuevos.
 * Renovarla es volver a ingresar (no hay refresh de token), así que el botón cierra sesión.
 */
export default function SesionPorVencerBanner() {
  const token = useAuthStore(s => s.token)
  const logout = useAuthStore(s => s.logout)
  const expMs = token ? getTokenExpMs(token) : null
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    if (expMs === null) return
    const actualizar = () => setAhora(Date.now())
    const intervalo = window.setInterval(actualizar, REVISAR_CADA_MS)
    // Los intervalos se atrasan con la pestaña en segundo plano: se re-chequea al volver.
    document.addEventListener('visibilitychange', actualizar)
    return () => {
      window.clearInterval(intervalo)
      document.removeEventListener('visibilitychange', actualizar)
    }
  }, [expMs])

  if (expMs === null) return null
  const restante = expMs - ahora
  if (restante <= 0 || restante > AVISO_ANTES_MS) return null

  const minutos = Math.max(1, Math.ceil(restante / 60_000))
  const urgente = restante <= URGENTE_ANTES_MS

  return (
    <div
      role="alert"
      className="border-l-4 px-6 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2"
      style={
        urgente
          ? { backgroundColor: '#fdecec', color: '#a92020', borderLeftColor: '#a92020' }
          : { backgroundColor: '#ffffff', color: '#1a1a1a', borderLeftColor: '#1a1a1a' }
      }
    >
      <div className="min-w-0">
        <p className="font-bold text-sm">
          Tu sesión vence {cuandoVence(expMs, ahora)} (en {minutos} min)
        </p>
        <p className="text-xs mt-0.5 leading-relaxed">
          Al vencer dejás de recibir avisos de pedidos nuevos. Volvé a ingresar antes para renovarla.
        </p>
      </div>
      <button
        type="button"
        onClick={logout}
        className="bg-[#1a1a1a] text-white px-4 py-2 font-bold text-sm rounded-none flex-shrink-0"
      >
        Volver a ingresar
      </button>
    </div>
  )
}
