
console.log('🚨 MAIN.TSX STARTING - Testing environment validation');

import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

console.log('🚨 Basic imports loaded successfully');

// Test environment validation separately
console.log('🚨 Testing environment validation...');
console.log('Available env vars:', Object.keys(import.meta.env));
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');

// Enhanced Error Boundary for debugging
class DebugErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🚨 Error Boundary caught error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 Error Boundary - Full error details:', error, errorInfo);
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

// Test if the issue is with App import specifically
console.log('🚨 Testing if we can import App component...');

// Import the real App component now that basic React works
console.log('🚨 Importing real App component...');
import App from "./App.tsx";
console.log('✅ Real App component imported successfully');

// Use the real App component
let TestComponent = App;

try {
  console.log('🚨 Attempting to import Supabase client...');
  // Test if supabase import works
  import("@/integrations/supabase/client").then(() => {
    console.log('✅ Supabase client imported successfully');
  }).catch((error) => {
    console.error('❌ Supabase client import failed:', error);
  });
  
  console.log('🚨 Attempting to import SimpleAuthForm...');
  // Test if SimpleAuthForm works
  import("@/components/SimpleAuthForm").then(() => {
    console.log('✅ SimpleAuthForm imported successfully');
  }).catch((error) => {
    console.error('❌ SimpleAuthForm import failed:', error);
  });
} catch (error) {
  console.error('🚨 Import test failed:', error);
}

console.log('🚨 About to render app with error boundary');
console.log('🚨 Available environment variables:', Object.keys(import.meta.env));

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

// Wait for DOM to be ready and initialize React app
function initializeApp() {
  try {
    console.log('🚨 DOM ready, creating root element');
    console.log('🚨 Document body:', document.body);
    console.log('🚨 Document.querySelector("#root"):', document.querySelector("#root"));
    console.log('🚨 Document.getElementById("root"):', document.getElementById("root"));
    
    const rootElement = document.getElementById("root");
    console.log('🚨 Root element found:', !!rootElement);
    console.log('🚨 Root element details:', rootElement);
    
    if (!rootElement) {
      console.error('🚨 Root element not found! DOM content:');
      console.error('🚨 Body innerHTML:', document.body.innerHTML);
      throw new Error('Root element not found!');
    }
    
    const root = createRoot(rootElement);
    console.log('🚨 Root created, about to render');
    
    root.render(
      <StrictMode>
        <DebugErrorBoundary>
          <TestComponent />
        </DebugErrorBoundary>
      </StrictMode>
    );
    
    console.log('🚨 Render complete!');
  } catch (error) {
    console.error('🚨 ERROR during app initialization:', error);
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
  console.log('🚨 DOM still loading, waiting...');
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  console.log('🚨 DOM already loaded');
  initializeApp();
}
