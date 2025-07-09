import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Staging-specific Vite configuration
export default defineConfig({
  plugins: [react()],
  
  // Staging-specific build configuration
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true, // Enable source maps for staging debugging
    minify: 'terser', // Use terser for better debugging
    rollupOptions: {
      external: ['puppeteer'], // Externalize puppeteer for staging
      output: {
        manualChunks: {
          // Chunk splitting for better caching in staging
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          ai: ['openai'],
          supabase: ['@supabase/supabase-js'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 2000 // Relaxed limit for staging
  },
  
  // Development server configuration for staging testing
  server: {
    port: 5173,
    host: true,
    open: false,
    cors: true,
    hmr: {
      clientPort: 5173
    }
  },
  
  // Preview configuration for staging
  preview: {
    port: 4173,
    host: true,
    open: false,
    cors: true
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Environment variables
  define: {
    // Staging-specific feature flags
    __STAGING__: true,
    __DEVELOPMENT__: false,
    __PRODUCTION__: false,
    
    // Debug flags for staging
    __DEBUG_PANEL__: true,
    __CONSOLE_LOGS__: true,
    __SOURCE_MAPS__: true,
    
    // API configuration
    __API_TIMEOUT__: 10000,
    __AI_TIMEOUT__: 30000,
    __UPLOAD_TIMEOUT__: 60000,
    
    // Performance monitoring
    __PERFORMANCE_MONITORING__: true,
    __ERROR_TRACKING__: true,
    __ANALYTICS__: true,
    
    // Build info
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __BUILD_VERSION__: JSON.stringify(process.env.npm_package_version || 'staging'),
    __BUILD_COMMIT__: JSON.stringify(process.env.GITHUB_SHA || 'local')
  },
  
  // Optimize dependencies for staging
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'openai',
      'date-fns',
      'lucide-react'
    ],
    exclude: [
      'puppeteer' // Exclude puppeteer from optimization
    ]
  },
  
  // CSS configuration
  css: {
    devSourcemap: true, // Enable CSS source maps for staging
    preprocessorOptions: {
      scss: {
        additionalData: `
          $staging: true;
          $development: false;
          $production: false;
        `
      }
    }
  },
  
  // Experimental features for staging testing
  experimental: {
    renderBuiltUrl: (filename: string) => {
      // Custom asset URL handling for staging
      return `/${filename}`;
    }
  },
  
  // Worker configuration
  worker: {
    format: 'es'
  },
  
  // JSON configuration
  json: {
    namedExports: true,
    stringify: false
  }
});