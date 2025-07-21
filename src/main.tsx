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
    console.error('App initialization failed:', error);
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