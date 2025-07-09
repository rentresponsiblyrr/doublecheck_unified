
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";
import { VRBOScraper } from "@/lib/scrapers/vrbo-scraper";
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

  // Check if at least one URL is provided
  const hasVrbo = safeFormData.vrbo_url.trim();
  const hasAirbnb = safeFormData.airbnb_url.trim();
  const hasAtLeastOneUrl = hasVrbo || hasAirbnb;

  // VRBO URL validation
  const isValidVRBOUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    const vrboPatterns = [
      /^https?:\/\/(www\.)?vrbo\.com\/\d+/,
      /^https?:\/\/(www\.)?homeaway\.com\/\d+/,
      /^https?:\/\/(www\.)?vacationrentals\.com\/\d+/
    ];
    return vrboPatterns.some(pattern => pattern.test(url));
  };

  // Handle VRBO data scraping
  const handleScrapeVRBO = async () => {
    if (!safeFormData.vrbo_url || !isValidVRBOUrl(safeFormData.vrbo_url)) {
      setVRBOState(prev => ({ ...prev, error: "Please enter a valid VRBO URL" }));
      return;
    }

    setVRBOState({
      isLoading: true,
      isSuccess: false,
      error: null,
      scrapedData: null
    });

    try {
      const scraper = new VRBOScraper();
      const result = await scraper.scrapePropertyDetails(safeFormData.vrbo_url);

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
          scrapedData: scrapedData
        });

        // Notify parent component
        if (onVRBODataScraped) {
          onVRBODataScraped(scrapedData);
        }

      } else {
        const errorMessage = result.errors?.[0]?.message || "Failed to scrape VRBO data";
        setVRBOState({
          isLoading: false,
          isSuccess: false,
          error: errorMessage,
          scrapedData: null
        });
      }
    } catch (error) {
      console.error('VRBO scraping error:', error);
      setVRBOState({
        isLoading: false,
        isSuccess: false,
        error: "Unable to connect to VRBO. Please try again later.",
        scrapedData: null
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
            Listing URLs * 
            <span className="text-xs font-normal text-gray-500 ml-1">
              (at least one required)
            </span>
          </h3>
          <p className="text-xs text-gray-600">
            Provide at least one listing URL from Vrbo or Airbnb
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
                onInputChange('vrbo_url', e.target.value);
                // Clear VRBO state when URL changes
                if (vrboState.isSuccess || vrboState.error) {
                  setVRBOState(prev => ({ ...prev, isSuccess: false, error: null }));
                }
              }}
              placeholder="https://www.vrbo.com/..."
              className={safeFormErrors.vrbo_url ? "border-red-500" : ""}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleScrapeVRBO}
              disabled={vrboState.isLoading || !safeFormData.vrbo_url || !isValidVRBOUrl(safeFormData.vrbo_url)}
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
                Successfully imported property data from VRBO! 
                {vrboState.scrapedData && (
                  <span className="block text-sm mt-1">
                    Found {vrboState.scrapedData.specifications?.bedrooms || 0} bedrooms, 
                    {vrboState.scrapedData.specifications?.bathrooms || 0} bathrooms, 
                    and {vrboState.scrapedData.amenities?.length || 0} amenities.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {vrboState.error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {vrboState.error}
              </AlertDescription>
            </Alert>
          )}
          
          {safeFormErrors.vrbo_url && (
            <p className="text-sm text-red-600">{safeFormErrors.vrbo_url}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="airbnb_url">Airbnb Listing URL</Label>
          <Input
            id="airbnb_url"
            type="url"
            value={safeFormData.airbnb_url}
            onChange={(e) => onInputChange('airbnb_url', e.target.value)}
            placeholder="https://www.airbnb.com/..."
            className={safeFormErrors.airbnb_url ? "border-red-500" : ""}
          />
          {safeFormErrors.airbnb_url && (
            <p className="text-sm text-red-600">{safeFormErrors.airbnb_url}</p>
          )}
        </div>

        {/* Show general URL requirement error */}
        {safeFormErrors.listing_urls && (
          <p className="text-sm text-red-600">{safeFormErrors.listing_urls}</p>
        )}

        {/* Status indicator */}
        {!hasAtLeastOneUrl && (safeFormData.vrbo_url || safeFormData.airbnb_url) && (
          <p className="text-xs text-orange-600">
            ⚠️ At least one valid listing URL is required
          </p>
        )}
        {hasAtLeastOneUrl && (
          <p className="text-xs text-green-600">
            ✓ Listing URL requirement satisfied
          </p>
        )}
      </div>
    </div>
  );
};
