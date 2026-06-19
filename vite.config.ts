import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// es-toolkit only ships a CommonJS wrapper for the `es-toolkit/compat/<fn>`
// subpaths (its `exports` map has no `import` condition for them). Under the
// Vite 8 / rolldown production build that CJS interop breaks for some
// functions (e.g. `get`, used by recharts) and throws "t is not a function"
// at runtime. We redirect every `es-toolkit/compat/<fn>` import to the ESM
// barrel (`dist/compat/index.mjs`) and re-export the named function as the
// default, so consumers using either `import fn from` or `import { fn } from`
// resolve to clean ESM. This is general across all compat functions.
function esToolkitCompatEsmShim(): Plugin {
  const PREFIX = '\0es-toolkit-compat:'
  return {
    name: 'es-toolkit-compat-esm-shim',
    enforce: 'pre',
    resolveId(id) {
      const m = id.match(/^es-toolkit\/compat\/(\w+)$/)
      if (m) return PREFIX + m[1]
    },
    load(id) {
      if (!id.startsWith(PREFIX)) return null
      const fn = id.slice(PREFIX.length)
      return [
        `import { ${fn} } from 'es-toolkit/compat'`,
        `export default ${fn}`,
        `export { ${fn} }`,
      ].join('\n')
    },
  }
}

export default defineConfig({
  plugins: [
    esToolkitCompatEsmShim(),
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ['recharts'],
  },
})
