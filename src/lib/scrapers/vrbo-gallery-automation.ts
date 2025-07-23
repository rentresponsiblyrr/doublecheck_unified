// VRBO Gallery Automation - Handles Dynamic Photo Loading
// Implements the specific click + scroll sequence needed for VRBO image extraction

import { Page } from "puppeteer";
import { logger } from "../../utils/logger";
import { aiDecisionLogger } from "../ai/decision-logger";
import { BrowserManager } from "./browser-manager";
import type { PhotoData } from "./types";

export interface GalleryAutomationConfig {
  scrollCycles: number;
  scrollWaitTime: number;
  clickWaitTime: number;
  loadWaitTime: number;
  maxWaitForImages: number;
  enableScreenshots: boolean;
  screenshotPath?: string;
}

export interface GalleryLoadingResult {
  images: PhotoData[];
  totalImagesFound: number;
  scrollCyclesCompleted: number;
  loadingTime: number;
  screenshots: string[];
  errors: string[];
}

export class VRBOGalleryAutomation {
  private browserManager: BrowserManager;
  private config: GalleryAutomationConfig;

  private defaultConfig: GalleryAutomationConfig = {
    scrollCycles: 5,
    scrollWaitTime: 3000,
    clickWaitTime: 2000,
    loadWaitTime: 1000,
    maxWaitForImages: 30000,
    enableScreenshots: false,
    screenshotPath: "/tmp/vrbo-screenshots",
  };

  constructor(
    browserManager: BrowserManager,
    config: Partial<GalleryAutomationConfig> = {},
  ) {
    this.browserManager = browserManager;
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Executes the complete VRBO gallery loading sequence
   * @param page - Puppeteer page instance
   * @param url - VRBO property URL
   * @returns Promise<GalleryLoadingResult>
   */
  async loadAllGalleryImages(
    page: Page,
    url: string,
  ): Promise<GalleryLoadingResult> {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const errors: string[] = [];

    try {
      await aiDecisionLogger.logSimpleDecision(
        `Starting VRBO gallery automation for ${url}`,
        "gallery_automation",
        "Executing click + scroll sequence to load all property images",
        [url],
        "high",
      );

      // Step 1: Navigate to the property page
      logger.info(
        "Navigating to VRBO property page",
        { url },
        "GALLERY_AUTOMATION",
      );
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: this.config.maxWaitForImages,
      });

      // Take initial screenshot
      if (this.config.enableScreenshots) {
        const screenshotPath = await this.takeScreenshot(page, "initial-load");
        screenshots.push(screenshotPath);
      }

      // Step 2: Find and click the first photo to open gallery
      const galleryOpened = await this.openPhotoGallery(page);
      if (!galleryOpened) {
        errors.push("Failed to open photo gallery");
        return this.createErrorResult(errors, screenshots, startTime);
      }

      // Take screenshot after gallery opens
      if (this.config.enableScreenshots) {
        const screenshotPath = await this.takeScreenshot(
          page,
          "gallery-opened",
        );
        screenshots.push(screenshotPath);
      }

      // Step 3: Execute the scroll sequence to load all images
      const scrollResults = await this.executeScrollSequence(page, screenshots);

      // Step 4: Extract all loaded images
      const images = await this.extractGalleryImages(page);

      const loadingTime = Date.now() - startTime;

      logger.info(
        "Gallery automation completed successfully",
        {
          url,
          totalImages: images.length,
          scrollCycles: scrollResults.cyclesCompleted,
          loadingTime,
          errorsCount: errors.length,
        },
        "GALLERY_AUTOMATION",
      );

      return {
        images,
        totalImagesFound: images.length,
        scrollCyclesCompleted: scrollResults.cyclesCompleted,
        loadingTime,
        screenshots,
        errors,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(errorMessage);

      logger.error("Gallery automation failed", error, "GALLERY_AUTOMATION");

      return this.createErrorResult(errors, screenshots, startTime);
    }
  }

  /**
   * Finds and clicks the first photo to open the gallery modal
   * @param page - Puppeteer page instance
   * @returns Promise<boolean> - Success status
   */
  private async openPhotoGallery(page: Page): Promise<boolean> {
    try {
      logger.info("Attempting to open photo gallery", {}, "GALLERY_AUTOMATION");

      // Wait for images to load
      await page.waitForTimeout(this.config.loadWaitTime);

      // Common selectors for VRBO photo gallery triggers
      const gallerySelectors = [
        'button[data-testid="photo-gallery-button"]',
        'img[data-testid="hero-image"]',
        ".hero-image img",
        ".property-photos img:first-child",
        ".photo-gallery-trigger",
        ".property-image-gallery img:first-child",
        '[data-testid="property-image"] img:first-child',
        ".carousel-item img:first-child",
        ".image-gallery img:first-child",
      ];

      // Try each selector until one works
      for (const selector of gallerySelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            logger.info(
              "Found gallery trigger element",
              { selector },
              "GALLERY_AUTOMATION",
            );

            // Scroll element into view
            await page.evaluate((sel) => {
              const elem = document.querySelector(sel);
              if (elem) {
                elem.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, selector);

            await page.waitForTimeout(500);

            // Human-like click
            await this.browserManager.humanMouseMove(
              page,
              await element.evaluate(
                (el) =>
                  el.getBoundingClientRect().x +
                  el.getBoundingClientRect().width / 2,
              ),
              await element.evaluate(
                (el) =>
                  el.getBoundingClientRect().y +
                  el.getBoundingClientRect().height / 2,
              ),
            );

            await element.click();
            await page.waitForTimeout(this.config.clickWaitTime);

            // Check if gallery modal opened
            const galleryOpened = await this.waitForGalleryModal(page);
            if (galleryOpened) {
              logger.info(
                "Gallery modal opened successfully",
                { selector },
                "GALLERY_AUTOMATION",
              );
              return true;
            }
          }
        } catch (selectorError) {
          // Continue to next selector
          logger.debug(
            "Gallery selector failed",
            { selector, error: selectorError },
            "GALLERY_AUTOMATION",
          );
        }
      }

      // Alternative approach: click on any large image
      try {
        const largeImages = await page.$$("img");
        for (const img of largeImages) {
          const dimensions = await img.evaluate((el) => ({
            width: el.offsetWidth,
            height: el.offsetHeight,
          }));

          // Click on images that are likely to be gallery triggers (large images)
          if (dimensions.width > 200 && dimensions.height > 150) {
            await img.click();
            await page.waitForTimeout(this.config.clickWaitTime);

            const galleryOpened = await this.waitForGalleryModal(page);
            if (galleryOpened) {
              logger.info(
                "Gallery opened via large image click",
                { dimensions },
                "GALLERY_AUTOMATION",
              );
              return true;
            }
          }
        }
      } catch (error) {
        logger.debug(
          "Large image click approach failed",
          { error },
          "GALLERY_AUTOMATION",
        );
      }

      logger.warn("Could not open gallery modal", {}, "GALLERY_AUTOMATION");
      return false;
    } catch (error) {
      logger.error("Error opening photo gallery", error, "GALLERY_AUTOMATION");
      return false;
    }
  }

  /**
   * Waits for the gallery modal to appear
   * @param page - Puppeteer page instance
   * @returns Promise<boolean> - Whether modal opened
   */
  private async waitForGalleryModal(page: Page): Promise<boolean> {
    const modalSelectors = [
      '[data-testid="photo-gallery-modal"]',
      ".photo-gallery-modal",
      ".gallery-modal",
      ".image-gallery-modal",
      ".photo-carousel-modal",
      ".property-photos-modal",
      '[role="dialog"]',
      ".modal-content",
    ];

    try {
      for (const selector of modalSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 });
          logger.info(
            "Gallery modal detected",
            { selector },
            "GALLERY_AUTOMATION",
          );
          return true;
        } catch (error) {
          // Continue to next selector
        }
      }

      // Alternative: check for overlay or backdrop
      const hasOverlay = await page.evaluate(() => {
        const overlays = document.querySelectorAll(
          '[class*="overlay"], [class*="backdrop"], [class*="modal"]',
        );
        return overlays.length > 0;
      });

      if (hasOverlay) {
        logger.info(
          "Gallery modal detected via overlay",
          {},
          "GALLERY_AUTOMATION",
        );
        return true;
      }

      return false;
    } catch (error) {
      logger.debug("Modal detection failed", { error }, "GALLERY_AUTOMATION");
      return false;
    }
  }

  /**
   * Executes the scroll sequence to load all images
   * @param page - Puppeteer page instance
   * @param screenshots - Array to store screenshot paths
   * @returns Promise<{cyclesCompleted: number}>
   */
  private async executeScrollSequence(
    page: Page,
    screenshots: string[],
  ): Promise<{ cyclesCompleted: number }> {
    logger.info(
      "Starting scroll sequence",
      {
        totalCycles: this.config.scrollCycles,
        waitTime: this.config.scrollWaitTime,
      },
      "GALLERY_AUTOMATION",
    );

    let cyclesCompleted = 0;

    for (let cycle = 1; cycle <= this.config.scrollCycles; cycle++) {
      try {
        logger.debug(
          `Executing scroll cycle ${cycle}/${this.config.scrollCycles}`,
          {},
          "GALLERY_AUTOMATION",
        );

        // Count images before scrolling
        const imagesBefore = await this.countVisibleImages(page);

        // Scroll down in the gallery
        await this.browserManager.humanScroll(page, "down", 400);

        // Wait for images to load
        await page.waitForTimeout(this.config.scrollWaitTime);

        // Count images after scrolling
        const imagesAfter = await this.countVisibleImages(page);

        logger.debug(
          `Scroll cycle ${cycle} completed`,
          {
            imagesBefore,
            imagesAfter,
            newImages: imagesAfter - imagesBefore,
          },
          "GALLERY_AUTOMATION",
        );

        // Take screenshot after each cycle
        if (this.config.enableScreenshots) {
          const screenshotPath = await this.takeScreenshot(
            page,
            `scroll-cycle-${cycle}`,
          );
          screenshots.push(screenshotPath);
        }

        cyclesCompleted++;

        // If no new images loaded, we might have reached the end
        if (imagesAfter === imagesBefore && cycle > 2) {
          logger.info(
            "No new images loaded, stopping scroll sequence",
            {
              cycle,
              totalImages: imagesAfter,
            },
            "GALLERY_AUTOMATION",
          );
          break;
        }
      } catch (error) {
        logger.error(
          `Scroll cycle ${cycle} failed`,
          error,
          "GALLERY_AUTOMATION",
        );
        // Continue with next cycle
      }
    }

    logger.info(
      "Scroll sequence completed",
      {
        cyclesCompleted,
        totalCycles: this.config.scrollCycles,
      },
      "GALLERY_AUTOMATION",
    );

    return { cyclesCompleted };
  }

  /**
   * Counts visible images in the gallery
   * @param page - Puppeteer page instance
   * @returns Promise<number>
   */
  private async countVisibleImages(page: Page): Promise<number> {
    return await page.evaluate(() => {
      const images = document.querySelectorAll("img");
      let visibleCount = 0;

      images.forEach((img) => {
        const rect = img.getBoundingClientRect();
        if (
          rect.width > 0 &&
          rect.height > 0 &&
          img.src &&
          img.src.includes("vrbo")
        ) {
          visibleCount++;
        }
      });

      return visibleCount;
    });
  }

  /**
   * Extracts all images from the gallery
   * @param page - Puppeteer page instance
   * @returns Promise<PhotoData[]>
   */
  private async extractGalleryImages(page: Page): Promise<PhotoData[]> {
    logger.info("Extracting gallery images", {}, "GALLERY_AUTOMATION");

    const images = await page.evaluate(() => {
      const imageElements = document.querySelectorAll("img");
      const extractedImages: any[] = [];

      imageElements.forEach((img, index) => {
        const src = img.src;
        const alt = img.alt || "";
        const rect = img.getBoundingClientRect();

        // Filter for VRBO images that are visible and have reasonable size
        if (
          src &&
          src.includes("vrbo") &&
          rect.width > 50 &&
          rect.height > 50 &&
          !src.includes("avatar") &&
          !src.includes("icon")
        ) {
          extractedImages.push({
            url: src,
            alt,
            size: {
              width: rect.width,
              height: rect.height,
            },
            order: index + 1,
          });
        }
      });

      return extractedImages;
    });

    // Convert to PhotoData format and categorize
    const photoData: PhotoData[] = images.map((img, index) => ({
      url: img.url,
      thumbnailUrl: this.generateThumbnailUrl(img.url),
      alt: img.alt,
      category: this.categorizeImageByUrl(img.url),
      room: this.categorizeImageByRoom(img.url, img.alt),
      size: img.size,
      order: index + 1,
    }));

    // Remove duplicates
    const uniquePhotos = this.deduplicateImages(photoData);

    logger.info(
      "Gallery image extraction completed",
      {
        totalImages: images.length,
        uniqueImages: uniquePhotos.length,
      },
      "GALLERY_AUTOMATION",
    );

    return uniquePhotos;
  }

  /**
   * Takes a screenshot for debugging
   * @param page - Puppeteer page instance
   * @param suffix - Filename suffix
   * @returns Promise<string> - Screenshot path
   */
  private async takeScreenshot(page: Page, suffix: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `vrbo-gallery-${suffix}-${timestamp}.png`;
      const path = `${this.config.screenshotPath}/${filename}`;

      await page.screenshot({ path, fullPage: true });

      logger.debug("Screenshot taken", { path }, "GALLERY_AUTOMATION");
      return path;
    } catch (error) {
      logger.error("Failed to take screenshot", error, "GALLERY_AUTOMATION");
      return "";
    }
  }

  /**
   * Creates an error result object
   * @param errors - Array of error messages
   * @param screenshots - Array of screenshot paths
   * @param startTime - Start time for duration calculation
   * @returns GalleryLoadingResult
   */
  private createErrorResult(
    errors: string[],
    screenshots: string[],
    startTime: number,
  ): GalleryLoadingResult {
    return {
      images: [],
      totalImagesFound: 0,
      scrollCyclesCompleted: 0,
      loadingTime: Date.now() - startTime,
      screenshots,
      errors,
    };
  }

  /**
   * Utility methods for image processing
   */
  private generateThumbnailUrl(url: string): string {
    // Try to generate thumbnail URL from high-res URL
    if (url.includes("vrbo") || url.includes("homeaway")) {
      return url
        .replace(/\/\d+\//, "/150/")
        .replace(/\.(jpg|jpeg|png|webp)/i, "_150.$1");
    }
    return url;
  }

  private categorizeImageByUrl(
    url: string,
  ):
    | "exterior"
    | "interior"
    | "bedroom"
    | "bathroom"
    | "kitchen"
    | "living_area"
    | "outdoor_space"
    | "amenity"
    | "view"
    | "other" {
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
    alt: string,
  ):
    | "bedroom"
    | "bathroom"
    | "kitchen"
    | "living_room"
    | "dining_room"
    | "office"
    | "game_room"
    | "balcony"
    | "patio"
    | "garage"
    | "basement"
    | "attic"
    | "other"
    | undefined {
    const lowerUrl = url.toLowerCase();
    const lowerAlt = alt.toLowerCase();

    if (lowerUrl.includes("kitchen") || lowerAlt.includes("kitchen"))
      return "kitchen";
    if (lowerUrl.includes("bedroom") || lowerAlt.includes("bedroom"))
      return "bedroom";
    if (lowerUrl.includes("bathroom") || lowerAlt.includes("bathroom"))
      return "bathroom";
    if (lowerUrl.includes("living") || lowerAlt.includes("living"))
      return "living_room";
    if (lowerUrl.includes("dining") || lowerAlt.includes("dining"))
      return "dining_room";
    if (lowerUrl.includes("office") || lowerAlt.includes("office"))
      return "office";
    if (lowerUrl.includes("game") || lowerAlt.includes("game"))
      return "game_room";
    if (lowerUrl.includes("balcony") || lowerAlt.includes("balcony"))
      return "balcony";
    if (lowerUrl.includes("patio") || lowerAlt.includes("patio"))
      return "patio";
    if (lowerUrl.includes("garage") || lowerAlt.includes("garage"))
      return "garage";

    return undefined;
  }

  private deduplicateImages(images: PhotoData[]): PhotoData[] {
    const seen = new Set<string>();
    const unique: PhotoData[] = [];

    images.forEach((img) => {
      const normalizedUrl = img.url.replace(/\?.*$/, "").toLowerCase();

      if (!seen.has(normalizedUrl)) {
        seen.add(normalizedUrl);
        unique.push(img);
      }
    });

    return unique;
  }
}
