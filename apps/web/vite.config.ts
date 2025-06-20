import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@nara-opendata/shared-kernel': resolve(__dirname, '../../packages/shared-kernel/src'),
      '@nara-opendata/types': resolve(__dirname, '../../packages/libs/types/src'),
      '@nara-opendata/validation': resolve(__dirname, '../../packages/libs/validation/src'),
      '@nara-opendata/utils': resolve(__dirname, '../../packages/libs/utils/src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js', '@supabase/auth-ui-react'],
        }
      }
    }
  }
})