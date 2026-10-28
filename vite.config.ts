import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { apiDevPlugin } from './vite-api-dev-plugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevPlugin()],
  test: {
    environment: 'node',
    // Model tests run under plain Node; a11y tests render real components and
    // opt into jsdom themselves via a `// @vitest-environment jsdom` pragma.
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.tsx', 'api/**/__tests__/**/*.test.ts'],
  },
})
