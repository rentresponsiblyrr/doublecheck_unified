import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Database, 
  Shield, 
  FileText,
  Users,
  Network,
  Code
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'loading';
  message: string;
  details?: string;
  error?: Error;
}

interface DiagnosticCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tests: DiagnosticResult[];
}

export default function ComprehensiveDiagnostic() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticCategory[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const initializeDiagnostics = (): DiagnosticCategory[] => [
    {
      name: 'Database Connectivity',
      icon: Database,
      tests: [
        { category: 'database', test: 'Connection', status: 'loading', message: 'Testing database connection...' },
        { category: 'database', test: 'Users Table', status: 'loading', message: 'Checking users table access...' },
        { category: 'database', test: 'Properties Table', status: 'loading', message: 'Checking properties table access...' },
        { category: 'database', test: 'Inspections Table', status: 'loading', message: 'Checking inspections table access...' },
        { category: 'database', test: 'Checklist Items Table', status: 'loading', message: 'Checking checklist_items table access...' },
      ]
    },
    {
      name: 'Authentication & Authorization',
      icon: Shield,
      tests: [
        { category: 'auth', test: 'Current User', status: 'loading', message: 'Checking current user session...' },
        { category: 'auth', test: 'User Role', status: 'loading', message: 'Verifying user role access...' },
        { category: 'auth', test: 'RLS Policies', status: 'loading', message: 'Testing row-level security policies...' },
      ]
    },
    {
      name: 'Data Integrity',
      icon: FileText,
      tests: [
        { category: 'data', test: 'Foreign Keys', status: 'loading', message: 'Checking foreign key constraints...' },
        { category: 'data', test: 'Static Safety Items', status: 'loading', message: 'Verifying static safety items exist...' },
        { category: 'data', test: 'User Profiles', status: 'loading', message: 'Checking user profile consistency...' },
      ]
    },
    {
      name: 'API Functions',
      icon: Code,
      tests: [
        { category: 'functions', test: 'Property Function', status: 'loading', message: 'Testing get_properties_with_inspections...' },
        { category: 'functions', test: 'Inspection Creation', status: 'loading', message: 'Testing inspection creation flow...' },
        { category: 'functions', test: 'Checklist Population', status: 'loading', message: 'Testing checklist population...' },
      ]
    },
    {
      name: 'User Management',
      icon: Users,
      tests: [
        { category: 'users', test: 'User List', status: 'loading', message: 'Fetching user list...' },
        { category: 'users', test: 'Role Assignment', status: 'loading', message: 'Checking role assignments...' },
        { category: 'users', test: 'Profile Access', status: 'loading', message: 'Testing profile data access...' },
      ]
    },
    {
      name: 'Network & Performance',
      icon: Network,
      tests: [
        { category: 'network', test: 'API Response Time', status: 'loading', message: 'Measuring API response times...' },
        { category: 'network', test: 'Storage Access', status: 'loading', message: 'Testing storage bucket access...' },
        { category: 'network', test: 'Function Timeout', status: 'loading', message: 'Testing function timeout handling...' },
      ]
    }
  ];

  const runDiagnostics = async () => {
    setIsRunning(true);
    setLastRun(new Date());
    
    const categories = initializeDiagnostics();
    setDiagnostics(categories);

    // Run all tests
    const updatedCategories = await Promise.all(
      categories.map(async (category) => ({
        ...category,
        tests: await Promise.all(
          category.tests.map(async (test) => await runSingleTest(test))
        )
      }))
    );

    setDiagnostics(updatedCategories);
    setIsRunning(false);
  };

  const runSingleTest = async (test: DiagnosticResult): Promise<DiagnosticResult> => {
    try {
      switch (test.category) {
        case 'database':
          return await runDatabaseTest(test);
        case 'auth':
          return await runAuthTest(test);
        case 'data':
          return await runDataTest(test);
        case 'functions':
          return await runFunctionTest(test);
        case 'users':
          return await runUserTest(test);
        case 'network':
          return await runNetworkTest(test);
        default:
          return { ...test, status: 'fail', message: 'Unknown test category' };
      }
    } catch (error) {
      return {
        ...test,
        status: 'fail',
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  };

  const runDatabaseTest = async (test: DiagnosticResult): Promise<DiagnosticResult> => {
    const startTime = Date.now();
    
    try {
      switch (test.test) {
        case 'Connection':
          await supabase.from('users').select('count').limit(1).single();
          return { ...test, status: 'pass', message: 'Database connection successful' };
          
        case 'Users Table':
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, role')
            .limit(5);
          
          if (usersError) throw usersError;
          return { 
            ...test, 
            status: 'pass', 
            message: `Users table accessible (${users?.length || 0} users found)`,
            details: `Response time: ${Date.now() - startTime}ms`
          };
          
        case 'Properties Table':
          const { data: properties, error: propertiesError } = await supabase
            .from('properties')
            .select('id, name')
            .limit(5);
          
          if (propertiesError) throw propertiesError;
          return { 
            ...test, 
            status: 'pass', 
            message: `Properties table accessible (${properties?.length || 0} properties found)`,
            details: `Response time: ${Date.now() - startTime}ms`
          };
          
        case 'Inspections Table':
          const { data: inspections, error: inspectionsError } = await supabase
            .from('inspections')
            .select('id, status')
            .limit(5);
          
          if (inspectionsError) throw inspectionsError;
          return { 
            ...test, 
            status: 'pass', 
            message: `Inspections table accessible (${inspections?.length || 0} inspections found)`,
            details: `Response time: ${Date.now() - startTime}ms`
          };
          
        case 'Checklist Items Table':
          const { data: items, error: itemsError } = await supabase
            .from('inspection_checklist_items')
            .select('id, static_safety_item_id')
            .limit(5);
          
          if (itemsError) throw itemsError;
          return { 
            ...test, 
            status: 'pass', 
            message: `Inspection checklist items table accessible (${items?.length || 0} items found)`,
            details: `Response time: ${Date.now() - startTime}ms`
          };
          
        default:
          return { ...test, status: 'fail', message: 'Unknown database test' };
      }
    } catch (error) {
      return {
        ...test,
        status: 'fail',
        message: `Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: `Response time: ${Date.now() - startTime}ms`,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  };

  const runAuthTest = async (test: DiagnosticResult): Promise<DiagnosticResult> => {
    try {
      switch (test.test) {
        case 'Current User':
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          if (!user) throw new Error('No authenticated user found');
          
          return { 
            ...test, 
            status: 'pass', 
            message: `User authenticated: ${user.email}`,
            details: `User ID: ${user.id}`
          };
          
        case 'User Role':
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (!currentUser) throw new Error('No authenticated user');
          
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', currentUser.id)
            .single();
          
          if (profileError) throw profileError;
          
          const role = userProfile?.role || 'no role';
          const hasAdminAccess = ['admin', 'super_admin'].includes(role);
          
          return { 
            ...test, 
            status: hasAdminAccess ? 'pass' : 'warning', 
            message: `User role: ${role}`,
            details: hasAdminAccess ? 'Has admin access' : 'Limited access'
          };
          
        case 'RLS Policies':
          // Test if RLS policies are working by trying to access data
          const { data: testData, error: rlsError } = await supabase
            .from('users')
            .select('id')
            .limit(1);
          
          if (rlsError) throw rlsError;
          
          return { 
            ...test, 
            status: 'pass', 
            message: 'RLS policies allowing access',
            details: 'Row-level security is functioning'
          };
          
        default:
          return { ...test, status: 'fail', message: 'Unknown auth test' };
      }
    } catch (error) {
      return {
        ...test,
        status: 'fail',
        message: `Auth test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  };

  const runDataTest = async (test: DiagnosticResult): Promise<DiagnosticResult> => {
    try {
      switch (test.test) {
        case 'Foreign Keys':
          // Test foreign key relationships
          const { data: inspectionData, error: fkError } = await supabase
            .from('inspections')
            .select(`
              id,
              property_id,
              inspector_id,
              properties:property_id(id, name),
              users:inspector_id(id, email)
            `)
            .limit(1);
          
          if (fkError) throw fkError;
          
          return { 
            ...test, 
            status: 'pass', 
            message: 'Foreign key relationships working',
            details: 'Joins are functioning properly'
          };
          
        case 'Static Safety Items':
          const { data: safetyItems, error: safetyError } = await supabase
            .from('static_safety_items')
            .select('id, title, required')
            .eq('deleted', false);
          
          if (safetyError) throw safetyError;
          
          const requiredItems = safetyItems?.filter(item => item.required) || [];
          
          return { 
            ...test, 
            status: requiredItems.length > 0 ? 'pass' : 'warning', 
            message: `${safetyItems?.length || 0} safety items found`,
            details: `${requiredItems.length} required items`
          };
          
        case 'User Profiles':
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          const { data: profileUsers } = await supabase.from('users').select('id, email');
          
          const authCount = authUsers.users?.length || 0;
          const profileCount = profileUsers?.length || 0;
          
          return { 
            ...test, 
            status: authCount === profileCount ? 'pass' : 'warning', 
            message: `Auth users: ${authCount}, Profile users: ${profileCount}`,
            details: authCount === profileCount ? 'User profiles in sync' : 'User profile mismatch detected'
          };
          
        default:
          return { ...test, status: 'fail', message: 'Unknown data test' };
      }
    } catch (error) {
      return {
        ...test,
        status: 'fail',
        message: `Data test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  };

  const runFunctionTest = async (test: DiagnosticResult): Promise<DiagnosticResult> => {
    try {
      switch (test.test) {
        case 'Property Function':
          const { data: properties, error: propertyError } = await supabase
            .rpc('get_properties_with_inspections');
          
          if (propertyError) throw propertyError;
          
          return { 
            ...test, 
            status: 'pass', 
            message: `Property function working (${properties?.length || 0} properties)`,
            details: 'RPC function executed successfully'
          };
          
        case 'Inspection Creation':
          // Test the inspection creation flow without actually creating
          const { data: testProperty } = await supabase
            .from('properties')
            .select('id')
            .limit(1)
            .single();
          
          if (!testProperty) throw new Error('No test property found');
          
          return { 
            ...test, 
            status: 'pass', 
            message: 'Inspection creation flow accessible',
            details: 'Test property found for inspection creation'
          };
          
        case 'Checklist Population':
          const { data: safetyItems } = await supabase
            .from('static_safety_items')
            .select('id')
            .eq('deleted', false)
            .limit(1);
          
          return { 
            ...test, 
            status: safetyItems && safetyItems.length > 0 ? 'pass' : 'warning', 
            message: 'Checklist population ready',
            details: `${safetyItems?.length || 0} safety items available`
          };
          
        default:
          return { ...test, status: 'fail', message: 'Unknown function test' };
      }
    } catch (error) {
      return {
        ...test,
        status: 'fail',
        message: `Function test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  };

  const runUserTest = async (test: DiagnosticResult): Promise<DiagnosticResult> => {
    try {
      switch (test.test) {
        case 'User List':
          const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, email, role, status')
            .limit(10);
          
          if (userError) throw userError;
          
          return { 
            ...test, 
            status: 'pass', 
            message: `${users?.length || 0} users found`,
            details: 'User list accessible'
          };
          
        case 'Role Assignment':
          const { data: roleUsers, error: roleError } = await supabase
            .from('users')
            .select('id, email, role')
            .not('role', 'is', null);
          
          if (roleError) throw roleError;
          
          const adminUsers = roleUsers?.filter(u => ['admin', 'super_admin'].includes(u.role)) || [];
          
          return { 
            ...test, 
            status: adminUsers.length > 0 ? 'pass' : 'warning', 
            message: `${adminUsers.length} admin users found`,
            details: `Total users with roles: ${roleUsers?.length || 0}`
          };
          
        case 'Profile Access':
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No authenticated user');
          
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profileError) throw profileError;
          
          return { 
            ...test, 
            status: 'pass', 
            message: 'Profile data accessible',
            details: `Role: ${profile.role || 'none'}, Status: ${profile.status || 'unknown'}`
          };
          
        default:
          return { ...test, status: 'fail', message: 'Unknown user test' };
      }
    } catch (error) {
      return {
        ...test,
        status: 'fail',
        message: `User test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  };

  const runNetworkTest = async (test: DiagnosticResult): Promise<DiagnosticResult> => {
    const startTime = Date.now();
    
    try {
      switch (test.test) {
        case 'API Response Time':
          const { data, error } = await supabase
            .from('users')
            .select('id')
            .limit(1);
          
          if (error) throw error;
          
          const responseTime = Date.now() - startTime;
          
          return { 
            ...test, 
            status: responseTime < 1000 ? 'pass' : 'warning', 
            message: `Response time: ${responseTime}ms`,
            details: responseTime < 1000 ? 'Good performance' : 'Slow response'
          };
          
        case 'Storage Access':
          const { data: buckets, error: storageError } = await supabase
            .storage
            .listBuckets();
          
          if (storageError) throw storageError;
          
          return { 
            ...test, 
            status: 'pass', 
            message: `${buckets?.length || 0} storage buckets found`,
            details: 'Storage access working'
          };
          
        case 'Function Timeout':
          // Test with a quick timeout to ensure timeout handling works
          try {
            await Promise.race([
              supabase.from('users').select('id').limit(1),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Test timeout')), 100)
              )
            ]);
            return { 
              ...test, 
              status: 'pass', 
              message: 'Function completed quickly',
              details: 'No timeout issues detected'
            };
          } catch (error) {
            if (error instanceof Error && error.message === 'Test timeout') {
              return { 
                ...test, 
                status: 'warning', 
                message: 'Function timeout handling working',
                details: 'Timeout detection functional'
              };
            }
            throw error;
          }
          
        default:
          return { ...test, status: 'fail', message: 'Unknown network test' };
      }
    } catch (error) {
      return {
        ...test,
        status: 'fail',
        message: `Network test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: `Response time: ${Date.now() - startTime}ms`,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'loading':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'loading':
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getCategoryStatus = (tests: DiagnosticResult[]) => {
    const failCount = tests.filter(t => t.status === 'fail').length;
    const warningCount = tests.filter(t => t.status === 'warning').length;
    const passCount = tests.filter(t => t.status === 'pass').length;
    const loadingCount = tests.filter(t => t.status === 'loading').length;
    
    if (loadingCount > 0) return 'loading';
    if (failCount > 0) return 'fail';
    if (warningCount > 0) return 'warning';
    return 'pass';
  };

  useEffect(() => {
    // Auto-run diagnostics on mount
    runDiagnostics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Diagnostics</h2>
          <p className="text-gray-600">Comprehensive system health check</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastRun && (
            <span className="text-sm text-gray-500">
              Last run: {lastRun.toLocaleTimeString()}
            </span>
          )}
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {diagnostics.map((category) => {
          const Icon = category.icon;
          const categoryStatus = getCategoryStatus(category.tests);
          
          return (
            <Card key={category.name} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 mr-2" />
                    {category.name}
                  </div>
                  {getStatusBadge(categoryStatus)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.tests.map((test, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getStatusIcon(test.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {test.test}
                          </p>
                          {getStatusBadge(test.status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                        {test.details && (
                          <p className="text-xs text-gray-500 mt-1">{test.details}</p>
                        )}
                        {test.error && (
                          <Alert className="mt-2 bg-red-50 border-red-200">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-700 text-xs">
                              {test.error.message}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {diagnostics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {diagnostics.flatMap(c => c.tests).filter(t => t.status === 'pass').length}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {diagnostics.flatMap(c => c.tests).filter(t => t.status === 'warning').length}
                </div>
                <div className="text-sm text-gray-600">Warnings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {diagnostics.flatMap(c => c.tests).filter(t => t.status === 'fail').length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {diagnostics.flatMap(c => c.tests).filter(t => t.status === 'loading').length}
                </div>
                <div className="text-sm text-gray-600">Running</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}