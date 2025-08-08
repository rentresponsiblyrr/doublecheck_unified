/**
 * Monitoring Data Manager - Enterprise Grade
 *
 * Handles monitoring data fetching, auto-refresh, and state management
 * following enterprise render props pattern for clean component separation
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { debugLogger } from "@/lib/logger/debug-logger";
import {
  inspectionErrorMonitor,
  ErrorMetrics,
  MonitoringAlert,
  InspectionErrorEvent,
} from "@/lib/monitoring/inspection-error-monitor";

interface MonitoringDataManagerProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  children: (monitoringData: {
    metrics: ErrorMetrics | null;
    alerts: MonitoringAlert[];
    isLoading: boolean;
    lastUpdate: Date;
    refreshData: () => void;
    exportData: () => void;
    error: string | null;
  }) => React.ReactNode;
}

export const MonitoringDataManager: React.FC<MonitoringDataManagerProps> = ({
  autoRefresh = true,
  refreshInterval = 30000,
  children,
}) => {
  const [metrics, setMetrics] = useState<ErrorMetrics | null>(null);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshData = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const currentMetrics = inspectionErrorMonitor.getErrorMetrics();
      const currentAlerts = inspectionErrorMonitor.getActiveAlerts();

      if (mountedRef.current) {
        setMetrics(currentMetrics);
        setAlerts(currentAlerts);
        setLastUpdate(new Date());
      }
    } catch (err) {
      debugLogger.error("Failed to refresh monitoring data:", err);
      if (mountedRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to refresh monitoring data",
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const exportData = useCallback(() => {
    try {
      const monitoringData = inspectionErrorMonitor.exportMonitoringData();
      const dataStr = JSON.stringify(monitoringData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = `inspection-monitoring-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();

      URL.revokeObjectURL(link.href);
    } catch (err) {
      debugLogger.error("Failed to export monitoring data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to export monitoring data",
      );
    }
  }, []);

  // Auto-refresh data
  useEffect(() => {
    refreshData();

    if (autoRefresh) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshData, autoRefresh, refreshInterval]);

  return (
    <>
      {children({
        metrics,
        alerts,
        isLoading,
        lastUpdate,
        refreshData,
        exportData,
        error,
      })}
    </>
  );
};
