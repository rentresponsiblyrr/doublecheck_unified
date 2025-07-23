// Production VRBO Property Scraper for STR Certified
// Uses comprehensive scraping with HTTP client, image extraction, and advanced data parsing

import {
  createComprehensiveVRBOScraper,
  scrapeVRBOProperty as comprehensiveScrape,
} from "./comprehensive-vrbo-scraper";
import { logger } from "../../utils/logger";
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
  RoomType,
} from "./types";

export class VRBOScraper {
  private config: ScraperConfig;
  private comprehensiveScraper: Record<string, unknown>;

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      timeout: 30000,
      retries: 3,
      userAgent: "STR-Certified-Bot/1.0",
      respectRobotsTxt: true,
      rateLimit: 10,
      enableScreenshots: false,
      ...config,
    };

    this.comprehensiveScraper = createComprehensiveVRBOScraper(this.config);
  }

  /**
   * Scrapes comprehensive property details from a VRBO URL using production scraper
   * @param url - The VRBO property URL
   * @returns Promise<ScrapingResult<VRBOPropertyData>>
   */
  async scrapePropertyDetails(
    url: string,
  ): Promise<ScrapingResult<VRBOPropertyData>> {
    try {
      logger.info("Starting VRBO property scraping", { url }, "VRBO_SCRAPER");

      // Use comprehensive scraper for production-ready results
      const result = await comprehensiveScrape(url, {
        includeImages: true,
        includeAdvancedAmenities: true,
        includeDetailedDescriptions: true,
        includeRoomData: true,
        maxImages: 30,
        verifyWithAI: false,
        generateReport: true,
      });

      if (!result.success) {
        logger.error(
          "VRBO scraping failed",
          {
            url,
            errors: result.errors,
            metadata: result.metadata,
          },
          "VRBO_SCRAPER",
        );

        // Return formatted error result
        return {
          success: false,
          errors: result.errors,
          metadata: result.metadata,
        };
      }

      logger.info(
        "VRBO scraping completed successfully",
        {
          url,
          completenessScore: result.data.extractionReport.completenessScore,
          totalDataPoints: result.data.extractionReport.totalDataPoints,
          processingTime: result.data.extractionReport.processingTime,
        },
        "VRBO_SCRAPER",
      );

      return {
        success: true,
        data: result.data.propertyData,
        errors: result.errors,
        metadata: result.metadata,
      };
    } catch (error) {
      logger.error(
        "VRBO scraping encountered unexpected error",
        error,
        "VRBO_SCRAPER",
      );

      const scrapingError: ScrapingError = {
        code: "SCRAPING_FAILED",
        message:
          error instanceof Error ? error.message : "Unknown scraping error",
        severity: "high",
        recoverable: true,
      };

      return {
        success: false,
        errors: [scrapingError],
        metadata: {
          scrapedAt: new Date(),
          duration: 0,
          sourceUrl: url,
          userAgent: this.config.userAgent,
          rateLimited: false,
          dataCompleteness: 0,
          fieldsScraped: [],
          fieldsFailed: ["all"],
        },
      };
    }
  }

  /**
   * Scrapes only photos from a VRBO property using image scraper
   * @param url - The VRBO property URL
   * @returns Promise<ScrapingResult<PhotoData[]>>
   */
  async scrapePhotos(url: string): Promise<ScrapingResult<PhotoData[]>> {
    try {
      const imageResult =
        await this.comprehensiveScraper.imageScraper.scrapeAllImages(url, {
          maxImages: 50,
          includeHighRes: true,
          expandGalleries: true,
          deduplicateImages: true,
          roomCategorization: true,
        });

      return imageResult;
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            code: "PHOTO_SCRAPING_FAILED",
            message:
              error instanceof Error ? error.message : "Photo scraping failed",
            severity: "medium",
            recoverable: true,
          },
        ],
        metadata: {
          scrapedAt: new Date(),
          duration: 0,
          sourceUrl: url,
          userAgent: this.config.userAgent,
          rateLimited: false,
          dataCompleteness: 0,
          fieldsScraped: [],
          fieldsFailed: ["photos"],
        },
      };
    }
  }

  /**
   * Validates if the provided URL is a valid VRBO property URL
   * @param url - URL to validate
   * @returns boolean
   */
  private isValidVRBOUrl(url: string): boolean {
    const vrboPatterns = [
      /^https?:\/\/(www\.)?vrbo\.com\/\d+/,
      /^https?:\/\/(www\.)?homeaway\.com\/\d+/,
      /^https?:\/\/(www\.)?vacationrentals\.com\/\d+/,
    ];

    return vrboPatterns.some((pattern) => pattern.test(url));
  }

  /**
   * Extracts property ID from VRBO URL
   * @param url - VRBO URL
   * @returns string | null
   */
  private extractPropertyId(url: string): string | null {
    const match = url.match(/\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Generates mock property data for testing
   * @param url - Original URL
   * @param propertyId - Property ID
   * @returns Promise<VRBOPropertyData>
   */
  private async getMockPropertyData(
    url: string,
    propertyId: string,
  ): Promise<VRBOPropertyData> {
    // Simulate network delay
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000),
    );

    const mockData: VRBOPropertyData = {
      title: "Luxurious 4BR Mountain Retreat with Hot Tub & Stunning Views",
      description:
        "Escape to this beautifully appointed 4-bedroom, 3-bathroom mountain retreat nestled in the heart of the Colorado Rockies. This spacious home features soaring ceilings, floor-to-ceiling windows, and a wrap-around deck perfect for taking in the breathtaking mountain views. The gourmet kitchen is fully equipped with stainless steel appliances, granite countertops, and everything you need to prepare meals for your group. Relax in the private hot tub under the stars, cozy up by the stone fireplace, or enjoy the game room with pool table and big screen TV. Located just minutes from world-class skiing, hiking trails, and charming downtown shops and restaurants.",

      amenities: [
        {
          name: "Hot Tub",
          verified: true,
          category: "outdoor",
          priority: "important",
          icon: "🛁",
        },
        {
          name: "Fireplace",
          verified: true,
          category: "entertainment",
          priority: "important",
          icon: "🔥",
        },
        {
          name: "Full Kitchen",
          verified: true,
          category: "kitchen",
          priority: "essential",
          icon: "🍳",
        },
        {
          name: "WiFi",
          verified: true,
          category: "connectivity",
          priority: "essential",
          icon: "📶",
        },
        {
          name: "Parking",
          verified: true,
          category: "parking",
          priority: "essential",
          icon: "🚗",
        },
        {
          name: "Pool Table",
          verified: true,
          category: "entertainment",
          priority: "nice_to_have",
          icon: "🎱",
        },
        {
          name: "Mountain Views",
          verified: true,
          category: "general",
          priority: "important",
          icon: "🏔️",
        },
        {
          name: "Deck/Patio",
          verified: true,
          category: "outdoor",
          priority: "important",
          icon: "🏡",
        },
        {
          name: "Washer/Dryer",
          verified: true,
          category: "laundry",
          priority: "important",
          icon: "👕",
        },
        {
          name: "Air Conditioning",
          verified: false,
          category: "climate",
          priority: "nice_to_have",
          icon: "❄️",
        },
        {
          name: "Dishwasher",
          verified: true,
          category: "kitchen",
          priority: "important",
          icon: "🍽️",
        },
        {
          name: "Smart TV",
          verified: true,
          category: "entertainment",
          priority: "important",
          icon: "📺",
        },
      ],

      photos: [
        "https://example.com/photos/exterior-1.jpg",
        "https://example.com/photos/living-room-1.jpg",
        "https://example.com/photos/kitchen-1.jpg",
        "https://example.com/photos/master-bedroom-1.jpg",
        "https://example.com/photos/bathroom-1.jpg",
        "https://example.com/photos/hot-tub-1.jpg",
        "https://example.com/photos/deck-view-1.jpg",
        "https://example.com/photos/game-room-1.jpg",
      ],

      rooms: [
        {
          type: "bedroom",
          count: 4,
          photos: [
            "https://example.com/photos/master-bedroom-1.jpg",
            "https://example.com/photos/bedroom-2.jpg",
            "https://example.com/photos/bedroom-3.jpg",
            "https://example.com/photos/bedroom-4.jpg",
          ],
          amenities: ["King Bed", "Queen Bed", "Twin Beds", "Closet Space"],
          specifications: {
            bedType: "king",
          },
        },
        {
          type: "bathroom",
          count: 3,
          photos: [
            "https://example.com/photos/bathroom-1.jpg",
            "https://example.com/photos/bathroom-2.jpg",
          ],
          amenities: ["Shower", "Bathtub", "Hair Dryer", "Towels"],
          specifications: {
            bathType: "full",
          },
        },
        {
          type: "kitchen",
          count: 1,
          photos: ["https://example.com/photos/kitchen-1.jpg"],
          amenities: [
            "Refrigerator",
            "Stove",
            "Oven",
            "Microwave",
            "Dishwasher",
            "Coffee Maker",
          ],
        },
        {
          type: "living_room",
          count: 1,
          photos: ["https://example.com/photos/living-room-1.jpg"],
          amenities: [
            "Fireplace",
            "Smart TV",
            "Comfortable Seating",
            "Mountain Views",
          ],
        },
      ],

      specifications: {
        propertyType: "house",
        bedrooms: 4,
        bathrooms: 3,
        maxGuests: 10,
        squareFootage: 2800,
        yearBuilt: 2018,
        floors: 2,
        parkingSpaces: 2,
        checkInTime: "4:00 PM",
        checkOutTime: "10:00 AM",
        minimumStay: 2,
      },

      location: {
        city: "Breckenridge",
        state: "Colorado",
        country: "United States",
        zipCode: "80424",
        coordinates: {
          latitude: 39.4817,
          longitude: -106.0384,
        },
        neighborhood: "Peak 7",
        landmarks: ["Breckenridge Ski Resort", "Main Street", "Peak 8 Base"],
      },

      pricing: {
        basePrice: 450,
        cleaningFee: 150,
        serviceFee: 75,
        currency: "USD",
        lastUpdated: new Date(),
      },

      host: {
        name: "Sarah Johnson",
        joinedDate: new Date("2019-03-15"),
        responseRate: 98,
        responseTime: "within an hour",
        languages: ["English"],
      },

      reviews: {
        averageRating: 4.8,
        totalReviews: 127,
        ratingBreakdown: {
          cleanliness: 4.9,
          accuracy: 4.8,
          checkIn: 4.7,
          communication: 4.9,
          location: 4.8,
          value: 4.6,
        },
      },

      lastUpdated: new Date(),
      sourceUrl: url,

      // VRBO-specific fields
      vrboId: propertyId,
      instantBook: true,
      propertyManager: "Rocky Mountain Retreats",
      cancellationPolicy:
        "Moderate: Free cancellation up to 5 days before check-in",
      houseRules: [
        "No smoking",
        "No pets allowed",
        "No parties or events",
        "Quiet hours after 10 PM",
        "Maximum 10 guests",
      ],
      nearbyAttractions: [
        "Breckenridge Ski Resort (2 miles)",
        "Main Street Shopping (3 miles)",
        "Lake Dillon (8 miles)",
        "Keystone Resort (12 miles)",
      ],
    };

    return mockData;
  }

  /**
   * Generates mock photo data
   * @returns Promise<PhotoData[]>
   */
  private async getMockPhotos(): Promise<PhotoData[]> {
    const mockPhotos: PhotoData[] = [
      {
        url: "https://example.com/photos/exterior-1.jpg",
        thumbnailUrl: "https://example.com/photos/thumbs/exterior-1.jpg",
        alt: "Beautiful mountain home exterior",
        category: "exterior",
        order: 1,
        size: { width: 1200, height: 800 },
      },
      {
        url: "https://example.com/photos/living-room-1.jpg",
        thumbnailUrl: "https://example.com/photos/thumbs/living-room-1.jpg",
        alt: "Spacious living room with fireplace",
        room: "living_room",
        category: "living_area",
        order: 2,
        size: { width: 1200, height: 800 },
      },
      {
        url: "https://example.com/photos/kitchen-1.jpg",
        thumbnailUrl: "https://example.com/photos/thumbs/kitchen-1.jpg",
        alt: "Modern fully equipped kitchen",
        room: "kitchen",
        category: "kitchen",
        order: 3,
        size: { width: 1200, height: 800 },
      },
      {
        url: "https://example.com/photos/master-bedroom-1.jpg",
        thumbnailUrl: "https://example.com/photos/thumbs/master-bedroom-1.jpg",
        alt: "Master bedroom with king bed",
        room: "bedroom",
        category: "bedroom",
        order: 4,
        size: { width: 1200, height: 800 },
      },
      {
        url: "https://example.com/photos/bathroom-1.jpg",
        thumbnailUrl: "https://example.com/photos/thumbs/bathroom-1.jpg",
        alt: "Master bathroom with soaking tub",
        room: "bathroom",
        category: "bathroom",
        order: 5,
        size: { width: 1200, height: 800 },
      },
      {
        url: "https://example.com/photos/hot-tub-1.jpg",
        thumbnailUrl: "https://example.com/photos/thumbs/hot-tub-1.jpg",
        alt: "Private hot tub on deck",
        category: "outdoor_space",
        order: 6,
        size: { width: 1200, height: 800 },
      },
    ];

    return mockPhotos;
  }

  /**
   * Calculates data completeness percentage
   * @param data - Scraped property data
   * @returns number (0-100)
   */
  private calculateDataCompleteness(data: VRBOPropertyData): number {
    const requiredFields = [
      "title",
      "description",
      "amenities",
      "photos",
      "rooms",
      "specifications",
      "location",
    ];

    const optionalFields = [
      "pricing",
      "host",
      "reviews",
      "houseRules",
      "nearbyAttractions",
    ];

    let completedRequired = 0;
    let completedOptional = 0;

    requiredFields.forEach((field) => {
      if (
        data[field as keyof VRBOPropertyData] &&
        this.isFieldComplete(data[field as keyof VRBOPropertyData])
      ) {
        completedRequired++;
      }
    });

    optionalFields.forEach((field) => {
      if (
        data[field as keyof VRBOPropertyData] &&
        this.isFieldComplete(data[field as keyof VRBOPropertyData])
      ) {
        completedOptional++;
      }
    });

    // Required fields are worth 80%, optional fields worth 20%
    const requiredScore = (completedRequired / requiredFields.length) * 80;
    const optionalScore = (completedOptional / optionalFields.length) * 20;

    return Math.round(requiredScore + optionalScore);
  }

  /**
   * Checks if a field has meaningful content
   * @param value - Field value to check
   * @returns boolean
   */
  private isFieldComplete(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  }

  /**
   * Gets list of successfully scraped fields
   * @param data - Scraped property data
   * @returns string[]
   */
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
export const createVRBOScraper = (
  config?: Partial<ScraperConfig>,
): VRBOScraper => {
  return new VRBOScraper(config);
};

// Export convenience function for direct property scraping with browser automation
export const scrapeVRBOProperty = async (
  url: string,
): Promise<VRBOPropertyData> => {
  try {
    logger.info(
      "Starting direct VRBO property scraping with browser automation",
      { url },
      "VRBO_SCRAPER",
    );

    // Try browser automation first for complete image extraction
    const { scrapeBrowserVRBOProperty } = await import(
      "./vrbo-browser-scraper"
    );
    const browserResult = await scrapeBrowserVRBOProperty(url, {
      useStaticFallback: true,
      headless: true,
      enableStealth: true,
      scrollCycles: 5,
      scrollWaitTime: 3000,
    });

    if (browserResult.success) {
      logger.info(
        "Browser automation VRBO scraping completed successfully",
        {
          url,
          totalImages: browserResult.data!.totalImages,
          galleryImages: browserResult.data!.galleryImages.length,
          staticImages: browserResult.data!.staticImages.length,
          scrollCycles:
            browserResult.data!.galleryLoadingResult.scrollCyclesCompleted,
          processingTime: browserResult.metadata.duration,
        },
        "VRBO_SCRAPER",
      );

      return browserResult.data!.propertyData;
    }

    // Fallback to comprehensive scraper without browser automation
    logger.warn(
      "Browser automation failed, falling back to static scraping",
      {
        url,
        errors: browserResult.errors,
      },
      "VRBO_SCRAPER",
    );

    const result = await comprehensiveScrape(url, {
      includeImages: true,
      includeAdvancedAmenities: true,
      includeDetailedDescriptions: true,
      includeRoomData: true,
      maxImages: 30,
      verifyWithAI: false,
      generateReport: true,
    });

    if (!result.success) {
      logger.error(
        "Static fallback VRBO scraping failed",
        {
          url,
          errors: result.errors,
          metadata: result.metadata,
        },
        "VRBO_SCRAPER",
      );

      // Return fallback data on failure
      return createFallbackPropertyData(url);
    }

    logger.info(
      "Static fallback VRBO scraping completed successfully",
      {
        url,
        completenessScore: result.data.extractionReport.completenessScore,
        totalDataPoints: result.data.extractionReport.totalDataPoints,
        processingTime: result.data.extractionReport.processingTime,
      },
      "VRBO_SCRAPER",
    );

    return result.data.propertyData;
  } catch (error) {
    logger.error(
      "Direct VRBO scraping encountered unexpected error",
      error,
      "VRBO_SCRAPER",
    );

    // Return fallback data on unexpected errors
    return createFallbackPropertyData(url);
  }
};

/**
 * Quick scraping function for basic property information only
 * @param url - VRBO property URL
 * @returns Promise<VRBOPropertyData>
 */
export const quickScrapeVRBOProperty = async (
  url: string,
): Promise<VRBOPropertyData> => {
  try {
    const scraper = createComprehensiveVRBOScraper();
    const result = await scraper.quickScrape(url);

    if (!result.success) {
      return createFallbackPropertyData(url);
    }

    return result.data;
  } catch (error) {
    logger.error("Quick VRBO scraping failed", error, "VRBO_SCRAPER");
    return createFallbackPropertyData(url);
  }
};

/**
 * Creates fallback property data when scraping fails
 * @param url - Original VRBO URL
 * @returns VRBOPropertyData with minimal information
 */
function createFallbackPropertyData(url: string): VRBOPropertyData {
  const propertyId = extractPropertyId(url) || "unknown";

  return {
    vrboId: propertyId,
    sourceUrl: url,
    title: "Property Information Temporarily Unavailable",
    description:
      "We're having trouble accessing the full property details right now. Please check the VRBO listing directly for complete information.",
    amenities: [
      {
        name: "WiFi",
        verified: false,
        category: "connectivity",
        priority: "essential",
      },
      {
        name: "Kitchen",
        verified: false,
        category: "kitchen",
        priority: "essential",
      },
      {
        name: "Parking",
        verified: false,
        category: "parking",
        priority: "important",
      },
    ],
    photos: [],
    rooms: [],
    specifications: {
      propertyType: "house",
      bedrooms: 0,
      bathrooms: 0,
      maxGuests: 0,
    },
    location: {
      city: "Unknown",
      state: "Unknown",
      country: "Unknown",
    },
    instantBook: false,
    cancellationPolicy: "Please check VRBO listing for details",
    houseRules: ["Please refer to the original VRBO listing for house rules"],
    lastUpdated: new Date(),
  };
}

/**
 * Extracts property ID from VRBO URL
 * @param url - VRBO URL
 * @returns string | null
 */
function extractPropertyId(url: string): string | null {
  const match = url.match(/\/(\d+)/);
  return match ? match[1] : null;
}

// Export default configuration
export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = {
  timeout: 30000,
  retries: 3,
  userAgent: "STR-Certified-Bot/1.0",
  respectRobotsTxt: true,
  rateLimit: 10,
  enableScreenshots: false,
} as const;

// Export convenience functions
// Removed duplicate export - use the implementation above

// Export robust scraping service for production use
export {
  robustScrapingService,
  scrapePropertyRobustly,
} from "./robust-scraping-service";
