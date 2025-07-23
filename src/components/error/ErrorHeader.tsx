/**
 * Error Header Component
 * Extracted from MobileErrorRecovery.tsx
 * Updated to use the proper DoubleCheck logo
 */

import React from "react";
import { Logo } from "@/components/Logo";

export const ErrorHeader: React.FC = () => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="px-4 py-6">
        <div className="flex flex-col items-center text-center">
          {/* DoubleCheck Logo */}
          <div className="mb-2">
            <Logo 
              size="lg" 
              variant="horizontal-strapline"
              showText={true}
              theme="light"
              className="justify-center"
            />
          </div>
          
          {/* Error Recovery Subtitle */}
          <p className="text-sm text-gray-600">Mobile Error Recovery</p>
        </div>
      </div>
    </div>
  );
};
