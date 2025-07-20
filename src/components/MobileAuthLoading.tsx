
import React from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface MobileAuthLoadingProps {
  onRefresh: () => void;
}

export const MobileAuthLoading: React.FC<MobileAuthLoadingProps> = ({ onRefresh }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <LoadingSpinner message="Loading mobile app..." />
        
        <div className="mt-4 space-y-2">
          <button
            onClick={() => {
              // REMOVED: console.log('📱 Mobile recovery triggered');
              onRefresh();
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline block w-full"
          >
            Taking too long? Tap to refresh
          </button>
          
          <div className="text-xs text-gray-500">
            Mobile optimization active
          </div>
        </div>
      </div>
    </div>
  );
};
