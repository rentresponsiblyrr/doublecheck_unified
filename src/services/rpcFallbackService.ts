/**
 * RPC Fallback Service
 * 
 * Provides fallback implementations for missing RPC functions
 * to prevent 404 errors and maintain admin functionality.
 * 
 * @author STR Certified Engineering Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger/production-logger";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
  phone?: string;
}

export interface UserRole {
  role: string;
  permissions?: string[];
}

export class RPCFallbackService {
  private static instance: RPCFallbackService;

  public static getInstance(): RPCFallbackService {
    if (!RPCFallbackService.instance) {
      RPCFallbackService.instance = new RPCFallbackService();
    }
    return RPCFallbackService.instance;
  }

  /**
   * Fallback for get_user_profile RPC function
   * Uses direct users table query instead of missing RPC
   */
  public async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      logger.info("Getting user profile via fallback", {
        component: "RPCFallbackService",
        action: "getUserProfile",
        userId,
      });

      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, status, created_at, updated_at, last_login_at, phone")
        .eq("id", userId)
        .single();

      if (error) {
        logger.error("User profile fallback query failed", {
          component: "RPCFallbackService",
          action: "getUserProfile",
          error: error.message,
          userId,
        });
        return null;
      }

      return data;
    } catch (error) {
      logger.error("User profile fallback error", {
        component: "RPCFallbackService",
        action: "getUserProfile", 
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });
      return null;
    }
  }

  /**
   * Fallback for get_user_role RPC function
   * Uses direct users table query to get role information
   */
  public async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      logger.info("Getting user role via fallback", {
        component: "RPCFallbackService",
        action: "getUserRole",
        userId,
      });

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) {
        logger.error("User role fallback query failed", {
          component: "RPCFallbackService",
          action: "getUserRole",
          error: error.message,
          userId,
        });
        return null;
      }

      // Map role to permissions (basic implementation)
      const permissions = this.getRolePermissions(data.role);

      return {
        role: data.role,
        permissions,
      };
    } catch (error) {
      logger.error("User role fallback error", {
        component: "RPCFallbackService",
        action: "getUserRole",
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });
      return null;
    }
  }

  /**
   * Get permissions for a given role
   */
  private getRolePermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      admin: ["read", "write", "delete", "manage_users", "system_config"],
      auditor: ["read", "write", "audit", "review"],
      inspector: ["read", "write", "inspect"],
      user: ["read"],
    };

    return rolePermissions[role] || ["read"];
  }

  /**
   * Fallback for get_users_by_role RPC function
   * Uses direct users table query with role filtering
   */
  public async getUsersByRole(role: string): Promise<UserProfile[]> {
    try {
      logger.info("Getting users by role via fallback", {
        component: "RPCFallbackService",
        action: "getUsersByRole",
        role,
      });

      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, status, created_at, updated_at, last_login_at, phone")
        .eq("role", role)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Users by role fallback query failed", {
          component: "RPCFallbackService",
          action: "getUsersByRole",
          error: error.message,
          role,
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error("Users by role fallback error", {
        component: "RPCFallbackService",
        action: "getUsersByRole",
        error: error instanceof Error ? error.message : "Unknown error",
        role,
      });
      return [];
    }
  }

  /**
   * Fallback for get_user_role_simple RPC function
   * Simplified version that just returns the role string
   */
  public async getUserRoleSimple(userId: string): Promise<string | null> {
    try {
      logger.info("Getting user role simple via fallback", {
        component: "RPCFallbackService",
        action: "getUserRoleSimple",
        userId,
      });

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) {
        logger.error("User role simple fallback query failed", {
          component: "RPCFallbackService",
          action: "getUserRoleSimple",
          error: error.message,
          userId,
        });
        return null;
      }

      return data?.role || null;
    } catch (error) {
      logger.error("User role simple fallback error", {
        component: "RPCFallbackService",
        action: "getUserRoleSimple",
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });
      return null;
    }
  }

  /**
   * Test if an RPC function exists by attempting to call it
   */
  public async testRPCFunction(functionName: string, params: any = {}): Promise<boolean> {
    try {
      const { error } = await supabase.rpc(functionName, params);
      
      // If error is 404 or "function not found", RPC doesn't exist
      if (error && (
        error.message.includes("404") ||
        error.message.includes("function") ||
        error.message.includes("not found")
      )) {
        logger.warn("RPC function not found", {
          component: "RPCFallbackService",
          action: "testRPCFunction",
          functionName,
          error: error.message,
        });
        return false;
      }

      // Function exists (even if it returned an error for other reasons)
      return true;
    } catch (error) {
      logger.error("RPC function test error", {
        component: "RPCFallbackService",
        action: "testRPCFunction",
        functionName,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Attempt RPC call with automatic fallback to direct query
   */
  public async callWithFallback<T>(
    rpcFunction: string,
    params: any,
    fallbackFunction: () => Promise<T>
  ): Promise<T | null> {
    try {
      // First try the RPC function
      const { data, error } = await supabase.rpc(rpcFunction, params);
      
      if (error) {
        // If it's a 404 or function not found, use fallback
        if (
          error.message.includes("404") ||
          error.message.includes("function") ||
          error.message.includes("not found")
        ) {
          logger.info("Using fallback for missing RPC function", {
            component: "RPCFallbackService",
            action: "callWithFallback",
            rpcFunction,
            error: error.message,
          });
          
          return await fallbackFunction();
        }
        
        // Other errors should be thrown
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error("RPC call with fallback failed", {
        component: "RPCFallbackService",
        action: "callWithFallback",
        rpcFunction,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      
      // Try fallback on any error
      try {
        return await fallbackFunction();
      } catch (fallbackError) {
        logger.error("Fallback function also failed", {
          component: "RPCFallbackService",
          action: "callWithFallback",
          rpcFunction,
          fallbackError: fallbackError instanceof Error ? fallbackError.message : "Unknown error",
        });
        return null;
      }
    }
  }
}

// Export singleton instance
export const rpcFallback = RPCFallbackService.getInstance();