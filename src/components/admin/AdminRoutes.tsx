import React, { Suspense } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "./AdminLayout";

// Import admin components directly to avoid lazy loading issues
import AdminOverview from "./AdminOverview";
import PropertyManagement from "./PropertyManagement";
import SimpleInspectionManagement from "./SimpleInspectionManagement";

// Import canonical components (consolidated from multiple variants)
import { FunctionalUserManagement as UserManagement } from "./FunctionalUserManagement";
import { FunctionalChecklistManagement as ChecklistManagement } from "./FunctionalChecklistManagement";
import SimpleBugReportManagement from "./SimpleBugReportManagement";
import AdminDiagnostics from "./AdminDiagnostics";
import ComponentTest from "./ComponentTest";
import AdminProfileSettings from "./AdminProfileSettings";
// import RobustAdminWrapper from './RobustAdminWrapper'; // Removed to expose real errors
import SimpleTestComponent from "./SimpleTestComponent";
// Removed: Fixed variants consolidated into canonical components
// Removed: Redundant test components (GitHubIntegrationTest, ComprehensiveGitHubTest)

// Import fallback components
import { UserManagementFallback } from "./fallbacks/UserManagementFallback";
import { ChecklistManagementFallback } from "./fallbacks/ChecklistManagementFallback";
import { AuditCenterFallback } from "./fallbacks/AuditCenterFallback";

// Import Unified Performance Page
import { UnifiedPerformancePage } from "@/pages/admin/UnifiedPerformancePage";

// Removed: ComponentHealthMonitor (redundant test component)

// Import remaining components directly
import ReportManagement from "./ReportManagement";
import AuditCenter from "./AuditCenter";
import ComingSoonPage from "./ComingSoonPage";
// Removed: SimpleAdminTest, SimpleTestPage (redundant test components)
import InspectionCleanupUtility from "./InspectionCleanupUtility";
import InspectionDataDiagnostic from "./InspectionDataDiagnostic";
import DatabaseConnectivityTest from "./DatabaseConnectivityTest";
// Removed: SimpleTestPage (redundant)
import AdminErrorBoundary from "./AdminErrorBoundary";
import InspectionCreationDiagnostic from "./InspectionCreationDiagnostic";
import ChecklistDiagnostic from "./ChecklistDiagnostic";
import ErrorDiagnostic from "./ErrorDiagnostic";
import DirectErrorLogger from "./DirectErrorLogger";
// Removed: ComponentImportTest (redundant)
import EmergencyBypass from "./EmergencyBypass";
import ComprehensiveDiagnostic from "./ComprehensiveDiagnostic";
// Removed: AdminDeploymentTest, AdminRoutesTest (redundant test components)
// import { VerboseErrorBoundary } from './VerboseErrorBoundary'; // Removed to expose real errors

// Loading fallback
const AdminLoadingFallback = () => {
  return (
    <div className="p-8 bg-blue-50 border-2 border-blue-300 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-blue-800 mb-2">
          Loading Admin Component...
        </h2>
        <p className="text-blue-600">
          If you see this, the routing is working but the component is still
          loading.
        </p>
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
  const navigate = useNavigate();
  const location = useLocation();
  const routerPath = location.pathname;

  // EMERGENCY DEBUG: Show what AdminRoutes is receiving
  const currentPath = window.location.pathname;

  // For debugging - show a simple test first
  if (
    currentPath === "/admin/test" ||
    window.location.search.includes("debug=true")
  ) {
    return (
      <div className="p-8 bg-green-100 border-2 border-green-500 rounded-lg m-4">
        <h1 className="text-2xl font-bold text-green-800 mb-4">
          ✅ AdminRoutes is Working!
        </h1>
        <p className="text-green-700 mb-2">Path: {currentPath}</p>
        <p className="text-green-700 mb-2">Search: {window.location.search}</p>
        <p className="text-green-700">
          AdminRoutes component successfully rendered
        </p>
      </div>
    );
  }

  // EMERGENCY: If health route, show direct component with robust path checking

  if (
    currentPath.includes("health") ||
    routerPath.includes("health") ||
    currentPath === "/admin/health"
  ) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h1 className="text-2xl font-bold text-blue-800 mb-2">
              🚨 EMERGENCY HEALTH MONITOR
            </h1>
            <p className="text-blue-700">
              Direct route match detected. AdminRoutes is working but nested
              routing failed.
            </p>
            <div className="mt-4 text-sm text-blue-600">
              <div>Window Path: {JSON.stringify(currentPath)}</div>
              <div>Router Path: {JSON.stringify(routerPath)}</div>
              <div>Time: {new Date().toLocaleString()}</div>
            </div>
          </div>
          <DatabaseConnectivityTest />
        </div>
      </AdminLayout>
    );
  }

  // EMERGENCY: Always show a working component in main content area
  // This ensures we never get blank content
  const emergencyFallback = (
    <AdminLayout>
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h1 className="text-2xl font-bold text-red-800 mb-2">
            ⚠️ ROUTING FAILURE DETECTED
          </h1>
          <p className="text-red-700">
            AdminRoutes component loaded but no routes matched.
          </p>
          <div className="mt-4 text-sm text-red-600">
            <div>Window Path: {JSON.stringify(currentPath)}</div>
            <div>Router Path: {JSON.stringify(routerPath)}</div>
            <div>Expected: /admin/health or /admin/users or /admin/audit</div>
            <div>Time: {new Date().toLocaleString()}</div>
          </div>
          <div className="mt-4">
            <h3 className="font-semibold text-red-800 mb-2">
              Available Actions:
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/admin/health")}
                className="block w-full text-left px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Health Monitor
              </button>
              <button
                onClick={() => navigate("/admin/users")}
                className="block w-full text-left px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Go to User Management
              </button>
              <button
                onClick={() => {
                  // Professional recovery: Reset router state and navigate to admin root
                  navigate("/admin", { replace: true });
                }}
                className="block w-full text-left px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Reset to Admin Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );

  // Try normal routing first, but fall back to emergency if no routes work
  try {
    return (
      <AdminLayout>
        <Routes>
          {/* Use relative paths since we're already nested under /admin */}
          <Route path="/" element={<AdminOverview />} />

          {/* All routes use relative paths - works for both /admin/* and direct routes */}
          {/* Removed: deployment-test and routes-test routes (redundant test components) */}
          <Route path="properties" element={<PropertyManagement />} />
          <Route
            path="users"
            element={
              <AdminErrorBoundary
                componentName="User Management"
                fallback={<UserManagementFallback />}
              >
                <UserManagement />
              </AdminErrorBoundary>
            }
          />
          <Route path="inspections" element={<SimpleInspectionManagement />} />
          <Route
            path="inspection-cleanup"
            element={<InspectionCleanupUtility />}
          />
          <Route
            path="inspection-diagnostic"
            element={<InspectionDataDiagnostic />}
          />
          <Route
            path="audit"
            element={
              <AdminErrorBoundary
                componentName="Audit Center"
                fallback={<AuditCenterFallback />}
              >
                <AuditCenter />
              </AdminErrorBoundary>
            }
          />
          <Route path="reports" element={<ReportManagement />} />
          <Route
            path="checklists"
            element={
              <AdminErrorBoundary
                componentName="Checklist Management"
                fallback={<ChecklistManagementFallback />}
              >
                <ChecklistManagement />
              </AdminErrorBoundary>
            }
          />
          <Route path="performance" element={<UnifiedPerformancePage />} />
          <Route
            path="unified-performance"
            element={<UnifiedPerformancePage />}
          />
          <Route
            path="ai-learning"
            element={
              <ComingSoonPage
                title="AI Learning Dashboard"
                description="Advanced AI learning analytics and model improvement tracking"
                features={[
                  "Learning progress visualization",
                  "Model version comparison",
                  "Knowledge base insights",
                  "Automated model tuning",
                  "Feedback loop optimization",
                ]}
                estimatedDate="Q2 2024"
              />
            }
          />
          <Route
            path="analytics"
            element={
              <ComingSoonPage
                title="Analytics Dashboard"
                description="Advanced analytics and data visualization coming soon"
                features={[
                  "Real-time inspection metrics",
                  "Property performance analytics",
                  "Inspector productivity insights",
                  "AI accuracy trends",
                  "Revenue and cost analysis",
                ]}
              />
            }
          />
          <Route path="settings" element={<AdminProfileSettings />} />
          <Route path="bug-reports" element={<SimpleBugReportManagement />} />
          <Route path="diagnostics" element={<AdminDiagnostics />} />
          <Route path="health" element={<DatabaseConnectivityTest />} />
          <Route path="component-test" element={<ComponentTest />} />
          {/* Removed: github-test and github-comprehensive routes (redundant test components) */}
          <Route
            path="db-test"
            element={
              <AdminErrorBoundary>
                <DatabaseConnectivityTest />
              </AdminErrorBoundary>
            }
          />
          {/* Removed: simple-test route (redundant test component) */}
          <Route
            path="inspection-creation-diagnostic"
            element={<InspectionCreationDiagnostic />}
          />
          <Route
            path="checklist-diagnostic"
            element={<ChecklistDiagnostic />}
          />
          <Route path="error-diagnostic" element={<ErrorDiagnostic />} />
          <Route path="direct-error-logger" element={<DirectErrorLogger />} />
          {/* Removed: component-import-test route (redundant test component) */}
          <Route path="emergency-bypass" element={<EmergencyBypass />} />
          <Route
            path="comprehensive-diagnostic"
            element={<ComprehensiveDiagnostic />}
          />

          {/* Catch-all route - show emergency fallback for unmatched paths */}
          <Route path="*" element={emergencyFallback} />
        </Routes>
      </AdminLayout>
    );
  } catch (error) {
    return emergencyFallback;
  }
}
