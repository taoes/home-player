import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // GitHub Pages 部署在子路径（https://<user>.github.io/<repo>/），
  // CI 通过 BASE_URL 注入；本地开发默认 '/'
  base: process.env.BASE_URL || '/',
})
