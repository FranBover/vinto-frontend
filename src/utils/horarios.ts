import { isAxiosError } from 'axios'
import type { EstadoLocal, HorarioDia } from '../types'

// Formateo de horarios compartido entre el panel y la tienda pública. Toda hora que se muestra
// sale de `zonaHoraria` del local (Intl con timeZone): nunca de la zona del navegador.

// ── Días ──────────────────────────────────────────────────────────────────────
// El backend numera con System.DayOfWeek (0 = domingo); en pantalla la semana va de
// lunes a domingo. Este es el único lugar donde se hace ese mapeo.

export const NOMBRES_DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

/** Orden de pantalla (lunes a domingo), expresado en `diaSemana`. */
export const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0]

// ── Instantes en la zona del local ────────────────────────────────────────────

const partesDeFecha = (fecha: Date, zona: string) => {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(fecha)
  const valor = (tipo: string) => Number(partes.find(p => p.type === tipo)?.value)
  return { anio: valor('year'), mes: valor('month'), dia: valor('day') }
}

/** Días de calendario (en la zona del local) entre `desde` y `hasta`. */
const diasEntre = (desde: Date, hasta: Date, zona: string) => {
  const a = partesDeFecha(desde, zona)
  const b = partesDeFecha(hasta, zona)
  return Math.round((Date.UTC(b.anio, b.mes - 1, b.dia) - Date.UTC(a.anio, a.mes - 1, a.dia)) / 86_400_000)
}

/** "23:00", "mañana a las 10:00", "el lunes a las 10:00"... Null si la zona no es válida. */
export function cuandoEn(iso: string, zona: string, ahora: number, accion: 'cierra' | 'abre'): string | null {
  try {
    const cambio = new Date(iso)
    const hora = new Intl.DateTimeFormat('es-AR', {
      timeZone: zona,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(cambio)

    const dias = diasEntre(new Date(ahora), cambio, zona)
    if (dias <= 0) return accion === 'cierra' ? hora : `hoy a las ${hora}`
    if (dias === 1) return `mañana a las ${hora}`

    const diaSemana = new Intl.DateTimeFormat('es-AR', { timeZone: zona, weekday: 'long' }).format(cambio)
    // A 7 días el nombre del día repite el de hoy: se agrega la fecha para no confundir.
    if (dias >= 7) {
      const fecha = new Intl.DateTimeFormat('es-AR', { timeZone: zona, day: 'numeric', month: 'numeric' }).format(cambio)
      return `el ${diaSemana} ${fecha} a las ${hora}`
    }
    return `el ${diaSemana} a las ${hora}`
  } catch {
    return null
  }
}

// ── Tienda pública ────────────────────────────────────────────────────────────

/** Aviso para el cliente cuando el local está cerrado. */
export function avisoLocalCerrado(estado: EstadoLocal, zona: string, ahora: number): string {
  // Cierre manual: nadie sabe cuándo se reabre. Sin próxima apertura (todo cerrado): igual.
  if (estado.motivo === 'Horario' && estado.proximoCambio) {
    const apertura = cuandoEn(estado.proximoCambio, zona, ahora, 'abre')
    if (apertura) return `Cerrado · abre ${apertura}`
  }
  return 'Cerrado por el momento'
}

export interface LocalCerrado {
  mensaje: string
  proximoCambio: string | null
}

/** Interpreta el 409 { mensaje, codigo: "LocalCerrado", proximoCambio } del POST de pedido; null si es otro error. */
export function leerLocalCerrado(e: unknown): LocalCerrado | null {
  if (!isAxiosError(e) || e.response?.status !== 409) return null
  const data: unknown = e.response.data
  if (typeof data !== 'object' || data === null) return null
  const cuerpo = data as { mensaje?: unknown; codigo?: unknown; proximoCambio?: unknown }
  if (cuerpo.codigo !== 'LocalCerrado') return null
  return {
    mensaje: typeof cuerpo.mensaje === 'string' ? cuerpo.mensaje : 'El local está cerrado por el momento.',
    proximoCambio: typeof cuerpo.proximoCambio === 'string' ? cuerpo.proximoCambio : null,
  }
}

export interface GrupoHorario {
  /** "Lunes a viernes", "Sábado"... Null cuando el horario es de todos los días y no necesita título. */
  dias: string | null
  horas: string
}

const horasDelDia = (d: HorarioDia | undefined): string => {
  if (!d || d.modo === 'Cerrado') return 'cerrado'
  if (d.modo === '24h') return 'abierto 24 hs'
  const turnos: string[] = []
  if (d.turno1Apertura && d.turno1Cierre) turnos.push(`${d.turno1Apertura}–${d.turno1Cierre}`)
  if (d.turno2Apertura && d.turno2Cierre) turnos.push(`${d.turno2Apertura}–${d.turno2Cierre}`)
  return turnos.length > 0 ? turnos.join(' y ') : 'cerrado'
}

const etiquetaDias = (nombres: string[]): string => {
  if (nombres.length === 1) return nombres[0]
  const ultimo = nombres[nombres.length - 1].toLowerCase()
  return nombres.length === 2 ? `${nombres[0]} y ${ultimo}` : `${nombres[0]} a ${ultimo}`
}

/**
 * Horarios listos para mostrar: de lunes a domingo, juntando los días consecutivos que tienen
 * el mismo horario ("Lunes a viernes: 10:00–14:00 y 19:00–23:00"). Sin días: lista vacía.
 */
export function resumirHorarios(dias: HorarioDia[]): GrupoHorario[] {
  if (dias.length === 0) return []

  const porDia = ORDEN_DIAS.map(diaSemana => ({
    nombre: NOMBRES_DIAS[diaSemana],
    horas: horasDelDia(dias.find(d => d.diaSemana === diaSemana)),
  }))

  const grupos: { nombres: string[]; horas: string }[] = []
  for (const dia of porDia) {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.horas === dia.horas) ultimo.nombres.push(dia.nombre)
    else grupos.push({ nombres: [dia.nombre], horas: dia.horas })
  }

  // Todos los días iguales: no hace falta repetir "de lunes a domingo".
  if (grupos.length === 1) {
    const { horas } = grupos[0]
    return horas === 'abierto 24 hs'
      ? [{ dias: null, horas: 'Abierto 24 hs' }]
      : [{ dias: 'Todos los días', horas }]
  }
  return grupos.map(g => ({ dias: etiquetaDias(g.nombres), horas: g.horas }))
}
