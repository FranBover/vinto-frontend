import { useState } from 'react'
import { isAxiosError } from 'axios'
import { updateLocalData } from '../../api/adminApi'
import type { Administrador } from '../../types'

const SERIF = "'Fraunces', Georgia, serif"

interface Props {
  adminId: number
  admin: Administrador
  onSlugGuardado: (slugLocal: string) => void
}

export default function SeccionUrlPublica({ adminId, admin, onSlugGuardado }: Props) {
  const [editando, setEditando] = useState(false)
  const [nuevoSlug, setNuevoSlug] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  const urlPublica = `${window.location.origin}/${admin.slugLocal}`

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(urlPublica)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setError('No se pudo copiar. Seleccioná el link y copialo a mano.')
    }
  }

  const empezarEdicion = () => {
    setNuevoSlug(admin.slugLocal)
    setError(null)
    setEditando(true)
  }

  const cancelar = () => {
    setEditando(false)
    setError(null)
  }

  const confirmar = async () => {
    setGuardando(true)
    setError(null)
    try {
      // Se manda lo ya guardado del local (no los cambios sin guardar del form)
      const res = await updateLocalData(adminId, {
        nombreLocal: admin.nombreLocal,
        telefono: admin.telefono,
        direccion: admin.direccion,
        linkWhatsapp: admin.linkWhatsapp ?? '',
        logoUrl: admin.logoUrl ?? '',
        esActivo: admin.esAbierto,
        aliasTransferencia: admin.aliasTransferencia ?? '',
        titularCuenta: admin.titularCuenta ?? '',
        horarios: admin.horarios ?? '',
        ubicacionUrl: admin.ubicacionUrl ?? '',
        zonaEnvio: admin.zonaEnvio,
        costoEnvio: admin.costoEnvio,
        slugLocal: nuevoSlug.trim(),
      })
      onSlugGuardado(res.slugLocal ?? nuevoSlug.trim())
      setEditando(false)
    } catch (e) {
      const mensaje = isAxiosError(e) ? e.response?.data?.mensaje : null
      setError(mensaje ?? 'No se pudo cambiar la URL. Intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="border border-[#1a1a1a] bg-[#faf8f4] px-6 py-5 space-y-4">
      <div>
        <p className="text-[10px] font-bold text-[#6b6258] uppercase tracking-widest mb-1">
          Link público de tu local
        </p>
        <p className="text-xl font-bold break-all" style={{ fontFamily: SERIF }}>
          {urlPublica}
        </p>
      </div>

      {!editando && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copiar}
            className="text-sm font-bold text-white bg-[#73223a] hover:bg-[#651d33] px-4 py-2.5 rounded-none transition-colors"
          >
            {copiado ? 'Copiado ✓' : 'Copiar link'}
          </button>
          <button
            type="button"
            onClick={empezarEdicion}
            className="text-sm font-bold text-[#1a1a1a] border border-[#1a1a1a] px-4 py-2.5 rounded-none hover:bg-[#ede5d3] transition-colors"
          >
            Cambiar URL
          </button>
        </div>
      )}

      {editando && (
        <div className="space-y-3">
          <div className="border border-[#a92020] bg-white px-4 py-3">
            <p className="text-sm font-bold text-[#a92020]">
              Atención: cambiar la URL rompe todos los links ya compartidos.
            </p>
            <p className="text-sm text-[#1a1a1a] mt-1">
              Los códigos QR impresos, el link de Instagram, los mensajes de WhatsApp y cualquier
              otro lugar donde hayas publicado la URL actual dejarán de funcionar. Tendrías que
              volver a compartir el link nuevo.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#6b6258] uppercase tracking-widest mb-1.5">
              Nueva URL
            </label>
            <div className="flex items-stretch border border-[#d0d0d0] bg-white focus-within:border-[#1a1a1a]">
              <span className="px-3 py-2.5 text-sm text-[#6b6258] bg-[#ede5d3] border-r border-[#e8e1d4] whitespace-nowrap">
                {window.location.host}/
              </span>
              <input
                className="flex-1 min-w-0 px-3 py-2.5 text-sm font-mono rounded-none outline-none bg-white"
                value={nuevoSlug}
                onChange={e => setNuevoSlug(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmar}
              disabled={guardando || !nuevoSlug.trim() || nuevoSlug.trim() === admin.slugLocal}
              className="text-sm font-bold text-white bg-[#73223a] hover:bg-[#651d33] px-4 py-2.5 rounded-none disabled:opacity-50 transition-colors"
            >
              {guardando ? 'Guardando…' : 'Entiendo, cambiar URL'}
            </button>
            <button
              type="button"
              onClick={cancelar}
              disabled={guardando}
              className="text-sm font-bold text-[#1a1a1a] border border-[#1a1a1a] px-4 py-2.5 rounded-none hover:bg-[#ede5d3] disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm font-bold text-[#a92020]">{error}</p>}
    </div>
  )
}
