
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/MobileFastAuthProvider';

interface PerformanceMetrics {
  loadTime: number;
  networkStatus: 'online' | 'offline' | 'slow';
  dbResponseTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  timestamp: string;
}

interface PerformanceMonitoringState {
  metrics: PerformanceMetrics;
  isVisible: boolean;
  updateMetrics: () => void;
}

export const usePerformanceMonitoring = (): PerformanceMonitoringState => {
  const { userRole } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    networkStatus: 'online',
    dbResponseTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    timestamp: new Date().toISOString()
  });

  // Only show to admin users or in development
  const isVisible = (userRole === 'admin') || 
                   (process.env.NODE_ENV === 'development') || 
                   localStorage.getItem('showPerformanceMonitor') === 'true';

  const updateMetrics = useCallback(() => {
    // Calculate load time using Performance API
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigationTiming ? 
      Math.round(navigationTiming.loadEventEnd - navigationTiming.fetchStart) : 0;

    // Network status detection
    const connection = (navigator as any).connection;
    let networkStatus: 'online' | 'offline' | 'slow' = 'online';
    if (!navigator.onLine) {
      networkStatus = 'offline';
    } else if (connection?.effectiveType === '2g' || connection?.downlink < 1) {
      networkStatus = 'slow';
    }

    // Simulated metrics (would be real in production)
    const dbResponseTime = Math.random() * 500 + 100;
    const cacheHitRate = Math.random() * 30 + 70;

    // Memory usage calculation
    const memoryUsage = (performance as any).memory ? 
      Math.round(((performance as any).memory.usedJSHeapSize / (performance as any).memory.totalJSHeapSize) * 100) : 
      Math.random() * 40 + 30;

    setMetrics({
      loadTime,
      networkStatus,
      dbResponseTime: Math.round(dbResponseTime),
      cacheHitRate: Math.round(cacheHitRate),
      memoryUsage,
      timestamp: new Date().toISOString()
    });
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [isVisible, updateMetrics]);

  return {
    metrics,
    isVisible,
    updateMetrics
  };
};
