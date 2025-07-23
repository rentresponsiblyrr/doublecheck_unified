/**
 * Audit Trail Empty State - Focused Component
 *
 * Displays empty state when no audit trail entries are found
 */

import React from "react";
import { FileText } from "lucide-react";

interface AuditTrailEmptyStateProps {
  className?: string;
}

export const AuditTrailEmptyState: React.FC<AuditTrailEmptyStateProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`text-center py-8 text-gray-500 ${className}`}
      id="audit-trail-empty"
    >
      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p>No audit trail entries found for this inspection.</p>
    </div>
  );
};
