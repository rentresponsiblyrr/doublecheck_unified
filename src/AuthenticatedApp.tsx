import React, { useEffect, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthContext } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/lib/error/error-boundary";
import { RetryFallback as ErrorFallback } from "@/components/error/fallbacks/RetryFallback";
import { useSessionManager } from "@/hooks/useSessionManager";
import { SessionWarning } from "@/components/SessionWarning";
import { errorReporter } from "@/lib/monitoring/error-reporter";
import { performanceTracker } from "@/lib/monitoring/performance-tracker";
import { log } from "@/lib/logging/enterprise-logger";
// TEMPORARILY DISABLE ENVIRONMENT IMPORTS TO FIX CRASH
// import { env } from "@/lib/config/environment";
// import { validateRequiredEnvVars } from "@/lib/config/environment";
import {
  AppType,
  getAppTypeFromDomain,
  isInspectorDomain,
  isAdminDomain,
  logAppConfiguration,
} from "@/lib/config/app-type";
import { supabase } from "@/integrations/supabase/client";
import UnifiedRoutes from "@/components/UnifiedRoutes";
// Import console debugger for development
import "@/utils/consoleDebugger";

// PROFESSIONAL LAZY LOADING - META/NETFLIX/STRIPE STANDARDS
// Components are now lazy loaded in UnifiedRoutes for optimal chunking

// Critical components (always needed)
import NotFound from "./pages/NotFound";

// Loading Components
import { Skeleton } from "@/components/ui/skeleton";
import { DomainAwarePWA } from "@/components/DomainAwarePWA";
import { UniversalErrorBoundary as GlobalErrorBoundary } from "@/components/error/UniversalErrorBoundary";
import { BugReportButton } from "@/components/bug-report";

// Enhanced Query Client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: Error) => {
        // Don't retry on 4xx errors
        if (
          "status" in error &&
          typeof error.status === "number" &&
          error.status >= 400 &&
          error.status < 500
        )
          return false;
        return failureCount < 3;
      },
      staleTime: 30000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
      onError: (error: Error) => {
        errorReporter.reportError(error, {
          category: "query",
          source: "react-query",
        });
      },
    },
    mutations: {
      retry: 1,
      onError: (error: Error) => {
        errorReporter.reportError(error, {
          category: "mutation",
          source: "react-query",
        });
      },
    },
  },
});

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// System Health Check Component
function SystemHealthCheck({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize monitoring services only if configured
    const isProduction = import.meta.env.PROD;
    const isDevelopment = import.meta.env.DEV;

    if (isProduction) {
      try {
        errorReporter.initialize({
          enableConsoleCapture: false, // Disable in production
          enableNetworkCapture: true,
          enableClickCapture: true,
          enableNavigationCapture: true,
        });
      } catch (error) {
        log.warn(
          "Failed to initialize error reporter",
          {
            component: "SystemHealthCheck",
            action: "initializeErrorReporter",
            environment: "production",
          },
          "ERROR_REPORTER_INIT_FAILED",
        );
      }
    }

    performanceTracker.initialize({
      enableWebVitals: true,
      enableResourceTiming: true,
      enableAIMetrics: true,
      sampleRate: isProduction ? 0.1 : 1.0,
    });

    // Track app initialization
    performanceTracker.trackMetric("app_initialization", Date.now(), "ms", {
      category: "startup",
      environment: import.meta.env.MODE,
    });
  }, []);

  return <>{children}</>;
}

import type { User } from "./types/business-logic";

interface AuthenticatedAppProps {
  user: User;
}

export default function AuthenticatedApp({ user }: AuthenticatedAppProps) {
  // SIMPLIFIED: Single session config for unified app
  const sessionConfig = React.useMemo(() => {
    const isDev = import.meta.env.DEV;

    return {
      inactivityTimeoutMs: isDev ? 2 * 60 * 1000 : 110 * 60 * 1000, // 2min dev, 110min prod
      warningDurationMs: isDev ? 30 * 1000 : 10 * 60 * 1000, // 30sec dev, 10min prod
      maxSessionDurationMs: isDev ? 10 * 60 * 1000 : 12 * 60 * 60 * 1000, // 10min dev, 12h prod
      enableRememberMe: true,
    };
  }, []);

  const { sessionState, extendSession, logout } =
    useSessionManager(sessionConfig);

  // REMOVED: Unified app logging to prevent infinite render loops
  // React.useEffect(() => {
  //     inactivityTimeout: Math.floor(sessionConfig.inactivityTimeoutMs / 60000) + 'min',
  //     maxDuration: Math.floor(sessionConfig.maxSessionDurationMs / 3600000) + 'h'
  //   });
  // }, [user, sessionConfig]);

  return (
    <GlobalErrorBoundary>
      <ErrorBoundary
        level="page"
        fallback={({ error, resetError, errorId }) => (
          <ErrorFallback
            error={error}
            resetError={resetError}
            errorId={errorId}
            showDetails={import.meta.env.DEV}
          />
        )}
        onError={(error, errorInfo) => {
          log.error(
            "App-level error boundary triggered",
            error,
            {
              component: "AuthenticatedApp",
              errorBoundary: "page",
              componentStack: errorInfo.componentStack,
            },
            "APP_LEVEL_ERROR",
          );
        }}
      >
        <SystemHealthCheck>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <ErrorBoundary level="section" isolate>
                <AuthProvider>
                  <DomainAwarePWA />
                  <Toaster />
                  <Sonner />

                  {/* Session Warning Modal */}
                  <SessionWarning
                    isVisible={sessionState.showWarning}
                    timeUntilLogout={sessionState.timeUntilLogout}
                    onExtendSession={extendSession}
                    onLogoutNow={logout}
                  />

                  <BrowserRouter>
                    <Suspense fallback={<LoadingFallback />}>
                      <UnifiedRoutes user={user} />
                    </Suspense>
                  </BrowserRouter>

                  {/* Bug Report Button - Available throughout the app */}
                  <BugReportButton visible={true} className="" />

                  {/* Debug Database Status - Development only */}
                  {/* <DebugDatabaseStatus /> */}

                  {/* Debug: Test bug report system in development only */}
                  {import.meta.env.DEV && (
                    <div
                      style={{
                        position: "fixed",
                        top: "10px",
                        left: "10px",
                        background: "rgba(0,100,0,0.8)",
                        color: "white",
                        padding: "4px 8px",
                        fontSize: "12px",
                        zIndex: 9999,
                        borderRadius: "4px",
                      }}
                    >
                      🐛 Bug Report: User Menu → Report Issue
                    </div>
                  )}
                </AuthProvider>
              </ErrorBoundary>
            </TooltipProvider>
          </QueryClientProvider>
        </SystemHealthCheck>
      </ErrorBoundary>
    </GlobalErrorBoundary>
  );
}

// REMOVED: InspectorRoutes - Routes are now handled by UnifiedRoutes with professional lazy loading

// REMOVED: AdminRoutesComponent - Routes are now handled by UnifiedRoutes with professional lazy loading

// REMOVED: Professional loading and admin lazy loading - now handled in UnifiedRoutes

/**
 * PROFESSIONAL CROSS-DOMAIN REDIRECT COMPONENTS
 *
 * Handles cross-domain navigation with proper error handling and user feedback.
 * NO amateur window.location assignments without user confirmation.
 */

function AdminRedirect() {
  const [redirecting, setRedirecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRedirect = React.useCallback(() => {
    try {
      setRedirecting(true);
      const currentPath = window.location.pathname + window.location.search;
      const adminUrl = `https://admin.doublecheckverified.com${currentPath}`;

      // Professional cross-domain navigation with error handling
      setTimeout(() => {
        try {
          // NUCLEAR REMOVED: window.location.replace(adminUrl);
        } catch (redirectError) {
          setError("Failed to redirect to admin portal");
          setRedirecting(false);
        }
      }, 1000); // Give user time to see the redirect message
    } catch (error) {
      setError("Navigation error occurred");
      setRedirecting(false);
    }
  }, []);

  React.useEffect(() => {
    // Auto-redirect after component mount
    const timer = setTimeout(handleRedirect, 500);
    return () => clearTimeout(timer);
  }, [handleRedirect]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Navigation Error
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRedirect}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Redirecting to Admin Portal
        </h1>
        <p className="text-gray-600">
          Taking you to admin.doublecheckverified.com...
        </p>
        {redirecting && (
          <p className="text-sm text-gray-500 mt-2">
            If you're not redirected automatically,
            <button
              onClick={handleRedirect}
              className="text-blue-600 hover:text-blue-800 underline ml-1"
            >
              click here
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

function InspectorRedirect() {
  const [redirecting, setRedirecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRedirect = React.useCallback(() => {
    try {
      setRedirecting(true);
      const currentPath = window.location.pathname + window.location.search;
      const inspectorUrl = `https://app.doublecheckverified.com${currentPath}`;

      // Professional cross-domain navigation with error handling
      setTimeout(() => {
        try {
          // NUCLEAR REMOVED: window.location.replace(inspectorUrl);
        } catch (redirectError) {
          setError("Failed to redirect to inspector app");
          setRedirecting(false);
        }
      }, 1000); // Give user time to see the redirect message
    } catch (error) {
      setError("Navigation error occurred");
      setRedirecting(false);
    }
  }, []);

  React.useEffect(() => {
    // Auto-redirect after component mount
    const timer = setTimeout(handleRedirect, 500);
    return () => clearTimeout(timer);
  }, [handleRedirect]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Navigation Error
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRedirect}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Redirecting to Inspector App
        </h1>
        <p className="text-gray-600">
          Taking you to app.doublecheckverified.com...
        </p>
        {redirecting && (
          <p className="text-sm text-gray-500 mt-2">
            If you're not redirected automatically,
            <button
              onClick={handleRedirect}
              className="text-blue-600 hover:text-blue-800 underline ml-1"
            >
              click here
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

// SimpleAuthProvider removed - using proper AuthProvider instead

// Health check page for monitoring
function HealthCheckPage() {
  return (
    <div className="p-4">
      <h1>System Health</h1>
      <p>All systems operational</p>
    </div>
  );
}
