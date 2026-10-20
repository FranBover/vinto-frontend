import { useEffect } from 'react'
import { useMenuStore } from '../store/menuStore'
import { avisoLocalCerrado } from '../utils/horarios'

// Tope de setTimeout (int32). proximoCambio está a 7 días como máximo, pero no cuesta nada acotarlo.
const MAX_TIMER_MS = 2_147_483_647
// El menú es el único endpoint con el estado: al volver a la pestaña no se lo pide más seguido que esto.
const MIN_ENTRE_REFRESCOS_MS = 30_000

/**
 * Estado de atención del local para la tienda pública. Se mantiene al día solo: vuelve a pedirlo
 * cuando llega `proximoCambio` y al volver a la pestaña (el cliente puede dejarla abierta horas).
 * También carga el menú si la página se abrió directo (carrito, checkout) y todavía no está.
 */
export function useEstadoLocal(slug: string | undefined) {
  const menu = useMenuStore(s => (slug ? s.data[slug] : undefined))
  const estadoAt = useMenuStore(s => (slug ? s.estadoAt[slug] : undefined))
  const fetchMenu = useMenuStore(s => s.fetchMenu)
  const refrescarEstado = useMenuStore(s => s.refrescarEstado)

  const hayMenu = menu !== undefined
  const proximoCambio = menu?.estado.proximoCambio ?? null

  useEffect(() => {
    if (slug) void fetchMenu(slug)
  }, [slug, fetchMenu])

  useEffect(() => {
    if (!slug || !hayMenu) return

    const timer = proximoCambio
      ? setTimeout(
          () => void refrescarEstado(slug),
          Math.min(Math.max(Date.parse(proximoCambio) - Date.now(), 0) + 1000, MAX_TIMER_MS),
        )
      : undefined

    const alVolver = () => {
      if (document.visibilityState !== 'visible') return
      const ultimo = useMenuStore.getState().estadoAt[slug] ?? 0
      if (Date.now() - ultimo >= MIN_ENTRE_REFRESCOS_MS) void refrescarEstado(slug)
    }
    document.addEventListener('visibilitychange', alVolver)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [slug, hayMenu, proximoCambio, refrescarEstado])

  // Sin menú todavía no se sabe: se deja pasar y lo ataja el backend al crear el pedido.
  const abierto = menu ? menu.estado.estaAbierto : true
  const aviso =
    menu && !abierto && estadoAt !== undefined
      ? avisoLocalCerrado(menu.estado, menu.horario.zonaHoraria, estadoAt)
      : null

  return { abierto, aviso }
}
