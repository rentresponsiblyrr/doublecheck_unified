import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface AdminAuthState {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export const useAdminAuth = (): AdminAuthState & {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
} => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SECURE: Load user role with database validation - NEVER default to admin
  const loadUserRole = useCallback(async (userId: string) => {
    try {
      // SECURE: Use direct database query for role validation (post-migration schema)
      const { data: userData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (roleError) {
        logger.error("Failed to get user role - SECURITY VIOLATION", {
          userId: userId,
          error: roleError.message,
          timestamp: new Date().toISOString(),
        });

        // SECURE: Never default to admin - set as null for proper auth flow
        setUserRole(null);
        setError("Unable to verify user permissions");
        return;
      }

      // SECURE: Only proceed if we have explicit role confirmation
      if (
        !userData?.role ||
        !["admin", "super_admin"].includes(userData.role)
      ) {
        logger.warn("User attempted admin access without privileges", {
          userId: userId,
          providedRole: userData?.role || "none",
          timestamp: new Date().toISOString(),
        });

        setUserRole(userData?.role || "none");
        setError("Insufficient admin privileges");
        return;
      }

      // SUCCESS: User has verified admin role
      setUserRole(userData.role);
      setError(null);
    } catch (err) {
      logger.error("Admin role verification failed - SECURITY EVENT", {
        userId: userId,
        error: (err as Error).message,
        timestamp: new Date().toISOString(),
      });

      // SECURE: Never default to admin on errors
      setUserRole(null);
      setError("Authentication system error");
    }
  }, []);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current session with timeout protection
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(new Error("AdminAuth session timeout after 5 seconds")),
            5000,
          ),
        );

        const {
          data: { session: currentSession },
          error: sessionError,
        } = (await Promise.race([sessionPromise, timeoutPromise])) as any;

        if (sessionError) {
          setError(sessionError.message);
          setSession(null);
          setUser(null);
          setUserRole(null);
          return;
        }

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);

          try {
            // Add timeout to loadUserRole as well
            await Promise.race([
              loadUserRole(currentSession.user.id),
              new Promise((_, reject) =>
                setTimeout(
                  () =>
                    reject(
                      new Error("User role loading timeout after 3 seconds"),
                    ),
                  3000,
                ),
              ),
            ]);
          } catch (roleError) {
            // SECURE: Never default to admin on timeout or errors
            logger.error("Role loading failed during auth initialization", {
              userId: currentSession.user.id,
              error: (roleError as Error).message,
              timestamp: new Date().toISOString(),
            });
            setUserRole(null);
            setError("Failed to verify admin permissions");
          }
        } else {
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      } catch (err) {
        if (err.message?.includes("timeout")) {
        }
        setError(err instanceof Error ? err.message : "Authentication error");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      try {
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          await loadUserRole(newSession.user.id);
          setError(null);
        } else {
          setSession(null);
          setUser(null);
          setUserRole(null);
          if (event === "SIGNED_OUT") {
            setError(null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication error");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserRole]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
      } else {
        setUser(null);
        setSession(null);
        setUserRole(null);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session: refreshedSession },
        error,
      } = await supabase.auth.refreshSession();

      if (error) {
        setError(error.message);
        return;
      }

      if (refreshedSession?.user) {
        setSession(refreshedSession);
        setUser(refreshedSession.user);
        await loadUserRole(refreshedSession.user.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Session refresh failed");
    } finally {
      setLoading(false);
    }
  }, [loadUserRole]);

  // SECURE: Only consider authenticated if user has verified admin role
  const isAuthenticated = !!(
    user &&
    session &&
    userRole &&
    ["admin", "super_admin"].includes(userRole)
  );

  return {
    user,
    session,
    userRole,
    loading,
    error,
    isAuthenticated,
    signOut,
    refreshSession,
  };
};
