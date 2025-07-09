// React Hook for Property Scraping in STR Certified

import { useState, useCallback, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { VRBOScraper, createVRBOScraper } from '@/lib/scrapers/vrbo-scraper';
import { createPhotoDeduplicator } from '@/lib/scrapers/photo-deduplicator';
import type {
  VRBOPropertyData,
  ScrapingResult,
  ScrapingState,
  ScrapingError,
  PhotoData,
  PhotoDeduplicationResult,
  ScraperConfig
} from '@/lib/scrapers/types';

interface UsePropertyScraperConfig {
  scraperConfig?: Partial<ScraperConfig>;
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
  enablePhotoDeduplication?: boolean;
  photoSimilarityThreshold?: number;
}

interface UsePropertyScraperReturn {
  // Main scraping state
  scrapingState: ScrapingState;
  
  // Scraped data
  propertyData: VRBOPropertyData | null;
  photos: PhotoData[];
  deduplicatedPhotos: PhotoDeduplicationResult | null;
  
  // Actions
  scrapeProperty: (url: string) => Promise<VRBOPropertyData>;
  scrapePhotos: (url: string) => Promise<PhotoData[]>;
  refreshData: () => void;
  clearData: () => void;
  
  // Status
  isLoading: boolean;
  isError: boolean;
  error: ScrapingError | null;
  
  // Utilities
  validateUrl: (url: string) => boolean;
  getDataCompleteness: () => number;
  getScrapingProgress: () => number;
}

export const usePropertyScraper = (
  config: UsePropertyScraperConfig = {}
): UsePropertyScraperReturn => {
  const {
    scraperConfig = {},
    enableAutoRefresh = false,
    refreshInterval = 300000, // 5 minutes
    enablePhotoDeduplication = true,
    photoSimilarityThreshold = 0.85
  } = config;

  // State management
  const [scrapingState, setScrapingState] = useState<ScrapingState>({
    status: 'idle',
    progress: 0
  });

  const [propertyData, setPropertyData] = useState<VRBOPropertyData | null>(null);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [deduplicatedPhotos, setDeduplicatedPhotos] = useState<PhotoDeduplicationResult | null>(null);

  // Scraper instance ref
  const scraperRef = useRef<VRBOScraper | null>(null);
  const currentUrlRef = useRef<string>('');

  // Initialize scraper
  const getScraper = useCallback(() => {
    if (!scraperRef.current) {
      scraperRef.current = createVRBOScraper(scraperConfig);
    }
    return scraperRef.current;
  }, [scraperConfig]);

  // Property scraping mutation
  const propertyScrapingMutation = useMutation({
    mutationFn: async (url: string) => {
      const scraper = getScraper();
      
      setScrapingState({
        status: 'scraping',
        progress: 0,
        currentStep: 'Initializing scraper...'
      });

      try {
        // Step 1: Scrape property details
        setScrapingState(prev => ({
          ...prev,
          progress: 20,
          currentStep: 'Scraping property details...'
        }));

        const result = await scraper.scrapePropertyDetails(url);
        
        if (!result.success) {
          throw new Error(result.errors[0]?.message || 'Scraping failed');
        }

        const data = result.data!;
        setPropertyData(data);

        // Step 2: Scrape and deduplicate photos
        setScrapingState(prev => ({
          ...prev,
          progress: 60,
          currentStep: 'Processing photos...'
        }));

        const photoResult = await scraper.scrapePhotos(url);
        
        if (photoResult.success && photoResult.data) {
          setPhotos(photoResult.data);

          // Step 3: Deduplicate photos if enabled
          if (enablePhotoDeduplication) {
            setScrapingState(prev => ({
              ...prev,
              progress: 80,
              currentStep: 'Deduplicating photos...'
            }));

            const deduplicator = createPhotoDeduplicator(photoSimilarityThreshold);
            const dedupResult = await deduplicator.deduplicatePhotos(photoResult.data);
            setDeduplicatedPhotos(dedupResult);
          }
        }

        // Complete
        setScrapingState({
          status: 'completed',
          progress: 100,
          result
        });

        currentUrlRef.current = url;
        return data;

      } catch (error) {
        const scrapingError: ScrapingError = {
          code: 'SCRAPING_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          severity: 'high',
          recoverable: true
        };

        setScrapingState({
          status: 'error',
          progress: 0,
          error: scrapingError
        });

        throw scrapingError;
      }
    },
    retry: (failureCount, error) => {
      const scrapingError = error as ScrapingError;
      return scrapingError.recoverable && failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
  });

  // Photos-only scraping mutation
  const photoScrapingMutation = useMutation({
    mutationFn: async (url: string) => {
      const scraper = getScraper();
      
      setScrapingState({
        status: 'scraping',
        progress: 0,
        currentStep: 'Scraping photos...'
      });

      try {
        const result = await scraper.scrapePhotos(url);
        
        if (!result.success || !result.data) {
          throw new Error(result.errors[0]?.message || 'Photo scraping failed');
        }

        setPhotos(result.data);

        // Deduplicate if enabled
        if (enablePhotoDeduplication) {
          setScrapingState(prev => ({
            ...prev,
            progress: 80,
            currentStep: 'Deduplicating photos...'
          }));

          const deduplicator = createPhotoDeduplicator(photoSimilarityThreshold);
          const dedupResult = await deduplicator.deduplicatePhotos(result.data);
          setDeduplicatedPhotos(dedupResult);
        }

        setScrapingState({
          status: 'completed',
          progress: 100
        });

        return result.data;

      } catch (error) {
        const scrapingError: ScrapingError = {
          code: 'PHOTO_SCRAPING_FAILED',
          message: error instanceof Error ? error.message : 'Photo scraping failed',
          severity: 'medium',
          recoverable: true
        };

        setScrapingState({
          status: 'error',
          progress: 0,
          error: scrapingError
        });

        throw scrapingError;
      }
    }
  });

  // Auto-refresh query (if enabled)
  const autoRefreshQuery = useQuery({
    queryKey: ['property-scraper-refresh', currentUrlRef.current],
    queryFn: () => {
      if (currentUrlRef.current) {
        return propertyScrapingMutation.mutateAsync(currentUrlRef.current);
      }
      return Promise.resolve(null);
    },
    enabled: enableAutoRefresh && !!currentUrlRef.current,
    refetchInterval: refreshInterval,
    refetchIntervalInBackground: false,
    staleTime: refreshInterval,
  });

  // Helper functions
  const scrapeProperty = useCallback(
    async (url: string) => {
      return propertyScrapingMutation.mutateAsync(url);
    },
    [propertyScrapingMutation]
  );

  const scrapePhotos = useCallback(
    async (url: string) => {
      return photoScrapingMutation.mutateAsync(url);
    },
    [photoScrapingMutation]
  );

  const refreshData = useCallback(() => {
    if (currentUrlRef.current) {
      propertyScrapingMutation.mutate(currentUrlRef.current);
    }
  }, [propertyScrapingMutation]);

  const clearData = useCallback(() => {
    setPropertyData(null);
    setPhotos([]);
    setDeduplicatedPhotos(null);
    setScrapingState({ status: 'idle', progress: 0 });
    currentUrlRef.current = '';
    propertyScrapingMutation.reset();
    photoScrapingMutation.reset();
  }, [propertyScrapingMutation, photoScrapingMutation]);

  const validateUrl = useCallback((url: string): boolean => {
    const vrboPatterns = [
      /^https?:\/\/(www\.)?vrbo\.com\/\d+/,
      /^https?:\/\/(www\.)?homeaway\.com\/\d+/,
      /^https?:\/\/(www\.)?vacationrentals\.com\/\d+/
    ];
    
    return vrboPatterns.some(pattern => pattern.test(url));
  }, []);

  const getDataCompleteness = useCallback((): number => {
    if (!propertyData) return 0;
    
    const requiredFields = ['title', 'description', 'amenities', 'photos', 'rooms'];
    const completedFields = requiredFields.filter(field => {
      const value = propertyData[field as keyof VRBOPropertyData];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      return !!value;
    });
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  }, [propertyData]);

  const getScrapingProgress = useCallback((): number => {
    return scrapingState.progress;
  }, [scrapingState.progress]);

  // Computed values
  const isLoading = propertyScrapingMutation.isPending || photoScrapingMutation.isPending;
  const isError = propertyScrapingMutation.isError || photoScrapingMutation.isError;
  const error = (propertyScrapingMutation.error || photoScrapingMutation.error) as ScrapingError | null;

  return {
    scrapingState,
    propertyData,
    photos,
    deduplicatedPhotos,
    
    scrapeProperty,
    scrapePhotos,
    refreshData,
    clearData,
    
    isLoading,
    isError,
    error,
    
    validateUrl,
    getDataCompleteness,
    getScrapingProgress,
  };
};

// Specialized hooks for specific use cases

export const useVRBOScraper = (config?: UsePropertyScraperConfig) => {
  const {
    scrapeProperty,
    propertyData,
    isLoading,
    isError,
    error,
    scrapingState,
    refreshData,
    clearData,
    validateUrl,
    getDataCompleteness
  } = usePropertyScraper(config);

  return {
    scrapeVRBO: scrapeProperty,
    vrboData: propertyData,
    isLoading,
    isError,
    error,
    scrapingState,
    refreshData,
    clearData,
    validateUrl,
    getDataCompleteness
  };
};

export const usePhotoScraper = (config?: UsePropertyScraperConfig) => {
  const {
    scrapePhotos,
    photos,
    deduplicatedPhotos,
    isLoading,
    isError,
    error,
    clearData
  } = usePropertyScraper(config);

  return {
    scrapePhotos,
    photos,
    deduplicatedPhotos,
    isLoading,
    isError,
    error,
    clearData
  };
};