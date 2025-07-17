import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Database, 
  Camera, 
  Video, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  MapPin,
  Lightbulb,
  Bug,
  RefreshCw,
  Download,
  Eye,
  Settings
} from 'lucide-react';

// Services and hooks
import { supabase } from '@/lib/supabase';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import { performanceTracker } from '@/lib/monitoring/performance-tracker';
import { systemHealthValidator } from '@/lib/integration/system-health';

// Types
interface InspectionDebugData {
  inspection: {
    id: string;
    property_id: string;
    inspector_id: string | null;
    status: string | null;
    start_time: string | null;
    end_time: string | null;
    completed: boolean | null;
    certification_status: string | null;
  };
  property: {
    id: string;
    name: string | null;
    address: string | null;
    vrbo_url: string | null;
    airbnb_url: string | null;
    status: string | null;
  };
  checklistItems: Array<{
    id: string;
    label: string;
    category: string | null;
    evidence_type: string;
    status: string | null;
    ai_status: string | null;
    notes: string | null;
    media_count: number;
  }>;
  media: Array<{
    id: string;
    type: string;
    url: string | null;
    checklist_item_id: string;
    created_at: string | null;
  }>;
  systemHealth: any;
  performanceMetrics: any;
}

export const DebugInspectionPage = () => {
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const navigate = useNavigate();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandling();
  
  const [debugData, setDebugData] = useState<InspectionDebugData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [debugNotes, setDebugNotes] = useState('');

  const loadInspectionDebugData = useCallback(async (id: string) => {
    await withErrorHandling(async () => {
      setIsLoading(true);
      
      try {
        // Load inspection with property details
        const { data: inspection, error: inspectionError } = await supabase
          .from('inspections')
          .select(`
            *,
            properties (
              id, name, address, vrbo_url, airbnb_url, status
            )
          `)
          .eq('id', id)
          .single();

        if (inspectionError) throw inspectionError;

        // Load checklist items with media count
        const { data: checklistItems, error: itemsError } = await supabase
          .from('inspection_checklist_items')
          .select(`
            id, label, category, evidence_type, status, ai_status, notes,
            media!media_checklist_item_id_fkey(count)
          `)
          .eq('inspection_id', id);

        if (itemsError) throw itemsError;

        // Load all media for this inspection
        const { data: media, error: mediaError } = await supabase
          .from('media')
          .select(`
            id, type, url, checklist_item_id, created_at,
            checklist_items!inner(inspection_id)
          `)
          .eq('checklist_items.inspection_id', id);

        if (mediaError) throw mediaError;

        // Get system health
        const systemHealth = await systemHealthValidator.performFullHealthCheck();
        
        // Get performance metrics
        const performanceMetrics = performanceTracker.getMetrics();

        // Process checklist items with media counts
        const processedItems = checklistItems?.map(item => ({
          ...item,
          media_count: Array.isArray(item.media) ? item.media.length : 0
        })) || [];

        setDebugData({
          inspection: inspection,
          property: inspection.properties,
          checklistItems: processedItems,
          media: media || [],
          systemHealth,
          performanceMetrics
        });
        
      } catch (error) {
        console.error('Error loading debug data:', error);
        handleError(error as Error);
      } finally {
        setIsLoading(false);
      }
    });
  }, [withErrorHandling, handleError]);

  useEffect(() => {
    if (inspectionId) {
      loadInspectionDebugData(inspectionId);
    }
  }, [inspectionId, loadInspectionDebugData]);

  const getStatusBadge = (status: string | null) => {
    const statusColors: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'pass': 'bg-green-100 text-green-800',
      'needs_review': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={statusColors[status || 'pending'] || 'bg-gray-100 text-gray-800'}>
        {status || 'unknown'}
      </Badge>
    );
  };

  const refreshData = () => {
    if (inspectionId) {
      loadInspectionDebugData(inspectionId);
    }
  };

  const exportDebugData = () => {
    if (debugData) {
      const exportData = {
        ...debugData,
        timestamp: new Date().toISOString(),
        debugNotes
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inspection-debug-${inspectionId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading debug data...</p>
        </div>
      </div>
    );
  }

  if (!debugData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Debug Data Not Found</AlertTitle>
            <AlertDescription>
              Could not load debug information for inspection {inspectionId}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </Button>
              <div className="h-6 border-l border-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Debug Inspector - {debugData.inspection.id}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {debugData.property.name || debugData.property.address}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={refreshData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportDebugData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error.isError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.error?.message}
              <Button variant="outline" size="sm" onClick={clearError} className="ml-2">
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inspection Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Inspection Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">ID:</span>
                      <p className="font-mono text-xs break-all">{debugData.inspection.id}</p>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <div className="mt-1">{getStatusBadge(debugData.inspection.status)}</div>
                    </div>
                    <div>
                      <span className="font-medium">Started:</span>
                      <p>{debugData.inspection.start_time 
                        ? new Date(debugData.inspection.start_time).toLocaleString()
                        : 'Not started'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Completed:</span>
                      <p>{debugData.inspection.end_time 
                        ? new Date(debugData.inspection.end_time).toLocaleString()
                        : 'Not completed'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Inspector:</span>
                      <p>{debugData.inspection.inspector_id || 'Not assigned'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Certification:</span>
                      <p>{debugData.inspection.certification_status || 'Pending'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>
                      <p>{debugData.property.name || 'Unnamed Property'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Address:</span>
                      <p>{debugData.property.address || 'No address'}</p>
                    </div>
                    <div>
                      <span className="font-medium">VRBO URL:</span>
                      <p className="break-all">{debugData.property.vrbo_url || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Airbnb URL:</span>
                      <p className="break-all">{debugData.property.airbnb_url || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <div className="mt-1">{getStatusBadge(debugData.property.status)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {debugData.checklistItems.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Items</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {debugData.checklistItems.filter(item => item.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {debugData.media.length}
                  </div>
                  <div className="text-sm text-gray-600">Media Files</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {debugData.checklistItems.filter(item => item.ai_status === 'needs_review').length}
                  </div>
                  <div className="text-sm text-gray-600">Need Review</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Checklist Items Analysis</CardTitle>
                <CardDescription>
                  Detailed view of all checklist items and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {debugData.checklistItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.label}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{item.category || 'No category'}</Badge>
                            <Badge variant="outline">{item.evidence_type}</Badge>
                            {getStatusBadge(item.status)}
                            {item.ai_status && getStatusBadge(item.ai_status)}
                          </div>
                          {item.notes && (
                            <p className="text-sm text-gray-600 mt-2">{item.notes}</p>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Camera className="h-4 w-4" />
                            {item.media_count} files
                          </div>
                          <p className="font-mono text-xs mt-1">{item.id}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Media Files</CardTitle>
                <CardDescription>
                  All photos and videos associated with this inspection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {debugData.media.map((mediaItem) => (
                    <div key={mediaItem.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {mediaItem.type === 'photo' ? (
                          <Camera className="h-4 w-4" />
                        ) : (
                          <Video className="h-4 w-4" />
                        )}
                        <span className="font-medium capitalize">{mediaItem.type}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Item ID:</span> {mediaItem.checklist_item_id}</p>
                        <p><span className="font-medium">Created:</span> {
                          mediaItem.created_at 
                            ? new Date(mediaItem.created_at).toLocaleString()
                            : 'Unknown'
                        }</p>
                        {mediaItem.url && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open(mediaItem.url!, '_blank')}
                            className="mt-2"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {debugData.media.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No media files found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Performance monitoring and metrics for this inspection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(debugData.performanceMetrics, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Current system health and component status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Overall Status:</span>
                    {getStatusBadge(debugData.systemHealth.overall)}
                  </div>
                  
                  <div className="space-y-2">
                    {debugData.systemHealth.checks?.map((check: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <span className="font-medium">{check.component}</span>
                          <p className="text-sm text-gray-600">{check.description}</p>
                        </div>
                        {getStatusBadge(check.status)}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Debug Tab */}
          <TabsContent value="debug" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Debug Notes & Raw Data
                </CardTitle>
                <CardDescription>
                  Add debug notes and view raw inspection data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Debug Notes</label>
                  <Textarea
                    value={debugNotes}
                    onChange={(e) => setDebugNotes(e.target.value)}
                    placeholder="Add your debug notes here..."
                    className="min-h-[100px]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Raw Debug Data</label>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-auto max-h-96">
                    {JSON.stringify(debugData, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DebugInspectionPage;