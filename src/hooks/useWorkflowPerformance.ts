/**
 * Workflow Performance Monitoring Hook
 * Tracks and optimizes inspector workflow performance
 */

import { useEffect, useCallback, useState } from 'react';
import { performanceTracker } from '../lib/monitoring/performance-tracker';

interface WorkflowMetrics {
  propertyCreationDuration: number;
  scrapingDuration: number;
  selectionDuration: number;
  inspectionStartDuration: number;
  totalWorkflowDuration: number;
  userDropoffStage?: string;
}

interface WorkflowPerformanceHook {
  startWorkflowTiming: (stage: string) => void;
  endWorkflowTiming: (stage: string) => void;
  trackUserAction: (action: string, metadata?: Record<string, any>) => void;
  getWorkflowMetrics: () => WorkflowMetrics;
  optimizeNextStep: (currentStage: string) => Promise<void>;
}

export const useWorkflowPerformance = (): WorkflowPerformanceHook => {
  const [startTimes, setStartTimes] = useState<Map<string, number>>(new Map());
  const [metrics, setMetrics] = useState<WorkflowMetrics>({
    propertyCreationDuration: 0,
    scrapingDuration: 0,
    selectionDuration: 0,
    inspectionStartDuration: 0,
    totalWorkflowDuration: 0
  });

  const startWorkflowTiming = useCallback((stage: string) => {
    const startTime = performance.now();
    setStartTimes(prev => new Map(prev).set(stage, startTime));
    
    performanceTracker.trackMetric(`workflow_${stage}_start`, startTime, 'ms', {
      category: 'workflow',
      stage,
      userAgent: navigator.userAgent
    });
  }, []);

  const endWorkflowTiming = useCallback((stage: string) => {
    const endTime = performance.now();
    const startTime = startTimes.get(stage);
    
    if (startTime) {
      const duration = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        [`${stage}Duration`]: duration,
        totalWorkflowDuration: prev.totalWorkflowDuration + duration
      }));
      
      performanceTracker.trackMetric(`workflow_${stage}_duration`, duration, 'ms', {
        category: 'workflow',
        stage,
        performance: duration < 2000 ? 'excellent' : duration < 5000 ? 'good' : 'needs_improvement'
      });
    }
  }, [startTimes]);

  const trackUserAction = useCallback((action: string, metadata = {}) => {
    performanceTracker.trackMetric('workflow_user_action', Date.now(), 'timestamp', {
      category: 'user_behavior',
      action,
      ...metadata
    });
  }, []);

  const optimizeNextStep = useCallback(async (currentStage: string) => {
    // Preload next stage resources based on current stage
    switch (currentStage) {
      case 'property_creation':
        // Preload scraper resources
        await import('../lib/scrapers/robust-scraping-service');
        break;
      case 'scraping':
        // Preload property selection components
        await import('../pages/PropertySelection');
        break;
      case 'selection':
        // Preload inspection creation resources
        await import('../services/inspectionCreationService');
        break;
    }
  }, []);

  const getWorkflowMetrics = useCallback(() => metrics, [metrics]);

  return {
    startWorkflowTiming,
    endWorkflowTiming,
    trackUserAction,
    getWorkflowMetrics,
    optimizeNextStep
  };
};
