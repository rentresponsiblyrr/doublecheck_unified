// VRBO Image Scraper - Phase 2: Advanced Image Extraction
// Handles lazy loading, progressive loading, and comprehensive image extraction

import { ProductionVRBOScraper } from "./production-vrbo-scraper";
import { aiDecisionLogger } from "../ai/decision-logger";
import { logger } from "../../utils/logger";
import type {
  PhotoData,
  ScrapingResult,
  ScrapingError,
  ScrapingMetadata,
  PhotoCategory,
  RoomType,
} from "./types";

// Enhanced types for image processing
type ImageMetadata = Record<string, unknown>;
type ScraperConfig = Record<string, unknown>;

// JSON-LD image data structure
interface JSONLDImageData {
  url?: string;
  contentUrl?: string;
  [key: string]: unknown;
}

interface ImageExtractionOptions {
  includeThumbnails: boolean;
  includeHighRes: boolean;
  expandGalleries: boolean;
  deduplicateImages: boolean;
  maxImages: number;
  roomCategorization: boolean;
}

interface ImageDiscoveryResult {
  staticImages: string[];
  lazyImages: string[];
  galleryImages: string[];
  thumbnails: string[];
  highResImages: string[];
  metadata: ImageMetadata;
}

interface ImageProcessingResult {
  processedImages: PhotoData[];
  duplicatesRemoved: number;
  categorizedImages: Record<PhotoCategory, PhotoData[]>;
  roomImages: Record<RoomType, PhotoData[]>;
  extractionStats: {
    totalFound: number;
    totalProcessed: number;
    highResCount: number;
    thumbnailCount: number;
    categorizedCount: number;
  };
}

export class VRBOImageScraper extends ProductionVRBOScraper {
  private defaultImageOptions: ImageExtractionOptions = {
    includeThumbnails: true,
    includeHighRes: true,
    expandGalleries: true,
    deduplicateImages: true,
    maxImages: 100,
    roomCategorization: true,
  };

  /**
   * Validates VRBO URL format
   */
  private validateVRBOUrl(url: string): boolean {
    return /^https?:\/\/(www\.)?(vrbo|homeaway)\.com\/.*\/?\d+/i.test(url);
  }

  /**
   * Fetches property page HTML content
   */
  private async fetchPropertyPageHtml(url: string): Promise<string> {
    // Simplified implementation - in production would use proper HTTP client
    const response = await fetch(url, {
      headers: {
        "User-Agent": "STR-Certified-Scraper/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch property page: ${response.status}`);
    }

    return response.text();
  }

  /**
   * Comprehensive image extraction from VRBO property page
   * @param url - VRBO property URL
   * @param options - Image extraction options
   * @returns Promise<ScrapingResult<PhotoData[]>>
   */
  async scrapeAllImages(
    url: string,
    options: Partial<ImageExtractionOptions> = {},
  ): Promise<ScrapingResult<PhotoData[]>> {
    const finalOptions = { ...this.defaultImageOptions, ...options };
    const startTime = Date.now();

    const metadata: ScrapingMetadata = {
      scrapedAt: new Date(),
      duration: 0,
      sourceUrl: url,
      userAgent: "STR-Certified-Scraper/1.0",
      rateLimited: false,
      dataCompleteness: 0,
      fieldsScraped: [],
      fieldsFailed: [],
    };

    try {
      // Log image scraping start
      await aiDecisionLogger.logSimpleDecision(
        `Starting comprehensive VRBO image scraping: ${url}`,
        "architectural_choice",
        `Extracting images with options: ${JSON.stringify(finalOptions)}`,
        [url],
        "high",
      );

      // Validate URL
      if (!this.validateVRBOUrl(url)) {
        throw new Error("Invalid VRBO URL provided");
      }

      // Fetch the main property page
      const html = await this.fetchPropertyPageHtml(url);

      // Discover all images on the page
      const imageDiscovery = await this.discoverAllImages(html, finalOptions);

      // Process and categorize images
      const imageProcessing = await this.processDiscoveredImages(
        imageDiscovery,
        finalOptions,
      );

      // Calculate metadata
      metadata.duration = Date.now() - startTime;
      metadata.dataCompleteness =
        this.calculateImageDataCompleteness(imageProcessing);
      metadata.fieldsScraped = ["images", "thumbnails", "categories", "rooms"];

      logger.info(
        "VRBO image scraping completed successfully",
        {
          totalImages: imageProcessing.extractionStats.totalProcessed,
          highResCount: imageProcessing.extractionStats.highResCount,
          categorizedCount: imageProcessing.extractionStats.categorizedCount,
          duration: metadata.duration,
        },
        "VRBO_IMAGE_SCRAPER",
      );

      return {
        success: true,
        data: imageProcessing.processedImages,
        errors: [],
        metadata,
      };
    } catch (error) {
      const scrapingError: ScrapingError = {
        code: "IMAGE_SCRAPING_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Unknown image scraping error",
        severity: "high",
        recoverable: true,
      };

      metadata.duration = Date.now() - startTime;
      metadata.fieldsFailed = ["images"];

      logger.error("VRBO image scraping failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        errors: [scrapingError],
        metadata,
      };
    }
  }

  /**
   * Discovers all images on the page using multiple strategies
   * @param html - HTML content
   * @param options - Extraction options
   * @returns Promise<ImageDiscoveryResult>
   */
  private async discoverAllImages(
    html: string,
    options: ImageExtractionOptions,
  ): Promise<ImageDiscoveryResult> {
    const discovery: ImageDiscoveryResult = {
      staticImages: [],
      lazyImages: [],
      galleryImages: [],
      thumbnails: [],
      highResImages: [],
      metadata: {},
    };

    // Extract static images from img tags
    discovery.staticImages = this.extractStaticImages(html);

    // Extract lazy-loaded images
    discovery.lazyImages = this.extractLazyImages(html);

    // Extract gallery images from JavaScript/JSON
    discovery.galleryImages = this.extractGalleryImages(html);

    // Separate thumbnails and high-resolution images
    const { thumbnails, highRes } = this.categorizeImagesByResolution([
      ...discovery.staticImages,
      ...discovery.lazyImages,
      ...discovery.galleryImages,
    ]);

    discovery.thumbnails = thumbnails;
    discovery.highResImages = highRes;

    // Extract metadata about image sections
    discovery.metadata = this.extractImageMetadata(html);

    return discovery;
  }

  /**
   * Extracts static images from standard img tags
   * @param html - HTML content
   * @returns string[] - Array of image URLs
   */
  private extractStaticImages(html: string): string[] {
    const images: string[] = [];

    // Match img tags with src attributes
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      const imageUrl = match[1];
      if (this.isValidImageUrl(imageUrl)) {
        images.push(this.normalizeImageUrl(imageUrl));
      }
    }

    return images;
  }

  /**
   * Extracts lazy-loaded images from various lazy loading patterns
   * @param html - HTML content
   * @returns string[] - Array of image URLs
   */
  private extractLazyImages(html: string): string[] {
    const images: string[] = [];

    // Common lazy loading patterns
    const lazyPatterns = [
      // data-src attribute
      /<img[^>]*data-src=["']([^"']+)["'][^>]*>/gi,
      // data-lazy-src attribute
      /<img[^>]*data-lazy-src=["']([^"']+)["'][^>]*>/gi,
      // data-original attribute
      /<img[^>]*data-original=["']([^"']+)["'][^>]*>/gi,
      // srcset attribute
      /<img[^>]*srcset=["']([^"']+)["'][^>]*>/gi,
      // background-image in style attributes
      /style=["'][^"']*background-image:\s*url\(["']?([^"')]+)["']?\)/gi,
    ];

    lazyPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const imageUrl = match[1];
        if (this.isValidImageUrl(imageUrl)) {
          images.push(this.normalizeImageUrl(imageUrl));
        }
      }
    });

    return images;
  }

  /**
   * Extracts gallery images from JavaScript objects and JSON-LD
   * @param html - HTML content
   * @returns string[] - Array of image URLs
   */
  private extractGalleryImages(html: string): string[] {
    const images: string[] = [];

    // Extract from JavaScript variables
    const jsImagePatterns = [
      // Common JS image array patterns
      /images?\s*[:=]\s*\[([^\]]+)\]/gi,
      /photos?\s*[:=]\s*\[([^\]]+)\]/gi,
      /gallery\s*[:=]\s*\[([^\]]+)\]/gi,
      // JSON-LD images
      /"image"\s*:\s*\[([^\]]+)\]/gi,
      /"photo"\s*:\s*\[([^\]]+)\]/gi,
    ];

    jsImagePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const imageArray = match[1];
        const urlMatches = imageArray.match(
          /["']([^"']*\.(jpg|jpeg|png|webp|gif))["']/gi,
        );

        if (urlMatches) {
          urlMatches.forEach((urlMatch) => {
            const imageUrl = urlMatch.replace(/["']/g, "");
            if (this.isValidImageUrl(imageUrl)) {
              images.push(this.normalizeImageUrl(imageUrl));
            }
          });
        }
      }
    });

    // Extract from JSON-LD structured data
    const jsonLdImages = this.extractJsonLdImages(html);
    images.push(...jsonLdImages);

    return images;
  }

  /**
   * Extracts images from JSON-LD structured data
   * @param html - HTML content
   * @returns string[] - Array of image URLs
   */
  private extractJsonLdImages(html: string): string[] {
    const images: string[] = [];

    try {
      const jsonLdRegex =
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      const matches = html.match(jsonLdRegex);

      if (matches) {
        matches.forEach((match) => {
          try {
            const jsonContent = match
              .replace(/<script[^>]*>/i, "")
              .replace(/<\/script>/i, "");
            const data = JSON.parse(jsonContent);

            // Extract images from various JSON-LD properties
            const imageProperties = ["image", "photo", "photos", "images"];

            imageProperties.forEach((prop) => {
              if (data[prop]) {
                const imageData = Array.isArray(data[prop])
                  ? data[prop]
                  : [data[prop]];

                imageData.forEach((img: unknown) => {
                  let imageUrl: string;

                  if (typeof img === "string") {
                    imageUrl = img;
                  } else if (typeof img === "object" && img !== null) {
                    const imgObj = img as JSONLDImageData;
                    if (imgObj.url && typeof imgObj.url === "string") {
                      imageUrl = imgObj.url;
                    } else if (
                      imgObj.contentUrl &&
                      typeof imgObj.contentUrl === "string"
                    ) {
                      imageUrl = imgObj.contentUrl;
                    } else {
                      return;
                    }
                  } else {
                    return;
                  }

                  if (this.isValidImageUrl(imageUrl)) {
                    images.push(this.normalizeImageUrl(imageUrl));
                  }
                });
              }
            });
          } catch (e) {
            // Continue to next script tag
          }
        });
      }
    } catch (error) {
      logger.warn("Failed to extract JSON-LD images", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return images;
  }

  /**
   * Categorizes images by resolution (thumbnails vs high-res)
   * @param imageUrls - Array of image URLs
   * @returns Object with thumbnails and highRes arrays
   */
  private categorizeImagesByResolution(imageUrls: string[]): {
    thumbnails: string[];
    highRes: string[];
  } {
    const thumbnails: string[] = [];
    const highRes: string[] = [];

    imageUrls.forEach((url) => {
      // Check for thumbnail indicators in URL
      const thumbnailIndicators = [
        /thumb/i,
        /small/i,
        /preview/i,
        /_s\./i,
        /_t\./i,
        /150x/i,
        /300x/i,
        /w_150/i,
        /w_300/i,
        /c_thumb/i,
      ];

      const isThumbnail = thumbnailIndicators.some((indicator) =>
        indicator.test(url),
      );

      if (isThumbnail) {
        thumbnails.push(url);
      } else {
        highRes.push(url);
      }
    });

    return { thumbnails, highRes };
  }

  /**
   * Extracts metadata about image sections and galleries
   * @param html - HTML content
   * @returns Object with metadata
   */
  private extractImageMetadata(html: string): ImageMetadata {
    const metadata: ImageMetadata = {};

    // Count gallery sections
    const gallerySelectors = [
      /class=["'][^"']*gallery[^"']*["']/gi,
      /class=["'][^"']*photos[^"']*["']/gi,
      /class=["'][^"']*images[^"']*["']/gi,
      /id=["'][^"']*gallery[^"']*["']/gi,
    ];

    gallerySelectors.forEach((selector, index) => {
      const matches = html.match(selector);
      if (matches) {
        metadata[`gallerySection${index}`] = matches.length;
      }
    });

    // Extract alt text patterns for room detection
    const altTextRegex = /alt=["']([^"']+)["']/gi;
    const altTexts: string[] = [];
    let match;

    while ((match = altTextRegex.exec(html)) !== null) {
      altTexts.push(match[1]);
    }

    metadata.altTexts = altTexts;

    return metadata;
  }

  /**
   * Processes discovered images into structured PhotoData objects
   * @param discovery - Image discovery result
   * @param options - Processing options
   * @returns Promise<ImageProcessingResult>
   */
  private async processDiscoveredImages(
    discovery: ImageDiscoveryResult,
    options: ImageExtractionOptions,
  ): Promise<ImageProcessingResult> {
    const allImages = [
      ...discovery.staticImages,
      ...discovery.lazyImages,
      ...discovery.galleryImages,
    ];

    // Deduplicate images
    const uniqueImages = options.deduplicateImages
      ? this.deduplicateImages(allImages)
      : allImages;

    // Limit number of images
    const limitedImages = uniqueImages.slice(0, options.maxImages);

    // Convert to PhotoData objects
    const photoData: PhotoData[] = limitedImages.map((url, index) => {
      const isHighRes = discovery.highResImages.includes(url);
      const isThumbnail = discovery.thumbnails.includes(url);

      return {
        url,
        thumbnailUrl: isThumbnail ? url : this.generateThumbnailUrl(url),
        alt: this.extractAltTextForImage(
          url,
          (discovery.metadata.altTexts as string[]) || [],
        ),
        category: this.categorizeImageByUrl(url),
        room: this.categorizeImageByRoom(
          url,
          (discovery.metadata.altTexts as string[]) || [],
        ),
        size: isHighRes
          ? { width: 1200, height: 800 }
          : { width: 400, height: 300 },
        order: index + 1,
      };
    });

    // Categorize images
    const categorizedImages = this.categorizeImagesByType(photoData);
    const roomImages = this.categorizeImagesByRoom(photoData);

    return {
      processedImages: photoData,
      duplicatesRemoved: allImages.length - uniqueImages.length,
      categorizedImages,
      roomImages,
      extractionStats: {
        totalFound: allImages.length,
        totalProcessed: photoData.length,
        highResCount: discovery.highResImages.length,
        thumbnailCount: discovery.thumbnails.length,
        categorizedCount: Object.values(categorizedImages).flat().length,
      },
    };
  }

  /**
   * Utility methods for image processing
   */
  private isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== "string") return false;

    // Check for valid image extensions
    const imageExtensions = /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i;

    // Check for valid URL format
    const urlPattern = /^https?:\/\//i;

    return (
      imageExtensions.test(url) &&
      (urlPattern.test(url) || url.startsWith("//"))
    );
  }

  private normalizeImageUrl(url: string): string {
    // Handle protocol-relative URLs
    if (url.startsWith("//")) {
      return `https:${url}`;
    }

    // Handle relative URLs (if any)
    if (url.startsWith("/")) {
      return `https://www.vrbo.com${url}`;
    }

    return url;
  }

  private deduplicateImages(images: string[]): string[] {
    const seen = new Set<string>();
    const unique: string[] = [];

    images.forEach((url) => {
      // Normalize URL for comparison
      const normalizedUrl = url.replace(/\?.*$/, "").toLowerCase();

      if (!seen.has(normalizedUrl)) {
        seen.add(normalizedUrl);
        unique.push(url);
      }
    });

    return unique;
  }

  private categorizeImageByUrl(url: string): PhotoCategory {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes("exterior") || lowerUrl.includes("outside"))
      return "exterior";
    if (lowerUrl.includes("kitchen")) return "kitchen";
    if (lowerUrl.includes("bedroom") || lowerUrl.includes("bed"))
      return "bedroom";
    if (lowerUrl.includes("bathroom") || lowerUrl.includes("bath"))
      return "bathroom";
    if (lowerUrl.includes("living") || lowerUrl.includes("lounge"))
      return "living_area";
    if (
      lowerUrl.includes("pool") ||
      lowerUrl.includes("deck") ||
      lowerUrl.includes("patio")
    )
      return "outdoor_space";
    if (lowerUrl.includes("view") || lowerUrl.includes("scenic")) return "view";
    if (lowerUrl.includes("amenity")) return "amenity";

    return "interior";
  }

  private categorizeImageByRoom(
    url: string,
    altTexts: string[],
  ): RoomType | undefined {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes("kitchen")) return "kitchen";
    if (lowerUrl.includes("bedroom") || lowerUrl.includes("bed"))
      return "bedroom";
    if (lowerUrl.includes("bathroom") || lowerUrl.includes("bath"))
      return "bathroom";
    if (lowerUrl.includes("living") || lowerUrl.includes("lounge"))
      return "living_room";
    if (lowerUrl.includes("dining")) return "dining_room";
    if (lowerUrl.includes("office") || lowerUrl.includes("study"))
      return "office";
    if (lowerUrl.includes("game") || lowerUrl.includes("rec"))
      return "game_room";
    if (lowerUrl.includes("balcony")) return "balcony";
    if (lowerUrl.includes("patio") || lowerUrl.includes("deck")) return "patio";
    if (lowerUrl.includes("garage")) return "garage";

    return undefined;
  }

  private extractAltTextForImage(url: string, altTexts: string[]): string {
    // Try to find relevant alt text for this image
    const urlKeywords = url.toLowerCase().split(/[\/\-_\.]/);

    for (const altText of altTexts) {
      const altKeywords = altText.toLowerCase().split(/\s+/);
      const commonKeywords = urlKeywords.filter((keyword) =>
        altKeywords.some(
          (altKeyword) =>
            altKeyword.includes(keyword) || keyword.includes(altKeyword),
        ),
      );

      if (commonKeywords.length > 0) {
        return altText;
      }
    }

    return "";
  }

  private generateThumbnailUrl(url: string): string {
    // Try to generate thumbnail URL from high-res URL
    // This is VRBO-specific logic
    if (url.includes("vrbo") || url.includes("homeaway")) {
      return url
        .replace(/\/\d+\//, "/150/")
        .replace(/\.(jpg|jpeg|png|webp)/i, "_150.$1");
    }

    return url;
  }

  private categorizeImagesByType(
    photos: PhotoData[],
  ): Record<PhotoCategory, PhotoData[]> {
    const categorized: Record<PhotoCategory, PhotoData[]> = {
      exterior: [],
      interior: [],
      bedroom: [],
      bathroom: [],
      kitchen: [],
      living_area: [],
      outdoor_space: [],
      amenity: [],
      view: [],
      other: [],
    };

    photos.forEach((photo) => {
      categorized[photo.category].push(photo);
    });

    return categorized;
  }

  private categorizeImagesByRoom(
    photos: PhotoData[],
  ): Record<RoomType, PhotoData[]> {
    const categorized: Record<RoomType, PhotoData[]> = {
      bedroom: [],
      bathroom: [],
      kitchen: [],
      living_room: [],
      dining_room: [],
      office: [],
      game_room: [],
      balcony: [],
      patio: [],
      garage: [],
      basement: [],
      attic: [],
      other: [],
    };

    photos.forEach((photo) => {
      if (photo.room) {
        categorized[photo.room].push(photo);
      }
    });

    return categorized;
  }

  private calculateImageDataCompleteness(
    processing: ImageProcessingResult,
  ): number {
    const stats = processing.extractionStats;

    // Base score for finding images
    let score = Math.min((stats.totalProcessed / 20) * 50, 50); // Up to 50% for having images

    // Bonus for high-res images
    if (stats.highResCount > 0) {
      score += Math.min((stats.highResCount / 10) * 20, 20); // Up to 20% for high-res
    }

    // Bonus for categorized images
    if (stats.categorizedCount > 0) {
      score += Math.min(
        (stats.categorizedCount / stats.totalProcessed) * 20,
        20,
      ); // Up to 20% for categorization
    }

    // Bonus for variety (different room types)
    const roomTypes = Object.values(processing.roomImages).filter(
      (arr) => arr.length > 0,
    ).length;
    score += Math.min(roomTypes * 2, 10); // Up to 10% for room variety

    return Math.round(Math.min(score, 100));
  }
}

// Export factory function
export const createVRBOImageScraper = (
  config?: ScraperConfig,
): VRBOImageScraper => {
  return new VRBOImageScraper(config);
};
