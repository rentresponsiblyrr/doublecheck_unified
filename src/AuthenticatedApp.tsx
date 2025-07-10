import React, { useEffect, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/lib/error/error-boundary";
import { ErrorFallback } from "@/components/error/ErrorFallback";
import { errorReporter } from "@/lib/monitoring/error-reporter";
import { performanceTracker } from "@/lib/monitoring/performance-tracker";
import { env } from "@/lib/config/environment";
import { validateRequiredEnvVars } from "@/lib/config/environment";
import { AppType, getAppTypeFromDomain, isInspectorDomain, isAdminDomain, logAppConfiguration } from "@/lib/config/app-type";

// Core Pages
import Index from "./pages/Index.tsx";
import AddProperty from "./pages/AddProperty";
import InspectionComplete from "./pages/InspectionComplete";
import PropertySelection from "./pages/PropertySelection";
import NotFound from "./pages/NotFound";
import { InspectionPage } from "./pages/InspectionPage";
import { DebugInspectionPage } from "@/components/DebugInspectionPage";

// New Integrated Pages
import { InspectorWorkflow } from "./pages/InspectorWorkflow";

// Loading Components
import { Skeleton } from "@/components/ui/skeleton";
import { DomainAwarePWA } from "@/components/DomainAwarePWA";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";

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
  
  // Log app configuration and routing debug info
  React.useEffect(() => {
    console.log('🔍 AuthenticatedApp Debug Info:');
    console.log('- Domain:', window.location.hostname);
    console.log('- App Type:', appType);
    console.log('- Current Path:', window.location.pathname);
    console.log('- User:', user?.email);
    console.log('- Environment:', env.getEnvironment());
    
    if (env.isDevelopment()) {
      logAppConfiguration();
    }
  }, [appType, user]);
  
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
                <BrowserRouter>
                  <Suspense fallback={<LoadingFallback />}>
                    {appType === AppType.INSPECTOR ? <InspectorRoutes /> : <AdminRoutesComponent />}
                  </Suspense>
                </BrowserRouter>
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
      {/* Dashboard Routes */}
      <Route path="/" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <Index />
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

      {/* Property Management */}
      <Route path="/properties" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <PropertySelection />
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
  const LazyAuditorDashboard = React.lazy(() => import("./pages/AuditorDashboard"));
  const LazyDebugInspectionPage = React.lazy(() => import("./components/DebugInspectionPage"));
  
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
      {/* Dashboard Routes */}
      <Route path="/" element={
        <ProtectedRoute requiredRole="auditor">
          <ErrorBoundary level="component">
            <Suspense fallback={<LoadingFallback />}>
              <LazyAuditorDashboard />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Auditor Dashboard */}
      <Route path="/auditor" element={
        <ProtectedRoute requiredRole="auditor">
          <ErrorBoundary level="component">
            <Suspense fallback={<LoadingFallback />}>
              <LazyAuditorDashboard />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Debug Tools */}
      <Route path="/debug-inspection/:id" element={
        <ProtectedRoute requiredRole="admin">
          <ErrorBoundary level="component" showErrorDetails>
            <Suspense fallback={<LoadingFallback />}>
              <LazyDebugInspectionPage />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<LoadingFallback />}>
            <AdminRoutes />
          </Suspense>
        </ProtectedRoute>
      } />

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

// Lazy load admin routes to reduce bundle size
const AdminRoutes = React.lazy(() => import("@/components/admin/AdminRoutes"));

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

// Health check page for monitoring
function HealthCheckPage() {
  return (
    <div className="p-4">
      <h1>System Health</h1>
      <p>All systems operational</p>
    </div>
  );
}