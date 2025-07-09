// Enhanced VRBO Browser Scraper with Dynamic Image Loading
// Combines browser automation with comprehensive data extraction

import { ComprehensiveVRBOScraper } from './comprehensive-vrbo-scraper';
import { BrowserManager } from './browser-manager';
import { VRBOGalleryAutomation } from './vrbo-gallery-automation';
import { aiDecisionLogger } from '../ai/decision-logger';
import { logger } from '../../utils/logger';
import { errorReporter } from '../monitoring/error-reporter';
import type {
  ScrapingResult,
  ScrapingError,
  ScrapingMetadata,
  VRBOPropertyData,
  PhotoData,
  ScraperConfig
} from './types';

export interface BrowserScrapingOptions {
  useStaticFallback: boolean;
  enableScreenshots: boolean;
  screenshotPath: string;
  scrollCycles: number;
  scrollWaitTime: number;
  browserTimeout: number;
  enableStealth: boolean;
  headless: boolean;
}

export interface BrowserScrapingResult {
  propertyData: VRBOPropertyData;
  galleryImages: PhotoData[];
  staticImages: PhotoData[];
  totalImages: number;
  galleryLoadingResult: {
    scrollCyclesCompleted: number;
    loadingTime: number;
    errors: string[];
  };
  browserMetadata: {
    sessionId: string;
    userAgent: string;
    screenResolution: string;
    processingTime: number;
    memoryUsage: number;
  };
}

export class VRBOBrowserScraper extends ComprehensiveVRBOScraper {
  private browserManager: BrowserManager;
  private galleryAutomation: VRBOGalleryAutomation;
  private browserOptions: BrowserScrapingOptions;

  private defaultBrowserOptions: BrowserScrapingOptions = {
    useStaticFallback: true,
    enableScreenshots: false,
    screenshotPath: '/tmp/vrbo-screenshots',
    scrollCycles: 5,
    scrollWaitTime: 3000,
    browserTimeout: 120000,
    enableStealth: true,
    headless: true
  };

  constructor(config: Partial<ScraperConfig> = {}, browserOptions: Partial<BrowserScrapingOptions> = {}) {
    super(config);
    
    this.browserOptions = { ...this.defaultBrowserOptions, ...browserOptions };
    
    this.browserManager = new BrowserManager({
      headless: this.browserOptions.headless,
      timeout: this.browserOptions.browserTimeout,
      enableStealth: this.browserOptions.enableStealth,
      blockImages: false, // We need images for VRBO
      blockCSS: true // Block CSS for faster loading
    });

    this.galleryAutomation = new VRBOGalleryAutomation(this.browserManager, {
      scrollCycles: this.browserOptions.scrollCycles,
      scrollWaitTime: this.browserOptions.scrollWaitTime,
      enableScreenshots: this.browserOptions.enableScreenshots,
      screenshotPath: this.browserOptions.screenshotPath
    });
  }

  /**
   * Scrapes VRBO property with browser automation for complete image extraction
   * @param url - VRBO property URL
   * @param options - Browser scraping options
   * @returns Promise<ScrapingResult<BrowserScrapingResult>>
   */
  async scrapeWithBrowserAutomation(
    url: string,
    options: Partial<BrowserScrapingOptions> = {}
  ): Promise<ScrapingResult<BrowserScrapingResult>> {
    const finalOptions = { ...this.browserOptions, ...options };
    const startTime = Date.now();
    const errors: ScrapingError[] = [];
    
    const metadata: ScrapingMetadata = {
      scrapedAt: new Date(),
      duration: 0,
      sourceUrl: url,
      userAgent: this.browserManager.config?.userAgent || 'Unknown',
      rateLimited: false,
      dataCompleteness: 0,
      fieldsScraped: [],
      fieldsFailed: []
    };

    let browserSession: any = null;
    let sessionId = '';

    try {
      // Log browser scraping start
      await aiDecisionLogger.logSimpleDecision(
        `Starting browser-based VRBO scraping: ${url}`,
        'browser_scraping',
        `Using Puppeteer automation with ${finalOptions.scrollCycles} scroll cycles`,
        [url],
        'high'
      );

      // Step 1: Create browser session
      logger.info('Creating browser session for VRBO scraping', { url }, 'VRBO_BROWSER_SCRAPER');
      browserSession = await this.browserManager.createSession();
      sessionId = browserSession.sessionId;

      // Step 2: Load property data using browser automation
      const galleryResult = await this.galleryAutomation.loadAllGalleryImages(browserSession.page, url);
      
      // Step 3: Extract additional data from the loaded page
      const pageData = await this.extractPageData(browserSession.page, url);
      
      // Step 4: Combine with static scraping if enabled
      let staticImages: PhotoData[] = [];
      let staticPropertyData: VRBOPropertyData | null = null;
      
      if (finalOptions.useStaticFallback) {
        try {
          const staticResult = await this.scrapeComprehensiveProperty(url, {
            includeImages: true,
            includeAdvancedAmenities: true,
            includeDetailedDescriptions: true,
            includeRoomData: true,
            maxImages: 100
          });
          
          if (staticResult.success) {
            staticImages = staticResult.data!.images;
            staticPropertyData = staticResult.data!.propertyData;
          }
        } catch (staticError) {
          logger.warn('Static scraping fallback failed', staticError, 'VRBO_BROWSER_SCRAPER');
        }
      }

      // Step 5: Merge browser and static data
      const mergedData = this.mergeBrowserAndStaticData(
        pageData,
        staticPropertyData,
        galleryResult.images,
        staticImages
      );

      // Step 6: Calculate browser metadata
      const browserMetadata = await this.calculateBrowserMetadata(browserSession, startTime);

      // Step 7: Create final result
      const totalImages = mergedData.images.length;
      const result: BrowserScrapingResult = {
        propertyData: mergedData.propertyData,
        galleryImages: galleryResult.images,
        staticImages: staticImages,
        totalImages,
        galleryLoadingResult: {
          scrollCyclesCompleted: galleryResult.scrollCyclesCompleted,
          loadingTime: galleryResult.loadingTime,
          errors: galleryResult.errors
        },
        browserMetadata
      };

      // Calculate final metadata
      metadata.duration = Date.now() - startTime;
      metadata.dataCompleteness = this.calculateBrowserDataCompleteness(result);
      metadata.fieldsScraped = ['browser_images', 'static_images', 'property_data'];
      
      if (galleryResult.errors.length > 0) {
        metadata.fieldsFailed.push('gallery_automation');
        galleryResult.errors.forEach(error => {
          errors.push({
            code: 'GALLERY_AUTOMATION_ERROR',
            message: error,
            severity: 'medium',
            recoverable: true
          });
        });
      }

      logger.info('Browser-based VRBO scraping completed successfully', {
        url,
        totalImages,
        galleryImages: galleryResult.images.length,
        staticImages: staticImages.length,
        scrollCycles: galleryResult.scrollCyclesCompleted,
        processingTime: metadata.duration,
        dataCompleteness: metadata.dataCompleteness
      }, 'VRBO_BROWSER_SCRAPER');

      return {
        success: true,
        data: result,
        errors,
        metadata
      };

    } catch (error) {
      const scrapingError: ScrapingError = {
        code: 'BROWSER_SCRAPING_FAILED',
        message: error instanceof Error ? error.message : 'Unknown browser scraping error',
        severity: 'high',
        recoverable: finalOptions.useStaticFallback
      };
      
      errors.push(scrapingError);
      metadata.duration = Date.now() - startTime;
      metadata.fieldsFailed = ['browser_scraping'];
      
      logger.error('Browser-based VRBO scraping failed', error, 'VRBO_BROWSER_SCRAPER');
      
      errorReporter.reportError(error as Error, {
        context: 'VRBO_BROWSER_SCRAPER',
        url,
        sessionId,
        metadata
      });

      // Try static fallback if enabled
      if (finalOptions.useStaticFallback) {
        try {
          logger.info('Attempting static fallback scraping', { url }, 'VRBO_BROWSER_SCRAPER');
          const fallbackResult = await this.scrapeComprehensiveProperty(url);
          
          if (fallbackResult.success) {
            const browserMetadata = {
              sessionId: sessionId || 'failed',
              userAgent: this.browserManager.config?.userAgent || 'Unknown',
              screenResolution: 'Unknown',
              processingTime: Date.now() - startTime,
              memoryUsage: 0
            };

            const result: BrowserScrapingResult = {
              propertyData: fallbackResult.data!.propertyData,
              galleryImages: [],
              staticImages: fallbackResult.data!.images,
              totalImages: fallbackResult.data!.images.length,
              galleryLoadingResult: {
                scrollCyclesCompleted: 0,
                loadingTime: 0,
                errors: ['Browser automation failed, used static fallback']
              },
              browserMetadata
            };

            metadata.duration = Date.now() - startTime;
            metadata.dataCompleteness = 60; // Lower score for fallback
            metadata.fieldsScraped = ['static_fallback'];

            logger.info('Static fallback scraping succeeded', {
              url,
              totalImages: result.totalImages
            }, 'VRBO_BROWSER_SCRAPER');

            return {
              success: true,
              data: result,
              errors,
              metadata
            };
          }
        } catch (fallbackError) {
          logger.error('Static fallback also failed', fallbackError, 'VRBO_BROWSER_SCRAPER');
        }
      }

      return {
        success: false,
        errors,
        metadata
      };

    } finally {
      // Clean up browser session
      if (sessionId) {
        try {
          await this.browserManager.closeSession(sessionId);
        } catch (cleanupError) {
          logger.error('Error cleaning up browser session', cleanupError, 'VRBO_BROWSER_SCRAPER');
        }
      }
    }
  }

  /**
   * Extracts property data from the browser-loaded page
   * @param page - Puppeteer page instance
   * @param url - Original URL
   * @returns Promise<VRBOPropertyData>
   */
  private async extractPageData(page: any, url: string): Promise<VRBOPropertyData> {
    const html = await page.content();
    const propertyId = this.extractPropertyId(url) || 'unknown';
    
    // Use existing data extraction methods on the browser-loaded HTML
    const extractedData = await this.extractPropertyData(html, url, propertyId);
    
    return extractedData;
  }

  /**
   * Merges browser automation data with static scraping data
   * @param browserData - Data from browser automation
   * @param staticData - Data from static scraping
   * @param galleryImages - Images from gallery automation
   * @param staticImages - Images from static scraping
   * @returns Combined data
   */
  private mergeBrowserAndStaticData(
    browserData: VRBOPropertyData,
    staticData: VRBOPropertyData | null,
    galleryImages: PhotoData[],
    staticImages: PhotoData[]
  ): { propertyData: VRBOPropertyData; images: PhotoData[] } {
    // Merge property data, prioritizing browser data
    const mergedPropertyData: VRBOPropertyData = {
      ...browserData,
      // Enhance with static data if available
      ...(staticData ? {
        amenities: this.mergeAmenities(browserData.amenities || [], staticData.amenities || []),
        rooms: staticData.rooms && staticData.rooms.length > 0 ? staticData.rooms : browserData.rooms,
        description: browserData.description || staticData.description,
        specifications: {
          ...browserData.specifications,
          ...staticData.specifications
        }
      } : {})
    };

    // Merge images, prioritizing gallery images
    const allImages = [...galleryImages, ...staticImages];
    const uniqueImages = this.deduplicateImages(allImages);

    // Update property data with merged images
    mergedPropertyData.photos = uniqueImages;

    return {
      propertyData: mergedPropertyData,
      images: uniqueImages
    };
  }

  /**
   * Calculates browser-specific metadata
   * @param browserSession - Browser session
   * @param startTime - Start time
   * @returns Browser metadata
   */
  private async calculateBrowserMetadata(browserSession: any, startTime: number): Promise<BrowserScrapingResult['browserMetadata']> {
    try {
      const viewport = await browserSession.page.viewport();
      const metrics = await browserSession.page.metrics();
      
      return {
        sessionId: browserSession.sessionId,
        userAgent: await browserSession.page.evaluate(() => navigator.userAgent),
        screenResolution: `${viewport.width}x${viewport.height}`,
        processingTime: Date.now() - startTime,
        memoryUsage: metrics.JSHeapUsedSize || 0
      };
    } catch (error) {
      logger.warn('Failed to calculate browser metadata', error, 'VRBO_BROWSER_SCRAPER');
      return {
        sessionId: browserSession?.sessionId || 'unknown',
        userAgent: 'Unknown',
        screenResolution: 'Unknown',
        processingTime: Date.now() - startTime,
        memoryUsage: 0
      };
    }
  }

  /**
   * Calculates data completeness score for browser scraping
   * @param result - Browser scraping result
   * @returns Completeness score (0-100)
   */
  private calculateBrowserDataCompleteness(result: BrowserScrapingResult): number {
    let score = 0;
    
    // Base property data (40%)
    if (result.propertyData.title) score += 10;
    if (result.propertyData.description) score += 10;
    if (result.propertyData.amenities && result.propertyData.amenities.length > 0) score += 10;
    if (result.propertyData.specifications?.bedrooms) score += 5;
    if (result.propertyData.specifications?.bathrooms) score += 5;
    
    // Image extraction (50%)
    if (result.totalImages > 0) score += 20;
    if (result.totalImages >= 10) score += 10;
    if (result.totalImages >= 20) score += 10;
    if (result.galleryImages.length > 0) score += 10; // Bonus for gallery images
    
    // Automation success (10%)
    if (result.galleryLoadingResult.scrollCyclesCompleted > 0) score += 5;
    if (result.galleryLoadingResult.errors.length === 0) score += 5;
    
    return Math.round(Math.min(score, 100));
  }

  /**
   * Utility methods
   */
  private mergeAmenities(browserAmenities: any[], staticAmenities: any[]): any[] {
    const amenityMap = new Map<string, any>();
    
    // Add browser amenities first
    browserAmenities.forEach(amenity => {
      amenityMap.set(amenity.name.toLowerCase(), amenity);
    });
    
    // Add static amenities, avoiding duplicates
    staticAmenities.forEach(amenity => {
      if (!amenityMap.has(amenity.name.toLowerCase())) {
        amenityMap.set(amenity.name.toLowerCase(), amenity);
      }
    });
    
    return Array.from(amenityMap.values());
  }

  private deduplicateImages(images: PhotoData[]): PhotoData[] {
    const seen = new Set<string>();
    const unique: PhotoData[] = [];
    
    images.forEach(img => {
      const normalizedUrl = img.url.replace(/\?.*$/, '').toLowerCase();
      
      if (!seen.has(normalizedUrl)) {
        seen.add(normalizedUrl);
        unique.push(img);
      }
    });
    
    return unique;
  }

  /**
   * Cleanup method
   */
  async cleanup(): Promise<void> {
    await this.browserManager.closeAllSessions();
  }
}

// Export factory function
export const createVRBOBrowserScraper = (
  config?: Partial<ScraperConfig>,
  browserOptions?: Partial<BrowserScrapingOptions>
): VRBOBrowserScraper => {
  return new VRBOBrowserScraper(config, browserOptions);
};

// Export convenience function for direct browser scraping
export const scrapeBrowserVRBOProperty = async (
  url: string,
  options: Partial<BrowserScrapingOptions> = {}
): Promise<ScrapingResult<BrowserScrapingResult>> => {
  const scraper = createVRBOBrowserScraper();
  
  try {
    const result = await scraper.scrapeWithBrowserAutomation(url, options);
    return result;
  } finally {
    await scraper.cleanup();
  }
};