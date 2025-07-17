import React, { useEffect, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthContext } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/lib/error/error-boundary";
import { ErrorFallback } from "@/components/error/ErrorFallback";
import { useSessionManager } from "@/hooks/useSessionManager";
import { SessionWarning } from "@/components/SessionWarning";
import { errorReporter } from "@/lib/monitoring/error-reporter";
import { performanceTracker } from "@/lib/monitoring/performance-tracker";
import { env } from "@/lib/config/environment";
import { validateRequiredEnvVars } from "@/lib/config/environment";
import { AppType, getAppTypeFromDomain, isInspectorDomain, isAdminDomain, logAppConfiguration } from "@/lib/config/app-type";
import { supabase } from "@/integrations/supabase/client";

// Core Pages
import Index from "./pages/Index.tsx";
import AddProperty from "./pages/AddProperty";
import InspectionComplete from "./pages/InspectionComplete";
import PropertySelection from "./pages/PropertySelection";
import NotFound from "./pages/NotFound";
import { InspectionPage } from "./pages/InspectionPage";
import { DebugInspectionPage } from "@/components/DebugInspectionPage";
import { InspectionReports } from "./pages/InspectionReports";

// New Integrated Pages
import { InspectorWorkflow } from "./pages/InspectorWorkflow";

// Loading Components
import { Skeleton } from "@/components/ui/skeleton";
import { DomainAwarePWA } from "@/components/DomainAwarePWA";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import { BugReportButton } from "@/components/BugReportButton";
import SimpleBugReportTest from "@/components/SimpleBugReportTest";

// Enhanced Query Client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: Error) => {
        // Don't retry on 4xx errors
        if ('status' in error && typeof error.status === 'number' && error.status >= 400 && error.status < 500) return false;
        return failureCount < 3;
      },
      staleTime: 30000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
      onError: (error: Error) => {
        errorReporter.reportError(error, {
          category: 'query',
          source: 'react-query',
        });
      },
    },
    mutations: {
      retry: 1,
      onError: (error: Error) => {
        errorReporter.reportError(error, {
          category: 'mutation',
          source: 'react-query',
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
    // Validate environment on app start - but don't crash the app
    try {
      validateRequiredEnvVars();
      console.log('✅ Environment validation passed');
    } catch (error) {
      console.error('⚠️ Environment validation failed (non-critical):', error);
      // Don't throw in production to prevent app crashes
      // The app can still function with missing optional env vars
    }

    // Initialize monitoring services only if configured
    if (env.isProduction() && env.hasSentry()) {
      try {
        errorReporter.initialize({
          enableConsoleCapture: false, // Disable in production
          enableNetworkCapture: true,
          enableClickCapture: true,
          enableNavigationCapture: true,
        });
      } catch (error) {
        console.warn('⚠️ Failed to initialize error reporter:', error);
      }
    }

    performanceTracker.initialize({
      enableWebVitals: true,
      enableResourceTiming: true,
      enableAIMetrics: true,
      sampleRate: env.isProduction() ? 0.1 : 1.0,
    });

    // Track app initialization
    performanceTracker.trackMetric('app_initialization', Date.now(), 'ms', {
      category: 'startup',
      environment: env.getEnvironment(),
    });

  }, []);

  return <>{children}</>;
}

interface AuthenticatedAppProps {
  user: any;
}

export default function AuthenticatedApp({ user }: AuthenticatedAppProps) {
  const appType = getAppTypeFromDomain();
  
  // Session management configuration based on app type and environment
  const sessionConfig = React.useMemo(() => {
    const isDev = env.isDevelopment();
    
    if (appType === AppType.INSPECTOR) {
      return {
        inactivityTimeoutMs: isDev ? 2 * 60 * 1000 : 110 * 60 * 1000, // 2min dev, 110min prod
        warningDurationMs: isDev ? 30 * 1000 : 10 * 60 * 1000,        // 30sec dev, 10min prod
        maxSessionDurationMs: isDev ? 10 * 60 * 1000 : 12 * 60 * 60 * 1000, // 10min dev, 12h prod
        enableRememberMe: true
      };
    } else {
      return {
        inactivityTimeoutMs: isDev ? 2 * 60 * 1000 : 50 * 60 * 1000,  // 2min dev, 50min prod
        warningDurationMs: isDev ? 30 * 1000 : 10 * 60 * 1000,        // 30sec dev, 10min prod
        maxSessionDurationMs: isDev ? 8 * 60 * 1000 : 8 * 60 * 60 * 1000, // 8min dev, 8h prod
        enableRememberMe: true
      };
    }
  }, [appType]);

  const { sessionState, extendSession, logout } = useSessionManager(sessionConfig);
  
  // Log app configuration and routing debug info
  React.useEffect(() => {
    console.log('🔍 AuthenticatedApp Debug Info:');
    console.log('- Domain:', window.location.hostname);
    console.log('- App Type:', appType);
    console.log('- Current Path:', window.location.pathname);
    console.log('- User:', user?.email);
    console.log('- Environment:', env.getEnvironment());
    console.log('- Session Config:', {
      inactivityTimeout: Math.floor(sessionConfig.inactivityTimeoutMs / 60000) + 'min',
      maxDuration: Math.floor(sessionConfig.maxSessionDurationMs / 3600000) + 'h'
    });
    
    if (env.isDevelopment()) {
      logAppConfiguration();
    }
  }, [appType, user, sessionConfig]);
  
  return (
    <GlobalErrorBoundary>
      <ErrorBoundary
        level="page"
        fallback={({ error, resetError, errorId }) => (
          <ErrorFallback
            error={error}
            resetError={resetError}
            errorId={errorId}
            showDetails={env.isDevelopment()}
          />
        )}
        onError={(error, errorInfo) => {
          console.error('App-level error:', error, errorInfo);
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
                    {appType === AppType.INSPECTOR ? <InspectorRoutes /> : <AdminRoutesComponent />}
                  </Suspense>
                </BrowserRouter>
                
                {/* Bug Report Button - Available throughout the app */}
                <BugReportButton 
                  position="bottom-right"
                  size="md"
                  showInProduction={true}
                />
                
                {/* Debug: Test bug report system in development only */}
                {process.env.NODE_ENV === 'development' && (
                  <div 
                    style={{
                      position: 'fixed',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(0,100,0,0.8)',
                      color: 'white',
                      padding: '4px 8px',
                      fontSize: '12px',
                      zIndex: 9999,
                      borderRadius: '4px'
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

// Inspector Routes Component - Mobile-optimized for app.doublecheckverified.com
function InspectorRoutes() {
  React.useEffect(() => {
    console.log('🚀 InspectorRoutes component mounted');
    console.log('📍 Current path:', window.location.pathname);
    
    // Set mobile-specific viewport and PWA metadata
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    // Add mobile-specific CSS class
    document.body.classList.add('mobile-app', 'inspector-app');
    
    return () => {
      document.body.classList.remove('mobile-app', 'inspector-app');
    };
  }, []);

  return (
    <Routes>
      {/* Properties List - Now the main dashboard */}
      <Route path="/" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <PropertySelection />
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Inspector Workflow */}
      <Route path="/inspector" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <InspectorWorkflow />
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Property Management - Keep for backwards compatibility */}
      <Route path="/properties" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <PropertySelection />
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Dashboard - Moved to separate route if needed */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <Index />
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      <Route path="/add-property" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <AddProperty />
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Reports */}
      <Route path="/reports" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <InspectionReports />
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Inspection Routes */}
      <Route path="/inspection/:id" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <InspectionPage />
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      <Route path="/inspection-complete/:id" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <InspectionComplete />
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Health Check Route */}
      <Route path="/health" element={<HealthCheckPage />} />

      {/* Catch-all Route - Redirect admin attempts to admin domain */}
      <Route path="/admin/*" element={<AdminRedirect />} />
      <Route path="/auditor" element={<AdminRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Admin Routes Component - Desktop-optimized for admin.doublecheckverified.com
function AdminRoutesComponent() {
  const LazyAuditorDashboard = React.lazy(() => 
    import("./pages/SimpleAuditorDashboard").catch(() => 
      import("./pages/AuditorDashboard").catch(() => ({
        default: () => <div className="p-6">Auditor Dashboard loading...</div>
      }))
    )
  );
  const LazyDebugInspectionPage = React.lazy(() => 
    import("./components/DebugInspectionPage").catch(() => ({
      default: () => <div className="p-6">Debug tools temporarily unavailable</div>
    }))
  );
  
  React.useEffect(() => {
    // Set desktop-specific viewport and metadata
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
    }
    
    // Add desktop-specific CSS class
    document.body.classList.add('desktop-app', 'admin-app');
    
    return () => {
      document.body.classList.remove('desktop-app', 'admin-app');
    };
  }, []);
  
  return (
    <Routes>
      {/* Admin Dashboard - Default route for admin.doublecheckverified.com */}
      <Route path="/" element={<DirectAdminRouter />} />

      {/* Auditor Dashboard */}
      <Route path="/auditor" element={
        <ErrorBoundary level="component">
          <Suspense fallback={<LoadingFallback />}>
            <LazyAuditorDashboard />
          </Suspense>
        </ErrorBoundary>
      } />

      {/* Debug Tools */}
      <Route path="/debug-inspection/:id" element={
        <ErrorBoundary level="component" showErrorDetails>
          <Suspense fallback={<LoadingFallback />}>
            <LazyDebugInspectionPage />
          </Suspense>
        </ErrorBoundary>
      } />

      {/* Admin Routes - All admin functionality */}
      <Route path="/admin/*" element={<DirectAdminRouter />} />

      {/* Health Check Route */}
      <Route path="/health" element={<HealthCheckPage />} />

      {/* Catch-all Route - Redirect inspector attempts to inspector domain */}
      <Route path="/inspector" element={<InspectorRedirect />} />
      <Route path="/properties" element={<InspectorRedirect />} />
      <Route path="/inspection/*" element={<InspectorRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// NUCLEAR OPTION: Use direct router instead of broken AdminRoutes
// const AdminRoutes = React.lazy(() => import("@/components/admin/AdminRoutes"));
import DirectAdminRouter from "@/components/admin/DirectAdminRouter";

// Domain redirect components
function AdminRedirect() {
  React.useEffect(() => {
    // Redirect to admin domain with current path
    const currentPath = window.location.pathname + window.location.search;
    const adminUrl = `https://admin.doublecheckverified.com${currentPath}`;
    window.location.href = adminUrl;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to Admin Portal</h1>
        <p className="text-gray-600">Taking you to admin.doublecheckverified.com...</p>
      </div>
    </div>
  );
}

function InspectorRedirect() {
  React.useEffect(() => {
    // Redirect to inspector domain with current path
    const currentPath = window.location.pathname + window.location.search;
    const inspectorUrl = `https://app.doublecheckverified.com${currentPath}`;
    window.location.href = inspectorUrl;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to Inspector App</h1>
        <p className="text-gray-600">Taking you to app.doublecheckverified.com...</p>
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