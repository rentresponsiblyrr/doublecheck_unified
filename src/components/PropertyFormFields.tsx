/**
 * Property Form Fields Component
 * Surgically refactored from 367 lines to component composition
 * Netflix/Meta/Google architectural standards applied
 */

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  usePropertyFormValidation,
  FormData,
} from "@/hooks/usePropertyFormValidation";
import { BasicInfoFields } from "@/components/property/BasicInfoFields";
import { ContactFields } from "@/components/property/ContactFields";
import { AmenityFields } from "@/components/property/AmenityFields";
import { ValidationSummary } from "@/components/property/ValidationSummary";
import { ScrapedPropertyData } from "@/types/scraped-data";

interface PropertyFormFieldsProps {
  formData: FormData;
  formErrors: Record<string, string>;
  onInputChange: (field: string, value: string) => void;
  onVRBODataScraped?: (data: ScrapedPropertyData) => void;
}

export const PropertyFormFields: React.FC<PropertyFormFieldsProps> = ({
  formData,
  formErrors,
  onInputChange,
  onVRBODataScraped,
}) => {
  const {
    safeFormData,
    safeFormErrors,
    vrboState,
    hasAtLeastOneUrl,
    urlValidation,
    isValidVRBOUrl,
    handleScrapeVRBO,
    handleUrlChange,
  } = usePropertyFormValidation({
    formData,
    formErrors,
    onInputChange,
    onVRBODataScraped,
  });

  return (
    <div id="property-form-fields-container" className="space-y-6">
      <BasicInfoFields
        safeFormData={safeFormData}
        safeFormErrors={safeFormErrors}
        onInputChange={onInputChange}
      />

      <ContactFields
        safeFormData={safeFormData}
        safeFormErrors={safeFormErrors}
        onInputChange={onInputChange}
      />

      <AmenityFields
        safeFormData={safeFormData}
        safeFormErrors={safeFormErrors}
        vrboState={vrboState}
        urlValidation={urlValidation}
        isValidVRBOUrl={isValidVRBOUrl}
        onUrlChange={handleUrlChange}
        onScrapeVRBO={handleScrapeVRBO}
      />

      <div id="airbnb-field-section" className="space-y-2">
        <Label htmlFor="airbnb_url" className="text-gray-400">
          Airbnb Listing URL
        </Label>
        <Input
          id="airbnb_url"
          type="url"
          value={safeFormData.airbnb_url}
          onChange={(e) => onInputChange("airbnb_url", e.target.value)}
          placeholder="Coming soon - Airbnb scraper in development"
          className={`bg-gray-50 text-gray-400 cursor-not-allowed ${safeFormErrors.airbnb_url ? "border-red-500" : ""}`}
          disabled
        />
        <p className="text-xs text-gray-500 italic">
          🚧 Airbnb scraper is currently under development. Please use Vrbo
          listings for now.
        </p>
        {safeFormErrors.airbnb_url && (
          <p className="text-sm text-red-600">{safeFormErrors.airbnb_url}</p>
        )}
      </div>

      <ValidationSummary
        hasAtLeastOneUrl={hasAtLeastOneUrl}
        vrboUrl={safeFormData.vrbo_url}
        formErrors={safeFormErrors}
      />
    </div>
  );
};
