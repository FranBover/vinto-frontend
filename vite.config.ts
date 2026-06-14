import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function esToolkitCompatShim(): Plugin {
  const MARKER = '\0es-toolkit-shim:'
  return {
    name: 'es-toolkit-compat-shim',
    resolveId(id: string) {
      const m = id.match(/^es-toolkit\/compat\/(\w+)$/)
      if (m) return MARKER + m[1]
    },
    load(id: string) {
      if (!id.startsWith(MARKER)) return null
      const fn = id.slice(MARKER.length)
      return `import { ${fn} as _fn } from 'es-toolkit/compat'; export default _fn`
    },
  }
}

export default defineConfig({
  plugins: [
    esToolkitCompatShim(),
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ['recharts'],
    rolldownOptions: {
      plugins: [esToolkitCompatShim()],
    },
  },
})
