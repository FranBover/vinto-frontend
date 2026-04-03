# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Type-check + production build (tsc -b && vite build)
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

No test runner is configured.

## Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 8** with `@tailwindcss/vite` plugin (Tailwind v4 — no config file, imported via `index.css`)
- **Zustand** for global state
- **React Router v7** (BrowserRouter)
- **Axios** with a shared `apiClient` instance

## Architecture

### Routing (`src/App.tsx`)
Two route trees:
- `/:slug` — MenuPage (categories)
- `/:slug/productos/:categoriaId` — ProductosPage
- `/:slug/productos/:categoriaId/:productoId` — ExtrasPage (extras + add to cart)
- `/:slug/carrito` — CarritoPage
- `/:slug/checkout` — CheckoutPage (form + crearPedido call)
- `/:slug/confirmacion` — ConfirmacionPage (reads pedido + local from `location.state`)
- `/admin/...` — admin panel; all routes except `/admin/login` wrapped in `ProtectedRoute` (reads `useAuthStore.isAuthenticated()`, redirects to `/admin/login` if not authenticated)

### State (`src/store/`)
- **`menuStore.ts`** — caches `MenuPublico` by slug. `fetchMenu(slug)` skips if already cached or loading. Pages call it in `useEffect` and read from `data[slug]`.
- **`cartStore.ts`** — client cart. Items are keyed by `productoId + sorted extrasIds`, so the same product with different extras is a separate line item. `total()` and `cantidadTotal()` are methods on the store — call them as `useCartStore(s => s.total())` in selectors for reactive updates.
- **`authStore.ts`** — admin JWT. Token is persisted in `localStorage` under `vinto_admin_token`. `adminId` is parsed from the JWT payload on load. Auto-logout on 401 via Axios interceptor.

### API (`src/api/`)
- **`client.ts`** — Axios instance. Base URL from `VITE_API_URL` env var (fallback `http://localhost:5000/api`). Request interceptor injects Bearer token from localStorage. Response interceptor calls `logout()` on 401.
- **`publicApi.ts`** — `getMenu(slug)`, `crearPedido(dto)`
- **`adminApi.ts`** — auth, pedidos, productos, categorías, reportes

### Types (`src/types/index.ts`)
All domain models and DTOs in one file. Key union types: `EstadoPedido`, `FormaPago`, `FormaEntrega`. `MenuPublico` is the shape returned by `getMenu`.

## Design System

- Background white, text `#1a1a1a`, dark green accent `#2d5a27`
- Font: Helvetica Neue / sans-serif
- Buttons: `rounded-none` (border-radius 0), no shadows, no gradients
- Mobile-first for client pages; desktop-first for admin panel

## TypeScript Config

`tsconfig.app.json` enforces `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` — the build fails on unused variables/parameters.

## Environment

Create `.env.local` with:
```
VITE_API_URL=http://localhost:5000/api
```
