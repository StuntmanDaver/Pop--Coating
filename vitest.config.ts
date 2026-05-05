import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // server-only throws unconditionally on import (Next.js resolves it to a no-op
      // via the `react-server` export condition; vitest doesn't, so we alias it here).
      'server-only': path.resolve(__dirname, './test/stubs/server-only.ts'),
    },
  },
  test: { environment: 'jsdom', globals: true },
})
