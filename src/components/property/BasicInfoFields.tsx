/**
 * Basic Info Fields Component
 * Extracted from PropertyFormFields.tsx
 */

import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormData } from '@/hooks/usePropertyFormValidation';

interface BasicInfoFieldsProps {
  safeFormData: FormData;
  safeFormErrors: Record<string, string>;
  onInputChange: (field: string, value: string) => void;
}

export const BasicInfoFields: React.FC<BasicInfoFieldsProps> = ({
  safeFormData,
  safeFormErrors,
  onInputChange
}) => {
  return (
    <div id="basic-info-fields" className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Property Name *</Label>
        <Input
          id="name"
          value={safeFormData.name}
          onChange={(e) => onInputChange('name', e.target.value)}
          placeholder="e.g., Cozy Mountain Cabin"
          required
          className={safeFormErrors.name ? "border-red-500" : ""}
        />
        {safeFormErrors.name && (
          <p className="text-sm text-red-600">{safeFormErrors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={safeFormData.address}
          onChange={(e) => onInputChange('address', e.target.value)}
          placeholder="e.g., 123 Main St, Mountain View, CA 94041"
          required
          className={safeFormErrors.address ? "border-red-500" : ""}
        />
        {safeFormErrors.address && (
          <p className="text-sm text-red-600">{safeFormErrors.address}</p>
        )}
      </div>
    </div>
  );
};