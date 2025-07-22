/**
 * Property Form Validation Business Logic Hook
 * Extracted from PropertyFormFields.tsx for surgical refactoring
 */

import { useState, useCallback } from 'react';
import { scrapePropertyRobustly, getScrapingJobStatus } from '@/lib/scrapers/robust-scraping-service';
import { validateVRBOURL } from '@/lib/scrapers/url-validator';
import { ScrapedPropertyData } from '@/types/scraped-data';

export interface FormData {
  name: string;
  address: string;
  vrbo_url: string;
  airbnb_url: string;
}

interface VRBOScrapingState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  scrapedData: ScrapedPropertyData | null;
  jobId?: string;
  urlValidation?: {
    isValid: boolean;
    error?: string;
    extractedData?: Partial<ScrapedPropertyData>;
  };
  canRetryLater?: boolean;
  backgroundProcessing?: boolean;
}

interface UsePropertyFormValidationProps {
  formData: FormData;
  formErrors: Record<string, string>;
  onInputChange: (field: string, value: string) => void;
  onVRBODataScraped?: (data: ScrapedPropertyData) => void;
}

export const usePropertyFormValidation = ({
  formData,
  formErrors,
  onInputChange,
  onVRBODataScraped
}: UsePropertyFormValidationProps) => {
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
  const validateAndCleanUrl = useCallback((url: string) => {
    if (!url.trim()) return { isValid: false, cleanedUrl: '', warnings: [], errors: ['URL is required'] };
    return validateVRBOURL(url);
  }, []);

  const urlValidation = validateAndCleanUrl(safeFormData.vrbo_url);
  const isValidVRBOUrl = urlValidation.isValid;

  // Handle VRBO data scraping with robust retry mechanism
  const handleScrapeVRBO = useCallback(async () => {
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
        userId: 'current_user' // Auth integration handled by parent component
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
      setVRBOState({
        isLoading: false,
        isSuccess: false,
        error: "System error occurred. Please try again or contact support.",
        scrapedData: null,
        backgroundProcessing: false
      });
    }
  }, [safeFormData.vrbo_url, isValidVRBOUrl, urlValidation, onInputChange, onVRBODataScraped]);

  // Handle URL change with state clearing
  const handleUrlChange = useCallback((newUrl: string) => {
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
  }, [onInputChange, vrboState]);

  return {
    // State
    safeFormData,
    safeFormErrors,
    vrboState,
    hasVrbo,
    hasAirbnb,
    hasAtLeastOneUrl,
    urlValidation,
    isValidVRBOUrl,
    
    // Actions
    handleScrapeVRBO,
    handleUrlChange,
    
    // Utils
    validateAndCleanUrl
  };
};