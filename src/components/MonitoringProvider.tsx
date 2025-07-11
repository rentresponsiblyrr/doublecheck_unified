/**
 * Monitoring Provider
 * Initializes and manages performance monitoring throughout the app
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';
import { createDefaultRateLimiters } from '@/lib/resilience/rate-limiter';
import { createDefaultCircuitBreakers } from '@/lib/resilience/circuit-breaker';

interface MonitoringContextType {
  isInitialized: boolean;
}

const MonitoringContext = createContext<MonitoringContextType>({
  isInitialized: false,
});

export const useMonitoring = () => {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
};

interface MonitoringProviderProps {
  children: ReactNode;
}

export const MonitoringProvider: React.FC<MonitoringProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.trackResourceUsage();
    
    // Initialize rate limiters
    createDefaultRateLimiters();
    
    // Initialize circuit breakers
    createDefaultCircuitBreakers();
    
    // Track app initialization
    performanceMonitor.trackMetric('app.initialization', performance.now(), 'ms', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
    });

    // Set up periodic resource tracking
    const resourceInterval = setInterval(() => {
      performanceMonitor.trackResourceUsage();
    }, 30000); // Every 30 seconds

    // Set up periodic flush
    const flushInterval = setInterval(() => {
      performanceMonitor.flush();
    }, 60000); // Every minute

    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      clearInterval(resourceInterval);
      clearInterval(flushInterval);
      performanceMonitor.destroy();
    };
  }, []);

  return (
    <MonitoringContext.Provider value={{ isInitialized }}>
      {children}
    </MonitoringContext.Provider>
  );
};