import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path aset.
// - BASE_PATH=./            -> path relatif, bisa dipakai di hosting/CDN mana pun
// - GITHUB_ACTIONS=true    -> project site GitHub Pages (/ball-vs-ball/)
// - default                -> domain root (dev & localhost)
const base =
  process.env.BASE_PATH ?? (process.env.GITHUB_ACTIONS === 'true' ? '/ball-vs-ball/' : '/')

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
