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
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'healthcheck.railway.app',
        'app.doublecheckverified.com',
        'admin.doublecheckverified.com'
      ],
      // Enable SPA fallback for client-side routing
      historyApiFallback: true
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
          // Simplified chunks for faster builds
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            data: ['@tanstack/react-query', '@supabase/supabase-js']
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
      
      // Optimizations disabled for faster builds
      chunkSizeWarningLimit: 2000,
      cssCodeSplit: false,
      reportCompressedSize: false
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
    }
  };
});