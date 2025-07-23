/**
 * Mobile Auth Loading Component
 *
 * Simple loading component for mobile authentication.
 * Created to fix build issues.
 */

import React from "react";
import { RefreshCw } from "lucide-react";

interface MobileAuthLoadingProps {
  onRefresh?: () => void;
}

export const MobileAuthLoading: React.FC<MobileAuthLoadingProps> = ({
  onRefresh,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Loading...</h2>
      <p className="text-gray-600 text-center mb-4">
        Please wait while we set up your session.
      </p>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};
