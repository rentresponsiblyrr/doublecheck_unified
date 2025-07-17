/**
 * @fileoverview Inspection Creation Diagnostic Component
 * Comprehensive diagnostic tool for debugging inspection creation failures
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bug, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Database,
  User,
  Settings,
  Play
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticResult {
  category: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export const InspectionCreationDiagnostic: React.FC = () => {
  const [propertyName, setPropertyName] = useState('Rhododendron Mountain Retreat');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const { toast } = useToast();

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runComprehensiveDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // 1. Check current user authentication
      addResult({ category: 'Authentication', status: 'success', message: 'Starting diagnostic...' });
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        addResult({
          category: 'Authentication',
          status: 'error',
          message: 'User not authenticated',
          details: authError
        });
        return;
      }

      addResult({
        category: 'Authentication',
        status: 'success',
        message: `User authenticated: ${user.email}`,
        details: { userId: user.id, email: user.email }
      });

      // 2. Find the specified property
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, name, status, added_by, created_at')
        .ilike('name', `%${propertyName.replace(' ', '%')}%`);

      if (propError) {
        addResult({
          category: 'Property Lookup',
          status: 'error',
          message: 'Failed to query properties',
          details: propError
        });
        return;
      }

      if (!properties || properties.length === 0) {
        addResult({
          category: 'Property Lookup',
          status: 'error',
          message: `Property "${propertyName}" not found`,
          details: { searchTerm: propertyName }
        });
        return;
      }

      const property = properties[0];
      addResult({
        category: 'Property Lookup',
        status: 'success',
        message: `Found property: ${property.name}`,
        details: property
      });

      // 3. Check existing inspections for this property
      const { data: existingInspections, error: inspError } = await supabase
        .from('inspections')
        .select('id, status, completed, start_time, inspector_id, end_time')
        .eq('property_id', property.id)
        .order('start_time', { ascending: false });

      if (inspError) {
        addResult({
          category: 'Inspection History',
          status: 'warning',
          message: 'Failed to query existing inspections',
          details: inspError
        });
      } else {
        addResult({
          category: 'Inspection History',
          status: 'success',
          message: `Found ${existingInspections.length} existing inspections`,
          details: existingInspections
        });
      }

      // 4. Check static safety items
      const { count: safetyItemsCount, error: safetyError } = await supabase
        .from('static_safety_items')
        .select('*', { count: 'exact', head: true })
        .eq('deleted', false)
        .eq('required', true);

      if (safetyError) {
        addResult({
          category: 'Static Safety Items',
          status: 'error',
          message: 'Failed to query static safety items',
          details: safetyError
        });
      } else if (safetyItemsCount === 0) {
        addResult({
          category: 'Static Safety Items',
          status: 'error',
          message: 'No static safety items found - this will prevent checklist creation',
          details: { count: safetyItemsCount }
        });
      } else {
        addResult({
          category: 'Static Safety Items',
          status: 'success',
          message: `Found ${safetyItemsCount} static safety items`,
          details: { count: safetyItemsCount }
        });
      }

      // 5. Test RPC function
      addResult({
        category: 'RPC Function Test',
        status: 'success',
        message: 'Testing create_inspection_secure function...'
      });

      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_inspection_secure', {
        p_property_id: property.id,
        p_inspector_id: user.id
      });

      if (rpcError) {
        addResult({
          category: 'RPC Function Test',
          status: 'error',
          message: 'RPC function failed',
          details: {
            code: rpcError.code,
            message: rpcError.message,
            details: rpcError.details,
            hint: rpcError.hint
          }
        });
      } else {
        addResult({
          category: 'RPC Function Test',
          status: 'success',
          message: 'RPC function succeeded',
          details: rpcResult
        });

        // Clean up test inspection if created
        if (rpcResult) {
          try {
            await supabase
              .from('inspections')
              .delete()
              .eq('id', rpcResult);
            
            addResult({
              category: 'Cleanup',
              status: 'success',
              message: 'Test inspection cleaned up'
            });
          } catch (cleanupError) {
            addResult({
              category: 'Cleanup',
              status: 'warning',
              message: 'Failed to clean up test inspection',
              details: cleanupError
            });
          }
        }
      }

      // 6. Test direct insert fallback
      if (rpcError) {
        addResult({
          category: 'Direct Insert Test',
          status: 'success',
          message: 'Testing direct insert fallback...'
        });

        const { data: insertResult, error: insertError } = await supabase
          .from('inspections')
          .insert({
            property_id: property.id,
            inspector_id: user.id,
            start_time: new Date().toISOString(),
            completed: false,
            status: 'draft'
          })
          .select('id')
          .single();

        if (insertError) {
          addResult({
            category: 'Direct Insert Test',
            status: 'error',
            message: 'Direct insert failed',
            details: {
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint
            }
          });
        } else {
          addResult({
            category: 'Direct Insert Test',
            status: 'success',
            message: 'Direct insert succeeded',
            details: insertResult
          });

          // Clean up test insertion
          try {
            await supabase
              .from('inspections')
              .delete()
              .eq('id', insertResult.id);
            
            addResult({
              category: 'Cleanup',
              status: 'success',
              message: 'Test direct insert cleaned up'
            });
          } catch (cleanupError) {
            addResult({
              category: 'Cleanup',
              status: 'warning',
              message: 'Failed to clean up test direct insert',
              details: cleanupError
            });
          }
        }
      }

      // 7. Check trigger function dependencies
      const { data: auditTableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'checklist_operations_audit')
        .maybeSingle();

      if (!auditTableExists) {
        addResult({
          category: 'Database Dependencies',
          status: 'warning',
          message: 'checklist_operations_audit table not found - may cause trigger failures'
        });
      } else {
        addResult({
          category: 'Database Dependencies',
          status: 'success',
          message: 'Required audit table exists'
        });
      }

      toast({
        title: "Diagnostic Complete",
        description: "Check results for detailed analysis"
      });

    } catch (error) {
      addResult({
        category: 'System Error',
        status: 'error',
        message: 'Diagnostic failed with system error',
        details: error
      });
      
      toast({
        title: "Diagnostic Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Inspection Creation Diagnostic
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            placeholder="Property name to test..."
            className="flex-1"
          />
          <Button 
            onClick={runComprehensiveDiagnostic}
            disabled={isRunning || !propertyName.trim()}
          >
            {isRunning ? (
              <>
                <Settings className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Diagnostic
              </>
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <ScrollArea className="h-96 w-full border rounded-md p-4">
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border-l-4"
                  style={{
                    borderLeftColor: result.status === 'success' ? '#16a34a' :
                                   result.status === 'warning' ? '#d97706' : '#dc2626'
                  }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getStatusColor(result.status)}>
                        {result.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-900 mb-1">{result.message}</p>
                    {result.details && (
                      <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer hover:text-gray-800">
                          Show Details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {results.length > 0 && (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>Diagnostic Summary:</strong> {results.filter(r => r.status === 'success').length} passed, {' '}
              {results.filter(r => r.status === 'warning').length} warnings, {' '}
              {results.filter(r => r.status === 'error').length} errors. 
              {results.some(r => r.status === 'error') && ' Check error details above for specific issues.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default InspectionCreationDiagnostic;