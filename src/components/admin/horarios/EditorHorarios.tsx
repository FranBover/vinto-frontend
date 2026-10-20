import { useEffect, useMemo, useRef, useState } from 'react'
import { updateHorariosLocal } from '../../../api/adminApi'
import type { HorariosLocal, ModoHorario } from '../../../types'
import { NOMBRES_DIAS, ORDEN_DIAS } from '../../../utils/horarios'
import {
  MODOS,
  aBorrador,
  aPayload,
  copiarDia,
  cruzaMedianoche,
  leerErrorHorarios,
  type DiaBorrador,
  type ErrorHorarios,
  type Turno,
} from './horariosUtils'

interface Props {
  /** Último estado guardado en el backend: es la referencia para saber si hay cambios sin guardar. */
  horarios: HorariosLocal
  onGuardado: (horarios: HorariosLocal) => void
  /** Descarta el borrador y vuelve a pedir los horarios al backend (tras un 409). */
  onRecargar: () => void
}

const timeCls =
  'w-[7.5rem] min-h-[44px] border border-[#d0d0d0] px-2 text-base md:text-sm rounded-none outline-none focus:border-[#1a1a1a] bg-white transition-colors'
const linkBtnCls =
  'min-h-[32px] px-1 text-xs font-bold text-[#6b6258] underline underline-offset-2 hover:text-[#1a1a1a] transition-colors'

interface TurnoFilaProps {
  numero: 1 | 2
  turno: Turno
  nombreDia: string
  onChange: (campo: keyof Turno, valor: string) => void
  onQuitar?: () => void
}

function TurnoFila({ numero, turno, nombreDia, onChange, onQuitar }: TurnoFilaProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-widest">Turno {numero}</p>
        {onQuitar && (
          <button
            type="button"
            onClick={onQuitar}
            aria-label={`Quitar el segundo turno del ${nombreDia.toLowerCase()}`}
            className={linkBtnCls}
          >
            Quitar
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
        <input
          type="time"
          className={timeCls}
          value={turno.apertura}
          onChange={e => onChange('apertura', e.target.value)}
          aria-label={`Apertura del turno ${numero}, ${nombreDia.toLowerCase()}`}
        />
        <span className="text-sm text-[#6b6258]">a</span>
        <input
          type="time"
          className={timeCls}
          value={turno.cierre}
          onChange={e => onChange('cierre', e.target.value)}
          aria-label={`Cierre del turno ${numero}, ${nombreDia.toLowerCase()}`}
        />
        {cruzaMedianoche(turno) && <span className="text-xs text-[#6b6258]">(cierra al día siguiente)</span>}
      </div>
    </div>
  )
}

export default function EditorHorarios({ horarios, onGuardado, onRecargar }: Props) {
  const [usarHorarios, setUsarHorarios] = useState(horarios.dias.length > 0)
  const [borrador, setBorrador] = useState<DiaBorrador[]>(() => aBorrador(horarios.dias))
  const [guardando, setGuardando] = useState(false)
  const [guardadoOk, setGuardadoOk] = useState(false)
  const [error, setError] = useState<ErrorHorarios | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  // Mientras el borrador sea igual a lo guardado (aunque se haya tocado y vuelto atrás) no hay cambios.
  const guardado = useMemo(
    () => JSON.stringify(aPayload(aBorrador(horarios.dias), horarios.dias.length > 0)),
    [horarios.dias],
  )
  const sinGuardar = JSON.stringify(aPayload(borrador, usarHorarios)) !== guardado

  // Centrado, para que no lo tape ni el header sticky del panel ni la barra de guardar pegada abajo.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [error])

  const editarDia = (diaSemana: number, cambio: (d: DiaBorrador) => DiaBorrador) => {
    setGuardadoOk(false)
    setBorrador(prev => prev.map((d, i) => (i === diaSemana ? cambio(d) : d)))
  }

  const setModo = (diaSemana: number, modo: ModoHorario) => editarDia(diaSemana, d => ({ ...d, modo }))

  const setHora = (diaSemana: number, numero: 1 | 2, campo: keyof Turno, valor: string) =>
    editarDia(diaSemana, d => {
      if (numero === 1) return { ...d, turno1: { ...d.turno1, [campo]: valor } }
      return { ...d, turno2: { ...(d.turno2 ?? { apertura: '', cierre: '' }), [campo]: valor } }
    })

  const copiarATodos = (origen: number) => {
    setGuardadoOk(false)
    setBorrador(prev => prev.map(() => copiarDia(prev[origen])))
  }

  const restaurar = (h: HorariosLocal) => {
    setUsarHorarios(h.dias.length > 0)
    setBorrador(aBorrador(h.dias))
  }

  const descartar = () => {
    restaurar(horarios)
    setError(null)
    setGuardadoOk(false)
  }

  const guardar = async () => {
    setGuardando(true)
    setError(null)
    setGuardadoOk(false)
    try {
      // zonaHoraria no se edita: se reenvía la que vino del GET.
      const res = await updateHorariosLocal({
        zonaHoraria: horarios.zonaHoraria,
        dias: aPayload(borrador, usarHorarios),
      })
      restaurar(res)
      onGuardado(res)
      setGuardadoOk(true)
      setTimeout(() => setGuardadoOk(false), 3000)
    } catch (e) {
      setError(leerErrorHorarios(e))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="border border-[#e8e8e8] bg-white">
      <div className="px-4 sm:px-6 py-5 space-y-4">
        <p className="font-bold text-[13px]">Horarios de atención</p>

        <button
          type="button"
          role="switch"
          aria-checked={usarHorarios}
          onClick={() => {
            setGuardadoOk(false)
            setUsarHorarios(v => !v)
          }}
          className="w-full flex items-center justify-between gap-4 min-h-[44px] text-left"
        >
          <span className="font-bold text-[15px]">Usar horarios</span>
          <span className="relative flex-shrink-0" style={{ width: 52, height: 28 }}>
            <span
              className="block w-full h-full transition-colors"
              style={{ backgroundColor: usarHorarios ? '#2d5a27' : '#d0d0d0' }}
            />
            <span
              className="absolute top-1 transition-all bg-white"
              style={{ width: 20, height: 20, left: usarHorarios ? 28 : 4 }}
            />
          </span>
        </button>

        {!usarHorarios && (
          <p className="text-sm text-[#6b6258]">
            Sin horarios fijos el local figura abierto todo el tiempo, salvo que lo cierres a mano.
          </p>
        )}

        {error && (
          <div ref={errorRef} role="alert" className="border border-[#a92020] bg-[#fdecec] px-4 py-3 space-y-2">
            <p className="text-sm font-bold text-[#a92020]">{error.mensaje}</p>
            {error.errores.length > 0 && (
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#1a1a1a]">
                {error.errores.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            {error.conflicto && (
              <button
                type="button"
                onClick={onRecargar}
                className="w-full sm:w-auto min-h-[44px] text-sm font-bold text-[#1a1a1a] border border-[#1a1a1a] bg-white px-5 rounded-none hover:bg-[#f5f5f5] transition-colors"
              >
                Recargar horarios
              </button>
            )}
          </div>
        )}

        {usarHorarios && (
          <>
            <p className="text-xs text-[#6b6258]">
              Zona horaria: {horarios.zonaHoraria.replace(/_/g, ' ')}
            </p>

            <div className="divide-y divide-[#e8e8e8] border-t border-[#e8e8e8]">
              {ORDEN_DIAS.map(diaSemana => {
                const dia = borrador[diaSemana]
                const nombre = NOMBRES_DIAS[diaSemana]
                return (
                  <div key={diaSemana} className="py-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-[14px]">{nombre}</p>
                      <button
                        type="button"
                        onClick={() => copiarATodos(diaSemana)}
                        aria-label={`Copiar el horario del ${nombre.toLowerCase()} a todos los días`}
                        className={linkBtnCls}
                      >
                        Copiar a todos los días
                      </button>
                    </div>

                    <div role="group" aria-label={`Modo del ${nombre.toLowerCase()}`} className="flex border border-[#1a1a1a]">
                      {MODOS.map(m => (
                        <button
                          key={m.valor}
                          type="button"
                          aria-pressed={dia.modo === m.valor}
                          onClick={() => setModo(diaSemana, m.valor)}
                          className={`flex-1 min-h-[44px] text-sm font-bold rounded-none transition-colors ${
                            dia.modo === m.valor
                              ? 'bg-[#1a1a1a] text-white'
                              : 'bg-white text-[#1a1a1a] hover:bg-[#f5f5f5]'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {dia.modo === 'Turnos' && (
                      <div className="space-y-3">
                        <TurnoFila
                          numero={1}
                          turno={dia.turno1}
                          nombreDia={nombre}
                          onChange={(campo, valor) => setHora(diaSemana, 1, campo, valor)}
                        />
                        {dia.turno2 ? (
                          <TurnoFila
                            numero={2}
                            turno={dia.turno2}
                            nombreDia={nombre}
                            onChange={(campo, valor) => setHora(diaSemana, 2, campo, valor)}
                            onQuitar={() => editarDia(diaSemana, d => ({ ...d, turno2: null }))}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              editarDia(diaSemana, d => ({ ...d, turno2: { apertura: '', cierre: '' } }))
                            }
                            className="min-h-[44px] text-sm font-bold text-[#1a1a1a] underline underline-offset-2"
                          >
                            + Agregar segundo turno
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Pegado abajo: en un celular los 7 días no entran en pantalla y el botón tiene que estar a mano. */}
      <div className="sticky bottom-0 z-10 border-t border-[#e8e8e8] bg-white px-4 sm:px-6 py-3 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        {sinGuardar && (
          <p role="status" className="flex items-center gap-2 text-sm font-bold text-[#1a1a1a] sm:order-last">
            <span aria-hidden="true" className="inline-block bg-[#1a1a1a]" style={{ width: 8, height: 8 }} />
            Cambios sin guardar
          </p>
        )}
        {guardadoOk && !sinGuardar && (
          <p role="status" className="text-sm font-bold text-[#2d5a27] sm:order-last">
            Horarios guardados
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={guardando || !sinGuardar}
            className="flex-[2] sm:flex-none min-h-[44px] whitespace-nowrap text-sm font-bold text-white bg-[#1a1a1a] px-5 rounded-none disabled:opacity-40 transition-colors"
          >
            {guardando ? 'Guardando…' : 'Guardar horarios'}
          </button>
          {sinGuardar && !guardando && (
            <button
              type="button"
              onClick={descartar}
              className="flex-1 sm:flex-none min-h-[44px] text-sm font-bold text-[#1a1a1a] border border-[#1a1a1a] px-5 rounded-none hover:bg-[#f5f5f5] transition-colors"
            >
              Descartar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
