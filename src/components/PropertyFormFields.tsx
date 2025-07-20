
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";
import { scrapePropertyRobustly, getScrapingJobStatus } from "@/lib/scrapers/robust-scraping-service";
import { validateVRBOURL } from "@/lib/scrapers/url-validator";
import { dynamicChecklistGenerator } from "@/lib/ai/dynamic-checklist-generator";
import type { ScrapedPropertyData } from "@/lib/scrapers/types";

interface FormData {
  name: string;
  address: string;
  vrbo_url: string;
  airbnb_url: string;
}

interface PropertyFormFieldsProps {
  formData: FormData;
  formErrors: Record<string, string>;
  onInputChange: (field: string, value: string) => void;
  onVRBODataScraped?: (data: ScrapedPropertyData) => void;
}

interface VRBOScrapingState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  scrapedData: any | null;
  jobId?: string;
  urlValidation?: any;
  canRetryLater?: boolean;
  backgroundProcessing?: boolean;
}

export const PropertyFormFields = ({ formData, formErrors, onInputChange, onVRBODataScraped }: PropertyFormFieldsProps) => {
  const [vrboState, setVRBOState] = useState<VRBOScrapingState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    scrapedData: null
  });
  // Ensure formData has all required fields with defaults
  const safeFormData = {
    name: formData?.name || "",
    address: formData?.address || "",
    vrbo_url: formData?.vrbo_url || "",
    airbnb_url: formData?.airbnb_url || ""
  };

  const safeFormErrors = formErrors || {};

  // Check if Vrbo URL is provided (Airbnb disabled for now)
  const hasVrbo = safeFormData.vrbo_url.trim();
  const hasAirbnb = false; // Airbnb temporarily disabled
  const hasAtLeastOneUrl = hasVrbo;

  // Real-time URL validation and cleanup
  const validateAndCleanUrl = (url: string) => {
    if (!url.trim()) return { isValid: false, cleanedUrl: '', warnings: [], errors: ['URL is required'] };
    return validateVRBOURL(url);
  };

  const urlValidation = validateAndCleanUrl(safeFormData.vrbo_url);
  const isValidVRBOUrl = urlValidation.isValid;

  // Handle VRBO data scraping with robust retry mechanism
  const handleScrapeVRBO = async () => {
    if (!safeFormData.vrbo_url || !isValidVRBOUrl) {
      setVRBOState(prev => ({ 
        ...prev, 
        error: urlValidation.errors.join(', ') || "Please enter a valid VRBO URL",
        urlValidation 
      }));
      return;
    }

    setVRBOState({
      isLoading: true,
      isSuccess: false,
      error: null,
      scrapedData: null,
      urlValidation,
      backgroundProcessing: false
    });

    try {
      const result = await scrapePropertyRobustly(safeFormData.vrbo_url, {
        source: 'form_submission',
        userId: 'current_user' // TODO: Get from auth context
      });

      if (result.success && result.data) {
        // Auto-fill form fields from scraped data
        const scrapedData = result.data;
        
        // Only update empty fields to avoid overwriting user input
        if (!safeFormData.name && scrapedData.title) {
          onInputChange('name', scrapedData.title);
        }
        
        if (!safeFormData.address && scrapedData.location) {
          const address = `${scrapedData.location.city}, ${scrapedData.location.state}`;
          onInputChange('address', address);
        }

        setVRBOState({
          isLoading: false,
          isSuccess: true,
          error: null,
          scrapedData: scrapedData,
          jobId: result.job?.id,
          urlValidation: result.urlValidation,
          backgroundProcessing: false
        });

        // Notify parent component
        if (onVRBODataScraped) {
          onVRBODataScraped(scrapedData);
        }

      } else if (result.canRetryLater) {
        // Scraping failed but will retry in background
        setVRBOState({
          isLoading: false,
          isSuccess: false,
          error: null,
          scrapedData: null,
          jobId: result.job?.id,
          urlValidation: result.urlValidation,
          canRetryLater: true,
          backgroundProcessing: true
        });
      } else {
        // Scraping failed permanently
        setVRBOState({
          isLoading: false,
          isSuccess: false,
          error: result.message,
          scrapedData: null,
          jobId: result.job?.id,
          urlValidation: result.urlValidation,
          canRetryLater: false,
          backgroundProcessing: false
        });
      }
    } catch (error) {
      // REMOVED: console.error('VRBO scraping service error:', error);
      setVRBOState({
        isLoading: false,
        isSuccess: false,
        error: "System error occurred. Please try again or contact support.",
        scrapedData: null,
        backgroundProcessing: false
      });
    }
  };

  return (
    <div className="space-y-6">
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

      {/* URL Section with Helper Text */}
      <div className="space-y-4">
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

        <div className="space-y-2">
          <Label htmlFor="vrbo_url">Vrbo Listing URL</Label>
          <div className="flex gap-2">
            <Input
              id="vrbo_url"
              type="url"
              value={safeFormData.vrbo_url}
              onChange={(e) => {
                const newUrl = e.target.value;
                onInputChange('vrbo_url', newUrl);
                
                // Clear VRBO state when URL changes significantly
                if (vrboState.isSuccess || vrboState.error || vrboState.backgroundProcessing) {
                  setVRBOState(prev => ({ 
                    ...prev, 
                    isSuccess: false, 
                    error: null, 
                    backgroundProcessing: false,
                    scrapedData: null 
                  }));
                }
              }}
              placeholder="https://www.vrbo.com/..."
              className={safeFormErrors.vrbo_url ? "border-red-500" : ""}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleScrapeVRBO}
              disabled={vrboState.isLoading || !safeFormData.vrbo_url || !isValidVRBOUrl}
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
                    Found {vrboState.scrapedData.specifications?.bedrooms || 0} bedrooms, 
                    {vrboState.scrapedData.specifications?.bathrooms || 0} bathrooms, 
                    and {vrboState.scrapedData.amenities?.length || 0} amenities.
                  </span>
                )}
                {vrboState.urlValidation?.warnings?.length > 0 && (
                  <span className="block text-xs mt-1 text-green-700">
                    📝 {vrboState.urlValidation.warnings.join(', ')}
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
                  🔄 Initial scraping encountered an issue, but we're automatically retrying in the background. 
                  <strong>You can continue creating the property</strong> - the data will be imported automatically when available.
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
                    💡 Don't worry - you can still create the property and we'll try to import the data later.
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
                ⚠️ URL suggestions: {urlValidation.warnings.join(', ')}
              </AlertDescription>
            </Alert>
          )}
          
          {/* URL Validation Errors */}
          {urlValidation.errors.length > 0 && safeFormData.vrbo_url.trim() && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                🚫 {urlValidation.errors.join(', ')}
              </AlertDescription>
            </Alert>
          )}
          
          {safeFormErrors.vrbo_url && (
            <p className="text-sm text-red-600">{safeFormErrors.vrbo_url}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="airbnb_url" className="text-gray-400">Airbnb Listing URL</Label>
          <Input
            id="airbnb_url"
            type="url"
            value={safeFormData.airbnb_url}
            onChange={(e) => onInputChange('airbnb_url', e.target.value)}
            placeholder="Coming soon - Airbnb scraper in development"
            className={`bg-gray-50 text-gray-400 cursor-not-allowed ${safeFormErrors.airbnb_url ? "border-red-500" : ""}`}
            disabled
          />
          <p className="text-xs text-gray-500 italic">
            🚧 Airbnb scraper is currently under development. Please use Vrbo listings for now.
          </p>
          {safeFormErrors.airbnb_url && (
            <p className="text-sm text-red-600">{safeFormErrors.airbnb_url}</p>
          )}
        </div>

        {/* Show general URL requirement error */}
        {safeFormErrors.listing_urls && (
          <p className="text-sm text-red-600">{safeFormErrors.listing_urls}</p>
        )}

        {/* Status indicator */}
        {!hasAtLeastOneUrl && safeFormData.vrbo_url && (
          <p className="text-xs text-orange-600">
            ⚠️ A valid Vrbo listing URL is required
          </p>
        )}
        {hasAtLeastOneUrl && (
          <p className="text-xs text-green-600">
            ✓ Vrbo listing URL provided
          </p>
        )}
      </div>
    </div>
  );
};
