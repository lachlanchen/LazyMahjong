import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5182 },
  preview: { host: '127.0.0.1', port: 4182 },
  test: { environment: 'node' },
})
