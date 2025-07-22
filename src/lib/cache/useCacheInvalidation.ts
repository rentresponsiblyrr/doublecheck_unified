/**
 * CACHE INVALIDATION HOOKS - REACT INTEGRATION
 * 
 * React hooks for intelligent cache invalidation with automatic dependency
 * tracking, optimistic updates, and conflict resolution. Provides seamless
 * integration with React components and state management.
 * 
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  intelligentCacheInvalidation,
  InvalidationEvent,
  CacheInvalidationRule,
  CacheInvalidationStats 
} from './IntelligentCacheInvalidation';
import { logger } from '@/utils/logger';

/**
 * Hook for triggering cache invalidation
 */
export const useCacheInvalidation = (options: {
  autoInvalidate?: boolean;
  dependencies?: string[];
  componentName?: string;
} = {}) => {
  const { autoInvalidate = false, dependencies = [], componentName = 'unknown' } = options;
  const componentRef = useRef(`${componentName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Invalidate cache by pattern or key
  const invalidate = useCallback(async (
    pattern: string | RegExp,
    reason?: string,
    options: {
      strategy?: 'immediate' | 'lazy' | 'batched';
      cascade?: boolean;
      priority?: 'low' | 'medium' | 'high' | 'critical';
    } = {}
  ) => {
    try {
      await intelligentCacheInvalidation.invalidateByPattern(
        pattern,
        reason || `Invalidated from ${componentName}`,
        options
      );
      
      logger.debug('Cache invalidation triggered from hook', {
        component: componentName,
        pattern: pattern.toString(),
        reason,
      });
    } catch (error) {
      logger.error('Cache invalidation failed in hook', {
        component: componentName,
        pattern: pattern.toString(),
        error,
      });
      throw error;
    }
  }, [componentName]);

  // Invalidate related data
  const invalidateRelated = useCallback(async (
    dataKey: string,
    operation: 'create' | 'update' | 'delete',
    options: {
      userId?: string;
      reason?: string;
      maxCascadeLevel?: number;
    } = {}
  ) => {
    try {
      await intelligentCacheInvalidation.invalidateRelated(
        dataKey,
        operation,
        {
          ...options,
          reason: options.reason || `${operation} operation from ${componentName}`,
        }
      );
    } catch (error) {
      logger.error('Related cache invalidation failed', {
        component: componentName,
        dataKey,
        operation,
        error,
      });
      throw error;
    }
  }, [componentName]);

  // Batch invalidate multiple keys
  const batchInvalidate = useCallback(async (
    keys: string[],
    reason?: string,
    options: {
      batchSize?: number;
      delay?: number;
      strategy?: string;
    } = {}
  ) => {
    try {
      await intelligentCacheInvalidation.batchInvalidate(
        keys,
        reason || `Batch invalidation from ${componentName}`,
        options
      );
    } catch (error) {
      logger.error('Batch cache invalidation failed', {
        component: componentName,
        keys: keys.length,
        error,
      });
      throw error;
    }
  }, [componentName]);

  // Schedule invalidation
  const scheduleInvalidation = useCallback((
    pattern: string | RegExp,
    delay: number,
    reason?: string,
    options: {
      recurring?: boolean;
      interval?: number;
    } = {}
  ): string => {
    return intelligentCacheInvalidation.scheduleInvalidation(
      pattern,
      delay,
      reason || `Scheduled from ${componentName}`,
      options
    );
  }, [componentName]);

  // Cancel scheduled invalidation
  const cancelScheduledInvalidation = useCallback((scheduleId: string): boolean => {
    return intelligentCacheInvalidation.cancelScheduledInvalidation(scheduleId);
  }, []);

  // Auto-invalidate on component unmount if enabled
  useEffect(() => {
    if (!autoInvalidate || dependencies.length === 0) return;

    return () => {
      // Invalidate component-specific cache on unmount
      dependencies.forEach(async (dep) => {
        try {
          await invalidate(dep, 'Component unmount cleanup');
        } catch (error) {
          logger.warn('Auto-invalidation on unmount failed', {
            component: componentName,
            dependency: dep,
            error,
          });
        }
      });
    };
  }, [autoInvalidate, dependencies, invalidate, componentName]);

  return {
    invalidate,
    invalidateRelated,
    batchInvalidate,
    scheduleInvalidation,
    cancelScheduledInvalidation,
    componentId: componentRef.current,
  };
};

/**
 * Hook for monitoring cache invalidation statistics
 */
export const useCacheInvalidationStats = (updateInterval: number = 5000) => {
  const [stats, setStats] = useState<CacheInvalidationStats>({
    totalInvalidations: 0,
    successfulInvalidations: 0,
    failedInvalidations: 0,
    averageInvalidationTime: 0,
    cacheHitRateImpact: 0,
    lastInvalidationTime: 0,
    rulesExecuted: 0,
    dependencyChainsResolved: 0,
  });

  useEffect(() => {
    const updateStats = () => {
      setStats(intelligentCacheInvalidation.getStats());
    };

    // Initial update
    updateStats();

    // Set up interval
    const interval = setInterval(updateStats, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  const successRate = stats.totalInvalidations > 0 
    ? (stats.successfulInvalidations / stats.totalInvalidations) * 100 
    : 100;

  const failureRate = stats.totalInvalidations > 0 
    ? (stats.failedInvalidations / stats.totalInvalidations) * 100 
    : 0;

  return {
    ...stats,
    successRate,
    failureRate,
    isHealthy: successRate > 95 && stats.averageInvalidationTime < 100,
  };
};

/**
 * Hook for managing cache invalidation rules
 */
export const useCacheInvalidationRules = () => {
  const registerRule = useCallback((rule: CacheInvalidationRule) => {
    try {
      intelligentCacheInvalidation.registerRule(rule);
      logger.debug('Cache invalidation rule registered via hook', {
        ruleId: rule.id,
        pattern: rule.pattern.toString(),
      });
    } catch (error) {
      logger.error('Failed to register cache invalidation rule', { rule, error });
      throw error;
    }
  }, []);

  const createRule = useCallback((
    id: string,
    name: string,
    pattern: string | RegExp,
    options: {
      dependencies?: string[];
      strategy?: 'immediate' | 'lazy' | 'batched' | 'scheduled';
      priority?: 'low' | 'medium' | 'high' | 'critical';
      conditions?: {
        dataTypes?: string[];
        operations?: ('create' | 'update' | 'delete')[];
        userRoles?: string[];
        timeWindow?: number;
        conflictResolution?: 'merge' | 'replace' | 'skip';
      };
      tags?: string[];
      description?: string;
    } = {}
  ): CacheInvalidationRule => {
    const rule: CacheInvalidationRule = {
      id,
      name,
      pattern,
      dependencies: options.dependencies || [],
      strategy: options.strategy || 'immediate',
      priority: options.priority || 'medium',
      conditions: options.conditions,
      metadata: {
        tags: options.tags || [],
        description: options.description || '',
        createdBy: 'hook',
        lastModified: Date.now(),
      },
    };

    registerRule(rule);
    return rule;
  }, [registerRule]);

  return {
    registerRule,
    createRule,
  };
};

/**
 * Hook for optimistic cache updates with automatic rollback
 */
export const useOptimisticCacheUpdate = <T>(
  cacheKey: string,
  options: {
    rollbackDelay?: number;
    maxRetries?: number;
    conflictResolution?: 'merge' | 'replace' | 'skip';
  } = {}
) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const originalValueRef = useRef<T | null>(null);
  const { invalidateRelated } = useCacheInvalidation();

  const optimisticUpdate = useCallback(async (
    newValue: T,
    serverUpdate: () => Promise<T>,
    options: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error, rollbackValue: T | null) => void;
      onRollback?: (originalValue: T | null) => void;
    } = {}
  ) => {
    setIsUpdating(true);
    setError(null);

    try {
      // Store original value for potential rollback
      originalValueRef.current = await getCachedValue<T>(cacheKey);

      // Apply optimistic update
      await setCachedValue(cacheKey, newValue);

      try {
        // Attempt server update
        const serverResult = await serverUpdate();

        // Update cache with server result
        await setCachedValue(cacheKey, serverResult);

        // Invalidate related cache entries
        await invalidateRelated(cacheKey, 'update', {
          reason: 'Optimistic update confirmed',
        });

        options.onSuccess?.(serverResult);
        
        return serverResult;
      } catch (serverError) {
        // Server update failed, rollback to original value
        if (originalValueRef.current !== null) {
          await setCachedValue(cacheKey, originalValueRef.current);
          options.onRollback?.(originalValueRef.current);
        }

        const error = serverError as Error;
        setError(error);
        options.onError?.(error, originalValueRef.current);
        
        throw error;
      }
    } finally {
      setIsUpdating(false);
    }
  }, [cacheKey, invalidateRelated]);

  return {
    optimisticUpdate,
    isUpdating,
    error,
    clearError: useCallback(() => setError(null), []),
  };
};

/**
 * Hook for cache dependency tracking
 */
export const useCacheDependencyTracking = (
  primaryKey: string,
  dependencies: string[] = []
) => {
  const { invalidateRelated } = useCacheInvalidation();

  const trackDependency = useCallback((dependencyKey: string) => {
    if (!dependencies.includes(dependencyKey)) {
      dependencies.push(dependencyKey);
    }
  }, [dependencies]);

  const invalidateWithDependencies = useCallback(async (
    operation: 'create' | 'update' | 'delete',
    options: {
      reason?: string;
      cascade?: boolean;
    } = {}
  ) => {
    try {
      // Invalidate primary key
      await invalidateRelated(primaryKey, operation, {
        reason: options.reason,
        maxCascadeLevel: options.cascade ? 5 : 1,
      });

      // Invalidate dependencies
      for (const dep of dependencies) {
        await invalidateRelated(dep, operation, {
          reason: `Dependency of ${primaryKey}`,
          maxCascadeLevel: 1,
        });
      }
    } catch (error) {
      logger.error('Dependency invalidation failed', {
        primaryKey,
        dependencies,
        operation,
        error,
      });
      throw error;
    }
  }, [primaryKey, dependencies, invalidateRelated]);

  return {
    trackDependency,
    invalidateWithDependencies,
    dependencies,
  };
};

/**
 * Helper functions for cache operations
 */
async function getCachedValue<T>(key: string): Promise<T | null> {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    logger.warn('Failed to get cached value', { key, error });
    return null;
  }
}

async function setCachedValue<T>(key: string, value: T): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.warn('Failed to set cached value', { key, error });
  }
}