module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:4173',
        'http://localhost:4173/inspection',
        'http://localhost:4173/admin',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        // PWA requirements
        'is-on-https': 'off', // Local development
        'uses-http2': 'off',   // Local development
        
        // Core Web Vitals (Netflix/Meta standards)
        'largest-contentful-paint': ['error', { minScore: 0.8, maxNumericValue: 2500 }],
        'first-input-delay': ['error', { minScore: 0.8, maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { minScore: 0.8, maxNumericValue: 0.1 }],
        
        // PWA specific
        'installable-manifest': 'error',
        'service-worker': 'error',
        'works-offline': 'error',
        'viewport': 'error',
        'content-width': 'error',
        
        // Performance requirements
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        
        // Construction site optimization
        'efficient-animated-content': 'warn',
        'uses-optimized-images': 'warn',
        'uses-webp-images': 'warn',
        
        // Accessibility for construction workers
        'color-contrast': 'error',
        'button-name': 'error',
        'link-name': 'error',
        'tap-targets': 'error',
        
        // Mobile optimization
        'uses-responsive-images': 'warn',
        'offscreen-images': 'warn',
        'render-blocking-resources': 'warn',
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-results',
    },
    server: {
      port: 9009,
      storage: './lighthouse-server-storage'
    }
  }
};