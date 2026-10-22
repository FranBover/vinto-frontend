import { useEffect } from 'react'

/**
 * Pide que la pantalla no se apague mientras `activo`. El navegador suelta el lock al ocultar la
 * pestaña, así que se vuelve a pedir al regresar. Sin Wake Lock (o si lo rechaza, por ejemplo con
 * batería baja) no hace nada.
 */
export function useWakeLock(activo: boolean) {
  useEffect(() => {
    if (!activo || !('wakeLock' in navigator)) return

    let cancelado = false
    let lock: WakeLockSentinel | null = null

    const pedir = async () => {
      if (cancelado || lock || document.visibilityState !== 'visible') return
      try {
        const nuevo = await navigator.wakeLock.request('screen')
        if (cancelado) {
          void nuevo.release().catch(() => {})
          return
        }
        lock = nuevo
        nuevo.addEventListener('release', () => {
          if (lock === nuevo) lock = null
        })
      } catch {
        // Rechazado: la pantalla se apaga como siempre.
      }
    }

    void pedir()
    const alCambiarVisibilidad = () => void pedir()
    document.addEventListener('visibilitychange', alCambiarVisibilidad)

    return () => {
      cancelado = true
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
      void lock?.release().catch(() => {})
      lock = null
    }
  }, [activo])
}
