import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import AdminLayout from './AdminLayout';

// Lazy load admin components to prevent blocking issues
const AdminOverview = React.lazy(() => import('./AdminOverview').catch(() => ({
  default: () => <div>Overview temporarily unavailable</div>
})));

const PropertyManagement = React.lazy(() => import('./PropertyManagement').catch(() => ({
  default: () => <div>Property Management temporarily unavailable</div>
})));

const UserManagement = React.lazy(() => import('./UserManagementRobust').catch(() => ({
  default: () => <div>User Management temporarily unavailable</div>
})));

const InspectionManagement = React.lazy(() => import('./InspectionManagement').catch(() => ({
  default: () => <div>Inspection Management temporarily unavailable</div>
})));

const AIPerformanceDashboard = React.lazy(() => import('./AIPerformanceDashboard').catch(() => ({
  default: () => <div>Performance Dashboard temporarily unavailable</div>
})));

const AILearningDashboard = React.lazy(() => import('./AILearningDashboard').catch(() => ({
  default: () => <div>Learning Dashboard temporarily unavailable</div>
})));

const ChecklistManagement = React.lazy(() => import('./ChecklistManagementUltimate').catch(() => 
  import('./ChecklistManagementRobust').catch(() => 
    import('./ChecklistManagement').catch(() => ({
      default: () => <div>Checklist Management temporarily unavailable</div>
    }))
  )
));

const ReportManagement = React.lazy(() => import('./ReportManagement').catch(() => ({
  default: () => <div>Report Management temporarily unavailable</div>
})));

const AuditCenter = React.lazy(() => import('./AuditCenter').catch(() => ({
  default: () => <div>Audit Center temporarily unavailable</div>
})));

const ComingSoonPage = React.lazy(() => import('./ComingSoonPage').catch(() => ({ 
  default: () => <div>Coming Soon page temporarily unavailable</div> 
})));

const BugReportManagement = React.lazy(() => import('./BugReportManagement').catch(() => ({
  default: () => <div>Bug Report Management temporarily unavailable</div>
})));

const SimpleAdminTest = React.lazy(() => import('./SimpleAdminTest').catch(() => ({ 
  default: () => <div>Test component failed to load</div> 
})));

// Loading fallback
const AdminLoadingFallback = () => {
  console.log('⏳ AdminLoadingFallback rendering...');
  return (
    <div className="p-8 bg-blue-50 border-2 border-blue-300 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-blue-800 mb-2">Loading Admin Component...</h2>
        <p className="text-blue-600">If you see this, the routing is working but the component is still loading.</p>
      </div>
      <div className="mt-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
};

// Admin Routes Component
export default function AdminRoutes() {
  console.log('🔍 AdminRoutes component rendering...');
  console.log('📍 Current location:', window.location.pathname);
  console.log('📍 Current search params:', window.location.search);
  
  // For debugging - show a simple test first
  if (window.location.pathname === '/admin/test' || window.location.search.includes('debug=true')) {
    return (
      <div className="p-8 bg-green-100 border-2 border-green-500 rounded-lg m-4">
        <h1 className="text-2xl font-bold text-green-800 mb-4">✅ AdminRoutes is Working!</h1>
        <p className="text-green-700 mb-2">Path: {window.location.pathname}</p>
        <p className="text-green-700 mb-2">Search: {window.location.search}</p>
        <p className="text-green-700">AdminRoutes component successfully rendered</p>
      </div>
    );
  }
  
  return (
    <AdminLayout>
      <Routes>
        {/* Use relative paths since we're already nested under /admin */}
        <Route path="/" element={
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
            <ComingSoonPage 
              title="AI Performance Dashboard" 
              description="Real-time AI monitoring and performance analytics"
              features={[
                'Real-time accuracy metrics',
                'Response time monitoring', 
                'Cost optimization insights',
                'Model performance comparison',
                'Automated alerting system'
              ]}
              estimatedDate="Q2 2024"
            />
          </Suspense>
        } />
        <Route path="ai-learning" element={
          <Suspense fallback={<AdminLoadingFallback />}>
            <ComingSoonPage 
              title="AI Learning Dashboard" 
              description="Advanced AI learning analytics and model improvement tracking"
              features={[
                'Learning progress visualization',
                'Model version comparison',
                'Knowledge base insights',
                'Automated model tuning',
                'Feedback loop optimization'
              ]}
              estimatedDate="Q2 2024"
            />
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
        <Route path="bug-reports" element={
          <Suspense fallback={<AdminLoadingFallback />}>
            <BugReportManagement />
          </Suspense>
        } />
      </Routes>
    </AdminLayout>
  );
}