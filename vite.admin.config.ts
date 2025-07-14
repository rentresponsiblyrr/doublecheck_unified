import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
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
      port: 4173,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
      
      // No PWA for admin app - it's desktop focused
      
      // Enhanced compression for admin analytics
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240, // 10KB - Higher threshold for desktop
        deleteOriginFile: false
      }),
      
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 10240,
        deleteOriginFile: false
      }),
      
      // Enhanced bundle analyzer for admin optimization
      mode === 'analyze' && visualizer({
        open: true,
        filename: 'dist/admin-bundle-stats.html',
        gzipSize: true,
        brotliSize: true,
        template: 'sunburst' // Better for admin dashboard analysis
      })
    ].filter(Boolean),
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    
    // Environment variables specific to admin app
    define: {
      '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
      '__BUILD_VERSION__': JSON.stringify(process.env.npm_package_version || '0.0.0'),
      '__APP_TYPE__': JSON.stringify('admin'),
      
      // Feature flags for admin
      '__ENABLE_ANALYTICS__': true, // Enable analytics in admin app
      '__ENABLE_PWA__': false, // Disable PWA for admin
      '__ENABLE_SENTRY__': Boolean(env.VITE_SENTRY_DSN),
      '__ENABLE_OFFLINE_MODE__': false, // No offline mode for admin
      '__ENABLE_MOBILE_OPTIMIZATION__': false,
      '__ENABLE_PERFORMANCE_MONITORING__': true,
      '__ENABLE_DEBUG_TOOLS__': true
    },
    
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'production' ? 'hidden' : true, // Keep sourcemap for debugging
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
      
      // Rollup options optimized for admin dashboard
      rollupOptions: {
        output: {
          // Manual chunks optimized for admin workflow
          manualChunks: {
            // Core React dependencies
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            
            // Admin-specific UI components
            'admin-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 
                        '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-accordion'],
            
            // Data fetching and state management
            'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
            
            // Analytics and monitoring libraries
            'analytics-vendor': ['recharts', 'date-fns', 'react-hook-form'],
            
            // Utility libraries
            'utils-vendor': ['clsx', 'tailwind-merge', 'zod'],
            
            // AI and ML libraries (for admin analytics)
            'ai-vendor': ['openai'],
            
            // Performance monitoring
            'monitoring-vendor': ['@sentry/react']
          },
          
          // Exclude mobile-specific components
          external: (id) => {
            return id.includes('/mobile/') || 
                   id.includes('/photo/') || 
                   id.includes('/video/') ||
                   id.includes('InspectorWorkflow') ||
                   id.includes('PropertySelection') ||
                   id.includes('workbox');
          },
          
          // Asset file naming optimized for admin dashboard
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
      
      // Higher chunk size warning for admin dashboard
      chunkSizeWarningLimit: 1500, // 1.5MB
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Preload directives
      modulePreload: {
        polyfill: true
      },
      
      // Higher asset inlining threshold for admin
      assetsInlineLimit: 8192, // 8KB
      
      // Report compressed size for admin optimization
      reportCompressedSize: true
    },
    
    // Optimizations for admin dashboard performance
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        '@supabase/supabase-js',
        'recharts',
        'date-fns',
        'clsx',
        'react-hook-form'
      ],
      exclude: ['@vite/client', '@vite/env']
    },
    
    // Performance hints for admin dashboard
    esbuild: {
      legalComments: 'none',
      target: 'es2020',
      keepNames: mode === 'development' // Keep names for debugging
    },
    
    // Preview server configuration (for Railway deployment)
    preview: {
      port: parseInt(process.env.PORT || '4173'),
      host: true,
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
        'Permissions-Policy': 'camera=(none), microphone=(none), geolocation=(none)',
        'Content-Security-Policy': mode === 'production' 
          ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://js.sentry-cdn.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.openai.com https://api.github.com https://sentry.io wss://*.supabase.co; frame-src 'none'"
          : '',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    },
    
    // JSON loading
    json: {
      stringify: true
    },
    
    // Worker configuration for admin background tasks
    worker: {
      format: 'es',
      plugins: () => []
    }
  };
});