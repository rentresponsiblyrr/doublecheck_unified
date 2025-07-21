
// REMOVED: Main.tsx startup logging to prevent infinite render loops

import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { log } from "@/lib/logging/enterprise-logger";

// Enterprise system initialization
import { enterpriseInitializer } from "@/lib/initialization/enterprise-initialization";
import type { EnterpriseConfig } from "@/lib/initialization/enterprise-initialization";

// ACTUAL Performance monitoring integration
import { actualPerformanceMonitor } from "@/lib/monitoring/actual-performance-monitor";

// REMOVED: Basic imports logging to prevent infinite render loops

// REMOVED: Environment validation logging to prevent infinite render loops

// REMOVED: Environment validation testing logging to prevent infinite render loops

// Environment validation in development only
if (import.meta.env.DEV) {
  async function testEnvironmentValidation() {
    try {
      const { validateEnv } = await import("./utils/typeGuards.ts");
      const result = validateEnv();
      log.info('Environment validation passed', {
        component: 'main',
        action: 'validateEnvironment',
        result
      }, 'ENVIRONMENT_VALIDATION_PASSED');
      return true;
    } catch (error) {
      log.error('Environment validation failed', error as Error, {
        component: 'main',
        action: 'validateEnvironment'
      }, 'ENVIRONMENT_VALIDATION_FAILED');
      return false;
    }
  }
  
  testEnvironmentValidation();
}

// Import the new unified error boundary
import { UniversalErrorBoundary as GlobalErrorBoundary } from '@/components/error/UniversalErrorBoundary';

// Import the real App component
import App from "./App.tsx";

// Use the real App component
let TestComponent = App;

// Test imports in development
if (import.meta.env.DEV) {
  import("@/integrations/supabase/client").catch((error) => {
    log.error('Supabase client import failed', error as Error, {
      component: 'main',
      action: 'importSupabaseClient'
    }, 'SUPABASE_IMPORT_FAILED');
  });
  
  import("@/components/SimpleAuthForm").catch((error) => {
    log.error('SimpleAuthForm import failed', error as Error, {
      component: 'main',
      action: 'importSimpleAuthForm'
    }, 'SIMPLE_AUTH_FORM_IMPORT_FAILED');
  });
}

// REMOVED: App rendering logging to prevent infinite render loops

// Initialize Sentry for production error monitoring
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react').then(({ init, browserTracingIntegration }) => {
    init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.NODE_ENV,
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
      integrations: [
        browserTracingIntegration({
          // Set sampling rate for performance monitoring
          tracingOrigins: ['localhost', /^https:\/\/.*\.doublecheckverified\.com/],
        }),
      ],
      // Performance monitoring
      tracesSampleRate: 0.1,
      // Session replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      // Error filtering
      beforeSend(event, hint) {
        // Filter out known non-critical errors
        if (event.exception) {
          const error = hint.originalException;
          if (error && typeof error === 'object' && 'message' in error) {
            const message = error.message as string;
            if (message.includes('ResizeObserver loop') || 
                message.includes('Non-Error promise rejection captured')) {
              return null;
            }
          }
        }
        return event;
      },
    });
  });
}

// Initialize enterprise systems
async function initializeEnterpriseSystem() {
  const enterpriseConfig: EnterpriseConfig = {
    environment: import.meta.env.PROD ? 'production' : 'development',
    serviceName: 'str-certified-frontend',
    serviceVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    
    logging: {
      enableConsole: import.meta.env.DEV,
      enableRemote: import.meta.env.PROD,
      remoteEndpoint: import.meta.env.VITE_LOGGING_ENDPOINT,
      apiKey: import.meta.env.VITE_LOGGING_API_KEY,
      minLevel: import.meta.env.DEV ? 'DEBUG' : 'INFO',
    },
    
    tracing: {
      samplingRate: import.meta.env.DEV ? 1.0 : 0.1,
      exporterEndpoint: import.meta.env.VITE_TRACING_ENDPOINT,
      enableProfiling: import.meta.env.DEV,
    },
    
    apm: {
      provider: 'custom',
      apiKey: import.meta.env.VITE_APM_API_KEY,
      enableRUM: true,
      enableProfiling: import.meta.env.DEV,
    },
    
    errorHandling: {
      enableCircuitBreaker: true,
      maxRetries: 3,
      timeoutMs: 30000,
    },
    
    security: {
      enableOWASP: true,
      enableThreatDetection: import.meta.env.PROD,
      enableSecurityMiddleware: true,
      anomalyThreshold: import.meta.env.PROD ? 0.7 : 0.9,
      maxFailedAttempts: 5,
      lockoutDurationMs: 900000, // 15 minutes
    },
  };

  try {
    await enterpriseInitializer.initialize(enterpriseConfig);
    
    // Start ACTUAL performance monitoring system
    actualPerformanceMonitor.start();
    
    log.info('Enterprise systems initialized successfully', {
      component: 'main',
      environment: enterpriseConfig.environment,
      serviceName: enterpriseConfig.serviceName,
      performanceMonitoring: 'enabled'
    }, 'ENTERPRISE_INITIALIZATION_SUCCESS');
  } catch (error) {
    // Fall back to basic logging if enterprise init fails
    log.error('Enterprise initialization failed, starting basic performance monitoring', error as Error, {
      component: 'main',
      action: 'initializeEnterpriseSystem'
    }, 'ENTERPRISE_INIT_FALLBACK');
    
    // Still start performance monitoring even if enterprise init fails
    try {
      actualPerformanceMonitor.start();
      log.info('Performance monitoring started successfully', {
        component: 'main',
        mode: 'fallback'
      }, 'PERFORMANCE_MONITORING_FALLBACK_SUCCESS');
    } catch (perfError) {
      log.error('Performance monitoring failed to start', perfError as Error, {
        component: 'main',
        action: 'performanceMonitoringFallback'
      }, 'PERFORMANCE_MONITORING_FALLBACK_FAILED');
    }
  }
}

// Wait for DOM to be ready and initialize React app
async function initializeApp() {
  try {
    // Initialize enterprise systems first
    await initializeEnterpriseSystem();
    const rootElement = document.getElementById("root");
    
    if (!rootElement) {
      log.fatal('Root element not found', undefined, {
        component: 'main',
        action: 'initializeApp',
        domContent: document.body.innerHTML
      }, 'ROOT_ELEMENT_NOT_FOUND');
      throw new Error('Root element not found!');
    }
    
    const root = createRoot(rootElement);
    
    root.render(
      <StrictMode>
        <GlobalErrorBoundary 
          applicationName="STR Certified"
          enableBugReport={true}
          onError={(error, errorInfo) => {
            log.error('Global Error Boundary caught error', error, {
              component: 'GlobalErrorBoundary',
              boundary: 'main',
              componentStack: errorInfo.componentStack
            }, 'GLOBAL_ERROR_BOUNDARY_TRIGGERED');
          }}
        >
          <TestComponent />
        </GlobalErrorBoundary>
      </StrictMode>
    );
    
    if (import.meta.env.DEV) {
      log.info('STR Certified app initialized successfully', {
        component: 'main',
        action: 'initializeApp',
        environment: 'development'
      }, 'APP_INITIALIZED');
    }
    
    // Setup cleanup for performance monitoring
    window.addEventListener('beforeunload', () => {
      try {
        actualPerformanceMonitor.stop();
        log.info('Performance monitoring stopped on app unload', {
          component: 'main',
          action: 'cleanup'
        }, 'PERFORMANCE_MONITORING_CLEANUP');
      } catch (error) {
        // Silent cleanup - don't log errors during unload
      }
    });
    
    // DISABLED: Console clearing was causing infinite reload loops
    // if (import.meta.env.DEV) {
    //   setTimeout(() => {
    //   }, 2000);
    // }
  } catch (error) {
    log.fatal('ERROR during app initialization', error as Error, {
      component: 'main',
      action: 'initializeApp'
    }, 'APP_INITIALIZATION_ERROR');
    document.body.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h1>🚨 CRITICAL ERROR</h1>
        <p>Error: ${error.message}</p>
        <pre>${error.stack}</pre>
      </div>
    `;
  }
}

// Check if DOM is already loaded or wait for it
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch(error => {
    });
  });
} else {
  initializeApp().catch(error => {
  });
}
