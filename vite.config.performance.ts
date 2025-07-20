/**
 * VITE PERFORMANCE CONFIGURATION - META/NETFLIX/STRIPE STANDARDS
 * 
 * Advanced Vite configuration optimized for production performance.
 * Implements aggressive bundle splitting, tree shaking, and optimization
 * strategies used by top-tier tech companies.
 * 
 * Performance Targets:
 * - Initial bundle: <500KB (Meta: 2MB, Netflix: 1MB, Stripe: 800KB)
 * - Route chunks: <200KB each
 * - Vendor chunk: <300KB
 * - Critical path optimized for <1s TTI
 */

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react({
        // Enable React optimization features
        jsxImportSource: '@emotion/react',
        plugins: [
          ['@swc/plugin-emotion', {}]
        ],
      }),
      
      // Advanced chunk splitting
      splitVendorChunkPlugin(),
      
      // Bundle analyzer for performance monitoring
      mode === 'analyze' && visualizer({
        open: true,
        filename: 'dist/bundle-analysis.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }),
    ].filter(Boolean),
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'production' ? false : true,
      minify: 'esbuild',
      
      // Advanced rollup configuration for optimal chunking
      rollupOptions: {
        external: [
          // Externalize heavy dependencies that can be loaded from CDN
          // (Only in specific cases where CDN benefits outweigh bundling)
        ],
        
        output: {
          // PROFESSIONAL CHUNK STRATEGY
          manualChunks: (id) => {
            // React core (always needed)
            if (id.includes('node_modules/react') || 
                id.includes('node_modules/react-dom')) {
              return 'react';
            }
            
            // Router (loaded early but not critical)
            if (id.includes('node_modules/react-router')) {
              return 'router';
            }
            
            // UI components (shared across routes)
            if (id.includes('node_modules/@radix-ui') || 
                id.includes('node_modules/lucide-react') ||
                id.includes('/components/ui/')) {
              return 'ui';
            }
            
            // Data management (heavy but shared)
            if (id.includes('node_modules/@tanstack/react-query') ||
                id.includes('node_modules/@supabase/supabase-js')) {
              return 'data';
            }
            
            // Admin features (loaded only when needed)
            if (id.includes('/pages/admin/') || 
                id.includes('/components/admin/')) {
              return 'admin';
            }
            
            // Auditor features (loaded only when needed)
            if (id.includes('/pages/auditor/') || 
                id.includes('/components/auditor/')) {
              return 'auditor';
            }
            
            // Inspector features (main application)
            if (id.includes('/pages/inspector/') || 
                id.includes('/components/inspector/')) {
              return 'inspector';
            }
            
            // Utilities and services
            if (id.includes('/lib/') || 
                id.includes('/utils/') || 
                id.includes('/services/')) {
              return 'utils';
            }
            
            // Heavy third-party libraries
            if (id.includes('node_modules/lodash')) return 'lodash';
            if (id.includes('node_modules/date-fns')) return 'date';
            if (id.includes('node_modules/html2canvas')) return 'canvas';
            
            // Default vendor chunk for other node_modules
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          
          // Optimized file naming for caching
          chunkFileNames: (chunkInfo) => {
            const name = chunkInfo.name;
            
            // Critical chunks get priority naming
            if (name === 'react' || name === 'router') {
              return 'assets/js/critical/[name]-[hash].js';
            }
            
            // Feature chunks
            if (name === 'admin' || name === 'auditor' || name === 'inspector') {
              return 'assets/js/features/[name]-[hash].js';
            }
            
            // Shared chunks
            if (name === 'ui' || name === 'data' || name === 'utils') {
              return 'assets/js/shared/[name]-[hash].js';
            }
            
            // Default
            return 'assets/js/[name]-[hash].js';
          },
          
          entryFileNames: 'assets/js/entry/[name]-[hash].js',
          
          // Asset optimization
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const ext = info[info.length - 1];
            
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            
            if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            
            if (/css/i.test(ext)) {
              return 'assets/css/[name]-[hash][extname]';
            }
            
            return 'assets/[name]-[hash][extname]';
          },
        },
        
        // Tree shaking optimization
        treeshake: {
          moduleSideEffects: (id) => {
            // Preserve side effects for CSS and known side-effect modules
            return id.includes('.css') || 
                   id.includes('polyfill') ||
                   id.includes('@babel/polyfill');
          },
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false,
        },
      },
      
      // Advanced build optimizations
      chunkSizeWarningLimit: 200, // Stricter than default 500KB
      reportCompressedSize: true,
      cssCodeSplit: true,
      
      // Minification options
      minify: 'esbuild',
      target: 'es2020',
    },
    
    // Advanced dependency optimization
    optimizeDeps: {
      include: [
        // Pre-bundle critical dependencies
        'react',
        'react-dom',
        'react-router-dom',
      ],
      exclude: [
        // Don't pre-bundle heavy or conditionally loaded dependencies
        '@supabase/supabase-js',
        'html2canvas',
      ],
      esbuildOptions: {
        target: 'es2020',
      },
    },
    
    // ESBuild optimization
    esbuild: {
      target: 'es2020',
      legalComments: 'none',
      treeShaking: true,
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    
    // Server configuration for development
    server: {
      host: "localhost",
      port: 3000,
      hmr: {
        overlay: false,
      },
      // Performance optimizations for dev server
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/.git/**',
          '**/coverage/**',
          '**/*.log',
        ],
        usePolling: false,
      },
    },
    
    // Preview server optimization
    preview: {
      host: "::",
      port: parseInt(process.env.PORT || '4173'),
      strictPort: true,
      headers: {
        // Performance headers
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    },
    
    // CSS optimization
    css: {
      devSourcemap: mode !== 'production',
      preprocessorOptions: {
        scss: {
          // Optimize SCSS compilation
          outputStyle: 'compressed',
        },
      },
      modules: {
        // CSS Modules optimization
        generateScopedName: mode === 'production' 
          ? '[hash:base64:5]' 
          : '[name]__[local]__[hash:base64:5]',
      },
    },
    
    // Worker optimization
    worker: {
      format: 'es',
      plugins: () => [
        react({
          jsxImportSource: '@emotion/react',
        }),
      ],
    },
    
    // Environment variables optimization
    define: {
      // Remove development code in production
      __DEV__: mode !== 'production',
      __PROD__: mode === 'production',
      
      // Build-time constants
      '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
      '__BUILD_VERSION__': JSON.stringify(process.env.npm_package_version || '0.0.0'),
      
      // Feature flags
      '__ENABLE_DEVTOOLS__': mode !== 'production',
    },
    
    // JSON optimization
    json: {
      stringify: true,
      namedExports: false,
    },
    
    // Test configuration for performance testing
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/__tests__/setup.ts'],
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: [
        'node_modules',
        'dist',
        '.idea',
        '.git',
        '.cache'
      ],
      testTimeout: 10000,
      hookTimeout: 10000,
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: true
        }
      },
    },
  };
});