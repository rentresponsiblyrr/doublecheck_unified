import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import AdminLayout from './AdminLayout';

// Import admin components directly to avoid lazy loading issues
import AdminOverview from './AdminOverview';
import PropertyManagement from './PropertyManagement';
import SimpleInspectionManagement from './SimpleInspectionManagement';

// Import simple, working components
import SimpleUserManagement from './SimpleUserManagement';
import SimpleChecklistManagement from './SimpleChecklistManagement';
import SimpleBugReportManagement from './SimpleBugReportManagement';
import AdminDiagnostics from './AdminDiagnostics';
import ComponentTest from './ComponentTest';
import RobustAdminWrapper from './RobustAdminWrapper';
import SimpleTestComponent from './SimpleTestComponent';
import SimpleUserManagementFixed from './SimpleUserManagementFixed';
import SimpleChecklistManagementFixed from './SimpleChecklistManagementFixed';
import AuditCenterFixed from './AuditCenterFixed';
import GitHubIntegrationTest from './GitHubIntegrationTest';
import ComprehensiveGitHubTest from './ComprehensiveGitHubTest';

// Import remaining components directly
import ReportManagement from './ReportManagement';
import AuditCenter from './AuditCenter';
import ComingSoonPage from './ComingSoonPage';
import SimpleAdminTest from './SimpleAdminTest';
import InspectionCleanupUtility from './InspectionCleanupUtility';
import InspectionDataDiagnostic from './InspectionDataDiagnostic';
import DatabaseConnectivityTest from './DatabaseConnectivityTest';

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
        <Route path="/" element={<AdminOverview />} />
          
        {/* All routes use relative paths - works for both /admin/* and direct routes */}
        <Route path="properties" element={<PropertyManagement />} />
        <Route path="users" element={<SimpleUserManagement />} />
        <Route path="inspections" element={<SimpleInspectionManagement />} />
        <Route path="inspection-cleanup" element={<InspectionCleanupUtility />} />
        <Route path="inspection-diagnostic" element={<InspectionDataDiagnostic />} />
        <Route path="audit" element={<AuditCenter />} />
        <Route path="reports" element={<ReportManagement />} />
        <Route path="checklists" element={<SimpleChecklistManagement />} />
        <Route path="users-real" element={
          <RobustAdminWrapper componentName="SimpleUserManagement" fallbackComponent={<div>User management temporarily unavailable</div>}>
            <SimpleUserManagement />
          </RobustAdminWrapper>
        } />
        <Route path="audit-real" element={
          <RobustAdminWrapper componentName="AuditCenter" fallbackComponent={<div>Audit center temporarily unavailable</div>}>
            <AuditCenter />
          </RobustAdminWrapper>
        } />
        <Route path="checklists-real" element={
          <RobustAdminWrapper componentName="SimpleChecklistManagement" fallbackComponent={<div>Checklist management temporarily unavailable</div>}>
            <SimpleChecklistManagement />
          </RobustAdminWrapper>
        } />
        <Route path="performance" element={
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
        } />
        <Route path="ai-learning" element={
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
        } />
        <Route path="analytics" element={
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
        } />
        <Route path="settings" element={
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
        } />
        <Route path="bug-reports" element={<SimpleBugReportManagement />} />
        <Route path="diagnostics" element={<AdminDiagnostics />} />
        <Route path="component-test" element={<ComponentTest />} />
        <Route path="github-test" element={<GitHubIntegrationTest />} />
        <Route path="github-comprehensive" element={<ComprehensiveGitHubTest />} />
        <Route path="db-test" element={<DatabaseConnectivityTest />} />
      </Routes>
    </AdminLayout>
  );
}