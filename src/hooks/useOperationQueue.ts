/**
 * USE OPERATION QUEUE HOOK
 *
 * React hook for using operation queues to eliminate race conditions
 * in CRUD operations. Provides a clean API for components to queue
 * operations safely.
 *
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import { useRef, useCallback, useState, useEffect } from "react";
import {
  OperationQueue,
  OperationQueueMetrics,
} from "@/lib/operations/OperationQueue";

export interface OperationOptions {
  priority?: "high" | "normal" | "low";
  timeout?: number;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

export const useOperationQueue = (queueName?: string) => {
  const queueRef = useRef<OperationQueue>(new OperationQueue());
  const [metrics, setMetrics] = useState<OperationQueueMetrics>({
    totalOperations: 0,
    completedOperations: 0,
    failedOperations: 0,
    avgProcessingTime: 0,
    queueLength: 0,
    isProcessing: false,
  });

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(queueRef.current.getMetrics());
    };

    const interval = setInterval(updateMetrics, 1000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      queueRef.current.destroy();
    };
  }, []);

  const addOperation = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options?: OperationOptions,
    ): Promise<T> => {
      return queueRef.current.add(operation, options);
    },
    [],
  );

  const getQueueMetrics = useCallback((): OperationQueueMetrics => {
    return queueRef.current.getMetrics();
  }, []);

  const getDeadLetterQueue = useCallback(() => {
    return queueRef.current.getDeadLetterQueue();
  }, []);

  const clearDeadLetterQueue = useCallback(() => {
    queueRef.current.clearDeadLetterQueue();
  }, []);

  const pauseQueue = useCallback(() => {
    queueRef.current.pause();
  }, []);

  const resumeQueue = useCallback(() => {
    queueRef.current.resume();
  }, []);

  const clearQueue = useCallback(() => {
    queueRef.current.clear();
  }, []);

  return {
    addOperation,
    metrics,
    getQueueMetrics,
    getDeadLetterQueue,
    clearDeadLetterQueue,
    pauseQueue,
    resumeQueue,
    clearQueue,
    isProcessing: metrics.isProcessing,
    queueLength: metrics.queueLength,
  };
};
