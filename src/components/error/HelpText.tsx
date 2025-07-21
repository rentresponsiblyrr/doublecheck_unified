/**
 * Help Text Component
 * Extracted from MobileErrorRecovery.tsx
 */

import React from 'react';

interface HelpTextProps {
  error?: Error | null;
}

export const HelpText: React.FC<HelpTextProps> = ({ error }) => {
  return (
    <div id="error-help-text" className="mt-6 text-xs text-gray-500 text-center">
      <p>If the problem persists, please contact our support team.</p>
      <p className="mt-1">Error ID: {error ? btoa(error.message).slice(0, 8) : 'UNKNOWN'}</p>
    </div>
  );
};