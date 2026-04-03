import { apiClient } from './client'
import type {
  Pedido,
  UpdateEstadoDto,
  Producto,
  Categoria,
} from '../types'

// ── Auth ──────────────────────────────────────────────────────────────────────

export const loginAdmin = async (email: string, password: string): Promise<{ token: string }> => {
  const { data } = await apiClient.post<{ token: string }>('/auth/login', { email, password })
  return data
}

// ── Pedidos ───────────────────────────────────────────────────────────────────

export const getPedidos = async (adminId: number): Promise<Pedido[]> => {
  const { data } = await apiClient.get<Pedido[]>(`/pedidos?adminId=${adminId}`)
  return data
}

export const getPedidoById = async (id: number): Promise<Pedido> => {
  const { data } = await apiClient.get<Pedido>(`/pedidos/${id}`)
  return data
}

export const updateEstadoPedido = async (id: number, dto: UpdateEstadoDto): Promise<Pedido> => {
  const { data } = await apiClient.patch<Pedido>(`/pedidos/${id}/estado`, dto)
  return data
}

// ── Productos ─────────────────────────────────────────────────────────────────

export const getProductos = async (adminId: number): Promise<Producto[]> => {
  const { data } = await apiClient.get<Producto[]>(`/productos?adminId=${adminId}`)
  return data
}

export const createProducto = async (producto: Omit<Producto, 'id' | 'extras'>): Promise<Producto> => {
  const { data } = await apiClient.post<Producto>('/productos', producto)
  return data
}

export const updateProducto = async (id: number, producto: Partial<Omit<Producto, 'id' | 'extras'>>): Promise<Producto> => {
  const { data } = await apiClient.put<Producto>(`/productos/${id}`, producto)
  return data
}

export const deleteProducto = async (id: number): Promise<void> => {
  await apiClient.delete(`/productos/${id}`)
}

// ── Categorías ────────────────────────────────────────────────────────────────

export const getCategorias = async (adminId: number): Promise<Categoria[]> => {
  const { data } = await apiClient.get<Categoria[]>(`/categorias?adminId=${adminId}`)
  return data
}

export const createCategoria = async (categoria: Omit<Categoria, 'id'>): Promise<Categoria> => {
  const { data } = await apiClient.post<Categoria>('/categorias', categoria)
  return data
}

export const updateCategoria = async (id: number, categoria: Partial<Omit<Categoria, 'id'>>): Promise<Categoria> => {
  const { data } = await apiClient.put<Categoria>(`/categorias/${id}`, categoria)
  return data
}

export const deleteCategoria = async (id: number): Promise<void> => {
  await apiClient.delete(`/categorias/${id}`)
}

// ── Reportes ──────────────────────────────────────────────────────────────────

export interface ReportesData {
  totalPedidos: number
  totalVentas: number
  pedidosPorEstado: Record<string, number>
  ventasPorDia: { fecha: string; total: number }[]
}

export const getReportes = async (adminId: number): Promise<ReportesData> => {
  const { data } = await apiClient.get<ReportesData>(`/reportes?adminId=${adminId}`)
  return data
}
