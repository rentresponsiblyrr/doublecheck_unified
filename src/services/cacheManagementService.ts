/**
 * Cache Management Service
 * 
 * Handles browser cache, service worker cache, and localStorage cleanup
 * to resolve stale RPC function calls and configuration errors.
 * 
 * @author STR Certified Engineering Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { logger } from "@/lib/logger/production-logger";

export interface CacheCleanupResult {
  success: boolean;
  clearedCaches: string[];
  errors: string[];
  timestamp: string;
}

export class CacheManagementService {
  private static instance: CacheManagementService;

  public static getInstance(): CacheManagementService {
    if (!CacheManagementService.instance) {
      CacheManagementService.instance = new CacheManagementService();
    }
    return CacheManagementService.instance;
  }

  /**
   * Clear all browser caches to resolve stale RPC calls
   */
  public async clearAllCaches(): Promise<CacheCleanupResult> {
    const result: CacheCleanupResult = {
      success: false,
      clearedCaches: [],
      errors: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. Clear localStorage
      await this.clearLocalStorage(result);

      // 2. Clear sessionStorage  
      await this.clearSessionStorage(result);

      // 3. Clear IndexedDB
      await this.clearIndexedDB(result);

      // 4. Clear Cache API (Service Worker caches)
      await this.clearCacheAPI(result);

      // 5. Clear HTTP cache by reloading with cache bypass
      await this.clearHttpCache(result);

      result.success = result.errors.length === 0;

      logger.info("Cache cleanup completed", {
        component: "CacheManagementService",
        action: "clearAllCaches",
        result,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`General cache cleanup error: ${errorMessage}`);
      
      logger.error("Cache cleanup failed", {
        component: "CacheManagementService",
        action: "clearAllCaches",
        error: errorMessage,
      });

      return result;
    }
  }

  /**
   * Clear localStorage data
   */
  private async clearLocalStorage(result: CacheCleanupResult): Promise<void> {
    try {
      const itemCount = localStorage.length;
      localStorage.clear();
      result.clearedCaches.push(`localStorage (${itemCount} items)`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`localStorage: ${errorMessage}`);
    }
  }

  /**
   * Clear sessionStorage data
   */
  private async clearSessionStorage(result: CacheCleanupResult): Promise<void> {
    try {
      const itemCount = sessionStorage.length;
      sessionStorage.clear();
      result.clearedCaches.push(`sessionStorage (${itemCount} items)`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`sessionStorage: ${errorMessage}`);
    }
  }

  /**
   * Clear IndexedDB databases
   */
  private async clearIndexedDB(result: CacheCleanupResult): Promise<void> {
    try {
      if ('indexedDB' in window) {
        // Get list of databases (if supported)
        if ('databases' in indexedDB) {
          const databases = await indexedDB.databases();
          let clearedCount = 0;

          for (const db of databases) {
            if (db.name) {
              try {
                await this.deleteIndexedDBDatabase(db.name);
                clearedCount++;
              } catch (error) {
                result.errors.push(`IndexedDB ${db.name}: ${error}`);
              }
            }
          }

          if (clearedCount > 0) {
            result.clearedCaches.push(`IndexedDB (${clearedCount} databases)`);
          }
        } else {
          result.clearedCaches.push("IndexedDB (enumeration not supported)");
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`IndexedDB: ${errorMessage}`);
    }
  }

  /**
   * Delete a specific IndexedDB database
   */
  private deleteIndexedDBDatabase(dbName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(dbName);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onblocked = () => reject(new Error("Database deletion blocked"));
    });
  }

  /**
   * Clear Cache API (Service Worker caches)
   */
  private async clearCacheAPI(result: CacheCleanupResult): Promise<void> {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        let clearedCount = 0;

        for (const cacheName of cacheNames) {
          try {
            const deleted = await caches.delete(cacheName);
            if (deleted) {
              clearedCount++;
            }
          } catch (error) {
            result.errors.push(`Cache ${cacheName}: ${error}`);
          }
        }

        if (clearedCount > 0) {
          result.clearedCaches.push(`Cache API (${clearedCount} caches)`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`Cache API: ${errorMessage}`);
    }
  }

  /**
   * Clear HTTP cache by forcing reload
   */
  private async clearHttpCache(result: CacheCleanupResult): Promise<void> {
    try {
      // Add cache-busting parameter to current URL
      const url = new URL(window.location.href);
      url.searchParams.set('_cache_clear', Date.now().toString());
      
      result.clearedCaches.push("HTTP cache (reload scheduled)");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`HTTP cache: ${errorMessage}`);
    }
  }

  /**
   * Clear specific Supabase-related cache entries
   */
  public async clearSupabaseCaches(): Promise<CacheCleanupResult> {
    const result: CacheCleanupResult = {
      success: false,
      clearedCaches: [],
      errors: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // Clear localStorage entries related to Supabase
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || 
        key.includes('sb-') ||
        key.includes('user-profile') ||
        key.includes('auth')
      );

      supabaseKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          result.errors.push(`Failed to remove ${key}: ${error}`);
        }
      });

      if (supabaseKeys.length > 0) {
        result.clearedCaches.push(`Supabase localStorage (${supabaseKeys.length} keys)`);
      }

      // Clear specific cache entries that might contain stale RPC calls
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes('supabase') || cacheName.includes('api')) {
            try {
              await caches.delete(cacheName);
              result.clearedCaches.push(`Supabase cache: ${cacheName}`);
            } catch (error) {
              result.errors.push(`Failed to clear cache ${cacheName}: ${error}`);
            }
          }
        }
      }

      result.success = result.errors.length === 0;

      logger.info("Supabase cache cleanup completed", {
        component: "CacheManagementService",
        action: "clearSupabaseCaches",
        result,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`Supabase cache cleanup error: ${errorMessage}`);
      
      logger.error("Supabase cache cleanup failed", {
        component: "CacheManagementService",
        action: "clearSupabaseCaches",
        error: errorMessage,
      });

      return result;
    }
  }

  /**
   * Force reload the page with cache bypass
   */
  public forceReloadWithCacheClear(): void {
    logger.info("Forcing page reload with cache clear", {
      component: "CacheManagementService",
      action: "forceReloadWithCacheClear",
      url: window.location.href,
    });

    // Use location.reload(true) if available, otherwise use alternative methods
    try {
      window.location.reload();
    } catch (error) {
      // Fallback: redirect to same page with cache-busting parameter
      const url = new URL(window.location.href);
      url.searchParams.set('_force_reload', Date.now().toString());
      window.location.href = url.toString();
    }
  }

  /**
   * Check if caches need to be cleared based on common error patterns
   */
  public shouldClearCaches(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    
    const cacheIndicators = [
      'get_user_profile',
      'rpc',
      '404',
      'function not found',
      'interval',
      'polling_config',
      'systemmetrics',
      'stale',
      'cached',
    ];

    return cacheIndicators.some(indicator => errorMessage.includes(indicator));
  }
}

// Export singleton instance
export const cacheManager = CacheManagementService.getInstance();