import { useSonidoStore } from '../store/sonidoStore'
import { sonarPedidoNuevo } from './sonidoPedidos'

// Pedidos que entraron mientras la pestaña no estaba a la vista. Vive acá y no en React: el panel
// remonta AdminLayout en cada navegación y el aviso tiene que sobrevivir hasta que el dueño vuelva.
let sinVer = 0
let tituloOriginal: string | null = null
let tituloPuesto = ''

const enPrimerPlano = () => !document.hidden && document.hasFocus()

/** El título sin el prefijo de pedidos nuevos: lo que hay que restaurar cuando otro lo pisa temporalmente. */
export function tituloBase(): string {
  return tituloOriginal ?? document.title
}

function alVolver() {
  if (!enPrimerPlano()) return
  sinVer = 0
  // Si otro (la alarma de sesión vencida) ya cambió el título, no se lo pisa.
  if (tituloOriginal !== null && document.title === tituloPuesto) document.title = tituloOriginal
  tituloOriginal = null
  document.removeEventListener('visibilitychange', alVolver)
  window.removeEventListener('focus', alVolver)
}

/**
 * Entró un pedido nuevo (por el hub, o detectado al reconectar): suena si el sonido está activado y,
 * si el dueño no está en la pestaña, el título pasa a "(N) Nuevo pedido · Vinto" hasta que vuelva.
 */
export function avisarPedidosNuevos(cantidad = 1) {
  if (cantidad < 1) return
  if (useSonidoStore.getState().activado) void sonarPedidoNuevo()
  if (enPrimerPlano()) return

  if (sinVer === 0) {
    tituloOriginal = document.title
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('focus', alVolver)
  }
  sinVer += cantidad
  tituloPuesto = `(${sinVer}) ${sinVer === 1 ? 'Nuevo pedido' : 'Nuevos pedidos'} · Vinto`
  document.title = tituloPuesto
}
