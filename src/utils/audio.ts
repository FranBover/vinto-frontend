/** ¿Este navegador tiene Web Audio? Sin esto no hay sonido y tampoco tiene sentido pedir desbloqueo. */
export function audioSoportado(): boolean {
  return typeof AudioContext !== 'undefined'
}

export interface Nota {
  frecuencia: number
  tipo: OscillatorType
  /** Instante de inicio, en tiempo del AudioContext (`ctx.currentTime`). */
  desde: number
  /** Segundos hasta el volumen pico. */
  ataque: number
  /** Segundos desde el pico hasta el silencio (rampa exponencial). */
  decaimiento: number
  /** Ganancia pico, 0–1. */
  volumen: number
}

/** Una nota con envolvente de ataque rápido y caída exponencial. La comparten la alarma de sesión y el aviso de pedidos. */
export function tocarNota(ctx: BaseAudioContext, destino: AudioNode, nota: Nota) {
  const { frecuencia, tipo, desde, ataque, decaimiento, volumen } = nota
  const fin = desde + ataque + decaimiento
  const osc = ctx.createOscillator()
  const ganancia = ctx.createGain()
  osc.type = tipo
  osc.frequency.value = frecuencia
  ganancia.gain.setValueAtTime(0.0001, desde)
  ganancia.gain.exponentialRampToValueAtTime(volumen, desde + ataque)
  ganancia.gain.exponentialRampToValueAtTime(0.0001, fin)
  osc.connect(ganancia).connect(destino)
  osc.start(desde)
  osc.stop(fin + 0.02)
}
