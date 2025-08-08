import React, { useState, useEffect, useCallback } from "react";
import { debugLogger } from "@/lib/logger/debug-logger";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings } from "lucide-react";
import {
  SystemMetrics,
  ApplicationMetrics,
  DatabaseMetrics,
  SystemHealthScore,
  PerformanceAlert,
  PerformanceTrend,
} from "@/types/performance-monitoring";

import { MetricsOverview } from "./MetricsOverview";
import { SystemHealthPanel } from "./SystemHealthPanel";
import { AlertsManager } from "./AlertsManager";
import { ChartsContainer } from "./ChartsContainer";

interface PerformanceContainerProps {
  refreshIntervalMs?: number;
  showAdvancedMetrics?: boolean;
}

export const PerformanceContainer: React.FC<PerformanceContainerProps> = ({
  refreshIntervalMs = 5000,
  showAdvancedMetrics = false,
}) => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(
    null,
  );
  const [appMetrics, setAppMetrics] = useState<ApplicationMetrics | null>(null);
  const [dbMetrics, setDbMetrics] = useState<DatabaseMetrics | null>(null);
  const [healthScore, setHealthScore] = useState<SystemHealthScore | null>(
    null,
  );
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [cpuTrend, setCpuTrend] = useState<PerformanceTrend[]>([]);
  const [memoryTrend, setMemoryTrend] = useState<PerformanceTrend[]>([]);
  const [responseTimeTrend, setResponseTimeTrend] = useState<
    PerformanceTrend[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [advancedView, setAdvancedView] = useState(showAdvancedMetrics);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mock data for demonstration - replace with actual API calls
      const mockSystemMetrics: SystemMetrics = {
        cpu: {
          usage: Math.random() * 100,
          trend: Math.random() > 0.5 ? "up" : "down",
        },
        memory: {
          usage: Math.random() * 100,
          used: Math.random() * 8000000000,
          total: 16000000000,
        },
        disk: {
          usage: Math.random() * 100,
          used: Math.random() * 500000000000,
          total: 1000000000000,
        },
      };

      const mockAppMetrics: ApplicationMetrics = {
        responseTime: Math.random() * 500,
        requestsPerSecond: Math.random() * 100,
        errorRate: Math.random() * 5,
      };

      const mockDbMetrics: DatabaseMetrics = {
        responseTime: Math.random() * 200,
        connections: Math.floor(Math.random() * 100),
        queryTime: Math.random() * 100,
      };

      setSystemMetrics(mockSystemMetrics);
      setAppMetrics(mockAppMetrics);
      setDbMetrics(mockDbMetrics);

      // Update trends
      const timestamp = Date.now();
      setCpuTrend((prev) => [
        ...prev.slice(-19),
        { timestamp, value: mockSystemMetrics.cpu.usage },
      ]);
      setMemoryTrend((prev) => [
        ...prev.slice(-19),
        { timestamp, value: mockSystemMetrics.memory.usage },
      ]);
      setResponseTimeTrend((prev) => [
        ...prev.slice(-19),
        { timestamp, value: mockAppMetrics.responseTime },
      ]);
    } catch (error) {
      debugLogger.error("Failed to fetch metrics:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshIntervalMs]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div id="performance-container" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Monitoring</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAdvancedView(!advancedView)}
            id="toggle-advanced-view-button"
          >
            <Settings className="h-4 w-4 mr-2" />
            {advancedView ? "Basic" : "Advanced"} View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={isLoading}
            id="refresh-metrics-button"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <MetricsOverview
        systemMetrics={systemMetrics}
        appMetrics={appMetrics}
        dbMetrics={dbMetrics}
        isLoading={isLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartsContainer
            cpuTrend={cpuTrend}
            memoryTrend={memoryTrend}
            responseTimeTrend={responseTimeTrend}
            showAdvancedMetrics={advancedView}
          />
        </div>

        <div>
          <SystemHealthPanel
            healthScore={healthScore}
            alerts={alerts}
            isOnline={isOnline}
          />
        </div>
      </div>

      <AlertsManager
        alerts={alerts}
        onDismissAlert={handleDismissAlert}
        onRefreshAlerts={fetchMetrics}
        alertsEnabled={alertsEnabled}
        onToggleAlerts={setAlertsEnabled}
      />
    </div>
  );
};
