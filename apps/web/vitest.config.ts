import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'src/test/**',
      ],
    },
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@nara-opendata/shared-kernel': resolve(__dirname, '../../packages/shared-kernel/src'),
      '@nara-opendata/types': resolve(__dirname, '../../packages/libs/types/src'),
      '@nara-opendata/validation': resolve(__dirname, '../../packages/libs/validation/src'),
      '@nara-opendata/utils': resolve(__dirname, '../../packages/libs/utils/src'),
    },
  },
});
