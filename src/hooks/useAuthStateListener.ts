import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCachedRole } from "@/utils/mobileCacheUtils";
import { log } from "@/lib/logging/enterprise-logger";

interface UseAuthStateListenerProps {
  setSession: (session: unknown) => void;
  setUser: (user: unknown) => void;
  setUserRole: (role: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchUserRole: (userId: string, useCache?: boolean) => Promise<string>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStateListener = ({
  setSession,
  setUser,
  setUserRole,
  setLoading,
  setError,
  fetchUserRole,
  initializeAuth,
}: UseAuthStateListenerProps) => {
  const authInitialized = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      log.info(
        "Mobile auth state changed",
        {
          component: "useAuthStateListener",
          action: "onAuthStateChange",
          event,
          userEmail: session?.user?.email,
          hasSession: !!session,
          hasUser: !!session?.user,
        },
        "AUTH_STATE_CHANGED",
      );

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const cachedRole = getCachedRole(session.user.id);
        if (cachedRole) {
          setUserRole(cachedRole);
        } else {
          setUserRole("inspector");

          // Background mobile role fetch
          fetchUserRole(session.user.id, false)
            .then((role) => {
              if (isMounted) {
                setUserRole(role);
              }
            })
            .catch((error) => {
              log.error(
                "Background mobile role fetch failed",
                error as Error,
                {
                  component: "useAuthStateListener",
                  action: "fetchUserRole",
                  userId: session.user.id,
                },
                "BACKGROUND_ROLE_FETCH_FAILED",
              );
            });
        }
      } else {
        if (isMounted) {
          setUserRole(null);
        }
      }

      if (isMounted) {
        setLoading(false);
        setError(null);
      }
    });

    // Initialize auth only once
    if (authInitialized.current === false) {
      authInitialized.current = true;
      initializeAuth().catch((error) => {
        if (isMounted) {
          log.error(
            "Failed to initialize mobile auth",
            error as Error,
            {
              component: "useAuthStateListener",
              action: "initializeAuth",
            },
            "AUTH_INITIALIZATION_FAILED",
          );
          setLoading(false);
        }
      });
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [
    setSession,
    setUser,
    setUserRole,
    setLoading,
    setError,
    fetchUserRole,
    initializeAuth,
  ]);
};
