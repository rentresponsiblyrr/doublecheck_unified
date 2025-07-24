/**
 * CRITICAL ITEMS ALERT COMPONENT
 *
 * Professional alert component for displaying critical safety items that
 * require immediate attention. Extracted from OfflineInspectionWorkflow
 * for better maintainability and reusability.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";

export interface CriticalItemsAlertProps {
  criticalItemsCount: number;
  onViewCritical?: () => void;
}

export const CriticalItemsAlert: React.FC<CriticalItemsAlertProps> = ({
  criticalItemsCount,
  onViewCritical,
}) => {
  if (criticalItemsCount === 0) {
    return null;
  }

  return (
    <div
      id="critical-items-alert"
      className="bg-red-50 border-l-4 border-red-400 p-4 cursor-pointer hover:bg-red-100 transition-colors"
      onClick={onViewCritical}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-red-400 text-xl mr-2">⚠️</span>
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Critical Items Pending
            </h3>
            <p className="text-sm text-red-700">
              {criticalItemsCount} critical safety item
              {criticalItemsCount > 1 ? "s" : ""} require
              {criticalItemsCount === 1 ? "s" : ""} immediate attention
            </p>
          </div>
        </div>

        {onViewCritical && (
          <div className="text-red-600 hover:text-red-800">
            <span className="text-sm font-medium">View →</span>
          </div>
        )}
      </div>
    </div>
  );
};
