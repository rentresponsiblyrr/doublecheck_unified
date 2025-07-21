/**
 * Health Check Hook
 * Extracted business logic from ProductionHealthCheck.tsx
 */

import { useState, useCallback } from 'react';
import { healthCheckService } from '../services/healthCheckService';
import type { HealthCheckReport } from '../types/health-check';
import { log } from '../lib/utils/logger';

export const useHealthCheck = () => {
  const [healthReport, setHealthReport] = useState<HealthCheckReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runHealthCheck = useCallback(async () => {
    try {
      setIsRunning(true);
      setHealthReport(null);
      
      log('info', 'Starting production health check', { timestamp: new Date().toISOString() });
      
      const report = await healthCheckService.runCompleteHealthCheck();
      
      setHealthReport(report);
      
      log('info', 'Health check completed', { 
        overall: report.overall,
        passedChecks: report.passedChecks,
        totalChecks: report.totalChecks
      });
    } catch (error) {
      log('error', 'Health check failed', { error: error.message });
      
      setHealthReport({
        overall: 'critical',
        passedChecks: 0,
        totalChecks: 1,
        categories: {
          database: [],
          auth: [],
          services: [],
          workflows: [{
            name: 'Health Check System',
            status: 'fail',
            message: 'Failed to run health check',
            error: error.message
          }]
        },
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunning(false);
    }
  }, []);

  const clearReport = useCallback(() => {
    setHealthReport(null);
  }, []);

  return {
    healthReport,
    isRunning,
    runHealthCheck,
    clearReport
  };
};
