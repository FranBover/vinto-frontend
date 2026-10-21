import { useEffect, useState } from 'react'
import {
  HubConnectionBuilder,
  HubConnectionState,
  type HubConnection,
} from '@microsoft/signalr'
import { pedirTicketHub } from '../api/adminApi'
import { BASE_URL } from '../config'
import { sesionVigente } from '../store/authStore'
import type { NuevoPedidoPayload, PagoConfirmadoPayload } from '../store/notificationsStore'

// El JWT de sesión nunca llega al hub (ni en la URL ni en un header): cada llamada pide un ticket
// de vida corta. Sin caché a propósito. SignalR la invoca dos veces por intento de conexión (en el
// negotiate y al abrir el WebSocket) y otra vez en cada reconexión. Un 401 del endpoint lo atiende
// el interceptor de Axios (expirarSesion()); cualquier otro error hace fallar el intento y SignalR
// reintenta según el backoff de abajo.
async function ticketParaHub(): Promise<string> {
  if (!sesionVigente()) return ''
  const { ticket } = await pedirTicketHub()
  return ticket
}

interface UsePedidosHubOptions {
  adminId: number | null
  onNuevoPedido: (pedido: NuevoPedidoPayload) => void
  onPagoConfirmado?: (pago: PagoConfirmadoPayload) => void
  /** Solo tras recuperarse de un corte real; nunca en la conexión inicial limpia. */
  onReconectado?: () => void
}

export function usePedidosHub({
  adminId,
  onNuevoPedido,
  onPagoConfirmado,
  onReconectado,
}: UsePedidosHubOptions) {
  const [connectionState, setConnectionState] = useState<HubConnectionState>(
    adminId ? HubConnectionState.Connecting : HubConnectionState.Disconnected
  )

  useEffect(() => {
    if (!adminId) return

    let cancelado = false
    let reintento: number | undefined
    // Vive en el closure: cada montaje (navegación) crea un hub nuevo con el flag en false,
    // así que solo un corte dentro de esta misma instancia dispara onReconectado.
    let huboCorte = false
    const conectado = () => {
      setConnectionState(HubConnectionState.Connected)
      if (huboCorte) {
        huboCorte = false
        onReconectado?.()
      }
    }

    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/pedidos`, {
        withCredentials: true,
        accessTokenFactory: ticketParaHub,
      })
      // Por defecto SignalR reintenta 4 veces (0, 2, 10 y 30 s) y se rinde en silencio.
      // Acá nunca se rinde: después de los primeros intentos sigue cada 30 s.
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: ({ previousRetryCount }) =>
          [0, 2000, 10000][previousRetryCount] ?? 30000,
      })
      .build()

    connection.onreconnecting(() => {
      huboCorte = true
      setConnectionState(HubConnectionState.Reconnecting)
    })
    connection.onreconnected(conectado)
    // onclose llega si el server cierra la conexión o si el start inicial falla:
    // la reconexión automática no cubre esos casos, así que se reintenta a mano.
    connection.onclose(() => {
      if (cancelado) return
      huboCorte = true
      setConnectionState(HubConnectionState.Disconnected)
      reintento = window.setTimeout(iniciar, 5000)
    })

    connection.on('NuevoPedido', (pedido: NuevoPedidoPayload) => {
      onNuevoPedido(pedido)
    })

    connection.on('PagoConfirmado', (pago: PagoConfirmadoPayload) => {
      if (onPagoConfirmado) onPagoConfirmado(pago)
    })

    function iniciar() {
      connection
        .start()
        .then(() => {
          if (!cancelado) conectado()
        })
        .catch(() => {
          if (cancelado) return
          huboCorte = true
          setConnectionState(HubConnectionState.Disconnected)
          reintento = window.setTimeout(iniciar, 5000)
        })
    }
    iniciar()

    return () => {
      cancelado = true
      window.clearTimeout(reintento)
      void connection.stop()
    }
    // Callbacks excluidos del dependency array — caller debe memoizarlos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId])

  return { connectionState }
}
