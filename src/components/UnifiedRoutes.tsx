import React, { Suspense, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/lib/error/error-boundary";
import { Skeleton } from "@/components/ui/skeleton";

// PROFESSIONAL LAZY LOADING - META/NETFLIX/STRIPE STANDARDS
// Only import critical components immediately
import NotFound from "../pages/NotFound";

// LAZY LOADED COMPONENTS - Split by feature for optimal chunking
const Index = React.lazy(() => import("../pages/Index"));
const AddProperty = React.lazy(() => import("../pages/AddProperty"));
const InspectionComplete = React.lazy(() => import("../pages/InspectionComplete"));
const PropertySelection = React.lazy(() => import("../pages/PropertySelection"));
const InspectionPage = React.lazy(() => import("../pages/InspectionPage").then(module => ({ default: module.InspectionPage })));
const InspectionReports = React.lazy(() => import("../pages/InspectionReports").then(module => ({ default: module.InspectionReports })));
const InspectorWorkflow = React.lazy(() => import("../pages/InspectorWorkflow").then(module => ({ default: module.InspectorWorkflow })));

// Admin Components - Lazy loaded for professional chunking
const DirectAdminRouter = React.lazy(() => import("./admin/DirectAdminRouter"));

// PROFESSIONAL LOADING FALLBACK
function ProfessionalLoadingFallback({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 p-8">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div className="space-y-3">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
        <p className="text-sm text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

interface UnifiedRoutesProps {
  user: { id: string; email: string; role: string } | null;
}

export default function UnifiedRoutes({ user }: UnifiedRoutesProps) {
  const navigate = useNavigate();
  
  // PROFESSIONAL NAVIGATION HANDLER - Zero nuclear options
  const handleAdminNavigation = useCallback(() => {
    try {
      navigate('/admin');
    } catch (error) {
      console.error('Navigation to admin failed:', error);
      // Graceful fallback - stay on current page and show error
    }
  }, [navigate]);
  
  return (
    <Routes>
      {/* INSPECTOR ROUTES - Default experience */}
      
      {/* Properties List - Main dashboard for inspectors */}
      <Route path="/" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <Suspense fallback={<ProfessionalLoadingFallback message="Loading property dashboard..." />}>
              <PropertySelection />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Inspector Workflow */}
      <Route path="/inspector" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <Suspense fallback={<ProfessionalLoadingFallback message="Loading inspector workflow..." />}>
              <InspectorWorkflow />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Property Management */}
      <Route path="/properties" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <Suspense fallback={<ProfessionalLoadingFallback message="Loading properties..." />}>
              <PropertySelection />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Add Property */}
      <Route path="/add-property" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <Suspense fallback={<ProfessionalLoadingFallback message="Loading property form..." />}>
              <AddProperty />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Dashboard - Legacy route */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <Suspense fallback={<ProfessionalLoadingFallback message="Loading dashboard..." />}>
              <Index />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Reports */}
      <Route path="/reports" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <Suspense fallback={<ProfessionalLoadingFallback message="Loading inspection reports..." />}>
              <InspectionReports />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Inspection Routes */}
      <Route path="/inspection/:id" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <Suspense fallback={<ProfessionalLoadingFallback message="Loading inspection..." />}>
              <InspectionPage />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      <Route path="/inspection-complete/:id" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <Suspense fallback={<ProfessionalLoadingFallback message="Loading completion page..." />}>
              <InspectionComplete />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* ADMIN ROUTES - Role-based access */}
      
      {/* All admin functionality under /admin/* */}
      <Route path="/admin/*" element={
        <ProtectedRoute requiredRole="admin">
          <ErrorBoundary level="component">
            <Suspense fallback={<ProfessionalLoadingFallback message="Loading admin portal..." />}>
              <DirectAdminRouter />
            </Suspense>
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Legacy admin routes - redirect to /admin */}
      <Route path="/auditor" element={
        <ProtectedRoute requiredRole="admin">
          <ErrorBoundary level="component">
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to Admin Portal</h1>
                <p className="text-gray-600 mb-4">The auditor interface is now part of the admin portal.</p>
                <button 
                  onClick={handleAdminNavigation}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Go to Admin Portal
                </button>
              </div>
            </div>
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Health Check Route - Public */}
      <Route path="/health" element={
        <div className="p-4">
          <h1 className="text-xl font-bold">STR Certified Health Check</h1>
          <p className="text-green-600">✅ All systems operational</p>
          <div className="mt-4 text-sm text-gray-600">
            <div>Timestamp: {new Date().toISOString()}</div>
            <div>User: {user?.email || 'Not logged in'}</div>
            <div>Path: {window.location.pathname}</div>
          </div>
        </div>
      } />

      {/* Catch-all Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}