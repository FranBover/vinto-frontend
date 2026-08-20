# Vinto — Frontend

Frontend de Vinto, una plataforma SaaS multi-tenant de menús y tiendas online.
Cada negocio tiene un link público (`/su-slug`) donde sus clientes navegan el
catálogo, arman un pedido y pagan; y un panel privado donde el dueño gestiona
productos, precios, stock, descuentos y pedidos en tiempo real.

Una sola aplicación React sirve a todos los negocios: el tenant se resuelve por
el slug de la URL y toda la configuración del local viaja en la respuesta de la
API. No hay build ni deploy por cliente.

El backend es una API .NET independiente (repositorio aparte) que expone REST y
un hub de SignalR.

## Qué incluye

**Lado cliente (público, mobile-first)**
- Menú por categorías, con fotos, descripciones y precios.
- Productos con variantes (talle, color, tamaño) y extras con precio adicional.
- Descuentos por producto, por categoría o sobre el pedido completo.
- Cupones de descuento validados contra la API, que se re-validan solos cuando
  cambia el total del carrito.
- Carrito persistente con expiración a 24 horas, aislado por negocio.
- Checkout con retiro en local o delivery, incluyendo autocompletado de
  direcciones sobre OpenStreetMap y selector de ubicación en mapa.
- Pago en efectivo (con cálculo de vuelto), transferencia o Mercado Pago.
- Confirmación del pedido con mensaje de WhatsApp pre-armado.

**Lado administrador (desktop-first)**
- Login con JWT y rutas protegidas.
- Gestión de pedidos con filtros, detalle, comentarios internos, y generación de
  comanda de cocina y ticket para el cliente.
- Productos, categorías reordenables por drag & drop, extras, variantes
  generadas por combinatoria, y control de stock con alertas.
- Descuentos y cupones, con métricas de uso por cupón.
- Reportes con gráficos de serie de ventas, días y horas pico, ranking de
  productos y métodos de pago.
- Conexión OAuth con Mercado Pago para cobrar directo a la cuenta del negocio.
- Notificaciones en vivo por SignalR: llega un pedido nuevo o se confirma un
  pago y aparece un toast sin recargar la página.

## Stack

| | |
|---|---|
| UI | React 19, TypeScript en modo estricto |
| Build | Vite 8 |
| Estilos | Tailwind CSS v4 (plugin de Vite, sin archivo de configuración) |
| Estado | Zustand 5 |
| Ruteo | React Router 7 |
| HTTP | Axios |
| Tiempo real | `@microsoft/signalr` |
| Gráficos | Recharts |
| Mapas | Leaflet + react-leaflet, geocoding con Nominatim |
| Drag & drop | dnd-kit |

## Cómo levantarlo en local

Requiere Node.js 20 o superior y el backend de Vinto corriendo.

```bash
git clone https://github.com/FranBover/vinto-frontend.git
cd vinto-frontend
npm install
```

Creá un archivo `.env` en la raíz con estas dos variables:

```
VITE_API_URL=<raíz de la API, incluyendo el sufijo /api>
VITE_BASE_URL=<raíz del host del backend, sin /api>
```

Las dos apuntan al mismo host pero cumplen roles distintos: `VITE_API_URL` es el
`baseURL` del cliente HTTP, y `VITE_BASE_URL` se usa para resolver las imágenes
que sirve el backend y para abrir la conexión de SignalR. Con el backend en
local suelen ser el mismo puerto, con y sin `/api`.

```bash
npm run dev
```

La app queda en `http://localhost:5173`. El panel está en `/admin/login` y el
menú de un negocio en `/<slug>`.

Todo lo que empiece con `VITE_` queda embebido en el bundle público, así que
en estos archivos no van secretos.

### Comandos

```bash
npm run dev       # servidor de desarrollo con HMR
npm run build     # type-check (tsc -b) + build de producción
npm run lint      # ESLint
npm run preview   # sirve el build localmente
```

## Decisiones de diseño

**Multi-tenancy por slug, sin configuración en el cliente.** El frontend no sabe
nada de ningún negocio en particular: pide `/public/locales/{slug}/menu` y
renderiza lo que venga. Sumar un cliente nuevo no toca el código ni requiere un
deploy.

**Carrito aislado por negocio, con expiración.** El carrito vive en
`localStorage`, pero se vacía automáticamente si el visitante pasa a otro
negocio o si pasaron más de 24 horas. Cada línea se identifica por producto +
extras ordenados + variante, así que el mismo producto pedido de dos formas
distintas son dos líneas separadas en vez de una suma silenciosa.

**El total del cliente es informativo; el backend manda.** El checkout calcula y
muestra el desglose completo (subtotal, descuentos de producto, cupón, envío)
para que el cliente entienda qué está pagando, pero el monto autoritativo lo
recalcula el servidor. El frontend nunca es la fuente de verdad de un precio.

**El estado del pago se confirma preguntando, no leyendo la URL.** Cuando Mercado
Pago devuelve al usuario a la app, la página no confía en el parámetro de estado
de la redirección: hace polling del pedido cada dos segundos con timeout a
treinta. Por eso el carrito no se vacía al enviar el pedido sino recién cuando el
pago se confirma o se agota el tiempo, y un pago fallido no deja al cliente con
el carrito vacío y sin nada comprado.

**Una sola conexión de SignalR, montada en el layout.** El hub se conecta una vez
en el layout del panel y publica los eventos a un store de notificaciones. Las
páginas se suscriben al store, no al socket. El efecto depende únicamente del id
del administrador, lo que evita que la conexión se reconstruya en cada render.

**Caché de menú por slug en memoria.** Navegar entre categorías, producto y
carrito no vuelve a pedir el menú: el store guarda la respuesta por slug y
descarta los fetches duplicados.

**Estilos deliberadamente literales.** No hay sistema de tokens ni tema: los
colores de marca van como valores hex directos en las clases. Para un proyecto
de este tamaño, con una sola paleta y sin modo oscuro, la indirección costaba más
de lo que ahorraba. La paleta y las convenciones están documentadas en
`CLAUDE.md`.

**Estética.** Cliente con fondo crema, tipografía serif (Fraunces) para títulos y
un acento vino; panel con superficie neutra y densidad alta. Botones cuadrados,
sin sombras ni gradientes. Mobile-first para el flujo de compra, desktop-first
para el panel.

## Estructura

```
src/
├── api/          llamadas HTTP: cliente Axios compartido, endpoints públicos,
│                 de administración y de Mercado Pago
├── components/   componentes de cliente, de administración y compartidos
├── hooks/        conexión SignalR, animaciones
├── pages/        client/ · admin/ · marketing/
├── store/        Zustand: sesión, carrito, menú, notificaciones
├── types/        modelos y DTOs del dominio
└── config.ts     URLs de entorno y resolución de imágenes
```

## Documentación

- `CLAUDE.md` — convenciones del repositorio y restricciones al modificarlo.
- `docs/CONTEXT.md` — arquitectura en detalle, flujos completos, decisiones y
  deuda técnica conocida.

## Autor

Francisco Bover — [github.com/FranBover](https://github.com/FranBover)
