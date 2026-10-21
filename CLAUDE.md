# CLAUDE.md

Guía para Claude Code en este repositorio. Es el frontend de **Vinto**: SaaS
multi-tenant de tiendas/menús online (gastronomía, ropa, kioscos, etc.). Un
mismo build sirve a todos los locales; el tenant se resuelve por el `:slug` de
la URL.

El detalle largo (arquitectura, flujos, decisiones, deuda) está en
[`docs/CONTEXT.md`](docs/CONTEXT.md).

## Comandos

```bash
npm run dev       # servidor de desarrollo (HMR), puerto 5173
npm run dev -- --mode production   # dev contra la API de PRODUCCIÓN (ver Entornos)
npm run build     # tsc -b && vite build  ← el type-check es parte del build
npm run lint      # ESLint
npm run preview   # sirve dist/ localmente
```

No hay test runner configurado. `npm run build` es la única verificación real.

## Entornos

Vite carga `.env` y después `.env.[modo]` (el segundo gana).

- **`.env.development` (ignorado por git) tiene que apuntar a localhost**
  (`:5202`): es lo que impide que `npm run dev` pegue a producción si el `.env`
  local trae URLs de prod. Para probar contra producción no lo edites: usá
  `npm run dev -- --mode production`.
- **`.env.production` es el único `.env` real versionado**: lo usa el build de CI
  (y `npm run build` local). `.env.example` está desactualizado, no lo copies
  (CONTEXT §11).

## Stack

React 19 · TypeScript strict · Vite 8 · Tailwind v4 (plugin de Vite, sin archivo
de config) · Zustand 5 · React Router 7 (BrowserRouter) · Axios · SignalR
(`@microsoft/signalr`) · Recharts · Leaflet + react-leaflet · dnd-kit.

## Convenciones reales del repo

- **Nombres del dominio en español** (`pedido`, `cupón`, `descuento`,
  `varianteId`, `formaEntrega`). Infraestructura/React en inglés (`loading`,
  `onChange`, `handleSubmit`). Comentarios mezclados: mantené el idioma del
  archivo que estás tocando.
- **Estilos inline + Tailwind conviven.** Los colores van como hex literal en
  `className` (`bg-[#73223a]`) o en `style={{}}`. No hay tokens ni tema. Es
  intencional; no lo "arregles".
- **Cada página cliente redeclara** `const SERIF = "'Fraunces', Georgia, serif"`
  (13 archivos). Seguí el patrón si agregás una página cliente.
- **Todas las rutas son `React.lazy`** (`src/App.tsx`) bajo un único `Suspense`
  con `RouteFallback`. Página nueva = `lazy()` + `<Route>`; no la importes
  estática. Todas las páginas tienen `export default`.
- `src/config.ts` es el único lugar que lee `import.meta.env` para URLs (más
  `src/api/client.ts` para el `baseURL` de Axios).
- Los módulos de API (`src/api/*.ts`) exportan funciones `async` sueltas que
  devuelven `data` ya desempaquetado. Sin clases, sin wrappers de error.
- Los stores de Zustand exponen acciones con nombres en español
  (`agregarItem`, `limpiarCarrito`, `emitirNuevoPedido`, `expirarSesion`).
- **Contrato con la API:** `FormaEntrega = 'Retira' | 'Delivery'` (no `'Local'`).
  El slug público del local viene del backend como `slugLocal`.

## Horarios y estado del local

Detalle en [CONTEXT §8.6](docs/CONTEXT.md).

- **Tienda:** `useEstadoLocal(slug)` en cada página cliente (se refresca en
  `proximoCambio` y al volver a la pestaña). Local cerrado = catálogo navegable
  pero sin poder avanzar al pedido; el 409 `LocalCerrado` del POST de pedido se
  lee con `leerLocalCerrado`.
- **Panel:** `src/components/admin/horarios/` (`SeccionHorarios`, en Mi local).
  Estado, cierre manual y horarios se guardan por sus propios endpoints, no con
  el "Guardar cambios" del formulario.
- Formateo compartido en `src/utils/horarios.ts`. Si el local está abierto lo
  decide el backend (`estado.estaAbierto`); el front no lo calcula.

## Sistema de diseño (dos lenguajes distintos)

**Lado cliente y landing** (mobile-first): crema + Fraunces + vino.

| Rol | Valor |
|---|---|
| Fondo | `#faf8f4` (crema) |
| Texto / borde principal | `#1a1a1a` |
| Acento / CTA (vino) | `#73223a`, hover `#651d33` |
| Texto secundario | `#6b6258` |
| Superficie cálida / borde | `#ede5d3` / `#e8e1d4` |
| Tipografía display | `'Fraunces', Georgia, serif` (Google Fonts, `index.html`) |

**Panel admin** (desktop-first; sidebar de 200px desde `md` (768px), debajo es
un drawer con botón hamburguesa en el header): **sin Fraunces**, fondo
`#fafaf9`, sans del sistema, botones primarios `#1a1a1a`, bordes `#e8e8e8` /
`#d0d0d0`. No uses crema/vino/Fraunces en pantallas admin nuevas. Excepciones
existentes (no las copies como patrón): `SeccionUrlPublica` y
`ConexionIndicador` usan vino/crema, y `SeccionUrlPublica` usa Fraunces.

**Compartidos:** positivo/"abierto"/descuentos `#2d5a27`; error `#a92020`.

Botones cuadrados (`rounded-none`), sin sombras ni gradientes (la landing tiene
un hover con sombra en los CTA; es la excepción).

## NO HAGAS ESTO

- **No hardcodees hosts de la API.** Todo ruteo al backend pasa por
  `API_URL` / `BASE_URL` de `src/config.ts` (o el `baseURL` de `apiClient`).
  No hay `azurewebsites.net` ni host de API en `src/`. (`vintoapp.com` aparece
  solo como texto de marketing en la landing y en los meta tags de `index.html`.)
- **No leas `import.meta.env` fuera de `src/config.ts` y `src/api/client.ts`.**
- **No pongas una URL de imagen cruda en un `<img src>`.** Pasala por
  `resolveImageUrl()`: el backend devuelve rutas relativas.
- **No agregues dependencias.** El `package.json` está cerrado salvo pedido
  explícito.
- **No dejes variables ni parámetros sin usar** (`noUnusedLocals`,
  `noUnusedParameters`, `noFallthroughCasesInSwitch`): el build falla.
- **No uses `enum` ni parameter properties** (`erasableSyntaxOnly`). Usá union
  types de string, como `src/types/index.ts`.
- **No formatees horas de atención con la zona del navegador.** Siempre la
  `zonaHoraria` del local (`Intl` con `timeZone`, vía `utils/horarios.ts`): nada
  de `toLocaleTimeString` / `getHours` sin zona para horarios o `proximoCambio`.
- **No leas ni envíes `esActivo`, `esAbierto` ni `horarios` (texto libre).** Es
  legado del backend; el estado sale de `estado` / `horario`.
- **No conviertas `total()` / `cantidadTotal()` en valores.** Son métodos del
  store; llamalos dentro del selector — `useCartStore(s => s.total())`.
- **No hagas que el interceptor de Axios lea el token desde el store.** Lee de
  `localStorage` a propósito. (Sí puede *llamar* `expirarSesion()` del store.)
- **No uses `logout()` para sesiones vencidas:** el camino es `expirarSesion()`
  (activa el aviso "Tu sesión expiró" en el login). Un 401 de `/auth/login` no
  es sesión vencida y el interceptor lo ignora a propósito; un 429 en el login
  es "demasiados intentos", no credenciales malas.
- **No agregues los callbacks al dependency array de `usePedidosHub`.** El
  efecto depende solo de `adminId`; los callers deben memoizarlos
  (`AdminLayout` ya lo hace con `useCallback`).
- **No bajes la reconexión del hub a la de SignalR por defecto**: está
  configurada para no rendirse nunca (ver CONTEXT §7).
- **No "normalices" el casing de las rutas de la API** (`/productos` vs
  `/Productos/{id}/stock`, `/Imagenes`, `/ProductoExtra`). Copiá lo que ya
  funciona.
- **No importes `DireccionAutocomplete` de forma estática.** Arrastra Leaflet
  (+ CSS e imágenes); se carga con `lazy` solo cuando la entrega es Delivery.
- **No pongas datos personales del cliente en las páginas de pago**
  (`PagoSuccess/Failure/Pending`): el endpoint público de estado no los devuelve
  y los mensajes de WhatsApp usan solo el código de seguimiento.
- **No hagas que la demo de la landing sea operable.** El iframe de `/ejemplo`
  es "ver, no operar": el primer clic abre la tienda en pestaña nueva.
- **No crees `tailwind.config.js`.** Tailwind v4 se configura desde
  `src/index.css`.
- **No toques el shim `esToolkitCompatEsmShim` de `vite.config.ts`** salvo que
  estés arreglando exactamente ese bug (rompe Recharts en producción).
- **No muevas `public/staticwebapp.config.json`** (fallback SPA de Azure Static
  Web Apps; tiene que terminar en la raíz de `dist/`) ni borres
  `public/og-image.png` (lo referencia `index.html`).
- **No commitees `.env` ni `.env.development`** (están en `.gitignore`).
  `.env.production` sí está versionado. Nunca pongas secretos en un `.env`: todo
  `VITE_*` termina en el bundle público.
- **No hagas commit ni push** salvo que se te pida explícitamente.
