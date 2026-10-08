import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import transformImports from '@rolldown/plugin-transform-imports'
import path from 'path'

const backendTarget = process.env.VITE_BACKEND_URL ?? 'http://localhost:3000'

const backendProxy = {
  target: backendTarget,
  changeOrigin: true,
}

export default defineConfig({
  plugins: [
    transformImports({
      '@tabler/icons-react': {
        transform: '@tabler/icons-react/dist/esm/icons/{{member}}.mjs',
      },
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: { clientPort: parseInt(process.env.VITE_HMR_CLIENT_PORT ?? '8081') },
    proxy: {
      '/api': backendProxy,
      '/avatars': backendProxy,
    },
  },
  build: {
    manifest: true,
    outDir: path.resolve(__dirname, '../backend/public/build'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
  },
})
