import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Di GitHub Pages (project site) aset harus dipath relatif terhadap repo.
const isPages = process.env.GITHUB_ACTIONS === 'true'

export default defineConfig({
  base: isPages ? '/ball-vs-ball/' : '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
