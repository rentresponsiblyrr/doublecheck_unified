/**
 * Error Context Creation Utility
 * Creates comprehensive error context for debugging and monitoring
 */

export interface ErrorContext {
  componentName?: string;
  userId?: string;
  sessionId?: string;
  route?: string;
  timestamp: string;
  userAgent: string;
  viewport: { width: number; height: number };
  networkStatus: 'online' | 'offline';
  memoryUsage?: number;
}

export const createErrorContext = (componentName?: string): ErrorContext => {
  return {
    componentName: componentName || 'UnknownComponent',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    networkStatus: navigator.onLine ? 'online' : 'offline',
    route: window.location.pathname,
    memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
  };
};