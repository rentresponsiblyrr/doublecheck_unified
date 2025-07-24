/**
 * INSPECTION HEADER COMPONENT
 *
 * Professional header component showing inspection progress, status indicators,
 * and network/battery information. Extracted from OfflineInspectionWorkflow
 * for better maintainability and single responsibility.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";

export interface InspectionHeaderProps {
  inspectionName: string;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  networkStatus: {
    isOffline: boolean;
    quality: "fast" | "slow" | "offline";
  };
  batteryLevel: number;
  emergencyMode: boolean;
  syncInProgress: boolean;
}

export const InspectionHeader: React.FC<InspectionHeaderProps> = ({
  inspectionName,
  progress,
  networkStatus,
  batteryLevel,
  emergencyMode,
  syncInProgress,
}) => {
  const networkStatusClass = networkStatus.isOffline
    ? "text-red-600"
    : networkStatus.quality === "fast"
      ? "text-green-600"
      : "text-yellow-600";

  return (
    <header
      id="workflow-header"
      className="bg-white shadow-sm border-b px-4 py-3"
    >
      <div id="inspection-header" className="flex items-center justify-between">
        <div id="inspection-info">
          <h1 className="text-xl font-semibold text-gray-800">
            {inspectionName}
          </h1>
          <p className="text-sm text-gray-600">
            Progress: {progress.percentage}% • {progress.completed} of{" "}
            {progress.total} items
          </p>
        </div>

        <div id="status-indicators" className="flex items-center space-x-4">
          {/* Network Status */}
          <div
            id="network-status"
            className={`flex items-center space-x-1 ${networkStatusClass}`}
          >
            <span className="text-sm font-medium">
              {networkStatus.isOffline
                ? "📵"
                : networkStatus.quality === "fast"
                  ? "📶"
                  : "📳"}
            </span>
            <span className="text-xs capitalize">{networkStatus.quality}</span>
          </div>

          {/* Battery Status */}
          <div
            id="battery-status"
            className={`flex items-center space-x-1 ${batteryLevel < 20 ? "text-red-600" : "text-gray-600"}`}
          >
            <span className="text-sm">🔋</span>
            <span className="text-xs">{batteryLevel}%</span>
          </div>

          {/* Emergency Mode Indicator */}
          {emergencyMode && (
            <div
              id="emergency-mode-indicator"
              className="flex items-center space-x-1 text-orange-600"
            >
              <span className="text-sm">🚨</span>
              <span className="text-xs">Emergency</span>
            </div>
          )}

          {/* Sync Status */}
          {syncInProgress && (
            <div
              id="sync-status"
              className="flex items-center space-x-1 text-blue-600"
            >
              <span className="text-sm animate-spin">⟳</span>
              <span className="text-xs">Syncing</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div id="progress-bar-container" className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            id="progress-bar"
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
      </div>
    </header>
  );
};
