import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // VITE_BASE is set to '/stealth-finder-frontend/' when building for GitHub Pages.
  // Defaults to '/' for local dev and other deployments.
  base: process.env.VITE_BASE || '/',
  server: {
    port: 3000,
  },
})
