import { useEffect, useState } from 'react'
import { getHorariosLocal } from '../../../api/adminApi'
import type { EstadoLocal, HorariosLocal } from '../../../types'
import EditorHorarios from './EditorHorarios'
import EstadoLocalBloque from './EstadoLocalBloque'

// Tope de setTimeout (int32). proximoCambio está a 7 días como máximo, pero no cuesta nada acotarlo.
const MAX_TIMER_MS = 2_147_483_647

/**
 * Estado del local (abierto/cerrado, cierre manual) + editor de horarios. Se carga y guarda
 * aparte del formulario de "Mi local": son otros endpoints, con su propia validación.
 */
export default function SeccionHorarios() {
  const [horarios, setHorarios] = useState<HorariosLocal | null>(null)
  const [ahora, setAhora] = useState(() => Date.now())
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  // Cada cambio vuelve a pedir los horarios; `claveEditor` remonta el editor para que tome el borrador nuevo.
  const [intento, setIntento] = useState(0)
  const [claveEditor, setClaveEditor] = useState(0)

  useEffect(() => {
    let vigente = true
    getHorariosLocal()
      .then(h => {
        if (!vigente) return
        setHorarios(h)
        setAhora(Date.now())
        setErrorCarga(false)
        setClaveEditor(k => k + 1)
      })
      .catch(() => {
        if (vigente) setErrorCarga(true)
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [intento])

  // El panel queda abierto horas: el "Abierto ahora" tiene que cambiar solo cuando llega el próximo
  // cambio, o al volver a la pestaña. Solo se actualiza el estado; los días del editor no se tocan.
  const hayHorarios = horarios !== null
  const proximoCambio = horarios?.estado.proximoCambio ?? null
  useEffect(() => {
    if (!hayHorarios) return
    let vigente = true
    const refrescar = () => {
      getHorariosLocal()
        .then(h => {
          if (!vigente) return
          setAhora(Date.now())
          setHorarios(prev => (prev ? { ...prev, cerradoManualmente: h.cerradoManualmente, estado: h.estado } : prev))
        })
        .catch(() => {})
    }
    const timer = proximoCambio
      ? setTimeout(refrescar, Math.min(Math.max(Date.parse(proximoCambio) - Date.now(), 0) + 1000, MAX_TIMER_MS))
      : undefined
    const alVolver = () => {
      if (document.visibilityState === 'visible') refrescar()
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      vigente = false
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [hayHorarios, proximoCambio])

  const recargar = () => {
    if (!horarios) setCargando(true)
    setErrorCarga(false)
    setIntento(n => n + 1)
  }

  const aplicarEstado = (estado: EstadoLocal, cerradoManualmente: boolean) => {
    setAhora(Date.now())
    setHorarios(prev => (prev ? { ...prev, cerradoManualmente, estado } : prev))
  }

  const aplicarGuardado = (guardado: HorariosLocal) => {
    setAhora(Date.now())
    setHorarios(guardado)
  }

  if (cargando) {
    return <p className="text-sm text-[#aaa] py-4 text-center">Cargando horarios…</p>
  }

  if (!horarios) {
    return (
      <div className="border border-[#e8e8e8] bg-white px-4 sm:px-6 py-5 space-y-3">
        <p className="text-sm font-bold text-[#a92020]">No se pudieron cargar los horarios del local.</p>
        <button
          type="button"
          onClick={recargar}
          className="w-full sm:w-auto min-h-[44px] text-sm font-bold text-[#1a1a1a] border border-[#1a1a1a] px-5 rounded-none hover:bg-[#f5f5f5] transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <>
      {errorCarga && <p className="text-sm font-bold text-[#a92020]">No se pudieron recargar los horarios. Intentá de nuevo.</p>}
      <EstadoLocalBloque horarios={horarios} ahora={ahora} onCambio={aplicarEstado} />
      <EditorHorarios key={claveEditor} horarios={horarios} onGuardado={aplicarGuardado} onRecargar={recargar} />
    </>
  )
}
