/**
 * Amenity Fields Component
 * Extracted from PropertyFormFields.tsx
 */

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { FormData } from "@/hooks/usePropertyFormValidation";
import { ScrapedPropertyData } from "@/types/scraped-data";

interface VRBOState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  scrapedData: ScrapedPropertyData | null;
  jobId?: string;
  urlValidation?: {
    isValid: boolean;
    error?: string;
    warnings?: string[];
  };
  canRetryLater?: boolean;
  backgroundProcessing?: boolean;
}

interface URLValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

interface AmenityFieldsProps {
  safeFormData: FormData;
  safeFormErrors: Record<string, string>;
  vrboState: VRBOState;
  urlValidation: URLValidation;
  isValidVRBOUrl: boolean;
  onUrlChange: (url: string) => void;
  onScrapeVRBO: () => Promise<void>;
}

export const AmenityFields: React.FC<AmenityFieldsProps> = ({
  safeFormData,
  safeFormErrors,
  vrboState,
  urlValidation,
  isValidVRBOUrl,
  onUrlChange,
  onScrapeVRBO,
}) => {
  return (
    <div id="amenity-fields" className="space-y-2">
      <Label htmlFor="vrbo_url">Vrbo Listing URL</Label>
      <div className="flex gap-2">
        <Input
          id="vrbo_url"
          type="url"
          value={safeFormData.vrbo_url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://www.vrbo.com/..."
          className={safeFormErrors.vrbo_url ? "border-red-500" : ""}
        />
        <Button
          type="button"
          variant="outline"
          onClick={onScrapeVRBO}
          disabled={
            vrboState.isLoading || !safeFormData.vrbo_url || !isValidVRBOUrl
          }
          className="shrink-0"
        >
          {vrboState.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          {vrboState.isLoading ? "Importing..." : "Import"}
        </Button>
      </div>

      {/* VRBO Scraping Status */}
      {vrboState.isSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Successfully imported property data from VRBO!
            {vrboState.scrapedData && (
              <span className="block text-sm mt-1">
                Found {vrboState.scrapedData.specifications?.bedrooms || 0}{" "}
                bedrooms,
                {vrboState.scrapedData.specifications?.bathrooms || 0}{" "}
                bathrooms, and {vrboState.scrapedData.amenities?.length || 0}{" "}
                amenities.
              </span>
            )}
            {vrboState.urlValidation?.warnings?.length > 0 && (
              <span className="block text-xs mt-1 text-green-700">
                📝 {vrboState.urlValidation.warnings.join(", ")}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {vrboState.backgroundProcessing && (
        <Alert className="bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin mr-2" />
            <AlertDescription className="text-blue-800">
              🔄 Initial scraping encountered an issue, but we're automatically
              retrying in the background.
              <strong>You can continue creating the property</strong> - the data
              will be imported automatically when available.
              {vrboState.jobId && (
                <span className="block text-xs mt-1 text-blue-700">
                  Job ID: {vrboState.jobId}
                </span>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {vrboState.error && !vrboState.backgroundProcessing && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            ❌ {vrboState.error}
            {vrboState.canRetryLater && (
              <span className="block text-sm mt-1 text-red-700">
                💡 Don't worry - you can still create the property and we'll try
                to import the data later.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* URL Validation Warnings */}
      {urlValidation.warnings.length > 0 && !vrboState.isSuccess && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            ⚠️ URL will be automatically cleaned for import
          </AlertDescription>
        </Alert>
      )}

      {/* URL Validation Errors */}
      {urlValidation.errors.length > 0 && safeFormData.vrbo_url.trim() && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            🚫 {urlValidation.errors.join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {safeFormErrors.vrbo_url && (
        <p className="text-sm text-red-600">{safeFormErrors.vrbo_url}</p>
      )}
    </div>
  );
};
