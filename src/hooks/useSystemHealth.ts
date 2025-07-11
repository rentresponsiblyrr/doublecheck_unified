import { useState, useEffect, useCallback } from 'react';
import { HealthCheckService } from '@/lib/monitoring/health-check';
import type { HealthCheckResult } from '@/lib/monitoring/health-check';

interface SystemHealthHook {
  health: HealthCheckResult | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export const useSystemHealth = (refreshInterval: number = 30000): SystemHealthHook => {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const healthCheck = HealthCheckService.getInstance();
      const result = await healthCheck.getFullHealth();
      
      setHealth(result);
      setLastUpdated(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch system health');
      setError(error);
      console.error('System health check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial health check
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Set up periodic refresh
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval]);

  return {
    health,
    isLoading,
    error,
    lastUpdated,
    refresh
  };
};