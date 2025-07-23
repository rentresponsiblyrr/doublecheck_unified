// Missing Amenity Detector - Identify high-value amenities present but not listed
import { logger } from "@/utils/logger";
import { amenityDiscoveryService } from "./amenityDiscoveryService";
import type { InspectionForReview } from "./auditorService";
import type { ScrapedPropertyData } from "@/lib/scrapers/types";

export interface MissingAmenityAlert {
  amenityName: string;
  category: "high_value" | "standard" | "convenience";
  evidence: {
    checklistItems: string[];
    photoUrls: string[];
    confidence: number;
    reasoning: string;
  };
  recommendation: {
    action:
      | "add_to_amenities"
      | "add_to_description"
      | "feature_more_prominently";
    priority: "immediate" | "suggested" | "consider";
    specificSuggestion: string;
  };
  marketImpact: "high" | "medium" | "low";
}

export interface AmenityDetectionResult {
  criticalMissing: MissingAmenityAlert[]; // High-value amenities not listed
  underUtilized: MissingAmenityAlert[]; // Listed but not highlighted
  opportunityAmenities: MissingAmenityAlert[]; // Nice-to-have features found
  summary: {
    totalMissing: number;
    highValueMissing: number;
    actionableRecommendations: number;
    estimatedListingImprovement: string;
  };
}

export interface AmenityDetectionRule {
  name: string;
  category: "high_value" | "standard" | "convenience";
  detectionCriteria: {
    mustHaveKeywords: string[];
    supportingKeywords: string[];
    photoIndicators: string[];
    excludeIfPresent: string[];
  };
  commonMissedVariations: string[];
  marketImpact: "high" | "medium" | "low";
  recommendationTemplate: string;
}

export class MissingAmenityDetector {
  private readonly DETECTION_RULES: AmenityDetectionRule[] = [
    {
      name: "Swimming Pool",
      category: "high_value",
      detectionCriteria: {
        mustHaveKeywords: ["pool", "swimming"],
        supportingKeywords: [
          "chlorine",
          "diving",
          "deck",
          "poolside",
          "swimming",
        ],
        photoIndicators: ["pool", "water", "swimming", "pool deck"],
        excludeIfPresent: ["no pool", "shared pool"],
      },
      commonMissedVariations: [
        "pool",
        "swimming pool",
        "private pool",
        "outdoor pool",
      ],
      marketImpact: "high",
      recommendationTemplate:
        'Add "Swimming Pool" to your amenities list and mention it prominently in your description. Pools are a major booking factor for vacation rentals.',
    },
    {
      name: "Hot Tub",
      category: "high_value",
      detectionCriteria: {
        mustHaveKeywords: ["hot tub", "spa", "jacuzzi"],
        supportingKeywords: ["jets", "bubbles", "relaxation", "soak"],
        photoIndicators: ["hot tub", "spa", "jacuzzi", "jets"],
        excludeIfPresent: ["no hot tub", "broken hot tub"],
      },
      commonMissedVariations: ["hot tub", "spa", "jacuzzi", "whirlpool"],
      marketImpact: "high",
      recommendationTemplate:
        "Feature your hot tub/spa in both amenities and description. This is a premium feature that can significantly impact bookings.",
    },
    {
      name: "Game Room",
      category: "high_value",
      detectionCriteria: {
        mustHaveKeywords: ["game room", "pool table", "games"],
        supportingKeywords: [
          "entertainment",
          "ping pong",
          "foosball",
          "arcade",
          "billiards",
        ],
        photoIndicators: [
          "pool table",
          "games",
          "entertainment room",
          "rec room",
        ],
        excludeIfPresent: ["no games"],
      },
      commonMissedVariations: [
        "game room",
        "games",
        "entertainment room",
        "rec room",
      ],
      marketImpact: "high",
      recommendationTemplate:
        "Highlight your game room/entertainment space. Families and groups specifically search for properties with entertainment amenities.",
    },
    {
      name: "Home Theater",
      category: "high_value",
      detectionCriteria: {
        mustHaveKeywords: ["theater", "projector", "movie"],
        supportingKeywords: [
          "cinema",
          "screening",
          "surround sound",
          "media room",
        ],
        photoIndicators: ["projector", "movie screen", "theater", "cinema"],
        excludeIfPresent: ["no theater"],
      },
      commonMissedVariations: [
        "home theater",
        "movie room",
        "cinema",
        "media room",
      ],
      marketImpact: "high",
      recommendationTemplate:
        "Feature your home theater/movie room prominently. This is a luxury amenity that appeals to families and entertainment seekers.",
    },
    {
      name: "Outdoor Kitchen",
      category: "standard",
      detectionCriteria: {
        mustHaveKeywords: ["outdoor kitchen", "grill", "bbq"],
        supportingKeywords: [
          "outdoor cooking",
          "patio kitchen",
          "outdoor grill",
          "barbecue",
        ],
        photoIndicators: [
          "outdoor grill",
          "bbq",
          "outdoor kitchen",
          "patio cooking",
        ],
        excludeIfPresent: ["no grill", "no outdoor cooking"],
      },
      commonMissedVariations: [
        "outdoor kitchen",
        "grill",
        "bbq",
        "outdoor cooking",
      ],
      marketImpact: "medium",
      recommendationTemplate:
        "Mention your outdoor kitchen/grilling area. Many guests look for properties where they can cook outdoors.",
    },
    {
      name: "Fire Pit",
      category: "standard",
      detectionCriteria: {
        mustHaveKeywords: ["fire pit", "fire"],
        supportingKeywords: [
          "outdoor fire",
          "campfire",
          "fire bowl",
          "gathering",
        ],
        photoIndicators: ["fire pit", "outdoor fire", "campfire", "fire bowl"],
        excludeIfPresent: ["no fire pit", "fire not allowed"],
      },
      commonMissedVariations: [
        "fire pit",
        "outdoor fireplace",
        "fire bowl",
        "campfire area",
      ],
      marketImpact: "medium",
      recommendationTemplate:
        "Add your fire pit to the amenities and description. Great for creating memorable evening experiences for guests.",
    },
    {
      name: "Workspace/Office",
      category: "standard",
      detectionCriteria: {
        mustHaveKeywords: ["office", "desk", "workspace"],
        supportingKeywords: ["work from home", "computer", "study", "wifi"],
        photoIndicators: ["desk", "office", "computer", "workspace"],
        excludeIfPresent: ["no workspace"],
      },
      commonMissedVariations: ["office", "workspace", "desk", "work area"],
      marketImpact: "medium",
      recommendationTemplate:
        "Highlight your workspace/office area. Many travelers need a dedicated work space for remote work or business travel.",
    },
    {
      name: "Balcony/Patio",
      category: "convenience",
      detectionCriteria: {
        mustHaveKeywords: ["balcony", "patio", "deck"],
        supportingKeywords: [
          "outdoor seating",
          "terrace",
          "outdoor space",
          "views",
        ],
        photoIndicators: ["balcony", "patio", "deck", "outdoor furniture"],
        excludeIfPresent: ["no balcony", "no outdoor access"],
      },
      commonMissedVariations: ["balcony", "patio", "deck", "outdoor space"],
      marketImpact: "low",
      recommendationTemplate:
        "Mention your balcony/patio space. Outdoor access is valued by many guests, especially for morning coffee or evening relaxation.",
    },
    {
      name: "Laundry Facilities",
      category: "convenience",
      detectionCriteria: {
        mustHaveKeywords: ["laundry", "washer", "dryer"],
        supportingKeywords: ["washing machine", "laundry room", "wash", "dry"],
        photoIndicators: ["washer", "dryer", "laundry room", "washing machine"],
        excludeIfPresent: ["no laundry", "shared laundry"],
      },
      commonMissedVariations: [
        "laundry",
        "washer/dryer",
        "washing machine",
        "laundry facilities",
      ],
      marketImpact: "low",
      recommendationTemplate:
        "Add laundry facilities to your amenities list. This is especially important for longer stays and families with children.",
    },
    {
      name: "Fitness/Gym Equipment",
      category: "standard",
      detectionCriteria: {
        mustHaveKeywords: ["gym", "fitness", "exercise"],
        supportingKeywords: ["treadmill", "weights", "workout", "equipment"],
        photoIndicators: ["gym equipment", "treadmill", "weights", "fitness"],
        excludeIfPresent: ["no gym", "no fitness"],
      },
      commonMissedVariations: [
        "gym",
        "fitness equipment",
        "workout room",
        "exercise equipment",
      ],
      marketImpact: "medium",
      recommendationTemplate:
        "Feature your fitness/gym equipment. Health-conscious travelers often specifically search for properties with exercise amenities.",
    },
  ];

  /**
   * Detect missing amenities from inspection data
   */
  async detectMissingAmenities(
    inspection: InspectionForReview,
    scrapedData: ScrapedPropertyData,
  ): Promise<AmenityDetectionResult> {
    try {
      logger.info(
        "Starting missing amenity detection",
        {
          inspectionId: inspection.id,
          checklistItems: inspection.checklist_items.length,
        },
        "MISSING_AMENITY_DETECTOR",
      );

      const criticalMissing: MissingAmenityAlert[] = [];
      const underUtilized: MissingAmenityAlert[] = [];
      const opportunityAmenities: MissingAmenityAlert[] = [];

      // Analyze each detection rule
      for (const rule of this.DETECTION_RULES) {
        const alert = await this.analyzeDetectionRule(
          rule,
          inspection,
          scrapedData,
        );

        if (alert) {
          switch (alert.recommendation.priority) {
            case "immediate":
              criticalMissing.push(alert);
              break;
            case "suggested":
              underUtilized.push(alert);
              break;
            case "consider":
              opportunityAmenities.push(alert);
              break;
          }
        }
      }

      const summary = {
        totalMissing:
          criticalMissing.length +
          underUtilized.length +
          opportunityAmenities.length,
        highValueMissing: criticalMissing.filter(
          (a) => a.category === "high_value",
        ).length,
        actionableRecommendations:
          criticalMissing.length + underUtilized.length,
        estimatedListingImprovement: this.calculateListingImprovement(
          criticalMissing,
          underUtilized,
        ),
      };

      logger.info(
        "Missing amenity detection completed",
        {
          criticalMissing: criticalMissing.length,
          underUtilized: underUtilized.length,
          opportunityAmenities: opportunityAmenities.length,
        },
        "MISSING_AMENITY_DETECTOR",
      );

      return {
        criticalMissing,
        underUtilized,
        opportunityAmenities,
        summary,
      };
    } catch (error) {
      logger.error(
        "Failed to detect missing amenities",
        error,
        "MISSING_AMENITY_DETECTOR",
      );
      throw error;
    }
  }

  /**
   * Analyze a specific detection rule
   */
  private async analyzeDetectionRule(
    rule: AmenityDetectionRule,
    inspection: InspectionForReview,
    scrapedData: ScrapedPropertyData,
  ): Promise<MissingAmenityAlert | null> {
    const evidence = {
      checklistItems: [] as string[],
      photoUrls: [] as string[],
      confidence: 0,
      reasoning: "",
    };

    // Check inspection checklist items
    const relevantItems = inspection.checklist_items.filter((item) => {
      const itemText =
        `${item.title} ${item.ai_reasoning} ${item.notes}`.toLowerCase();

      // Must have at least one required keyword
      const hasRequiredKeyword = rule.detectionCriteria.mustHaveKeywords.some(
        (keyword) => itemText.includes(keyword.toLowerCase()),
      );

      // Should not have excluding keywords
      const hasExcludingKeyword = rule.detectionCriteria.excludeIfPresent.some(
        (keyword) => itemText.includes(keyword.toLowerCase()),
      );

      return hasRequiredKeyword && !hasExcludingKeyword;
    });

    // Collect evidence from relevant items
    relevantItems.forEach((item) => {
      evidence.checklistItems.push(item.title);

      // Collect photos
      item.media.forEach((media) => {
        if (media.type === "photo") {
          evidence.photoUrls.push(media.url);
        }
      });
    });

    // Check scraped data for existing mentions
    const scrapedText =
      `${scrapedData.description} ${scrapedData.amenities.map((a) => a.name).join(" ")}`.toLowerCase();
    const isAlreadyMentioned = rule.commonMissedVariations.some((variation) =>
      scrapedText.includes(variation.toLowerCase()),
    );

    // Check if amenity is in scraped amenities list
    const isInAmenityList = scrapedData.amenities.some((amenity) =>
      rule.commonMissedVariations.some((variation) =>
        amenity.name.toLowerCase().includes(variation.toLowerCase()),
      ),
    );

    // No evidence found
    if (
      evidence.checklistItems.length === 0 &&
      evidence.photoUrls.length === 0
    ) {
      return null;
    }

    // Calculate confidence
    evidence.confidence = this.calculateConfidence(
      rule,
      evidence,
      relevantItems,
    );

    // Generate reasoning
    evidence.reasoning = this.generateDetectionReasoning(
      rule,
      evidence,
      isAlreadyMentioned,
    );

    // Determine recommendation
    const recommendation = this.generateRecommendation(
      rule,
      isAlreadyMentioned,
      isInAmenityList,
      evidence.confidence,
    );

    return {
      amenityName: rule.name,
      category: rule.category,
      evidence,
      recommendation,
      marketImpact: rule.marketImpact,
    };
  }

  /**
   * Calculate confidence score for detection
   */
  private calculateConfidence(
    rule: AmenityDetectionRule,
    evidence: { checklistItems: unknown[]; photos: unknown[] },
    relevantItems: unknown[],
  ): number {
    let confidence = 0;

    // Base confidence from checklist items
    if (evidence.checklistItems.length > 0) {
      confidence += 30;
    }

    // Additional confidence from photos
    if (evidence.photoUrls.length > 0) {
      confidence += 25;
    }

    // Multiple supporting items
    if (relevantItems.length > 1) {
      confidence += 20;
    }

    // AI analysis confidence
    const avgAIConfidence =
      relevantItems.reduce((sum, item) => sum + (item.ai_confidence || 0), 0) /
      relevantItems.length;
    confidence += Math.round(avgAIConfidence * 0.25);

    return Math.min(confidence, 100);
  }

  /**
   * Generate reasoning for detection
   */
  private generateDetectionReasoning(
    rule: AmenityDetectionRule,
    evidence: { checklistItems: unknown[]; photos: unknown[] },
    isAlreadyMentioned: boolean,
  ): string {
    const reasons = [];

    if (evidence.checklistItems.length > 0) {
      reasons.push(
        `Found ${evidence.checklistItems.length} inspection item(s) related to ${rule.name}`,
      );
    }

    if (evidence.photoUrls.length > 0) {
      reasons.push(
        `Found ${evidence.photoUrls.length} photo(s) showing ${rule.name}`,
      );
    }

    if (isAlreadyMentioned) {
      reasons.push(
        `Mentioned in current listing but may not be prominently featured`,
      );
    } else {
      reasons.push(`Not mentioned in current listing description or amenities`);
    }

    return reasons.join(". ");
  }

  /**
   * Generate recommendation based on findings
   */
  private generateRecommendation(
    rule: AmenityDetectionRule,
    isAlreadyMentioned: boolean,
    isInAmenityList: boolean,
    confidence: number,
  ): { action: string; priority: string; specificSuggestion: string } {
    let action:
      | "add_to_amenities"
      | "add_to_description"
      | "feature_more_prominently";
    let priority: "immediate" | "suggested" | "consider";
    let specificSuggestion: string;

    if (!isInAmenityList && !isAlreadyMentioned) {
      action = "add_to_amenities";
      priority = rule.marketImpact === "high" ? "immediate" : "suggested";
      specificSuggestion = `Add "${rule.name}" to your amenities list and mention it in your description. ${rule.recommendationTemplate}`;
    } else if (isInAmenityList && !isAlreadyMentioned) {
      action = "add_to_description";
      priority = "suggested";
      specificSuggestion = `You have "${rule.name}" listed as an amenity but it's not mentioned in your description. ${rule.recommendationTemplate}`;
    } else {
      action = "feature_more_prominently";
      priority = "consider";
      specificSuggestion = `Consider featuring "${rule.name}" more prominently in your listing. ${rule.recommendationTemplate}`;
    }

    // Lower priority for low confidence detections
    if (confidence < 50) {
      priority = "consider";
    }

    return {
      action,
      priority: priority as "immediate" | "suggested" | "consider",
      specificSuggestion,
    };
  }

  /**
   * Calculate estimated listing improvement
   */
  private calculateListingImprovement(
    criticalMissing: MissingAmenityAlert[],
    underUtilized: MissingAmenityAlert[],
  ): string {
    const highValueCount = criticalMissing.filter(
      (a) => a.category === "high_value",
    ).length;
    const totalActionable = criticalMissing.length + underUtilized.length;

    if (highValueCount >= 2) {
      return "Significant improvement potential - multiple high-value amenities identified";
    } else if (highValueCount === 1) {
      return "Good improvement potential - one high-value amenity identified";
    } else if (totalActionable >= 3) {
      return "Moderate improvement potential - several amenities to highlight";
    } else if (totalActionable > 0) {
      return "Minor improvement potential - few amenities to optimize";
    } else {
      return "Listing appears well-optimized for visible amenities";
    }
  }

  /**
   * Get quick summary of missing high-value amenities
   */
  async getQuickMissingAmenitiesSummary(
    inspection: InspectionForReview,
    scrapedData: ScrapedPropertyData,
  ): Promise<{ amenity: string; reason: string }[]> {
    const result = await this.detectMissingAmenities(inspection, scrapedData);

    return result.criticalMissing
      .filter((alert) => alert.category === "high_value")
      .map((alert) => ({
        amenity: alert.amenityName,
        reason: alert.recommendation.specificSuggestion,
      }));
  }
}

// Export singleton instance
export const missingAmenityDetector = new MissingAmenityDetector();
