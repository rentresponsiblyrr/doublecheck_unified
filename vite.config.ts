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
      host: "::",
      port: 8080,
    },
    preview: {
      host: "::",
      port: parseInt(process.env.PORT || '4173'),
      strictPort: true,
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
          ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.openai.com wss://*.supabase.co; media-src 'self' blob:; worker-src 'self' blob:"
          : '',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Service-Worker-Allowed': '/'
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
      
      // PWA Support - conditional based on domain detection
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'STR Certified',
          short_name: 'STR Certified',
          description: 'AI-powered property inspection platform',
          theme_color: '#8b5cf6',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }
            }
          ]
        }
      }),
      
      // Compression for better performance
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240, // 10KB
        deleteOriginFile: false
      }),
      
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 10240,
        deleteOriginFile: false
      }),
      
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
      sourcemap: mode === 'production' ? 'hidden' : true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
          pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : []
        },
        format: {
          comments: false
        }
      },
      
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
          // Manual chunks for better caching and smaller initial bundle
          manualChunks: {
            // React and related libraries
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            
            // UI libraries (split into smaller chunks)
            'ui-vendor': [
              '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 
              '@radix-ui/react-select', '@radix-ui/react-tabs',
              '@radix-ui/react-alert-dialog', '@radix-ui/react-checkbox',
              '@radix-ui/react-popover', '@radix-ui/react-tooltip'
            ],
            
            // Form and input libraries
            'form-vendor': [
              'react-hook-form', '@hookform/resolvers', 'zod',
              'input-otp', 'cmdk'
            ],
            
            // Data fetching and state
            'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
            
            // Utility libraries
            'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
            
            // Chart libraries (loaded on demand)
            'charts': ['recharts'],
            
            // AI/ML related (loaded on demand)
            'ai-vendor': ['openai'],
            
            // PDF generation (loaded on demand)
            'pdf-vendor': ['@react-pdf/renderer', 'jspdf'],
            
            // Image processing (loaded on demand)
            'image-vendor': ['html2canvas'],
            
            // Icon libraries
            'icon-vendor': ['lucide-react'],
            
            // Large third-party libraries
            'heavy-vendor': ['axios']
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
      
      // Chunk size warnings
      chunkSizeWarningLimit: 1000, // 1MB
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Preload directives
      modulePreload: {
        polyfill: true
      },
      
      // Asset inlining threshold
      assetsInlineLimit: 4096, // 4KB
      
      // Report compressed size
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
    }
  };
});