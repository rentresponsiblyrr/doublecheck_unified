import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Import the error boundary
import { UniversalErrorBoundary as GlobalErrorBoundary } from '@/components/error/UniversalErrorBoundary';

// Import the App component
import App from "./App.tsx";

// Simple initialization function
async function initializeApp() {
  try {
    const rootElement = document.getElementById("root");
    
    if (!rootElement) {
      throw new Error('Root element not found!');
    }
    
    const root = createRoot(rootElement);
    
    root.render(
      <StrictMode>
        <GlobalErrorBoundary 
          level="global" 
          fallbackStrategy="redirect"
        >
          <App />
        </GlobalErrorBoundary>
      </StrictMode>
    );
    
  } catch (error) {
    // Production-grade error handling for app initialization
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Send to error tracking service (production only)
    if (import.meta.env.PROD) {
      // Would integrate with Sentry, DataDog, etc.
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'critical',
          message: 'App initialization failed',
          error: errorMessage,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      }).catch(() => {
        // Fail silently if error tracking is down
      });
    }
    
    // Only log in development
    if (import.meta.env.DEV) {
      console.error('App initialization failed:', error);
    }
    document.body.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial;">
        <h1>🚨 Application Error</h1>
        <p>Failed to initialize the application.</p>
        <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        <button onclick="window.location.reload()">Reload Page</button>
      </div>
    `;
  }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}