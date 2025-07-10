import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load admin components to prevent blocking issues
const AIPerformanceDashboard = React.lazy(() => import('./AIPerformanceDashboard').then(module => ({
  default: module.AIPerformanceDashboard
})).catch(() => ({ default: () => <div>Performance Dashboard temporarily unavailable</div> })));

const AILearningDashboard = React.lazy(() => import('./AILearningDashboard').then(module => ({
  default: module.AILearningDashboard || module.default
})).catch(() => ({ default: () => <div>Learning Dashboard temporarily unavailable</div> })));

// Loading fallback
const AdminLoadingFallback = () => (
  <div className="p-6 space-y-6">
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
      <Routes>
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
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
            <p className="text-gray-600">Analytics coming soon...</p>
          </div>
        } />
        <Route path="/settings" element={
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Admin Settings</h2>
            <p className="text-gray-600">Settings panel coming soon...</p>
          </div>
        } />
        <Route path="*" element={
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
            <p className="text-gray-600">Welcome to the admin dashboard. Use the navigation to access different sections.</p>
          </div>
        } />
      </Routes>
    </ErrorBoundary>
  );
}