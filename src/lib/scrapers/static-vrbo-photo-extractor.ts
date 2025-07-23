// Enhanced Static VRBO Photo Extractor
// Optimized version of the original working photo extraction method

import axios, { AxiosInstance } from "axios";
import { logger } from "../../utils/logger";
import type { PhotoData, ScrapingResult, ScrapingError } from "./types";

interface StaticPhotoExtractionOptions {
  maxImages: number;
  includeHighRes: boolean;
  includeThumbnails: boolean;
  deduplicateImages: boolean;
  userAgent: string;
  timeout: number;
}

interface StaticPhotoExtractionResult {
  photos: PhotoData[];
  extractionStats: {
    staticImages: number;
    lazyImages: number;
    galleryImages: number;
    jsonLdImages: number;
    totalFound: number;
    totalProcessed: number;
    duplicatesRemoved: number;
  };
  sourceHtml: string;
  processingTime: number;
}

export class StaticVRBOPhotoExtractor {
  private httpClient: AxiosInstance;
  private options: StaticPhotoExtractionOptions;

  constructor(options: Partial<StaticPhotoExtractionOptions> = {}) {
    this.options = {
      maxImages: 50,
      includeHighRes: true,
      includeThumbnails: true,
      deduplicateImages: true,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      timeout: 30000,
      ...options,
    };

    this.httpClient = axios.create({
      timeout: this.options.timeout,
      headers: {
        "User-Agent": this.options.userAgent,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "no-cache",
      },
    });
  }

  /**
   * Extract photos using static HTML parsing (the original working method)
   * @param url - VRBO property URL
   * @returns Promise<ScrapingResult<StaticPhotoExtractionResult>>
   */
  async extractPhotos(
    url: string,
  ): Promise<ScrapingResult<StaticPhotoExtractionResult>> {
    const startTime = Date.now();

    try {
      logger.info(
        "Starting static photo extraction",
        { url },
        "STATIC_VRBO_PHOTO_EXTRACTOR",
      );

      // Fetch the HTML page
      const response = await this.httpClient.get(url);
      const html = response.data;

      // Extract images using multiple strategies
      const staticImages = this.extractStaticImages(html);
      const lazyImages = this.extractLazyImages(html);
      const galleryImages = this.extractGalleryImages(html);
      const jsonLdImages = this.extractJsonLdImages(html);

      // Combine all images
      const allImages = [
        ...staticImages,
        ...lazyImages,
        ...galleryImages,
        ...jsonLdImages,
      ];

      // Remove duplicates
      const uniqueImages = this.options.deduplicateImages
        ? this.deduplicateImages(allImages)
        : allImages;

      // Filter by resolution preferences
      const filteredImages = this.filterImagesByResolution(uniqueImages);

      // Limit to max images
      const limitedImages = filteredImages.slice(0, this.options.maxImages);

      // Convert to PhotoData format
      const photos = this.convertToPhotoData(limitedImages);

      const processingTime = Date.now() - startTime;

      const result: StaticPhotoExtractionResult = {
        photos,
        extractionStats: {
          staticImages: staticImages.length,
          lazyImages: lazyImages.length,
          galleryImages: galleryImages.length,
          jsonLdImages: jsonLdImages.length,
          totalFound: allImages.length,
          totalProcessed: limitedImages.length,
          duplicatesRemoved: allImages.length - uniqueImages.length,
        },
        sourceHtml: html,
        processingTime,
      };

      logger.info(
        "Static photo extraction completed",
        {
          url,
          totalPhotos: photos.length,
          staticImages: staticImages.length,
          lazyImages: lazyImages.length,
          galleryImages: galleryImages.length,
          jsonLdImages: jsonLdImages.length,
          processingTime,
        },
        "STATIC_VRBO_PHOTO_EXTRACTOR",
      );

      return {
        success: true,
        data: result,
        errors: [],
        metadata: {
          scrapedAt: new Date(),
          duration: processingTime,
          sourceUrl: url,
          userAgent: this.options.userAgent,
          rateLimited: false,
          dataCompleteness: Math.min(100, (photos.length / 20) * 100),
          fieldsScraped: ["photos"],
          fieldsFailed: [],
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const scrapingError: ScrapingError = {
        code: "STATIC_PHOTO_EXTRACTION_FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
        severity: "high",
        recoverable: true,
      };

      logger.error(
        "Static photo extraction failed",
        error,
        "STATIC_VRBO_PHOTO_EXTRACTOR",
      );

      return {
        success: false,
        errors: [scrapingError],
        metadata: {
          scrapedAt: new Date(),
          duration: processingTime,
          sourceUrl: url,
          userAgent: this.options.userAgent,
          rateLimited: false,
          dataCompleteness: 0,
          fieldsScraped: [],
          fieldsFailed: ["photos"],
        },
      };
    }
  }

  /**
   * Extract static images from img tags (Method 1 - Basic)
   */
  private extractStaticImages(html: string): string[] {
    const images: string[] = [];

    // Enhanced img tag regex
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
   * Extract lazy-loaded images (Method 2 - Lazy Loading)
   */
  private extractLazyImages(html: string): string[] {
    const images: string[] = [];

    // Enhanced lazy loading patterns
    const lazyPatterns = [
      // Standard data-src patterns
      /<img[^>]*data-src=["']([^"']+)["'][^>]*>/gi,
      /<img[^>]*data-lazy-src=["']([^"']+)["'][^>]*>/gi,
      /<img[^>]*data-original=["']([^"']+)["'][^>]*>/gi,
      /<img[^>]*data-url=["']([^"']+)["'][^>]*>/gi,

      // VRBO-specific patterns
      /<img[^>]*data-hero-src=["']([^"']+)["'][^>]*>/gi,
      /<img[^>]*data-gallery-src=["']([^"']+)["'][^>]*>/gi,
      /<img[^>]*data-photo-src=["']([^"']+)["'][^>]*>/gi,

      // Srcset patterns
      /<img[^>]*srcset=["']([^"']+)["'][^>]*>/gi,

      // Background image patterns
      /style=["'][^"']*background-image:\s*url\(["']?([^"')]+)["']?\)/gi,

      // Picture element patterns
      /<source[^>]*srcset=["']([^"']+)["'][^>]*>/gi,
    ];

    lazyPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const imageUrl = match[1];
        if (this.isValidImageUrl(imageUrl)) {
          // Handle srcset (multiple images)
          if (imageUrl.includes(",")) {
            const srcsetImages = imageUrl.split(",").map(
              (src) => src.trim().split(" ")[0], // Get URL, ignore size descriptor
            );
            srcsetImages.forEach((src) => {
              if (this.isValidImageUrl(src)) {
                images.push(this.normalizeImageUrl(src));
              }
            });
          } else {
            images.push(this.normalizeImageUrl(imageUrl));
          }
        }
      }
    });

    return images;
  }

  /**
   * Extract gallery images from JavaScript objects (Method 3 - JS Variables)
   */
  private extractGalleryImages(html: string): string[] {
    const images: string[] = [];

    // Enhanced JavaScript image patterns
    const jsImagePatterns = [
      // Common JS variable patterns
      /images?\s*[:=]\s*\[([\s\S]*?)\]/gi,
      /photos?\s*[:=]\s*\[([\s\S]*?)\]/gi,
      /gallery\s*[:=]\s*\[([\s\S]*?)\]/gi,
      /imageUrls?\s*[:=]\s*\[([\s\S]*?)\]/gi,

      // VRBO-specific patterns
      /propertyPhotos?\s*[:=]\s*\[([\s\S]*?)\]/gi,
      /heroImages?\s*[:=]\s*\[([\s\S]*?)\]/gi,
      /galleryData\s*[:=]\s*\[([\s\S]*?)\]/gi,

      // Object property patterns
      /"images?"\s*:\s*\[([\s\S]*?)\]/gi,
      /"photos?"\s*:\s*\[([\s\S]*?)\]/gi,
      /"gallery"\s*:\s*\[([\s\S]*?)\]/gi,

      // Window object patterns
      /window\.images?\s*=\s*\[([\s\S]*?)\]/gi,
      /window\.photos?\s*=\s*\[([\s\S]*?)\]/gi,
    ];

    jsImagePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const imageArray = match[1];

        // Extract URLs from the array content
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

    return images;
  }

  /**
   * Extract images from JSON-LD structured data (Method 4 - Structured Data)
   */
  private extractJsonLdImages(html: string): string[] {
    const images: string[] = [];

    try {
      // More comprehensive JSON-LD extraction
      const jsonLdRegex =
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let match;

      while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
          const jsonContent = match[1].trim();
          const data = JSON.parse(jsonContent);

          // Handle array of JSON-LD objects
          const jsonLdObjects = Array.isArray(data) ? data : [data];

          jsonLdObjects.forEach((obj) => {
            // Extract images from various JSON-LD properties
            const imageProperties = [
              "image",
              "photo",
              "photos",
              "images",
              "primaryImageOfPage",
              "thumbnailUrl",
              "contentUrl",
              "url",
              "mainEntity",
              "about",
            ];

            imageProperties.forEach((prop) => {
              if (obj[prop]) {
                const imageData = Array.isArray(obj[prop])
                  ? obj[prop]
                  : [obj[prop]];

                imageData.forEach((img: unknown) => {
                  let imageUrl: string;

                  if (typeof img === "string") {
                    imageUrl = img;
                  } else if (img && typeof img === "object" && img !== null) {
                    const imgObj = img as Record<string, unknown>;
                    imageUrl = String(
                      imgObj.url ||
                        imgObj.contentUrl ||
                        imgObj.thumbnailUrl ||
                        imgObj.src ||
                        "",
                    );
                  } else {
                    return;
                  }

                  if (this.isValidImageUrl(imageUrl)) {
                    images.push(this.normalizeImageUrl(imageUrl));
                  }
                });
              }
            });
          });
        } catch (e) {
          // Continue to next script tag
        }
      }
    } catch (error) {
      logger.warn(
        "Failed to extract JSON-LD images",
        error,
        "STATIC_VRBO_PHOTO_EXTRACTOR",
      );
    }

    return images;
  }

  /**
   * Validate if URL is a valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== "string") return false;

    // Check for valid image extensions
    const imageExtensions = /\.(jpg|jpeg|png|webp|gif|avif|svg)(\?|$)/i;
    if (!imageExtensions.test(url)) return false;

    // Check for valid URL format
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(url)) return false;

    // Filter out unwanted image types
    const unwantedPatterns = [
      /pixel|tracking|analytics|beacon/i,
      /1x1|blank|empty|placeholder/i,
      /\.svg$/i, // Remove SVG icons
      /logo|icon|favicon/i,
      /spinner|loader|loading/i,
    ];

    return !unwantedPatterns.some((pattern) => pattern.test(url));
  }

  /**
   * Normalize image URL (convert relative to absolute, clean up)
   */
  private normalizeImageUrl(url: string): string {
    // Remove quotes and trim
    let normalizedUrl = url.replace(/["']/g, "").trim();

    // Convert protocol-relative URLs
    if (normalizedUrl.startsWith("//")) {
      normalizedUrl = "https:" + normalizedUrl;
    }

    // Handle relative URLs (though rare in VRBO)
    if (normalizedUrl.startsWith("/")) {
      normalizedUrl = "https://www.vrbo.com" + normalizedUrl;
    }

    // Clean up common URL issues
    normalizedUrl = normalizedUrl.replace(/&amp;/g, "&");

    return normalizedUrl;
  }

  /**
   * Remove duplicate images
   */
  private deduplicateImages(images: string[]): string[] {
    const seen = new Set<string>();
    const unique: string[] = [];

    images.forEach((img) => {
      // Normalize for comparison (remove query params for deduplication)
      const normalizedForComparison = img.split("?")[0].toLowerCase();

      if (!seen.has(normalizedForComparison)) {
        seen.add(normalizedForComparison);
        unique.push(img);
      }
    });

    return unique;
  }

  /**
   * Filter images by resolution preferences
   */
  private filterImagesByResolution(images: string[]): string[] {
    const filtered: string[] = [];

    images.forEach((url) => {
      const isThumbnail = this.isThumbnailUrl(url);

      if (this.options.includeHighRes && !isThumbnail) {
        filtered.push(url);
      } else if (this.options.includeThumbnails && isThumbnail) {
        filtered.push(url);
      }
    });

    // If no high-res images found, include thumbnails anyway
    if (filtered.length === 0 && images.length > 0) {
      return images;
    }

    return filtered;
  }

  /**
   * Check if URL is a thumbnail
   */
  private isThumbnailUrl(url: string): boolean {
    const thumbnailIndicators = [
      /thumb/i,
      /small/i,
      /preview/i,
      /mini/i,
      /_s\.|_t\.|_xs\.|_sm\./i,
      /150x|300x|400x/i,
      /w_150|w_300|w_400/i,
      /c_thumb|c_fill|c_fit/i,
      /resize.*200|resize.*150/i,
    ];

    return thumbnailIndicators.some((indicator) => indicator.test(url));
  }

  /**
   * Convert image URLs to PhotoData format
   */
  private convertToPhotoData(images: string[]): PhotoData[] {
    return images.map((url, index) => ({
      url,
      thumbnailUrl: this.isThumbnailUrl(url) ? url : undefined,
      alt: `Property photo ${index + 1}`,
      category: this.categorizeImageByUrl(url),
      order: index + 1,
      size: this.estimateImageSize(url),
    }));
  }

  /**
   * Categorize image by URL patterns
   */
  private categorizeImageByUrl(
    url: string,
  ):
    | "exterior"
    | "interior"
    | "kitchen"
    | "bedroom"
    | "bathroom"
    | "living_area"
    | "outdoor_space"
    | "view"
    | "amenity" {
    const lowerUrl = url.toLowerCase();

    if (
      lowerUrl.includes("exterior") ||
      lowerUrl.includes("outside") ||
      lowerUrl.includes("facade")
    )
      return "exterior";
    if (lowerUrl.includes("kitchen") || lowerUrl.includes("dining"))
      return "kitchen";
    if (lowerUrl.includes("bedroom") || lowerUrl.includes("bed"))
      return "bedroom";
    if (lowerUrl.includes("bathroom") || lowerUrl.includes("bath"))
      return "bathroom";
    if (
      lowerUrl.includes("living") ||
      lowerUrl.includes("lounge") ||
      lowerUrl.includes("family")
    )
      return "living_area";
    if (
      lowerUrl.includes("pool") ||
      lowerUrl.includes("deck") ||
      lowerUrl.includes("patio") ||
      lowerUrl.includes("yard")
    )
      return "outdoor_space";
    if (
      lowerUrl.includes("view") ||
      lowerUrl.includes("scenic") ||
      lowerUrl.includes("landscape")
    )
      return "view";
    if (lowerUrl.includes("amenity") || lowerUrl.includes("facility"))
      return "amenity";

    return "interior";
  }

  /**
   * Estimate image size from URL
   */
  private estimateImageSize(url: string): { width: number; height: number } {
    // Try to extract dimensions from URL
    const dimensionMatch = url.match(/(\d+)x(\d+)/);
    if (dimensionMatch) {
      return {
        width: parseInt(dimensionMatch[1]),
        height: parseInt(dimensionMatch[2]),
      };
    }

    // Default sizes based on URL patterns
    if (this.isThumbnailUrl(url)) {
      return { width: 300, height: 200 };
    }

    return { width: 1200, height: 800 };
  }
}

// Export factory function
export const createStaticVRBOPhotoExtractor = (
  options?: Partial<StaticPhotoExtractionOptions>,
) => {
  return new StaticVRBOPhotoExtractor(options);
};

// Export convenience function
export const extractVRBOPhotosStatic = async (
  url: string,
  options?: Partial<StaticPhotoExtractionOptions>,
): Promise<PhotoData[]> => {
  const extractor = createStaticVRBOPhotoExtractor(options);
  const result = await extractor.extractPhotos(url);

  if (result.success) {
    return result.data!.photos;
  }

  return [];
};
