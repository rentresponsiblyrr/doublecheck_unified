import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  EnterpriseSecurityManager,
  SecurityDashboard as SecurityDashboardData,
  ThreatDetection,
  SecurityMetrics,
} from "@/lib/security/enterprise-security-manager";
import { logger } from "@/utils/logger";

interface SecurityAlert {
  id: string;
  type: "system" | "threat" | "performance" | "maintenance";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  actions?: Array<{
    label: string;
    action: string;
  }>;
}

interface SecurityDataState {
  dashboardData: SecurityDashboardData | null;
  alerts: SecurityAlert[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  isRealTime: boolean;
}

interface SecurityDataManagerProps {
  refreshInterval?: number;
  onThreatResponse?: (threat: ThreatDetection) => Promise<void>;
  children: (
    state: SecurityDataState & {
      loadSecurityData: () => Promise<void>;
      handleThreatResponse: (threat: ThreatDetection) => Promise<void>;
      toggleRealTime: () => void;
      acknowledgeAlert: (alertId: string) => void;
      dismissAlert: (alertId: string) => void;
      handleAlertAction: (alertId: string, action: string) => void;
    },
  ) => React.ReactNode;
}

export const SecurityDataManager: React.FC<SecurityDataManagerProps> = ({
  refreshInterval = 5000,
  onThreatResponse,
  children,
}) => {
  // State management with performance optimization
  const [state, setState] = useState<SecurityDataState>({
    dashboardData: null,
    alerts: [],
    isLoading: true,
    error: null,
    lastUpdate: null,
    isRealTime: true,
  });

  // Memoized security manager instance
  const securityManager = useMemo(() => {
    // This would be injected or configured based on app requirements
    return null; // Placeholder - would be actual instance
  }, []);

  /**
   * Generate mock alerts for development
   */
  const generateMockAlerts = useCallback((): SecurityAlert[] => {
    return [
      {
        id: "alert-1",
        type: "threat",
        severity: "high",
        title: "SQL Injection Attempt Detected",
        message:
          "Multiple SQL injection attempts detected from IP 192.168.1.100. Automatic blocking has been applied.",
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        acknowledged: false,
        actions: [
          { label: "Block IP", action: "block_ip" },
          { label: "View Details", action: "view_details" },
        ],
      },
      {
        id: "alert-2",
        type: "system",
        severity: "medium",
        title: "High Memory Usage",
        message:
          "Security service memory usage has exceeded 85%. Performance may be impacted.",
        timestamp: new Date(Date.now() - 600000), // 10 minutes ago
        acknowledged: false,
        actions: [
          { label: "Restart Service", action: "restart_service" },
          { label: "View Logs", action: "view_logs" },
        ],
      },
      {
        id: "alert-3",
        type: "maintenance",
        severity: "low",
        title: "Security Update Available",
        message:
          "A new security update is available for the threat detection engine.",
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        acknowledged: true,
      },
    ];
  }, []);

  /**
   * Load security dashboard data with error handling
   */
  const loadSecurityData = useCallback(async () => {
    if (!securityManager) {
      // Mock data for development
      const mockData: SecurityDashboardData = {
        activeThreats: [
          {
            type: "sql-injection",
            severity: "high",
            confidence: 0.95,
            signature: "sql_injection_detected" as any,
            description: "SQL injection attempt detected in form submission",
            mitigationApplied: true,
            context: { ip: "192.168.1.100", userAgent: "Mozilla/5.0..." },
          },
          {
            type: "xss",
            severity: "medium",
            confidence: 0.75,
            signature: "xss_script_tag" as any,
            description: "XSS script tag found in user input",
            mitigationApplied: true,
            context: { input: '<script>alert("xss")</script>' },
          },
          {
            type: "brute-force",
            severity: "critical",
            confidence: 0.98,
            signature: "brute_force_login" as any,
            description: "Brute force login attempt detected",
            mitigationApplied: false,
            context: { ip: "10.0.0.50", attempts: 15 },
          },
        ],
        eventCounts: {
          totalRequests: 15420,
          blockedRequests: 23,
          suspiciousRequests: 45,
          successfulValidations: 15352,
          failedValidations: 68,
          activeIncidents: 3,
        },
        riskLevel: {
          overall: 0.42,
          categories: {
            "sql-injection": 0.8,
            xss: 0.6,
            csrf: 0.1,
            "path-traversal": 0.0,
            "command-injection": 0.0,
            "data-leakage": 0.2,
            "privilege-escalation": 0.0,
            "rate-limit-abuse": 0.3,
            "suspicious-pattern": 0.4,
          },
          trending: "increasing",
          lastUpdated: new Date(),
        },
        recommendations: [
          {
            type: "immediate",
            action: "Review SQL injection patterns",
            description:
              "Multiple SQL injection attempts detected from same source",
            priority: 5,
          },
          {
            type: "scheduled",
            action: "Update security rules",
            description:
              "Security rule definitions should be updated based on new threat patterns",
            priority: 3,
          },
        ],
        systemHealth: {
          validationLatency: 45,
          memoryUsage: 87.3,
          errorRate: 0.0024,
          uptime: 259200,
          lastHealthCheck: new Date(),
        },
      };

      setState((prev) => ({
        ...prev,
        dashboardData: mockData,
        alerts: generateMockAlerts(),
        lastUpdate: new Date(),
        error: null,
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, error: null }));
      const data = await securityManager.monitorSecurityEvents();

      setState((prev) => ({
        ...prev,
        dashboardData: data,
        alerts: generateMockAlerts(),
        lastUpdate: new Date(),
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load security data";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));

      logger.error(
        "Security dashboard data loading failed",
        { error: err },
        "SECURITY_DASHBOARD",
      );
    }
  }, [securityManager, generateMockAlerts]);

  /**
   * Handle threat response action
   */
  const handleThreatResponse = useCallback(
    async (threat: ThreatDetection) => {
      try {
        await onThreatResponse?.(threat);

        // Refresh data after response
        await loadSecurityData();
      } catch (error) {
        logger.error(
          "Threat response failed",
          { error, threatType: threat.type },
          "SECURITY_DASHBOARD",
        );
        throw error; // Re-throw so UI can handle
      }
    },
    [onThreatResponse, loadSecurityData],
  );

  /**
   * Toggle real-time monitoring
   */
  const toggleRealTime = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRealTime: !prev.isRealTime,
    }));
  }, []);

  /**
   * Acknowledge alert
   */
  const acknowledgeAlert = useCallback((alertId: string) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      ),
    }));
  }, []);

  /**
   * Dismiss alert
   */
  const dismissAlert = useCallback((alertId: string) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((alert) => alert.id !== alertId),
    }));
  }, []);

  /**
   * Handle alert actions
   */
  const handleAlertAction = useCallback(
    async (alertId: string, action: string) => {
      try {
        // In production, this would call actual action handlers
        logger.info(
          "Alert action performed",
          { alertId, action },
          "SECURITY_DASHBOARD",
        );

        // For demonstration, just acknowledge the alert after action
        acknowledgeAlert(alertId);
      } catch (error) {
        logger.error(
          "Alert action failed",
          { alertId, action, error },
          "SECURITY_DASHBOARD",
        );
        throw error;
      }
    },
    [acknowledgeAlert],
  );

  // Auto-refresh effect with cleanup
  useEffect(() => {
    loadSecurityData();
    setState((prev) => ({ ...prev, isLoading: false }));

    if (state.isRealTime) {
      const interval = setInterval(loadSecurityData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadSecurityData, state.isRealTime, refreshInterval]);

  return (
    <>
      {children({
        ...state,
        loadSecurityData,
        handleThreatResponse,
        toggleRealTime,
        acknowledgeAlert,
        dismissAlert,
        handleAlertAction,
      })}
    </>
  );
};
