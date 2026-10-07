# Vinto Frontend — Contexto de arquitectura

Documento de referencia largo. Para las reglas cortas de trabajo ver
[`../CLAUDE.md`](../CLAUDE.md).

Estado verificado contra el código al 2026-10-07 (branch `main`, commit `dd77ce7`).

---

## 1. Qué es

Vinto es un SaaS multi-tenant de menús y tiendas online. Cada negocio ("local")
es un `Administrador` en el backend y tiene un `slug` público. Un único bundle
de React sirve a todos los tenants:

- `vinto/<slug>` → menú público de ese local
- `vinto/admin/...` → panel de gestión del dueño del local
- `vinto/` → landing de marketing del producto

El producto es **multi-rubro** (gastronomía, ropa, kioscos…): por eso hay
variantes con stock y el copy de la landing no habla solo de "menú".

No hay build por tenant, ni subdominios, ni configuración por cliente en el
frontend. **Todo lo específico del local llega en el payload de `getMenu(slug)`.**
El slug público de un local lo define el backend (`Administrador.slugLocal`) y el
dueño puede cambiarlo desde "Mi local" (§8.3).

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
│   │   │               (ConexionIndicador, SeccionUrlPublica, ...)
│   │   └── reportes/   gráficos Recharts + paleta
│   ├── client/         CartBar, CuponInput, BannerDescuentos
│   ├── DireccionAutocomplete.tsx   Leaflet + Nominatim; SOLO vía lazy (§5.1)
│   ├── RouteFallback.tsx           fallback del Suspense global
│   └── NuevoPedidoToast.tsx
├── hooks/
│   ├── usePedidosHub.ts  conexión SignalR
│   └── useReveal.tsx     animación de entrada (solo landing)
├── pages/
│   ├── client/     flujo público de compra
│   ├── admin/      panel
│   └── marketing/  LandingPage
├── store/          Zustand: auth, cart, menu, notifications
├── types/index.ts  modelos y DTOs del dominio (los de admin, en adminApi.ts)
├── config.ts       URLs de entorno + resolveImageUrl + constantes de marketing
├── index.css       @import "tailwindcss" + una animación
└── main.tsx        createRoot + StrictMode
public/             og-image.png, íconos, staticwebapp.config.json
```

No existen `components/ui/` ni `utils/`.

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
la ruta del local de demostración, que la landing **embebe en un iframe** y
también abre en pestaña nueva; ver §8.4).

### Archivos de entorno

| Archivo | Versionado | Contenido |
|---|---|---|
| `.env` | No (`.gitignore`) | `VITE_API_URL`, `VITE_BASE_URL` locales |
| `.env.development` | **No, y tampoco ignorado** (aparece como `??` en `git status`) | idem, para `npm run dev` |
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
  `useAuthStore.getState().expirarSesion()` — **salvo si la URL incluye
  `/auth/login`**: ahí un 401 son credenciales incorrectas, no una sesión
  vencida. `expirarSesion` limpia el token y marca `sesionExpirada`; el
  `ProtectedRoute` reacciona y redirige a `/admin/login`, que muestra el aviso
  "Tu sesión expiró".

No hay retry, ni normalización de errores, ni tipado de error. Cada página
maneja su `try/catch` y arma su propio mensaje en español.

**Login (`LoginPage`):** distingue **429** (`axios.isAxiosError` + status →
"Demasiados intentos. Esperá unos minutos…", el backend aplica rate limit) de
cualquier otro fallo (→ "Email o contraseña incorrectos."). Con 401 y 429 por
separado, un bloqueo por rate limit ya no se lee como contraseña mala.

### Endpoints por módulo

**`publicApi.ts`** (sin auth)
- `GET  /public/locales/{slug}/menu`
- `POST /public/locales/{slug}/pedidos`
- `POST /public/locales/{slug}/cupones/validar`

**`mercadoPagoApi.ts`** (sin auth)
- `POST /public/locales/{slug}/pedidos/{pedidoId}/preferencia-mp`
- `GET  /public/pedidos/{codigoSeguimiento}/estado-pago`

**`adminApi.ts`** (JWT) — auth, pedidos (**paginados**: `getPedidos(adminId,
filtros, page, pageSize)` → `{ items, total, page, pageSize, totalPages }`) +
comanda/ticket + comentarios, datos del local (`updateLocalData`, incluye
`slugLocal`),
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

`BrowserRouter` con **code splitting por ruta**: las 20 páginas se cargan con
`React.lazy` y un único `<Suspense fallback={<RouteFallback />}>` envuelve todo
el `<Routes>`. `RouteFallback` es una pantalla crema con "Cargando…" en Fraunces
cursiva. Resultado: la landing y el menú público no descargan Recharts, dnd-kit
ni el panel admin.

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

**`ProtectedRoute`** (definido en `App.tsx`) se suscribe a `s.token` y renderiza
`<Outlet>` o `<Navigate to="/admin/login">`. Además **vigila la expiración del
JWT**: lee el claim `exp` (`getTokenExpMs`), arma un `setTimeout` hasta ese
instante (tope `2**31-1` ms) y re-chequea en `visibilitychange`, porque los
timers se atrasan con la pestaña en segundo plano o la PC suspendida. Al vencer
llama `expirarSesion()`. No valida la **firma** (eso es del backend), solo `exp`.
Si el token no trae `exp` no hay vigilancia y queda el 401 como red de seguridad.

### 5.1 `DireccionAutocomplete` lazy

`CheckoutPage` importa `DireccionAutocomplete` con `lazy()` y lo renderiza dentro
de su propio `<Suspense>` **solo cuando `formaEntrega === 'Delivery'`**. Es el
único consumidor de Leaflet/react-leaflet (+ CSS e imágenes de markers) y de las
consultas a Nominatim, así que quien retira en el local nunca baja ese código.
Un import estático lo metería de vuelta en el chunk del checkout.

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

- Estado: `token`, `adminId`, `sesionExpirada`.
- Token en `localStorage` bajo `vinto_admin_token`.
- El payload del JWT se **decodifica** con `atob` (sin librería, `try/catch` →
  `null`): `adminId` probando `adminId`, `sub`, `nameid`; y el claim `exp`
  (`getTokenExpMs`, exportado, lo usa `ProtectedRoute`). Es decodificación, no
  validación de firma.
- **Hidratación síncrona con chequeo de vencimiento:** al crear el store se lee
  `localStorage`; si el token ya venció se borra y arranca con
  `sesionExpirada: true` (el login muestra "Tu sesión expiró"). Un refresh en
  `/admin/pedidos` con token vigente no parpadea al login.
- `expirarSesion()` es el **único camino de cierre por vencimiento** (timer de
  `ProtectedRoute`, 401 del interceptor, carga inicial). Es no-op si ya no hay
  token. `logout()` es el cierre voluntario y no marca `sesionExpirada`.
  `guardarToken` la resetea a `false`.
- `isAuthenticated()` es `token !== null && !tokenVencido(token)`. Hoy nadie la
  consume: `ProtectedRoute` se suscribe directo a `token`.

### `notificationsStore.ts` — eventos en tiempo real

Es el puente entre SignalR y la UI. Guarda:

- `toasts[]`: cola de toasts visibles, con id generado (`timestamp-random`).
- `ultimoNuevoPedido` / `ultimoPagoConfirmado`: último payload de cada tipo, para
  que una página suscripta pueda reaccionar (por ejemplo, refrescar la lista de
  pedidos) sin acoplarse al toast.
- `reconexiones`: contador que `emitirReconexion()` incrementa tras una
  reconexión **real** del hub. `PedidosPage` lo observa para volver a pedir la
  lista (§7).
- `avisarPedidosPerdidos(payloads)`: agrega toasts de pedidos que entraron
  durante una caída. **A propósito no toca `ultimoNuevoPedido`**, para no
  disparar un refetch adicional.

---

## 7. Tiempo real (SignalR)

`src/hooks/usePedidosHub.ts` construye una `HubConnection` contra
`${BASE_URL}/hubs/pedidos`.

```ts
.withUrl(`${BASE_URL}/hubs/pedidos`, {
  withCredentials: true,
  accessTokenFactory: () => localStorage.getItem('vinto_admin_token') ?? '',
})
.withAutomaticReconnect({
  nextRetryDelayInMilliseconds: ({ previousRetryCount }) =>
    [0, 2000, 10000][previousRetryCount] ?? 30000,
})
```

- **La reconexión no se rinde.** El default de SignalR reintenta 4 veces (0, 2,
  10, 30 s) y queda `Disconnected` en silencio. Acá, tras los primeros
  intentos sigue **cada 30 s indefinidamente**. Además, `withAutomaticReconnect`
  solo cubre conexiones que llegaron a establecerse: si el `start()` inicial
  falla, o el servidor cierra (`onclose`), el hook reintenta a mano con
  `setTimeout` cada 5 s (cancelable en el cleanup del efecto).
- **`onReconectado`:** callback opcional que se dispara solo tras recuperarse de
  un corte real (flag `huboCorte` en el closure del efecto), **nunca en la
  conexión inicial limpia**. `AdminLayout` lo conecta a `emitirReconexion`.
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
- **Estado expuesto:** `connectionState` (`HubConnectionState`), que
  `AdminLayout` pasa a `ConexionIndicador.tsx`:
  - `ConexionChip` (header): "En vivo" (verde) / "Reconectando…" (vino,
    pulsando) / "Sin conexión" (rojo).
  - `ConexionBanner` (a ancho completo bajo el header): aparece **solo** en
    `Reconnecting` y `Disconnected`. `Connecting` no muestra banner: es el
    handshake normal al montar cada página (el hub se recrea al navegar).

### Refetch al reconectar y diff de pedidos perdidos

SignalR no reenvía lo emitido mientras el cliente estaba caído. Al subir
`reconexiones`, `PedidosPage` hace `fetchPedidos(true)`:

- Compara los ids de la nueva lista contra `idsPrevios` (ids de la última carga
  exitosa) y lanza un toast por cada pedido que no estaba (máx. 5,
  `MAX_AVISOS_RECONEXION`); la lista igual los muestra todos.
- **El diff solo es válido en página 1 sin filtros** (`esVistaEnVivo`): ahí caen
  los pedidos nuevos (el backend ordena fecha DESC, id DESC). En otra página o
  con filtros, `idsPrevios` se invalida (`null`) y no se avisa nada.
- `reconexionesVistas` arranca en el valor actual del contador: una reconexión
  anterior al montaje de la página no cuenta.

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
   - **entrega**: `Retira` (retiro en el local; es el valor por defecto) o
     `Delivery`. **El valor del contrato con la API es `'Retira'`**, no
     `'Local'` (commit `e67a478`); la UI lo etiqueta "Retiro en local". En
     delivery aparece `DireccionAutocomplete` (lazy, §5.1) y un selector de *tipo de edificación*
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

**Sin datos personales del cliente.** Las tres páginas de pago (`Success`,
`Failure`, `Pending`) solo conocen lo que devuelve `estado-pago`
(`EstadoPagoPublicoResponse`: `encontrado`, `estado`, `mercadoPagoStatus`,
`total`, `linkWhatsapp`). Ese endpoint es público y se consulta con el código de
seguimiento, así que no devuelve nombre, teléfono ni dirección (se sacaron de
`EstadoPagoPublicoResponse` en el commit `fba7228`). El mensaje de WhatsApp se
arma en el cliente con **solo el código** (`Hola, consulto por mi pedido #<código>`).
Quien tenga el código ve el total y el estado, nada más. La excepción es
`ConfirmacionPage` (flujo efectivo/transferencia), que recibe todo por
`location.state` desde el checkout y no pasa por la red.

El carrito **no** se vacía en el checkout, precisamente porque el pago puede
fallar: se limpia en `PagoSuccess`/`PagoPending`, o al contactar por WhatsApp
desde `PagoFailure`.

En paralelo, el backend emite `PagoConfirmado` por SignalR y el panel admin
muestra el toast sin refrescar.

### 8.3 Panel admin

Login → JWT en `localStorage` → `adminId` decodificado del token → todas las
llamadas admin lo usan como parámetro o lo derivan del token en el backend.
`AdminLayout` monta la conexión SignalR, el chip y el banner de conexión
(`ConexionIndicador`), el banner de estado de MercadoPago y el stack de toasts.
Sidebar fija de 200px; el contenido lleva `marginLeft: 200`.

**`PedidosPage` — paginación.** 25 pedidos por página (`PAGE_SIZE`), página y
filtros en estado local; el backend responde `{ items, total, totalPages }`.
Controles Anterior / números (primera, última y ±1 de la actual, con "…") /
Siguiente. Detalles que importan:

- **Descarte de respuestas viejas:** un `requestId` en `useRef` se incrementa en
  cada fetch; si al volver la respuesta ya no es la última (el admin cambió de
  página o de filtros mientras cargaba) se ignora, tanto en `then` como en
  `catch`.
- **Página fuera de rango:** si la página pedida quedó vacía pero hay
  resultados (se achicó la lista), salta a `totalPages`.
- Aplicar filtros vuelve a la página 1 e invalida `idsPrevios`.
- Se refetchea con cada `ultimoNuevoPedido` / `ultimoPagoConfirmado` y al
  reconectar (con el diff de §7).
- Las opciones de filtro de forma de entrega son `Delivery` y `Retira`.

**`MiLocalPage` → `SeccionUrlPublica`.** Muestra el link público
(`window.location.origin + '/' + admin.slugLocal`), con "Copiar link" y "Cambiar
URL". Cambiarlo exige una advertencia explícita (rompe QR impresos, links de
Instagram/WhatsApp) y se guarda con `updateLocalData(..., { slugLocal })`, o sea
el mismo `PATCH /Administrador/{id}/local` del resto del formulario, reenviando
los **datos ya guardados** del local (no los cambios sin guardar del form). Si
el backend rechaza el slug, se muestra su `mensaje`. El slug lo valida y lo
mantiene único el backend; el frontend no valida formato.

### 8.4 Landing (`/`)

Página de marketing, toda en el lenguaje crema/Fraunces/vino. Estructura:

1. **Hero** (texto + teléfono con la tienda demo). Dos CTA: "Ver la tienda demo"
   (abre `DEMO_URL` en pestaña nueva) y "Escribime por WhatsApp".
2. **5 features** (`FEATURES`): catálogo en minutos; pedido por WhatsApp con
   vuelto calculado; cobro con MercadoPago (el dinero entra directo a la cuenta
   del local); cliente pide sin registro; gestión desde el celular. Debajo, dos
   líneas secundarias (`EXTRAS`): descuentos/cupones y estadísticas.
3. **Cómo arranca** en 3 pasos (hablamos → configuramos → empezás a vender).
4. **CTA final** y footer.

El copy es **multi-rubro** ("gastronomía, ropa, kioscos o lo que vendas").

**`DemoPhone`: ver, no operar.** Un marco de teléfono con un `<iframe>` a
`DEMO_URL` (`/ejemplo`, mismo origen). Decisiones:

- El iframe se monta **después del `load` de la landing** para no competir con
  el render inicial, y es `loading="lazy"`; mientras tanto hay un placeholder
  con skeletons.
- Al cargar, se inyecta un listener de `click` en **captura** dentro del
  documento del iframe: el primer clic/tap hace `preventDefault` y abre la
  demo en pestaña nueva. Navegar el scroll sigue funcionando (el scroll no
  genera `click`). Por eso la demo no se puede operar (agregar al carrito,
  etc.) embebida.
- También se oculta la barra de scroll y se deja encadenar el scroll al de la
  landing. Todo en `try/catch`: si el documento no es accesible, el CTA sigue
  llevando a la tienda.
- `tabIndex={-1}` y `title` descriptivo para accesibilidad.
- **Dependencia operativa:** el slug `ejemplo` tiene que existir en el backend
  de cada entorno, o el hero muestra un error de carga dentro del teléfono.

**Metadatos para compartir (`index.html`).** `description`, Open Graph
(`og:type/url/title/description/image` + tamaño 1200×630 y `alt`) y Twitter
Card `summary_large_image`. La imagen es `public/og-image.png`, referenciada por
URL absoluta (`https://vintoapp.com/og-image.png`): los crawlers sociales
necesitan URL absoluta. Si cambia el dominio de producción hay que tocar esas
tres URLs a mano (`og:url`, `og:image`, `twitter:image`).

### 8.5 Sistema de diseño: dos lenguajes

| | Cliente + landing | Panel admin |
|---|---|---|
| Fondo | `#faf8f4` crema | `#fafaf9` |
| Tipografía | `Fraunces` (display) | sans del sistema, **sin Fraunces** |
| Acento / CTA | vino `#73223a` (hover `#651d33`) | botón primario `#1a1a1a` |
| Bordes | `#e8e1d4` (cálido) | `#e8e8e8`, `#d0d0d0` |
| Superficie | `#ede5d3` | blanco |
| Orientación | mobile-first | desktop-first, sidebar 200px |

Comunes: texto `#1a1a1a`, secundario `#6b6258`, positivo `#2d5a27`, error
`#a92020`, `rounded-none`, sin gradientes. Las fuentes se cargan por Google
Fonts desde `index.html`.

**Excepciones reales en admin** (el código no es 100 % consistente): 
`SeccionUrlPublica` usa crema, vino y Fraunces; `ConexionIndicador` usa vino y
`#ede5d3`; el botón "Guardar cambios" de Mi local es verde `#2d5a27`. No son el
patrón a seguir para pantallas admin nuevas.

El `LoginPage` es admin: `#fafaf9`, logo cuadrado negro, sin vino ni Fraunces.

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

Hay **un** pipeline: `.github/workflows/azure-static-web-apps-*.yml` → Azure
Static Web Apps (`app_location: /`, `output_location: dist`), build en la nube
de Azure. El `azure-pipeline.yml` de Azure DevOps (App Service + `pm2 serve`)
se eliminó en `694d9e9`.

Como el build de SWA corre en Azure, `.env.production` (versionado) es lo que
define las URLs del bundle de producción.

---

## 11. Deuda técnica y contradicciones detectadas

Inventario del estado real al 2026-10-07, sin cambios aplicados al código.

### Entorno y repo

1. **`.env.example` desalineado.** Declara una sola variable, `VITE_API_URL`,
   con un valor **sin el sufijo `/api`** que el `baseURL` de Axios necesita, y
   **omite `VITE_BASE_URL`**. Quien copie el ejemplo obtiene 404 en cada
   llamada y las imágenes y SignalR rotos. Debería declarar las dos variables,
   con `/api` en la primera.
2. **`.env.example` está en UTF-16 LE con BOM y CRLF** (verificado por bytes:
   `ff fe` al inicio). Vite parsea con `dotenv`, que asume UTF-8: la primera
   clave puede leerse con basura o no leerse. Debería ser UTF-8 sin BOM.
3. **`.env.development` ni versionado ni ignorado.** `.gitignore` solo cubre
   `.env`, así que `git status` lo muestra como `??`. Decidir: ignorarlo
   (`.env.development`) o versionarlo si solo lleva URLs locales. Hoy un
   `git add .` lo commitea por accidente.
4. **Falta `.gitattributes`.** `core.autocrlf=true` en la máquina de desarrollo
   y finales de línea mixtos en el repo: `src/config.ts`, `.env.example` y el
   workflow de GitHub están en CRLF; el resto, en LF.

### Código

5. **`updateAdministrador` es código muerto** (`adminApi.ts`, sin call sites).
   `MiLocalPage` usa `updateLocalData`. Además es la única ruta en minúscula
   (`/administrador/{id}`) y su payload usa `esAbierto`, que el panel ya no usa.
6. **`authStore.isAuthenticated()` no tiene consumidores.** `ProtectedRoute` se
   suscribe a `token` directamente. Está bien mantenida, pero es API sin uso.
7. **`ProductosCategoriaPage.tsx` es un stub muerto** de tres líneas, sin
   importar en ningún lado (ni siquiera en el `lazy` de `App.tsx`).
8. **Assets sin uso:** `src/App.css` (nadie lo importa; `main.tsx` solo importa
   `index.css`) y `src/assets/hero.png`, `react.svg`, `vite.svg`.
9. **DTOs repartidos en dos lugares.** Descuentos, cupones, comanda, ticket,
   stock y comentarios viven en `adminApi.ts`, no en `types/index.ts`.
10. **`SERIF` redeclarado en 13 archivos** (12 de cliente/marketing/compartidos
    más `SeccionUrlPublica` en admin). Colores de marca como hex literal por
    todo el código, sin tokens ni tema.
11. **El catch-all `*` manda a `/admin/login`** en vez de a un 404 o a la
    landing (§5).
12. **Nominatim (OpenStreetMap) se consulta directo desde el navegador**, sin
    `User-Agent` propio ni API key. Aceptable para volumen bajo, pero su rate
    limit degrada en silencio el autocompletado (los errores se ignoran).
13. **`menuStore.loading` es global, no por slug** (§6).
14. **`ConfirmacionPage` depende de `location.state`**: un refresh pierde los
    datos del pedido recién creado.
15. **`ProtectedRoute` solo vigila tokens con claim `exp`.** Si el backend
    emitiera un JWT sin `exp`, no habría detección proactiva (queda el 401).
16. **El diff de pedidos perdidos tiene un hueco por diseño:** si el admin está
    en página 2 o con filtros durante la caída, al reconectar la lista se
    refresca pero no se avisa de los pedidos nuevos.
17. **El hero de la landing depende de que exista el slug `ejemplo`** en el
    backend de cada entorno (§8.4).
18. **El dominio `vintoapp.com` aparece escrito a mano** en `index.html` (tres
    URLs absolutas de OG/Twitter) y como texto en `LandingPage` (paso 3). No es
    ruteo de API, pero hay que actualizarlo a mano si cambia el dominio.

### Contradicciones corregidas en esta pasada

La versión anterior de estos documentos afirmaba cosas que el código ya no
cumplía. Quedan registradas para no reintroducirlas:

- "Sin lazy loading, bundle único" → todas las rutas son `React.lazy`.
- "`ProtectedRoute` no valida expiración" → vigila `exp` con timer y
  `visibilitychange`; el store descarta tokens vencidos al cargar.
- "Ante un 401 el interceptor hace `logout()`" → hace `expirarSesion()`, y
  excluye `/auth/login`.
- "`connectionState` no se consume / no hay indicador" → `ConexionIndicador`.
- "SignalR no reintenta más allá del default" → backoff propio que no se rinde.
- "`FormaEntrega = 'Local' | 'Delivery'`" → es `'Retira' | 'Delivery'`.
- "Dos pipelines de despliegue conviven" → `azure-pipeline.yml` se eliminó.
- "Sistema de diseño único (crema/Fraunces/vino, `#fafaf9` como fondo admin)"
  → son dos lenguajes (§8.5).
- "`DEMO_URL`: la landing consulta el local demo para mostrar productos" → la
  landing lo embebe como iframe.
- "No hay dominio de producción en `src/`" → hay una mención de marketing
  (`vintoapp.com`) en `LandingPage.tsx`; sigue sin haber hosts de API.

---

## 12. Glosario del dominio

| Término | Significado |
|---|---|
| **Local** / **Administrador** | El negocio tenant. Un `Administrador` es a la vez la cuenta y el local. |
| **slug** / **`slugLocal`** | Identificador público del local en la URL. Lo define el backend (`Administrador.slugLocal`); el dueño lo cambia desde Mi local. |
| **`/ejemplo`** | Local de demostración que la landing embebe en el hero. |
| **Categoría** | Agrupación de productos, ordenable (drag & drop con dnd-kit). |
| **Extra** | Adicional con precio sobre un producto (`ProductoExtra`). |
| **Variante** | Combinación de opciones (ej. Talle × Color) con precio y stock propios. Se generan combinatoriamente desde el panel. |
| **Descuento** | Regla del local: por producto, por categoría o sobre el pedido completo. Se refleja en `precioConDescuento`. |
| **Cupón** | Código que ingresa el cliente en el checkout. Con vencimiento, límite de usos y pedido mínimo. |
| **`codigoSeguimiento`** | Código público del pedido; llave para consultar estado de pago y para el mensaje de WhatsApp. |
| **Comanda** | Ticket de cocina: qué preparar, sin precios. |
| **Ticket** | Comprobante para el cliente: con precios, descuentos, envío y vuelto. |
| **`resumenWhatsApp`** | Texto del pedido ya formateado por el backend para mandar por WhatsApp. |
| **`FormaEntrega`** | `'Retira'` (retiro) \| `'Delivery'`. |
| **`FormaPago`** | `'Efectivo'` \| `'Transferencia'` \| `'Tarjeta'` (se muestra como "Mercado Pago"). |
