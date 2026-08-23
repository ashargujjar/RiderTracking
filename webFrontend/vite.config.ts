import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Docker on Windows often can't deliver native filesystem change events into
// the container, so the dev compose override sets VITE_USE_POLLING=true to
// fall back to polling for HMR.
const usePolling = process.env.VITE_USE_POLLING === 'true'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    watch: usePolling ? { usePolling: true, interval: 300 } : undefined,
  },
})
