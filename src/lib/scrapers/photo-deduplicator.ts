// Photo Deduplicator for STR Certified Property Scrapers

import type {
  PhotoData,
  PhotoCategory,
  RoomType,
  PhotoDeduplicationResult,
} from "./types";

export class PhotoDeduplicator {
  private similarityThreshold: number;
  private enableAdvancedAnalysis: boolean;

  constructor(
    similarityThreshold: number = 0.85,
    enableAdvancedAnalysis: boolean = false,
  ) {
    this.similarityThreshold = similarityThreshold;
    this.enableAdvancedAnalysis = enableAdvancedAnalysis;
  }

  /**
   * Deduplicates photos and categorizes them by room and type
   * @param photos - Array of photo data to process
   * @returns PhotoDeduplicationResult
   */
  async deduplicatePhotos(
    photos: PhotoData[],
  ): Promise<PhotoDeduplicationResult> {
    const originalCount = photos.length;

    // Step 1: Remove exact duplicates (same URL)
    const urlDeduped = this.removeExactDuplicates(photos);

    // Step 2: Remove similar photos (based on metadata and naming patterns)
    const similarityDeduped = await this.removeSimilarPhotos(urlDeduped);

    // Step 3: Categorize photos by room and category
    const categorizedPhotos = this.categorizePhotos(similarityDeduped);
    const roomPhotos = this.groupPhotosByRoom(similarityDeduped);

    // Step 4: Identify unique room angles
    const uniqueAngles = this.identifyUniqueAngles(similarityDeduped);

    return {
      originalCount,
      uniquePhotos: uniqueAngles,
      duplicatesRemoved: originalCount - uniqueAngles.length,
      categorizedPhotos,
      roomPhotos,
    };
  }

  /**
   * Removes photos with identical URLs
   * @param photos - Photos to deduplicate
   * @returns PhotoData[]
   */
  private removeExactDuplicates(photos: PhotoData[]): PhotoData[] {
    const seen = new Set<string>();
    return photos.filter((photo) => {
      if (seen.has(photo.url)) {
        return false;
      }
      seen.add(photo.url);
      return true;
    });
  }

  /**
   * Removes similar photos based on metadata analysis
   * @param photos - Photos to analyze
   * @returns Promise<PhotoData[]>
   */
  private async removeSimilarPhotos(photos: PhotoData[]): Promise<PhotoData[]> {
    const unique: PhotoData[] = [];

    for (const photo of photos) {
      const isSimilar = await this.isSimilarToExisting(photo, unique);
      if (!isSimilar) {
        unique.push(photo);
      }
    }

    return unique;
  }

  /**
   * Checks if a photo is similar to any in the existing set
   * @param photo - Photo to check
   * @param existing - Existing unique photos
   * @returns Promise<boolean>
   */
  private async isSimilarToExisting(
    photo: PhotoData,
    existing: PhotoData[],
  ): Promise<boolean> {
    for (const existingPhoto of existing) {
      if (await this.arePhotosSimilar(photo, existingPhoto)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Determines if two photos are similar
   * @param photo1 - First photo
   * @param photo2 - Second photo
   * @returns Promise<boolean>
   */
  private async arePhotosSimilar(
    photo1: PhotoData,
    photo2: PhotoData,
  ): Promise<boolean> {
    // Basic similarity checks

    // Same category and room type
    if (photo1.category === photo2.category && photo1.room === photo2.room) {
      // Check filename similarity
      const filename1 = this.extractFilename(photo1.url);
      const filename2 = this.extractFilename(photo2.url);

      if (this.areFilenamesSimilar(filename1, filename2)) {
        return true;
      }

      // Check alt text similarity
      if (
        photo1.alt &&
        photo2.alt &&
        this.areAltTextsSimilar(photo1.alt, photo2.alt)
      ) {
        return true;
      }

      // Check size similarity (likely same photo in different resolutions)
      if (this.areSizesSimilar(photo1.size, photo2.size)) {
        return true;
      }
    }

    // If advanced analysis is enabled, use more sophisticated methods
    if (this.enableAdvancedAnalysis) {
      return await this.performAdvancedSimilarityAnalysis(photo1, photo2);
    }

    return false;
  }

  /**
   * Extracts filename from URL
   * @param url - Photo URL
   * @returns string
   */
  private extractFilename(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.substring(pathname.lastIndexOf("/") + 1);
    } catch {
      return url;
    }
  }

  /**
   * Checks if filenames indicate similar photos
   * @param filename1 - First filename
   * @param filename2 - Second filename
   * @returns boolean
   */
  private areFilenamesSimilar(filename1: string, filename2: string): boolean {
    // Remove extensions and common suffixes
    const clean1 = filename1
      .replace(/\.(jpg|jpeg|png|webp)$/i, "")
      .replace(/_\d+$/, "");
    const clean2 = filename2
      .replace(/\.(jpg|jpeg|png|webp)$/i, "")
      .replace(/_\d+$/, "");

    // Check if base names are the same
    if (clean1 === clean2) return true;

    // Check for common patterns like IMG_001, IMG_002
    const pattern1 = clean1.replace(/\d+/g, "X");
    const pattern2 = clean2.replace(/\d+/g, "X");

    return pattern1 === pattern2;
  }

  /**
   * Checks if alt texts are similar
   * @param alt1 - First alt text
   * @param alt2 - Second alt text
   * @returns boolean
   */
  private areAltTextsSimilar(alt1: string, alt2: string): boolean {
    const normalized1 = alt1
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim();
    const normalized2 = alt2
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim();

    // Exact match
    if (normalized1 === normalized2) return true;

    // Calculate word overlap
    const words1 = new Set(normalized1.split(/\s+/));
    const words2 = new Set(normalized2.split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    const jaccard = intersection.size / union.size;

    return jaccard > 0.7;
  }

  /**
   * Checks if photo sizes indicate they're the same image
   * @param size1 - First photo size
   * @param size2 - Second photo size
   * @returns boolean
   */
  private areSizesSimilar(
    size1: { width: number; height: number } | undefined,
    size2: { width: number; height: number } | undefined,
  ): boolean {
    if (!size1 || !size2) return false;

    // Check for exact matches
    if (size1.width === size2.width && size1.height === size2.height) {
      return true;
    }

    // Check for common aspect ratios (likely the same image resized)
    const ratio1 = size1.width / size1.height;
    const ratio2 = size2.width / size2.height;

    return Math.abs(ratio1 - ratio2) < 0.05;
  }

  /**
   * Performs advanced similarity analysis (placeholder for future AI integration)
   * @param photo1 - First photo
   * @param photo2 - Second photo
   * @returns Promise<boolean>
   */
  private async performAdvancedSimilarityAnalysis(
    photo1: PhotoData,
    photo2: PhotoData,
  ): Promise<boolean> {
    // This would integrate with image analysis AI in the future
    // For now, return false to maintain conservative deduplication
    return false;
  }

  /**
   * Categorizes photos by category
   * @param photos - Photos to categorize
   * @returns Record<PhotoCategory, PhotoData[]>
   */
  private categorizePhotos(
    photos: PhotoData[],
  ): Record<PhotoCategory, PhotoData[]> {
    const categories: Record<PhotoCategory, PhotoData[]> = {
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
      if (categories[photo.category]) {
        categories[photo.category].push(photo);
      } else {
        categories.other.push(photo);
      }
    });

    return categories;
  }

  /**
   * Groups photos by room type
   * @param photos - Photos to group
   * @returns Record<RoomType, PhotoData[]>
   */
  private groupPhotosByRoom(
    photos: PhotoData[],
  ): Record<RoomType, PhotoData[]> {
    const rooms: Record<RoomType, PhotoData[]> = {
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
      if (photo.room && rooms[photo.room]) {
        rooms[photo.room].push(photo);
      } else if (photo.room) {
        rooms.other.push(photo);
      }
    });

    return rooms;
  }

  /**
   * Identifies unique room angles and viewpoints
   * @param photos - Photos to analyze
   * @returns PhotoData[]
   */
  private identifyUniqueAngles(photos: PhotoData[]): PhotoData[] {
    // Group photos by room/category
    const grouped = new Map<string, PhotoData[]>();

    photos.forEach((photo) => {
      const key = `${photo.room || "unknown"}_${photo.category}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(photo);
    });

    const unique: PhotoData[] = [];

    // For each group, select the best representative photos
    grouped.forEach((groupPhotos, key) => {
      if (groupPhotos.length === 1) {
        unique.push(groupPhotos[0]);
      } else {
        // Select photos that represent different angles/viewpoints
        const selectedPhotos = this.selectUniqueAnglesFromGroup(groupPhotos);
        unique.push(...selectedPhotos);
      }
    });

    // Sort by original order
    return unique.sort((a, b) => a.order - b.order);
  }

  /**
   * Selects unique angles from a group of similar photos
   * @param photos - Group of photos from same room/category
   * @returns PhotoData[]
   */
  private selectUniqueAnglesFromGroup(photos: PhotoData[]): PhotoData[] {
    // For now, implement a simple selection strategy
    // In production, this could use AI to identify different viewpoints

    const selected: PhotoData[] = [];

    // Always include the first photo
    selected.push(photos[0]);

    // If there are multiple photos, try to select diverse ones
    if (photos.length > 1) {
      // Look for photos with different alt text patterns
      const altPatterns = new Set<string>();

      photos.forEach((photo) => {
        if (photo.alt) {
          const pattern = this.extractViewpointPattern(photo.alt);
          if (!altPatterns.has(pattern) && selected.length < 3) {
            altPatterns.add(pattern);
            if (!selected.includes(photo)) {
              selected.push(photo);
            }
          }
        }
      });

      // If still only one photo and we have more, add one more for variety
      if (selected.length === 1 && photos.length > 2) {
        selected.push(photos[Math.floor(photos.length / 2)]);
      }
    }

    return selected;
  }

  /**
   * Extracts viewpoint pattern from alt text
   * @param alt - Alt text
   * @returns string
   */
  private extractViewpointPattern(alt: string): string {
    const keywords = [
      "overview",
      "detail",
      "close-up",
      "wide",
      "angle",
      "view",
      "corner",
      "center",
      "side",
      "front",
      "back",
      "interior",
      "exterior",
    ];

    const lowerAlt = alt.toLowerCase();
    const foundKeywords = keywords.filter((keyword) =>
      lowerAlt.includes(keyword),
    );

    return foundKeywords.length > 0 ? foundKeywords.join("-") : "general";
  }
}

// Export factory function
export const createPhotoDeduplicator = (
  similarityThreshold?: number,
  enableAdvancedAnalysis?: boolean,
): PhotoDeduplicator => {
  return new PhotoDeduplicator(similarityThreshold, enableAdvancedAnalysis);
};

// Utility function for quick deduplication
export const deduplicatePhotos = async (
  photos: PhotoData[],
  options: {
    similarityThreshold?: number;
    enableAdvancedAnalysis?: boolean;
  } = {},
): Promise<PhotoDeduplicationResult> => {
  const deduplicator = createPhotoDeduplicator(
    options.similarityThreshold,
    options.enableAdvancedAnalysis,
  );

  return await deduplicator.deduplicatePhotos(photos);
};
