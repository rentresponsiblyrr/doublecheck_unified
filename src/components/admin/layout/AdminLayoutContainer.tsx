import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AdminHeader } from "./AdminHeader";
import { AdminNavigation } from "../AdminNavigation";
import { AdminNavigationErrorBoundary } from "../AdminNavigationErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger/production-logger";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccessibilityProvider } from "@/lib/accessibility/AccessibilityProvider";

interface UserProfile {
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

interface AdminLayoutContainerProps {
  children?: React.ReactNode;
}

export const AdminLayoutContainer: React.FC<AdminLayoutContainerProps> = ({
  children,
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mobile-first responsive breakpoints
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px) and (min-width: 769px)");
  const isDesktop = useMediaQuery("(min-width: 1025px)");

  const location = useLocation();

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Try to get profile data using RPC function to avoid RLS recursion
          try {
            const profilePromise = supabase.rpc("get_user_profile", {
              _user_id: user.id,
            });

            // Add timeout to prevent hanging requests
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Profile query timeout")),
                5000,
              ),
            );

            const { data: profile, error: profileError } = (await Promise.race([
              profilePromise,
              timeoutPromise,
            ])) as any;

            if (profileError) {
              logger.warn("User profile query failed, using fallback data", {
                component: "AdminLayoutContainer",
                error: profileError.message,
                userId: user.id,
                action: "profile_load_fallback",
              });
            }

            setUserProfile({
              full_name:
                profile?.[0]?.name ||
                user.user_metadata?.full_name ||
                user.email?.split("@")[0],
              email: profile?.[0]?.email || user.email,
              avatar_url: user.user_metadata?.avatar_url,
            });

            logger.info("User profile loaded in admin", {
              component: "AdminLayoutContainer",
              userId: user.id,
              hasProfile: !!profile,
              action: "profile_load",
            });
          } catch (profileError) {
            // Graceful fallback - use auth user data
            logger.warn("Profile lookup failed, using auth data", {
              component: "AdminLayoutContainer",
              error: (profileError as Error).message,
              action: "profile_fallback",
            });

            setUserProfile({
              full_name:
                user.user_metadata?.full_name || user.email?.split("@")[0],
              email: user.email,
              avatar_url: user.user_metadata?.avatar_url,
            });
          }
        }
      } catch (error) {
        logger.error("Failed to load user profile - critical error", {
          component: "AdminLayoutContainer",
          error: (error as Error).message,
          action: "profile_load",
        });

        // Even if everything fails, we set some basic data to prevent crashes
        setUserProfile({
          full_name: "Unknown User",
          email: "unknown@example.com",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  if (isLoading) {
    return (
      <div
        id="admin-loading"
        className="flex items-center justify-center min-h-screen"
      >
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AccessibilityProvider>
      <div
        id="admin-layout-container"
        className="relative flex flex-col h-screen bg-gray-100"
      >
        {/* Header */}
        <AdminHeader userProfile={userProfile} isMobile={isMobile} />

        {/* Admin Navigation */}
        <AdminNavigationErrorBoundary>
          <AdminNavigation isMobile={isMobile} />
        </AdminNavigationErrorBoundary>

        {/* Main Content */}
        <main
          id="admin-main-content"
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300",
            // Responsive padding
            isMobile ? "p-3" : isTablet ? "p-4" : "p-6",
          )}
        >
          <div
            className={cn(
              "mx-auto w-full",
              // Responsive max widths
              isMobile ? "max-w-full" : isTablet ? "max-w-4xl" : "max-w-7xl",
            )}
          >
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </AccessibilityProvider>
  );
};
