import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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

const AILearningDashboard = React.lazy(() => import('./AILearningDashboard').catch(() => ({
  default: () => <div>Learning Dashboard temporarily unavailable</div>
})));

const ChecklistManagement = React.lazy(() => import('./ChecklistManagement').catch(() => ({
  default: () => <div>Checklist Management temporarily unavailable</div>
})));

const ReportManagement = React.lazy(() => import('./ReportManagement').catch(() => ({
  default: () => <div>Report Management temporarily unavailable</div>
})));

const AuditCenter = React.lazy(() => import('./AuditCenter').catch(() => ({
  default: () => <div>Audit Center temporarily unavailable</div>
})));

const ComingSoonPage = React.lazy(() => import('./ComingSoonPage').then(module => ({
  default: module.ComingSoonPage
})).catch(() => ({ 
  default: () => <div>Coming Soon page temporarily unavailable</div> 
})));

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
          {/* Default/Index route */}
          <Route index element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminOverview />
            </Suspense>
          } />
          
          {/* All routes use relative paths - works for both /admin/* and direct routes */}
          <Route path="properties" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <PropertyManagement />
            </Suspense>
          } />
          <Route path="users" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <UserManagement />
            </Suspense>
          } />
          <Route path="inspections" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <InspectionManagement />
            </Suspense>
          } />
          <Route path="audit" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <AuditCenter />
            </Suspense>
          } />
          <Route path="reports" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ReportManagement />
            </Suspense>
          } />
          <Route path="checklists" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ChecklistManagement />
            </Suspense>
          } />
          <Route path="performance" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <AIPerformanceDashboard />
            </Suspense>
          } />
          <Route path="ai-learning" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <AILearningDashboard />
            </Suspense>
          } />
          <Route path="analytics" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ComingSoonPage 
                title="Analytics Dashboard" 
                description="Advanced analytics and data visualization coming soon"
                features={[
                  'Real-time inspection metrics',
                  'Property performance analytics', 
                  'Inspector productivity insights',
                  'AI accuracy trends',
                  'Revenue and cost analysis'
                ]}
              />
            </Suspense>
          } />
          <Route path="settings" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ComingSoonPage 
                title="System Settings" 
                description="Comprehensive system configuration and administration"
                features={[
                  'User roles and permissions',
                  'System-wide configurations',
                  'API key management',
                  'Notification settings',
                  'Backup and security options'
                ]}
              />
            </Suspense>
          } />
        </Routes>
      </AdminLayout>
    </ErrorBoundary>
  );
}