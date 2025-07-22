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
      preset: 'lighthouse:no-pwa', // More lenient preset initially
      assertions: {
        // PWA requirements - relaxed for initial setup
        'is-on-https': 'off', // Local development
        'uses-http2': 'off',   // Local development
        
        // Core Web Vitals (Netflix/Meta standards) - warning level initially
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }], // Relaxed
        'first-input-delay': ['warn', { maxNumericValue: 200 }], // Relaxed
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.25 }], // Relaxed
        
        // PWA specific - warnings only initially
        'installable-manifest': 'warn',
        'service-worker': 'warn', 
        'works-offline': 'warn',
        'viewport': 'warn',
        'content-width': 'warn',
        
        // Performance requirements - relaxed
        'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'speed-index': ['warn', { maxNumericValue: 5000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 500 }],
        
        // Accessibility - warnings initially
        'color-contrast': 'warn',
        'button-name': 'warn',
        'link-name': 'warn',
        'tap-targets': 'warn',
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