/**
 * PROFESSIONAL AUTHENTICATED APP - META/NETFLIX/STRIPE STANDARDS
 *
 * Complete rewrite of AuthenticatedApp with professional bundle splitting,
 * lazy loading, and performance optimizations that meet top-tier standards.
 *
 * Performance Goals:
 * - Initial bundle: <500KB (Meta standard: 2MB)
 * - Route chunks: <200KB each
 * - 60fps rendering with <16ms frame time
 * - <100ms interaction response time
 *
 * This is how professionals build scalable applications.
 */

import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

// Core providers and error boundaries (always loaded)
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/lib/error/error-boundary";

// Accessibility system (WCAG 2.1 AA compliance)
import { AccessibilityProvider } from "@/lib/accessibility/AccessibilityProvider";

// Professional loading components
import { ProfessionalLoadingSpinner } from "@/components/loading/ProfessionalLoadingSpinner";
import { ProfessionalErrorFallback } from "@/components/error/ProfessionalErrorFallback";

// Optimized notifications (lightweight)
import { OptimizedToaster } from "@/components/ui/optimized-toaster";

// Import accessibility styles
import "@/styles/accessibility.css";

// PROFESSIONAL LAZY LOADING - Route-based code splitting
const InspectorDashboard = lazy(() =>
  import("@/pages/inspector/Dashboard").then((module) => ({
    default: module.InspectorDashboard,
  })),
);

const PropertySelection = lazy(() =>
  import("@/pages/inspector/PropertySelection").then((module) => ({
    default: module.PropertySelection,
  })),
);

const InspectionWorkflow = lazy(() =>
  import("@/pages/inspector/InspectionWorkflow").then((module) => ({
    default: module.InspectionWorkflow,
  })),
);

const InspectionReports = lazy(() =>
  import("@/pages/inspector/InspectionReports").then((module) => ({
    default: module.InspectionReports,
  })),
);

// Admin routes (loaded only when needed)
const AdminDashboard = lazy(() =>
  import("@/pages/admin/Dashboard").then((module) => ({
    default: module.AdminDashboard,
  })),
);

const UserManagement = lazy(() =>
  import("@/pages/admin/UserManagement").then((module) => ({
    default: module.UserManagement,
  })),
);

const ChecklistManagement = lazy(() =>
  import("@/pages/admin/ChecklistManagement").then((module) => ({
    default: module.ChecklistManagement,
  })),
);

const AuditCenter = lazy(() =>
  import("@/pages/admin/AuditCenter").then((module) => ({
    default: module.AuditCenter,
  })),
);

// Auditor routes (loaded only when needed)
const AuditorDashboard = lazy(() =>
  import("@/pages/auditor/Dashboard").then((module) => ({
    default: module.AuditorDashboard,
  })),
);

const InspectionQueue = lazy(() =>
  import("@/pages/auditor/InspectionQueue").then((module) => ({
    default: module.InspectionQueue,
  })),
);

// Shared utilities (lightweight)
const NotFound = lazy(() =>
  import("@/pages/NotFound").then((module) => ({
    default: module.NotFound,
  })),
);

// Claude AI Demo (accessible to all authenticated users)
const ClaudeDemo = lazy(() =>
  import("@/pages/ClaudeDemo").then((module) => ({
    default: module.default,
  })),
);

// Professional Query Client Configuration
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount: number, error: Error) => {
          // Smart retry logic based on error type
          if (error?.status === 404 || error?.status === 403) return false;
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: "always",
      },
      mutations: {
        retry: 1,
      },
    },
  });

// Professional loading component with skeleton UI
const ProfessionalPageLoader: React.FC<{ page?: string }> = ({
  page = "page",
}) => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
    <ProfessionalLoadingSpinner message={`Loading ${page}...`} />
  </div>
);

// Professional error fallback for route chunks
const ProfessionalChunkErrorFallback: React.FC<{
  error: Error;
  retry: () => void;
  routeName: string;
}> = ({ error, retry, routeName }) => (
  <ProfessionalErrorFallback
    error={error}
    onRetry={retry}
    title={`Failed to load ${routeName}`}
    description="This page failed to load. This might be due to a network issue or a temporary problem."
    showDetails={process.env.NODE_ENV === "development"}
  />
);

// Route wrapper with professional error handling
const ProfessionalRoute: React.FC<{
  component: React.LazyExoticComponent<
    React.ComponentType<Record<string, unknown>>
  >;
  name: string;
  fallback?: React.ComponentType;
}> = ({
  component: Component,
  name,
  fallback: CustomFallback = ProfessionalPageLoader,
}) => (
  <ErrorBoundary
    fallback={(error, retry) => (
      <ProfessionalChunkErrorFallback
        error={error}
        retry={retry}
        routeName={name}
      />
    )}
    level="route"
  >
    <Suspense fallback={<CustomFallback page={name} />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

// Main authenticated application
export const ProfessionalAuthenticatedApp: React.FC = () => {
  const queryClient = createQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AccessibilityProvider>
          <TooltipProvider>
            <AuthProvider>
              <ErrorBoundary
                fallback={(error, retry) => (
                  <ProfessionalErrorFallback
                    error={error}
                    onRetry={retry}
                    title="Application Error"
                    description="The application encountered an unexpected error."
                    showDetails={process.env.NODE_ENV === "development"}
                  />
                )}
                level="app"
              >
                <Routes>
                  {/* Inspector Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute roles={["inspector"]}>
                        <ProfessionalRoute
                          component={InspectorDashboard}
                          name="Dashboard"
                        />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/properties"
                    element={
                      <ProtectedRoute roles={["inspector"]}>
                        <ProfessionalRoute
                          component={PropertySelection}
                          name="Properties"
                        />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/inspection/:propertyId"
                    element={
                      <ProtectedRoute roles={["inspector"]}>
                        <ProfessionalRoute
                          component={InspectionWorkflow}
                          name="Inspection"
                        />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute roles={["inspector"]}>
                        <ProfessionalRoute
                          component={InspectionReports}
                          name="Reports"
                        />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute roles={["admin"]}>
                        <ProfessionalRoute
                          component={AdminDashboard}
                          name="Admin Dashboard"
                        />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute roles={["admin"]}>
                        <ProfessionalRoute
                          component={UserManagement}
                          name="User Management"
                        />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/checklists"
                    element={
                      <ProtectedRoute roles={["admin"]}>
                        <ProfessionalRoute
                          component={ChecklistManagement}
                          name="Checklist Management"
                        />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/audit"
                    element={
                      <ProtectedRoute roles={["admin"]}>
                        <ProfessionalRoute
                          component={AuditCenter}
                          name="Audit Center"
                        />
                      </ProtectedRoute>
                    }
                  />

                  {/* Auditor Routes */}
                  <Route
                    path="/auditor"
                    element={
                      <ProtectedRoute roles={["auditor", "admin"]}>
                        <ProfessionalRoute
                          component={AuditorDashboard}
                          name="Auditor Dashboard"
                        />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/auditor/queue"
                    element={
                      <ProtectedRoute roles={["auditor", "admin"]}>
                        <ProfessionalRoute
                          component={InspectionQueue}
                          name="Inspection Queue"
                        />
                      </ProtectedRoute>
                    }
                  />

                  {/* Claude AI Demo Route */}
                  <Route
                    path="/claude-demo"
                    element={
                      <ProtectedRoute roles={["inspector", "admin", "auditor"]}>
                        <ProfessionalRoute
                          component={ClaudeDemo}
                          name="Claude AI Demo"
                        />
                      </ProtectedRoute>
                    }
                  />

                  {/* Fallback Route */}
                  <Route
                    path="*"
                    element={
                      <ProfessionalRoute
                        component={NotFound}
                        name="Not Found"
                      />
                    }
                  />
                </Routes>

                {/* Global UI Components */}
                <OptimizedToaster />
              </ErrorBoundary>
            </AuthProvider>
          </TooltipProvider>
        </AccessibilityProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default ProfessionalAuthenticatedApp;
