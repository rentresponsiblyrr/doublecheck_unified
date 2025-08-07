/**
 * Error Recovery Service - Production-Grade Error Handling
 * Provides automatic recovery strategies and graceful degradation
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'cache' | 'queue' | 'ignore';
  maxAttempts?: number;
  delayMs?: number;
  fallbackValue?: any;
}

export interface ErrorContext {
  operation: string;
  component?: string;
  userId?: string;
  data?: any;
  timestamp: Date;
}

export interface RecoverableError extends Error {
  code: string;
  recoverable: boolean;
  strategy?: RecoveryStrategy;
  context?: ErrorContext;
}

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private retryQueue: Map<string, { 
    fn: () => Promise<any>; 
    attempts: number; 
    maxAttempts: number;
    delayMs: number;
  }> = new Map();

  private readonly ERROR_STRATEGIES: Record<string, RecoveryStrategy> = {
    // Network errors - retry with exponential backoff
    'NETWORK_ERROR': { type: 'retry', maxAttempts: 3, delayMs: 1000 },
    'TIMEOUT_ERROR': { type: 'retry', maxAttempts: 2, delayMs: 2000 },
    'RATE_LIMIT_ERROR': { type: 'retry', maxAttempts: 5, delayMs: 5000 },
    
    // Database errors - queue for later
    'DATABASE_CONNECTION_ERROR': { type: 'queue', maxAttempts: 3 },
    'TRANSACTION_CONFLICT': { type: 'retry', maxAttempts: 2, delayMs: 500 },
    
    // Auth errors - fallback to re-auth
    'AUTH_TOKEN_EXPIRED': { type: 'fallback' },
    'UNAUTHORIZED': { type: 'fallback' },
    
    // Data errors - use cache or defaults
    'DATA_NOT_FOUND': { type: 'cache' },
    'INVALID_DATA': { type: 'fallback', fallbackValue: null },
    
    // Critical errors - log and ignore
    'UNRECOVERABLE': { type: 'ignore' }
  };

  private constructor() {
    this.startRetryProcessor();
  }

  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  /**
   * Main error handler with recovery
   */
  async handleError(error: any, context: ErrorContext): Promise<any> {
    const recoverableError = this.categorizeError(error, context);
    
    logger.error('Error occurred', {
      code: recoverableError.code,
      message: recoverableError.message,
      recoverable: recoverableError.recoverable,
      context
    });

    if (!recoverableError.recoverable) {
      throw recoverableError;
    }

    const strategy = recoverableError.strategy || this.ERROR_STRATEGIES[recoverableError.code];
    
    if (!strategy) {
      throw recoverableError;
    }

    return this.executeRecoveryStrategy(strategy, recoverableError, context);
  }

  /**
   * Execute recovery strategy
   */
  private async executeRecoveryStrategy(
    strategy: RecoveryStrategy,
    error: RecoverableError,
    context: ErrorContext
  ): Promise<any> {
    switch (strategy.type) {
      case 'retry':
        return this.retryWithBackoff(
          () => this.retryOperation(context),
          strategy.maxAttempts || 3,
          strategy.delayMs || 1000
        );

      case 'fallback':
        return this.executeFallback(error, context, strategy.fallbackValue);

      case 'cache':
        return this.retrieveFromCache(context);

      case 'queue':
        return this.queueForLater(context);

      case 'ignore':
        logger.warn('Ignoring unrecoverable error', { error, context });
        return null;

      default:
        throw error;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxAttempts) {
          const delay = initialDelay * Math.pow(2, attempt - 1);
          logger.info(`Retrying operation (attempt ${attempt}/${maxAttempts})`, {
            delay,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Execute fallback operation
   */
  private async executeFallback(
    error: RecoverableError,
    context: ErrorContext,
    fallbackValue?: any
  ): Promise<any> {
    logger.info('Executing fallback strategy', { error: error.code, context });

    // Specific fallbacks based on operation
    switch (context.operation) {
      case 'fetch_property':
        return this.getFallbackProperty(context.data?.propertyId);

      case 'upload_photo':
        return this.queuePhotoUpload(context.data);

      case 'update_checklist':
        return this.cacheChecklistUpdate(context.data);

      case 'auth_refresh':
        return this.refreshAuth();

      default:
        return fallbackValue !== undefined ? fallbackValue : null;
    }
  }

  /**
   * Retrieve from cache
   */
  private async retrieveFromCache(context: ErrorContext): Promise<any> {
    const cacheKey = this.getCacheKey(context);
    
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        logger.info('Retrieved from cache', { key: cacheKey });
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.error('Cache retrieval failed', error);
    }

    return null;
  }

  /**
   * Queue operation for later retry
   */
  private async queueForLater(context: ErrorContext): Promise<any> {
    const queueId = `${context.operation}_${Date.now()}`;
    
    this.retryQueue.set(queueId, {
      fn: () => this.retryOperation(context),
      attempts: 0,
      maxAttempts: 3,
      delayMs: 5000
    });

    logger.info('Operation queued for retry', { queueId, context });
    
    return { queued: true, queueId };
  }

  /**
   * Retry original operation
   */
  private async retryOperation(context: ErrorContext): Promise<any> {
    switch (context.operation) {
      case 'fetch_property':
        return this.retryFetchProperty(context.data?.propertyId);

      case 'upload_photo':
        return this.retryPhotoUpload(context.data);

      case 'update_checklist':
        return this.retryChecklistUpdate(context.data);

      case 'create_inspection':
        return this.retryCreateInspection(context.data);

      default:
        throw new Error(`Unknown operation: ${context.operation}`);
    }
  }

  /**
   * Categorize error and determine if recoverable
   */
  private categorizeError(error: any, context: ErrorContext): RecoverableError {
    const err = error as RecoverableError;
    
    // Already categorized
    if (err.code && err.recoverable !== undefined) {
      return err;
    }

    // Network errors
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return {
        ...error,
        code: 'NETWORK_ERROR',
        recoverable: true,
        context
      };
    }

    // Timeout errors
    if (error.message?.includes('timeout')) {
      return {
        ...error,
        code: 'TIMEOUT_ERROR',
        recoverable: true,
        context
      };
    }

    // Rate limit errors
    if (error.status === 429 || error.message?.includes('rate limit')) {
      return {
        ...error,
        code: 'RATE_LIMIT_ERROR',
        recoverable: true,
        context
      };
    }

    // Auth errors
    if (error.status === 401 || error.message?.includes('unauthorized')) {
      return {
        ...error,
        code: 'UNAUTHORIZED',
        recoverable: true,
        context
      };
    }

    // Database errors
    if (error.code?.startsWith('PGRST') || error.code?.startsWith('22')) {
      return {
        ...error,
        code: 'DATABASE_ERROR',
        recoverable: error.code !== '23505', // Unique violation is not recoverable
        context
      };
    }

    // Default to unrecoverable
    return {
      ...error,
      code: 'UNKNOWN_ERROR',
      recoverable: false,
      context
    };
  }

  /**
   * Specific retry operations
   */
  private async retryFetchProperty(propertyId: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (error) throw error;
    return data;
  }

  private async retryPhotoUpload(data: any) {
    const { file, path } = data;
    const { data: uploadData, error } = await supabase.storage
      .from('inspection-photos')
      .upload(path, file);

    if (error) throw error;
    return uploadData;
  }

  private async retryChecklistUpdate(data: any) {
    const { id, updates } = data;
    const { data: updateData, error } = await supabase
      .from('checklist_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updateData;
  }

  private async retryCreateInspection(data: any) {
    const { data: inspection, error } = await supabase
      .from('inspections')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return inspection;
  }

  /**
   * Fallback operations
   */
  private getFallbackProperty(propertyId: string) {
    // Return minimal property data from cache or defaults
    const cached = localStorage.getItem(`property_${propertyId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    return {
      id: propertyId,
      name: 'Property (Offline)',
      address: 'Address unavailable',
      status: 'unknown'
    };
  }

  private queuePhotoUpload(data: any) {
    // Store photo locally for later upload
    const queueKey = `photo_queue_${Date.now()}`;
    localStorage.setItem(queueKey, JSON.stringify(data));
    
    return {
      queued: true,
      localId: queueKey,
      message: 'Photo will be uploaded when connection is restored'
    };
  }

  private cacheChecklistUpdate(data: any) {
    // Cache update locally
    const cacheKey = `checklist_${data.id}`;
    localStorage.setItem(cacheKey, JSON.stringify(data));
    
    return {
      cached: true,
      localId: cacheKey,
      message: 'Update saved locally'
    };
  }

  private async refreshAuth() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return data;
    } catch (error) {
      // Force re-login
      logger.error('Auth refresh failed', error);
      return { requiresLogin: true };
    }
  }

  /**
   * Process retry queue
   */
  private startRetryProcessor() {
    setInterval(async () => {
      for (const [id, item] of this.retryQueue.entries()) {
        if (item.attempts >= item.maxAttempts) {
          this.retryQueue.delete(id);
          continue;
        }

        try {
          await item.fn();
          this.retryQueue.delete(id);
          logger.info('Retry successful', { id });
        } catch (error) {
          item.attempts++;
          logger.warn('Retry failed', { id, attempts: item.attempts });
        }

        await this.sleep(item.delayMs);
      }
    }, 10000); // Process every 10 seconds
  }

  /**
   * Utility functions
   */
  private getCacheKey(context: ErrorContext): string {
    return `cache_${context.operation}_${JSON.stringify(context.data || {})}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get recovery metrics
   */
  getMetrics() {
    return {
      queueSize: this.retryQueue.size,
      queuedOperations: Array.from(this.retryQueue.keys())
    };
  }

  /**
   * Clear retry queue
   */
  clearQueue() {
    this.retryQueue.clear();
    logger.info('Retry queue cleared');
  }
}

// Export singleton instance
export const errorRecovery = ErrorRecoveryService.getInstance();

// Export helper function for wrapping operations
export async function withErrorRecovery<T>(
  operation: () => Promise<T>,
  context: ErrorContext
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    return errorRecovery.handleError(error, context);
  }
}