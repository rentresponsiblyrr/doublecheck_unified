/**
 * Inspection Header Component
 * Extracted from ProductionInspectionWorkflow.tsx
 * Enhanced with PWA performance status for mobile optimization
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Gauge, Wifi, Battery } from "lucide-react";
import { pwaPerformanceMonitor } from "@/lib/performance/PWAPerformanceMonitor";
import { networkAdaptationEngine } from "@/lib/performance/NetworkAdaptationEngine";
import { batteryOptimizationManager } from "@/lib/performance/BatteryOptimizationManager";

interface InspectionHeaderProps {
  currentUser: string | null;
  showNewInspectionButton: boolean;
  onNewInspection: () => void;
  showPerformanceStatus?: boolean;
}

interface InspectionPerformanceStatus {
  networkMode: string;
  batteryMode: string;
  isOptimal: boolean;
}

export const InspectionHeader: React.FC<InspectionHeaderProps> = ({
  currentUser,
  showNewInspectionButton,
  onNewInspection,
  showPerformanceStatus = true,
}) => {
  const [performanceStatus, setPerformanceStatus] =
    useState<InspectionPerformanceStatus | null>(null);

  const fetchPerformanceStatus = async () => {
    try {
      // Get network adaptation status
      const adaptationState =
        networkAdaptationEngine.getCurrentAdaptationState();
      const networkMode = adaptationState?.currentStrategy?.level || "optimal";

      // Get battery optimization status
      const batteryState = batteryOptimizationManager.getCurrentBatteryState();
      const batteryMode = batteryState?.powerTier || "optimal";

      // Determine if conditions are optimal for inspection
      const isOptimal =
        networkMode === "minimal" &&
        (batteryMode === "green" || batteryMode === "optimal") &&
        navigator.onLine;

      setPerformanceStatus({
        networkMode,
        batteryMode,
        isOptimal,
      });
    } catch (error) {
      // Fallback status
      setPerformanceStatus({
        networkMode: "optimal",
        batteryMode: "optimal",
        isOptimal: true,
      });
    }
  };

  useEffect(() => {
    if (showPerformanceStatus) {
      fetchPerformanceStatus();

      // Update every 60 seconds
      const interval = setInterval(fetchPerformanceStatus, 60000);

      return () => clearInterval(interval);
    }
  }, [showPerformanceStatus]);

  const getNetworkStatusColor = (mode: string) => {
    switch (mode) {
      case "minimal":
        return "text-green-600";
      case "moderate":
        return "text-blue-600";
      case "aggressive":
        return "text-yellow-600";
      case "emergency":
        return "text-red-600";
      default:
        return "text-green-600";
    }
  };

  const getBatteryStatusColor = (mode: string) => {
    switch (mode) {
      case "green":
      case "optimal":
        return "text-green-600";
      case "yellow":
        return "text-yellow-600";
      case "orange":
        return "text-orange-600";
      case "red":
        return "text-red-600";
      default:
        return "text-green-600";
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h1 className="text-3xl font-bold">Inspection Workflow</h1>
        <div className="flex items-center space-x-4 text-gray-600 mt-1">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Role: {currentUser}</span>
          </div>

          {/* Performance status indicators removed per user request */}
        </div>
      </div>

      {showNewInspectionButton && (
        <Button variant="outline" onClick={onNewInspection}>
          Start New Inspection
        </Button>
      )}
    </div>
  );
};
