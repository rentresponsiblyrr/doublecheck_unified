/**
 * Unified Error Boundary System
 * Three consolidated error boundaries for all error handling needs
 */

export { GlobalErrorBoundary } from "./GlobalErrorBoundary";
export { FormErrorBoundary } from "./FormErrorBoundary";
export {
  ComponentErrorBoundary,
  withComponentErrorBoundary,
} from "./ComponentErrorBoundary";

// Re-export for backward compatibility (deprecated - use specific boundaries)
export { GlobalErrorBoundary as ErrorBoundary } from "./GlobalErrorBoundary";
