import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'tests/fixtures/**'
      ]
    },
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    testTimeout: 30000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@nara-opendata/shared-kernel': resolve(__dirname, '../../packages/shared-kernel/src'),
      '@nara-opendata/types': resolve(__dirname, '../../packages/libs/types/src'),
      '@nara-opendata/validation': resolve(__dirname, '../../packages/libs/validation/src'),
      '@nara-opendata/utils': resolve(__dirname, '../../packages/libs/utils/src')
    }
  }
})