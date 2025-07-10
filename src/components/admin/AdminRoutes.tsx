import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import AdminLayout from './AdminLayout';

// Lazy load admin components to prevent blocking issues
const AdminOverview = React.lazy(() => import('./AdminOverview').catch(() => ({
  default: () => <div>Overview temporarily unavailable</div>
})));

const PropertyManagement = React.lazy(() => import('./PropertyManagement').catch(() => ({
  default: () => <div>Property Management temporarily unavailable</div>
})));

const UserManagement = React.lazy(() => import('./UserManagement').catch(() => ({
  default: () => <div>User Management temporarily unavailable</div>
})));

const InspectionManagement = React.lazy(() => import('./InspectionManagement').catch(() => ({
  default: () => <div>Inspection Management temporarily unavailable</div>
})));

const AIPerformanceDashboard = React.lazy(() => import('./AIPerformanceDashboard').then(module => ({
  default: module.AIPerformanceDashboard
})).catch(() => ({ default: () => <div>Performance Dashboard temporarily unavailable</div> })));

const AILearningDashboard = React.lazy(() => import('./AILearningDashboard').then(module => ({
  default: module.AILearningDashboard || module.default
})).catch(() => ({ default: () => <div>Learning Dashboard temporarily unavailable</div> })));

// Loading fallback
const AdminLoadingFallback = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-64" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
    <Skeleton className="h-96 w-full" />
  </div>
);

// Admin Routes Component
export default function AdminRoutes() {
  return (
    <ErrorBoundary fallback={<div className="p-6">Admin dashboard temporarily unavailable. Please refresh the page.</div>}>
      <AdminLayout>
        <Routes>
          <Route index element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminOverview />
            </Suspense>
          } />
          <Route path="/properties" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <PropertyManagement />
            </Suspense>
          } />
          <Route path="/users" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <UserManagement />
            </Suspense>
          } />
          <Route path="/inspections" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <InspectionManagement />
            </Suspense>
          } />
          <Route path="/reports" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Report Management</h2>
                <p className="text-gray-600">Report management dashboard coming soon...</p>
              </div>
            </Suspense>
          } />
          <Route path="/checklists" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Checklist Management</h2>
                <p className="text-gray-600">Checklist management system coming soon...</p>
              </div>
            </Suspense>
          } />
          <Route path="/performance" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <AIPerformanceDashboard />
            </Suspense>
          } />
          <Route path="/ai-learning" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <AILearningDashboard />
            </Suspense>
          } />
          <Route path="/analytics" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
                <p className="text-gray-600">Advanced analytics and reporting coming soon...</p>
              </div>
            </Suspense>
          } />
          <Route path="/settings" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Admin Settings</h2>
                <p className="text-gray-600">System configuration and settings coming soon...</p>
              </div>
            </Suspense>
          } />
        </Routes>
      </AdminLayout>
    </ErrorBoundary>
  );
}