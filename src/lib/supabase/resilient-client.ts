/**
 * RESILIENT SUPABASE CLIENT - PRODUCTION-HARDENED DATABASE CONNECTION
 * 
 * Addresses critical database connectivity issues:
 * - Enhanced error handling for RLS policy failures
 * - Proper authentication error propagation  
 * - Connection resilience and retry logic
 * - Detailed logging for debugging database issues
 * 
 * @author STR Certified Engineering Team
 * @version 1.0 - Database Connectivity Fix
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface DatabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
  status?: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000
};

/**
 * Enhanced Supabase client with comprehensive error handling and resilience
 */
class ResilientSupabaseClient {
  private client: SupabaseClient;
  private retryConfig: RetryConfig;

  constructor() {
    this.retryConfig = DEFAULT_RETRY_CONFIG;
    this.client = this.createEnhancedClient();
    logger.info('Resilient Supabase client initialized', {
      url: SUPABASE_URL,
      hasApiKey: !!SUPABASE_ANON_KEY,
      timestamp: new Date().toISOString()
    });
  }

  private createEnhancedClient(): SupabaseClient {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
    }

    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache'
        }
      },
      realtime: {
        timeout: 30000,
        heartbeatIntervalMs: 30000
      },
      db: {
        schema: 'public'
      }
    });

    // Enhance the client with better error handling
    this.enhanceClientErrorHandling(client);
    return client;
  }

  private enhanceClientErrorHandling(client: SupabaseClient): void {
    // Store original request method
    const originalRequest = (client as any).rest.request;

    // Override with enhanced error handling
    (client as any).rest.request = async (...args: any[]) => {
      const endpoint = args[0];
      const retryCount = args[3]?.retryCount || 0;

      try {
        const response = await originalRequest.apply((client as any).rest, args);
        
        // Reset retry count on success
        if (retryCount > 0) {
          logger.info('Database request succeeded after retries', {
            endpoint,
            retryCount,
            timestamp: new Date().toISOString()
          });
        }

        return response;
      } catch (error: any) {
        const enhancedError = this.enhanceError(error, endpoint);
        
        // Determine if request should be retried
        if (this.shouldRetry(error) && retryCount < this.retryConfig.maxRetries) {
          logger.warn('Database request failed, retrying', {
            endpoint,
            error: enhancedError.message,
            retryCount: retryCount + 1,
            maxRetries: this.retryConfig.maxRetries
          });

          // Calculate delay with exponential backoff
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, retryCount),
            this.retryConfig.maxDelay
          );

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, delay));

          // Retry with incremented count
          const retryArgs = [...args];
          retryArgs[3] = { ...retryArgs[3], retryCount: retryCount + 1 };
          return (client as any).rest.request(...retryArgs);
        }

        // Log final error
        logger.error('Database request failed (final)', {
          endpoint,
          error: enhancedError.message,
          code: enhancedError.code,
          details: enhancedError.details,
          hint: enhancedError.hint,
          status: enhancedError.status,
          retryCount,
          timestamp: new Date().toISOString()
        });

        throw enhancedError;
      }
    };
  }

  private enhanceError(error: any, endpoint?: string): DatabaseError {
    const baseError: DatabaseError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Unknown database error',
      details: error.details,
      hint: error.hint,
      status: error.status
    };

    // Enhanced error messages based on common patterns
    switch (error.code) {
      case '42501': // permission denied
        return {
          ...baseError,
          message: `Permission denied for database operation. This is likely a Row Level Security (RLS) policy issue. Please check that proper policies exist for authenticated users on the target table. Original error: ${error.message}`,
          hint: 'Check RLS policies in Supabase dashboard or run: SELECT * FROM pg_policies WHERE schemaname = \'public\';'
        };

      case '42P01': // table or view does not exist
        return {
          ...baseError,
          message: `Table or view does not exist: ${error.message}. Check that the table name is correct and migrations have been applied.`,
          hint: 'Verify table exists in Supabase Table Editor'
        };

      case '23505': // unique constraint violation
        return {
          ...baseError,
          message: `Duplicate entry: ${error.message}. A record with this unique value already exists.`,
          hint: 'Check for existing records before inserting'
        };

      case '23503': // foreign key violation
        return {
          ...baseError,
          message: `Foreign key constraint violation: ${error.message}. Referenced record may not exist.`,
          hint: 'Verify that referenced records exist in related tables'
        };

      default:
        if (error.message?.includes('Invalid API key')) {
          return {
            ...baseError,
            message: 'Database authentication failed: API key is invalid or expired. Check VITE_SUPABASE_ANON_KEY configuration.',
            hint: 'Verify API key in Supabase project settings'
          };
        }

        if (error.message?.includes('JWT')) {
          return {
            ...baseError,
            message: 'Authentication token issue: JWT token is invalid or expired. User may need to sign in again.',
            hint: 'Check user authentication state and token validity'
          };
        }

        if (error.message?.includes('Network')) {
          return {
            ...baseError,
            message: 'Network connectivity issue: Unable to reach Supabase servers. Check internet connection and Supabase status.',
            hint: 'Verify network connection and check status.supabase.com'
          };
        }

        return baseError;
    }
  }

  private shouldRetry(error: any): boolean {
    // Don't retry on authentication/authorization errors
    if (error.code === '42501' || error.status === 401 || error.status === 403) {
      return false;
    }

    // Don't retry on client errors (4xx)
    if (error.status >= 400 && error.status < 500) {
      return false;
    }

    // Retry on server errors (5xx) or network issues
    if (error.status >= 500 || error.message?.includes('Network') || error.message?.includes('fetch')) {
      return true;
    }

    return false;
  }

  /**
   * Get the enhanced Supabase client
   */
  getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      logger.info('Testing database connectivity');
      
      // Try a simple query that should work with basic permissions
      const { data, error } = await this.client
        .from('properties')
        .select('property_id')
        .limit(1);

      if (error) {
        return {
          success: false,
          error: error.message,
          details: error
        };
      }

      logger.info('Database connectivity test passed', { recordCount: data?.length });
      return { success: true };
    } catch (error: any) {
      logger.error('Database connectivity test failed', { error: error.message });
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Get current authentication status
   */
  async getAuthStatus(): Promise<{
    authenticated: boolean;
    user?: any;
    session?: any;
    error?: string;
  }> {
    try {
      const { data: { user, session }, error } = await this.client.auth.getUser();
      
      return {
        authenticated: !!user && !!session,
        user,
        session,
        error: error?.message
      };
    } catch (error: any) {
      return {
        authenticated: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const resilientClient = new ResilientSupabaseClient();

// Export the enhanced client
export const supabase = resilientClient.getClient();

// Export utility functions
export const testDatabaseConnection = () => resilientClient.testConnection();
export const getDatabaseAuthStatus = () => resilientClient.getAuthStatus();
export { ResilientSupabaseClient };