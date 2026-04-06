import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { getAdministrador, updateLocalData } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import type { Administrador } from '../../types'

const inputCls =
  'w-full border border-[#d0d0d0] px-3 py-2.5 text-sm rounded-none outline-none focus:border-[#1a1a1a] bg-white transition-colors'
const labelCls =
  'block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1.5'

export default function MiLocalPage() {
  const adminId = useAuthStore(s => s.adminId)
  const [admin, setAdmin] = useState<Administrador | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [esActivo, setEsActivo] = useState(false)
  const [nombreLocal, setNombreLocal] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [linkWhatsapp, setLinkWhatsapp] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [aliasTransferencia, setAliasTransferencia] = useState('')
  const [titularCuenta, setTitularCuenta] = useState('')
  const [horarios, setHorarios] = useState('')
  const [ubicacionUrl, setUbicacionUrl] = useState('')

  useEffect(() => {
    if (!adminId) return
    getAdministrador(adminId)
      .then((a: Administrador) => {
        setAdmin(a)
        setEsActivo(a.esAbierto)
        setNombreLocal(a.nombreLocal)
        setTelefono(a.telefono)
        setDireccion(a.direccion)
        setLinkWhatsapp(a.linkWhatsapp ?? '')
        setLogoUrl(a.logoUrl ?? '')
        setAliasTransferencia(a.aliasTransferencia ?? '')
        setTitularCuenta(a.titularCuenta ?? '')
        setHorarios(a.horarios ?? '')
        setUbicacionUrl(a.ubicacionUrl ?? '')
      })
      .catch(() => setError('No se pudieron cargar los datos del local.'))
      .finally(() => setLoading(false))
  }, [adminId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminId) return
    setSaving(true)
    setError(null)
    setSavedMsg(false)
    try {
      await updateLocalData(adminId, {
        esActivo,
        nombreLocal: nombreLocal.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        linkWhatsapp: linkWhatsapp.trim(),
        logoUrl: logoUrl.trim(),
        aliasTransferencia: aliasTransferencia.trim(),
        titularCuenta: titularCuenta.trim(),
        horarios: horarios.trim(),
        ubicacionUrl: ubicacionUrl.trim(),
      })
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 3000)
    } catch {
      setError('No se pudo guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout
      title="Mi local"
      actions={
        <button
          form="mi-local-form"
          type="submit"
          disabled={saving}
          className="text-sm font-bold text-white px-5 py-2.5 rounded-none disabled:opacity-50 transition-colors"
          style={{ backgroundColor: saving ? '#aaa' : '#2d5a27' }}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      }
    >
      {loading ? (
        <p className="text-sm text-[#aaa] py-8 text-center">Cargando…</p>
      ) : (
        <form id="mi-local-form" onSubmit={handleSave} className="max-w-lg space-y-6">

          {/* Abierto/Cerrado toggle */}
          <div className="border border-[#e8e8e8] bg-white px-6 py-5 flex items-center justify-between">
            <div>
              <p className="font-bold text-[15px]">{esActivo ? 'Local abierto' : 'Local cerrado'}</p>
              <p className="text-sm text-[#aaa] mt-0.5">
                {esActivo
                  ? 'Los clientes pueden hacer pedidos ahora.'
                  : 'El local no acepta pedidos en este momento.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEsActivo(v => !v)}
              className="relative flex-shrink-0 ml-6"
              style={{ width: 52, height: 28 }}
              aria-pressed={esActivo}
            >
              <span
                className="block w-full h-full transition-colors"
                style={{
                  backgroundColor: esActivo ? '#2d5a27' : '#d0d0d0',
                  borderRadius: 0,
                }}
              />
              <span
                className="absolute top-1 transition-all bg-white"
                style={{
                  width: 20,
                  height: 20,
                  left: esActivo ? 28 : 4,
                  borderRadius: 0,
                }}
              />
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {savedMsg && (
            <p className="text-sm font-bold text-[#2d5a27]">Cambios guardados</p>
          )}

          {/* Fields */}
          <div className="border border-[#e8e8e8] bg-white px-6 py-5 space-y-4">
            <div>
              <label className={labelCls}>Nombre del local</label>
              <input
                className={inputCls}
                value={nombreLocal}
                onChange={e => setNombreLocal(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input
                className={inputCls}
                type="tel"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Dirección</label>
              <input
                className={inputCls}
                value={direccion}
                onChange={e => setDireccion(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Link de WhatsApp</label>
              <input
                className={inputCls}
                type="url"
                value={linkWhatsapp}
                onChange={e => setLinkWhatsapp(e.target.value)}
                placeholder="https://wa.me/..."
              />
            </div>
            <div>
              <label className={labelCls}>Alias de transferencia</label>
              <input
                className={inputCls}
                value={aliasTransferencia}
                onChange={e => setAliasTransferencia(e.target.value)}
                placeholder="mi.alias"
              />
            </div>
            <div>
              <label className={labelCls}>Titular de la cuenta</label>
              <input
                className={inputCls}
                value={titularCuenta}
                onChange={e => setTitularCuenta(e.target.value)}
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <label className={labelCls}>Horarios</label>
              <textarea
                className={`${inputCls} resize-none`}
                rows={2}
                value={horarios}
                onChange={e => setHorarios(e.target.value)}
                placeholder="Ej: Mar a Dom de 19:30 a 01:00"
              />
            </div>
            <div>
              <label className={labelCls}>Link de ubicación (Google Maps)</label>
              <input
                className={inputCls}
                type="url"
                value={ubicacionUrl}
                onChange={e => setUbicacionUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
              />
            </div>
            <div>
              <label className={labelCls}>URL del logo</label>
              <input
                className={inputCls}
                type="url"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
              {logoUrl && (
                <div className="mt-3 w-16 h-16 border border-[#e8e8e8] overflow-hidden">
                  <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {admin && (
            <div className="text-xs text-[#aaa]">
              Slug del local: <span className="font-mono text-[#666]">{admin.nombre.toLowerCase().replace(/\s+/g, '-')}</span>
            </div>
          )}
        </form>
      )}
    </AdminLayout>
  )
}
