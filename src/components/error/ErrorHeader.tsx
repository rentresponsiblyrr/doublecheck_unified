/**
 * Error Header Component
 * Extracted from MobileErrorRecovery.tsx
 */

import React from 'react';

export const ErrorHeader: React.FC = () => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">DoubleCheck</h1>
          <p className="text-sm text-gray-600 mt-1">Mobile Error Recovery</p>
        </div>
      </div>
    </div>
  );
};