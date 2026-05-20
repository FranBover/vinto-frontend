import { apiClient } from './client'
import type {
  CrearPreferenciaResponse,
  EstadoPagoPublicoResponse,
} from '../types'

export const crearPreferenciaMP = async (
  slug: string,
  pedidoId: number,
  codigoSeguimiento: string,
): Promise<CrearPreferenciaResponse> => {
  const { data } = await apiClient.post<CrearPreferenciaResponse>(
    `/public/locales/${slug}/pedidos/${pedidoId}/preferencia-mp`,
    { codigoSeguimiento },
  )
  return data
}

export const consultarEstadoPago = async (
  codigoSeguimiento: string,
): Promise<EstadoPagoPublicoResponse> => {
  const { data } = await apiClient.get<EstadoPagoPublicoResponse>(
    `/public/pedidos/${codigoSeguimiento}/estado-pago`,
  )
  return data
}
