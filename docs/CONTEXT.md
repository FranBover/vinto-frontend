# Vinto Frontend — Contexto de arquitectura

Documento de referencia largo. Para las reglas cortas de trabajo ver
[`../CLAUDE.md`](../CLAUDE.md).

Estado verificado contra el código al 2026-08-20 (branch `main`, commit `be30fde`).

---

## 1. Qué es

Vinto es un SaaS multi-tenant de menús y tiendas online. Cada negocio ("local")
es un `Administrador` en el backend y tiene un `slug` público. Un único bundle
de React sirve a todos los tenants:

- `vinto/<slug>` → menú público de ese local
- `vinto/admin/...` → panel de gestión del dueño del local
- `vinto/` → landing de marketing del producto

No hay build por tenant, ni subdominios, ni configuración por cliente en el
frontend. **Todo lo específico del local llega en el payload de `getMenu(slug)`.**

El backend es una API .NET separada (repositorio aparte) que expone REST + un hub
de SignalR.

---

## 2. Estructura de carpetas

```
src/
├── api/            Módulos de llamadas HTTP (funciones sueltas, Axios)
│   ├── client.ts       instancia de Axios + interceptores
│   ├── publicApi.ts    endpoints sin auth (menú, pedido, cupón)
│   ├── adminApi.ts     endpoints con JWT (todo el panel)
│   └── mercadoPagoApi.ts  preferencia de pago y polling de estado
├── components/
│   ├── admin/          layout, sidebar, modales, uploader, secciones
│   │   └── reportes/   gráficos Recharts + paleta
│   ├── client/         CartBar, CuponInput, BannerDescuentos
│   ├── DireccionAutocomplete.tsx   (compartido: se usa en checkout)
│   └── NuevoPedidoToast.tsx
├── hooks/
│   ├── usePedidosHub.ts  conexión SignalR
│   └── useReveal.tsx     animación de entrada (solo landing)
├── pages/
│   ├── client/     flujo público de compra
│   ├── admin/      panel
│   └── marketing/  LandingPage
├── store/          Zustand: auth, cart, menu, notifications
├── types/index.ts  TODOS los modelos y DTOs del dominio, en un archivo
├── config.ts       URLs de entorno + resolveImageUrl + constantes de marketing
├── index.css       @import "tailwindcss" + una animación
└── main.tsx        createRoot + StrictMode
```

No existen `components/ui/` ni `utils/` (el README viejo los mencionaba; era
incorrecto).

---

## 3. Configuración y entorno

### `src/config.ts`

```ts
export const API_URL  = import.meta.env.VITE_API_URL  || 'http://localhost:5202/api'
export const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5202'
```

Dos variables, dos propósitos distintos:

| Variable | Apunta a | Quién la usa |
|---|---|---|
| `VITE_API_URL` | raíz de la API, **incluyendo el sufijo `/api`** | `apiClient.baseURL` en `src/api/client.ts`; `API_URL` exportado en `config.ts` |
| `VITE_BASE_URL` | raíz del host del backend, **sin `/api`** | `resolveImageUrl()` (archivos estáticos servidos por el backend) y la URL del hub SignalR (`${BASE_URL}/hubs/pedidos`) |

Las dos son las **únicas** vías de ruteo al backend. No hay ningún host de
backend hardcodeado en `src/`.

`config.ts` también exporta dos constantes de marketing usadas solo por la
landing: `WHATSAPP_URL` (link de contacto comercial) y `DEMO_URL` (`'/ejemplo'`,
el slug del local de demostración que la landing consulta para mostrar productos
reales).

### Archivos de entorno

| Archivo | Versionado | Contenido |
|---|---|---|
| `.env` | No (`.gitignore`) | `VITE_API_URL`, `VITE_BASE_URL` locales |
| `.env.production` | Sí | `VITE_API_URL`, `VITE_BASE_URL` de producción |
| `.env.example` | Sí | plantilla — **hoy incompleta, ver §11** |

Vite solo expone al bundle las variables con prefijo `VITE_`. Todo lo que se
ponga ahí termina en el JavaScript público: **nunca meter secretos en un
`.env` de este repo.**

### `resolveImageUrl`

```ts
export const resolveImageUrl = (url) =>
  !url ? '' : (url.startsWith('http') ? url : `${BASE_URL}${url}`)
```

El backend devuelve rutas relativas (`/uploads/...`) para las imágenes que él
mismo almacena, pero algunos campos legacy (`producto.imagenUrl` cargado a mano
en el panel) pueden traer una URL absoluta. La función maneja los dos casos.
Todo `<img src>` que muestre datos del backend tiene que pasar por acá.

---

## 4. Capa de API

### `src/api/client.ts`

Una sola instancia de Axios compartida por los tres módulos de API.

- **Request interceptor:** lee `vinto_admin_token` directamente de
  `localStorage` y lo inyecta como `Authorization: Bearer`. Lee de
  `localStorage` y no del store para poder correr fuera del árbol de React.
- **Response interceptor:** ante un `401` llama a
  `useAuthStore.getState().logout()`. El logout limpia el token; el
  `ProtectedRoute` reacciona y redirige a `/admin/login`.

No hay retry, ni normalización de errores, ni tipado de error. Cada página
maneja su `try/catch` y arma su propio mensaje en español.

### Endpoints por módulo

**`publicApi.ts`** (sin auth)
- `GET  /public/locales/{slug}/menu`
- `POST /public/locales/{slug}/pedidos`
- `POST /public/locales/{slug}/cupones/validar`

**`mercadoPagoApi.ts`** (sin auth)
- `POST /public/locales/{slug}/pedidos/{pedidoId}/preferencia-mp`
- `GET  /public/pedidos/{codigoSeguimiento}/estado-pago`

**`adminApi.ts`** (JWT) — auth, pedidos + comanda/ticket + comentarios,
productos, categorías (con reordenamiento), extras, variantes (tipos, opciones,
generación combinatoria), stock (alertas, ajuste, alta), descuentos, cupones
(+ métricas), imágenes (upload/list/delete), reportes, y conexión OAuth de
MercadoPago.

Los DTOs de descuentos, cupones, comanda, ticket, stock y comentarios están
declarados **dentro de `adminApi.ts`**, no en `types/index.ts`. Es una
inconsistencia histórica; ver §11.

El casing de las rutas es mixto y refleja el backend tal cual:
`/productos` vs `/Productos/{id}/stock`, `/categorias` vs `/Imagenes`,
`/ProductoExtra`, `/Descuentos`, `/Cupones`, `/Reportes`, `/MercadoPago`.

---

## 5. Ruteo (`src/App.tsx`)

`BrowserRouter`, sin lazy loading — todas las páginas se importan de forma
estática, así que el bundle es único.

```
/                                              LandingPage (marketing)

/:slug                                         MenuPage            ─┐
/:slug/productos/:categoriaId                  ProductosPage        │ público
/:slug/productos/:categoriaId/:productoId      ExtrasPage           │ por tenant
/:slug/carrito                                 CarritoPage          │
/:slug/checkout                                CheckoutPage         │
/:slug/confirmacion                            ConfirmacionPage     │
/:slug/pago/success|failure|pending            Pago*Page           ─┘

/admin/login                                   LoginPage

/admin/pedidos                                 ─┐
/admin/pedidos/:id                              │
/admin/productos                                │
/admin/categorias                               │ dentro de <ProtectedRoute>
/admin/reportes                                 │
/admin/stock                                    │
/admin/mi-local                                 │
/admin/descuentos                               │
/admin/cupones                                 ─┘

*                                              → /admin/login
```

**`ProtectedRoute`** es un `<Outlet>` condicionado a
`useAuthStore(s => s.isAuthenticated)()`. Solo verifica que exista un token en
memoria; **no valida expiración ni firma**. La expiración real se detecta
recién cuando la API devuelve 401 y el interceptor hace logout.

**El catch-all `*` redirige a `/admin/login`**, no a un 404 ni a la landing.
Consecuencia: un slug de local inexistente no cae en el catch-all (matchea
`/:slug`) y se resuelve dentro de `MenuPage` como error de carga; pero cualquier
ruta de dos segmentos que no matchee manda al login del admin. Es raro pero es
lo que hay.

### Fallback SPA

`public/staticwebapp.config.json` reescribe todo a `/index.html` excluyendo
`/assets/*` y las extensiones de archivos estáticos. Se copia a `dist/` en el
build; sin él, un refresh en `/mi-local/carrito` daría 404 en Azure Static Web
Apps.

---

## 6. Estado (Zustand)

Cuatro stores, sin middleware `devtools`. Solo el carrito persiste.

### `menuStore.ts` — caché del menú por slug

```ts
data: Record<string, MenuPublico>
fetchMenu(slug)   // no-op si ya está cacheado o si loading === true
clearCache()
```

Cada página cliente llama `fetchMenu(slug)` en un `useEffect` y lee de
`data[slug]`. El guard `if (get().data[slug] || get().loading) return` evita
fetches duplicados al navegar entre páginas del mismo local.

**Limitación conocida:** el flag `loading` es global, no por slug. Si dos slugs
se pidieran en paralelo (no ocurre hoy, la navegación es por tenant), el segundo
se descartaría en silencio. `clearCache()` es el escape: `MenuPage` lo usa en el
botón de "reintentar".

El caché vive solo en memoria; un refresh vuelve a pegarle a la API.

### `cartStore.ts` — carrito del cliente

Persistido en `localStorage` bajo `vinto-cart` vía el middleware `persist`.

- **Clave de línea:** `` `${productoId}-${extrasIdsOrdenados}${:varianteId}` ``.
  El mismo producto con distintos extras o distinta variante son ítems
  separados. Los IDs de extras se ordenan antes de concatenar para que el orden
  de selección no genere líneas duplicadas.
- **Aislamiento entre tenants:** `asegurarSlug(slug)` — que `MenuPage` llama al
  montar — **vacía el carrito si el slug cambió**. Impide que un cliente lleve
  productos de un local a otro.
- **Expiración:** `savedAt` se actualiza en cada mutación; en
  `onRehydrateStorage`, si pasaron más de 24 h el carrito se descarta.
- `total()` y `cantidadTotal()` son **métodos**, no valores derivados. Hay que
  invocarlos dentro del selector para que la suscripción sea reactiva:
  `useCartStore(s => s.total())`.
- `total()` usa `precioConDescuento ?? precio ?? 0`, así que el carrito ya
  muestra precios con descuentos de producto aplicados.

### `authStore.ts` — sesión del admin

- Token en `localStorage` bajo `vinto_admin_token`.
- `adminId` se **decodifica del payload del JWT** con `atob`, probando
  `adminId`, luego `sub`, luego `nameid`. Sin librería, con `try/catch` que
  devuelve `null`. Es decodificación, no validación.
- `isAuthenticated()` es `token !== null`.
- El estado inicial se hidrata de forma síncrona desde `localStorage` en la
  definición del store, así que un refresh en `/admin/pedidos` no parpadea al
  login.

### `notificationsStore.ts` — eventos en tiempo real

Es el puente entre SignalR y la UI. Guarda:

- `toasts[]`: cola de toasts visibles, con id generado (`timestamp-random`).
- `ultimoNuevoPedido` / `ultimoPagoConfirmado`: último payload de cada tipo, para
  que una página suscripta pueda reaccionar (por ejemplo, refrescar la lista de
  pedidos) sin acoplarse al toast.

---

## 7. Tiempo real (SignalR)

`src/hooks/usePedidosHub.ts` construye una `HubConnection` contra
`${BASE_URL}/hubs/pedidos`.

```ts
.withUrl(`${BASE_URL}/hubs/pedidos`, {
  withCredentials: true,
  accessTokenFactory: () => localStorage.getItem('vinto_admin_token') ?? '',
})
.withAutomaticReconnect()
```

- **Eventos recibidos:** `NuevoPedido` y `PagoConfirmado`. Sus payloads están
  tipados en `notificationsStore.ts` (`NuevoPedidoPayload`,
  `PagoConfirmadoPayload`) — es el único lugar donde viven contratos del hub.
- **Ciclo de vida:** el efecto depende **solo de `adminId`**. Los callbacks
  están deliberadamente fuera del dependency array (con un
  `eslint-disable-next-line react-hooks/exhaustive-deps` y un comentario): si
  entraran, cada render reconstruiría la conexión. **El caller es responsable de
  memoizar los callbacks.**
- **Montaje:** el hook se invoca una sola vez, en `AdminLayout`, que memoiza
  ambos handlers con `useCallback` y los enchufa a las acciones del
  `notificationsStore`. Como todas las páginas admin se renderizan dentro de
  `AdminLayout`, hay exactamente una conexión mientras el admin navega.
- **Estado expuesto:** `connectionState` (`HubConnectionState`). Hoy ninguna
  página lo consume: no hay indicador visual de "desconectado".
- Un fallo de `start()` deja el estado en `Disconnected` en silencio. No hay
  reintento manual más allá del `withAutomaticReconnect` de SignalR (que solo
  actúa sobre conexiones que llegaron a establecerse).

Los toasts se apilan en un contenedor `position: fixed` abajo a la derecha,
renderizado por `AdminLayout`.

---

## 8. Flujos principales

### 8.1 Compra (cliente)

1. **`MenuPage`** (`/:slug`) — `fetchMenu(slug)` + `asegurarSlug(slug)`.
   Muestra el local (logo, dirección, horarios, link de WhatsApp) y las
   categorías. `local.esActivo` define si el local está abierto; si está
   cerrado, las páginas de producto/carrito bloquean el avance
   (`isOpen = menu?.local.esActivo ?? true`, con default permisivo si el menú
   todavía no cargó).
2. **`ProductosPage`** (`/:slug/productos/:categoriaId`) — grilla de productos
   de la categoría, con precio tachado si hay `precioConDescuento`.
3. **`ExtrasPage`** (`.../:productoId`) — selección de variante (si
   `tieneVariantes`) y de extras; `agregarItem` al carrito.
4. **`CarritoPage`** — edición de cantidades, `CuponInput` no aparece acá.
5. **`CheckoutPage`** — es la página más densa del repo:
   - datos del cliente (nombre, teléfono);
   - **entrega**: `Local` (retiro) o `Delivery`. En delivery aparece
     `DireccionAutocomplete` y un selector de *tipo de edificación*
     (Casa / Barrio cerrado / Edificio / Centro comercial / Otro) que despliega
     campos condicionales. Todo eso se **aplana en un único string
     `referenciaDireccion`** antes de enviarse (ej.
     `"Edificio / Condominio: Palmeras, Torre A Piso 3, portón azul"`). El
     backend recibe texto libre, no estructura.
   - **pago**: `Efectivo` / `Transferencia` siempre; `Tarjeta` (etiquetado
     "Mercado Pago") se agrega solo si `local.mercadoPagoHabilitado`. Un efecto
     revierte a `Efectivo` si MP se deshabilita mientras el form está abierto.
     Con efectivo se pide "con cuánto pagás" (`montoPagoEfectivo`) para calcular
     el vuelto.
   - **cupón**: `CuponInput` valida contra la API y se **re-valida sola,
     debounced 500 ms, cada vez que cambia el subtotal**; si el cupón deja de
     ser válido se remueve con un mensaje. Lee el cupón vigente por `ref` para
     no entrar en loop de re-validación.
   - **totales**: `subtotalBase` → descuentos de producto → descuento de cupón
     → costo de envío. El cálculo se hace en el cliente **solo para mostrar**;
     el backend recalcula el total autoritativo.
6. `crearPedido(slug, dto)` devuelve `{ pedidoId, codigoSeguimiento, ... }`.
7. Bifurcación:
   - **Efectivo / Transferencia** → `navigate('/:slug/confirmacion')` pasando
     todo por `location.state` (pedido, local, items, datos del form).
     `ConfirmacionPage` arma el link de WhatsApp con `pedido.resumenWhatsApp`.
     **Si el usuario refresca esa página, el `state` se pierde.**
   - **Tarjeta** → `crearPreferenciaMP(...)` y `window.location.href =
     preferencia.initPoint` (redirección completa fuera de la SPA).

### 8.2 Pago con MercadoPago (retorno)

MercadoPago redirige de vuelta a `/:slug/pago/{success|failure|pending}?codigo=...`.

`PagoSuccessPage` no confía en el `status` de la URL: hace **polling** de
`GET /public/pedidos/{codigo}/estado-pago` cada **2 s**, con **timeout a 30 s**.

- Si `estado === 'Confirmado'` o `mercadoPagoStatus === 'approved'` → confirma y
  **vacía el carrito** (guardado por un `ref` para no llamarlo dos veces).
- Si vence el timeout → muestra estado indeterminado y **igual vacía el
  carrito** (el pedido ya existe en el backend).
- Errores de red durante el polling se ignoran y se sigue intentando.

El carrito **no** se vacía en el checkout, precisamente porque el pago puede
fallar: se limpia en `PagoSuccess`/`PagoPending`, o al contactar por WhatsApp
desde `PagoFailure`.

En paralelo, el backend emite `PagoConfirmado` por SignalR y el panel admin
muestra el toast sin refrescar.

### 8.3 Panel admin

Login → JWT en `localStorage` → `adminId` decodificado del token → todas las
llamadas admin lo usan como parámetro o lo derivan del token en el backend.
`AdminLayout` monta la conexión SignalR, el banner de estado de MercadoPago y
el stack de toasts. Sidebar fija de 200px; el contenido lleva
`marginLeft: 200`.

---

## 9. Imágenes

Dos generaciones conviviendo:

1. **Legacy — URL a mano.** `Producto.imagenUrl` es un string editable en el
   formulario de productos del panel. Puede ser absoluta o vacía.
2. **Actual — upload al backend.** `ImageUploader` sube archivos a
   `POST /Imagenes/upload` como `multipart/form-data` con los campos `File`,
   `Tipo`, `EntidadId`, `Orden`. El backend responde un `ImagenResponse` con
   `url` relativa. Se listan con `GET /Imagenes?tipo=&entidadId=` y se borran
   con `DELETE /Imagenes/{id}`.

Detalles de `ImageUploader`:

- **Modo `deferred`**: para un producto que todavía no existe (no hay
  `entidadId`), los archivos se encolan localmente con `URL.createObjectURL` y
  el padre los sube después de crear el producto.
- **`maxImagenes === 1`** (logo, imagen de categoría): la zona de upload sigue
  visible y subir una imagen nueva **borra la anterior automáticamente** antes
  de subir.
- `URL.revokeObjectURL` se llama al quitar un pendiente, pero **no** en un
  cleanup de desmontaje: si se abandona el modal con archivos encolados, esos
  object URLs quedan colgados hasta recargar. Fuga menor y acotada.

La resolución para mostrar es en cascada, implementada por página:
`producto.imagenes[]` (ordenadas) → `producto.imagenUrl` → placeholder gris.
`ProductosPage` y `CarritoPage` definen una función local llamada también
`resolveImageUrl` y **renombran la importada a `resolveImageSrc`** para evitar
la colisión. Es confuso pero deliberado.

---

## 10. Build y despliegue

### `vite.config.ts`

Además de `react()` y `tailwindcss()`, hay un plugin propio:
**`esToolkitCompatEsmShim`**. `es-toolkit` (dependencia transitiva de Recharts)
solo publica un wrapper CommonJS para los subpaths
`es-toolkit/compat/<fn>`; bajo el build de producción de Vite 8 (Rolldown) ese
interop rompe y tira `"t is not a function"` en runtime. El plugin redirige cada
`es-toolkit/compat/<fn>` al barrel ESM y re-exporta la función como default y
como named. También hay `optimizeDeps.include: ['recharts']`.

Es un workaround de una incompatibilidad concreta entre versiones. Si se
actualiza `es-toolkit`, `recharts` o Vite, conviene probar si sigue haciendo
falta — pero borrarlo sin verificar rompe la página de reportes **solo en
producción**.

### TypeScript

`npm run build` corre `tsc -b` antes de Vite: **los errores de tipos frenan el
build**. `tsconfig.app.json` tiene `strict`, `noUnusedLocals`,
`noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax` y
`erasableSyntaxOnly` (sin `enum`, sin parameter properties).

### CI/CD

Hay **dos** pipelines versionados, apuntando a destinos distintos:

| Archivo | Destino | Estado |
|---|---|---|
| `.github/workflows/azure-static-web-apps-*.yml` | Azure Static Web Apps (`app_location: /`, `output_location: dist`), build en la nube de Azure | activo — es el que se usa |
| `azure-pipeline.yml` | Azure DevOps → Azure Web App Linux, `pm2 serve --spa` | aparentemente legacy |

El commit `5469eee` ("Merge: integrar workflow de Azure SWA") sugiere que SWA
reemplazó al pipeline de DevOps, pero el archivo viejo quedó. Ver §11.

Como el build de SWA corre en Azure, `.env.production` (versionado) es lo que
define las URLs del bundle de producción.

---

## 11. Deuda técnica y contradicciones detectadas

Inventario del estado real, sin cambios aplicados.

### Confirmadas

1. **`.env.example` desalineado.** Declara una sola variable, `VITE_API_URL`,
   con un valor **sin el sufijo `/api`** que el `baseURL` de Axios necesita, y
   **omite `VITE_BASE_URL` por completo**. Alguien que clone el
   repo y copie el ejemplo obtiene 404 en cada llamada y las imágenes y SignalR
   rotos. Debería declarar las dos variables, con `/api` en la primera.
2. **`.env.example` está en UTF-16 LE con BOM y CRLF.** `.env` local también.
   Vite parsea `.env` con `dotenv`, que asume UTF-8: el BOM UTF-16 puede hacer
   que la primera clave se lea con basura al principio o directamente no se
   lea. Deberían ser UTF-8 sin BOM.
3. **`updateAdministrador` es código muerto.** Declarada en `adminApi.ts:133`,
   sin ningún call site en `src/`. `MiLocalPage` usa `updateLocalData`
   (`PATCH /Administrador/{id}/local`). Además `updateAdministrador` es la única
   ruta escrita en minúscula (`/administrador/{id}`) y su payload tiene
   `esAbierto`, un campo que el resto del panel ya no toca.
4. **Falta `.gitattributes`.** `core.autocrlf` está en `true` en la máquina de
   desarrollo, y en el repo conviven finales de línea mixtos: `src/config.ts`,
   `.env.example` y el workflow de GitHub Actions están commiteados con CRLF; el
   resto del código, con LF. Sin `.gitattributes`, cada clon en otro sistema
   puede producir diffs completos de archivos sin cambios reales.

### Otras encontradas durante la revisión

5. **La documentación previa contradecía al código.** El `CLAUDE.md` y el
   `README.md` anteriores describían un sistema de diseño que ya no existe
   (fondo blanco, tipografía Helvetica Neue, acento verde `#2d5a27`). El código
   real usa fondo crema `#faf8f4`, tipografía `Fraunces` (cargada por Google
   Fonts en `index.html`) y acento vino `#73223a` (61 ocurrencias). El verde
   quedó relegado a indicadores positivos (montos de descuento, toggle de local
   abierto). Corregido en esta pasada de documentación.
6. **El README previo decía que las imágenes se gestionan "mediante URLs
   externas, se recomienda Cloudinary".** Falso desde que existe
   `ImageUploader` + el endpoint `/Imagenes/upload`. También describía carpetas
   `components/ui/` y `utils/` que no existen.
7. **`src/pages/client/ProductosCategoriaPage.tsx` es un stub muerto**: un
   componente de tres líneas que devuelve `<div>ProductosCategoriaPage</div>`,
   sin importarse en ningún lado.
8. **Assets sin uso**: `src/App.css` no lo importa nadie (`main.tsx` solo
   importa `index.css`), y `src/assets/hero.png`, `react.svg` y `vite.svg` no
   están referenciados.
9. **Dos pipelines de despliegue coexisten** (§10). `azure-pipeline.yml`
   despliega a un App Service con `pm2 serve` mientras el workflow de GitHub
   despliega a Static Web Apps. Solo uno debería quedar.
10. **DTOs repartidos en dos lugares.** `types/index.ts` se documenta como "todos
    los modelos del dominio", pero descuentos, cupones, comanda, ticket, stock y
    comentarios están declarados dentro de `adminApi.ts`.
11. **`ProtectedRoute` no chequea expiración del JWT.** Un token vencido deja
    ver el shell del panel hasta que la primera llamada devuelve 401 y el
    interceptor desloguea. Es un problema de UX, no de seguridad (el backend
    rechaza igual).
12. **`connectionState` de `usePedidosHub` no se consume.** El admin no tiene
    forma de saber que dejó de recibir pedidos en tiempo real.
13. **El catch-all `*` manda a `/admin/login`** en lugar de a un 404 o a la
    landing (§5).
14. **`SERIF` duplicado en 12 archivos** y colores de marca como literales hex
    repartidos por todo el código, sin tokens ni tema.
15. **Nominatim (OpenStreetMap) se consulta directo desde el navegador**, sin
    `User-Agent` propio ni API key. Está dentro de los términos de uso para
    volumen bajo, pero es una dependencia externa no declarada en ningún lado y
    su rate limit degrada silenciosamente el autocompletado de direcciones (los
    errores de red se ignoran sin avisar al usuario).
16. **`menuStore.loading` es global, no por slug** (§6).
17. **`ConfirmacionPage` depende de `location.state`**: un refresh pierde los
    datos del pedido recién creado.

---

## 12. Glosario del dominio

| Término | Significado |
|---|---|
| **Local** / **Administrador** | El negocio tenant. Un `Administrador` es a la vez la cuenta y el local. |
| **slug** | Identificador público del local en la URL. |
| **Categoría** | Agrupación de productos, ordenable (drag & drop con dnd-kit). |
| **Extra** | Adicional con precio sobre un producto (`ProductoExtra`). |
| **Variante** | Combinación de opciones (ej. Talle × Color) con precio y stock propios. Se generan combinatoriamente desde el panel. |
| **Descuento** | Regla del local: por producto, por categoría o sobre el pedido completo. Se refleja en `precioConDescuento`. |
| **Cupón** | Código que ingresa el cliente en el checkout. Con vencimiento, límite de usos y pedido mínimo. |
| **`codigoSeguimiento`** | Código público del pedido; llave para consultar estado de pago y para el mensaje de WhatsApp. |
| **Comanda** | Ticket de cocina: qué preparar, sin precios. |
| **Ticket** | Comprobante para el cliente: con precios, descuentos, envío y vuelto. |
| **`resumenWhatsApp`** | Texto del pedido ya formateado por el backend para mandar por WhatsApp. |
| **`FormaEntrega`** | `'Local'` (retiro) \| `'Delivery'`. |
| **`FormaPago`** | `'Efectivo'` \| `'Transferencia'` \| `'Tarjeta'` (se muestra como "Mercado Pago"). |
