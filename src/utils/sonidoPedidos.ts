import { useSonidoStore } from '../store/sonidoStore'
import { audioSoportado, tocarNota } from './audio'

// Campanadas de pedido nuevo: dos "ding-dong" y un acorde final, ~4 s. Timbre de campana (sinusoides con
// parciales inarmónicos), a propósito distinto del pitido cuadrado de "sesión vencida" (880/660/880 Hz).
// `desde` en segundos desde el inicio; `resonancia` es lo que tarda en apagarse cada golpe.
interface Campanada {
  desde: number
  frecuencias: number[]
  volumen: number
  resonancia: number
}

const CAMPANADAS: Campanada[] = [
  { desde: 0, frecuencias: [784], volumen: 0.5, resonancia: 2.4 },
  { desde: 0.5, frecuencias: [1047], volumen: 0.5, resonancia: 2.4 },
  { desde: 1.2, frecuencias: [784], volumen: 0.5, resonancia: 2.4 },
  { desde: 1.7, frecuencias: [1047], volumen: 0.5, resonancia: 2.4 },
  { desde: 2.3, frecuencias: [784, 1047, 1319], volumen: 0.22, resonancia: 3.2 },
]

// Armónicos de una campana: fundamental + parciales agudos que se apagan antes. Con estos volúmenes el
// pico de toda la secuencia da ~-2.5 dBFS (medido en un render offline): fuerte, sin saturar. Si se
// sube un volumen hay que volver a medir el pico del acorde final, que suma tres voces.
const PARCIALES = [
  { razon: 1, amplitud: 1, caida: 1 },
  { razon: 2.76, amplitud: 0.4, caida: 0.5 },
  { razon: 5.4, amplitud: 0.15, caida: 0.25 },
]

/** Lo que dura la reproducción sin la cola inaudible. Otro pedido en ese lapso no vuelve a sonar. */
export const DURACION_SONIDO_MS = 4000

export function programarCampanadas(ctx: BaseAudioContext, destino: AudioNode, inicio: number) {
  for (const { desde, frecuencias, volumen, resonancia } of CAMPANADAS) {
    for (const frecuencia of frecuencias) {
      for (const { razon, amplitud, caida } of PARCIALES) {
        tocarNota(ctx, destino, {
          frecuencia: frecuencia * razon,
          tipo: 'sine',
          desde: inicio + desde,
          ataque: 0.004,
          decaimiento: resonancia * caida,
          volumen: volumen * amplitud,
        })
      }
    }
  }
}

// Un solo AudioContext para todo el panel: el desbloqueo vale por carga de página, no por pantalla.
let ctx: AudioContext | null = null
// Ganancia maestra: el volumen del slider, también en vivo mientras suena (para ajustarlo escuchando).
let salida: GainNode | null = null
let ocupadoHasta = 0
let intentando = false

function sincronizar() {
  useSonidoStore.getState().marcarDesbloqueado(ctx?.state === 'running')
}

useSonidoStore.subscribe((estado, anterior) => {
  if (estado.volumen === anterior.volumen || !ctx || !salida) return
  salida.gain.setTargetAtTime(estado.volumen, ctx.currentTime, 0.02)
})

function obtenerContexto(): AudioContext | null {
  if (ctx) return ctx
  if (!audioSoportado()) return null
  try {
    ctx = new AudioContext()
  } catch {
    return null
  }
  salida = ctx.createGain()
  salida.gain.value = useSonidoStore.getState().volumen
  salida.connect(ctx.destination)
  ctx.onstatechange = sincronizar
  sincronizar()
  return ctx
}

/**
 * Hay que llamarlo dentro de un gesto del usuario (clic, tecla). Crea o reanuda el contexto y arranca
 * un sonido mudo, que es lo que Safari/iOS exige para habilitar el audio. El resultado llega por el
 * store (`desbloqueado`), cuando el contexto pasa a `running`.
 */
export function desbloquearAudio() {
  const c = obtenerContexto()
  if (!c) return
  if (c.state !== 'running') void c.resume().catch(() => {})
  try {
    const mudo = c.createBufferSource()
    mudo.buffer = c.createBuffer(1, 1, 22050)
    mudo.connect(c.destination)
    mudo.start()
  } catch {
    // Best-effort.
  }
}

/**
 * Hace sonar las campanadas una vez. Devuelve true si está sonando (recién arrancó o ya venía sonando)
 * y false si el navegador no la dejó. Varios pedidos seguidos son una sola reproducción: no se encima
 * ni se encola.
 */
export async function sonarPedidoNuevo(): Promise<boolean> {
  if (intentando) return true
  if (Date.now() < ocupadoHasta) return true
  const c = obtenerContexto()
  if (!c) return false
  intentando = true
  try {
    if (c.state !== 'running') {
      // Si ya hubo una interacción en la página el navegador deja reanudar sin gesto; si no, la
      // promesa no se resuelve nunca, de ahí el tope.
      await Promise.race([c.resume(), new Promise(r => setTimeout(r, 500))])
    }
    if (c.state !== 'running') return false
    ocupadoHasta = Date.now() + DURACION_SONIDO_MS
    programarCampanadas(c, salida ?? c.destination, c.currentTime + 0.05)
    return true
  } catch {
    return false
  } finally {
    intentando = false
  }
}
