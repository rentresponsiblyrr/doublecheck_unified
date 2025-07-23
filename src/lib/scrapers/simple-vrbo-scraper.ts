// Simple, Bulletproof VRBO Scraper for Production Use
// Focuses on reliability over comprehensive features

import { logger } from "../../utils/logger";
import type {
  VRBOPropertyData,
  ScrapingResult,
  ScrapingError,
  PropertyAmenity,
  PropertySpecifications,
  PropertyLocation,
} from "./types";

// Type definitions for JSON-LD and metadata structures
type JsonLdData = {
  "@type"?: string;
  name?: string;
  description?: string;
  numberOfRooms?: string | number;
  numberOfBathrooms?: string | number;
  occupancy?: string | number;
  address?: {
    addressLocality?: string;
    addressRegion?: string;
    addressCountry?: string;
  };
  [key: string]: unknown;
} | null;

type OpenGraphData = {
  title?: string;
  description?: string;
  [key: string]: unknown;
};

type PageMetadata = {
  title?: string;
  description?: string;
  [key: string]: unknown;
};

export interface SimpleScrapingOptions {
  timeout: number;
  userAgent: string;
  followRedirects: boolean;
  maxRetries: number;
}

export class SimpleVRBOScraper {
  private options: SimpleScrapingOptions;

  constructor(options: Partial<SimpleScrapingOptions> = {}) {
    this.options = {
      timeout: 30000,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      followRedirects: true,
      maxRetries: 3,
      ...options,
    };
  }

  /**
   * Scrape VRBO property using simple, reliable HTTP requests
   */
  async scrapePropertyDetails(
    url: string,
  ): Promise<ScrapingResult<VRBOPropertyData>> {
    try {
      logger.info(
        "Starting simple VRBO scraping",
        { url },
        "SIMPLE_VRBO_SCRAPER",
      );

      // Extract property ID from URL
      const propertyId = this.extractPropertyId(url);
      if (!propertyId) {
        return this.createErrorResult(
          "INVALID_URL",
          "Could not extract property ID from URL",
        );
      }

      // Fetch property data
      const htmlContent = await this.fetchPropertyPage(url);

      // Parse property data from HTML
      const propertyData = this.parsePropertyData(htmlContent, propertyId, url);

      logger.info(
        "Simple VRBO scraping completed",
        {
          url,
          title: propertyData.title,
          bedrooms: propertyData.specifications.bedrooms,
          amenities: propertyData.amenities.length,
        },
        "SIMPLE_VRBO_SCRAPER",
      );

      return {
        success: true,
        data: propertyData,
        errors: [],
        metadata: {
          scrapedAt: new Date(),
          duration: 0,
          sourceUrl: url,
          userAgent: this.options.userAgent,
          rateLimited: false,
          dataCompleteness: this.calculateCompleteness(propertyData),
          fieldsScraped: [
            "title",
            "description",
            "amenities",
            "specifications",
            "location",
          ],
          fieldsFailed: [],
        },
      };
    } catch (error) {
      logger.error(
        "Simple VRBO scraping failed",
        { url, error },
        "SIMPLE_VRBO_SCRAPER",
      );

      return this.createErrorResult(
        "SCRAPING_FAILED",
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }

  /**
   * Extract property ID from VRBO URL
   */
  private extractPropertyId(url: string): string | null {
    const patterns = [
      /vrbo\.com\/(\d+)/,
      /vrbo\.com\/vacation-rental\/p(\d+)/,
      /homeaway\.com\/(\d+)/,
      /vacationrentals\.com\/(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * Fetch property page HTML
   */
  private async fetchPropertyPage(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.options.timeout,
    );

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": this.options.userAgent,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
        },
        signal: controller.signal,
        redirect: this.options.followRedirects ? "follow" : "manual",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      if (html.length < 1000) {
        throw new Error(
          "Page content too short - may be blocked or redirected",
        );
      }

      return html;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.options.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Parse property data from HTML content
   */
  private parsePropertyData(
    html: string,
    propertyId: string,
    sourceUrl: string,
  ): VRBOPropertyData {
    // Extract JSON-LD data (most reliable)
    const jsonLdData = this.extractJsonLd(html);

    // Extract Open Graph data as fallback
    const ogData = this.extractOpenGraph(html);

    // Extract page title and meta description
    const pageData = this.extractPageData(html);

    // Combine all data sources
    const title =
      jsonLdData?.name ||
      ogData?.title ||
      pageData.title ||
      `VRBO Property ${propertyId}`;
    const description =
      jsonLdData?.description ||
      ogData?.description ||
      pageData.description ||
      "";

    // Extract specifications
    const specifications = this.extractSpecifications(html, jsonLdData);

    // Extract location
    const location = this.extractLocation(html, jsonLdData);

    // Extract amenities
    const amenities = this.extractAmenities(html);

    const propertyData: VRBOPropertyData = {
      vrboId: propertyId,
      title: this.cleanText(title),
      description: this.cleanText(description),
      sourceUrl,
      specifications,
      location,
      amenities,
      photos: [], // Simple scraper doesn't extract photos
      rooms: [], // Simple scraper doesn't extract detailed room data
      policies: {
        checkIn: "",
        checkOut: "",
        cancellation: "",
        petPolicy: "",
        smokingPolicy: "",
      },
      host: {
        name: "",
        joinDate: "",
        reviewCount: 0,
        responseRate: "",
        languages: [],
      },
      availability: {
        calendar: [],
        minimumStay: 1,
        maximumStay: 365,
        advanceBooking: 365,
      },
      pricing: {
        baseRate: 0,
        currency: "USD",
        fees: [],
        taxes: [],
      },
    };

    return propertyData;
  }

  /**
   * Extract JSON-LD structured data
   */
  private extractJsonLd(html: string): JsonLdData {
    try {
      const jsonLdMatch = html.match(
        /<script[^>]*type=['"]application\/ld\+json['"][^>]*>(.*?)<\/script>/gis,
      );
      if (jsonLdMatch) {
        for (const match of jsonLdMatch) {
          const jsonContent = match
            .replace(/<script[^>]*>/i, "")
            .replace(/<\/script>/i, "");
          try {
            const data = JSON.parse(jsonContent);
            if (
              data["@type"] === "Product" ||
              data["@type"] === "Accommodation"
            ) {
              return data;
            }
          } catch (e) {
            continue;
          }
        }
      }
    } catch (error) {
      logger.warn(
        "Failed to extract JSON-LD data",
        { error },
        "SIMPLE_VRBO_SCRAPER",
      );
    }
    return null;
  }

  /**
   * Extract Open Graph data
   */
  private extractOpenGraph(html: string): OpenGraphData {
    const ogData: OpenGraphData = {};

    const titleMatch = html.match(
      /<meta[^>]*property=['"]og:title['"][^>]*content=['"]([^'"]*)['"]/i,
    );
    if (titleMatch) ogData.title = this.cleanText(titleMatch[1]);

    const descMatch = html.match(
      /<meta[^>]*property=['"]og:description['"][^>]*content=['"]([^'"]*)['"]/i,
    );
    if (descMatch) ogData.description = this.cleanText(descMatch[1]);

    return ogData;
  }

  /**
   * Extract page title and meta description
   */
  private extractPageData(html: string): PageMetadata {
    const pageData: PageMetadata = {};

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) pageData.title = this.cleanText(titleMatch[1]);

    const descMatch = html.match(
      /<meta[^>]*name=['"]description['"][^>]*content=['"]([^'"]*)['"]/i,
    );
    if (descMatch) pageData.description = this.cleanText(descMatch[1]);

    return pageData;
  }

  /**
   * Extract property specifications (bedrooms, bathrooms, etc.)
   */
  private extractSpecifications(
    html: string,
    jsonLd: JsonLdData,
  ): PropertySpecifications {
    let bedrooms = 0;
    let bathrooms = 0;
    let maxGuests = 1;
    const propertyType = "Vacation Rental";

    // Try JSON-LD first
    if (jsonLd) {
      bedrooms = parseInt(jsonLd.numberOfRooms) || bedrooms;
      bathrooms = parseInt(jsonLd.numberOfBathrooms) || bathrooms;
      maxGuests = parseInt(jsonLd.occupancy) || maxGuests;
    }

    // Try text patterns
    const bedroomMatch = html.match(/(\d+)\s*(?:bedroom|bed|br\b)/i);
    if (bedroomMatch) bedrooms = Math.max(bedrooms, parseInt(bedroomMatch[1]));

    const bathroomMatch = html.match(
      /(\d+(?:\.\d+)?)\s*(?:bathroom|bath|ba\b)/i,
    );
    if (bathroomMatch)
      bathrooms = Math.max(bathrooms, parseFloat(bathroomMatch[1]));

    const guestMatch = html.match(/(?:sleeps|accommodates|guests?)\s*(\d+)/i);
    if (guestMatch) maxGuests = Math.max(maxGuests, parseInt(guestMatch[1]));

    return {
      bedrooms: Math.max(1, bedrooms),
      bathrooms: Math.max(1, bathrooms),
      maxGuests: Math.max(1, maxGuests),
      propertyType,
      squareFootage: 0,
    };
  }

  /**
   * Extract location data
   */
  private extractLocation(html: string, jsonLd: JsonLdData): PropertyLocation {
    let city = "";
    let state = "";
    let country = "United States";

    // Try JSON-LD first
    if (jsonLd?.address) {
      city = jsonLd.address.addressLocality || city;
      state = jsonLd.address.addressRegion || state;
      country = jsonLd.address.addressCountry || country;
    }

    // Try text patterns if JSON-LD didn't work
    if (!city || !state) {
      const locationMatch = html.match(
        /([^,]+),\s*([A-Z]{2}),?\s*(United States|USA)?/i,
      );
      if (locationMatch) {
        city = city || locationMatch[1].trim();
        state = state || locationMatch[2].trim();
      }
    }

    return {
      city: this.cleanText(city) || "Unknown",
      state: this.cleanText(state) || "Unknown",
      country: this.cleanText(country),
      zipCode: "",
      coordinates: { latitude: 0, longitude: 0 },
    };
  }

  /**
   * Extract amenities
   */
  private extractAmenities(html: string): PropertyAmenity[] {
    const amenities: PropertyAmenity[] = [];

    // Common VRBO amenities to look for
    const amenityPatterns = [
      { name: "WiFi", patterns: [/wi.?fi/i, /internet/i, /wireless/i] },
      { name: "Kitchen", patterns: [/kitchen/i, /cooking/i] },
      { name: "Parking", patterns: [/parking/i, /garage/i] },
      { name: "Pool", patterns: [/pool/i, /swimming/i] },
      { name: "Hot Tub", patterns: [/hot.?tub/i, /jacuzzi/i, /spa/i] },
      {
        name: "Air Conditioning",
        patterns: [/air.?conditioning/i, /a\/c/i, /ac\b/i],
      },
      { name: "Heating", patterns: [/heating/i, /heat/i] },
      { name: "Fireplace", patterns: [/fireplace/i, /fire.?place/i] },
      { name: "Washer/Dryer", patterns: [/washer/i, /dryer/i, /laundry/i] },
      { name: "Dishwasher", patterns: [/dishwasher/i] },
      { name: "TV", patterns: [/television/i, /\btv\b/i, /cable/i] },
      { name: "Pets Allowed", patterns: [/pet.?friendly/i, /pets?.?allowed/i] },
    ];

    for (const amenity of amenityPatterns) {
      for (const pattern of amenity.patterns) {
        if (pattern.test(html)) {
          amenities.push({
            name: amenity.name,
            category: this.categorizeAmenity(amenity.name),
            priority: "important",
            verified: false,
          });
          break;
        }
      }
    }

    return amenities;
  }

  /**
   * Categorize amenity
   */
  private categorizeAmenity(amenityName: string): string {
    const categories: { [key: string]: string } = {
      WiFi: "connectivity",
      Kitchen: "kitchen",
      Parking: "general",
      Pool: "outdoor",
      "Hot Tub": "outdoor",
      "Air Conditioning": "climate",
      Heating: "climate",
      Fireplace: "entertainment",
      "Washer/Dryer": "laundry",
      Dishwasher: "kitchen",
      TV: "entertainment",
      "Pets Allowed": "general",
    };

    return categories[amenityName] || "general";
  }

  /**
   * Clean text content
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, " ")
      .replace(/[^\w\s\-.,!?()]/g, "")
      .trim();
  }

  /**
   * Calculate data completeness score
   */
  private calculateCompleteness(data: VRBOPropertyData): number {
    let score = 0;
    const maxScore = 10;

    if (data.title && data.title.length > 5) score += 2;
    if (data.description && data.description.length > 20) score += 2;
    if (data.specifications.bedrooms > 0) score += 1;
    if (data.specifications.bathrooms > 0) score += 1;
    if (data.specifications.maxGuests > 0) score += 1;
    if (data.location.city !== "Unknown") score += 1;
    if (data.location.state !== "Unknown") score += 1;
    if (data.amenities.length > 0) score += 1;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Create error result
   */
  private createErrorResult(
    code: string,
    message: string,
  ): ScrapingResult<VRBOPropertyData> {
    const error: ScrapingError = {
      code,
      message,
      severity: "high",
      recoverable: code !== "INVALID_URL",
    };

    return {
      success: false,
      errors: [error],
      metadata: {
        scrapedAt: new Date(),
        duration: 0,
        sourceUrl: "",
        userAgent: this.options.userAgent,
        rateLimited: false,
        dataCompleteness: 0,
        fieldsScraped: [],
        fieldsFailed: ["all"],
      },
    };
  }
}

export const createSimpleVRBOScraper = (
  options?: Partial<SimpleScrapingOptions>,
) => new SimpleVRBOScraper(options);
