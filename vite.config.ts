import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";
import viteCompression from "vite-plugin-compression";
// import { healthCheckMiddleware } from "./src/lib/monitoring/health-check";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: "localhost",
      port: 3000,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'healthcheck.railway.app',
        'app.doublecheckverified.com',
        'admin.doublecheckverified.com'
      ],
      // Enable SPA fallback for client-side routing
      historyApiFallback: true,
      // Reduce HMR noise
      hmr: {
        overlay: false, // Disable error overlay for less intrusive dev experience
      },
      // Watch configuration to reduce excessive file watching
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/.git/**',
          '**/coverage/**',
          '**/.nyc_output/**',
          '**/.*cache/**',
          '**/debug-*.js',
          '**/*.log'
        ],
        usePolling: false
      }
    },
    preview: {
      host: "::",
      port: parseInt(process.env.PORT || '4173'),
      strictPort: true,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'healthcheck.railway.app',
        'app.doublecheckverified.com',
        'admin.doublecheckverified.com'
      ],
      cors: {
        origin: env.VITE_PUBLIC_URL || '*',
        credentials: true
      },
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self)',
        'Content-Security-Policy': mode === 'production' 
          ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.openai.com https://api.github.com wss://*.supabase.co; media-src 'self' blob:; worker-src 'self' blob:"
          : '',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Service-Worker-Allowed': '/',
        // BLEEDING EDGE: Advanced resource hints headers
        'X-DNS-Prefetch-Control': 'on',
        'Link': '<https://fonts.googleapis.com>; rel=dns-prefetch, <https://api.openai.com>; rel=preconnect; crossorigin'
      }
    },
    plugins: [
      react(),
      
      // Simple health check middleware for production deployment
      {
        name: 'simple-health-check',
        configureServer(server: any) {
          server.middlewares.use((req: any, res: any, next: any) => {
            if (req.url === '/health') {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ 
                status: 'ok', 
                timestamp: new Date().toISOString(),
                service: 'str-certified'
              }));
            } else if (req.url === '/ready') {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ ready: true }));
            } else {
              next();
            }
          });
        }
      },
      
      // PWA disabled for faster builds
      
      // Compression disabled for faster builds - enable only in production if needed
      
      // Bundle analyzer (only in analyze mode)
      mode === 'analyze' && visualizer({
        open: true,
        filename: 'dist/bundle-stats.html',
        gzipSize: true,
        brotliSize: true
      })
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
      minify: mode === 'production' ? 'esbuild' : false,
      
      // Rollup options for code splitting
      rollupOptions: {
        external: [
          'puppeteer',
          'puppeteer-core',
          '@puppeteer/browsers',
          'node:fs',
          'node:path',
          'node:os',
          'node:url',
          'node:http',
          'node:https',
          'node:net',
          'node:tls',
          'node:stream',
          'node:util'
        ],
        output: {
          // ELITE CHUNK STRATEGY - BREAK DOWN LARGE BUNDLES
          manualChunks: (id) => {
            // React ecosystem (keep together - CRITICAL for hooks)
            if (id.includes('node_modules/react/') || 
                id.includes('node_modules/react-dom/') || 
                id.includes('node_modules/scheduler/') ||
                id.includes('node_modules/use-sync-external-store/')) {
              return 'react-core';
            }
            
            if (id.includes('node_modules/react-router')) {
              return 'router';
            }
            
            // Heavy UI libraries (split by usage)
            if (id.includes('node_modules/@radix-ui/react-dialog') ||
                id.includes('node_modules/@radix-ui/react-dropdown-menu') ||
                id.includes('node_modules/@radix-ui/react-tooltip')) {
              return 'ui-core';
            }
            
            if (id.includes('node_modules/@radix-ui')) {
              return 'ui-extended';
            }
            
            if (id.includes('node_modules/lucide-react')) {
              return 'icons';
            }
            
            // Data management
            if (id.includes('node_modules/@tanstack/react-query')) {
              return 'react-query';
            }
            
            if (id.includes('node_modules/@supabase/supabase-js')) {
              return 'supabase';
            }
            
            // Heavy libraries (lazy load candidates)
            if (id.includes('node_modules/html2canvas')) {
              return 'html2canvas';
            }
            
            if (id.includes('node_modules/lodash')) {
              return 'lodash';
            }
            
            if (id.includes('node_modules/date-fns')) {
              return 'date-utils';
            }
            
            // Admin features (only when needed)
            if (id.includes('/pages/admin/') || 
                id.includes('/components/admin/')) {
              return 'admin-features';
            }
            
            // Further split heavy vendor dependencies
            if (id.includes('node_modules/zod')) {
              return 'validation';
            }
            
            if (id.includes('node_modules/react-hook-form') ||
                id.includes('node_modules/@hookform/')) {
              return 'forms';
            }
            
            if (id.includes('node_modules/class-variance-authority') ||
                id.includes('node_modules/clsx') ||
                id.includes('node_modules/tailwind-merge')) {
              return 'utils-css';
            }
            
            if (id.includes('node_modules/@types/') ||
                id.includes('node_modules/typescript')) {
              return 'types';
            }
            
            if (id.includes('node_modules/@babel/') ||
                id.includes('node_modules/core-js')) {
              return 'polyfills';
            }
            
            if (id.includes('node_modules/framer-motion')) {
              return 'animations';
            }
            
            if (id.includes('node_modules/recharts') ||
                id.includes('node_modules/d3') ||
                id.includes('node_modules/victory')) {
              return 'charts-admin-only';
            }
            
            // ULTRA-AGGRESSIVE VENDOR SPLITTING FOR ELITE PERFORMANCE
            if (id.includes('node_modules')) {
              const moduleName = id.split('node_modules/')[1]?.split('/')[0];
              if (moduleName) {
                // Split major libraries into individual chunks
                if (moduleName === '@emotion' || id.includes('@emotion')) {
                  return 'vendor-emotion';
                }
                
                if (moduleName === '@types' || id.includes('@types')) {
                  return 'vendor-types';
                }
                
                // scheduler and use-sync-external-store now bundled with react-core
                if (moduleName === 'scheduler' || moduleName === 'use-sync-external-store') {
                  return 'react-core';
                }
                
                // React utilities moved to vendor-react-ecosystem above
                
                if (moduleName === '@floating-ui' || id.includes('@floating-ui')) {
                  return 'vendor-floating-ui';
                }
                
                if (moduleName === 'cmdk' || moduleName === 'sonner') {
                  return 'vendor-ui-misc';
                }
                
                if (moduleName === 'vaul' || moduleName === 'embla-carousel') {
                  return 'vendor-carousel';
                }
                
                // Group small utilities together (STRICT React exclusion to prevent hook errors)
                if (['use-', 'is-', 'has-', 'get-', 'can-', 'detect-'].some(prefix => moduleName.startsWith(prefix)) && 
                    !moduleName.includes('react') && 
                    !id.includes('node_modules/react') &&
                    !id.includes('scheduler') &&
                    !id.includes('use-sync-external-store') &&
                    moduleName !== 'scheduler' &&
                    moduleName !== 'use-sync-external-store') {
                  return 'vendor-utils-small';
                }
                
                // Group React ecosystem together (including utilities)
                if (moduleName.startsWith('react-') && !moduleName.includes('router')) {
                  return 'vendor-react-ecosystem';
                }
                
                // Keep React utilities with ecosystem to prevent import errors
                if (moduleName === 'react-remove-scroll' || moduleName === 'react-style-singleton') {
                  return 'vendor-react-ecosystem';
                }
                
                // Put libraries by size - small libraries together, big ones separate
                if (moduleName.length < 5) {
                  return 'vendor-micro';
                }
                
                if (moduleName.length > 15 || ['@supabase', '@radix-ui', '@tanstack'].includes(moduleName)) {
                  return `vendor-${moduleName.replace('@', '').replace('/', '-').replace('.', '-')}`;
                }
                
                // More granular grouping to avoid large chunks
                const firstLetter = moduleName.charAt(0).toLowerCase();
                if (firstLetter >= 'a' && firstLetter <= 'c') {
                  return 'vendor-ac';
                } else if (firstLetter >= 'd' && firstLetter <= 'f') {
                  return 'vendor-df';
                } else if (firstLetter >= 'g' && firstLetter <= 'i') {
                  return 'vendor-gi';
                } else if (firstLetter >= 'j' && firstLetter <= 'l') {
                  return 'vendor-jl';
                } else if (firstLetter >= 'm' && firstLetter <= 'o') {
                  return 'vendor-mo';
                } else if (firstLetter >= 'p' && firstLetter <= 'r') {
                  return 'vendor-pr';
                } else if (firstLetter >= 's' && firstLetter <= 'u') {
                  return 'vendor-su';
                } else {
                  return 'vendor-vz';
                }
              }
              return 'vendor-misc';
            }
          },
          
          // Asset file naming
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js'
        }
      },
      
      // ELITE OPTIMIZATIONS ENABLED
      chunkSizeWarningLimit: 200, // Elite standard - stricter than default
      cssCodeSplit: true, // Enable CSS code splitting for better caching
      reportCompressedSize: true
    },
    
    // Optimizations
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        '@supabase/supabase-js'
      ],
      exclude: [
        // Exclude very heavy libraries for lazy loading
        'html2canvas',
        'lodash',
        'framer-motion',
        'recharts', // Charts are admin-only, lazy load
        'd3',
        // Build tools
        '@vite/client', 
        '@vite/env',
        'puppeteer',
        'puppeteer-core',
        '@puppeteer/browsers'
      ]
    },
    
    // Environment variables
    define: {
      // Inject build time
      '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
      '__BUILD_VERSION__': JSON.stringify(process.env.npm_package_version || '0.0.0'),
      
      // Domain configuration
      '__INSPECTOR_DOMAIN__': JSON.stringify(env.VITE_INSPECTOR_DOMAIN || 'app.doublecheckverified.com'),
      '__ADMIN_DOMAIN__': JSON.stringify(env.VITE_ADMIN_DOMAIN || 'admin.doublecheckverified.com'),
      
      // Feature flags (domain-aware)
      '__ENABLE_ANALYTICS__': env.VITE_ENABLE_ANALYTICS === 'true',
      '__ENABLE_PWA__': env.VITE_ENABLE_PWA === 'true',
      '__ENABLE_SENTRY__': Boolean(env.VITE_SENTRY_DSN),
      '__ENABLE_DOMAIN_ROUTING__': env.VITE_ENABLE_DOMAIN_ROUTING === 'true'
    },
    
    // Explicitly expose environment variables to the client
    envPrefix: ['VITE_', 'REACT_APP_'],
    
    // Performance hints
    esbuild: {
      legalComments: 'none',
      target: 'es2020'
    },
    
    
    // JSON loading
    json: {
      stringify: true
    },
    
    // Worker configuration
    worker: {
      format: 'es',
      plugins: () => []
    },
    
    // Test configuration for Vitest
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
      deps: {
        inline: ['@testing-library/user-event']
      }
    }
  };
});