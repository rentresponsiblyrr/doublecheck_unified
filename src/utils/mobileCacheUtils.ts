// Mobile-optimized role cache utilities
import { log } from "@/lib/logging/enterprise-logger";
// Simplified mobile cache without complex error handling
// import { errorManager } from '@/lib/error/enterprise-error-handler';

const ROLE_CACHE_KEY = "doublecheck_user_role";
const ROLE_CACHE_EXPIRY = "doublecheck_role_expiry";
const ROLE_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for mobile

export const getCachedRole = (userId: string): string | null => {
  try {
    const cachedRole = localStorage.getItem(`${ROLE_CACHE_KEY}_${userId}`);
    const expiry = localStorage.getItem(`${ROLE_CACHE_EXPIRY}_${userId}`);

    if (cachedRole && expiry && Date.now() < parseInt(expiry)) {
      log.debug(
        "Using mobile cached role",
        {
          component: "mobileCacheUtils",
          action: "getCachedRole",
          userId,
          role: cachedRole,
        },
        "CACHED_ROLE_FOUND",
      );
      return cachedRole;
    }
    return null;
  } catch (error) {
    log.warn(
      "Failed to get cached role",
      {
        component: "mobileCacheUtils",
        action: "getCachedRole",
        userId,
        error: error instanceof Error ? error.message : String(error),
      },
      "CACHE_READ_ERROR",
    );
    return null;
  }
};

export const setCachedRole = (userId: string, role: string): void => {
  try {
    localStorage.setItem(`${ROLE_CACHE_KEY}_${userId}`, role);
    localStorage.setItem(
      `${ROLE_CACHE_EXPIRY}_${userId}`,
      (Date.now() + ROLE_CACHE_DURATION).toString(),
    );
    log.debug(
      "Mobile cached role set",
      {
        component: "mobileCacheUtils",
        action: "setCachedRole",
        userId,
        role,
        expiryMs: ROLE_CACHE_DURATION,
      },
      "ROLE_CACHED",
    );
  } catch (error) {
    log.warn(
      "Failed to set cached role",
      {
        component: "mobileCacheUtils",
        action: "setCachedRole",
        userId,
        role,
        error: error instanceof Error ? error.message : String(error),
      },
      "CACHE_WRITE_ERROR",
    );
  }
};

export const clearCachedRole = (userId: string): void => {
  try {
    localStorage.removeItem(`${ROLE_CACHE_KEY}_${userId}`);
    localStorage.removeItem(`${ROLE_CACHE_EXPIRY}_${userId}`);
    log.debug(
      "Mobile role cache cleared",
      {
        component: "mobileCacheUtils",
        action: "clearCachedRole",
        userId,
      },
      "ROLE_CACHE_CLEARED",
    );
  } catch (error) {
    log.warn(
      "Failed to clear cached role",
      {
        component: "mobileCacheUtils",
        action: "clearCachedRole",
        userId,
        error: error instanceof Error ? error.message : String(error),
      },
      "CACHE_CLEAR_ERROR",
    );
  }
};
