import { apiClient } from './client'
import type { MenuPublico, Pedido, CrearPedidoDto } from '../types'

export const getMenu = async (slug: string): Promise<MenuPublico> => {
  const { data } = await apiClient.get<MenuPublico>(`/menu/${slug}`)
  return data
}

export const crearPedido = async (dto: CrearPedidoDto): Promise<Pedido> => {
  const { data } = await apiClient.post<Pedido>('/pedidos', dto)
  return data
}
