/**
 * Audit Trail Footer - Focused Component
 *
 * Displays summary information and generation timestamp
 */

import React from "react";

interface AuditTrailFooterProps {
  totalEntries: number;
  className?: string;
}

export const AuditTrailFooter: React.FC<AuditTrailFooterProps> = ({
  totalEntries,
  className = "",
}) => {
  return (
    <div
      className={`mt-4 pt-4 border-t text-sm text-gray-500 ${className}`}
      id="audit-trail-footer"
    >
      <div className="flex justify-between items-center">
        <span>Total Events: {totalEntries}</span>
        <span>
          Generated: {new Date().toLocaleDateString()} at{" "}
          {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};
