# Vinto — Frontend

Interfaz web para el sistema de pedidos online Vinto. Incluye el frontend 
público del cliente y el panel administrador.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Zustand (estado global)
- React Router
- Axios

## Requisitos

- Node.js 18+

## Configuración

1. Cloná el repositorio
2. Instalá las dependencias:
```bash
npm install
```

3. Creá el archivo `.env` en la raíz del proyecto:
VITE_API_URL=http://localhost:5202/api

4. Levantá el servidor de desarrollo:
```bash
npm run dev
```

El frontend corre en `http://localhost:5173`.

## Rutas

### Cliente (público)
| Ruta | Descripción |
|------|-------------|
| `/{slug}` | Menú del local — categorías |
| `/{slug}/productos/{categoriaId}` | Productos de una categoría |
| `/{slug}/productos/{categoriaId}/{productoId}` | Detalle y extras de un producto |
| `/{slug}/carrito` | Carrito del cliente |
| `/{slug}/checkout` | Formulario de pedido |
| `/{slug}/confirmacion` | Confirmación del pedido |

### Admin (privado)
| Ruta | Descripción |
|------|-------------|
| `/admin/login` | Login del administrador |
| `/admin/pedidos` | Lista de pedidos |
| `/admin/pedidos/{id}` | Detalle de pedido |
| `/admin/productos` | Gestión de productos |
| `/admin/categorias` | Gestión de categorías |
| `/admin/reportes` | Reportes y métricas |
| `/admin/mi-local` | Datos del local |

## Imágenes

Las imágenes de productos y el logo del local se gestionan mediante URLs externas. 
Se recomienda usar [Cloudinary](https://cloudinary.com) para subir las imágenes 
y obtener la URL directa.

## Estructura del proyecto
src/
├── api/           — llamadas al backend (Axios)
├── components/    — componentes reutilizables
│   ├── ui/        — botones, modales, inputs
│   ├── client/    — componentes del cliente
│   └── admin/     — sidebar, layout del admin
├── pages/
│   ├── client/    — páginas del flujo del cliente
│   └── admin/     — páginas del panel admin
├── store/         — estado global con Zustand
├── types/         — tipos TypeScript
├── hooks/         — hooks reutilizables
└── utils/         — funciones helpers

## Sistema de diseño

- **Colores:** blanco `#ffffff`, negro `#1a1a1a`, verde `#2d5a27`
- **Tipografía:** Helvetica Neue / sans-serif
- **Estilo:** diseño suizo minimalista, botones cuadrados, sin sombras ni gradientes
- **Layout:** mobile-first para el cliente, desktop para el admin

## Desarrollado por

Francisco Bover — [github.com/FranBover](https://github.com/FranBover)