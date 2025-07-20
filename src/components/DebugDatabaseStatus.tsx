/**
 * Development-only component to verify database status
 * Shows real-time database table accessibility and constraint information
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Database, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseVerification, DatabaseStatus } from '@/utils/databaseVerification';

export const DebugDatabaseStatus: React.FC = () => {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const runVerification = async () => {
    setIsLoading(true);
    try {
      const result = await DatabaseVerification.runFullVerification();
      setStatus(result);
    } catch (error) {
      // REMOVED: console.error('Database verification failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development') {
      runVerification();
    }
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          <Database className="w-4 h-4 mr-1" />
          DB Status
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <Card className="bg-white shadow-lg border-2 border-blue-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4" />
              Database Status (DEV)
            </CardTitle>
            <div className="flex gap-1">
              <Button
                onClick={runVerification}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
              >
                Refresh
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="outline"
                className="h-6 px-2"
              >
                <EyeOff className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="text-xs space-y-2">
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : status ? (
            <>
              {/* Tables Status */}
              <div>
                <h4 className="font-medium mb-1">Tables:</h4>
                <div className="space-y-1">
                  {status.tables.map((table) => (
                    <div key={table.name} className="flex items-center gap-2">
                      {table.exists ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-600" />
                      )}
                      <span className={table.exists ? 'text-green-700' : 'text-red-700'}>
                        {table.name}
                      </span>
                      {table.columns && (
                        <span className="text-gray-500">({table.columns.length} cols)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Valid Status Values */}
              <div>
                <h4 className="font-medium mb-1">Valid Inspection Statuses:</h4>
                {status.validStatusValues.length > 0 ? (
                  <div className="text-green-700">
                    {status.validStatusValues.join(', ')}
                  </div>
                ) : (
                  <div className="text-red-700">None found - check constraints!</div>
                )}
              </div>

              {/* Recommendations */}
              {status.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-yellow-600" />
                    Issues:
                  </h4>
                  <div className="space-y-1">
                    {status.recommendations.map((rec, index) => (
                      <div key={index} className="text-yellow-700 text-xs">
                        • {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="border-t pt-2">
                <h4 className="font-medium mb-1">Quick Tests:</h4>
                <div className="flex gap-1 flex-wrap">
                  <Button
                    onClick={() => {
                      // REMOVED: console.log('📊 Current database status:', status);
                      console.table(status.tables);
                    }}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                  >
                    Log Status
                  </Button>
                  <Button
                    onClick={async () => {
                      const isHealthy = await DatabaseVerification.quickHealthCheck();
                      // REMOVED: console.log(`🏥 Quick health check: ${isHealthy ? 'PASSED ✅' : 'FAILED ❌'}`);
                    }}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                  >
                    Health Check
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Click Refresh to check database status
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};