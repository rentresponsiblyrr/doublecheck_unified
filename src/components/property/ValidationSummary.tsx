/**
 * Validation Summary Component
 * Extracted from PropertyFormFields.tsx
 */

import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ValidationSummaryProps {
  hasAtLeastOneUrl: boolean;
  vrboUrl: string;
  formErrors: Record<string, string>;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  hasAtLeastOneUrl,
  vrboUrl,
  formErrors,
}) => {
  return (
    <div id="validation-summary" className="space-y-2">
      {/* Show general URL requirement error */}
      {formErrors.listing_urls && (
        <p className="text-sm text-red-600">{formErrors.listing_urls}</p>
      )}

      {/* Status indicator */}
      {!hasAtLeastOneUrl && vrboUrl && (
        <p className="text-xs text-orange-600">
          ⚠️ A valid Vrbo listing URL is required
        </p>
      )}
      {hasAtLeastOneUrl && (
        <p className="text-xs text-green-600">✓ Vrbo listing URL provided</p>
      )}
    </div>
  );
};
