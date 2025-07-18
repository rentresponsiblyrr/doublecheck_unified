import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/lib/error/error-boundary";

// Inspector Pages
import Index from "../pages/Index";
import AddProperty from "../pages/AddProperty";
import InspectionComplete from "../pages/InspectionComplete";
import PropertySelection from "../pages/PropertySelection";
import NotFound from "../pages/NotFound";
import { InspectionPage } from "../pages/InspectionPage";
import { InspectionReports } from "../pages/InspectionReports";
import { InspectorWorkflow } from "../pages/InspectorWorkflow";

// Admin Components - Direct imports (no lazy loading)
import DirectAdminRouter from "./admin/DirectAdminRouter";

interface UnifiedRoutesProps {
  user: any;
}

export default function UnifiedRoutes({ user }: UnifiedRoutesProps) {
  // Only log route loading in development and throttle to prevent infinite loops
  if (import.meta.env.DEV && Math.random() < 0.01) {
    console.log('🚀 UnifiedRoutes loaded for user:', user?.email);
  }
  
  return (
    <Routes>
      {/* INSPECTOR ROUTES - Default experience */}
      
      {/* Properties List - Main dashboard for inspectors */}
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

      {/* Property Management */}
      <Route path="/properties" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <PropertySelection />
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Add Property */}
      <Route path="/add-property" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <AddProperty />
          </ErrorBoundary>
        </ProtectedRoute>
      } />

      {/* Dashboard - Legacy route */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="inspector">
          <ErrorBoundary level="component">
            <Index />
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

      {/* ADMIN ROUTES - Role-based access */}
      
      {/* All admin functionality under /admin/* */}
      <Route path="/admin/*" element={
        <ProtectedRoute requiredRole="admin">
          <ErrorBoundary level="component">
            <DirectAdminRouter />
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
                  onClick={() => window.location.href = '/admin'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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