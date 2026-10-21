import { useEffect } from 'react'

// Solo suena si el vencimiento es reciente: quien abre el panel horas después ya está mirando
// la pantalla y el cartel del login alcanza.
const VENTANA_MS = 2 * 60_000
const REPETIR_CADA_MS = 15_000
// ~10 minutos de avisos; después queda solo el título de la pestaña.
const MAX_AVISOS = 40
const TITULO = '⚠ Sesión vencida · Vinto'
const FRECUENCIAS = [880, 660, 880]

function sonarAviso(ctx: AudioContext) {
  const inicio = ctx.currentTime
  FRECUENCIAS.forEach((frecuencia, i) => {
    const desde = inicio + i * 0.25
    const osc = ctx.createOscillator()
    const volumen = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = frecuencia
    volumen.gain.setValueAtTime(0.0001, desde)
    volumen.gain.exponentialRampToValueAtTime(0.2, desde + 0.02)
    volumen.gain.exponentialRampToValueAtTime(0.0001, desde + 0.18)
    osc.connect(volumen).connect(ctx.destination)
    osc.start(desde)
    osc.stop(desde + 0.2)
  })
}

/**
 * Avisa que la sesión venció aunque nadie esté mirando el panel: pitido repetido y título de la
 * pestaña. Se corta con el primer toque o tecla, o al salir del login. Todo es best-effort: si el
 * navegador bloquea el audio queda el título.
 */
export function useAlertaSesionExpirada(expiradaEn: number | null) {
  useEffect(() => {
    if (expiradaEn === null || Date.now() - expiradaEn > VENTANA_MS) return

    const tituloOriginal = document.title
    document.title = TITULO

    let ctx: AudioContext | null = null
    try {
      ctx = new AudioContext()
    } catch {
      // Sin Web Audio: no hay sonido.
    }

    let avisos = 0
    const avisar = () => {
      if (!ctx || avisos >= MAX_AVISOS) return
      avisos++
      // Sin interacción previa en la página el navegador deja el contexto suspendido.
      if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
      if (ctx.state === 'running') sonarAviso(ctx)
    }
    avisar()
    const intervalo = window.setInterval(avisar, REPETIR_CADA_MS)

    // Idempotente: lo llama el primer toque o tecla y también el cleanup.
    const parar = () => {
      window.clearInterval(intervalo)
      window.removeEventListener('pointerdown', parar, true)
      window.removeEventListener('keydown', parar, true)
      void ctx?.close().catch(() => {})
      ctx = null
      document.title = tituloOriginal
    }
    window.addEventListener('pointerdown', parar, true)
    window.addEventListener('keydown', parar, true)

    return parar
  }, [expiradaEn])
}
