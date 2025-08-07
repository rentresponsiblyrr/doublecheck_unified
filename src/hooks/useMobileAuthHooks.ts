import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { debugLogger } from "@/utils/debugLogger";
import { useToast } from "@/hooks/use-toast";
import {
  getCachedRole,
  setCachedRole,
  clearCachedRole,
} from "@/utils/mobileCacheUtils";

export const useMobileAuthHooks = () => {
  const { toast } = useToast();

  // Mobile-optimized role fetching with aggressive timeout
  const fetchUserRole = useCallback(
    async (userId: string, useCache = true): Promise<string> => {
      if (useCache) {
        const cachedRole = getCachedRole(userId);
        if (cachedRole) {
          return cachedRole;
        }
      }

      return new Promise((resolve) => {
        // Mobile-friendly timeout (1 second)
        const timeout = setTimeout(() => {
          resolve("inspector");
        }, 1000);

        const fetchRole = async () => {
          try {
            // Use verified RPC function to avoid 503 errors
            const { data: role, error } = await supabase.rpc("get_user_role", {
              user_id: userId,
            });

            clearTimeout(timeout);

            if (error) {
              // Fallback to default role if RPC fails
              resolve("inspector");
              return;
            }

            // Use the role returned by RPC function (already validated)
            const validRole =
              role && ["admin", "inspector", "auditor"].includes(role)
                ? role
                : "inspector";
            setCachedRole(userId, validRole);
            resolve(validRole);
          } catch (error) {
            clearTimeout(timeout);
            resolve("inspector");
          }
        };

        fetchRole();
      });
    },
    [],
  );

  const clearSession = useCallback((userId?: string) => {
    try {
      localStorage.removeItem("supabase.auth.token");
      localStorage.removeItem("sb-urrydhjchgxnhyggqtzr-auth-token");

      if (userId) {
        clearCachedRole(userId);
      }
    } catch (error) {
      debugLogger.error('useMobileAuthHooks', 'Failed to clear stored authentication data', { error });
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            title: "Mobile Sign In Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "Successfully signed in on mobile.",
          });
        }

        return { error };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Mobile sign in failed";
        toast({
          title: "Mobile Sign In Error",
          description: message,
          variant: "destructive",
        });
        return { error };
      }
    },
    [toast],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          toast({
            title: "Mobile Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account Created",
            description:
              "Please check your email to verify your mobile account.",
          });
        }

        return { error };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Mobile sign up failed";
        toast({
          title: "Mobile Sign Up Error",
          description: message,
          variant: "destructive",
        });
        return { error };
      }
    },
    [toast],
  );

  const signOut = useCallback(
    async (userId?: string) => {
      try {
        await supabase.auth.signOut();
        clearSession(userId);

        toast({
          title: "Signed Out",
          description: "You have been signed out of your mobile session.",
        });
      } catch (error) {
        toast({
          title: "Mobile Sign Out Error",
          description: "There was an issue signing out.",
          variant: "destructive",
        });
      }
    },
    [clearSession, toast],
  );

  return {
    fetchUserRole,
    clearSession,
    signIn,
    signUp,
    signOut,
  };
};
