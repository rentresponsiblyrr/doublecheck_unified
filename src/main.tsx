
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { validateEnv } from "./utils/typeGuards.ts";

// Validate environment configuration
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error);
  if (import.meta.env.PROD) {
    // In production, show user-friendly error
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #ef4444;">
        <h1>Configuration Error</h1>
        <p>The application is not properly configured. Please contact support.</p>
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          Error: ${error.message}
        </p>
      </div>
    `;
    throw error;
  }
}

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

// Initialize the React app with proper error boundaries
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
