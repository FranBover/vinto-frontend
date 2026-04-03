import { apiClient } from './client'
import type { MenuPublico, Pedido, CrearPedidoDto } from '../types'

export const getMenu = async (slug: string): Promise<MenuPublico> => {
  const { data } = await apiClient.get<MenuPublico>(`/public/locales/${slug}/menu`)
  return data
}

export const crearPedido = async (slug: string, dto: CrearPedidoDto): Promise<Pedido> => {
  const { data } = await apiClient.post<Pedido>(`/public/locales/${slug}/pedidos`, dto)
  return data
}
