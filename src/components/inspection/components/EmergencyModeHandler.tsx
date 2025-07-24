/**
 * EMERGENCY MODE HANDLER COMPONENT
 *
 * Professional component for managing emergency mode functionality including
 * battery optimization, reduced functionality, and priority task focus.
 * Extracted from OfflineInspectionWorkflow for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import React, { useState } from "react";

export interface EmergencyModeHandlerProps {
  emergencyMode: boolean;
  batteryLevel: number;
  onToggleEmergencyMode: () => void;
  criticalItemsCount: number;
  onViewCriticalItems: () => void;
  isOnline: boolean;
}

export const EmergencyModeHandler: React.FC<EmergencyModeHandlerProps> = ({
  emergencyMode,
  batteryLevel,
  onToggleEmergencyMode,
  criticalItemsCount,
  onViewCriticalItems,
  isOnline,
}) => {
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);

  const shouldShowEmergencyPrompt = batteryLevel < 15 && !emergencyMode;
  const batteryStatusColor =
    batteryLevel < 20
      ? "text-red-600"
      : batteryLevel < 50
        ? "text-yellow-600"
        : "text-green-600";

  const handleEmergencyToggle = () => {
    if (!emergencyMode) {
      setShowEmergencyDialog(true);
    } else {
      onToggleEmergencyMode();
    }
  };

  const confirmEmergencyMode = () => {
    onToggleEmergencyMode();
    setShowEmergencyDialog(false);
  };

  const getEmergencyFeatures = () => [
    "🔋 Reduced screen brightness and animations",
    "📡 Minimal network usage and sync frequency",
    "📷 Simplified camera interface",
    "💾 Aggressive data compression",
    "⚡ Background process suspension",
    "🎯 Focus on critical items only",
  ];

  return (
    <>
      {/* Emergency Mode Toggle */}
      <div
        id="emergency-mode-handler"
        className={`bg-white border rounded-lg p-4 shadow-sm ${
          emergencyMode ? "ring-2 ring-orange-500" : ""
        }`}
      >
        <div
          id="emergency-header"
          className="flex items-center justify-between mb-3"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{emergencyMode ? "🚨" : "🔋"}</span>
            <div>
              <h3 className="font-medium text-gray-800">
                {emergencyMode ? "Emergency Mode Active" : "Battery Status"}
              </h3>
              <p className={`text-sm ${batteryStatusColor}`}>
                {batteryLevel}% remaining
                {emergencyMode && " • Power saving enabled"}
              </p>
            </div>
          </div>

          <button
            id="emergency-toggle-btn"
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              emergencyMode
                ? "bg-orange-600 text-white hover:bg-orange-700"
                : batteryLevel < 20
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={handleEmergencyToggle}
          >
            {emergencyMode ? "Exit Emergency" : "Emergency Mode"}
          </button>
        </div>

        {/* Battery Warning */}
        {shouldShowEmergencyPrompt && (
          <div
            id="battery-warning"
            className="bg-red-50 border-l-4 border-red-400 p-3 mb-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-red-400 mr-2">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Critical Battery Level
                  </p>
                  <p className="text-xs text-red-700">
                    Consider enabling emergency mode to extend battery life
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Mode Status */}
        {emergencyMode && (
          <div id="emergency-status" className="space-y-3">
            <div className="bg-orange-50 border-l-4 border-orange-400 p-3">
              <div className="flex items-center">
                <span className="text-orange-400 mr-2">🚨</span>
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Emergency Mode Optimizations Active
                  </p>
                  <p className="text-xs text-orange-700">
                    Reduced functionality to extend battery life
                  </p>
                </div>
              </div>
            </div>

            {/* Critical Items Alert */}
            {criticalItemsCount > 0 && (
              <div
                id="critical-items-focus"
                className="bg-red-50 border border-red-200 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition-colors"
                onClick={onViewCriticalItems}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">🔴</span>
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Focus on Critical Items
                      </p>
                      <p className="text-xs text-red-700">
                        {criticalItemsCount} critical safety items require
                        attention
                      </p>
                    </div>
                  </div>
                  <span className="text-red-600 text-sm">→</span>
                </div>
              </div>
            )}

            {/* Network Status in Emergency Mode */}
            {!isOnline && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">📵</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Offline Mode
                    </p>
                    <p className="text-xs text-gray-600">
                      All data saved locally for later sync
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Emergency Mode Confirmation Dialog */}
      {showEmergencyDialog && (
        <div
          id="emergency-dialog-overlay"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowEmergencyDialog(false)}
        >
          <div
            id="emergency-dialog"
            className="bg-white rounded-lg p-6 m-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🚨</span>
              <h3 className="text-lg font-semibold text-gray-800">
                Enable Emergency Mode?
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Emergency mode will optimize your device for extended battery life
              by reducing functionality and focusing on critical inspection
              items.
            </p>

            <div id="emergency-features" className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Emergency optimizations:
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                {getEmergencyFeatures().map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">{feature.split(" ")[0]}</span>
                    <span>{feature.substring(feature.indexOf(" ") + 1)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div id="emergency-dialog-actions" className="flex gap-3">
              <button
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setShowEmergencyDialog(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                onClick={confirmEmergencyMode}
              >
                Enable Emergency Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
