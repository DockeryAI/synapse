/**
 * Vitest Configuration for Unit/Integration Testing
 *
 * For testing services, utilities, and business logic.
 * Because unit tests catch bugs before E2E tests have a chance.
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/e2e/**',
      'tests/_archived/**',
      'src/__tests__/e2e/**',
      'src/__tests__/_archived/**',
      'src/_archive/**',
      'src/**/_archived/**',
      '**/*.e2e.spec.ts',
      '**/*.e2e.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.ts',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
