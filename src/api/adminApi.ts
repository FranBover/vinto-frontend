import { apiClient } from './client'
import type {
  Pedido,
  UpdateEstadoDto,
  Producto,
  Categoria,
  ProductoExtra,
  ImagenResponse,
} from '../types'

export type { ImagenResponse }

// ── Auth ──────────────────────────────────────────────────────────────────────

export const loginAdmin = async (email: string, password: string): Promise<{ token: string }> => {
  const { data } = await apiClient.post<{ token: string }>('/auth/login', { email, contraseña: password })
  return data
}

// ── Pedidos ───────────────────────────────────────────────────────────────────

export interface PedidosFiltros {
  estado?: string
  desde?: string
  hasta?: string
  formaPago?: string
  formaEntrega?: string
}

export const getPedidos = async (adminId: number, filtros?: PedidosFiltros): Promise<Pedido[]> => {
  const params = new URLSearchParams({ adminId: adminId.toString() })
  if (filtros?.estado)       params.set('estado',       filtros.estado)
  if (filtros?.desde)        params.set('desde',        filtros.desde)
  if (filtros?.hasta)        params.set('hasta',        filtros.hasta)
  if (filtros?.formaPago)    params.set('formaPago',    filtros.formaPago)
  if (filtros?.formaEntrega) params.set('formaEntrega', filtros.formaEntrega)
  const { data } = await apiClient.get<Pedido[]>(`/pedidos?${params}`)
  return data
}

export const getPedidoById = async (id: number): Promise<Pedido> => {
  const { data } = await apiClient.get<Pedido>(`/pedidos/${id}`)
  return data
}

export const updateEstadoPedido = async (id: number, dto: UpdateEstadoDto): Promise<void> => {
  await apiClient.patch(`/pedidos/${id}/estado`, dto)
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

export const toggleDisponibilidad = async (id: number, disponible: boolean): Promise<void> => {
  await apiClient.patch(`/Productos/${id}/disponibilidad`, { disponible })
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

// ── Extras ────────────────────────────────────────────────────────────────────

export const getExtras = async (productoId: number): Promise<ProductoExtra[]> => {
  const { data } = await apiClient.get<ProductoExtra[]>(`/ProductoExtra/por-producto/${productoId}`)
  return data
}

export const createExtra = async (extra: { nombre: string; precioAdicional: number; productoId: number }): Promise<ProductoExtra> => {
  const { data } = await apiClient.post<ProductoExtra>('/ProductoExtra', extra)
  return data
}

export const deleteExtra = async (id: number): Promise<void> => {
  await apiClient.delete(`/ProductoExtra/${id}`)
}

// ── Administrador ─────────────────────────────────────────────────────────────

export const getAdministrador = async (id: number) => {
  const { data } = await apiClient.get(`/Administrador/${id}`)
  return data
}

export const updateAdministrador = async (id: number, payload: Partial<{
  nombreLocal: string
  telefono: string
  direccion: string
  linkWhatsapp: string
  logoUrl: string
  esAbierto: boolean
}>) => {
  const { data } = await apiClient.put(`/administrador/${id}`, payload)
  return data
}

export const updateLocalData = async (id: number, payload: {
  nombreLocal: string
  telefono: string
  direccion: string
  linkWhatsapp: string
  logoUrl: string
  esActivo: boolean
  aliasTransferencia: string
  titularCuenta: string
  horarios: string
  ubicacionUrl: string
  zonaEnvio?: string
  costoEnvio?: number | null
}) => {
  const { data } = await apiClient.patch(`/Administrador/${id}/local`, payload)
  return data
}

// ── Comanda / Ticket ──────────────────────────────────────────────────────────

export interface ComandaItem {
  cantidad: number
  nombreProducto: string
  extras: string[]
}

export interface ComandaResponseDTO {
  codigoSeguimiento: string
  fecha: string
  formaEntrega: string
  nombreCliente: string
  direccionCliente: string | null
  referenciaDireccion: string | null
  items: ComandaItem[]
}

export interface TicketItem {
  cantidad: number
  nombreProducto: string
  precioUnitario: number
  subtotal: number
  extras: { nombre: string; precioAdicional: number }[]
}

export interface TicketResponseDTO {
  codigoSeguimiento: string
  nombreLocal: string
  telefono: string
  fecha: string
  nombreCliente: string
  telefonoCliente: string
  formaEntrega: string
  direccionCliente: string | null
  referenciaDireccion: string | null
  formaPago: string
  items: TicketItem[]
  subtotal: number
  costoEnvio: number
  total: number
  montoPagoEfectivo: number | null
  vuelto: number | null
}

export const getComanda = async (pedidoId: number): Promise<ComandaResponseDTO> => {
  const { data } = await apiClient.get<ComandaResponseDTO>(`/pedidos/${pedidoId}/comanda`)
  return data
}

export const getTicket = async (pedidoId: number): Promise<TicketResponseDTO> => {
  const { data } = await apiClient.get<TicketResponseDTO>(`/pedidos/${pedidoId}/ticket`)
  return data
}

// ── Comentarios de pedido ─────────────────────────────────────────────────────

export interface ComentarioPedido {
  id: number
  texto: string
  fechaCreacion: string
}

export const getComentariosPedido = async (pedidoId: number): Promise<ComentarioPedido[]> => {
  const { data } = await apiClient.get<ComentarioPedido[]>(`/pedidos/${pedidoId}/comentarios`)
  return data
}

export const addComentarioPedido = async (pedidoId: number, texto: string): Promise<ComentarioPedido> => {
  const { data } = await apiClient.post<ComentarioPedido>(`/pedidos/${pedidoId}/comentarios`, { texto })
  return data
}

// ── Imágenes ──────────────────────────────────────────────────────────────────

export const getImagenes = async (tipo: string, entidadId?: number): Promise<ImagenResponse[]> => {
  const params = new URLSearchParams({ tipo })
  if (entidadId !== undefined) params.set('entidadId', String(entidadId))
  const { data } = await apiClient.get<ImagenResponse[]>(`/Imagenes?${params}`)
  return data
}

export const uploadImagen = async (
  file: File,
  tipo: string,
  entidadId?: number,
  orden?: number,
): Promise<ImagenResponse> => {
  const formData = new FormData()
  formData.append('File', file)
  formData.append('Tipo', tipo)
  if (entidadId !== undefined) formData.append('EntidadId', String(entidadId))
  if (orden !== undefined) formData.append('Orden', String(orden))
    const { data } = await apiClient.post<ImagenResponse>('/Imagenes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  return data
}

export const deleteImagen = async (imagenId: number): Promise<void> => {
  await apiClient.delete(`/Imagenes/${imagenId}`)
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
