/**
 * Property scraping data interfaces
 * Eliminates any types in property data handling
 */

export interface ScrapedPropertyData {
  propertyName: string;
  address: string;
  vrboUrl?: string;
  airbnbUrl?: string;
  amenities: string[];
  photos: string[];
  description?: string;
  pricing?: {
    baseRate: number;
    cleaningFee: number;
    taxes: number;
    currency: string;
  };
  propertyDetails?: {
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
    squareFeet?: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    zipCode: string;
  };
  scrapedAt: string;
  source: 'vrbo' | 'airbnb' | 'manual';
  confidence: number; // 0-1 confidence in scraped data accuracy
}

export interface ScrapingResult {
  success: boolean;
  data: ScrapedPropertyData | null;
  error?: string;
  warnings?: string[];
  processingTime: number;
}

export interface ScrapingOptions {
  includePhotos: boolean;
  includePricing: boolean;
  includeDescription: boolean;
  timeout: number; // milliseconds
}