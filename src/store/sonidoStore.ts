import { create } from 'zustand'

const SONIDO_KEY = 'vinto_sonido_pedidos'

// Preferencia por dispositivo. Activada salvo que se haya apagado a propósito.
function leerActivado(): boolean {
  try {
    return localStorage.getItem(SONIDO_KEY) !== 'off'
  } catch {
    return true
  }
}

function guardarActivado(activado: boolean) {
  try {
    localStorage.setItem(SONIDO_KEY, activado ? 'on' : 'off')
  } catch {
    // Sin storage (modo privado, cuota): la preferencia dura hasta recargar.
  }
}

const VOLUMEN_KEY = 'vinto_sonido_volumen'
/** El slider solo baja desde el máximo; para silenciar está el interruptor. */
export const VOLUMEN_MIN = 0.1

function acotarVolumen(v: number): number {
  return Math.min(1, Math.max(VOLUMEN_MIN, v))
}

// Máximo salvo que se haya bajado a propósito en este dispositivo.
function leerVolumen(): number {
  try {
    const crudo = localStorage.getItem(VOLUMEN_KEY)
    if (crudo === null) return 1
    const v = Number(crudo)
    return Number.isFinite(v) ? acotarVolumen(v) : 1
  } catch {
    return 1
  }
}

function guardarVolumen(volumen: number) {
  try {
    localStorage.setItem(VOLUMEN_KEY, String(volumen))
  } catch {
    // Igual que la preferencia: dura hasta recargar.
  }
}

interface SonidoState {
  /** Preferencia "Sonido de pedidos" de este dispositivo. */
  activado: boolean
  /** Volumen del aviso, de VOLUMEN_MIN a 1 (1 = el nivel original del sonido). Por dispositivo. */
  volumen: number
  /** El navegador ya dejó reproducir audio en esta carga de la página. No se persiste. */
  desbloqueado: boolean
  setActivado: (activado: boolean) => void
  setVolumen: (volumen: number) => void
  /** Lo llama `utils/sonidoPedidos` cuando cambia el estado del AudioContext. */
  marcarDesbloqueado: (desbloqueado: boolean) => void
}

export const useSonidoStore = create<SonidoState>((set) => ({
  activado: leerActivado(),
  volumen: leerVolumen(),
  desbloqueado: false,

  setActivado: (activado) => {
    guardarActivado(activado)
    set({ activado })
  },

  setVolumen: (volumen) => {
    const acotado = acotarVolumen(volumen)
    guardarVolumen(acotado)
    set({ volumen: acotado })
  },

  marcarDesbloqueado: (desbloqueado) => set({ desbloqueado }),
}))
