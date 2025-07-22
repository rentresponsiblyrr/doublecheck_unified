/**
 * OPERATION QUEUE - RACE CONDITION ELIMINATION
 * 
 * Prevents race conditions in CRUD operations by queueing operations
 * and processing them sequentially. This ensures data integrity and
 * eliminates concurrent modification issues.
 * 
 * FEATURES:
 * - Sequential operation processing
 * - Automatic retry with exponential backoff
 * - Operation prioritization
 * - Dead letter queue for failed operations
 * - Performance monitoring and metrics
 * 
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import { logger } from '@/utils/logger';

export interface QueuedOperation<T = any> {
  id: string;
  operation: () => Promise<T>;
  priority: 'high' | 'normal' | 'low';
  retryCount: number;
  maxRetries: number;
  timeout: number;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
  metadata?: Record<string, unknown>;
}

export interface OperationQueueMetrics {
  totalOperations: number;
  completedOperations: number;
  failedOperations: number;
  avgProcessingTime: number;
  queueLength: number;
  isProcessing: boolean;
}

export class OperationQueue {
  private queue: QueuedOperation[] = [];
  private processing = false;
  private metrics: OperationQueueMetrics = {
    totalOperations: 0,
    completedOperations: 0,
    failedOperations: 0,
    avgProcessingTime: 0,
    queueLength: 0,
    isProcessing: false
  };
  private deadLetterQueue: Array<{ operation: QueuedOperation; error: Error; failedAt: number }> = [];
  private readonly maxQueueSize = 1000;
  private readonly maxDeadLetterSize = 100;

  /**
   * Add operation to queue with priority handling
   */
  async add<T>(
    operation: () => Promise<T>,
    options: {
      priority?: 'high' | 'normal' | 'low';
      timeout?: number;
      maxRetries?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<T> {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('Operation queue is full. Please try again later.');
    }

    return new Promise<T>((resolve, reject) => {
      const queuedOp: QueuedOperation<T> = {
        id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operation,
        priority: options.priority || 'normal',
        retryCount: 0,
        maxRetries: options.maxRetries || 3,
        timeout: options.timeout || 30000,
        onSuccess: resolve,
        onError: reject,
        metadata: options.metadata || {}
      };

      // Insert with priority ordering
      this.insertWithPriority(queuedOp);
      this.metrics.totalOperations++;
      this.metrics.queueLength = this.queue.length;

      logger.debug('Operation queued', {
        operationId: queuedOp.id,
        priority: queuedOp.priority,
        queueLength: this.queue.length
      });

      // Start processing if not already processing
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Insert operation in queue based on priority
   */
  private insertWithPriority(operation: QueuedOperation): void {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const insertIndex = this.queue.findIndex(
      op => priorityOrder[op.priority] > priorityOrder[operation.priority]
    );

    if (insertIndex === -1) {
      this.queue.push(operation);
    } else {
      this.queue.splice(insertIndex, 0, operation);
    }
  }

  /**
   * Process operations sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;
    this.metrics.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const operation = this.queue.shift()!;
        await this.processOperation(operation);
        this.metrics.queueLength = this.queue.length;
      }
    } catch (error) {
      logger.error('Queue processing failed', { error });
    } finally {
      this.processing = false;
      this.metrics.isProcessing = false;
    }
  }

  /**
   * Process individual operation with retry logic
   */
  private async processOperation(operation: QueuedOperation): Promise<void> {
    const startTime = Date.now();

    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timeout after ${operation.timeout}ms`)), operation.timeout)
      );

      // Race operation against timeout
      const result = await Promise.race([
        operation.operation(),
        timeoutPromise
      ]);

      // Operation succeeded
      const duration = Date.now() - startTime;
      this.updateMetrics(duration, true);
      
      if (operation.onSuccess) {
        operation.onSuccess(result);
      }

      logger.debug('Operation completed successfully', {
        operationId: operation.id,
        duration,
        retryCount: operation.retryCount
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error as Error;

      logger.warn('Operation failed', {
        operationId: operation.id,
        error: err.message,
        retryCount: operation.retryCount,
        maxRetries: operation.maxRetries,
        duration
      });

      // Retry logic
      if (operation.retryCount < operation.maxRetries) {
        operation.retryCount++;
        
        // Exponential backoff
        const backoffDelay = Math.min(1000 * Math.pow(2, operation.retryCount), 10000);
        
        setTimeout(() => {
          this.insertWithPriority(operation);
          this.metrics.queueLength = this.queue.length;
          
          // Continue processing if queue stopped
          if (!this.processing) {
            this.processQueue();
          }
        }, backoffDelay);

        logger.info('Operation scheduled for retry', {
          operationId: operation.id,
          retryCount: operation.retryCount,
          backoffDelay
        });

      } else {
        // Max retries exceeded - move to dead letter queue
        this.moveToDeadLetter(operation, err);
        this.updateMetrics(duration, false);

        if (operation.onError) {
          operation.onError(err);
        }
      }
    }
  }

  /**
   * Move failed operation to dead letter queue
   */
  private moveToDeadLetter(operation: QueuedOperation, error: Error): void {
    // Keep dead letter queue size bounded
    if (this.deadLetterQueue.length >= this.maxDeadLetterSize) {
      this.deadLetterQueue.shift(); // Remove oldest
    }

    this.deadLetterQueue.push({
      operation,
      error,
      failedAt: Date.now()
    });

    logger.error('Operation moved to dead letter queue', {
      operationId: operation.id,
      error: error.message,
      metadata: operation.metadata
    });
  }

  /**
   * Update processing metrics
   */
  private updateMetrics(duration: number, success: boolean): void {
    if (success) {
      this.metrics.completedOperations++;
    } else {
      this.metrics.failedOperations++;
    }

    // Update average processing time
    const totalCompleted = this.metrics.completedOperations;
    const currentAvg = this.metrics.avgProcessingTime;
    
    this.metrics.avgProcessingTime = totalCompleted === 1 
      ? duration 
      : (currentAvg * (totalCompleted - 1) + duration) / totalCompleted;
  }

  /**
   * Get current queue metrics
   */
  getMetrics(): OperationQueueMetrics {
    return { ...this.metrics };
  }

  /**
   * Get dead letter queue for analysis
   */
  getDeadLetterQueue(): Array<{ operation: QueuedOperation; error: Error; failedAt: number }> {
    return [...this.deadLetterQueue];
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is processing
   */
  isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Pause queue processing
   */
  pause(): void {
    this.processing = true; // Prevents new processing
  }

  /**
   * Resume queue processing
   */
  resume(): void {
    if (this.queue.length > 0) {
      this.processing = false;
      this.processQueue();
    }
  }

  /**
   * Clear all queued operations
   */
  clear(): void {
    const cancelledOps = this.queue.length;
    
    // Reject all pending operations
    this.queue.forEach(op => {
      if (op.onError) {
        op.onError(new Error('Operation cancelled - queue cleared'));
      }
    });
    
    this.queue = [];
    this.metrics.queueLength = 0;

    logger.info('Operation queue cleared', { cancelledOperations: cancelledOps });
  }

  /**
   * Destroy queue and cleanup resources
   */
  destroy(): void {
    this.clear();
    this.clearDeadLetterQueue();
    this.processing = false;
    this.metrics.isProcessing = false;
  }
}

// Singleton pattern for global operation queue
export const globalOperationQueue = new OperationQueue();