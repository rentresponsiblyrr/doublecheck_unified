/**
 * User Activity Display Component - Temporary Stub
 * TODO: Implement full user activity tracking display
 */

import React from "react";

export interface UserActivityDisplayProps {
  userActions?: Array<{ action: string; timestamp: string; element?: string }>;
  showUserActions?: boolean;
}

export const UserActivityDisplay: React.FC<UserActivityDisplayProps> = ({
  userActions = [],
  showUserActions = false,
}) => {
  if (!showUserActions || userActions.length === 0) return null;

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h4 className="font-medium text-sm mb-2">Recent User Actions</h4>
      <div className="space-y-1 text-xs text-gray-600">
        {userActions.slice(0, 5).map((action, index) => (
          <div key={index} className="flex justify-between">
            <span>{action.action}</span>
            <span>{action.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
