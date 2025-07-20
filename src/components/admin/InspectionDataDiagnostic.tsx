import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Database, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface InspectionDiagnosticData {
  id: string;
  property_id: string;
  property_name: string;
  status: string;
  completed: boolean;
  start_time: string;
  end_time?: string;
  inspector_id?: string;
  created_at: string;
  updated_at: string;
}

export default function InspectionDataDiagnostic() {
  const [propertyName, setPropertyName] = useState('Gearhart Getaway');
  const [isLoading, setIsLoading] = useState(false);
  const [inspectionData, setInspectionData] = useState<InspectionDiagnosticData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [propertyInfo, setPropertyInfo] = useState<any>(null);

  const runDiagnostic = async () => {
    if (!propertyName.trim()) {
      setError('Please enter a property name');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // REMOVED: console.log('🔍 Running diagnostic for property:', propertyName);

      // First, find the property
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('*')
        .ilike('name', `%${propertyName}%`);

      if (propError) {
        throw new Error(`Property query failed: ${propError.message}`);
      }

      if (!properties || properties.length === 0) {
        setError(`No property found matching "${propertyName}"`);
        setIsLoading(false);
        return;
      }

      const property = properties[0];
      setPropertyInfo(property);
      // REMOVED: console.log('🏠 Found property:', property);

      // Get all inspections for this property
      const { data: inspections, error: inspError } = await supabase
        .from('inspections')
        .select('*')
        .eq('property_id', property.id)
        .order('start_time', { ascending: false });

      if (inspError) {
        throw new Error(`Inspections query failed: ${inspError.message}`);
      }

      const diagnosticData: InspectionDiagnosticData[] = (inspections || []).map(inspection => ({
        id: inspection.id,
        property_id: inspection.property_id,
        property_name: property.name,
        status: inspection.status || 'unknown',
        completed: inspection.completed || false,
        start_time: inspection.start_time || inspection.created_at,
        end_time: inspection.end_time,
        inspector_id: inspection.inspector_id,
        created_at: inspection.created_at,
        updated_at: inspection.updated_at
      }));

      setInspectionData(diagnosticData);
      // REMOVED: console.log('📊 Diagnostic data:', diagnosticData);

      // Test the database function too
      const { data: functionResult, error: funcError } = await supabase.rpc('get_properties_with_inspections', {
        _user_id: null
      });

      if (!funcError && functionResult) {
        const propertyInFunction = functionResult.find(p => p.property_name === property.name);
        // REMOVED: console.log('🔧 Database function result for this property:', propertyInFunction);
      } else {
        console.warn('⚠️ Database function failed:', funcError);
      }

    } catch (err) {
      // REMOVED: console.error('❌ Diagnostic failed:', err);
      setError(err instanceof Error ? err.message : 'Diagnostic failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string, completed: boolean) => {
    if (completed && status !== 'completed') {
      return <Badge className="bg-orange-100 text-orange-800">completed={completed}, status={status}</Badge>;
    }
    
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspection Data Diagnostic</h1>
          <p className="text-gray-600 mt-1">Analyze inspection data for debugging multiple inspections issue</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Property Diagnostic
          </CardTitle>
          <CardDescription>
            Enter a property name to analyze its inspection data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Property name (e.g., Gearhart Getaway)"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && runDiagnostic()}
            />
            <Button onClick={runDiagnostic} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Property Info */}
      {propertyInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><strong>ID:</strong> {propertyInfo.id}</div>
              <div><strong>Name:</strong> {propertyInfo.name}</div>
              <div><strong>Status:</strong> {propertyInfo.status}</div>
              <div><strong>Added By:</strong> {propertyInfo.added_by}</div>
              <div><strong>Created:</strong> {new Date(propertyInfo.created_at).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inspection Data */}
      {inspectionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Inspection Analysis ({inspectionData.length} inspections found)
            </CardTitle>
            <CardDescription>
              All inspections for this property, showing the exact database state
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID (shortened)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed Flag</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspectionData.map((inspection) => (
                    <TableRow key={inspection.id}>
                      <TableCell className="font-mono text-xs">
                        {inspection.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(inspection.status, inspection.completed)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={inspection.completed ? "default" : "outline"}>
                          {inspection.completed ? 'TRUE' : 'FALSE'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {inspection.start_time ? new Date(inspection.start_time).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {inspection.end_time ? new Date(inspection.end_time).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {inspection.inspector_id ? `${inspection.inspector_id.substring(0, 8)}...` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(inspection.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary Statistics */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-2 border rounded">
                <div className="font-bold text-lg">{inspectionData.length}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center p-2 border rounded">
                <div className="font-bold text-lg text-green-600">
                  {inspectionData.filter(i => i.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Status = 'completed'</div>
              </div>
              <div className="text-center p-2 border rounded">
                <div className="font-bold text-lg text-blue-600">
                  {inspectionData.filter(i => i.completed === true).length}
                </div>
                <div className="text-sm text-gray-600">completed = true</div>
              </div>
              <div className="text-center p-2 border rounded">
                <div className="font-bold text-lg text-orange-600">
                  {inspectionData.filter(i => i.completed === true && i.status !== 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Inconsistent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}