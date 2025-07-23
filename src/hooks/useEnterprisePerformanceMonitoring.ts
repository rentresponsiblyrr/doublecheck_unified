/**
 * Enhanced Performance Monitoring Hook
 * Provides easy access to enterprise-grade performance monitoring functions
 */

import { useCallback } from "react";
import {
  performanceMonitor,
  trackMetric,
  trackInteraction,
  trackError,
  measureAsync,
  startTimer,
} from "@/lib/monitoring/performance-monitor";
import type { UserInteraction } from "@/lib/monitoring/performance-monitor";

export function useEnterprisePerformanceMonitoring() {
  const trackPageView = useCallback((pageName: string) => {
    trackInteraction({
      type: "navigation",
      element: "page_view",
      metadata: {
        page: pageName,
        timestamp: Date.now(),
        referrer: document.referrer,
      },
    });
  }, []);

  const trackUserAction = useCallback(
    (action: string, element?: string, metadata?: Record<string, unknown>) => {
      trackInteraction({
        type: "click",
        element: element || action,
        metadata: {
          action,
          ...metadata,
        },
      });
    },
    [],
  );

  const trackFormSubmission = useCallback(
    (formName: string, success: boolean, errorMessage?: string) => {
      trackInteraction({
        type: "form_submit",
        element: formName,
        metadata: {
          success,
          errorMessage,
        },
      });
    },
    [],
  );

  const trackFileUpload = useCallback(
    (
      fileName: string,
      fileSize: number,
      uploadTime: number,
      success: boolean,
    ) => {
      performanceMonitor.trackFileUpload(
        fileName,
        fileSize,
        uploadTime,
        success,
      );
    },
    [],
  );

  const trackAIRequest = useCallback(
    (
      operation: string,
      duration: number,
      success: boolean,
      tokens?: number,
      cost?: number,
    ) => {
      performanceMonitor.trackAIRequest(
        operation,
        duration,
        success,
        tokens,
        cost,
      );
    },
    [],
  );

  const trackDatabaseOperation = useCallback(
    (
      operation: string,
      table: string,
      duration: number,
      success: boolean,
      rowsAffected?: number,
    ) => {
      performanceMonitor.trackDatabaseOperation(
        operation,
        table,
        duration,
        success,
        rowsAffected,
      );
    },
    [],
  );

  const measureOperation = useCallback(
    async <T>(
      operationName: string,
      operation: () => Promise<T>,
    ): Promise<T> => {
      return measureAsync(operationName, operation);
    },
    [],
  );

  const createTimer = useCallback((name: string) => {
    return startTimer(name);
  }, []);

  const trackCustomMetric = useCallback(
    (
      name: string,
      value: number,
      unit?: string,
      context?: Record<string, unknown>,
    ) => {
      trackMetric(name, value, unit, context);
    },
    [],
  );

  const trackApplicationError = useCallback(
    (error: Error, context?: Record<string, unknown>) => {
      trackError(error, context);
    },
    [],
  );

  return {
    trackPageView,
    trackUserAction,
    trackFormSubmission,
    trackFileUpload,
    trackAIRequest,
    trackDatabaseOperation,
    measureOperation,
    createTimer,
    trackCustomMetric,
    trackApplicationError,
  };
}
