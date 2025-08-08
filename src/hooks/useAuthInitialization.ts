import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCachedRole } from "@/utils/mobileCacheUtils";
import { debugLogger } from "@/utils/debugLogger";

interface UseAuthInitializationProps {
  setSession: (session: unknown) => void;
  setUser: (user: unknown) => void;
  setUserRole: (role: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchUserRole: (userId: string, useCache?: boolean) => Promise<string>;
  initializationRef: React.MutableRefObject<Promise<void> | null>;
}

export const useAuthInitialization = ({
  setSession,
  setUser,
  setUserRole,
  setLoading,
  setError,
  fetchUserRole,
  initializationRef,
}: UseAuthInitializationProps) => {
  const initializeAuth = useCallback(async (): Promise<void> => {
    if (initializationRef.current) {
      return initializationRef.current;
    }

    setError(null);

    const initPromise = new Promise<void>(async (resolve) => {
      try {
        // Mobile-friendly timeout (2 seconds)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Mobile auth timeout")), 2000);
        });

        const sessionPromise = supabase.auth.getSession();

        const {
          data: { session },
        } = await Promise.race([sessionPromise, timeoutPromise]);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const cachedRole = getCachedRole(session.user.id);
          if (cachedRole) {
            setUserRole(cachedRole);
          } else {
            setUserRole("inspector");
            // Background role fetch for mobile
            fetchUserRole(session.user.id, false)
              .then((role) => {
                setUserRole(role);
              })
              .catch((error) => {
                debugLogger.error('useAuthInitialization', 'Role fetch failed during initialization', { error, userId: session.user.id });
              });
          }
        } else {
          setUserRole(null);
        }

        setLoading(false);
        setError(null);
        resolve();
      } catch (error) {
        setUser(null);
        setSession(null);
        setUserRole(null);
        setError("Mobile authentication failed");
        setLoading(false);
        resolve();
      }
    });

    initializationRef.current = initPromise;
    return initPromise;
  }, [
    setSession,
    setUser,
    setUserRole,
    setLoading,
    setError,
    fetchUserRole,
    initializationRef,
  ]);

  return { initializeAuth };
};
