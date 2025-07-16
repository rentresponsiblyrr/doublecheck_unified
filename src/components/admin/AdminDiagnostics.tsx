import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export default function AdminDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // Test 1: Environment Variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      results.push({
        name: 'Environment Variables',
        status: 'pass',
        message: 'Supabase credentials found',
        details: `URL: ${supabaseUrl.substring(0, 30)}...`
      });
    } else {
      results.push({
        name: 'Environment Variables',
        status: 'fail',
        message: 'Missing Supabase credentials',
        details: `URL: ${supabaseUrl || 'MISSING'}, Key: ${supabaseKey ? 'SET' : 'MISSING'}`
      });
    }

    // Test 2: Supabase Connection
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        results.push({
          name: 'Supabase Connection',
          status: 'fail',
          message: 'Database connection failed',
          details: error.message
        });
      } else {
        results.push({
          name: 'Supabase Connection',
          status: 'pass',
          message: 'Database connection successful'
        });
      }
    } catch (error) {
      results.push({
        name: 'Supabase Connection',
        status: 'fail',
        message: 'Database connection error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Auth Context
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        results.push({
          name: 'Authentication',
          status: 'fail',
          message: 'Auth session error',
          details: error.message
        });
      } else if (session) {
        results.push({
          name: 'Authentication',
          status: 'pass',
          message: 'User authenticated',
          details: `User: ${session.user.email}`
        });
      } else {
        results.push({
          name: 'Authentication',
          status: 'warning',
          message: 'No active session',
          details: 'User may need to log in'
        });
      }
    } catch (error) {
      results.push({
        name: 'Authentication',
        status: 'fail',
        message: 'Auth check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Database Tables
    const tables = ['users', 'inspections', 'properties', 'checklist_items'];
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          results.push({
            name: `Table: ${table}`,
            status: 'fail',
            message: `Cannot access ${table} table`,
            details: error.message
          });
        } else {
          results.push({
            name: `Table: ${table}`,
            status: 'pass',
            message: `${table} table accessible`
          });
        }
      } catch (error) {
        results.push({
          name: `Table: ${table}`,
          status: 'fail',
          message: `${table} table error`,
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Test 5: Component Imports
    const componentTests = [
      { name: 'SimpleUserManagement', test: () => import('./SimpleUserManagement') },
      { name: 'SimpleChecklistManagement', test: () => import('./SimpleChecklistManagement') },
      { name: 'AuditCenter', test: () => import('./AuditCenter') }
    ];

    for (const comp of componentTests) {
      try {
        await comp.test();
        results.push({
          name: `Component: ${comp.name}`,
          status: 'pass',
          message: `${comp.name} imports successfully`
        });
      } catch (error) {
        results.push({
          name: `Component: ${comp.name}`,
          status: 'fail',
          message: `${comp.name} import failed`,
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
    }
  };

  const passCount = diagnostics.filter(d => d.status === 'pass').length;
  const failCount = diagnostics.filter(d => d.status === 'fail').length;
  const warningCount = diagnostics.filter(d => d.status === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Diagnostics</h1>
          <p className="text-gray-600">Diagnose issues with admin components</p>
        </div>
        <Button onClick={runDiagnostics} disabled={isRunning}>
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Diagnostics
            </>
          )}
        </Button>
      </div>

      {diagnostics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">Passed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{passCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-yellow-700">Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Results</CardTitle>
          <CardDescription>
            System health check for admin components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {diagnostics.map((result, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(result.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{result.name}</span>
                    <Badge className={getStatusColor(result.status)} variant="outline">
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 p-1 rounded">
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {failCount > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{failCount} critical issues found.</strong> The admin components may not work properly until these are resolved.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}