// Amenity Discovery Service - Compare inspection findings to listing data
import { logger } from '@/utils/logger';
import type { ScrapedPropertyData, PropertyAmenity, PropertyRoom, PhotoData, RoomType } from '@/lib/scrapers/types';
import type { InspectionForReview } from './auditorService';

export interface DiscoveredAmenity {
  name: string;
  category: string;
  confidence: number;
  evidence: {
    photos: string[];
    checklistItems: string[];
    reasoning: string;
  };
  currentStatus: 'not_listed' | 'listed_but_not_highlighted' | 'listed_incorrectly';
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AmenityComparisonResult {
  discoveredAmenities: DiscoveredAmenity[];
  missingFromListing: string[];
  incorrectlyListed: string[];
  wellDocumented: string[];
  suggestions: {
    descriptionAdditions: string[];
    amenityCheckboxes: string[];
    photoRecommendations: string[];
  };
}

export interface AmenityMatchingRule {
  amenityName: string;
  keywords: string[];
  photoKeywords: string[];
  checklistItemKeywords: string[];
  category: string;
  priority: 'high' | 'medium' | 'low';
  commonVariations: string[];
}

export class AmenityDiscoveryService {
  private readonly AMENITY_MATCHING_RULES: AmenityMatchingRule[] = [
    // High-value amenities that are commonly missed
    {
      amenityName: 'Pool',
      keywords: ['pool', 'swimming', 'chlorine', 'diving', 'deck chair', 'pool deck'],
      photoKeywords: ['pool', 'swimming', 'water', 'diving board', 'pool deck', 'poolside'],
      checklistItemKeywords: ['pool', 'swimming', 'pool safety', 'pool gate', 'pool fence'],
      category: 'outdoor',
      priority: 'high',
      commonVariations: ['swimming pool', 'outdoor pool', 'heated pool', 'saltwater pool']
    },
    {
      amenityName: 'Hot Tub/Spa',
      keywords: ['hot tub', 'spa', 'jacuzzi', 'whirlpool', 'jets'],
      photoKeywords: ['hot tub', 'spa', 'jacuzzi', 'jets', 'bubbles'],
      checklistItemKeywords: ['hot tub', 'spa', 'jacuzzi', 'whirlpool'],
      category: 'outdoor',
      priority: 'high',
      commonVariations: ['hot tub', 'spa', 'jacuzzi', 'whirlpool', 'outdoor spa']
    },
    {
      amenityName: 'Game Room',
      keywords: ['game room', 'games', 'pool table', 'ping pong', 'arcade', 'entertainment'],
      photoKeywords: ['pool table', 'ping pong', 'foosball', 'arcade', 'games', 'entertainment room'],
      checklistItemKeywords: ['game room', 'entertainment', 'pool table', 'games'],
      category: 'entertainment',
      priority: 'high',
      commonVariations: ['game room', 'entertainment room', 'rec room', 'play room']
    },
    {
      amenityName: 'Home Theater',
      keywords: ['theater', 'movie', 'projector', 'surround sound', 'cinema'],
      photoKeywords: ['projector', 'movie screen', 'theater seats', 'surround sound', 'cinema'],
      checklistItemKeywords: ['theater', 'movie room', 'projector', 'entertainment'],
      category: 'entertainment',
      priority: 'high',
      commonVariations: ['home theater', 'movie room', 'cinema room', 'media room']
    },
    {
      amenityName: 'Outdoor Kitchen',
      keywords: ['outdoor kitchen', 'grill', 'bbq', 'outdoor cooking', 'patio kitchen'],
      photoKeywords: ['outdoor grill', 'bbq', 'outdoor kitchen', 'patio cooking', 'outdoor stove'],
      checklistItemKeywords: ['outdoor kitchen', 'grill', 'bbq', 'outdoor cooking'],
      category: 'outdoor',
      priority: 'medium',
      commonVariations: ['outdoor kitchen', 'outdoor grill', 'bbq area', 'patio kitchen']
    },
    {
      amenityName: 'Fire Pit',
      keywords: ['fire pit', 'fire place', 'outdoor fire', 'campfire', 'fire bowl'],
      photoKeywords: ['fire pit', 'outdoor fire', 'campfire', 'fire bowl', 'fire ring'],
      checklistItemKeywords: ['fire pit', 'outdoor fire', 'fire safety'],
      category: 'outdoor',
      priority: 'medium',
      commonVariations: ['fire pit', 'outdoor fireplace', 'fire bowl', 'campfire area']
    },
    {
      amenityName: 'Gym/Fitness Equipment',
      keywords: ['gym', 'fitness', 'exercise', 'weights', 'treadmill', 'workout'],
      photoKeywords: ['gym equipment', 'treadmill', 'weights', 'exercise bike', 'fitness'],
      checklistItemKeywords: ['gym', 'fitness', 'exercise equipment', 'workout room'],
      category: 'entertainment',
      priority: 'medium',
      commonVariations: ['home gym', 'fitness room', 'workout room', 'exercise room']
    },
    {
      amenityName: 'Office/Workspace',
      keywords: ['office', 'workspace', 'desk', 'computer', 'work from home', 'study'],
      photoKeywords: ['office', 'desk', 'computer', 'workspace', 'study room'],
      checklistItemKeywords: ['office', 'workspace', 'desk', 'work area'],
      category: 'general',
      priority: 'medium',
      commonVariations: ['home office', 'workspace', 'study room', 'work area']
    },
    {
      amenityName: 'Balcony/Patio',
      keywords: ['balcony', 'patio', 'deck', 'outdoor seating', 'terrace'],
      photoKeywords: ['balcony', 'patio', 'deck', 'outdoor furniture', 'terrace'],
      checklistItemKeywords: ['balcony', 'patio', 'deck', 'outdoor space'],
      category: 'outdoor',
      priority: 'low',
      commonVariations: ['balcony', 'patio', 'deck', 'terrace', 'outdoor space']
    },
    {
      amenityName: 'Laundry Room',
      keywords: ['laundry', 'washer', 'dryer', 'washing machine', 'laundry room'],
      photoKeywords: ['washer', 'dryer', 'laundry room', 'washing machine'],
      checklistItemKeywords: ['laundry', 'washer', 'dryer', 'washing machine'],
      category: 'laundry',
      priority: 'low',
      commonVariations: ['laundry room', 'washer/dryer', 'laundry area', 'washing facilities']
    }
  ];

  /**
   * Compare inspection findings against scraped property data
   */
  async compareInspectionToListing(
    inspection: InspectionForReview,
    scrapedData: ScrapedPropertyData
  ): Promise<AmenityComparisonResult> {
    try {
      logger.info('Starting amenity comparison analysis', { 
        inspectionId: inspection.id,
        scrapedAmenities: scrapedData.amenities.length 
      }, 'AMENITY_DISCOVERY');

      const discoveredAmenities: DiscoveredAmenity[] = [];
      const missingFromListing: string[] = [];
      const incorrectlyListed: string[] = [];
      const wellDocumented: string[] = [];

      // Analyze each amenity matching rule
      for (const rule of this.AMENITY_MATCHING_RULES) {
        const discovery = await this.analyzeAmenityRule(rule, inspection, scrapedData);
        
        if (discovery) {
          discoveredAmenities.push(discovery);
          
          if (discovery.currentStatus === 'not_listed') {
            missingFromListing.push(discovery.name);
          } else if (discovery.currentStatus === 'listed_incorrectly') {
            incorrectlyListed.push(discovery.name);
          }
        }
      }

      // Identify well-documented amenities
      scrapedData.amenities.forEach(amenity => {
        const hasEvidence = this.hasInspectionEvidence(amenity.name, inspection);
        if (hasEvidence) {
          wellDocumented.push(amenity.name);
        }
      });

      // Generate suggestions
      const suggestions = this.generateSuggestions(discoveredAmenities, scrapedData);

      logger.info('Amenity comparison completed', {
        discovered: discoveredAmenities.length,
        missing: missingFromListing.length,
        wellDocumented: wellDocumented.length
      }, 'AMENITY_DISCOVERY');

      return {
        discoveredAmenities,
        missingFromListing,
        incorrectlyListed,
        wellDocumented,
        suggestions
      };

    } catch (error) {
      logger.error('Failed to compare inspection to listing', error, 'AMENITY_DISCOVERY');
      throw error;
    }
  }

  /**
   * Analyze a specific amenity rule against inspection data
   */
  private async analyzeAmenityRule(
    rule: AmenityMatchingRule,
    inspection: InspectionForReview,
    scrapedData: ScrapedPropertyData
  ): Promise<DiscoveredAmenity | null> {
    const evidence = {
      photos: [] as string[],
      checklistItems: [] as string[],
      reasoning: ''
    };

    // Check checklist items for evidence
    const relevantChecklistItems = inspection.checklist_items.filter(item => {
      const itemText = `${item.title} ${item.ai_reasoning} ${item.notes}`.toLowerCase();
      return rule.checklistItemKeywords.some(keyword => itemText.includes(keyword.toLowerCase()));
    });

    relevantChecklistItems.forEach(item => {
      evidence.checklistItems.push(item.title);
      
      // Collect photos from relevant checklist items
      item.media_files.forEach(media => {
        if (media.type === 'photo') {
          evidence.photos.push(media.url);
        }
      });
    });

    // Check scraped description for mentions
    const description = scrapedData.description.toLowerCase();
    const keywordMatches = rule.keywords.filter(keyword => 
      description.includes(keyword.toLowerCase())
    );

    // Check if amenity is already listed
    const isListed = scrapedData.amenities.some(amenity => 
      rule.commonVariations.some(variation => 
        amenity.name.toLowerCase().includes(variation.toLowerCase())
      )
    );

    // Determine if we have evidence of this amenity
    const hasEvidence = evidence.checklistItems.length > 0 || evidence.photos.length > 0;

    if (!hasEvidence) {
      return null; // No evidence found
    }

    // Calculate confidence based on evidence strength
    let confidence = 0;
    if (evidence.checklistItems.length > 0) confidence += 40;
    if (evidence.photos.length > 0) confidence += 30;
    if (keywordMatches.length > 0) confidence += 20;
    if (evidence.checklistItems.length > 1) confidence += 10;

    // Determine current status
    let currentStatus: 'not_listed' | 'listed_but_not_highlighted' | 'listed_incorrectly';
    let suggestion: string;

    if (!isListed && keywordMatches.length === 0) {
      currentStatus = 'not_listed';
      suggestion = `Consider adding "${rule.amenityName}" to your listing amenities and description. We found evidence of this feature during inspection.`;
    } else if (isListed && keywordMatches.length === 0) {
      currentStatus = 'listed_but_not_highlighted';
      suggestion = `"${rule.amenityName}" is checked as an amenity but not mentioned in your description. Consider highlighting this feature in your property description.`;
    } else {
      currentStatus = 'listed_incorrectly';
      suggestion = `"${rule.amenityName}" may need description updates based on what we observed during inspection.`;
    }

    // Generate reasoning
    evidence.reasoning = this.generateReasoning(rule, evidence, keywordMatches);

    return {
      name: rule.amenityName,
      category: rule.category,
      confidence,
      evidence,
      currentStatus,
      suggestion,
      priority: rule.priority
    };
  }

  /**
   * Check if an amenity has inspection evidence
   */
  private hasInspectionEvidence(amenityName: string, inspection: InspectionForReview): boolean {
    const searchText = amenityName.toLowerCase();
    
    return inspection.checklist_items.some(item => {
      const itemText = `${item.title} ${item.ai_reasoning} ${item.notes}`.toLowerCase();
      return itemText.includes(searchText);
    });
  }

  /**
   * Generate actionable suggestions
   */
  private generateSuggestions(
    discoveredAmenities: DiscoveredAmenity[],
    scrapedData: ScrapedPropertyData
  ): { descriptionAdditions: string[]; amenityCheckboxes: string[]; photoRecommendations: string[] } {
    const descriptionAdditions: string[] = [];
    const amenityCheckboxes: string[] = [];
    const photoRecommendations: string[] = [];

    discoveredAmenities.forEach(discovery => {
      if (discovery.currentStatus === 'not_listed') {
        amenityCheckboxes.push(`Check "${discovery.name}" in your listing amenities`);
        descriptionAdditions.push(`Add "${discovery.name}" to your property description`);
      } else if (discovery.currentStatus === 'listed_but_not_highlighted') {
        descriptionAdditions.push(`Highlight "${discovery.name}" more prominently in your description`);
      }

      if (discovery.evidence.photos.length > 0 && discovery.priority === 'high') {
        photoRecommendations.push(`Consider featuring "${discovery.name}" photos more prominently in your listing`);
      }
    });

    return {
      descriptionAdditions,
      amenityCheckboxes,
      photoRecommendations
    };
  }

  /**
   * Generate reasoning for discovered amenity
   */
  private generateReasoning(
    rule: AmenityMatchingRule,
    evidence: { photos: string[]; checklistItems: string[]; reasoning: string },
    keywordMatches: string[]
  ): string {
    const reasons: string[] = [];

    if (evidence.checklistItems.length > 0) {
      reasons.push(`Found ${evidence.checklistItems.length} inspection item(s) related to ${rule.amenityName}`);
    }

    if (evidence.photos.length > 0) {
      reasons.push(`Found ${evidence.photos.length} photo(s) showing ${rule.amenityName}`);
    }

    if (keywordMatches.length > 0) {
      reasons.push(`Description mentions: ${keywordMatches.join(', ')}`);
    } else {
      reasons.push(`No mention found in property description`);
    }

    return reasons.join('. ');
  }

  /**
   * Get amenity matching rules for testing/debugging
   */
  getAmenityRules(): AmenityMatchingRule[] {
    return this.AMENITY_MATCHING_RULES;
  }

  /**
   * Analyze specific room types for common amenities
   */
  async analyzeRoomAmenities(
    inspection: InspectionForReview,
    scrapedData: ScrapedPropertyData
  ): Promise<{ roomType: string; discoveredAmenities: string[]; suggestions: string[] }[]> {
    const roomAnalysis: { roomType: string; discoveredAmenities: string[]; suggestions: string[] }[] = [];

    // Common room types to analyze
    const roomTypes = ['kitchen', 'living_room', 'bedroom', 'bathroom', 'outdoor'];

    for (const roomType of roomTypes) {
      const roomItems = inspection.checklist_items.filter(item => 
        item.title.toLowerCase().includes(roomType) || 
        (item as { room_type?: string }).room_type?.toLowerCase() === roomType
      );

      const discoveredAmenities: string[] = [];
      const suggestions: string[] = [];

      roomItems.forEach(item => {
        // Analyze room-specific features
        const features = this.extractRoomFeatures(item.title, item.ai_reasoning, roomType);
        discoveredAmenities.push(...features);
      });

      if (discoveredAmenities.length > 0) {
        suggestions.push(`Consider highlighting ${roomType} features: ${discoveredAmenities.join(', ')}`);
      }

      if (discoveredAmenities.length > 0) {
        roomAnalysis.push({
          roomType,
          discoveredAmenities,
          suggestions
        });
      }
    }

    return roomAnalysis;
  }

  /**
   * Extract room-specific features from inspection items
   */
  private extractRoomFeatures(title: string, reasoning: string, roomType: string): string[] {
    const features: string[] = [];
    const text = `${title} ${reasoning}`.toLowerCase();

    // Room-specific feature mappings
    const roomFeatures: Record<string, string[]> = {
      kitchen: ['dishwasher', 'microwave', 'coffee maker', 'island', 'breakfast bar', 'pantry'],
      living_room: ['fireplace', 'tv', 'sound system', 'sectional', 'views'],
      bedroom: ['walk-in closet', 'ensuite', 'tv', 'balcony access', 'king bed', 'queen bed'],
      bathroom: ['jetted tub', 'walk-in shower', 'double vanity', 'heated floors'],
      outdoor: ['deck', 'patio', 'garden', 'bbq', 'outdoor seating', 'fire pit']
    };

    const relevantFeatures = roomFeatures[roomType] || [];
    
    relevantFeatures.forEach(feature => {
      if (text.includes(feature)) {
        features.push(feature);
      }
    });

    return features;
  }
}

// Export singleton instance
export const amenityDiscoveryService = new AmenityDiscoveryService();