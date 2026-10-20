import { useState } from 'react'
import { setCierreManual } from '../../../api/adminApi'
import type { EstadoLocal, HorariosLocal } from '../../../types'
import { describirEstado } from './horariosUtils'

interface Props {
  horarios: HorariosLocal
  /** Instante (ms) con el que se calculó el texto relativo ("hoy", "mañana"). */
  ahora: number
  onCambio: (estado: EstadoLocal, cerradoManualmente: boolean) => void
}

export default function EstadoLocalBloque({ horarios, ahora, onCambio }: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const { estado, cerradoManualmente, zonaHoraria } = horarios
  const abierto = estado.estaAbierto
  // Fuera de horario el cierre manual también se puede pedir: queda cerrado en la próxima apertura.
  const cerradoPorHorario = !abierto && estado.motivo === 'Horario'

  const detalle = abierto
    ? 'Los clientes pueden hacer pedidos ahora.'
    : estado.motivo === 'CerradoManualmente'
      ? 'Los clientes no pueden hacer pedidos hasta que lo reabras.'
      : 'Los clientes no pueden hacer pedidos fuera de horario.'

  const cambiar = async (cerrado: boolean) => {
    setGuardando(true)
    setError(null)
    setAviso(null)
    try {
      const nuevo = await setCierreManual(cerrado)
      onCambio(nuevo, cerrado)
      setConfirmando(false)
      if (!cerrado && !nuevo.estaAbierto) {
        setAviso('Se quitó el cierre manual, pero el local sigue cerrado porque está fuera de su horario.')
      }
    } catch {
      setError(cerrado ? 'No se pudo cerrar el local. Intentá de nuevo.' : 'No se pudo reabrir el local. Intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="border border-[#e8e8e8] bg-white px-4 sm:px-6 py-5 space-y-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex-shrink-0 mt-[7px]"
          style={{ width: 10, height: 10, backgroundColor: abierto ? '#2d5a27' : '#a92020' }}
        />
        <div className="min-w-0">
          <p role="status" className="font-bold text-[15px] leading-snug">
            {describirEstado(estado, zonaHoraria, ahora)}
          </p>
          <p className="text-sm text-[#6b6258] mt-0.5">{detalle}</p>
        </div>
      </div>

      {!confirmando && (
        <div>
          {cerradoManualmente ? (
            <button
              type="button"
              onClick={() => void cambiar(false)}
              disabled={guardando}
              className="w-full sm:w-auto min-h-[44px] text-sm font-bold text-white bg-[#1a1a1a] px-5 rounded-none disabled:opacity-50 transition-colors"
            >
              {guardando ? 'Reabriendo…' : 'Reabrir'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setError(null)
                setAviso(null)
                setConfirmando(true)
              }}
              className="w-full sm:w-auto min-h-[44px] text-sm font-bold text-[#a92020] border border-[#a92020] px-5 rounded-none hover:bg-[#fdecec] transition-colors"
            >
              Cerrar ahora
            </button>
          )}
        </div>
      )}

      {confirmando && (
        <div className="border border-[#a92020] px-4 py-3 space-y-3">
          <div>
            <p className="text-sm font-bold text-[#a92020]">¿Cerrar el local ahora?</p>
            <p className="text-sm text-[#1a1a1a] mt-1">
              {cerradoPorHorario
                ? 'El local ya está cerrado por horario. Si lo cerrás manualmente, tampoco va a abrir en su próximo horario hasta que lo reabras.'
                : 'Los clientes no van a poder hacer pedidos, aunque estés dentro del horario, hasta que lo reabras.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => void cambiar(true)}
              disabled={guardando}
              className="w-full sm:w-auto min-h-[44px] text-sm font-bold text-white bg-[#a92020] px-5 rounded-none disabled:opacity-50 transition-colors"
            >
              {guardando ? 'Cerrando…' : 'Sí, cerrar el local'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={guardando}
              className="w-full sm:w-auto min-h-[44px] text-sm font-bold text-[#1a1a1a] border border-[#1a1a1a] px-5 rounded-none hover:bg-[#f5f5f5] disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {aviso && <p className="text-sm text-[#1a1a1a]">{aviso}</p>}
      {error && <p className="text-sm font-bold text-[#a92020]">{error}</p>}
    </div>
  )
}
