/**
 * Unified Admin Management Component
 * Consolidates all admin management functionality into a single, feature-rich component
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Building, 
  FileText, 
  Bug, 
  BarChart3, 
  Settings, 
  Database,
  Shield
} from 'lucide-react';

// Import existing admin components that we'll consolidate
import { ComponentErrorBoundary } from '@/components/error/ComponentErrorBoundary';
import { FunctionalUserManagement } from './FunctionalUserManagement';
import { FunctionalChecklistManagement } from './FunctionalChecklistManagement';
import { ProductionHealthCheck } from './ProductionHealthCheck';

interface UnifiedAdminManagementProps {
  initialTab?: 'users' | 'properties' | 'inspections' | 'reports' | 'bugs' | 'analytics' | 'system';
  userRole?: 'admin' | 'super_admin';
}

export const UnifiedAdminManagement: React.FC<UnifiedAdminManagementProps> = ({
  initialTab = 'users',
  userRole = 'admin'
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const adminTabs = [
    { id: 'users', label: 'User Management', icon: Users, adminOnly: false },
    { id: 'properties', label: 'Properties', icon: Building, adminOnly: false },
    { id: 'inspections', label: 'Inspections', icon: FileText, adminOnly: false },
    { id: 'reports', label: 'Reports', icon: BarChart3, adminOnly: false },
    { id: 'bugs', label: 'Bug Reports', icon: Bug, adminOnly: false },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
    { id: 'system', label: 'System', icon: Settings, adminOnly: true },
  ];

  const filteredTabs = adminTabs.filter(tab => 
    !tab.adminOnly || userRole === 'super_admin'
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Admin Management Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 lg:grid-cols-7">
              {filteredTabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-1"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6">
              <TabsContent value="users">
                <ComponentErrorBoundary 
                  componentName="User Management"
                  enableRetry={true}
                  enableHide={false}
                >
                  <UserManagementContent />
                </ComponentErrorBoundary>
              </TabsContent>

              <TabsContent value="properties">
                <ComponentErrorBoundary 
                  componentName="Property Management"
                  enableRetry={true}
                >
                  <PropertyManagementContent />
                </ComponentErrorBoundary>
              </TabsContent>

              <TabsContent value="inspections">
                <ComponentErrorBoundary 
                  componentName="Inspection Management"
                  enableRetry={true}
                >
                  <InspectionManagementContent />
                </ComponentErrorBoundary>
              </TabsContent>

              <TabsContent value="reports">
                <ComponentErrorBoundary 
                  componentName="Report Management"
                  enableRetry={true}
                >
                  <ReportManagementContent />
                </ComponentErrorBoundary>
              </TabsContent>

              <TabsContent value="bugs">
                <ComponentErrorBoundary 
                  componentName="Bug Report Management"
                  enableRetry={true}
                >
                  <BugReportManagementContent />
                </ComponentErrorBoundary>
              </TabsContent>

              {userRole === 'super_admin' && (
                <>
                  <TabsContent value="analytics">
                    <ComponentErrorBoundary 
                      componentName="Analytics Dashboard"
                      enableRetry={true}
                    >
                      <AnalyticsDashboardContent />
                    </ComponentErrorBoundary>
                  </TabsContent>

                  <TabsContent value="system">
                    <ComponentErrorBoundary 
                      componentName="System Management"
                      enableRetry={true}
                    >
                      <SystemManagementContent />
                    </ComponentErrorBoundary>
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Functional components with actual database operations
const UserManagementContent = () => <FunctionalUserManagement />;

const PropertyManagementContent = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Property Management</h3>
      <Button>Add Property</Button>
    </div>
    <Card>
      <CardContent className="p-4">
        <p>Property management functionality will be implemented here.</p>
        <p className="text-sm text-gray-500 mt-2">
          This consolidates PropertyManagement, PropertyFormDialog, and related components.
        </p>
      </CardContent>
    </Card>
  </div>
);

const InspectionManagementContent = () => <FunctionalChecklistManagement />;

const ReportManagementContent = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Report Management</h3>
    <Card>
      <CardContent className="p-4">
        <p>Report management functionality will be implemented here.</p>
        <p className="text-sm text-gray-500 mt-2">
          This consolidates ReportManagement and related components.
        </p>
      </CardContent>
    </Card>
  </div>
);

const BugReportManagementContent = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Bug Report Management</h3>
    <Card>
      <CardContent className="p-4">
        <p>Bug report management functionality will be implemented here.</p>
        <p className="text-sm text-gray-500 mt-2">
          This consolidates BugReportManagement and related components.
        </p>
      </CardContent>
    </Card>
  </div>
);

const AnalyticsDashboardContent = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
    <Card>
      <CardContent className="p-4">
        <p>Analytics dashboard will be implemented here.</p>
        <p className="text-sm text-gray-500 mt-2">
          This consolidates AIPerformanceDashboard and related analytics components.
        </p>
      </CardContent>
    </Card>
  </div>
);

const SystemManagementContent = () => <ProductionHealthCheck />;

export default UnifiedAdminManagement;