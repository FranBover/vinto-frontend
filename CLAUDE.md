# CLAUDE.md

Guía para Claude Code en este repositorio. Es el frontend de **Vinto**: SaaS
multi-tenant de menús/tiendas online. Un mismo build sirve a todos los locales;
el tenant se resuelve por el `:slug` de la URL.

El detalle largo (arquitectura, flujos, decisiones) está en
[`docs/CONTEXT.md`](docs/CONTEXT.md).

## Comandos

```bash
npm run dev       # servidor de desarrollo (HMR), puerto 5173
npm run build     # tsc -b && vite build  ← el type-check es parte del build
npm run lint      # ESLint
npm run preview   # sirve dist/ localmente
```

No hay test runner configurado. `npm run build` es la única verificación real.

## Stack

React 19 · TypeScript strict · Vite 8 · Tailwind v4 (plugin de Vite, sin archivo
de config) · Zustand 5 · React Router 7 (BrowserRouter) · Axios · SignalR
(`@microsoft/signalr`) · Recharts · Leaflet + react-leaflet · dnd-kit.

## Convenciones reales del repo

- **Nombres del dominio en español** (`pedido`, `cupón`, `descuento`,
  `varianteId`, `formaEntrega`). Nombres de infraestructura/React en inglés
  (`loading`, `onChange`, `handleSubmit`). Comentarios mezclados: mantené el
  idioma del archivo que estás tocando.
- **Estilos inline + Tailwind conviven.** Los colores de marca casi siempre van
  como hex literal en `className` (`bg-[#73223a]`) o en `style={{}}`. No hay
  tokens de diseño ni tema. Es intencional; no lo "arregles".
- **Cada página cliente redeclara** `const SERIF = "'Fraunces', Georgia, serif"`.
  Está duplicado en 12 archivos. Seguí el patrón si agregás una página.
- `src/config.ts` es el único lugar que lee `import.meta.env` para URLs
  (más `src/api/client.ts` para el `baseURL` de Axios).
- Los módulos de API (`src/api/*.ts`) exportan funciones sueltas `async` que
  devuelven `data` ya desempaquetado. Sin clases, sin wrappers de error.
- Los stores de Zustand exponen acciones con nombres en español
  (`agregarItem`, `limpiarCarrito`, `emitirNuevoPedido`).

## Sistema de diseño (el real, verificado en el código)

| Rol | Valor |
|---|---|
| Texto / borde principal | `#1a1a1a` |
| Fondo cliente | `#faf8f4` (crema) |
| Fondo admin | `#fafaf9` |
| Acento / CTA (vino) | `#73223a`, hover `#651d33` |
| Texto secundario | `#6b6258` |
| Superficie cálida | `#ede5d3`, borde `#e8e1d4` |
| Bordes admin | `#e8e8e8`, `#d0d0d0` |
| Positivo (descuentos, "abierto") | `#2d5a27` |
| Error | `#a92020` |
| Tipografía display | `'Fraunces', Georgia, serif` (Google Fonts, en `index.html`) |

Botones cuadrados (`rounded-none`), sin sombras ni gradientes. Cliente
mobile-first; admin desktop-first con sidebar fija de 200px.

## NO HAGAS ESTO

- **No hardcodees hosts de la API.** Todo ruteo al backend pasa por
  `API_URL` / `BASE_URL` de `src/config.ts` (o el `baseURL` de `apiClient`).
  Hoy no hay ni un `azurewebsites.net` ni un dominio de producción en `src/`;
  no seas el primero en meterlo.
- **No leas `import.meta.env` fuera de `src/config.ts` y `src/api/client.ts`.**
- **No pongas una URL de imagen cruda en un `<img src>`.** Pasala siempre por
  `resolveImageUrl()`: el backend devuelve rutas relativas que hay que prefijar
  con `BASE_URL`.
- **No agregues dependencias.** El `package.json` está cerrado salvo pedido
  explícito.
- **No dejes variables ni parámetros sin usar.** `tsconfig.app.json` tiene
  `noUnusedLocals`, `noUnusedParameters` y `noFallthroughCasesInSwitch`: el
  build falla, no avisa.
- **No uses `enum` ni parameter properties** (`constructor(private x)`).
  `erasableSyntaxOnly` está activo. Usá union types de string, como ya hace
  `src/types/index.ts`.
- **No conviertas `total()` / `cantidadTotal()` en valores.** Son métodos del
  store; llamalos dentro del selector — `useCartStore(s => s.total())` — o el
  componente no se re-renderiza.
- **No hagas que el interceptor de Axios lea el token desde el store.** Lee de
  `localStorage` a propósito, para funcionar fuera del árbol de React.
- **No agregues los callbacks al dependency array de `usePedidosHub`.** El
  efecto depende solo de `adminId`; incluirlos reconecta el hub en cada render.
  Los callers deben memoizarlos (`AdminLayout` ya lo hace con `useCallback`).
- **No "normalices" el casing de las rutas de la API.** El backend expone
  mayúsculas y minúsculas mezcladas (`/productos` pero `/Productos/{id}/stock`,
  `/Imagenes`, `/ProductoExtra`). Copiá lo que ya funciona, no lo unifiques a
  ciegas.
- **No crees `tailwind.config.js`.** Tailwind v4 se configura desde
  `src/index.css` (`@import "tailwindcss"`).
- **No toques el shim `esToolkitCompatEsmShim` de `vite.config.ts`** salvo que
  estés arreglando exactamente ese bug: sin él, el build de producción rompe
  Recharts en runtime.
- **No muevas `public/staticwebapp.config.json`.** Es el fallback SPA de Azure
  Static Web Apps y tiene que terminar en la raíz de `dist/`.
- **No commitees `.env`** (está en `.gitignore`). `.env.production` sí está
  versionado.
- **No hagas commit ni push** salvo que se te pida explícitamente.
