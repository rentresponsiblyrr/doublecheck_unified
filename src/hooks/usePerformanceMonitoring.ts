
import { useEffect, useRef } from "react";

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export const usePerformanceMonitoring = () => {
  const metricsRef = useRef<Map<string, PerformanceMetric>>(new Map());

  const startMeasure = (name: string) => {
    const startTime = performance.now();
    metricsRef.current.set(name, { name, startTime });
    console.log(`📊 Performance: Started measuring "${name}"`);
  };

  const endMeasure = (name: string) => {
    const metric = metricsRef.current.get(name);
    if (!metric) {
      console.warn(`⚠️ Performance: No start measurement found for "${name}"`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    const completedMetric = {
      ...metric,
      endTime,
      duration
    };

    metricsRef.current.set(name, completedMetric);
    
    console.log(`✅ Performance: "${name}" completed in ${duration.toFixed(2)}ms`);
    
    return completedMetric;
  };

  const getMetric = (name: string) => {
    return metricsRef.current.get(name);
  };

  const getAllMetrics = () => {
    return Array.from(metricsRef.current.values());
  };

  const clearMetrics = () => {
    metricsRef.current.clear();
    console.log('🧹 Performance: Cleared all metrics');
  };

  // Monitor page visibility for performance analysis
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('👁️ Performance: Page hidden - pausing measurements');
      } else {
        console.log('👁️ Performance: Page visible - resuming measurements');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    startMeasure,
    endMeasure,
    getMetric,
    getAllMetrics,
    clearMetrics
  };
};
