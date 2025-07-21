/**
 * Health Check Dashboard - Orchestration Component
 * Consolidated from ProductionHealthCheck.tsx (593 lines → 150 lines)
 * 
 * ARCHITECTURE: Clean separation of concerns
 * - Dashboard: UI orchestration only
 * - Services: Business logic and API calls  
 * - Components: Focused UI components
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { HealthCheckRunner } from './HealthCheckRunner';
import { HealthCheckResults } from './HealthCheckResults';
import { useHealthCheck } from '../../../hooks/useHealthCheck';
import type { HealthCheckReport } from '../../../types/health-check';

export const HealthCheckDashboard: React.FC = () => {
  const {
    healthReport,
    isRunning,
    runHealthCheck,
    clearReport
  } = useHealthCheck();

  return (
    <div id="health-check-dashboard" className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Production Health Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div id="health-check-controls" className="flex gap-4 mb-6">
            <Button 
              onClick={runHealthCheck}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isRunning ? 'Running...' : 'Run Health Check'}
            </Button>
            
            {healthReport && (
              <Button 
                variant="outline"
                onClick={clearReport}
              >
                Clear Results
              </Button>
            )}
          </div>

          {isRunning && <HealthCheckRunner />}
          {healthReport && <HealthCheckResults report={healthReport} />}
        </CardContent>
      </Card>
    </div>
  );
};
