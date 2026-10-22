import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useSonidoStore, VOLUMEN_MIN } from '../../store/sonidoStore'
import { audioSoportado } from '../../utils/audio'
import { DURACION_SONIDO_MS, desbloquearAudio, sonarPedidoNuevo } from '../../utils/sonidoPedidos'

const LADO_FLECHA = 10
// Distancia mínima del globo/panel al borde de la pantalla.
const MARGEN = 16
// Con lugar, la flechita queda a esta distancia del borde izquierdo del globo/panel.
const SANGRIA_FLECHA = 28

// Mide el ícono y escribe el `left` del globo y de su flechita directo en el DOM (sin estado: el
// header ya cambia de ancho solo).
function posicionar(boton: HTMLElement, globo: HTMLElement, flecha: HTMLElement, header: Element) {
  const rb = boton.getBoundingClientRect()
  const centro = rb.left + rb.width / 2
  const ancho = globo.offsetWidth
  const pantalla = document.documentElement.clientWidth
  const izquierda = Math.min(Math.max(centro - SANGRIA_FLECHA, MARGEN), pantalla - MARGEN - ancho)
  // El header es sticky, o sea posicionado: es el bloque contenedor del absolute.
  globo.style.left = `${Math.round(izquierda - header.getBoundingClientRect().left)}px`
  const punta = Math.min(Math.max(centro - izquierda - LADO_FLECHA / 2, 10), ancho - LADO_FLECHA - 10)
  flecha.style.left = `${Math.round(punta)}px`
}

/**
 * Ancla el globo/panel al ícono: lo posiciona a partir del ícono, lo acota a la pantalla y apunta la
 * flechita a su centro. No alcanza con alinearlo al borde derecho del header: el ícono queda lejos de
 * ese borde cuando el chip de conexión o las acciones de la pantalla son anchos.
 */
function useAnclaje(boton: RefObject<HTMLElement | null>, globo: RefObject<HTMLElement | null>, visible: boolean) {
  useLayoutEffect(() => {
    const b = boton.current
    const g = globo.current
    const header = b?.closest('header')
    const flecha = g?.querySelector<HTMLElement>('[data-flecha]')
    if (!visible || !b || !g || !header || !flecha) return

    const medir = () => posicionar(b, g, flecha, header)
    medir()
    const observador = new ResizeObserver(medir)
    // Cualquier ancestro hasta el header: el ícono se corre cuando cambia el grupo de la derecha
    // (chip de conexión, acciones de la pantalla), no su propio contenedor.
    for (let el = b.parentElement; el && el !== header; el = el.parentElement) observador.observe(el)
    observador.observe(g)
    window.addEventListener('resize', medir)
    return () => {
      observador.disconnect()
      window.removeEventListener('resize', medir)
    }
  }, [boton, globo, visible])
}

function Flecha() {
  return (
    <span
      data-flecha
      aria-hidden="true"
      className="absolute -top-[6px] border-l border-t border-[#1a1a1a] bg-white rotate-45"
      style={{ width: LADO_FLECHA, height: LADO_FLECHA, left: 24 }}
    />
  )
}

function IconoParlante({ silenciado }: { silenciado: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      {silenciado && <path d="M3 3l18 18" />}
    </svg>
  )
}

const labelCls = 'block text-[10px] font-bold text-[#aaa] uppercase tracking-widest'

/**
 * Control de sonido de pedidos en el header del panel: ícono de parlante con su estado, panel
 * desplegable (interruptor, volumen, "Probar sonido") y, mientras el navegador siga bloqueando el
 * audio, un globo que pide un toque. El motor (desbloqueo, sonido) está en utils/sonidoPedidos.
 */
export default function SonidoControl() {
  const activado = useSonidoStore(s => s.activado)
  const desbloqueado = useSonidoStore(s => s.desbloqueado)
  const volumen = useSonidoStore(s => s.volumen)
  const setActivado = useSonidoStore(s => s.setActivado)
  const setVolumen = useSonidoStore(s => s.setVolumen)
  const soportado = audioSoportado()
  const pendiente = activado && !desbloqueado && soportado

  const [abierto, setAbierto] = useState(false)
  const [sonando, setSonando] = useState(false)
  const [fallo, setFallo] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const globo = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)

  const verGlobo = pendiente && !abierto
  useAnclaje(boton, panel, abierto)
  useAnclaje(boton, globo, verGlobo)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    if (!pendiente) return
    // Venir de iniciar sesión en esta misma carga ya cuenta como interacción: puede desbloquear solo.
    if (navigator.userActivation?.hasBeenActive) desbloquearAudio()
    // `click` y no `pointerdown`: el globo desaparece al desbloquear, y si lo hiciera en el pointerdown
    // el clic caería sobre lo que quedó debajo. Con touch, además, el pointerdown no habilita el audio.
    window.addEventListener('click', desbloquearAudio, true)
    window.addEventListener('keydown', desbloquearAudio, true)
    return () => {
      window.removeEventListener('click', desbloquearAudio, true)
      window.removeEventListener('keydown', desbloquearAudio, true)
    }
  }, [pendiente])

  useEffect(() => {
    if (!abierto) return
    const alTocarAfuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false)
    }
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setAbierto(false)
      boton.current?.focus()
    }
    document.addEventListener('pointerdown', alTocarAfuera)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('pointerdown', alTocarAfuera)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto])

  const alternar = () => {
    const valor = !activado
    setActivado(valor)
    // El clic es un gesto del usuario: aprovecha para desbloquear el audio.
    if (valor) desbloquearAudio()
  }

  const probar = async () => {
    desbloquearAudio()
    window.clearTimeout(timer.current)
    setFallo(false)
    setSonando(true)
    if (await sonarPedidoNuevo()) {
      timer.current = window.setTimeout(() => setSonando(false), DURACION_SONIDO_MS)
    } else {
      setSonando(false)
      setFallo(true)
    }
  }

  const etiqueta = !activado
    ? 'Sonido de pedidos: desactivado'
    : pendiente
      ? 'Sonido de pedidos: falta tocar para activarlo'
      : 'Sonido de pedidos: activado'
  const porcentaje = Math.round(volumen * 100)

  // Globo y panel cuelgan del header (sticky = posicionado), justo debajo; useAnclaje les da el `left`.
  // El ancho se acota al del header (en el celular, la pantalla menos 2 márgenes).
  const posicion = 'absolute top-full max-w-[calc(100%-2rem)] bg-white border border-[#1a1a1a] sonido-entrada'

  return (
    <div ref={raiz}>
      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto(a => !a)}
        aria-label={etiqueta}
        title={etiqueta}
        aria-expanded={abierto}
        aria-controls="panel-sonido"
        className={`relative flex items-center justify-center w-10 h-10 rounded-none transition-colors hover:bg-[#f5f5f5] ${abierto ? 'bg-[#f5f5f5]' : ''}`}
        style={{ color: activado ? '#1a1a1a' : '#aaa' }}
      >
        <IconoParlante silenciado={!activado} />
        {pendiente && (
          <span
            aria-hidden="true"
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#a92020] animate-pulse motion-reduce:animate-none"
          />
        )}
      </button>

      {verGlobo && (
        <div
          ref={globo}
          role="status"
          className={`${posicion} w-72 px-4 py-3 flex items-center gap-3`}
        >
          <Flecha />
          <p className="flex-1 text-sm font-bold text-[#1a1a1a] leading-snug">
            Tocá para activar el sonido de pedidos
          </p>
          <button
            type="button"
            onClick={desbloquearAudio}
            className="flex-shrink-0 bg-[#1a1a1a] text-white px-3.5 py-2 font-bold text-sm rounded-none"
          >
            Activar
          </button>
        </div>
      )}

      {abierto && (
        <div
          ref={panel}
          id="panel-sonido"
          role="dialog"
          aria-label="Sonido de pedidos"
          className={`${posicion} w-80 px-4 py-4`}
        >
          <Flecha />
          {!soportado ? (
            <p className="text-xs text-[#6b6258]">Este navegador no puede reproducir sonido.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-[13px] text-[#1a1a1a]">Sonido de pedidos</p>
                  <p className="text-xs text-[#6b6258]">{activado ? 'Activado' : 'Desactivado'}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={activado}
                  aria-label="Sonido de pedidos"
                  onClick={alternar}
                  className={`relative flex-shrink-0 w-11 h-6 border border-[#1a1a1a] rounded-none transition-colors ${activado ? 'bg-[#1a1a1a]' : 'bg-white'}`}
                >
                  <span
                    className={`absolute top-[3px] w-4 h-4 transition-all ${activado ? 'left-[23px] bg-white' : 'left-[3px] bg-[#1a1a1a]'}`}
                  />
                </button>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <label htmlFor="sonido-volumen" className={labelCls}>Volumen</label>
                  <span className="text-xs font-bold text-[#1a1a1a] tabular-nums">{porcentaje}%</span>
                </div>
                <input
                  id="sonido-volumen"
                  type="range"
                  min={VOLUMEN_MIN * 100}
                  max={100}
                  step={5}
                  value={porcentaje}
                  onChange={e => setVolumen(Number(e.target.value) / 100)}
                  className="w-full accent-[#1a1a1a]"
                />
                <p className="mt-1 text-xs text-[#aaa] leading-relaxed">
                  El volumen final también depende del volumen de la computadora.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  onClick={probar}
                  disabled={sonando}
                  className="border border-[#1a1a1a] bg-white text-[#1a1a1a] px-4 py-2.5 font-bold text-sm rounded-none hover:bg-[#f5f5f5] disabled:opacity-50 transition-colors"
                >
                  {sonando ? 'Sonando…' : 'Probar sonido'}
                </button>
                {fallo && (
                  <p className="text-xs text-[#a92020]">
                    El navegador no dejó reproducirlo. Revisá el volumen del dispositivo y los permisos de
                    sonido de la página.
                  </p>
                )}
              </div>

              <p className="text-xs text-[#aaa] leading-relaxed">
                Se guarda en este dispositivo. Con el sonido activado la pantalla no se apaga mientras el
                panel esté abierto.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
