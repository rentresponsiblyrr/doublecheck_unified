
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

interface PerformanceMeasurement {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

interface PerformanceMonitoringState {
  metrics: PerformanceMetrics;
  isVisible: boolean;
  updateMetrics: () => void;
  startMeasure: (name: string) => void;
  endMeasure: (name: string) => void;
  getAllMetrics: () => PerformanceMeasurement[];
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

  const [measurements, setMeasurements] = useState<PerformanceMeasurement[]>([]);

  // Only show to admin users or in development
  const isVisible = (userRole === 'admin') || 
                   (process.env.NODE_ENV === 'development') || 
                   localStorage.getItem('showPerformanceMonitor') === 'true';

  const startMeasure = useCallback((name: string) => {
    const measurement: PerformanceMeasurement = {
      name,
      startTime: performance.now()
    };
    
    setMeasurements(prev => {
      const filtered = prev.filter(m => m.name !== name);
      return [...filtered, measurement];
    });
    
    console.log(`⏱️ Started measuring: ${name}`);
  }, []);

  const endMeasure = useCallback((name: string) => {
    const endTime = performance.now();
    
    setMeasurements(prev => {
      return prev.map(measurement => {
        if (measurement.name === name && !measurement.endTime) {
          const duration = endTime - measurement.startTime;
          console.log(`✅ Completed measuring: ${name} - ${duration.toFixed(2)}ms`);
          return {
            ...measurement,
            endTime,
            duration
          };
        }
        return measurement;
      });
    });
  }, []);

  const getAllMetrics = useCallback(() => {
    return measurements.filter(m => m.duration !== undefined);
  }, [measurements]);

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
    updateMetrics,
    startMeasure,
    endMeasure,
    getAllMetrics
  };
};
