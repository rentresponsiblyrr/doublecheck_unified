// Comprehensive VRBO Scraper - Phase 3 Complete Implementation
// Integrates production HTTP client, advanced image extraction, and comprehensive data extraction

import { VRBODataExtractor } from "./vrbo-data-extractor";
import { VRBOImageScraper } from "./vrbo-image-scraper";
import { aiDecisionLogger } from "../ai/decision-logger";
import { logger } from "../../utils/logger";
import { errorReporter } from "../monitoring/error-reporter";
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
  PhotoData,
  ScraperConfig,
} from "./types";

interface ComprehensiveScrapingOptions {
  includeImages: boolean;
  includeAdvancedAmenities: boolean;
  includeDetailedDescriptions: boolean;
  includeRoomData: boolean;
  maxImages: number;
  verifyWithAI: boolean;
  generateReport: boolean;
}

interface ComprehensiveScrapingResult {
  propertyData: VRBOPropertyData;
  images: PhotoData[];
  amenities: PropertyAmenity[];
  rooms: PropertyRoom[];
  descriptions: {
    main: string;
    highlights: string[];
    structured: Record<string, string>;
  };
  extractionReport: {
    totalDataPoints: number;
    completenessScore: number;
    verificationStatus: string;
    processingTime: number;
    errorsEncountered: number;
  };
}

export class ComprehensiveVRBOScraper extends VRBODataExtractor {
  private imageScraper: VRBOImageScraper;

  private defaultOptions: ComprehensiveScrapingOptions = {
    includeImages: true,
    includeAdvancedAmenities: true,
    includeDetailedDescriptions: true,
    includeRoomData: true,
    maxImages: 50,
    verifyWithAI: false,
    generateReport: true,
  };

  constructor(config: Partial<ScraperConfig> = {}) {
    super(config);
    this.imageScraper = new VRBOImageScraper(config);
  }

  /**
   * Performs comprehensive scraping of VRBO property
   * @param url - VRBO property URL
   * @param options - Comprehensive scraping options
   * @returns Promise<ScrapingResult<ComprehensiveScrapingResult>>
   */
  async scrapeComprehensiveProperty(
    url: string,
    options: Partial<ComprehensiveScrapingOptions> = {},
  ): Promise<ScrapingResult<ComprehensiveScrapingResult>> {
    const finalOptions = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    const errors: ScrapingError[] = [];

    const metadata: ScrapingMetadata = {
      scrapedAt: new Date(),
      duration: 0,
      sourceUrl: url,
      userAgent: this.httpClient.defaults.headers["User-Agent"] as string,
      rateLimited: false,
      dataCompleteness: 0,
      fieldsScraped: [],
      fieldsFailed: [],
    };

    try {
      // Log comprehensive scraping start
      await aiDecisionLogger.logSimpleDecision(
        `Starting comprehensive VRBO property scraping: ${url}`,
        "comprehensive_scraping",
        `Full property scraping with images, amenities, descriptions, and room data`,
        [url],
        "high",
      );

      // Validate URL
      if (!this.isValidVRBOUrl(url)) {
        throw new Error("Invalid VRBO URL provided");
      }

      // Step 1: Extract basic property data
      logger.info(
        "Step 1: Extracting basic property data",
        { url },
        "COMPREHENSIVE_VRBO_SCRAPER",
      );
      const propertyResult = await this.scrapePropertyDetails(url);

      if (!propertyResult.success) {
        errors.push(...propertyResult.errors);
        metadata.fieldsFailed.push("property_data");
      } else {
        metadata.fieldsScraped.push("property_data");
      }

      // Step 2: Extract comprehensive data (amenities, descriptions, rooms)
      logger.info(
        "Step 2: Extracting comprehensive data",
        { url },
        "COMPREHENSIVE_VRBO_SCRAPER",
      );
      const comprehensiveResult = await this.extractComprehensiveData(
        url,
        {
          includeHidden: finalOptions.includeAdvancedAmenities,
          expandCollapsed: finalOptions.includeAdvancedAmenities,
          verifyWithAI: finalOptions.verifyWithAI,
        },
        {
          includeFormatting: finalOptions.includeDetailedDescriptions,
          extractHighlights: finalOptions.includeDetailedDescriptions,
          parseStructuredData: finalOptions.includeDetailedDescriptions,
        },
        {
          detectRoomTypes: finalOptions.includeRoomData,
          extractDimensions: finalOptions.includeRoomData,
          includeFeatures: finalOptions.includeRoomData,
        },
      );

      if (!comprehensiveResult.success) {
        errors.push(...comprehensiveResult.errors);
        metadata.fieldsFailed.push("comprehensive_data");
      } else {
        metadata.fieldsScraped.push("comprehensive_data");
      }

      // Step 3: Extract images if enabled
      let imageResult: ScrapingResult<PhotoData[]> = {
        success: true,
        data: [],
        errors: [],
      };
      if (finalOptions.includeImages) {
        logger.info(
          "Step 3: Extracting property images",
          { url },
          "COMPREHENSIVE_VRBO_SCRAPER",
        );
        imageResult = await this.imageScraper.scrapeAllImages(url, {
          maxImages: finalOptions.maxImages,
          includeHighRes: true,
          expandGalleries: true,
          deduplicateImages: true,
          roomCategorization: true,
        });

        if (!imageResult.success) {
          errors.push(...imageResult.errors);
          metadata.fieldsFailed.push("images");
        } else {
          metadata.fieldsScraped.push("images");
        }
      }

      // Combine all results
      const combinedResult = this.combineScrapingResults(
        propertyResult,
        comprehensiveResult,
        imageResult,
        finalOptions,
      );

      // Generate extraction report
      const extractionReport = this.generateExtractionReport(
        combinedResult,
        startTime,
        errors.length,
        finalOptions,
      );

      // Calculate final metadata
      metadata.duration = Date.now() - startTime;
      metadata.dataCompleteness = extractionReport.completenessScore;

      logger.info(
        "Comprehensive VRBO scraping completed",
        {
          url,
          completenessScore: extractionReport.completenessScore,
          totalDataPoints: extractionReport.totalDataPoints,
          duration: metadata.duration,
          errorsCount: errors.length,
        },
        "COMPREHENSIVE_VRBO_SCRAPER",
      );

      const finalResult: ComprehensiveScrapingResult = {
        ...combinedResult,
        extractionReport,
      };

      return {
        success: errors.length === 0 || extractionReport.completenessScore > 50,
        data: finalResult,
        errors,
        metadata,
      };
    } catch (error) {
      const scrapingError: ScrapingError = {
        code: "COMPREHENSIVE_SCRAPING_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Unknown comprehensive scraping error",
        severity: "high",
        recoverable: true,
      };

      metadata.duration = Date.now() - startTime;
      metadata.fieldsFailed = ["all"];

      logger.error(
        "Comprehensive VRBO scraping failed",
        error,
        "COMPREHENSIVE_VRBO_SCRAPER",
      );

      errorReporter.reportError(error, {
        context: "COMPREHENSIVE_VRBO_SCRAPER",
        url,
        metadata,
      });

      return {
        success: false,
        errors: [scrapingError],
        metadata,
      };
    }
  }

  /**
   * Combines results from all scraping phases
   * @param propertyResult - Basic property data result
   * @param comprehensiveResult - Comprehensive data result
   * @param imageResult - Image scraping result
   * @param options - Scraping options
   * @returns Combined scraping result
   */
  private combineScrapingResults(
    propertyResult: ScrapingResult<VRBOPropertyData>,
    comprehensiveResult: ScrapingResult<ScrapedPropertyData>,
    imageResult: ScrapingResult<PhotoData[]>,
    options: ComprehensiveScrapingOptions,
  ): Omit<ComprehensiveScrapingResult, "extractionReport"> {
    // Start with basic property data
    const propertyData: VRBOPropertyData = propertyResult.success
      ? propertyResult.data
      : this.createFallbackPropertyData();

    // Enhance with comprehensive data
    if (comprehensiveResult.success) {
      const compData = comprehensiveResult.data;

      // Merge amenities (prioritize comprehensive data)
      if (compData.amenities?.length > 0) {
        propertyData.amenities = this.mergeAmenities(
          propertyData.amenities || [],
          compData.amenities,
        );
      }

      // Update specifications
      if (compData.specifications) {
        propertyData.specifications = {
          ...propertyData.specifications,
          ...compData.specifications,
        };
      }

      // Update location
      if (compData.location) {
        propertyData.location = {
          ...propertyData.location,
          ...compData.location,
        };
      }

      // Update rooms
      if (compData.rooms?.length > 0) {
        propertyData.rooms = compData.rooms;
      }

      // Update description with detailed version
      if (compData.descriptions?.main) {
        propertyData.description = compData.descriptions.main;
      }
    }

    // Add images
    const images: PhotoData[] = imageResult.success ? imageResult.data : [];

    // If we have images, update the property data photos
    if (images.length > 0) {
      propertyData.photos = images;
    }

    return {
      propertyData,
      images,
      amenities: propertyData.amenities || [],
      rooms: propertyData.rooms || [],
      descriptions: comprehensiveResult.success
        ? comprehensiveResult.data.descriptions
        : {
            main: propertyData.description || "",
            highlights: [],
            structured: {},
          },
    };
  }

  /**
   * Merges amenity lists, prioritizing comprehensive data while preserving unique items
   * @param basicAmenities - Basic amenities from property scraping
   * @param comprehensiveAmenities - Comprehensive amenities from advanced extraction
   * @returns Merged amenity list
   */
  private mergeAmenities(
    basicAmenities: PropertyAmenity[],
    comprehensiveAmenities: PropertyAmenity[],
  ): PropertyAmenity[] {
    const amenityMap = new Map<string, PropertyAmenity>();

    // Add basic amenities first
    basicAmenities.forEach((amenity) => {
      amenityMap.set(amenity.name.toLowerCase(), amenity);
    });

    // Add/override with comprehensive amenities (they're more detailed)
    comprehensiveAmenities.forEach((amenity) => {
      const existing = amenityMap.get(amenity.name.toLowerCase());
      if (existing) {
        // Merge properties, prioritizing comprehensive data
        amenityMap.set(amenity.name.toLowerCase(), {
          ...existing,
          ...amenity,
          verified: amenity.verified || existing.verified,
          description: amenity.description || existing.description,
        });
      } else {
        amenityMap.set(amenity.name.toLowerCase(), amenity);
      }
    });

    return Array.from(amenityMap.values());
  }

  /**
   * Creates fallback property data when basic scraping fails
   * @returns Minimal VRBOPropertyData
   */
  private createFallbackPropertyData(): VRBOPropertyData {
    return {
      vrboId: "unknown",
      sourceUrl: "",
      title: "Property Title Not Available",
      description: "Property description not available",
      amenities: [],
      photos: [],
      rooms: [],
      specifications: this.getDefaultSpecifications(),
      location: this.getDefaultLocation(),
      instantBook: false,
      cancellationPolicy: "Policy not specified",
      houseRules: [],
      lastUpdated: new Date(),
    };
  }

  /**
   * Generates comprehensive extraction report
   * @param result - Combined scraping result
   * @param startTime - Processing start time
   * @param errorCount - Number of errors encountered
   * @param options - Scraping options
   * @returns Extraction report
   */
  private generateExtractionReport(
    result: Omit<ComprehensiveScrapingResult, "extractionReport">,
    startTime: number,
    errorCount: number,
    options: ComprehensiveScrapingOptions,
  ): ComprehensiveScrapingResult["extractionReport"] {
    const processingTime = Date.now() - startTime;

    // Count total data points extracted
    let totalDataPoints = 0;

    // Basic property data points
    if (result.propertyData.title) totalDataPoints++;
    if (result.propertyData.description) totalDataPoints++;
    if (result.propertyData.specifications?.bedrooms) totalDataPoints++;
    if (result.propertyData.specifications?.bathrooms) totalDataPoints++;
    if (result.propertyData.specifications?.maxGuests) totalDataPoints++;
    if (result.propertyData.location?.city) totalDataPoints++;

    // Amenities
    totalDataPoints += result.amenities.length;

    // Images
    totalDataPoints += result.images.length;

    // Rooms
    totalDataPoints += result.rooms.length;

    // Descriptions
    if (result.descriptions.main) totalDataPoints++;
    totalDataPoints += result.descriptions.highlights.length;
    totalDataPoints += Object.keys(result.descriptions.structured).length;

    // Calculate completeness score
    let completenessScore = 0;

    // Required data scoring (70%)
    if (result.propertyData.title) completenessScore += 10;
    if (result.propertyData.description) completenessScore += 10;
    if (result.amenities.length > 0) completenessScore += 15;
    if (result.images.length > 0) completenessScore += 15;
    if (result.propertyData.specifications?.bedrooms) completenessScore += 10;
    if (result.propertyData.specifications?.bathrooms) completenessScore += 10;

    // Optional data scoring (30%)
    if (result.rooms.length > 0) completenessScore += 10;
    if (result.descriptions.highlights.length > 0) completenessScore += 5;
    if (Object.keys(result.descriptions.structured).length > 0)
      completenessScore += 5;
    if (
      result.propertyData.location?.city &&
      result.propertyData.location.city !== "Unknown"
    )
      completenessScore += 5;
    if (result.images.length >= 10) completenessScore += 5;

    // Determine verification status
    let verificationStatus = "completed";
    if (errorCount > 0 && completenessScore < 50) {
      verificationStatus = "failed";
    } else if (errorCount > 0 || completenessScore < 80) {
      verificationStatus = "partial";
    }

    return {
      totalDataPoints,
      completenessScore: Math.round(Math.min(completenessScore, 100)),
      verificationStatus,
      processingTime,
      errorsEncountered: errorCount,
    };
  }

  /**
   * Quick scrape method for basic property information
   * @param url - VRBO property URL
   * @returns Promise<ScrapingResult<VRBOPropertyData>>
   */
  async quickScrape(url: string): Promise<ScrapingResult<VRBOPropertyData>> {
    return this.scrapePropertyDetails(url);
  }

  /**
   * Batch scraping method for multiple properties
   * @param urls - Array of VRBO property URLs
   * @param options - Scraping options
   * @returns Promise<ScrapingResult<ComprehensiveScrapingResult>[]>
   */
  async batchScrape(
    urls: string[],
    options: Partial<ComprehensiveScrapingOptions> = {},
  ): Promise<ScrapingResult<ComprehensiveScrapingResult>[]> {
    const results: ScrapingResult<ComprehensiveScrapingResult>[] = [];

    for (const url of urls) {
      try {
        const result = await this.scrapeComprehensiveProperty(url, options);
        results.push(result);

        // Add delay between requests to respect rate limits
        await this.delay(2000);
      } catch (error) {
        results.push({
          success: false,
          errors: [
            {
              code: "BATCH_SCRAPING_FAILED",
              message:
                error instanceof Error
                  ? error.message
                  : "Batch scraping failed",
              severity: "medium",
              recoverable: true,
            },
          ],
          metadata: {
            scrapedAt: new Date(),
            duration: 0,
            sourceUrl: url,
            userAgent: this.httpClient.defaults.headers["User-Agent"] as string,
            rateLimited: false,
            dataCompleteness: 0,
            fieldsScraped: [],
            fieldsFailed: ["all"],
          },
        });
      }
    }

    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export factory function
export const createComprehensiveVRBOScraper = (
  config?: Partial<ScraperConfig>,
): ComprehensiveVRBOScraper => {
  return new ComprehensiveVRBOScraper(config);
};

// Export convenience function for quick property scraping
export const scrapeVRBOProperty = async (
  url: string,
  options: Partial<ComprehensiveScrapingOptions> = {},
): Promise<ScrapingResult<ComprehensiveScrapingResult>> => {
  const scraper = createComprehensiveVRBOScraper();
  return scraper.scrapeComprehensiveProperty(url, options);
};
