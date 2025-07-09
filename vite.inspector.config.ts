import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";
import viteCompression from "vite-plugin-compression";

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
          ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.openai.com wss://*.supabase.co; media-src 'self' blob:; worker-src 'self' blob:"
          : '',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Service-Worker-Allowed': '/'
      }
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
      
      // Enhanced PWA Support for Mobile Inspector App
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'STR Certified Inspector',
          short_name: 'STR Inspector',
          description: 'AI-powered property inspection app for field inspectors',
          theme_color: '#8b5cf6',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          categories: ['productivity', 'business'],
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
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 2 // 2 hours
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/api\.openai\.com\/.*$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'openai-api-cache',
                networkTimeoutSeconds: 30,
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 // 1 hour
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
                  maxEntries: 500,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                }
              }
            },
            {
              urlPattern: /\.(?:js|css|html)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-resources',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                }
              }
            }
          ]
        }
      }),
      
      // Compression optimized for mobile
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 5120, // 5KB - Lower threshold for mobile
        deleteOriginFile: false
      }),
      
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 5120,
        deleteOriginFile: false
      }),
      
      // Bundle analyzer (only in analyze mode)
      mode === 'analyze' && visualizer({
        open: true,
        filename: 'dist/inspector-bundle-stats.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap' // Better for mobile optimization analysis
      })
    ].filter(Boolean),
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    
    // Environment variables specific to inspector app
    define: {
      '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
      '__BUILD_VERSION__': JSON.stringify(process.env.npm_package_version || '0.0.0'),
      '__APP_TYPE__': JSON.stringify('inspector'),
      
      // Feature flags for inspector
      '__ENABLE_ANALYTICS__': false, // Disable analytics in inspector app
      '__ENABLE_PWA__': true,
      '__ENABLE_SENTRY__': Boolean(env.VITE_SENTRY_DSN),
      '__ENABLE_OFFLINE_MODE__': true,
      '__ENABLE_MOBILE_OPTIMIZATION__': true
    },
    
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'production' ? false : true, // No sourcemap in production for mobile
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
          pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.warn'] : []
        },
        format: {
          comments: false
        }
      },
      
      // Rollup options optimized for mobile inspector app
      rollupOptions: {
        output: {
          // Manual chunks optimized for inspector workflow
          manualChunks: {
            // Core React dependencies
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            
            // Mobile-specific UI components
            'mobile-ui': ['@radix-ui/react-dialog', '@radix-ui/react-sheet', '@radix-ui/react-toast'],
            
            // Data and offline capabilities
            'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
            
            // Camera and media libraries
            'media-vendor': ['react-camera-pro', 'react-webcam'],
            
            // Utility libraries
            'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge', 'zod'],
            
            // PWA and offline libraries
            'pwa-vendor': ['workbox-window', 'idb'],
            
            // Optional AI features (lazy loaded)
            'ai-vendor': ['openai']
          },
          
          // Note: external is not used for component exclusion in Vite
          // Component exclusion is handled by conditional imports in the app
          
          // Asset file naming optimized for caching
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext)) {
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
      
      // Smaller chunk size warning for mobile
      chunkSizeWarningLimit: 500, // 500KB
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Preload directives
      modulePreload: {
        polyfill: true
      },
      
      // Smaller asset inlining threshold for mobile
      assetsInlineLimit: 2048, // 2KB
      
      // Report compressed size
      reportCompressedSize: false // Disable for faster builds
    },
    
    // Optimizations for mobile performance
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        '@supabase/supabase-js',
        'date-fns',
        'clsx'
      ],
      exclude: ['@vite/client', '@vite/env']
    },
    
    // Performance hints for mobile
    esbuild: {
      legalComments: 'none',
      target: 'es2020',
      keepNames: false,
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true
    },
    
    
    // Worker configuration for PWA
    worker: {
      format: 'es',
      plugins: () => []
    }
  };
});