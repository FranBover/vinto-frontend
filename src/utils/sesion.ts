// Formateo del vencimiento de la sesión del panel. A diferencia de utils/horarios.ts, acá la hora
// va en la zona del dispositivo a propósito: es el reloj que mira quien usa el panel, no un
// horario de atención del local.

const inicioDelDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** "a las 22:03", "mañana a las 11:00", "ayer a las 22:03" o "el 20/10 a las 22:03". */
export function cuandoVence(ms: number, ahora: number): string {
  const fecha = new Date(ms)
  const hora = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(fecha)

  const dias = Math.round((inicioDelDia(fecha) - inicioDelDia(new Date(ahora))) / 86_400_000)
  if (dias === 0) return `a las ${hora}`
  if (dias === 1) return `mañana a las ${hora}`
  if (dias === -1) return `ayer a las ${hora}`
  const dia = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'numeric' }).format(fecha)
  return `el ${dia} a las ${hora}`
}
