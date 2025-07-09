// Scrapers Module Exports for STR Certified

// VRBO Scraper
export { VRBOScraper, createVRBOScraper, DEFAULT_SCRAPER_CONFIG } from './vrbo-scraper';

// Photo Deduplicator
export { PhotoDeduplicator, createPhotoDeduplicator, deduplicatePhotos } from './photo-deduplicator';

// Types
export type {
  ScrapedPropertyData,
  VRBOPropertyData,
  PropertyAmenity,
  PropertyRoom,
  PropertySpecifications,
  PropertyLocation,
  PropertyPricing,
  HostInformation,
  ReviewSummary,
  ScrapingResult,
  ScrapingError,
  ScrapingMetadata,
  ScrapingState,
  ScrapingStatus,
  ScraperConfig,
  PhotoData,
  PhotoCategory,
  PhotoDeduplicationResult,
  AmenityCategory,
  RoomType,
  RoomSpecifications
} from './types';

// Constants
export const SCRAPER_DEFAULTS = {
  TIMEOUT: 30000,
  RETRIES: 3,
  RATE_LIMIT: 10,
  USER_AGENT: 'STR-Certified-Bot/1.0',
  PHOTO_SIMILARITY_THRESHOLD: 0.85,
} as const;

export const SUPPORTED_PLATFORMS = {
  VRBO: 'vrbo',
  HOMEAWAY: 'homeaway',
  VACATION_RENTALS: 'vacation_rentals',
} as const;

export const AMENITY_CATEGORIES = {
  ESSENTIAL: ['kitchen', 'bathroom', 'connectivity', 'parking'],
  IMPORTANT: ['entertainment', 'outdoor', 'climate', 'laundry'],
  NICE_TO_HAVE: ['safety', 'accessibility', 'general'],
} as const;