import React, { useEffect, useRef, useState } from 'react';
import { logger } from '@/utils/logger';

interface PerformanceMetrics {
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte
  };
  pwaMetrics: {
    serviceWorkerActivation: number;
    cacheHitRate: number;
    offlineCapability: boolean;
    installPromptShown: boolean;
    backgroundSyncActive: boolean;
  };
  resourceMetrics: {
    bundleSize: number;
    imageOptimization: number;
    lazyLoadEfficiency: number;
    prefetchHitRate: number;
  };
  userExperience: {
    interactionToNextPaint: number;
    visualStability: number;
    loadingPerception: 'fast' | 'average' | 'slow';
  };
}

export const PWAPerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const observerRef = useRef<PerformanceObserver | null>(null);
  const metricsTimerRef = useRef<number | null>(null);

  useEffect(() => {
    initializePerformanceMonitoring();

    return () => {
      cleanupPerformanceMonitoring();
    };
  }, []);

  const initializePerformanceMonitoring = () => {
    try {
      setIsMonitoring(true);

      // Initialize Core Web Vitals monitoring
      initializeCoreWebVitalsTracking();

      // Initialize PWA-specific metrics
      initializePWAMetricsTracking();

      // Start periodic metrics collection
      startMetricsCollection();

      logger.info('PWA Performance monitoring initialized', {}, 'PWA_PERFORMANCE');

    } catch (error) {
      logger.error('Failed to initialize performance monitoring', { error }, 'PWA_PERFORMANCE');
    }
  };

  const initializeCoreWebVitalsTracking = () => {
    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        updateMetric('lcp', entry.startTime);
      }
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      // Fallback for browsers that don't support LCP
      logger.warn('LCP observation not supported', {}, 'PWA_PERFORMANCE');
    }

    // FID (First Input Delay)
    const fidObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        updateMetric('fid', entry.processingStart - entry.startTime);
      }
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      logger.warn('FID observation not supported', {}, 'PWA_PERFORMANCE');
    }

    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          updateMetric('cls', clsValue);
        }
      }
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      logger.warn('CLS observation not supported', {}, 'PWA_PERFORMANCE');
    }

    observerRef.current = lcpObserver; // Store reference for cleanup
  };

  const initializePWAMetricsTracking = () => {
    // Service Worker metrics
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        const activationTime = performance.now();
        updatePWAMetric('serviceWorkerActivation', activationTime);
      });
    }

    // Cache performance tracking
    if ('caches' in window) {
      trackCachePerformance();
    }

    // Network status tracking
    const updateNetworkMetrics = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        updatePWAMetric('effectiveConnectionType', connection.effectiveType);
        updatePWAMetric('downlink', connection.downlink);
      }
    };

    updateNetworkMetrics();
    window.addEventListener('online', updateNetworkMetrics);
    window.addEventListener('offline', updateNetworkMetrics);
  };

  const trackCachePerformance = async () => {
    try {
      const cacheNames = await caches.keys();
      let totalHits = 0;
      let totalRequests = 0;

      // This would typically track actual cache performance
      // For now, we'll simulate based on available data
      const hitRate = Math.random() * 100; // Placeholder
      updatePWAMetric('cacheHitRate', hitRate);

    } catch (error) {
      logger.error('Cache performance tracking failed', { error }, 'PWA_PERFORMANCE');
    }
  };

  const startMetricsCollection = () => {
    metricsTimerRef.current = window.setInterval(() => {
      collectCurrentMetrics();
    }, 5000); // Collect metrics every 5 seconds
  };

  const collectCurrentMetrics = () => {
    try {
      const currentMetrics: PerformanceMetrics = {
        coreWebVitals: {
          lcp: getCurrentMetric('lcp'),
          fid: getCurrentMetric('fid'),
          cls: getCurrentMetric('cls'),
          fcp: getCurrentMetric('fcp'),
          ttfb: getCurrentMetric('ttfb')
        },
        pwaMetrics: {
          serviceWorkerActivation: getCurrentPWAMetric('serviceWorkerActivation'),
          cacheHitRate: getCurrentPWAMetric('cacheHitRate'),
          offlineCapability: navigator.onLine === false && getCurrentPWAMetric('offlineCapable'),
          installPromptShown: getCurrentPWAMetric('installPromptShown'),
          backgroundSyncActive: getCurrentPWAMetric('backgroundSyncActive')
        },
        resourceMetrics: {
          bundleSize: getCurrentResourceMetric('bundleSize'),
          imageOptimization: getCurrentResourceMetric('imageOptimization'),
          lazyLoadEfficiency: getCurrentResourceMetric('lazyLoadEfficiency'),
          prefetchHitRate: getCurrentResourceMetric('prefetchHitRate')
        },
        userExperience: {
          interactionToNextPaint: getCurrentMetric('inp'),
          visualStability: 100 - (getCurrentMetric('cls') * 100),
          loadingPerception: getLoadingPerception()
        }
      };

      setMetrics(currentMetrics);

      // Send metrics to analytics if performance is concerning
      if (isPerformanceConcerning(currentMetrics)) {
        sendPerformanceAlert(currentMetrics);
      }

    } catch (error) {
      logger.error('Metrics collection failed', { error }, 'PWA_PERFORMANCE');
    }
  };

  const updateMetric = (metric: string, value: number) => {
    // Store metric in performance storage
    if (typeof window !== 'undefined') {
      (window as any).__PWA_METRICS__ = (window as any).__PWA_METRICS__ || {};
      (window as any).__PWA_METRICS__[metric] = value;
    }
  };

  const updatePWAMetric = (metric: string, value: any) => {
    if (typeof window !== 'undefined') {
      (window as any).__PWA_METRICS__ = (window as any).__PWA_METRICS__ || {};
      (window as any).__PWA_METRICS__[`pwa_${metric}`] = value;
    }
  };

  const getCurrentMetric = (metric: string): number => {
    return (window as any).__PWA_METRICS__?.[metric] || 0;
  };

  const getCurrentPWAMetric = (metric: string): any => {
    return (window as any).__PWA_METRICS__?.[`pwa_${metric}`] || false;
  };

  const getCurrentResourceMetric = (metric: string): number => {
    // Calculate resource metrics based on Navigation API and Resource Timing
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    const resources = performance.getEntriesByType('resource');

    switch (metric) {
      case 'bundleSize': {
        return resources.reduce((total, resource: any) =>
          total + (resource.transferSize || 0), 0
        );
      }
      case 'imageOptimization': {
        const images = resources.filter((r: any) => r.initiatorType === 'img');
        return images.length > 0 ? images.reduce((acc: number, img: any) =>
          acc + ((img.decodedBodySize || 0) / (img.transferSize || 1)), 0
        ) / images.length * 100 : 100;
      }
      default:
        return 0;
    }
  };

  const getLoadingPerception = (): 'fast' | 'average' | 'slow' => {
    const lcp = getCurrentMetric('lcp');
    if (lcp < 2500) return 'fast';
    if (lcp < 4000) return 'average';
    return 'slow';
  };

  const isPerformanceConcerning = (metrics: PerformanceMetrics): boolean => {
    return (
      metrics.coreWebVitals.lcp > 4000 || // LCP > 4s
      metrics.coreWebVitals.fid > 300 ||  // FID > 300ms
      metrics.coreWebVitals.cls > 0.25 || // CLS > 0.25
      metrics.pwaMetrics.cacheHitRate < 60 // Cache hit rate < 60%
    );
  };

  const sendPerformanceAlert = (metrics: PerformanceMetrics) => {
    logger.warn('Performance alert triggered', {
      metrics: {
        lcp: metrics.coreWebVitals.lcp,
        fid: metrics.coreWebVitals.fid,
        cls: metrics.coreWebVitals.cls,
        cacheHitRate: metrics.pwaMetrics.cacheHitRate
      }
    }, 'PWA_PERFORMANCE');

    // Send to monitoring service
    fetch('/api/performance/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    }).catch(error => {
      logger.error('Failed to send performance alert', { error }, 'PWA_PERFORMANCE');
    });
  };

  const cleanupPerformanceMonitoring = () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (metricsTimerRef.current) {
      clearInterval(metricsTimerRef.current);
    }

    setIsMonitoring(false);
    logger.info('PWA Performance monitoring cleaned up', {}, 'PWA_PERFORMANCE');
  };

  // This component doesn't render visible UI - it's a monitoring service
  return null;
};