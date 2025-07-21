// VRBO Data Extractor - Phase 3: Comprehensive Data Extraction
// Handles amenity parsing, detailed descriptions, and room-by-room data extraction

import { ProductionVRBOScraper } from './production-vrbo-scraper';
import { aiDecisionLogger } from '../ai/decision-logger';
import { logger } from '../../utils/logger';
import type { 
  ScrapingResult, 
  PropertyAmenity, 
  PropertyRoom, 
  VRBOPropertyData,
  AmenityCategory,
  RoomType,
  PropertySpecifications,
  PropertyLocation,
  ScrapingMetadata,
  ScrapingError
} from './types';

interface AmenityExtractionOptions {
  includeHidden: boolean;
  expandCollapsed: boolean;
  categorizeByRoom: boolean;
  verifyWithAI: boolean;
  extractDescriptions: boolean;
}

interface DescriptionExtractionOptions {
  includeFormatting: boolean;
  extractHighlights: boolean;
  parseStructuredData: boolean;
  maxLength: number;
}

interface RoomExtractionOptions {
  detectRoomTypes: boolean;
  extractDimensions: boolean;
  includeFeatures: boolean;
  linkToAmenities: boolean;
}

interface DataExtractionResult {
  amenities: PropertyAmenity[];
  descriptions: {
    main: string;
    highlights: string[];
    structured: Record<string, string>;
  };
  rooms: PropertyRoom[];
  specifications: PropertySpecifications;
  location: PropertyLocation;
  extractionStats: {
    amenitiesFound: number;
    roomsDetected: number;
    descriptionsExtracted: number;
    hiddenDataRevealed: number;
  };
}

export class VRBODataExtractor extends ProductionVRBOScraper {
  private defaultAmenityOptions: AmenityExtractionOptions = {
    includeHidden: true,
    expandCollapsed: true,
    categorizeByRoom: true,
    verifyWithAI: false,
    extractDescriptions: true
  };

  private defaultDescriptionOptions: DescriptionExtractionOptions = {
    includeFormatting: true,
    extractHighlights: true,
    parseStructuredData: true,
    maxLength: 5000
  };

  private defaultRoomOptions: RoomExtractionOptions = {
    detectRoomTypes: true,
    extractDimensions: true,
    includeFeatures: true,
    linkToAmenities: true
  };

  /**
   * Comprehensive data extraction from VRBO property page
   * @param url - VRBO property URL
   * @param options - Extraction options
   * @returns Promise<ScrapingResult<DataExtractionResult>>
   */
  async extractComprehensiveData(
    url: string, 
    amenityOptions: Partial<AmenityExtractionOptions> = {},
    descriptionOptions: Partial<DescriptionExtractionOptions> = {},
    roomOptions: Partial<RoomExtractionOptions> = {}
  ): Promise<ScrapingResult<DataExtractionResult>> {
    const finalAmenityOptions = { ...this.defaultAmenityOptions, ...amenityOptions };
    const finalDescriptionOptions = { ...this.defaultDescriptionOptions, ...descriptionOptions };
    const finalRoomOptions = { ...this.defaultRoomOptions, ...roomOptions };
    const startTime = Date.now();
    
    const metadata: ScrapingMetadata = {
      scrapedAt: new Date(),
      duration: 0,
      sourceUrl: url,
      userAgent: this.httpClient.defaults.headers['User-Agent'] as string,
      rateLimited: false,
      dataCompleteness: 0,
      fieldsScraped: [],
      fieldsFailed: []
    };

    try {
      // Log comprehensive data extraction start
      await aiDecisionLogger.logSimpleDecision(
        `Starting comprehensive VRBO data extraction: ${url}`,
        'data_extraction',
        `Extracting amenities, descriptions, and room data with advanced parsing`,
        [url],
        'high'
      );

      // Validate URL
      if (!this.isValidVRBOUrl(url)) {
        throw new Error('Invalid VRBO URL provided');
      }

      // Fetch the main property page
      const html = await this.fetchMainPropertyPage(url);
      
      // Extract amenities with advanced parsing
      const amenities = await this.extractAdvancedAmenities(html, finalAmenityOptions);
      
      // Extract detailed descriptions
      const descriptions = await this.extractDetailedDescriptions(html, finalDescriptionOptions);
      
      // Extract room-by-room data
      const rooms = await this.extractRoomData(html, finalRoomOptions);
      
      // Extract enhanced specifications
      const specifications = await this.extractEnhancedSpecifications(html, amenities, rooms);
      
      // Extract detailed location data
      const location = await this.extractDetailedLocation(html);
      
      // Calculate extraction statistics
      const extractionStats = {
        amenitiesFound: amenities.length,
        roomsDetected: rooms.length,
        descriptionsExtracted: Object.keys(descriptions.structured).length + (descriptions.main ? 1 : 0),
        hiddenDataRevealed: this.calculateHiddenDataCount(html, amenities, descriptions)
      };
      
      const result: DataExtractionResult = {
        amenities,
        descriptions,
        rooms,
        specifications,
        location,
        extractionStats
      };

      // Calculate metadata
      metadata.duration = Date.now() - startTime;
      metadata.dataCompleteness = this.calculateComprehensiveDataCompleteness(result);
      metadata.fieldsScraped = ['amenities', 'descriptions', 'rooms', 'specifications', 'location'];

      logger.info('VRBO comprehensive data extraction completed successfully', {
        amenitiesFound: extractionStats.amenitiesFound,
        roomsDetected: extractionStats.roomsDetected,
        dataCompleteness: metadata.dataCompleteness,
        duration: metadata.duration
      }, 'VRBO_DATA_EXTRACTOR');

      return {
        success: true,
        data: result,
        errors: [],
        metadata
      };

    } catch (error) {
      const scrapingError: ScrapingError = {
        code: 'DATA_EXTRACTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown data extraction error',
        severity: 'high',
        recoverable: true
      };
      
      metadata.duration = Date.now() - startTime;
      metadata.fieldsFailed = ['comprehensive_data'];
      
      logger.error('VRBO comprehensive data extraction failed', error, 'VRBO_DATA_EXTRACTOR');

      return {
        success: false,
        errors: [scrapingError],
        metadata
      };
    }
  }

  /**
   * Extracts amenities with advanced parsing including hidden/collapsed sections
   * @param html - HTML content
   * @param options - Amenity extraction options
   * @returns Promise<PropertyAmenity[]>
   */
  private async extractAdvancedAmenities(html: string, options: AmenityExtractionOptions): Promise<PropertyAmenity[]> {
    const amenities: PropertyAmenity[] = [];
    const foundAmenityNames = new Set<string>();

    // Extract from structured JSON-LD data first
    const jsonLdAmenities = this.extractJsonLdAmenities(html);
    amenities.push(...jsonLdAmenities);
    jsonLdAmenities.forEach(amenity => foundAmenityNames.add(amenity.name.toLowerCase()));

    // Extract from visible amenity lists
    const visibleAmenities = this.extractVisibleAmenities(html);
    visibleAmenities.forEach(amenity => {
      if (!foundAmenityNames.has(amenity.name.toLowerCase())) {
        amenities.push(amenity);
        foundAmenityNames.add(amenity.name.toLowerCase());
      }
    });

    // Extract from collapsed/hidden sections if enabled
    if (options.includeHidden) {
      const hiddenAmenities = this.extractHiddenAmenities(html);
      hiddenAmenities.forEach(amenity => {
        if (!foundAmenityNames.has(amenity.name.toLowerCase())) {
          amenities.push(amenity);
          foundAmenityNames.add(amenity.name.toLowerCase());
        }
      });
    }

    // Extract from data attributes and JavaScript
    const dataAttributeAmenities = this.extractDataAttributeAmenities(html);
    dataAttributeAmenities.forEach(amenity => {
      if (!foundAmenityNames.has(amenity.name.toLowerCase())) {
        amenities.push(amenity);
        foundAmenityNames.add(amenity.name.toLowerCase());
      }
    });

    // Categorize amenities by room if enabled
    if (options.categorizeByRoom) {
      return this.categorizeAmenitiesByRoom(amenities, html);
    }

    return amenities;
  }

  /**
   * Extracts amenities from JSON-LD structured data
   * @param html - HTML content
   * @returns PropertyAmenity[]
   */
  private extractJsonLdAmenities(html: string): PropertyAmenity[] {
    const amenities: PropertyAmenity[] = [];
    
    try {
      const jsonLdRegex = /<script[^>]*type=[\"']application\/ld\+json[\"'][^>]*>(.*?)<\/script>/gis;
      const matches = html.match(jsonLdRegex);
      
      if (matches) {
        matches.forEach(match => {
          try {
            const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
            const data = JSON.parse(jsonContent);
            
            // Look for amenity features in various JSON-LD properties
            const amenityProperties = ['amenityFeature', 'features', 'additionalProperty'];
            
            amenityProperties.forEach(prop => {
              if (data[prop]) {
                const features = Array.isArray(data[prop]) ? data[prop] : [data[prop]];
                
                features.forEach((feature: unknown) => {
                  let amenityName: string;
                  
                  if (typeof feature === 'string') {
                    amenityName = feature;
                  } else if (feature.name) {
                    amenityName = feature.name;
                  } else if (feature.value) {
                    amenityName = feature.value;
                  } else {
                    return;
                  }
                  
                  amenities.push({
                    name: this.cleanAmenityName(amenityName),
                    verified: true,
                    category: this.categorizeAmenity(amenityName),
                    priority: this.prioritizeAmenity(amenityName),
                    description: feature.description || undefined
                  });
                });
              }
            });
          } catch (e) {
            // Continue to next script tag
          }
        });
      }
    } catch (error) {
      logger.warn('Failed to extract JSON-LD amenities', error, 'VRBO_DATA_EXTRACTOR');
    }
    
    return amenities;
  }

  /**
   * Extracts amenities from visible UI elements
   * @param html - HTML content
   * @returns PropertyAmenity[]
   */
  private extractVisibleAmenities(html: string): PropertyAmenity[] {
    const amenities: PropertyAmenity[] = [];
    
    // Common patterns for amenity lists
    const amenityPatterns = [
      // List items with amenity-related classes
      /<li[^>]*class="[^"]*amenity[^"]*"[^>]*>([^<]+)</gi,
      /<li[^>]*class="[^"]*feature[^"]*"[^>]*>([^<]+)</gi,
      /<div[^>]*class="[^"]*amenity[^"]*"[^>]*>([^<]+)<\/div>/gi,
      /<span[^>]*class="[^"]*amenity[^"]*"[^>]*>([^<]+)<\/span>/gi,
      
      // Data attributes
      /data-amenity="([^"]+)"/gi,
      /data-feature="([^"]+)"/gi,
      
      // Icon-based amenity detection
      /<i[^>]*class="[^"]*(?:wifi|pool|parking|kitchen|gym|spa)[^"]*"[^>]*><\/i>[^<]*<[^>]*>([^<]+)/gi
    ];
    
    amenityPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const amenityText = this.cleanAmenityName(match[1]);
        if (amenityText && amenityText.length > 2 && amenityText.length < 100) {
          amenities.push({
            name: amenityText,
            verified: false,
            category: this.categorizeAmenity(amenityText),
            priority: this.prioritizeAmenity(amenityText)
          });
        }
      }
    });
    
    return amenities;
  }

  /**
   * Extracts amenities from hidden/collapsed sections
   * @param html - HTML content
   * @returns PropertyAmenity[]
   */
  private extractHiddenAmenities(html: string): PropertyAmenity[] {
    const amenities: PropertyAmenity[] = [];
    
    // Look for hidden content sections
    const hiddenPatterns = [
      // Hidden divs with display:none or similar
      /<div[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>(.*?)<\/div>/gis,
      /<div[^>]*class="[^"]*hidden[^"]*"[^>]*>(.*?)<\/div>/gis,
      /<div[^>]*class="[^"]*collapse[^"]*"[^>]*>(.*?)<\/div>/gis,
      
      // Expandable sections
      /<div[^>]*class="[^"]*expandable[^"]*"[^>]*>(.*?)<\/div>/gis,
      /<div[^>]*data-toggle="collapse"[^>]*>(.*?)<\/div>/gis,
      
      // Modal content
      /<div[^>]*class="[^"]*modal[^"]*"[^>]*>(.*?)<\/div>/gis
    ];
    
    hiddenPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const hiddenContent = match[1];
        
        // Extract amenities from hidden content using standard patterns
        const hiddenAmenities = this.extractVisibleAmenities(hiddenContent);
        amenities.push(...hiddenAmenities);
      }
    });
    
    return amenities;
  }

  /**
   * Extracts amenities from data attributes and JavaScript variables
   * @param html - HTML content
   * @returns PropertyAmenity[]
   */
  private extractDataAttributeAmenities(html: string): PropertyAmenity[] {
    const amenities: PropertyAmenity[] = [];
    
    // Extract from JavaScript configuration objects
    const jsPatterns = [
      /amenities\s*:\s*\[([^\]]+)\]/gi,
      /features\s*:\s*\[([^\]]+)\]/gi,
      /"amenities":\s*\[([^\]]+)\]/gi,
      /"features":\s*\[([^\]]+)\]/gi
    ];
    
    jsPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const amenityArray = match[1];
        
        // Extract quoted strings from the array
        const quotedStrings = amenityArray.match(/"([^"]+)"/g) || [];
        quotedStrings.forEach(quoted => {
          const amenityName = quoted.replace(/"/g, '');
          if (amenityName && amenityName.length > 2) {
            amenities.push({
              name: this.cleanAmenityName(amenityName),
              verified: true,
              category: this.categorizeAmenity(amenityName),
              priority: this.prioritizeAmenity(amenityName)
            });
          }
        });
      }
    });
    
    return amenities;
  }

  /**
   * Categorizes amenities by room type
   * @param amenities - Array of amenities
   * @param html - HTML content for context
   * @returns PropertyAmenity[]
   */
  private categorizeAmenitiesByRoom(amenities: PropertyAmenity[], html: string): PropertyAmenity[] {
    return amenities.map(amenity => {
      const roomContext = this.detectAmenityRoomContext(amenity.name, html);
      return {
        ...amenity,
        roomType: roomContext
      };
    });
  }

  /**
   * Detects which room an amenity belongs to based on context
   * @param amenityName - Name of the amenity
   * @param html - HTML content for context analysis
   * @returns RoomType | undefined
   */
  private detectAmenityRoomContext(amenityName: string, html: string): RoomType | undefined {
    const name = amenityName.toLowerCase();
    
    // Direct room indicators in amenity name
    if (name.includes('kitchen') || name.includes('cooking') || name.includes('fridge') || name.includes('microwave')) {
      return 'kitchen';
    }
    if (name.includes('bedroom') || name.includes('bed ') || name.includes('mattress')) {
      return 'bedroom';
    }
    if (name.includes('bathroom') || name.includes('shower') || name.includes('bathtub')) {
      return 'bathroom';
    }
    if (name.includes('living') || name.includes('sofa') || name.includes('couch')) {
      return 'living_room';
    }
    if (name.includes('dining') || name.includes('table')) {
      return 'dining_room';
    }
    if (name.includes('office') || name.includes('desk') || name.includes('workspace')) {
      return 'office';
    }
    if (name.includes('game') || name.includes('entertainment') || name.includes('pool table')) {
      return 'game_room';
    }
    if (name.includes('balcony') || name.includes('terrace')) {
      return 'balcony';
    }
    if (name.includes('patio') || name.includes('deck') || name.includes('outdoor dining')) {
      return 'patio';
    }
    if (name.includes('garage') || name.includes('car') || name.includes('parking')) {
      return 'garage';
    }
    
    // Look for context clues in surrounding HTML
    const amenityPattern = new RegExp(amenityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const amenityMatch = html.search(amenityPattern);
    
    if (amenityMatch !== -1) {
      const contextStart = Math.max(0, amenityMatch - 500);
      const contextEnd = Math.min(html.length, amenityMatch + 500);
      const context = html.slice(contextStart, contextEnd).toLowerCase();
      
      if (context.includes('kitchen')) return 'kitchen';
      if (context.includes('bedroom')) return 'bedroom';
      if (context.includes('bathroom')) return 'bathroom';
      if (context.includes('living')) return 'living_room';
      if (context.includes('dining')) return 'dining_room';
    }
    
    return undefined;
  }

  /**
   * Extracts detailed property descriptions with formatting
   * @param html - HTML content
   * @param options - Description extraction options
   * @returns Object with main description, highlights, and structured data
   */
  private async extractDetailedDescriptions(html: string, options: DescriptionExtractionOptions): Promise<{
    main: string;
    highlights: string[];
    structured: Record<string, string>;
  }> {
    const descriptions = {
      main: '',
      highlights: [] as string[],
      structured: {} as Record<string, string>
    };

    // Extract main description from common patterns
    const descriptionPatterns = [
      // Meta description
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)/i,
      // Open Graph description
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)/i,
      // Structured description sections
      /<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/gis,
      /<section[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/section>/gis,
      // Property overview sections
      /<div[^>]*class="[^"]*overview[^"]*"[^>]*>(.*?)<\/div>/gis,
      /<div[^>]*class="[^"]*summary[^"]*"[^>]*>(.*?)<\/div>/gis
    ];

    for (const pattern of descriptionPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let description = match[1];
        
        if (options.includeFormatting) {
          description = this.preserveDescriptionFormatting(description);
        } else {
          description = this.cleanText(description);
        }
        
        if (description.length > descriptions.main.length && description.length <= options.maxLength) {
          descriptions.main = description;
        }
      }
    }

    // Extract highlights/bullet points
    if (options.extractHighlights) {
      descriptions.highlights = this.extractDescriptionHighlights(html);
    }

    // Extract structured data sections
    if (options.parseStructuredData) {
      descriptions.structured = this.extractStructuredDescriptions(html);
    }

    return descriptions;
  }

  /**
   * Preserves formatting in descriptions while cleaning HTML
   * @param description - Raw description HTML
   * @returns Formatted description text
   */
  private preserveDescriptionFormatting(description: string): string {
    return description
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Extracts highlight points from descriptions
   * @param html - HTML content
   * @returns Array of highlight strings
   */
  private extractDescriptionHighlights(html: string): string[] {
    const highlights: string[] = [];
    
    // Look for bullet point lists
    const listPatterns = [
      /<ul[^>]*>(.*?)<\/ul>/gis,
      /<ol[^>]*>(.*?)<\/ol>/gis
    ];
    
    listPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const listContent = match[1];
        const listItems = listContent.match(/<li[^>]*>(.*?)<\/li>/gis) || [];
        
        listItems.forEach(item => {
          const cleanItem = this.cleanText(item.replace(/<li[^>]*>|<\/li>/gi, ''));
          if (cleanItem && cleanItem.length > 10 && cleanItem.length < 200) {
            highlights.push(cleanItem);
          }
        });
      }
    });
    
    return highlights.slice(0, 20); // Limit to 20 highlights
  }

  /**
   * Extracts structured description sections
   * @param html - HTML content
   * @returns Object with structured description data
   */
  private extractStructuredDescriptions(html: string): Record<string, string> {
    const structured: Record<string, string> = {};
    
    // Look for labeled sections
    const sectionPatterns = [
      // Sections with headers
      /<h[1-6][^>]*>([^<]+)<\/h[1-6]>[^<]*<[^>]*>([^<]+)/gi,
      // Definition lists
      /<dt[^>]*>([^<]+)<\/dt>[^<]*<dd[^>]*>([^<]+)<\/dd>/gi,
      // Labeled divs
      /<div[^>]*class="[^"]*label[^"]*"[^>]*>([^<]+)<\/div>[^<]*<div[^>]*>([^<]+)<\/div>/gi
    ];
    
    sectionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const label = this.cleanText(match[1]);
        const content = this.cleanText(match[2]);
        
        if (label && content && label.length < 100 && content.length < 1000) {
          structured[label] = content;
        }
      }
    });
    
    return structured;
  }

  /**
   * Extracts room-by-room data from the property page
   * @param html - HTML content
   * @param options - Room extraction options
   * @returns PropertyRoom[]
   */
  private async extractRoomData(html: string, options: RoomExtractionOptions): Promise<PropertyRoom[]> {
    const rooms: PropertyRoom[] = [];
    
    // Extract from structured data first
    const jsonLdRooms = this.extractJsonLdRooms(html);
    rooms.push(...jsonLdRooms);
    
    // Extract from description text patterns
    const descriptionRooms = this.extractRoomsFromDescription(html);
    rooms.push(...descriptionRooms);
    
    // Extract from explicit room sections
    const sectionRooms = this.extractRoomsFromSections(html);
    rooms.push(...sectionRooms);
    
    // Deduplicate and enhance rooms
    const uniqueRooms = this.deduplicateRooms(rooms);
    
    if (options.extractDimensions) {
      return this.enhanceRoomsWithDimensions(uniqueRooms, html);
    }
    
    return uniqueRooms;
  }

  /**
   * Utility methods for amenity processing
   */
  private cleanAmenityName(name: string): string {
    return name
      .replace(/[^\w\s\-\/&]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private prioritizeAmenity(amenityName: string): 'essential' | 'important' | 'nice_to_have' {
    const name = amenityName.toLowerCase();
    
    // Essential amenities
    if (name.includes('wifi') || name.includes('internet') || 
        name.includes('kitchen') || name.includes('parking') ||
        name.includes('heating') || name.includes('air conditioning')) {
      return 'essential';
    }
    
    // Important amenities
    if (name.includes('pool') || name.includes('hot tub') || 
        name.includes('washer') || name.includes('dryer') ||
        name.includes('tv') || name.includes('dishwasher')) {
      return 'important';
    }
    
    return 'nice_to_have';
  }

  /**
   * Placeholder methods for room extraction (to be implemented)
   */
  private extractJsonLdRooms(html: string): PropertyRoom[] {
    // Implementation for JSON-LD room extraction
    return [];
  }

  private extractRoomsFromDescription(html: string): PropertyRoom[] {
    // Implementation for description-based room extraction
    return [];
  }

  private extractRoomsFromSections(html: string): PropertyRoom[] {
    // Implementation for section-based room extraction
    return [];
  }

  private deduplicateRooms(rooms: PropertyRoom[]): PropertyRoom[] {
    // Implementation for room deduplication
    return rooms;
  }

  private enhanceRoomsWithDimensions(rooms: PropertyRoom[], html: string): PropertyRoom[] {
    // Implementation for dimension extraction
    return rooms;
  }

  private async extractEnhancedSpecifications(html: string, amenities: PropertyAmenity[], rooms: PropertyRoom[]): Promise<PropertySpecifications> {
    // Enhanced specifications extraction
    return this.getDefaultSpecifications();
  }

  private async extractDetailedLocation(html: string): Promise<PropertyLocation> {
    // Detailed location extraction
    return this.getDefaultLocation();
  }

  private calculateHiddenDataCount(html: string, amenities: PropertyAmenity[], descriptions: unknown): number {
    // Calculate how much hidden data was revealed
    return 0;
  }

  private calculateComprehensiveDataCompleteness(result: DataExtractionResult): number {
    let score = 0;
    
    // Amenities score (30%)
    if (result.amenities.length > 0) {
      score += Math.min((result.amenities.length / 20) * 30, 30);
    }
    
    // Descriptions score (25%)
    if (result.descriptions.main) score += 15;
    if (result.descriptions.highlights.length > 0) score += 5;
    if (Object.keys(result.descriptions.structured).length > 0) score += 5;
    
    // Rooms score (25%)
    if (result.rooms.length > 0) {
      score += Math.min((result.rooms.length / 5) * 25, 25);
    }
    
    // Specifications score (10%)
    if (result.specifications.bedrooms > 0) score += 3;
    if (result.specifications.bathrooms > 0) score += 3;
    if (result.specifications.maxGuests > 0) score += 4;
    
    // Location score (10%)
    if (result.location.city && result.location.city !== 'Unknown') score += 5;
    if (result.location.state && result.location.state !== 'Unknown') score += 3;
    if (result.location.address) score += 2;
    
    return Math.round(Math.min(score, 100));
  }
}

// Export factory function
export const createVRBODataExtractor = (config?: Record<string, unknown>): VRBODataExtractor => {
  return new VRBODataExtractor(config);
};