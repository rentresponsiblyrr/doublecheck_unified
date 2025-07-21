/**
 * Contact Fields Component
 * Extracted from PropertyFormFields.tsx
 */

import React from 'react';
import { Label } from "@/components/ui/label";
import { FormData } from '@/hooks/usePropertyFormValidation';

// Note: This component is a placeholder for future contact field extensions
// Currently PropertyFormFields focuses on basic info and URLs

interface ContactFieldsProps {
  safeFormData: FormData;
  safeFormErrors: Record<string, string>;
  onInputChange: (field: string, value: string) => void;
}

export const ContactFields: React.FC<ContactFieldsProps> = ({
  safeFormData,
  safeFormErrors,
  onInputChange
}) => {
  return (
    <div id="contact-fields" className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-900">
          Vrbo Listing URL * 
          <span className="text-xs font-normal text-gray-500 ml-1">
            (required)
          </span>
        </h3>
        <p className="text-xs text-gray-600">
          Provide Vrbo listing URL (Airbnb support coming soon)
        </p>
      </div>
    </div>
  );
};