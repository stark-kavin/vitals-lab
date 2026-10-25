/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { htmlPlugin } from './build/html-plugin.ts'

export default defineConfig({
  // Relative base so the build works from any sub-path (e.g. GitHub Pages project sites).
  base: './',
  plugins: [react(), tailwindcss(), htmlPlugin()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    // The largest chunks are react-dom (main) and the lazily loaded sample-report fixture.
    chunkSizeWarningLimit: 400,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
  },
})
