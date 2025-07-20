import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // Enhanced timeout settings for different test types
    testTimeout: 10000, // Default 10s for most tests
    hookTimeout: 5000,  // 5s for setup/teardown
    // For browser automation tests, use 30s timeout
    // Individual tests can override with { timeout: 30000 } parameter
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.git',
      '.cache',
      'coverage',
      'src/lib/scrapers/**', // Exclude scraper tests from coverage
      'src/**/*.stories.*', // Exclude Storybook files
      'src/types/**/*.ts', // Exclude type definitions
      'src/**/*.config.*' // Exclude config files
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      // Enterprise-grade coverage thresholds
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        // Critical business logic requires higher coverage
        'src/services/**': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'src/hooks/**': {
          branches: 92,
          functions: 92,
          lines: 92,
          statements: 92
        }
      },
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        'src/**/*.d.ts',
        'src/types/',
        'coverage/',
        'dist/',
        'src/**/__tests__/**',
        'src/**/*.test.*',
        'src/**/*.spec.*',
        'src/lib/scrapers/**',
        'src/**/*.stories.*',
        'src/**/*.config.*',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ],
      // Include source files for comprehensive coverage
      include: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.test.*',
        '!src/**/*.spec.*',
        '!src/**/__tests__/**',
        '!src/types/**'
      ],
      // Advanced coverage options
      all: true,
      skipFull: false,
      clean: true,
      cleanOnRerun: true
    },
    // Performance optimizations for large test suites
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 4,
        minForks: 1
      }
    },
    // Reporter configuration for CI/CD
    reporter: 'default',
    // Output directory for test artifacts
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/report.html'
    },
    // Watch mode configuration
    watch: true,
    watchExclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'test-results/**'
    ],
    // Snapshot configuration
    resolveSnapshotPath: (testPath, snapExtension) => {
      return testPath.replace('/src/', '/src/__tests__/snapshots/') + snapExtension;
    },
    // Mock configuration
    clearMocks: true,
    mockReset: true,
    restoreMocks: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  // Ensure React imports are available in tests
  esbuild: {
    jsxInject: `import React from 'react'`
  }
});