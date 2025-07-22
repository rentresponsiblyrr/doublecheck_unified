/**
 * Monitoring Loading State - Enterprise Grade
 * 
 * Loading and error states for monitoring dashboard
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface MonitoringLoadingStateProps {
  isLoading: boolean;
  error: string | null;
  className?: string;
}

export const MonitoringLoadingState: React.FC<MonitoringLoadingStateProps> = ({
  isLoading,
  error,
  className = ''
}) => {
  if (error) {
    return (
      <div id="monitoring-error-container" className={`p-8 ${className}`}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Monitoring Unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div id="monitoring-loading-container" className={`flex items-center justify-center p-8 ${className}`}>
        <div id="loading-spinner" className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading monitoring data...</span>
        </div>
      </div>
    );
  }

  return null;
};