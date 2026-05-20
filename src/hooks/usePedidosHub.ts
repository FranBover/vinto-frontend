import { useEffect, useState } from 'react'
import {
  HubConnectionBuilder,
  HubConnectionState,
  type HubConnection,
} from '@microsoft/signalr'
import { BASE_URL } from '../config'
import type { NuevoPedidoPayload, PagoConfirmadoPayload } from '../store/notificationsStore'

interface UsePedidosHubOptions {
  adminId: number | null
  onNuevoPedido: (pedido: NuevoPedidoPayload) => void
  onPagoConfirmado?: (pago: PagoConfirmadoPayload) => void
}

export function usePedidosHub({ adminId, onNuevoPedido, onPagoConfirmado }: UsePedidosHubOptions) {
  const [connectionState, setConnectionState] = useState<HubConnectionState>(
    HubConnectionState.Disconnected
  )

  useEffect(() => {
    if (!adminId) return

    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(`${BASE_URL}/hubs/pedidos`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .build()

    connection.onreconnecting(() => setConnectionState(HubConnectionState.Reconnecting))
    connection.onreconnected(() => setConnectionState(HubConnectionState.Connected))
    connection.onclose(() => setConnectionState(HubConnectionState.Disconnected))

    connection.on('NuevoPedido', (pedido: NuevoPedidoPayload) => {
      onNuevoPedido(pedido)
    })

    connection.on('PagoConfirmado', (pago: PagoConfirmadoPayload) => {
      if (onPagoConfirmado) onPagoConfirmado(pago)
    })

    connection
      .start()
      .then(() => {
        setConnectionState(HubConnectionState.Connected)
        return connection.invoke('JoinAdminGroup', adminId.toString())
      })
      .catch(() => {
        setConnectionState(HubConnectionState.Disconnected)
      })

    return () => {
      connection
        .invoke('LeaveAdminGroup', adminId.toString())
        .catch(() => undefined)
        .finally(() => {
          connection.stop()
        })
    }
    // Callbacks excluidos del dependency array — caller debe memoizarlos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId])

  return { connectionState }
}
