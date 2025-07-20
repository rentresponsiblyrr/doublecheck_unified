// Performance Monitoring Hook for STR Certified
// Tracks component renders, AI processing, and user interactions

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

interface PerformanceMetrics {
  renderTime: number;
  aiProcessingTime: number;
  interactionTime: number;
  memoryUsage: number;
  fps: number;
}

interface PerformanceAlert {
  id: string;
  type: 'slow_render' | 'ai_delay' | 'memory_warning' | 'fps_drop' | 'interaction_lag';
  severity: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  metrics: Partial<PerformanceMetrics>;
  suggestions?: string[];
}

interface UsePerformanceMonitoringOptions {
  componentName: string;
  enableAlerts?: boolean;
  thresholds?: {
    renderTime?: number;      // ms
    aiProcessingTime?: number; // ms
    interactionTime?: number;  // ms
    memoryUsage?: number;      // MB
    fps?: number;             // frames per second
  };
  sampleRate?: number; // 0-1, percentage of events to track
  onAlert?: (alert: PerformanceAlert) => void;
}

interface UsePerformanceMonitoringReturn {
  // Current metrics
  metrics: PerformanceMetrics;
  isPerformant: boolean;
  
  // Tracking methods
  trackRender: () => void;
  trackAIProcessing: (operation: string) => PerformanceTracker;
  trackInteraction: (interaction: string) => PerformanceTracker;
  
  // Alerts
  alerts: PerformanceAlert[];
  clearAlerts: () => void;
  
  // Analysis
  getReport: () => PerformanceReport;
  optimize: () => OptimizationSuggestion[];
}

export const usePerformanceMonitoring = (
  options: UsePerformanceMonitoringOptions
): UsePerformanceMonitoringReturn => {
  // State
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    aiProcessingTime: 0,
    interactionTime: 0,
    memoryUsage: 0,
    fps: 60
  });
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);

  // Refs
  const renderCount = useRef(0);
  const renderStartTime = useRef<number>(0);
  const metricsHistory = useRef<PerformanceMetrics[]>([]);
  const fpsFrames = useRef<number[]>([]);
  const lastFrameTime = useRef<number>(performance.now());
  const animationFrame = useRef<number>();

  // Default thresholds
  const thresholds = useMemo(() => ({
    renderTime: 16.67,      // 60fps target
    aiProcessingTime: 1000, // 1 second
    interactionTime: 100,   // 100ms for responsive feel
    memoryUsage: 100,       // 100MB
    fps: 30,                // Minimum acceptable FPS
    ...options.thresholds
  }), [options.thresholds]);

  // Initialize performance observer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Track render time
    renderStartTime.current = performance.now();

    // Create Performance Observer for long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > thresholds.renderTime) {
              handlePerformanceEntry(entry);
            }
          }
        });

        observer.observe({ entryTypes: ['measure', 'navigation'] });

        return () => observer.disconnect();
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }
  }, [thresholds.renderTime]);

  // Monitor FPS
  useEffect(() => {
    const measureFPS = () => {
      const now = performance.now();
      const delta = now - lastFrameTime.current;
      lastFrameTime.current = now;

      // Calculate FPS
      const fps = 1000 / delta;
      fpsFrames.current.push(fps);

      // Keep only last 60 frames
      if (fpsFrames.current.length > 60) {
        fpsFrames.current.shift();
      }

      // Update average FPS
      const avgFPS = fpsFrames.current.reduce((a, b) => a + b, 0) / fpsFrames.current.length;
      
      setMetrics(prev => {
        const updated = { ...prev, fps: Math.round(avgFPS) };
        
        // Check for FPS drops
        if (avgFPS < thresholds.fps && options.enableAlerts) {
          createAlert('fps_drop', 'critical', 
            `FPS dropped to ${Math.round(avgFPS)}`,
            { fps: avgFPS }
          );
        }
        
        return updated;
      });

      animationFrame.current = requestAnimationFrame(measureFPS);
    };

    animationFrame.current = requestAnimationFrame(measureFPS);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [thresholds.fps, options.enableAlerts]);

  // Monitor memory usage
  useEffect(() => {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      
      setMetrics(prev => {
        const updated = { ...prev, memoryUsage: Math.round(usedMB) };
        
        // Check for high memory usage
        if (usedMB > thresholds.memoryUsage && options.enableAlerts) {
          createAlert('memory_warning', 'warning',
            `High memory usage: ${Math.round(usedMB)}MB`,
            { memoryUsage: usedMB },
            [
              'Consider lazy loading components',
              'Implement virtualization for long lists',
              'Clear unused cache data'
            ]
          );
        }
        
        return updated;
      });
    };

    const interval = setInterval(checkMemory, 5000); // Check every 5 seconds
    checkMemory(); // Initial check

    return () => clearInterval(interval);
  }, [thresholds.memoryUsage, options.enableAlerts]);

  // Track component renders
  const trackRender = useCallback(() => {
    renderCount.current++;
    
    // Sample based on rate
    if (Math.random() > (options.sampleRate || 1)) return;

    const renderTime = performance.now() - renderStartTime.current;
    
    setMetrics(prev => {
      const updated = { ...prev, renderTime };
      metricsHistory.current.push(updated);
      
      // Keep only last 100 entries
      if (metricsHistory.current.length > 100) {
        metricsHistory.current.shift();
      }
      
      // Check for slow renders
      if (renderTime > thresholds.renderTime && options.enableAlerts) {
        createAlert('slow_render', 'warning',
          `Slow render detected: ${renderTime.toFixed(2)}ms`,
          { renderTime },
          [
            'Use React.memo for expensive components',
            'Optimize re-renders with useMemo/useCallback',
            'Consider code splitting'
          ]
        );
      }
      
      return updated;
    });

    // Mark for next render
    renderStartTime.current = performance.now();
  }, [options.sampleRate, options.enableAlerts, thresholds.renderTime]);

  // Track AI processing
  const trackAIProcessing = useCallback((operation: string): PerformanceTracker => {
    const startTime = performance.now();
    let completed = false;

    const tracker: PerformanceTracker = {
      complete: () => {
        if (completed) return;
        completed = true;

        const duration = performance.now() - startTime;
        
        setMetrics(prev => {
          const updated = { ...prev, aiProcessingTime: duration };
          
          // Check for slow AI processing
          if (duration > thresholds.aiProcessingTime && options.enableAlerts) {
            createAlert('ai_delay', 'error',
              `Slow AI processing for ${operation}: ${duration.toFixed(0)}ms`,
              { aiProcessingTime: duration },
              [
                'Enable response caching',
                'Use smaller model variants',
                'Implement progressive loading'
              ]
            );
          }
          
          // Log to performance timeline
          if ('performance' in window && 'measure' in performance) {
            try {
              performance.mark(`ai-${operation}-end`);
              performance.measure(
                `AI: ${operation}`,
                `ai-${operation}-start`,
                `ai-${operation}-end`
              );
            } catch (e) {
              // Marks might not exist
            }
          }
          
          return updated;
        });
      },
      
      cancel: () => {
        completed = true;
      }
    };

    // Mark start
    if ('performance' in window && 'mark' in performance) {
      performance.mark(`ai-${operation}-start`);
    }

    return tracker;
  }, [thresholds.aiProcessingTime, options.enableAlerts]);

  // Track user interactions
  const trackInteraction = useCallback((interaction: string): PerformanceTracker => {
    const startTime = performance.now();
    let completed = false;

    const tracker: PerformanceTracker = {
      complete: () => {
        if (completed) return;
        completed = true;

        const duration = performance.now() - startTime;
        
        setMetrics(prev => {
          const updated = { ...prev, interactionTime: duration };
          
          // Check for laggy interactions
          if (duration > thresholds.interactionTime && options.enableAlerts) {
            createAlert('interaction_lag', 'warning',
              `Slow interaction "${interaction}": ${duration.toFixed(0)}ms`,
              { interactionTime: duration },
              [
                'Debounce expensive operations',
                'Use optimistic updates',
                'Move heavy computation to Web Workers'
              ]
            );
          }
          
          // Log interaction
          logInteraction(interaction, duration);
          
          return updated;
        });
      },
      
      cancel: () => {
        completed = true;
      }
    };

    return tracker;
  }, [thresholds.interactionTime, options.enableAlerts]);

  // Create performance alert
  const createAlert = useCallback((
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    metrics: Partial<PerformanceMetrics>,
    suggestions?: string[]
  ) => {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: new Date(),
      metrics,
      suggestions
    };

    setAlerts(prev => [...prev.slice(-9), alert]); // Keep last 10 alerts
    
    // Notify callback
    options.onAlert?.(alert);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Performance Alert] ${message}`, metrics);
    }
  }, [options]);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Generate performance report
  const getReport = useCallback((): PerformanceReport => {
    const history = metricsHistory.current;
    
    if (history.length === 0) {
      return {
        componentName: options.componentName,
        renderCount: renderCount.current,
        averages: { ...metrics },
        percentiles: {
          p50: { ...metrics },
          p75: { ...metrics },
          p90: { ...metrics },
          p95: { ...metrics },
          p99: { ...metrics }
        },
        alerts: alerts.length,
        suggestions: []
      };
    }

    // Calculate averages
    const averages = history.reduce((acc, m) => {
      Object.keys(m).forEach(key => {
        acc[key] = (acc[key] || 0) + m[key as keyof PerformanceMetrics];
      });
      return acc;
    }, {} as any);

    Object.keys(averages).forEach(key => {
      averages[key] /= history.length;
    });

    // Calculate percentiles for render time
    const renderTimes = history.map(m => m.renderTime).sort((a, b) => a - b);
    const getPercentile = (p: number) => {
      const index = Math.ceil((p / 100) * renderTimes.length) - 1;
      return renderTimes[Math.max(0, index)];
    };

    const percentiles = {
      p50: { ...averages, renderTime: getPercentile(50) },
      p75: { ...averages, renderTime: getPercentile(75) },
      p90: { ...averages, renderTime: getPercentile(90) },
      p95: { ...averages, renderTime: getPercentile(95) },
      p99: { ...averages, renderTime: getPercentile(99) }
    };

    // Generate suggestions
    const suggestions = generateOptimizationSuggestions(averages, percentiles);

    return {
      componentName: options.componentName,
      renderCount: renderCount.current,
      averages,
      percentiles,
      alerts: alerts.length,
      suggestions
    };
  }, [options.componentName, metrics, alerts]);

  // Generate optimization suggestions
  const optimize = useCallback((): OptimizationSuggestion[] => {
    const report = getReport();
    return report.suggestions;
  }, [getReport]);

  // Check if performance is acceptable - stabilize by using individual metrics
  const isPerformant = useMemo(() => {
    return (
      metrics.renderTime < thresholds.renderTime &&
      metrics.aiProcessingTime < thresholds.aiProcessingTime &&
      metrics.interactionTime < thresholds.interactionTime &&
      metrics.memoryUsage < thresholds.memoryUsage &&
      metrics.fps >= thresholds.fps
    );
  }, [
    metrics.renderTime,
    metrics.aiProcessingTime, 
    metrics.interactionTime,
    metrics.memoryUsage,
    metrics.fps,
    thresholds.renderTime,
    thresholds.aiProcessingTime,
    thresholds.interactionTime, 
    thresholds.memoryUsage,
    thresholds.fps
  ]); // Individual dependencies instead of object references

  // Track initial render
  useEffect(() => {
    trackRender();
  }, [trackRender]); // Include trackRender dependency

  return {
    metrics,
    isPerformant,
    trackRender,
    trackAIProcessing,
    trackInteraction,
    alerts,
    clearAlerts,
    getReport,
    optimize
  };
};

// Performance tracker interface
interface PerformanceTracker {
  complete: () => void;
  cancel: () => void;
}

// Helper functions

function handlePerformanceEntry(entry: PerformanceEntry): void {
  // Log long tasks
  if (entry.duration > 50) {
    console.warn(`Long task detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
  }
}

function logInteraction(interaction: string, duration: number): void {
  // Log to analytics
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'timing_complete', {
      name: interaction,
      value: Math.round(duration),
      event_category: 'User Interaction'
    });
  }
}

function generateOptimizationSuggestions(
  averages: PerformanceMetrics,
  percentiles: any
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Render performance
  if (averages.renderTime > 16.67) {
    suggestions.push({
      category: 'rendering',
      priority: 'high',
      issue: `Average render time is ${averages.renderTime.toFixed(2)}ms`,
      suggestion: 'Optimize component rendering',
      actions: [
        'Use React.memo for expensive child components',
        'Move state closer to where it\'s used',
        'Use useMemo for expensive computations',
        'Consider virtualization for long lists'
      ],
      estimatedImpact: 'high'
    });
  }

  // AI performance
  if (averages.aiProcessingTime > 500) {
    suggestions.push({
      category: 'ai_processing',
      priority: 'medium',
      issue: `AI processing takes ${averages.aiProcessingTime.toFixed(0)}ms on average`,
      suggestion: 'Optimize AI operations',
      actions: [
        'Implement response caching',
        'Use progressive loading for results',
        'Consider using faster model variants',
        'Batch similar requests'
      ],
      estimatedImpact: 'medium'
    });
  }

  // Memory usage
  if (averages.memoryUsage > 50) {
    suggestions.push({
      category: 'memory',
      priority: 'medium',
      issue: `Memory usage is ${averages.memoryUsage.toFixed(0)}MB`,
      suggestion: 'Reduce memory footprint',
      actions: [
        'Implement lazy loading',
        'Clear unused data from state',
        'Use weak references for cache',
        'Optimize image sizes'
      ],
      estimatedImpact: 'medium'
    });
  }

  // FPS
  if (averages.fps < 50) {
    suggestions.push({
      category: 'animation',
      priority: 'high',
      issue: `FPS is ${averages.fps}, below smooth threshold`,
      suggestion: 'Improve animation performance',
      actions: [
        'Use CSS transforms instead of position',
        'Reduce DOM mutations during animation',
        'Use will-change CSS property',
        'Consider using Web Animations API'
      ],
      estimatedImpact: 'high'
    });
  }

  return suggestions;
}

// Hook for monitoring specific AI operations
export const useAIPerformanceMonitoring = (operationName: string) => {
  const [metrics, setMetrics] = useState<AIOperationMetrics>({
    callCount: 0,
    totalTime: 0,
    averageTime: 0,
    minTime: Infinity,
    maxTime: 0,
    errors: 0,
    cacheHits: 0,
    cacheMisses: 0
  });

  const track = useCallback(async <T,>(
    operation: () => Promise<T>,
    options?: { cached?: boolean }
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      setMetrics(prev => ({
        callCount: prev.callCount + 1,
        totalTime: prev.totalTime + duration,
        averageTime: (prev.totalTime + duration) / (prev.callCount + 1),
        minTime: Math.min(prev.minTime, duration),
        maxTime: Math.max(prev.maxTime, duration),
        errors: prev.errors,
        cacheHits: prev.cacheHits + (options?.cached ? 1 : 0),
        cacheMisses: prev.cacheMisses + (options?.cached ? 0 : 1)
      }));
      
      return result;
    } catch (error) {
      setMetrics(prev => ({
        ...prev,
        errors: prev.errors + 1
      }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setMetrics({
      callCount: 0,
      totalTime: 0,
      averageTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0
    });
  }, []);

  return { metrics, track, reset };
};

// Hook for monitoring component lifecycle
export const useComponentLifecycleMonitoring = (componentName: string) => {
  const mountTime = useRef(performance.now());
  const updateCount = useRef(0);
  const [lifecycle, setLifecycle] = useState<ComponentLifecycle>({
    mounted: true,
    mountDuration: 0,
    updates: 0,
    lastUpdateDuration: 0,
    totalUpdateTime: 0
  });

  useEffect(() => {
    // Component mounted
    const mountDuration = performance.now() - mountTime.current;
    setLifecycle(prev => ({ ...prev, mountDuration }));

    return () => {
      // Component unmounting
      const lifetime = performance.now() - mountTime.current;
      // REMOVED: console.log(`[${componentName}] Unmounting after ${lifetime.toFixed(0)}ms, ${updateCount.current} updates`);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Track updates
    const updateStart = performance.now();
    updateCount.current++;

    return () => {
      const updateDuration = performance.now() - updateStart;
      setLifecycle(prev => ({
        ...prev,
        updates: updateCount.current,
        lastUpdateDuration: updateDuration,
        totalUpdateTime: prev.totalUpdateTime + updateDuration
      }));
    };
  });

  return lifecycle;
};

// Types

interface PerformanceReport {
  componentName: string;
  renderCount: number;
  averages: PerformanceMetrics;
  percentiles: {
    p50: PerformanceMetrics;
    p75: PerformanceMetrics;
    p90: PerformanceMetrics;
    p95: PerformanceMetrics;
    p99: PerformanceMetrics;
  };
  alerts: number;
  suggestions: OptimizationSuggestion[];
}

interface OptimizationSuggestion {
  category: 'rendering' | 'ai_processing' | 'memory' | 'animation' | 'interaction';
  priority: 'low' | 'medium' | 'high';
  issue: string;
  suggestion: string;
  actions: string[];
  estimatedImpact: 'low' | 'medium' | 'high';
}

interface AIOperationMetrics {
  callCount: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  errors: number;
  cacheHits: number;
  cacheMisses: number;
}

interface ComponentLifecycle {
  mounted: boolean;
  mountDuration: number;
  updates: number;
  lastUpdateDuration: number;
  totalUpdateTime: number;
}