import { isAxiosError } from 'axios'
import type { EstadoLocal, HorarioDia, ModoHorario } from '../../../types'
import { cuandoEn } from '../../../utils/horarios'

export const MODOS: { valor: ModoHorario; label: string }[] = [
  { valor: 'Cerrado', label: 'Cerrado' },
  { valor: '24h', label: '24 hs' },
  { valor: 'Turnos', label: 'Turnos' },
]

// ── Borrador del editor ───────────────────────────────────────────────────────
// '' = hora sin cargar (lo que devuelve un <input type="time"> vacío).

export interface Turno {
  apertura: string
  cierre: string
}

export interface DiaBorrador {
  modo: ModoHorario
  turno1: Turno
  /** null = el día no tiene segundo turno. */
  turno2: Turno | null
}

const turnoVacio = (): Turno => ({ apertura: '', cierre: '' })

const diaPorDefecto = (): DiaBorrador => ({ modo: '24h', turno1: turnoVacio(), turno2: null })

/**
 * Los 7 días indexados por `diaSemana`. Sin horarios guardados todos arrancan en 24h,
 * para que encender "Usar horarios" no deje el local cerrado sin querer.
 */
export function aBorrador(dias: HorarioDia[]): DiaBorrador[] {
  const borrador = Array.from({ length: 7 }, diaPorDefecto)
  for (const d of dias) {
    if (d.diaSemana < 0 || d.diaSemana > 6) continue
    const tieneTurno2 = d.turno2Apertura !== null || d.turno2Cierre !== null
    borrador[d.diaSemana] = {
      modo: d.modo,
      turno1: { apertura: d.turno1Apertura ?? '', cierre: d.turno1Cierre ?? '' },
      turno2: tieneTurno2 ? { apertura: d.turno2Apertura ?? '', cierre: d.turno2Cierre ?? '' } : null,
    }
  }
  return borrador
}

const horaOnull = (hora: string) => (hora === '' ? null : hora)

/**
 * Lo que se manda al backend. Apagado = sin días. Los turnos solo viajan con modo 'Turnos':
 * el backend rechaza turnos cargados en un día Cerrado o 24h, y acá se conservan en el
 * borrador por si el dueño vuelve a Turnos.
 */
export function aPayload(borrador: DiaBorrador[], usarHorarios: boolean): HorarioDia[] {
  if (!usarHorarios) return []
  return borrador.map((d, diaSemana) => {
    const conTurnos = d.modo === 'Turnos'
    return {
      diaSemana,
      modo: d.modo,
      turno1Apertura: conTurnos ? horaOnull(d.turno1.apertura) : null,
      turno1Cierre: conTurnos ? horaOnull(d.turno1.cierre) : null,
      turno2Apertura: conTurnos && d.turno2 ? horaOnull(d.turno2.apertura) : null,
      turno2Cierre: conTurnos && d.turno2 ? horaOnull(d.turno2.cierre) : null,
    }
  })
}

/** Copia independiente de un día (los turnos son objetos: no se comparten entre días). */
export const copiarDia = (d: DiaBorrador): DiaBorrador => ({
  modo: d.modo,
  turno1: { ...d.turno1 },
  turno2: d.turno2 ? { ...d.turno2 } : null,
})

/** Un cierre menor que la apertura significa que el turno termina al día siguiente. */
export const cruzaMedianoche = (t: Turno) => t.apertura !== '' && t.cierre !== '' && t.cierre < t.apertura

// ── Texto del estado ──────────────────────────────────────────────────────────
// proximoCambio viene en UTC; siempre se muestra en la zona del local, nunca en la del navegador.

export function describirEstado(estado: EstadoLocal, zona: string, ahora: number): string {
  if (estado.motivo === 'CerradoManualmente') return 'Cerrado manualmente'
  if (estado.motivo === 'SinHorarios') return 'Abierto siempre (sin horarios)'

  if (estado.estaAbierto) {
    const cierre = estado.proximoCambio ? cuandoEn(estado.proximoCambio, zona, ahora, 'cierra') : null
    return cierre ? `Abierto ahora · cierra ${cierre}` : 'Abierto ahora'
  }
  const apertura = estado.proximoCambio ? cuandoEn(estado.proximoCambio, zona, ahora, 'abre') : null
  return apertura ? `Cerrado por horario · abre ${apertura}` : 'Cerrado por horario'
}

// ── Errores ───────────────────────────────────────────────────────────────────

export interface ErrorHorarios {
  mensaje: string
  /** Lista del 400 (uno por problema). Vacía si el error no trae detalle. */
  errores: string[]
  /** 409: los horarios cambiaron desde otro lugar mientras se editaba. */
  conflicto: boolean
}

export function leerErrorHorarios(e: unknown): ErrorHorarios {
  const generico = 'No se pudieron guardar los horarios. Intentá de nuevo.'
  if (!isAxiosError(e) || !e.response) return { mensaje: generico, errores: [], conflicto: false }

  const data: unknown = e.response.data
  const cuerpo = typeof data === 'object' && data !== null ? (data as { mensaje?: unknown; errores?: unknown }) : {}
  const mensaje = typeof cuerpo.mensaje === 'string' ? cuerpo.mensaje : generico
  const errores = Array.isArray(cuerpo.errores) ? cuerpo.errores.filter((x): x is string => typeof x === 'string') : []
  return { mensaje, errores, conflicto: e.response.status === 409 }
}
