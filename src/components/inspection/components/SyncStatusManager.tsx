/**
 * SYNC STATUS MANAGER COMPONENT
 *
 * Professional component for managing data synchronization status and controls.
 * Extracted from OfflineInspectionWorkflow for better maintainability and
 * single responsibility principle.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";

export interface SyncStatusManagerProps {
  syncInProgress: boolean;
  isOnline: boolean;
  lastSync: Date | null;
  networkQuality: "fast" | "slow" | "offline";
  onManualSync: () => void;
  pendingChanges: number;
  emergencyMode: boolean;
}

export const SyncStatusManager: React.FC<SyncStatusManagerProps> = ({
  syncInProgress,
  isOnline,
  lastSync,
  networkQuality,
  onManualSync,
  pendingChanges,
  emergencyMode,
}) => {
  const getSyncStatusColor = () => {
    if (syncInProgress) return "text-blue-600";
    if (!isOnline) return "text-red-600";
    if (pendingChanges > 0) return "text-yellow-600";
    return "text-green-600";
  };

  const getSyncStatusText = () => {
    if (syncInProgress) return "Syncing...";
    if (!isOnline) return "Offline";
    if (pendingChanges > 0) return `${pendingChanges} pending`;
    return "Synchronized";
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return "Never";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  const getNetworkIcon = () => {
    switch (networkQuality) {
      case "fast":
        return "📶";
      case "slow":
        return "📳";
      case "offline":
        return "📵";
      default:
        return "📶";
    }
  };

  const canSync = isOnline && !syncInProgress && pendingChanges > 0;

  return (
    <div
      id="sync-status-manager"
      className="bg-white border rounded-lg p-4 shadow-sm"
    >
      <div id="sync-header" className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getNetworkIcon()}</span>
          <div>
            <h3 className="font-medium text-gray-800">Data Sync</h3>
            <p className={`text-sm ${getSyncStatusColor()}`}>
              {getSyncStatusText()}
            </p>
          </div>
        </div>

        {/* Manual Sync Button */}
        <button
          id="manual-sync-btn"
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            canSync
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          onClick={onManualSync}
          disabled={!canSync}
        >
          {syncInProgress ? (
            <span className="flex items-center">
              <span className="animate-spin mr-1">⟳</span>
              Syncing
            </span>
          ) : (
            "Sync Now"
          )}
        </button>
      </div>

      {/* Sync Details */}
      <div id="sync-details" className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Last sync:</span>
          <span className="text-gray-800">{formatLastSync(lastSync)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Network:</span>
          <span className={`capitalize ${getSyncStatusColor()}`}>
            {networkQuality}
          </span>
        </div>

        {pendingChanges > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Pending changes:</span>
            <span className="text-yellow-600 font-medium">
              {pendingChanges}
            </span>
          </div>
        )}
      </div>

      {/* Sync Progress Bar */}
      {syncInProgress && (
        <div id="sync-progress" className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse w-1/2"></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Uploading inspection data...
          </p>
        </div>
      )}

      {/* Offline Warning */}
      {!isOnline && (
        <div
          id="offline-warning"
          className="mt-3 bg-red-50 border-l-4 border-red-400 p-3"
        >
          <div className="flex items-center">
            <span className="text-red-400 mr-2">📵</span>
            <div>
              <p className="text-sm font-medium text-red-800">
                Working Offline
              </p>
              <p className="text-xs text-red-700">
                Changes will sync when connection is restored
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Mode Notice */}
      {emergencyMode && (
        <div
          id="emergency-sync-notice"
          className="mt-3 bg-orange-50 border-l-4 border-orange-400 p-3"
        >
          <div className="flex items-center">
            <span className="text-orange-400 mr-2">🚨</span>
            <div>
              <p className="text-sm font-medium text-orange-800">
                Emergency Mode Active
              </p>
              <p className="text-xs text-orange-700">
                Reduced sync frequency to conserve battery
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Network Quality Indicator */}
      {isOnline && networkQuality === "slow" && (
        <div
          id="slow-network-notice"
          className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 p-3"
        >
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">📳</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Slow Network Detected
              </p>
              <p className="text-xs text-yellow-700">
                Sync may take longer than usual
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
