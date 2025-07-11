import React from 'react';
import { AlertTriangle, Clock, RefreshCw, LogOut } from 'lucide-react';

interface SessionWarningProps {
  isVisible: boolean;
  timeUntilLogout: number; // seconds
  onExtendSession: () => void;
  onLogoutNow: () => void;
}

export const SessionWarning: React.FC<SessionWarningProps> = ({
  isVisible,
  timeUntilLogout,
  onExtendSession,
  onLogoutNow
}) => {
  if (!isVisible) return null;

  const minutes = Math.floor(timeUntilLogout / 60);
  const seconds = timeUntilLogout % 60;

  const formatTime = (mins: number, secs: number) => {
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}`;
  };

  const getUrgencyColor = () => {
    if (timeUntilLogout <= 60) return 'border-red-500 bg-red-50'; // Last minute - red
    if (timeUntilLogout <= 180) return 'border-orange-500 bg-orange-50'; // Last 3 minutes - orange
    return 'border-yellow-500 bg-yellow-50'; // Default - yellow
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" />
      
      {/* Warning Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className={`bg-white rounded-lg shadow-2xl border-2 ${getUrgencyColor()} max-w-md w-full`}>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">
                Session Expiring Soon
              </h2>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Your session will expire due to inactivity. You will be automatically logged out in:
              </p>
              
              {/* Countdown Timer */}
              <div className="text-center">
                <div className="inline-flex items-center bg-gray-100 rounded-lg px-4 py-3 mb-4">
                  <Clock className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="text-2xl font-mono font-bold text-gray-900">
                    {formatTime(minutes, seconds)}
                  </span>
                  <span className="text-sm text-gray-600 ml-2">
                    {minutes > 0 ? 'min' : 'sec'}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 text-center">
                Click "Stay Logged In" to continue your session, or "Logout Now" to logout immediately.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onExtendSession}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Stay Logged In
              </button>
              
              <button
                onClick={onLogoutNow}
                className="bg-gray-500 text-white px-4 py-3 rounded-md hover:bg-gray-600 transition-colors font-medium flex items-center justify-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout Now
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-4 text-xs text-gray-500 text-center">
              <p>For security, sessions automatically expire after periods of inactivity.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};