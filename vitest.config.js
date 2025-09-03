import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'tests/e2e/',
        'tests/Integration/',
        '**/*.d.ts',
        '**/*.config.js',
        '**/coverage/**',
        'portal2-admin-refactor/**',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      '**/coverage/**',
      'portal2-admin-refactor/**',
      '**/tests/e2e/**',
      '**/tests/Integration/**',
      '**/playwright/**',
    ],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
