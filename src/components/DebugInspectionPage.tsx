
import { useParams } from "react-router-dom";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { useDebugInspectionData } from "@/hooks/useDebugInspectionData";
import { debugLogger } from "@/utils/debugLogger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, CheckCircle, XCircle } from "lucide-react";

export const DebugInspectionPage = () => {
  const params = useParams<{ id?: string }>();
  const inspectionId = params.id;
  
  const { user, loading: authLoading, error: authError, isAuthenticated } = useSimpleAuth();
  const { 
    checklistItems, 
    isLoading: dataLoading, 
    refetch, 
    error: dataError 
  } = useDebugInspectionData(inspectionId || '');

  debugLogger.info('DebugPage', 'Render state', {
    inspectionId,
    authLoading,
    dataLoading,
    isAuthenticated,
    itemCount: checklistItems.length,
    hasAuthError: !!authError,
    hasDataError: !!dataError
  });

  const handleRefresh = async () => {
    debugLogger.info('DebugPage', 'Manual refresh triggered');
    await refetch();
  };

  const clearLogs = () => {
    debugLogger.clearLogs();
    debugLogger.info('DebugPage', 'Logs cleared');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!inspectionId) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Missing Inspection ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>No inspection ID found in URL parameters.</p>
            <p className="text-sm text-gray-600 mt-2">
              Current URL: {window.location.pathname}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Debug Inspection: {inspectionId}</span>
              <div className="flex gap-2">
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={clearLogs} variant="outline" size="sm">
                  Clear Logs
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span>Auth: {isAuthenticated ? 'OK' : 'Failed'}</span>
              </div>
              <div className="flex items-center gap-2">
                {dataLoading ? (
                  <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : checklistItems.length > 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                )}
                <span>Data: {dataLoading ? 'Loading' : `${checklistItems.length} items`}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>User: {user?.email || 'None'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Status: {dataError ? 'Error' : 'OK'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Errors */}
        {(authError || dataError) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Errors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="font-medium text-red-800">Auth Error:</p>
                  <p className="text-red-700">{authError}</p>
                </div>
              )}
              {dataError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="font-medium text-red-800">Data Error:</p>
                  <p className="text-red-700">{dataError.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Checklist Items */}
        <Card>
          <CardHeader>
            <CardTitle>Checklist Items ({checklistItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2">Loading checklist items...</span>
              </div>
            ) : checklistItems.length > 0 ? (
              <div className="space-y-2">
                {checklistItems.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.label}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'failed' ? 'bg-red-100 text-red-800' :
                        item.status === 'not_applicable' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status || 'pending'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Category: {item.category} | Type: {item.evidence_type}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>No checklist items found</p>
                <p className="text-sm">The inspection may not have been populated with checklist items.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-xs">
              {debugLogger.getRecentLogs().map((log, index) => (
                <div key={index} className={`p-2 rounded ${
                  log.level === 'error' ? 'bg-red-50 text-red-800' :
                  log.level === 'warn' ? 'bg-yellow-50 text-yellow-800' :
                  log.level === 'info' ? 'bg-blue-50 text-blue-800' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  <span className="opacity-70">[{log.timestamp.split('T')[1].split('.')[0]}]</span>
                  <span className="ml-2 font-medium">[{log.context}]</span>
                  <span className="ml-2">{log.message}</span>
                  {log.data && (
                    <pre className="mt-1 text-xs opacity-80">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
