import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function InspectionCreationDiagnostic() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // 1. Check if user is authenticated
      addResult({
        step: 'Authentication Check',
        status: 'success',
        message: 'Checking user authentication...'
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        addResult({
          step: 'Authentication Check',
          status: 'error',
          message: 'User not authenticated',
          details: authError
        });
        return;
      }

      addResult({
        step: 'Authentication Check',
        status: 'success',
        message: `User authenticated: ${user.email}`,
        details: { userId: user.id }
      });

      // 2. Check static_safety_items table
      addResult({
        step: 'Static Safety Items Check',
        status: 'success',
        message: 'Checking static safety items...'
      });

      const { data: staticItems, error: staticError } = await supabase
        .from('static_safety_items')
        .select('id, label, category, required, deleted')
        .eq('deleted', false)
        .eq('required', true);

      if (staticError) {
        addResult({
          step: 'Static Safety Items Check',
          status: 'error',
          message: 'Failed to fetch static safety items',
          details: staticError
        });
        return;
      }

      addResult({
        step: 'Static Safety Items Check',
        status: staticItems && staticItems.length > 0 ? 'success' : 'warning',
        message: `Found ${staticItems?.length || 0} required static safety items`,
        details: staticItems
      });

      // 3. Check properties table access
      addResult({
        step: 'Properties Access Check',
        status: 'success',
        message: 'Checking properties table access...'
      });

      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, name')
        .limit(1);

      if (propError) {
        addResult({
          step: 'Properties Access Check',
          status: 'error',
          message: 'Failed to access properties table',
          details: propError
        });
        return;
      }

      addResult({
        step: 'Properties Access Check',
        status: 'success',
        message: `Properties table accessible, found ${properties?.length || 0} properties`
      });

      // 4. Test inspection creation permissions
      addResult({
        step: 'Inspection Creation Test',
        status: 'success',
        message: 'Testing inspection creation permissions...'
      });

      // Get a real property ID for testing
      const { data: testProperty } = await supabase
        .from('properties')
        .select('id')
        .limit(1)
        .single();

      if (!testProperty) {
        addResult({
          step: 'Inspection Creation Test',
          status: 'warning',
          message: 'No properties found to test with'
        });
        return;
      }

      // Test inspection insertion
      const testInspection = {
        property_id: testProperty.id,
        start_time: new Date().toISOString(),
        completed: false,
        status: 'draft',
        inspector_id: null
      };

      const { data: newInspection, error: insertError } = await supabase
        .from('inspections')
        .insert(testInspection)
        .select('id')
        .single();

      if (insertError) {
        addResult({
          step: 'Inspection Creation Test',
          status: 'error',
          message: 'Failed to create test inspection',
          details: insertError
        });
        return;
      }

      addResult({
        step: 'Inspection Creation Test',
        status: 'success',
        message: `Test inspection created successfully: ${newInspection.id}`
      });

      // 5. Check if checklist items were created by trigger
      addResult({
        step: 'Checklist Items Trigger Check',
        status: 'success',
        message: 'Checking if checklist items were created by trigger...'
      });

      // Wait for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: checklistItems, error: checklistError } = await supabase
        .from('checklist_items')
        .select('id, label, category')
        .eq('inspection_id', newInspection.id);

      if (checklistError) {
        addResult({
          step: 'Checklist Items Trigger Check',
          status: 'error',
          message: 'Failed to check checklist items',
          details: checklistError
        });
      } else {
        addResult({
          step: 'Checklist Items Trigger Check',
          status: checklistItems && checklistItems.length > 0 ? 'success' : 'error',
          message: `Found ${checklistItems?.length || 0} checklist items created by trigger`,
          details: checklistItems
        });
      }

      // 6. Check audit log
      const { data: auditLog } = await supabase
        .from('checklist_operations_audit')
        .select('*')
        .eq('inspection_id', newInspection.id)
        .order('created_at', { ascending: false });

      addResult({
        step: 'Trigger Audit Log',
        status: 'success',
        message: `Found ${auditLog?.length || 0} audit log entries`,
        details: auditLog
      });

      // 7. Clean up test inspection
      await supabase
        .from('inspections')
        .delete()
        .eq('id', newInspection.id);

      addResult({
        step: 'Cleanup',
        status: 'success',
        message: 'Test inspection cleaned up successfully'
      });

    } catch (error) {
      addResult({
        step: 'Diagnostic Error',
        status: 'error',
        message: 'Diagnostic failed with exception',
        details: error
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inspection Creation Diagnostic</h1>
        <p className="text-gray-600">
          Diagnose why inspection creation is failing with "Unknown error" after 3 attempts
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Issue:</strong> Inspection creation consistently fails with "Failed to create inspection after 3 attempts: Unknown error"
          <br />
          <strong>Goal:</strong> Identify the root cause and fix the blocking issue
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Test</CardTitle>
          <CardDescription>
            Test each component of the inspection creation workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runDiagnostic} 
              disabled={isRunning}
              className="w-full"
            >
              <Play className="mr-2 h-4 w-4" />
              {isRunning ? 'Running Diagnostic...' : 'Run Inspection Creation Diagnostic'}
            </Button>
            
            {results.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Diagnostic Results:</h3>
                {results.map((result, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium">{result.step}</div>
                      <div className="text-sm text-gray-600">{result.message}</div>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-blue-600">View Details</summary>
                          <pre className="text-xs bg-gray-50 p-2 mt-1 rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expected Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <div><strong>1.</strong> User clicks "Start Inspection" button</div>
            <div><strong>2.</strong> System validates property access and user permissions</div>
            <div><strong>3.</strong> System inserts new inspection record in database</div>
            <div><strong>4.</strong> Database trigger automatically creates checklist items from static_safety_items</div>
            <div><strong>5.</strong> System verifies checklist items were created</div>
            <div><strong>6.</strong> User is redirected to inspection interface</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}