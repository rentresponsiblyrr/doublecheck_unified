import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RouteTest {
  name: string;
  path: string;
  url: string;
  component: string;
  requiredTables: string[];
  status: 'pending' | 'success' | 'error' | 'warning';
  error?: string;
  tableTests?: { [table: string]: boolean };
}

export const AdminRoutesTest: React.FC = () => {
  const [tests, setTests] = useState<RouteTest[]>([
    {
      name: 'Deployment Test',
      path: '/admin/deployment-test',
      url: 'https://admin.doublecheckverified.com/admin/deployment-test',
      component: 'AdminDeploymentTest',
      requiredTables: [],
      status: 'pending'
    },
    {
      name: 'Properties Management',
      path: '/admin/properties',
      url: 'https://admin.doublecheckverified.com/admin/properties',
      component: 'PropertyManagement',
      requiredTables: ['properties'],
      status: 'pending'
    },
    {
      name: 'User Management',
      path: '/admin/users',
      url: 'https://admin.doublecheckverified.com/admin/users',
      component: 'SimpleUserManagement',
      requiredTables: ['users', 'profiles'],
      status: 'pending'
    },
    {
      name: 'Inspections Management',
      path: '/admin/inspections',
      url: 'https://admin.doublecheckverified.com/admin/inspections',
      component: 'SimpleInspectionManagement',
      requiredTables: ['inspections'],
      status: 'pending'
    },
    {
      name: 'Audit Center',
      path: '/admin/audit',
      url: 'https://admin.doublecheckverified.com/admin/audit',
      component: 'AuditCenter',
      requiredTables: ['inspections', 'users', 'profiles'],
      status: 'pending'
    },
    {
      name: 'Reports Management',
      path: '/admin/reports',
      url: 'https://admin.doublecheckverified.com/admin/reports',
      component: 'ReportManagement',
      requiredTables: ['inspections'],
      status: 'pending'
    },
    {
      name: 'Checklist Management',
      path: '/admin/checklists',
      url: 'https://admin.doublecheckverified.com/admin/checklists',
      component: 'SimpleChecklistManagement',
      requiredTables: ['static_safety_items'],
      status: 'pending'
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);

  const testTableAccess = async (tableName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Table ${tableName} test failed:`, error);
        return false;
      }
      
      console.log(`✅ Table ${tableName} accessible`);
      return true;
    } catch (error) {
      console.error(`❌ Table ${tableName} connection failed:`, error);
      return false;
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      
      try {
        // Test required tables
        const tableTests: { [table: string]: boolean } = {};
        let allTablesAccessible = true;
        
        for (const table of test.requiredTables) {
          const accessible = await testTableAccess(table);
          tableTests[table] = accessible;
          if (!accessible) allTablesAccessible = false;
        }
        
        // Determine status
        let status: 'success' | 'error' | 'warning' = 'success';
        let error: string | undefined;
        
        if (!allTablesAccessible) {
          status = 'error';
          const failedTables = Object.entries(tableTests)
            .filter(([_, accessible]) => !accessible)
            .map(([table, _]) => table);
          error = `Database tables not accessible: ${failedTables.join(', ')}`;
        } else if (test.requiredTables.length === 0) {
          status = 'warning';
          error = 'No database dependencies (should load)';
        }
        
        // Update test result
        setTests(prev => prev.map((t, idx) => 
          idx === i ? { ...t, status, error, tableTests } : t
        ));
        
      } catch (err) {
        setTests(prev => prev.map((t, idx) => 
          idx === i ? { 
            ...t, 
            status: 'error', 
            error: `Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`
          } : t
        ));
      }
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: RouteTest['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default: return <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />;
    }
  };

  const getStatusBadge = (status: RouteTest['status']) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">Ready</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Testing...</Badge>;
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;
  const warningCount = tests.filter(t => t.status === 'warning').length;

  return (
    <div className="p-8 bg-blue-50 border-2 border-blue-300 rounded-lg">
      <h1 className="text-2xl font-bold text-blue-800 mb-4">
        🧪 Admin Routes & Components Test
      </h1>
      
      <div className="mb-6 grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{tests.length}</div>
            <div className="text-sm text-gray-600">Total Routes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-sm text-gray-600">Ready</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-sm text-gray-600">Errors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            <div className="text-sm text-gray-600">Warnings</div>
          </CardContent>
        </Card>
      </div>

      {errorCount > 0 && (
        <Alert className="mb-6 border-red-300 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Database Issues Detected:</strong> Some routes may not work due to missing or inaccessible database tables. 
            This is likely the same deployment issue affecting the entire admin portal.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {tests.map((test, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    <div className="text-sm text-gray-600">{test.component}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(test.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(test.url, '_blank')}
                    className="ml-2"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Test
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Path:</strong> {test.path}
                </div>
                <div>
                  <strong>Tables:</strong> {test.requiredTables.length > 0 ? test.requiredTables.join(', ') : 'None'}
                </div>
              </div>
              
              {test.tableTests && Object.keys(test.tableTests).length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-medium mb-2">Database Table Tests:</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(test.tableTests).map(([table, accessible]) => (
                      <Badge 
                        key={table} 
                        className={accessible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {table} {accessible ? '✅' : '❌'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {test.error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {test.error}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded border">
        <h3 className="font-semibold mb-2">🔧 Quick Actions</h3>
        <div className="space-x-2">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isRunning ? 'Testing...' : 'Re-run Tests'}
          </Button>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
};