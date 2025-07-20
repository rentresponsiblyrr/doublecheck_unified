
// REMOVED: Main.tsx startup logging to prevent infinite render loops
// // REMOVED: console.log('🚨 MAIN.TSX STARTING - Testing environment validation');

import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { log } from "@/lib/logging/enterprise-logger";

// Enterprise system initialization
import { enterpriseInitializer } from "@/lib/initialization/enterprise-initialization";
import type { EnterpriseConfig } from "@/lib/initialization/enterprise-initialization";

// REMOVED: Basic imports logging to prevent infinite render loops
// // REMOVED: console.log('🚨 Basic imports loaded successfully');

// REMOVED: Environment validation logging to prevent infinite render loops
// // REMOVED: console.log('🚨 Testing environment validation...');
// // REMOVED: console.log('Available env vars:', Object.keys(import.meta.env));
// // REMOVED: console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING');
// // REMOVED: console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');

// REMOVED: Environment validation testing logging to prevent infinite render loops
// // REMOVED: console.log('🔍 Testing environment validation with error handling...');

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

// Enhanced Error Boundary for debugging
class DebugErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    log.error('Error Boundary caught error in main.tsx', error, {
      component: 'DebugErrorBoundary',
      boundary: 'main'
    }, 'ERROR_BOUNDARY_TRIGGERED');
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    log.error('Error Boundary - Full error details', error, {
      component: 'DebugErrorBoundary',
      boundary: 'main',
      componentStack: errorInfo.componentStack
    }, 'ERROR_BOUNDARY_DETAILS');
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace', fontSize: '14px' }}>
          <h1>🚨 ERROR BOUNDARY CAUGHT AN ERROR</h1>
          <h2>Error: {this.state.error?.message}</h2>
          <details style={{ marginTop: '20px' }}>
            <summary>Stack Trace</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {this.state.error?.stack}
            </pre>
          </details>
          <details style={{ marginTop: '20px' }}>
            <summary>Component Stack</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

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
// // REMOVED: console.log('🚨 About to render app with error boundary');
// // REMOVED: console.log('🚨 Available environment variables:', Object.keys(import.meta.env));

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
    log.info('Enterprise systems initialized successfully', {
      component: 'main',
      environment: enterpriseConfig.environment,
      serviceName: enterpriseConfig.serviceName,
    }, 'ENTERPRISE_INITIALIZATION_SUCCESS');
  } catch (error) {
    // Fall back to basic logging if enterprise init fails
    // REMOVED: console.error('Enterprise initialization failed, continuing with basic logging:', error);
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
        <DebugErrorBoundary>
          <TestComponent />
        </DebugErrorBoundary>
      </StrictMode>
    );
    
    if (import.meta.env.DEV) {
      log.info('STR Certified app initialized successfully', {
        component: 'main',
        action: 'initializeApp',
        environment: 'development'
      }, 'APP_INITIALIZED');
    }
    
    // DISABLED: Console clearing was causing infinite reload loops
    // if (import.meta.env.DEV) {
    //   setTimeout(() => {
    //     console.clear();
    //     // REMOVED: console.log('🚨 Console cleared - infinite logging fixed');
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
      // REMOVED: console.error('Failed to initialize app:', error);
    });
  });
} else {
  initializeApp().catch(error => {
    // REMOVED: console.error('Failed to initialize app:', error);
  });
}
