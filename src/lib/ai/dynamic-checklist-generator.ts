// Dynamic Checklist Generator for STR Certified MVP
// Creates property-specific checklists from VRBO data and amenities

import { STRCertifiedAIService } from './openai-service';
import { aiDecisionLogger } from './decision-logger';
import { logger } from '../../utils/logger';
import type { VRBOPropertyData, PropertyAmenity } from '../scrapers/types';

// Dynamic Checklist Types
export interface DynamicChecklistItem {
  id: string;
  title: string;
  description: string;
  category: ChecklistCategory;
  required: boolean;
  evidenceRequired: boolean;
  safetyRelated: boolean;
  complianceRequired: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTimeMinutes: number;
  order: number;
  roomSpecific?: string;
  amenityRelated?: string[];
  passFailOptions: ('pass' | 'fail' | 'not_applicable')[];
  naRequiresNote: boolean;
  expectedSubjects: string[];
  qualityThreshold: number;
  isVideoWalkthrough?: boolean;
  canRename?: boolean;
  instructions?: string;
  referencePhotos?: string[];
  metadata: {
    generatedFrom: 'vrbo_amenity' | 'property_type' | 'safety_requirement' | 'compliance_rule' | 'bedroom_count';
    sourceData: Record<string, unknown>;
    aiGenerated: boolean;
  };
}

export type ChecklistCategory = 
  | 'safety'
  | 'compliance'
  | 'amenities'
  | 'cleanliness'
  | 'maintenance'
  | 'documentation'
  | 'kitchen'
  | 'bedrooms'
  | 'bathrooms'
  | 'outdoor'
  | 'entertainment'
  | 'accessibility'
  | 'emergency'
  | 'general';

export interface ChecklistGenerationOptions {
  includeVideoWalkthrough: boolean;
  includeSafetyChecks: boolean;
  includeComplianceChecks: boolean;
  includeAmenityVerification: boolean;
  includeRoomSpecificItems: boolean;
  customRequirements?: string[];
  jurisdictionRules?: string[];
  propertyTypeRules?: string[];
}

export interface ChecklistGenerationResult {
  items: DynamicChecklistItem[];
  totalItems: number;
  estimatedTimeMinutes: number;
  categories: Record<ChecklistCategory, number>;
  generationMetadata: {
    propertyId: string;
    generatedAt: string;
    sourceAmenities: number;
    aiGenerated: number;
    manuallyAdded: number;
    processingTime: number;
  };
}

export class DynamicChecklistGenerator {
  private static instance: DynamicChecklistGenerator;
  private aiService: STRCertifiedAIService;
  private baseRequirements: DynamicChecklistItem[] = [];

  private constructor() {
    // AI service disabled for security - API key should never be in browser
    this.aiService = null as any;
    
    this.initializeBaseRequirements();
  }

  static getInstance(): DynamicChecklistGenerator {
    if (!DynamicChecklistGenerator.instance) {
      DynamicChecklistGenerator.instance = new DynamicChecklistGenerator();
    }
    return DynamicChecklistGenerator.instance;
  }

  /**
   * Generates a complete dynamic checklist from VRBO property data
   * @param propertyData - VRBO property data
   * @param options - Generation options
   * @returns Promise<ChecklistGenerationResult>
   */
  async generateChecklistFromVRBO(
    propertyData: VRBOPropertyData,
    options: ChecklistGenerationOptions = {
      includeVideoWalkthrough: true,
      includeSafetyChecks: true,
      includeComplianceChecks: true,
      includeAmenityVerification: true,
      includeRoomSpecificItems: true
    }
  ): Promise<ChecklistGenerationResult> {
    const startTime = Date.now();
    
    try {
      // Log checklist generation start
      await aiDecisionLogger.logSimpleDecision(
        `Generate dynamic checklist for property`,
        'architectural_choice',
        `Generating checklist for ${propertyData.specifications.bedrooms}BR/${propertyData.specifications.bathrooms}BA property with ${propertyData.amenities.length} amenities`,
        [],
        'high'
      );

      const items: DynamicChecklistItem[] = [];
      let currentOrder = 1;

      // 1. ALWAYS add video walkthrough as first item (mandatory for all inspections)
      items.push(this.createVideoWalkthroughItem(1));
      currentOrder = 2; // Start all other items at order 2

      // 2. Generate bedroom-specific items
      if (options.includeRoomSpecificItems) {
        const bedroomItems = this.generateBedroomItems(
          propertyData.specifications.bedrooms,
          propertyData.rooms,
          currentOrder
        );
        items.push(...bedroomItems);
        currentOrder += bedroomItems.length;
      }

      // 3. Generate bathroom items
      if (options.includeRoomSpecificItems) {
        const bathroomItems = this.generateBathroomItems(
          propertyData.specifications.bathrooms,
          propertyData.rooms,
          currentOrder
        );
        items.push(...bathroomItems);
        currentOrder += bathroomItems.length;
      }

      // 4. Generate amenity-specific items
      if (options.includeAmenityVerification) {
        const amenityItems = await this.generateAmenityItems(
          propertyData.amenities,
          currentOrder
        );
        items.push(...amenityItems);
        currentOrder += amenityItems.length;
      }

      // 5. Add safety requirements
      if (options.includeSafetyChecks) {
        const safetyItems = this.generateSafetyItems(propertyData, currentOrder);
        items.push(...safetyItems);
        currentOrder += safetyItems.length;
      }

      // 6. Add compliance requirements
      if (options.includeComplianceChecks) {
        const complianceItems = this.generateComplianceItems(propertyData, currentOrder);
        items.push(...complianceItems);
        currentOrder += complianceItems.length;
      }

      // 7. Add listing verification items
      const verificationItems = this.generateListingVerificationItems(propertyData, currentOrder);
      items.push(...verificationItems);
      currentOrder += verificationItems.length;

      // 8. Add general inspection items
      const generalItems = this.generateGeneralItems(propertyData, currentOrder);
      items.push(...generalItems);

      // 9. Use AI to enhance and validate the checklist
      const enhancedItems = await this.enhanceChecklistWithAI(items, propertyData);

      // Calculate metadata
      const totalEstimatedTime = enhancedItems.reduce((sum, item) => sum + item.estimatedTimeMinutes, 0);
      const categories = this.calculateCategoryDistribution(enhancedItems);
      const aiGenerated = enhancedItems.filter(item => item.metadata.aiGenerated).length;

      const result: ChecklistGenerationResult = {
        items: enhancedItems,
        totalItems: enhancedItems.length,
        estimatedTimeMinutes: totalEstimatedTime,
        categories,
        generationMetadata: {
          propertyId: propertyData.vrboId,
          generatedAt: new Date().toISOString(),
          sourceAmenities: propertyData.amenities.length,
          aiGenerated,
          manuallyAdded: enhancedItems.length - aiGenerated,
          processingTime: Date.now() - startTime
        }
      };

      logger.info(`Dynamic checklist generated`, {
        propertyId: propertyData.vrboId,
        totalItems: result.totalItems,
        estimatedTime: result.estimatedTimeMinutes,
        categories: Object.keys(categories).length,
        processingTime: result.generationMetadata.processingTime
      }, 'CHECKLIST_GENERATION');

      return result;

    } catch (error) {
      logger.error('Failed to generate dynamic checklist', error, 'CHECKLIST_GENERATION');
      throw error;
    }
  }

  /**
   * Creates the mandatory video walkthrough item - ALWAYS FIRST
   * @param order - Order in the checklist (should always be 1)
   * @returns DynamicChecklistItem
   */
  private createVideoWalkthroughItem(order: number): DynamicChecklistItem {
    return {
      id: 'video_walkthrough_001',
      title: '🎥 Property Video Walkthrough',
      description: 'Great! Before we go through the full checklist, let\'s get our bearings. Give me a video tour of the property to help orient the audit process.',
      category: 'documentation',
      required: true,
      evidenceRequired: true,
      safetyRelated: false,
      complianceRequired: true,
      priority: 'critical',
      estimatedTimeMinutes: 15,
      order: 1, // Always first, regardless of input order
      passFailOptions: ['pass', 'fail'],
      naRequiresNote: false,
      expectedSubjects: ['all_rooms', 'exterior', 'amenities', 'safety_equipment', 'property_overview'],
      qualityThreshold: 80,
      isVideoWalkthrough: true,
      canRename: false,
      instructions: 'Click the record button to start your video walkthrough. Walk through each room slowly, narrating key features, amenities, and the overall condition. Show all areas guests will access including bedrooms, bathrooms, kitchen, living areas, and any outdoor spaces.',
      referencePhotos: [],
      metadata: {
        generatedFrom: 'safety_requirement',
        sourceData: { 
          type: 'mandatory_walkthrough',
          isFirstItem: true,
          requiresPermissions: ['camera', 'microphone']
        },
        aiGenerated: false
      }
    };
  }

  /**
   * Generates bedroom-specific checklist items
   * @param bedroomCount - Number of bedrooms
   * @param rooms - Room data from VRBO
   * @param startOrder - Starting order number
   * @returns DynamicChecklistItem[]
   */
  private generateBedroomItems(
    bedroomCount: number,
    rooms: Array<{type: string; count?: number; features?: string[]}>,
    startOrder: number
  ): DynamicChecklistItem[] {
    const items: DynamicChecklistItem[] = [];
    
    for (let i = 1; i <= bedroomCount; i++) {
      const bedroomItem: DynamicChecklistItem = {
        id: `bedroom_${i}_inspection`,
        title: `Bedroom ${i}`,
        description: `Inspect bedroom ${i} for cleanliness, safety, and amenities`,
        category: 'bedrooms',
        required: true,
        evidenceRequired: true,
        safetyRelated: true,
        complianceRequired: false,
        priority: 'high',
        estimatedTimeMinutes: 8,
        order: startOrder + i - 1,
        roomSpecific: `bedroom_${i}`,
        passFailOptions: ['pass', 'fail', 'not_applicable'],
        naRequiresNote: true,
        expectedSubjects: ['bed', 'furniture', 'lighting', 'windows', 'outlets'],
        qualityThreshold: 75,
        canRename: true,
        instructions: `Check bed quality, linens, furniture condition, lighting, and safety features. Rename if needed (e.g., "Primary Bedroom", "Kids Room").`,
        metadata: {
          generatedFrom: 'bedroom_count',
          sourceData: { bedroomNumber: i, totalBedrooms: bedroomCount },
          aiGenerated: false
        }
      };
      
      items.push(bedroomItem);
    }
    
    return items;
  }

  /**
   * Generates bathroom-specific checklist items
   * @param bathroomCount - Number of bathrooms
   * @param rooms - Room data from VRBO
   * @param startOrder - Starting order number
   * @returns DynamicChecklistItem[]
   */
  private generateBathroomItems(
    bathroomCount: number,
    rooms: Array<{type: string; count?: number; features?: string[]}>,
    startOrder: number
  ): DynamicChecklistItem[] {
    const items: DynamicChecklistItem[] = [];
    
    for (let i = 1; i <= bathroomCount; i++) {
      const bathroomItem: DynamicChecklistItem = {
        id: `bathroom_${i}_inspection`,
        title: `Bathroom ${i}`,
        description: `Inspect bathroom ${i} for cleanliness, functionality, and safety`,
        category: 'bathrooms',
        required: true,
        evidenceRequired: true,
        safetyRelated: true,
        complianceRequired: true,
        priority: 'high',
        estimatedTimeMinutes: 10,
        order: startOrder + i - 1,
        roomSpecific: `bathroom_${i}`,
        passFailOptions: ['pass', 'fail', 'not_applicable'],
        naRequiresNote: true,
        expectedSubjects: ['toilet', 'sink', 'shower_tub', 'fixtures', 'ventilation'],
        qualityThreshold: 80,
        canRename: false,
        instructions: `Check all fixtures, plumbing, cleanliness, ventilation, and safety features. Test water pressure and temperature.`,
        metadata: {
          generatedFrom: 'property_type',
          sourceData: { bathroomNumber: i, totalBathrooms: bathroomCount },
          aiGenerated: false
        }
      };
      
      items.push(bathroomItem);
    }
    
    return items;
  }

  /**
   * Generates amenity-specific checklist items using AI
   * @param amenities - Property amenities from VRBO
   * @param startOrder - Starting order number
   * @returns Promise<DynamicChecklistItem[]>
   */
  private async generateAmenityItems(
    amenities: PropertyAmenity[],
    startOrder: number
  ): Promise<DynamicChecklistItem[]> {
    const items: DynamicChecklistItem[] = [];
    
    // Filter high-priority amenities that need verification
    const verifiableAmenities = amenities.filter(amenity => 
      amenity.priority === 'essential' || 
      amenity.priority === 'important' ||
      amenity.category === 'safety'
    );

    for (let i = 0; i < verifiableAmenities.length; i++) {
      const amenity = verifiableAmenities[i];
      const item = await this.createAmenityChecklistItem(amenity, startOrder + i);
      items.push(item);
    }

    return items;
  }

  /**
   * Creates a checklist item for a specific amenity
   * @param amenity - Property amenity
   * @param order - Order in checklist
   * @returns Promise<DynamicChecklistItem>
   */
  private async createAmenityChecklistItem(
    amenity: PropertyAmenity,
    order: number
  ): Promise<DynamicChecklistItem> {
    const amenityInstructions = this.getAmenityInstructions(amenity);
    
    return {
      id: `amenity_${amenity.name.toLowerCase().replace(/\s+/g, '_')}_${order}`,
      title: `${amenity.name} Verification`,
      description: `Verify the ${amenity.name} is present, functional, and matches listing description`,
      category: this.mapAmenityToCategory(amenity.category),
      required: amenity.priority === 'essential',
      evidenceRequired: true,
      safetyRelated: amenity.category === 'safety',
      complianceRequired: amenity.category === 'safety' || amenity.category === 'accessibility',
      priority: this.mapAmenityPriority(amenity.priority),
      estimatedTimeMinutes: this.getAmenityInspectionTime(amenity),
      order,
      amenityRelated: [amenity.name],
      passFailOptions: ['pass', 'fail', 'not_applicable'],
      naRequiresNote: true,
      expectedSubjects: this.getAmenityExpectedSubjects(amenity),
      qualityThreshold: amenity.priority === 'essential' ? 85 : 75,
      canRename: false,
      instructions: amenityInstructions,
      metadata: {
        generatedFrom: 'vrbo_amenity',
        sourceData: amenity,
        aiGenerated: false
      }
    };
  }

  /**
   * Generates safety-related checklist items
   * @param propertyData - VRBO property data
   * @param startOrder - Starting order number
   * @returns DynamicChecklistItem[]
   */
  private generateSafetyItems(
    propertyData: VRBOPropertyData,
    startOrder: number
  ): DynamicChecklistItem[] {
    const safetyItems: DynamicChecklistItem[] = [
      {
        id: 'smoke_detector_check',
        title: 'Smoke Detector Inspection',
        description: 'Verify smoke detectors are present, functional, and have fresh batteries',
        category: 'safety',
        required: true,
        evidenceRequired: true,
        safetyRelated: true,
        complianceRequired: true,
        priority: 'critical',
        estimatedTimeMinutes: 5,
        order: startOrder,
        passFailOptions: ['pass', 'fail'],
        naRequiresNote: false,
        expectedSubjects: ['smoke_detector', 'battery_indicator', 'test_button'],
        qualityThreshold: 90,
        canRename: false,
        instructions: 'Test each smoke detector and check battery levels. Document any issues.',
        metadata: {
          generatedFrom: 'safety_requirement',
          sourceData: { type: 'smoke_detection' },
          aiGenerated: false
        }
      },
      {
        id: 'fire_extinguisher_check',
        title: 'Fire Extinguisher Inspection',
        description: 'Verify fire extinguisher is present, accessible, and within inspection dates',
        category: 'safety',
        required: true,
        evidenceRequired: true,
        safetyRelated: true,
        complianceRequired: true,
        priority: 'critical',
        estimatedTimeMinutes: 3,
        order: startOrder + 1,
        passFailOptions: ['pass', 'fail', 'not_applicable'],
        naRequiresNote: true,
        expectedSubjects: ['fire_extinguisher', 'inspection_tag', 'mounting_bracket'],
        qualityThreshold: 90,
        canRename: false,
        instructions: 'Check expiration date, pressure gauge, and accessibility. Note if not required by local code.',
        metadata: {
          generatedFrom: 'safety_requirement',
          sourceData: { type: 'fire_safety' },
          aiGenerated: false
        }
      },
      {
        id: 'emergency_exits_check',
        title: 'Emergency Exits Inspection',
        description: 'Verify all emergency exits are clearly marked and unobstructed',
        category: 'safety',
        required: true,
        evidenceRequired: true,
        safetyRelated: true,
        complianceRequired: true,
        priority: 'critical',
        estimatedTimeMinutes: 4,
        order: startOrder + 2,
        passFailOptions: ['pass', 'fail'],
        naRequiresNote: false,
        expectedSubjects: ['exit_doors', 'exit_signs', 'clear_pathways'],
        qualityThreshold: 85,
        canRename: false,
        instructions: 'Check all exit doors open easily and pathways are clear of obstructions.',
        metadata: {
          generatedFrom: 'safety_requirement',
          sourceData: { type: 'emergency_egress' },
          aiGenerated: false
        }
      }
    ];

    return safetyItems;
  }

  /**
   * Generates compliance-related checklist items
   * @param propertyData - VRBO property data
   * @param startOrder - Starting order number
   * @returns DynamicChecklistItem[]
   */
  private generateComplianceItems(
    propertyData: VRBOPropertyData,
    startOrder: number
  ): DynamicChecklistItem[] {
    const complianceItems: DynamicChecklistItem[] = [
      {
        id: 'occupancy_limits_check',
        title: 'Occupancy Limits Verification',
        description: 'Verify sleeping arrangements match advertised capacity',
        category: 'compliance',
        required: true,
        evidenceRequired: true,
        safetyRelated: false,
        complianceRequired: true,
        priority: 'high',
        estimatedTimeMinutes: 5,
        order: startOrder,
        passFailOptions: ['pass', 'fail'],
        naRequiresNote: false,
        expectedSubjects: ['bed_count', 'sleeping_areas', 'capacity_signage'],
        qualityThreshold: 80,
        canRename: false,
        instructions: 'Count actual sleeping spaces and verify they match listing capacity.',
        metadata: {
          generatedFrom: 'compliance_rule',
          sourceData: { maxGuests: propertyData.specifications.maxGuests },
          aiGenerated: false
        }
      }
    ];

    return complianceItems;
  }

  /**
   * Generates listing verification checklist items
   * @param propertyData - VRBO property data
   * @param startOrder - Starting order number
   * @returns DynamicChecklistItem[]
   */
  private generateListingVerificationItems(
    propertyData: VRBOPropertyData,
    startOrder: number
  ): DynamicChecklistItem[] {
    const verificationItems: DynamicChecklistItem[] = [
      {
        id: 'listing_photos_verification',
        title: 'Listing Photos Verification',
        description: 'Compare property condition to listing photos and verify accuracy',
        category: 'documentation',
        required: true,
        evidenceRequired: true,
        safetyRelated: false,
        complianceRequired: true,
        priority: 'critical',
        estimatedTimeMinutes: 15,
        order: startOrder,
        passFailOptions: ['pass', 'fail'],
        naRequiresNote: false,
        expectedSubjects: ['listing_comparison', 'photo_accuracy', 'condition_verification'],
        qualityThreshold: 85,
        canRename: false,
        instructions: 'Take photos from same angles as listing photos. Document any discrepancies between actual property and listing images.',
        metadata: {
          generatedFrom: 'compliance_rule',
          sourceData: { verificationType: 'listing_accuracy', vrboUrl: propertyData.vrboUrl },
          aiGenerated: false
        }
      },
      {
        id: 'amenities_listing_verification',
        title: 'Amenities vs Listing Verification',
        description: 'Verify all advertised amenities are present and functional',
        category: 'amenities',
        required: true,
        evidenceRequired: true,
        safetyRelated: false,
        complianceRequired: true,
        priority: 'high',
        estimatedTimeMinutes: 12,
        order: startOrder + 1,
        passFailOptions: ['pass', 'fail', 'not_applicable'],
        naRequiresNote: true,
        expectedSubjects: ['amenity_verification', 'functionality_check', 'listing_accuracy'],
        qualityThreshold: 80,
        canRename: false,
        instructions: `Check each amenity listed in the Vrbo posting: ${propertyData.amenities.map(a => a.name).slice(0, 5).join(', ')}${propertyData.amenities.length > 5 ? '...' : ''}. Document any missing or non-functional items.`,
        metadata: {
          generatedFrom: 'vrbo_amenity',
          sourceData: { 
            verificationType: 'amenity_accuracy', 
            listedAmenities: propertyData.amenities.length,
            vrboUrl: propertyData.vrboUrl 
          },
          aiGenerated: false
        }
      },
      {
        id: 'room_count_verification',
        title: 'Room Count Verification',
        description: 'Verify bedroom and bathroom counts match listing description',
        category: 'compliance',
        required: true,
        evidenceRequired: true,
        safetyRelated: false,
        complianceRequired: true,
        priority: 'high',
        estimatedTimeMinutes: 8,
        order: startOrder + 2,
        passFailOptions: ['pass', 'fail'],
        naRequiresNote: false,
        expectedSubjects: ['bedroom_count', 'bathroom_count', 'listing_accuracy'],
        qualityThreshold: 90,
        canRename: false,
        instructions: `Verify property has ${propertyData.specifications.bedrooms} bedrooms and ${propertyData.specifications.bathrooms} bathrooms as advertised. Document any discrepancies.`,
        metadata: {
          generatedFrom: 'compliance_rule',
          sourceData: { 
            verificationType: 'room_count_accuracy',
            listedBedrooms: propertyData.specifications.bedrooms,
            listedBathrooms: propertyData.specifications.bathrooms,
            vrboUrl: propertyData.vrboUrl 
          },
          aiGenerated: false
        }
      },
      {
        id: 'capacity_verification',
        title: 'Guest Capacity Verification',
        description: 'Verify actual sleeping capacity matches advertised guest limit',
        category: 'compliance',
        required: true,
        evidenceRequired: true,
        safetyRelated: false,
        complianceRequired: true,
        priority: 'high',
        estimatedTimeMinutes: 10,
        order: startOrder + 3,
        passFailOptions: ['pass', 'fail'],
        naRequiresNote: false,
        expectedSubjects: ['sleeping_arrangements', 'guest_capacity', 'listing_accuracy'],
        qualityThreshold: 85,
        canRename: false,
        instructions: `Count actual sleeping spaces and verify they accommodate ${propertyData.specifications.maxGuests} guests as advertised. Include beds, sofa beds, air mattresses, etc.`,
        metadata: {
          generatedFrom: 'compliance_rule',
          sourceData: { 
            verificationType: 'capacity_accuracy',
            listedCapacity: propertyData.specifications.maxGuests,
            vrboUrl: propertyData.vrboUrl 
          },
          aiGenerated: false
        }
      }
    ];

    return verificationItems;
  }

  /**
   * Generates general inspection items
   * @param propertyData - VRBO property data
   * @param startOrder - Starting order number
   * @returns DynamicChecklistItem[]
   */
  private generateGeneralItems(
    propertyData: VRBOPropertyData,
    startOrder: number
  ): DynamicChecklistItem[] {
    const generalItems: DynamicChecklistItem[] = [
      {
        id: 'overall_cleanliness_check',
        title: 'Overall Cleanliness Assessment',
        description: 'Assess general cleanliness and maintenance of the property',
        category: 'cleanliness',
        required: true,
        evidenceRequired: true,
        safetyRelated: false,
        complianceRequired: false,
        priority: 'high',
        estimatedTimeMinutes: 10,
        order: startOrder,
        passFailOptions: ['pass', 'fail'],
        naRequiresNote: false,
        expectedSubjects: ['general_condition', 'maintenance_issues', 'cleanliness_level'],
        qualityThreshold: 75,
        canRename: false,
        instructions: 'Document overall property condition, noting any maintenance or cleanliness issues.',
        metadata: {
          generatedFrom: 'property_type',
          sourceData: { type: 'general_inspection' },
          aiGenerated: false
        }
      }
    ];

    return generalItems;
  }

  /**
   * Uses AI to enhance and validate the generated checklist
   * @param items - Generated checklist items
   * @param propertyData - VRBO property data
   * @returns Promise<DynamicChecklistItem[]>
   */
  private async enhanceChecklistWithAI(
    items: DynamicChecklistItem[],
    propertyData: VRBOPropertyData
  ): Promise<DynamicChecklistItem[]> {
    try {
      // AI enhancement disabled for security - return items without AI enhancement
      logger.info('AI enhancement disabled for security', { itemCount: items.length }, 'CHECKLIST_GENERATION');
      return items;
      
      const response = await this.aiService.generateDynamicChecklist({
        property_type: propertyData.specifications.propertyType,
        room_count: {
          bedrooms: propertyData.specifications.bedrooms,
          bathrooms: propertyData.specifications.bathrooms
        },
        amenities: propertyData.amenities.map(a => a.name),
        description: propertyData.description,
        location: propertyData.location,
        special_features: propertyData.amenities.map(a => a.name)
      });

      // Merge AI suggestions with existing items
      const enhancedItems = [...items];
      
      // Add AI-generated items that don't conflict with existing ones
      response.forEach(aiItem => {
        const existingItem = enhancedItems.find(item => 
          item.title.toLowerCase().includes(aiItem.title.toLowerCase()) ||
          aiItem.title.toLowerCase().includes(item.title.toLowerCase())
        );
        
        if (!existingItem && aiItem.title && aiItem.description) {
          enhancedItems.push(this.convertAIItemToChecklistItem(aiItem, enhancedItems.length + 1));
        }
      });

      return enhancedItems.sort((a, b) => a.order - b.order);
    } catch (error) {
      logger.error('AI enhancement failed, using base checklist', error, 'CHECKLIST_AI_ENHANCEMENT');
      return items;
    }
  }

  /**
   * Converts AI-generated item to our checklist item format
   * @param aiItem - AI-generated checklist item
   * @param order - Order in checklist
   * @returns DynamicChecklistItem
   */
  private convertAIItemToChecklistItem(aiItem: {title: string; description: string; category: string; priority: string; required: boolean; roomType?: string; gptPrompt?: string; referencePhoto?: string}, order: number): DynamicChecklistItem {
    return {
      id: `ai_generated_${order}`,
      title: aiItem.title,
      description: aiItem.description,
      category: aiItem.category || 'general',
      required: aiItem.required || false,
      evidenceRequired: true,
      safetyRelated: aiItem.category === 'safety',
      complianceRequired: aiItem.category === 'compliance',
      priority: aiItem.priority || 'medium',
      estimatedTimeMinutes: aiItem.estimated_time_minutes || 5,
      order,
      passFailOptions: ['pass', 'fail', 'not_applicable'],
      naRequiresNote: true,
      expectedSubjects: [aiItem.title.toLowerCase().replace(/\s+/g, '_')],
      qualityThreshold: 75,
      canRename: false,
      metadata: {
        generatedFrom: 'vrbo_amenity',
        sourceData: aiItem,
        aiGenerated: true
      }
    };
  }

  // Helper methods for amenity processing

  private getAmenityInstructions(amenity: PropertyAmenity): string {
    const instructions: Record<string, string> = {
      'Hot Tub': 'Check water temperature, cleanliness, and safety features. Verify cover is present.',
      'Fireplace': 'Inspect safety screen, damper, and surrounding area. Check for soot or damage.',
      'Pool': 'Verify water clarity, safety barriers, and pool equipment functionality.',
      'WiFi': 'Test internet connectivity and speed. Check router location and signal strength.',
      'Kitchen': 'Inspect all appliances, cookware, and cleanliness. Test stove, oven, and refrigerator.',
      'Parking': 'Verify parking spaces match listing description and are accessible.',
      'Air Conditioning': 'Test cooling function and check filter condition.',
      'Heating': 'Test heating system and check thermostat functionality.'
    };
    
    return instructions[amenity.name] || 
           `Verify ${amenity.name} is present, functional, and matches the listing description.`;
  }

  private mapAmenityToCategory(amenityCategory: string): ChecklistCategory {
    const categoryMap: Record<string, ChecklistCategory> = {
      'kitchen': 'kitchen',
      'outdoor': 'outdoor',
      'entertainment': 'entertainment',
      'safety': 'safety',
      'accessibility': 'accessibility',
      'general': 'general',
      'laundry': 'maintenance',
      'parking': 'general',
      'connectivity': 'general',
      'climate': 'maintenance'
    };
    
    return categoryMap[amenityCategory] || 'general';
  }

  private mapAmenityPriority(amenityPriority: string): 'critical' | 'high' | 'medium' | 'low' {
    const priorityMap: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
      'essential': 'critical',
      'important': 'high',
      'nice_to_have': 'medium'
    };
    
    return priorityMap[amenityPriority] || 'medium';
  }

  private getAmenityInspectionTime(amenity: PropertyAmenity): number {
    const timeMap: Record<string, number> = {
      'Hot Tub': 8,
      'Pool': 10,
      'Fireplace': 6,
      'Kitchen': 12,
      'WiFi': 3,
      'Air Conditioning': 4,
      'Heating': 4,
      'Parking': 2
    };
    
    return timeMap[amenity.name] || 5;
  }

  private getAmenityExpectedSubjects(amenity: PropertyAmenity): string[] {
    const subjectMap: Record<string, string[]> = {
      'Hot Tub': ['hot_tub', 'cover', 'controls', 'safety_features'],
      'Fireplace': ['fireplace', 'screen', 'damper', 'surrounding_area'],
      'Pool': ['pool', 'water', 'safety_barriers', 'equipment'],
      'Kitchen': ['appliances', 'cookware', 'utensils', 'cleanliness'],
      'WiFi': ['router', 'signal_strength', 'connectivity'],
      'Parking': ['parking_spaces', 'accessibility', 'markings']
    };
    
    return subjectMap[amenity.name] || [amenity.name.toLowerCase().replace(/\s+/g, '_')];
  }

  private buildEnhancementPrompt(items: DynamicChecklistItem[], propertyData: VRBOPropertyData): string {
    return `
Review and enhance this STR inspection checklist:

Property: ${propertyData.title}
Type: ${propertyData.specifications.propertyType}
Bedrooms: ${propertyData.specifications.bedrooms}
Bathrooms: ${propertyData.specifications.bathrooms}
Amenities: ${propertyData.amenities.map(a => a.name).join(', ')}

Current checklist has ${items.length} items. 

Please suggest 3-5 additional items that would improve the inspection quality based on:
1. Property-specific features mentioned in the description
2. Location-specific requirements (${propertyData.location.city}, ${propertyData.location.state})
3. Common issues for this property type
4. Missing safety or compliance checks

Focus on actionable, specific items that an inspector can verify with photo evidence.
    `.trim();
  }

  private calculateCategoryDistribution(items: DynamicChecklistItem[]): Record<ChecklistCategory, number> {
    const distribution: Record<ChecklistCategory, number> = {
      safety: 0,
      compliance: 0,
      amenities: 0,
      cleanliness: 0,
      maintenance: 0,
      documentation: 0,
      kitchen: 0,
      bedrooms: 0,
      bathrooms: 0,
      outdoor: 0,
      entertainment: 0,
      accessibility: 0,
      emergency: 0,
      general: 0
    };

    items.forEach(item => {
      distribution[item.category]++;
    });

    return distribution;
  }

  private initializeBaseRequirements(): void {
    // Initialize with any base requirements that should always be included
    this.baseRequirements = [];
  }
}

// Export singleton instance
export const dynamicChecklistGenerator = DynamicChecklistGenerator.getInstance();

// Export convenience function
export const generateChecklistFromVRBO = dynamicChecklistGenerator.generateChecklistFromVRBO.bind(dynamicChecklistGenerator);