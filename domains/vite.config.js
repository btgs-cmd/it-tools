import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/domains/',
  build: {
    outDir: '../domains',
    emptyOutDir: true,
  }
})
