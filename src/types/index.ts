// ── Domain models ────────────────────────────────────────────────────────────

export interface Administrador {
  id: number
  nombre: string
  email: string
  nombreLocal: string
  direccion: string
  telefono: string
  linkWhatsapp: string
  logoUrl: string
  esActivo: boolean
  esAbierto: boolean
}

export interface Categoria {
  id: number
  nombre: string
  administradorId: number
}

export interface ProductoExtra {
  id: number
  nombre: string
  precioAdicional: number
  productoId: number
}

export interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio: number
  imagenUrl: string
  disponible: boolean
  categoriaId: number
  extras: ProductoExtra[]
}

export type EstadoPedido = 'Pendiente' | 'EnPreparacion' | 'Listo' | 'Entregado' | 'Cancelado'
export type FormaPago = 'Efectivo' | 'Transferencia' | 'Tarjeta'
export type FormaEntrega = 'Local' | 'Delivery'

export interface DetallePedido {
  id: number
  pedidoId: number
  productoId: number
  cantidad: number
  precioUnitario: number
  productosExtra: ProductoExtra[]
}

export interface Pedido {
  id: number
  administradorId: number
  fecha: string
  estado: EstadoPedido
  nombreCliente: string
  telefonoCliente: string
  formaPago: FormaPago
  formaEntrega: FormaEntrega
  montoPagoEfectivo: number | null
  direccionCliente: string | null
  referenciaDireccion: string | null
  ubicacionUrl: string | null
  total: number
  detalles: DetallePedido[]
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface CrearDetalleDto {
  productoId: number
  cantidad: number
  precioUnitario: number
  extrasIds: number[]
}

export interface CrearPedidoDto {
  administradorId: number
  nombreCliente: string
  telefonoCliente: string
  formaPago: FormaPago
  formaEntrega: FormaEntrega
  montoPagoEfectivo?: number
  direccionCliente?: string
  referenciaDireccion?: string
  ubicacionUrl?: string
  detalles: CrearDetalleDto[]
}

export interface UpdateEstadoDto {
  estado: EstadoPedido
}

// ── Menu público ──────────────────────────────────────────────────────────────

export interface LocalPublico {
  id: number
  nombreLocal: string
  telefono: string
  linkWhatsapp: string | null
  logoUrl: string | null
  direccion: string
  esActivo: boolean
}

export interface CategoriaPublica {
  id: number
  nombre: string
  productos: Producto[]
}

export interface MenuPublico {
  local: LocalPublico
  categorias: CategoriaPublica[]
}
