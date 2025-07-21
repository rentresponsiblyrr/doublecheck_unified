// Production-Ready VRBO Property Scraper for STR Certified
// Phase 1: Core Infrastructure with real HTTP requests and DOM parsing

import axios, { AxiosInstance } from 'axios';
import { aiDecisionLogger } from '../ai/decision-logger';
import { logger } from '../../utils/logger';
import { errorReporter } from '../monitoring/error-reporter';
import type {
  ScrapedPropertyData,
  VRBOPropertyData,
  ScrapingResult,
  ScrapingError,
  ScrapingMetadata,
  PropertyAmenity,
  PropertyRoom,
  PropertySpecifications,
  PropertyLocation,
  ScraperConfig,
  PhotoData,
  AmenityCategory,
  RoomType
} from './types';

interface RateLimitState {
  requests: number;
  windowStart: number;
  windowSize: number; // milliseconds
}

interface ScrapingSession {
  id: string;
  startTime: number;
  requestCount: number;
  errors: ScrapingError[];
  userAgent: string;
}

// Types for scraped data structures
interface JsonLdData {
  '@type'?: string;
  name?: string;
  description?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  geo?: {
    latitude?: number;
    longitude?: number;
  };
  amenityFeature?: Array<{
    name: string;
    value?: boolean;
  }>;
  numberOfRooms?: number;
  floorSize?: {
    value?: number;
    unitCode?: string;
  };
  starRating?: {
    ratingValue?: number;
  };
  aggregateRating?: {
    ratingValue?: number;
    reviewCount?: number;
  };
  [key: string]: unknown;
}

interface DomScrapedData {
  bedrooms?: number;
  bathrooms?: number;
  guestCapacity?: number;
  squareFootage?: number;
  amenities?: string[];
  houseRules?: string[];
  description?: string;
  [key: string]: unknown;
}

type ScrapingErrorInput = Error | { message: string; [key: string]: unknown; };

export class ProductionVRBOScraper {
  private httpClient: AxiosInstance;
  private config: ScraperConfig;
  private rateLimitState: RateLimitState;
  private currentSession: ScrapingSession | null = null;
  private userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ];

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      timeout: 30000,
      retries: 3,
      userAgent: this.getRandomUserAgent(),
      respectRobotsTxt: true,
      rateLimit: 10, // requests per minute
      enableScreenshots: false,
      ...config
    };

    this.rateLimitState = {
      requests: 0,
      windowStart: Date.now(),
      windowSize: 60000 // 1 minute
    };

    this.httpClient = axios.create({
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'no-cache'
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 500 // Accept 4xx but not 5xx
    });

    // Setup request interceptor for rate limiting
    this.httpClient.interceptors.request.use(
      async (config) => {
        await this.enforceRateLimit();
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Setup response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          await this.handleRateLimitExceeded();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Scrapes comprehensive property details from a VRBO URL
   * @param url - The VRBO property URL
   * @returns Promise<ScrapingResult<VRBOPropertyData>>
   */
  async scrapePropertyDetails(url: string): Promise<ScrapingResult<VRBOPropertyData>> {
    const session = this.startSession();
    const startTime = Date.now();
    
    const metadata: ScrapingMetadata = {
      scrapedAt: new Date(),
      duration: 0,
      sourceUrl: url,
      userAgent: this.config.userAgent,
      rateLimited: false,
      dataCompleteness: 0,
      fieldsScraped: [],
      fieldsFailed: []
    };

    try {
      // Log scraping start
      await aiDecisionLogger.logSimpleDecision(
        `Starting production VRBO scraping: ${url}`,
        'scraping_operation',
        `Production scraping session ${session.id} started`,
        [url],
        'high'
      );

      // Validate URL
      if (!this.isValidVRBOUrl(url)) {
        throw new Error('Invalid VRBO URL provided');
      }

      // Extract property ID
      const propertyId = this.extractPropertyId(url);
      if (!propertyId) {
        throw new Error('Could not extract property ID from URL');
      }

      // Fetch the main property page
      const mainPageData = await this.fetchMainPropertyPage(url);
      
      // Extract structured data from the page
      const propertyData = await this.extractPropertyData(mainPageData, url, propertyId);
      
      // Calculate metadata
      metadata.duration = Date.now() - startTime;
      metadata.dataCompleteness = this.calculateDataCompleteness(propertyData);
      metadata.fieldsScraped = this.getScrapedFields(propertyData);

      logger.info('Production VRBO scraping completed successfully', {
        propertyId,
        duration: metadata.duration,
        dataCompleteness: metadata.dataCompleteness,
        sessionId: session.id
      }, 'VRBO_SCRAPER');

      return {
        success: true,
        data: propertyData,
        errors: [],
        metadata
      };

    } catch (error) {
      const scrapingError = this.createScrapingError(error, 'PROPERTY_SCRAPING_FAILED');
      
      metadata.duration = Date.now() - startTime;
      metadata.fieldsFailed = ['all'];
      
      logger.error('Production VRBO scraping failed', error, 'VRBO_SCRAPER');
      
      errorReporter.reportError(error, {
        context: 'VRBO_SCRAPER',
        url,
        sessionId: session.id,
        metadata
      });

      return {
        success: false,
        errors: [scrapingError],
        metadata
      };
    } finally {
      this.endSession(session);
    }
  }

  /**
   * Fetches the main property page HTML
   * @param url - VRBO property URL
   * @returns Promise<string> - HTML content
   */
  private async fetchMainPropertyPage(url: string): Promise<string> {
    const maxRetries = this.config.retries;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Rotate user agent on retry
        if (attempt > 1) {
          this.httpClient.defaults.headers['User-Agent'] = this.getRandomUserAgent();
        }

        const response = await this.httpClient.get(url);
        
        if (response.status === 200 && response.data) {
          return response.data;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          const backoffDelay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
          await this.delay(backoffDelay);
          
          logger.warn(`VRBO scraping attempt ${attempt} failed, retrying in ${backoffDelay}ms`, {
            error: lastError.message,
            attempt,
            maxRetries
          }, 'VRBO_SCRAPER');
        }
      }
    }

    throw lastError || new Error('Failed to fetch property page');
  }

  /**
   * Extracts property data from HTML content
   * @param html - Raw HTML content
   * @param url - Original URL
   * @param propertyId - Property ID
   * @returns Promise<VRBOPropertyData>
   */
  private async extractPropertyData(html: string, url: string, propertyId: string): Promise<VRBOPropertyData> {
    const extractedData: Partial<VRBOPropertyData> = {
      vrboId: propertyId,
      sourceUrl: url,
      lastUpdated: new Date()
    };

    // Extract JSON-LD structured data
    const jsonLdData = this.extractJsonLdData(html);
    if (jsonLdData) {
      this.mergeJsonLdData(extractedData, jsonLdData);
    }

    // Extract meta tags
    const metaData = this.extractMetaTags(html);
    this.mergeMetaData(extractedData, metaData);

    // Extract from DOM elements
    const domData = this.extractDomData(html);
    this.mergeDomData(extractedData, domData);

    // Set defaults for required fields
    extractedData.title = extractedData.title || 'Property Title Not Found';
    extractedData.description = extractedData.description || 'Property description not available';
    extractedData.amenities = extractedData.amenities || [];
    extractedData.photos = extractedData.photos || [];
    extractedData.rooms = extractedData.rooms || [];
    extractedData.specifications = extractedData.specifications || this.getDefaultSpecifications();
    extractedData.location = extractedData.location || this.getDefaultLocation();
    extractedData.instantBook = extractedData.instantBook ?? false;
    extractedData.cancellationPolicy = extractedData.cancellationPolicy || 'Policy not specified';
    extractedData.houseRules = extractedData.houseRules || [];

    return extractedData as VRBOPropertyData;
  }

  /**
   * Extracts JSON-LD structured data from HTML
   * @param html - HTML content
   * @returns JsonLdData | null
   */
  private extractJsonLdData(html: string): JsonLdData | null {
    try {
      const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
      const matches = html.match(jsonLdRegex);
      
      if (matches) {
        for (const match of matches) {
          const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
          try {
            const data = JSON.parse(jsonContent);
            if (data['@type'] === 'LodgingBusiness' || data['@type'] === 'Place') {
              return data;
            }
          } catch (e) {
            // Continue to next match
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to extract JSON-LD data', error, 'VRBO_SCRAPER');
    }
    return null;
  }

  /**
   * Extracts meta tag data from HTML
   * @param html - HTML content
   * @returns Object
   */
  private extractMetaTags(html: string): Record<string, string> {
    const metaData: Record<string, string> = {};
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) {
      metaData.title = this.cleanText(titleMatch[1]);
    }

    // Extract meta description
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i);
    if (descriptionMatch) {
      metaData.description = this.cleanText(descriptionMatch[1]);
    }

    // Extract Open Graph data
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)/i);
    if (ogTitleMatch) {
      metaData.ogTitle = this.cleanText(ogTitleMatch[1]);
    }

    const ogDescriptionMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)/i);
    if (ogDescriptionMatch) {
      metaData.ogDescription = this.cleanText(ogDescriptionMatch[1]);
    }

    return metaData;
  }

  /**
   * Extracts data from DOM elements using regex patterns
   * @param html - HTML content
   * @returns DomScrapedData
   */
  private extractDomData(html: string): DomScrapedData {
    const domData: DomScrapedData = {};
    
    // Extract bedrooms/bathrooms from common patterns
    const bedroomMatch = html.match(/(\d+)\s*(?:bed|br|bedroom)/i);
    if (bedroomMatch) {
      domData.bedrooms = parseInt(bedroomMatch[1]);
    }

    const bathroomMatch = html.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)/i);
    if (bathroomMatch) {
      domData.bathrooms = parseFloat(bathroomMatch[1]);
    }

    // Extract guest capacity
    const guestMatch = html.match(/(?:sleeps|accommodates|guests?)\s*(\d+)/i);
    if (guestMatch) {
      domData.maxGuests = parseInt(guestMatch[1]);
    }

    // Extract basic amenities from text
    const amenityPatterns = [
      /wifi|internet/i,
      /parking/i,
      /pool/i,
      /hot[\s-]?tub/i,
      /kitchen/i,
      /fireplace/i,
      /air[\s-]?conditioning|a\/c/i,
      /dishwasher/i,
      /washer|laundry/i,
      /tv|television/i
    ];

    const amenityNames = [
      'WiFi',
      'Parking',
      'Pool',
      'Hot Tub',
      'Kitchen',
      'Fireplace',
      'Air Conditioning',
      'Dishwasher',
      'Washer/Dryer',
      'TV'
    ];

    const foundAmenities: PropertyAmenity[] = [];
    
    amenityPatterns.forEach((pattern, index) => {
      if (pattern.test(html)) {
        foundAmenities.push({
          name: amenityNames[index],
          verified: false,
          category: this.categorizeAmenity(amenityNames[index]),
          priority: 'important'
        });
      }
    });

    domData.amenities = foundAmenities;

    return domData;
  }

  /**
   * Categorizes an amenity into a category
   * @param amenityName - Name of the amenity
   * @returns AmenityCategory
   */
  private categorizeAmenity(amenityName: string): AmenityCategory {
    const name = amenityName.toLowerCase();
    
    if (name.includes('kitchen') || name.includes('dishwasher')) return 'kitchen';
    if (name.includes('bathroom') || name.includes('bath')) return 'bathroom';
    if (name.includes('bedroom') || name.includes('bed')) return 'bedroom';
    if (name.includes('pool') || name.includes('hot tub') || name.includes('deck')) return 'outdoor';
    if (name.includes('tv') || name.includes('fireplace') || name.includes('game')) return 'entertainment';
    if (name.includes('wifi') || name.includes('internet')) return 'connectivity';
    if (name.includes('air conditioning') || name.includes('heating')) return 'climate';
    if (name.includes('parking') || name.includes('garage')) return 'parking';
    if (name.includes('washer') || name.includes('dryer') || name.includes('laundry')) return 'laundry';
    if (name.includes('smoke') || name.includes('fire extinguisher')) return 'safety';
    
    return 'general';
  }

  /**
   * Merges JSON-LD data into extracted data
   * @param extractedData - Target data object
   * @param jsonLdData - JSON-LD data
   */
  private mergeJsonLdData(extractedData: Partial<VRBOPropertyData>, jsonLdData: JsonLdData): void {
    if (jsonLdData.name) {
      extractedData.title = this.cleanText(jsonLdData.name);
    }
    
    if (jsonLdData.description) {
      extractedData.description = this.cleanText(jsonLdData.description);
    }
    
    if (jsonLdData.address) {
      extractedData.location = extractedData.location || {} as PropertyLocation;
      
      if (typeof jsonLdData.address === 'string') {
        extractedData.location.address = jsonLdData.address;
      } else if (jsonLdData.address.addressLocality) {
        extractedData.location.city = jsonLdData.address.addressLocality;
        extractedData.location.state = jsonLdData.address.addressRegion;
        extractedData.location.country = jsonLdData.address.addressCountry;
        extractedData.location.zipCode = jsonLdData.address.postalCode;
      }
    }
  }

  /**
   * Merges meta tag data into extracted data
   * @param extractedData - Target data object
   * @param metaData - Meta tag data
   */
  private mergeMetaData(extractedData: Partial<VRBOPropertyData>, metaData: Record<string, string>): void {
    if (!extractedData.title && (metaData.ogTitle || metaData.title)) {
      extractedData.title = metaData.ogTitle || metaData.title;
    }
    
    if (!extractedData.description && (metaData.ogDescription || metaData.description)) {
      extractedData.description = metaData.ogDescription || metaData.description;
    }
  }

  /**
   * Merges DOM data into extracted data
   * @param extractedData - Target data object
   * @param domData - DOM extracted data
   */
  private mergeDomData(extractedData: Partial<VRBOPropertyData>, domData: DomScrapedData): void {
    if (domData.bedrooms || domData.bathrooms || domData.maxGuests) {
      extractedData.specifications = extractedData.specifications || {} as PropertySpecifications;
      
      if (domData.bedrooms) extractedData.specifications.bedrooms = domData.bedrooms;
      if (domData.bathrooms) extractedData.specifications.bathrooms = domData.bathrooms;
      if (domData.maxGuests) extractedData.specifications.maxGuests = domData.maxGuests;
    }
    
    if (domData.amenities?.length > 0) {
      extractedData.amenities = [...(extractedData.amenities || []), ...domData.amenities];
    }
  }

  /**
   * Utility methods
   */
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const windowDuration = this.rateLimitState.windowSize;
    
    // Reset window if expired
    if (now - this.rateLimitState.windowStart >= windowDuration) {
      this.rateLimitState.requests = 0;
      this.rateLimitState.windowStart = now;
    }
    
    // Check if we've exceeded the rate limit
    if (this.rateLimitState.requests >= this.config.rateLimit) {
      const waitTime = windowDuration - (now - this.rateLimitState.windowStart);
      logger.info(`Rate limit reached, waiting ${waitTime}ms`, {}, 'VRBO_SCRAPER');
      await this.delay(waitTime);
      
      // Reset after waiting
      this.rateLimitState.requests = 0;
      this.rateLimitState.windowStart = Date.now();
    }
    
    this.rateLimitState.requests++;
  }

  private async handleRateLimitExceeded(): Promise<void> {
    const backoffTime = 60000; // 1 minute
    logger.warn(`Rate limit exceeded by server, backing off for ${backoffTime}ms`, {}, 'VRBO_SCRAPER');
    await this.delay(backoffTime);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  private startSession(): ScrapingSession {
    const session: ScrapingSession = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: Date.now(),
      requestCount: 0,
      errors: [],
      userAgent: this.config.userAgent
    };
    
    this.currentSession = session;
    return session;
  }

  private endSession(session: ScrapingSession): void {
    if (this.currentSession?.id === session.id) {
      this.currentSession = null;
    }
  }

  private createScrapingError(error: ScrapingErrorInput, code: string): ScrapingError {
    return {
      code,
      message: error instanceof Error ? error.message : 'Unknown error',
      severity: 'high',
      recoverable: true
    };
  }

  private getDefaultSpecifications(): PropertySpecifications {
    return {
      propertyType: 'house',
      bedrooms: 0,
      bathrooms: 0,
      maxGuests: 0
    };
  }

  private getDefaultLocation(): PropertyLocation {
    return {
      city: 'Unknown',
      state: 'Unknown',
      country: 'Unknown'
    };
  }

  // Existing methods from original scraper
  private isValidVRBOUrl(url: string): boolean {
    const vrboPatterns = [
      /^https?:\/\/(www\.)?vrbo\.com\/\d+/,
      /^https?:\/\/(www\.)?homeaway\.com\/\d+/,
      /^https?:\/\/(www\.)?vacationrentals\.com\/\d+/
    ];
    
    return vrboPatterns.some(pattern => pattern.test(url));
  }

  private extractPropertyId(url: string): string | null {
    const match = url.match(/\/(\d+)/);
    return match ? match[1] : null;
  }

  private calculateDataCompleteness(data: VRBOPropertyData): number {
    const requiredFields = [
      'title', 'description', 'amenities', 'photos', 'rooms', 
      'specifications', 'location'
    ];
    
    const optionalFields = [
      'pricing', 'host', 'reviews', 'houseRules', 'nearbyAttractions'
    ];

    let completedRequired = 0;
    let completedOptional = 0;

    requiredFields.forEach(field => {
      if (data[field as keyof VRBOPropertyData] && 
          this.isFieldComplete(data[field as keyof VRBOPropertyData])) {
        completedRequired++;
      }
    });

    optionalFields.forEach(field => {
      if (data[field as keyof VRBOPropertyData] && 
          this.isFieldComplete(data[field as keyof VRBOPropertyData])) {
        completedOptional++;
      }
    });

    const requiredScore = (completedRequired / requiredFields.length) * 80;
    const optionalScore = (completedOptional / optionalFields.length) * 20;

    return Math.round(requiredScore + optionalScore);
  }

  private isFieldComplete(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  private getScrapedFields(data: VRBOPropertyData): string[] {
    const fields: string[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (this.isFieldComplete(value)) {
        fields.push(key);
      }
    });

    return fields;
  }
}

// Export factory function for creating scraper instances
export const createProductionVRBOScraper = (config?: Partial<ScraperConfig>): ProductionVRBOScraper => {
  return new ProductionVRBOScraper(config);
};