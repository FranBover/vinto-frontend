import { apiClient } from './client'
import type { MenuPublico, PedidoCreateResponse, CrearPedidoDto, ValidarCuponResponse } from '../types'

export const getMenu = async (slug: string): Promise<MenuPublico> => {
  const { data } = await apiClient.get<MenuPublico>(`/public/locales/${slug}/menu`)
  return data
}

export const crearPedido = async (slug: string, dto: CrearPedidoDto): Promise<PedidoCreateResponse> => {
  const { data } = await apiClient.post<PedidoCreateResponse>(`/public/locales/${slug}/pedidos`, dto)
  return data
}

export const validarCupon = async (
  slug: string,
  codigo: string,
  subtotalPostDescuentos: number,
): Promise<ValidarCuponResponse> => {
  const { data } = await apiClient.post<ValidarCuponResponse>(
    `/public/locales/${slug}/cupones/validar`,
    { codigo, subtotalPostDescuentos },
  )
  return data
}
