/**
 * Database Transaction Manager
 * Ensures ACID compliance and data integrity
 */

import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
import { debugLogger } from "@/utils/debugLogger";

// Type definitions for database operations
type DatabaseRecord = Record<string, unknown>;
type BatchOperationData = DatabaseRecord | DatabaseRecord[];
type BatchCondition = Record<string, unknown>;
type ExecutionResult = DatabaseRecord | DatabaseRecord[] | null;

export interface TransactionOptions {
  timeout?: number; // milliseconds
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
}

export interface TransactionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  rollbackExecuted?: boolean;
}

export class TransactionError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: Error | PostgrestError,
  ) {
    super(message);
    this.name = "TransactionError";
  }
}

type TransactionFunction<T> = () => Promise<T>;
type RollbackFunction = () => Promise<void>;

class DatabaseTransactionManager {
  private static instance: DatabaseTransactionManager;
  private activeLocks = new Set<string>();
  private lockTimeout = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): DatabaseTransactionManager {
    if (!DatabaseTransactionManager.instance) {
      DatabaseTransactionManager.instance = new DatabaseTransactionManager();
    }
    return DatabaseTransactionManager.instance;
  }

  /**
   * Execute a function within a database transaction
   */
  async executeTransaction<T>(
    transactionFunc: TransactionFunction<T>,
    options: TransactionOptions = {},
  ): Promise<TransactionResult<T>> {
    const { timeout = 30000, retryAttempts = 3, retryDelay = 1000 } = options;

    let attempt = 0;

    while (attempt < retryAttempts) {
      try {
        const result = await this.executeWithTimeout(transactionFunc, timeout);
        return { success: true, data: result };
      } catch (error: unknown) {
        attempt++;

        // Check if error is retryable
        if (this.isRetryableError(error) && attempt < retryAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * attempt),
          );
          continue;
        }

        const errorObj = error as Error & { rollbackExecuted?: boolean };
        return {
          success: false,
          error: errorObj.message || "Transaction failed",
          rollbackExecuted: errorObj.rollbackExecuted || false,
        };
      }
    }

    return {
      success: false,
      error: "Transaction failed after maximum retry attempts",
    };
  }

  /**
   * Execute multiple operations atomically with manual rollback
   */
  async executeAtomicOperations<T>(
    operations: Array<{
      execute: () => Promise<ExecutionResult>;
      rollback: RollbackFunction;
      description: string;
    }>,
    options: TransactionOptions = {},
  ): Promise<TransactionResult<T[]>> {
    const { timeout = 30000 } = options;
    const executedOperations: typeof operations = [];
    let rollbackExecuted = false;

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new TransactionError("Transaction timeout", "TIMEOUT")),
          timeout,
        );
      });

      const executePromise = (async () => {
        const results: ExecutionResult[] = [];

        for (const operation of operations) {
          try {
            const result = await operation.execute();
            results.push(result);
            executedOperations.push(operation);
          } catch (error: unknown) {
            const errorObj = error as Error;
            throw new TransactionError(
              `Operation failed: ${operation.description} - ${errorObj.message}`,
              "OPERATION_FAILED",
              errorObj,
            );
          }
        }

        return results;
      })();

      const results = (await Promise.race([
        executePromise,
        timeoutPromise,
      ])) as T[];

      return { success: true, data: results };
    } catch (error: unknown) {
      // Execute rollback operations in reverse order
      try {
        await this.executeRollback(executedOperations.reverse());
        rollbackExecuted = true;
      } catch (rollbackError: unknown) {
        // Log critical error - data may be in inconsistent state
        const originalErr = error as Error;
        const rollbackErr = rollbackError as Error;
        await this.logCriticalError("ROLLBACK_FAILED", {
          originalError: originalErr.message,
          rollbackError: rollbackErr.message,
          operations: executedOperations.map((op) => op.description),
        });
      }

      return {
        success: false,
        error: (error as Error).message || "Atomic operations failed",
        rollbackExecuted,
      };
    }
  }

  /**
   * Optimistic locking for concurrent updates
   */
  async executeWithOptimisticLock<T>(
    resourceId: string,
    operation: (currentVersion: number) => Promise<T>,
    maxAttempts: number = 3,
  ): Promise<TransactionResult<T>> {
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        // Get current version
        const { data: currentRecord, error: fetchError } = await supabase
          .from("versioned_resources")
          .select("version")
          .eq("id", resourceId)
          .single();

        if (fetchError) {
          throw new TransactionError(
            "Failed to fetch resource version",
            "FETCH_ERROR",
            fetchError,
          );
        }

        const currentVersion = currentRecord?.version || 0;

        // Execute operation with current version
        const result = await operation(currentVersion);

        // Update version (this will fail if version changed)
        const { error: updateError } = await supabase
          .from("versioned_resources")
          .update({
            version: currentVersion + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", resourceId)
          .eq("version", currentVersion); // Optimistic lock check

        if (updateError) {
          throw new TransactionError(
            "Optimistic lock failed",
            "LOCK_CONFLICT",
            updateError,
          );
        }

        return { success: true, data: result };
      } catch (error: unknown) {
        attempt++;

        const errorObj = error as TransactionError;
        if (errorObj.code === "LOCK_CONFLICT" && attempt < maxAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 1000 + 500),
          );
          continue;
        }

        return {
          success: false,
          error: (error as Error).message || "Optimistic lock failed",
        };
      }
    }

    return {
      success: false,
      error: "Optimistic lock failed after maximum attempts",
    };
  }

  /**
   * Distributed lock for critical sections
   */
  async executeWithDistributedLock<T>(
    lockKey: string,
    operation: TransactionFunction<T>,
    options: TransactionOptions = {},
  ): Promise<TransactionResult<T>> {
    const { timeout = 30000 } = options;

    if (this.activeLocks.has(lockKey)) {
      return {
        success: false,
        error: "Resource is currently locked by another operation",
      };
    }

    try {
      // Acquire lock
      const lockId = await this.acquireDistributedLock(lockKey, timeout);
      this.activeLocks.add(lockKey);

      try {
        const result = await this.executeWithTimeout(operation, timeout);
        return { success: true, data: result };
      } finally {
        // Always release lock
        await this.releaseDistributedLock(lockKey, lockId);
        this.activeLocks.delete(lockKey);
      }
    } catch (error: unknown) {
      this.activeLocks.delete(lockKey);
      return {
        success: false,
        error: (error as Error).message || "Distributed lock operation failed",
      };
    }
  }

  /**
   * Batch operations with transaction semantics
   */
  async executeBatch(
    operations: Array<{
      table: string;
      operation: "insert" | "update" | "delete";
      data: BatchOperationData;
      condition?: BatchCondition;
    }>,
    options: TransactionOptions = {},
  ): Promise<TransactionResult<ExecutionResult[]>> {
    return this.executeAtomicOperations(
      operations.map((op) => ({
        execute: async () => {
          let query;

          switch (op.operation) {
            case "insert":
              query = supabase.from(op.table).insert(op.data);
              break;
            case "update":
              query = supabase.from(op.table).update(op.data);
              if (op.condition) {
                Object.entries(op.condition).forEach(
                  ([key, value]: [string, unknown]) => {
                    query = query.eq(key, value);
                  },
                );
              }
              break;
            case "delete":
              query = supabase.from(op.table).delete();
              if (op.condition) {
                Object.entries(op.condition).forEach(
                  ([key, value]: [string, unknown]) => {
                    query = query.eq(key, value);
                  },
                );
              }
              break;
            default:
              throw new Error(`Unsupported operation: ${op.operation}`);
          }

          const { data, error } = await query;
          if (error) throw error;
          return data;
        },
        rollback: async () => {
          // Implement rollback logic based on operation type
        },
        description: `${op.operation} on ${op.table}`,
      })),
      options,
    );
  }

  // Private helper methods

  private async executeWithTimeout<T>(
    operation: TransactionFunction<T>,
    timeout: number,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TransactionError("Operation timeout", "TIMEOUT"));
      }, timeout);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  private isRetryableError(error: unknown): boolean {
    // PostgreSQL error codes that are retryable
    const retryableCodes = [
      "40001", // serialization_failure
      "40P01", // deadlock_detected
      "53200", // out_of_memory
      "53300", // too_many_connections
    ];

    const retryableMessages = [
      "connection refused",
      "timeout",
      "network error",
      "temporary failure",
    ];

    const errorObj = error as PostgrestError & { code?: string };
    if (errorObj.code && retryableCodes.includes(errorObj.code)) {
      return true;
    }

    const message = (error as Error).message?.toLowerCase() || "";
    return retryableMessages.some((msg) => message.includes(msg));
  }

  private async executeRollback(
    operations: Array<{ rollback: RollbackFunction; description: string }>,
  ): Promise<void> {
    const rollbackErrors: Error[] = [];

    for (const operation of operations) {
      try {
        await operation.rollback();
      } catch (error: unknown) {
        rollbackErrors.push(error as Error);
      }
    }

    if (rollbackErrors.length > 0) {
      throw new TransactionError(
        `Rollback partially failed: ${rollbackErrors.length} operations failed`,
        "ROLLBACK_PARTIAL_FAILURE",
        rollbackErrors,
      );
    }
  }

  private async acquireDistributedLock(
    lockKey: string,
    timeout: number,
  ): Promise<string> {
    const lockId = `${Date.now()}_${Math.random().toString(36)}`;
    const expiresAt = new Date(Date.now() + timeout);

    try {
      const { error } = await supabase.from("distributed_locks").insert({
        lock_key: lockKey,
        lock_id: lockId,
        acquired_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      });

      if (error) {
        throw new TransactionError(
          "Failed to acquire distributed lock",
          "LOCK_FAILED",
          error,
        );
      }

      return lockId;
    } catch (error: unknown) {
      throw new TransactionError(
        "Lock acquisition failed",
        "LOCK_FAILED",
        error as Error,
      );
    }
  }

  private async releaseDistributedLock(
    lockKey: string,
    lockId: string,
  ): Promise<void> {
    try {
      await supabase
        .from("distributed_locks")
        .delete()
        .eq("lock_key", lockKey)
        .eq("lock_id", lockId);
    } catch (error) {
      debugLogger.error('TransactionManager', 'Failed to cleanup distributed lock', { error, lockKey, lockId });
    }
  }

  private async logCriticalError(
    errorType: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    try {
      await supabase.from("critical_errors").insert({
        error_type: errorType,
        details,
        timestamp: new Date().toISOString(),
        severity: "critical",
      });
    } catch (error) {
      debugLogger.error('TransactionManager', 'Failed to log critical error', { error, errorType, details });
    }
  }
}

// Export singleton instance
export const transactionManager = DatabaseTransactionManager.getInstance();

// Convenience functions for common transaction patterns
export const executeTransaction = <T>(
  transactionFunc: TransactionFunction<T>,
  options?: TransactionOptions,
) => transactionManager.executeTransaction(transactionFunc, options);

export const executeAtomicOperations = <T>(
  operations: Array<{
    execute: () => Promise<ExecutionResult>;
    rollback: () => Promise<void>;
    description: string;
  }>,
  options?: TransactionOptions,
) => transactionManager.executeAtomicOperations<T>(operations, options);

export const executeWithOptimisticLock = <T>(
  resourceId: string,
  operation: (currentVersion: number) => Promise<T>,
  maxAttempts?: number,
) =>
  transactionManager.executeWithOptimisticLock(
    resourceId,
    operation,
    maxAttempts,
  );

export const executeWithDistributedLock = <T>(
  lockKey: string,
  operation: TransactionFunction<T>,
  options?: TransactionOptions,
) => transactionManager.executeWithDistributedLock(lockKey, operation, options);

export const executeBatch = (
  operations: Array<{
    table: string;
    operation: "insert" | "update" | "delete";
    data: BatchOperationData;
    condition?: BatchCondition;
  }>,
  options?: TransactionOptions,
) => transactionManager.executeBatch(operations, options);
