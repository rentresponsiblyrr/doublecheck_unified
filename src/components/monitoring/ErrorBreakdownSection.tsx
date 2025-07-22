/**
 * Error Breakdown Section - Enterprise Grade
 * 
 * Displays error breakdown by type and recent errors
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorMetrics } from '@/lib/monitoring/inspection-error-monitor';
import { InspectionErrorCode } from '@/lib/database/inspection-creation-service';

interface ErrorBreakdownSectionProps {
  metrics: ErrorMetrics;
}

export const ErrorBreakdownSection: React.FC<ErrorBreakdownSectionProps> = ({ metrics }) => {
  const getErrorCodeDisplayName = (code: InspectionErrorCode): string => {
    return code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div id="error-breakdown-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Errors by Type */}
      <Card id="errors-by-type-card">
        <CardHeader>
          <CardTitle>Errors by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div id="error-types-list" className="space-y-2">
            {Object.entries(metrics.errorsByCode)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([code, count]) => (
                <div key={code} className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {getErrorCodeDisplayName(code as InspectionErrorCode)}
                  </span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))
            }
          </div>
          {Object.keys(metrics.errorsByCode).length === 0 && (
            <p className="text-sm text-muted-foreground">No errors in the selected period</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card id="recent-errors-card">
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div id="recent-errors-list" className="space-y-3 max-h-80 overflow-y-auto">
            {metrics.recentErrors.map((error, index) => (
              <div key={index} className="border-l-2 border-l-red-500 pl-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">
                      {getErrorCodeDisplayName(error.errorCode)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                      {error.message}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={getSeverityColor(error.businessImpact?.severity || 'medium')}
                      className="text-xs"
                    >
                      {error.businessImpact?.severity || 'medium'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {metrics.recentErrors.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent errors</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};