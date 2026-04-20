// ── Domain models ────────────────────────────────────────────────────────────

export interface ImagenResponse {
  id: number
  url: string
  tipo: string
  entidadId: number | null
  orden: number
  nombreOriginal: string
  tamanioBytes: number
  fechaCreacion: string
}

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
  aliasTransferencia: string | null
  titularCuenta: string | null
  horarios: string | null
  ubicacionUrl: string | null
  zonaEnvio: 'Ciudad' | 'Nacional'
  costoEnvio: number | null
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

export interface OpcionVarianteMenu {
  id: number
  valor: string
  orden: number
}

export interface TipoVarianteMenu {
  id: number
  nombre: string
  orden: number
  opciones: OpcionVarianteMenu[]
}

export interface VarianteMenu {
  id: number
  precio: number
  stock: number | null
  disponible: boolean
  opcion1Id: number
  opcion2Id: number | null
  descripcion: string
}

export interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio: number | null
  imagenUrl: string
  disponible: boolean
  categoriaId: number
  tieneVariantes?: boolean
  tiposVariante?: TipoVarianteMenu[]
  variantes?: VarianteMenu[]
  extras: ProductoExtra[]
  imagenes?: { url: string; orden: number }[]
}

export interface OpcionVariante {
  id: number
  valor: string
  orden: number
  tipoVarianteId: number
}

export interface TipoVariante {
  id: number
  nombre: string
  orden: number
  productoId: number
  opciones: OpcionVariante[]
}

export interface VarianteOpcionSeleccionada {
  tipoVarianteNombre: string
  opcionVarianteValor: string
}

export interface Variante {
  id: number
  productoId: number
  precio: number
  stock: number | null
  disponible: boolean
  sku: string | null
  descripcion?: string
  label?: string
  opcionesSeleccionadas?: VarianteOpcionSeleccionada[]
}

export type EstadoPedido = 'Pendiente' | 'Confirmado' | 'EnPreparacion' | 'Listo' | 'Entregado' | 'Cancelado'
export type FormaPago = 'Efectivo' | 'Transferencia' | 'Tarjeta'
export type FormaEntrega = 'Local' | 'Delivery'

export interface DetallePedidoExtra {
  nombre: string
  precioAdicional: number
}

export interface DetallePedido {
  id: number
  pedidoId: number
  productoId: number
  nombreProducto?: string
  varianteDescripcion?: string
  cantidad: number
  precioUnitario: number
  extras: DetallePedidoExtra[]
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

// ── Respuesta creación de pedido ─────────────────────────────────────────────

export interface PedidoCreateResponse {
  pedidoId: number
  codigoSeguimiento: string
  estado: EstadoPedido
  subtotal: number
  costoEnvio: number
  total: number
  mensaje: string
  resumenWhatsApp: string
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface CrearDetalleDto {
  productoId: number
  cantidad: number
  extrasSeleccionados: number[]
  varianteProductoId?: number | null
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

// ── Stock ─────────────────────────────────────────────────────────────────────

export interface StockAlertaDTO {
  productoId: number
  nombreProducto: string
  varianteId: number | null
  varianteDescripcion: string | null
  stockActual: number
  tipo: 'agotado' | 'bajo'
}

// ── Menu público ──────────────────────────────────────────────────────────────

export interface LocalPublico {
  id: number
  nombreLocal: string
  telefono: string
  linkWhatsapp: string | null
  logoUrl: string | null
  logoImagenUrl: string | null
  direccion: string
  esActivo: boolean
  aliasTransferencia: string | null
  titularCuenta: string | null
  horarios: string | null
  ubicacionUrl: string | null
  zonaEnvio: 'Ciudad' | 'Nacional'
  costoEnvio: number | null
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
