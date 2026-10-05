import { HubConnectionState } from '@microsoft/signalr'

interface Props {
  state: HubConnectionState
}

/** Chip discreto del header: solo informa. El aviso fuerte vive en ConexionBanner. */
export function ConexionChip({ state }: Props) {
  const conectado = state === HubConnectionState.Connected
  const reconectando =
    state === HubConnectionState.Connecting || state === HubConnectionState.Reconnecting

  const color = conectado ? '#2d5a27' : reconectando ? '#73223a' : '#a92020'
  const texto = conectado ? 'En vivo' : reconectando ? 'Reconectando…' : 'Sin conexión'

  return (
    <span
      role="status"
      title={conectado ? 'Recibís pedidos nuevos en tiempo real' : 'No estás recibiendo pedidos en tiempo real'}
      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest"
      style={{ color: conectado ? '#6b6258' : color }}
    >
      <span
        className={reconectando ? 'animate-pulse' : undefined}
        style={{ width: 8, height: 8, backgroundColor: color, display: 'inline-block' }}
      />
      {texto}
    </span>
  )
}

/** Banner a ancho completo: aparece solo cuando NO hay conexión en vivo. */
export function ConexionBanner({ state }: Props) {
  // Connecting es el handshake normal al montar cada página: no merece alarma.
  if (state === HubConnectionState.Connected || state === HubConnectionState.Connecting) return null

  const reconectando = state === HubConnectionState.Reconnecting

  return (
    <div
      role="alert"
      className="border-l-4 px-6 py-3"
      style={
        reconectando
          ? { backgroundColor: '#ede5d3', color: '#73223a', borderLeftColor: '#73223a' }
          : { backgroundColor: '#fdecec', color: '#a92020', borderLeftColor: '#a92020' }
      }
    >
      <p className="font-bold text-sm">
        {reconectando ? 'Reconectando con el servidor…' : 'Sin conexión en vivo'}
      </p>
      <p className="text-xs mt-0.5 leading-relaxed">
        Mientras tanto no van a aparecer pedidos nuevos solos. Al volver la conexión, la lista se
        actualiza sola con los que pudieron entrar en el medio.
      </p>
    </div>
  )
}
