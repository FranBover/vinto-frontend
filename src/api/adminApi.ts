import { apiClient } from './client'
import type {
  Pedido,
  UpdateEstadoDto,
  Producto,
  Categoria,
  CategoriaCreateDTO,
  CategoriaUpdateDTO,
  ProductoExtra,
  ImagenResponse,
  TipoVariante,
  OpcionVariante,
  Variante,
  StockAlertaDTO,
  EstadoMercadoPagoResponse,
  OAuthUrlResponse,
  MercadoPagoDiagnosticoResponse,
  Periodo,
  DashboardReporte,
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

export const createCategoria = async (dto: CategoriaCreateDTO): Promise<Categoria> => {
  const { data } = await apiClient.post<Categoria>('/categorias', dto)
  return data
}

export const updateCategoria = async (id: number, dto: CategoriaUpdateDTO): Promise<void> => {
  await apiClient.put(`/categorias/${id}`, dto)
}

export const deleteCategoria = async (id: number): Promise<void> => {
  await apiClient.delete(`/categorias/${id}`)
}

export const reordenarCategorias = async (orderedIds: number[]): Promise<void> => {
  await apiClient.patch('/categorias/reordenar', { orderedIds })
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
  varianteDescripcion?: string
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
  varianteDescripcion?: string
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
  subtotalSinDescuentos?: number
  montoDescuentoProductos?: number
  montoDescuentoCupon?: number
  codigoCupon?: string
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

// ── Variantes ─────────────────────────────────────────────────────────────────

export const getTiposVariante = async (productoId: number): Promise<Omit<TipoVariante, 'opciones'>[]> => {
  const { data } = await apiClient.get<Omit<TipoVariante, 'opciones'>[]>(`/Productos/${productoId}/tipos-variante`)
  return data
}

export const createTipoVariante = async (productoId: number, dto: { nombre: string; orden: number }): Promise<void> => {
  await apiClient.post(`/Productos/${productoId}/tipos-variante`, dto)
}

export const deleteTipoVariante = async (productoId: number, id: number): Promise<void> => {
  await apiClient.delete(`/Productos/${productoId}/tipos-variante/${id}`)
}

export const getOpcionesVariante = async (tipoId: number): Promise<OpcionVariante[]> => {
  const { data } = await apiClient.get<OpcionVariante[]>(`/tipos-variante/${tipoId}/opciones`)
  return data
}

export const createOpcionVariante = async (tipoId: number, dto: { valor: string; orden: number }): Promise<void> => {
  await apiClient.post(`/tipos-variante/${tipoId}/opciones`, dto)
}

export const deleteOpcionVariante = async (tipoId: number, id: number): Promise<void> => {
  await apiClient.delete(`/tipos-variante/${tipoId}/opciones/${id}`)
}

export const getVariantes = async (productoId: number): Promise<Variante[]> => {
  const { data } = await apiClient.get<Variante[]>(`/Productos/${productoId}/variantes`)
  return data
}

export const generarVariantes = async (productoId: number): Promise<void> => {
  await apiClient.post(`/Productos/${productoId}/variantes/generar`)
}

export const deleteAllVariantes = async (productoId: number): Promise<void> => {
  await apiClient.delete(`/Productos/${productoId}/variantes`)
}

export const updateVariante = async (
  varianteId: number,
  dto: { precio: number; stock: number | null; disponible: boolean; sku: string | null },
): Promise<void> => {
  await apiClient.put(`/Variantes/${varianteId}`, dto)
}

// ── Stock ─────────────────────────────────────────────────────────────────────

export interface MovimientoStock {
  fecha: string
  tipo: string
  cantidad: number
  stockAnterior: number
  stockNuevo: number
  motivo: string | null
}

export interface StockResponse {
  stockProducto: number | null
  ultimos_movimientos: MovimientoStock[]
}

export const getAlertas = async (): Promise<StockAlertaDTO[]> => {
  const { data } = await apiClient.get<StockAlertaDTO[]>('/Stock/alertas')
  return data
}

export const getStock = async (productoId: number): Promise<StockResponse> => {
  const { data } = await apiClient.get<StockResponse>(`/Productos/${productoId}/stock`)
  return data
}

export const ajustarStock = async (
  productoId: number,
  body: { varianteId: number | null; nuevoStock: number; motivo: string },
): Promise<void> => {
  await apiClient.post(`/Productos/${productoId}/stock/ajustar`, body)
}

export const agregarStock = async (
  productoId: number,
  body: { varianteId: number | null; cantidad: number; motivo: string },
): Promise<void> => {
  await apiClient.post(`/Productos/${productoId}/stock/agregar`, body)
}

// ── Descuentos ────────────────────────────────────────────────────────────────

export interface DescuentoResponseDTO {
  id: number
  nombre: string
  tipo: 'Porcentaje' | 'MontoFijo'
  valor: number
  productoId?: number
  productoNombre?: string
  categoriaId?: number
  categoriaNombre?: string
  aplicaAPedidoCompleto: boolean
  fechaInicio?: string
  fechaFin?: string
  activo: boolean
  fechaCreacion: string
}

export interface DescuentoCreateDTO {
  nombre: string
  tipo: 'Porcentaje' | 'MontoFijo'
  valor: number
  productoId?: number
  categoriaId?: number
  aplicaAPedidoCompleto: boolean
  fechaInicio?: string
  fechaFin?: string
}

export interface DescuentoUpdateDTO extends DescuentoCreateDTO {
  activo: boolean
}

export const getDescuentos = async (activo?: boolean): Promise<DescuentoResponseDTO[]> => {
  const params = activo !== undefined ? `?activo=${activo}` : ''
  const { data } = await apiClient.get<DescuentoResponseDTO[]>(`/Descuentos${params}`)
  return data
}

export const createDescuento = async (dto: DescuentoCreateDTO): Promise<DescuentoResponseDTO> => {
  const { data } = await apiClient.post<DescuentoResponseDTO>('/Descuentos', dto)
  return data
}

export const updateDescuento = async (id: number, dto: DescuentoUpdateDTO): Promise<DescuentoResponseDTO> => {
  const { data } = await apiClient.put<DescuentoResponseDTO>(`/Descuentos/${id}`, dto)
  return data
}

// ── Cupones ───────────────────────────────────────────────────────────────────

export interface CuponResponseDTO {
  id: number
  codigo: string
  tipo: 'Porcentaje' | 'MontoFijo'
  valor: number
  fechaVencimiento?: string
  limiteUsos?: number
  usosActuales: number
  pedidoMinimo?: number
  activo: boolean
  fechaCreacion: string
}

export interface CuponMetricasDTO {
  cuponId: number
  codigo: string
  usosTotales: number
  usosActivos: number
  usosLiberados: number
  montoTotalDescontado: number
  montoTotalLiberado: number
  primerUso?: string
  ultimoUso?: string
}

export interface CuponCreateDTO {
  codigo: string
  tipo: 'Porcentaje' | 'MontoFijo'
  valor: number
  fechaVencimiento?: string
  limiteUsos?: number
  pedidoMinimo?: number
}

export interface CuponUpdateDTO extends CuponCreateDTO {
  activo: boolean
}

export const getCupones = async (activo?: boolean): Promise<CuponResponseDTO[]> => {
  const params = activo !== undefined ? `?activo=${activo}` : ''
  const { data } = await apiClient.get<CuponResponseDTO[]>(`/Cupones${params}`)
  return data
}

export const getCuponMetricas = async (id: number): Promise<CuponMetricasDTO> => {
  const { data } = await apiClient.get<CuponMetricasDTO>(`/Cupones/${id}/metricas`)
  return data
}

export const createCupon = async (dto: CuponCreateDTO): Promise<CuponResponseDTO> => {
  const { data } = await apiClient.post<CuponResponseDTO>('/Cupones', dto)
  return data
}

export const updateCupon = async (id: number, dto: CuponUpdateDTO): Promise<CuponResponseDTO> => {
  const { data } = await apiClient.put<CuponResponseDTO>(`/Cupones/${id}`, dto)
  return data
}

// ── Reportes ──────────────────────────────────────────────────────────────────

export const getDashboardReporte = async (periodo: Periodo): Promise<DashboardReporte> => {
  const { data } = await apiClient.get<DashboardReporte>(`/Reportes/dashboard?periodo=${periodo}`)
  return data
}

// ── MercadoPago ───────────────────────────────────────────────────────────────

export const getEstadoMercadoPago = async (): Promise<EstadoMercadoPagoResponse> => {
  const { data } = await apiClient.get<EstadoMercadoPagoResponse>('/MercadoPago/estado')
  return data
}

export const getOAuthUrlMercadoPago = async (): Promise<OAuthUrlResponse> => {
  const { data } = await apiClient.get<OAuthUrlResponse>('/MercadoPago/oauth/url')
  return data
}

export const desconectarMercadoPago = async (): Promise<void> => {
  await apiClient.post('/MercadoPago/desconectar')
}

export const getDiagnosticoMercadoPago = async (): Promise<MercadoPagoDiagnosticoResponse> => {
  const { data } = await apiClient.get<MercadoPagoDiagnosticoResponse>('/MercadoPago/diagnostico')
  return data
}
