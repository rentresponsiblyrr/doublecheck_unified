import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Search,
  Download,
  RefreshCw
} from 'lucide-react';
import { InspectionCleanupService } from '@/services/inspectionCleanupService';

interface CleanupSummary {
  totalInspections: number;
  duplicateGroups: number;
  inspectionsToRemove: number;
  inspectionsToKeep: number;
  safeToDelete: Array<{
    id: string;
    property_id: string;
    property_name: string;
    status: string;
    start_time: string;
    inspector_id: string | null;
    total_checklist_items: number;
    completed_checklist_items: number;
    shouldKeep: boolean;
    reason: string;
  }>;
}

export default function InspectionCleanupUtility() {
  const [analysis, setAnalysis] = useState<CleanupSummary | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResults, setDeleteResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      console.log('🔍 Starting duplicate inspection analysis...');
      
      const summary = await InspectionCleanupService.analyzeDuplicateInspections();
      setAnalysis(summary);
      
      console.log('✅ Analysis complete:', summary);
    } catch (err) {
      console.error('❌ Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performCleanup = async () => {
    if (!analysis || analysis.safeToDelete.length === 0) {
      setError('No inspections to delete');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${analysis.safeToDelete.length} duplicate inspections? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      
      const idsToDelete = analysis.safeToDelete.map(inspection => inspection.id);
      console.log('🧹 Starting cleanup of inspections:', idsToDelete);
      
      await InspectionCleanupService.cleanupDuplicateInspections(idsToDelete);
      
      setDeleteResults(`Successfully deleted ${idsToDelete.length} duplicate inspections`);
      
      // Re-run analysis to show updated state
      await runAnalysis();
      
    } catch (err) {
      console.error('❌ Cleanup failed:', err);
      setError(err instanceof Error ? err.message : 'Cleanup failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const downloadReport = () => {
    if (!analysis) return;
    
    const report = InspectionCleanupService.generateCleanupReport(analysis);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspection-cleanup-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'available':
        return <Badge variant="outline">Available</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspection Cleanup Utility</h1>
          <p className="text-gray-600 mt-1">Analyze and clean up duplicate inspections per property</p>
        </div>
        <div className="flex items-center space-x-2">
          {analysis && (
            <Button variant="outline" onClick={downloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          )}
          <Button onClick={runAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Analyze Duplicates
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {deleteResults && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {deleteResults}
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{analysis.totalInspections}</div>
                <div className="text-sm text-gray-600">Total Inspections</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{analysis.duplicateGroups}</div>
                <div className="text-sm text-orange-600">Properties with Duplicates</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{analysis.inspectionsToRemove}</div>
                <div className="text-sm text-red-600">To Remove</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{analysis.inspectionsToKeep}</div>
                <div className="text-sm text-green-600">To Keep</div>
              </CardContent>
            </Card>
          </div>

          {/* Cleanup Action */}
          {analysis.safeToDelete.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Cleanup Action Required
                </CardTitle>
                <CardDescription>
                  {analysis.safeToDelete.length} duplicate inspections can be safely removed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      These inspections have no progress and are superseded by more recent inspections on the same properties.
                    </p>
                    <p className="text-xs text-gray-500">
                      ⚠️ This action cannot be undone. Please review the list below carefully.
                    </p>
                  </div>
                  <Button 
                    onClick={performCleanup} 
                    disabled={isDeleting}
                    variant="destructive"
                  >
                    {isDeleting ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete {analysis.safeToDelete.length} Duplicates
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed List */}
          {analysis.safeToDelete.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Inspections Recommended for Deletion</CardTitle>
                <CardDescription>
                  Review these carefully before proceeding with cleanup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>Reason for Deletion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.safeToDelete.map((inspection) => (
                        <TableRow key={inspection.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">
                                {inspection.property_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {inspection.id.substring(0, 8)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(inspection.status)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {inspection.completed_checklist_items}/{inspection.total_checklist_items} items
                            </div>
                            {inspection.completed_checklist_items === 0 && (
                              <div className="text-xs text-gray-500">No progress</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(inspection.start_time).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(inspection.start_time).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-700">
                              {inspection.reason}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Duplicates Message */}
          {analysis.safeToDelete.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Cleanup Needed</h3>
                <p className="text-gray-600">
                  All inspections appear to be unique or have significant progress that should be preserved.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Instructions */}
      {!analysis && (
        <Card>
          <CardHeader>
            <CardTitle>How This Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Business Rules</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Only one active inspection per property should exist</li>
                  <li>• Inspections with status "approved", "rejected", or "cancelled" allow new inspections</li>
                  <li>• Inspections in "draft" or "available" status with no progress can be safely removed</li>
                  <li>• Inspections with progress (completed checklist items) are preserved</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">What This Tool Does</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Analyzes all inspections grouped by property</li>
                  <li>• Identifies duplicates that can be safely removed</li>
                  <li>• Preserves inspections with progress or important status</li>
                  <li>• Provides detailed reasoning for each recommendation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}