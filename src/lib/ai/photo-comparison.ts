// Photo Comparison Engine for STR Certified

import type {
  PhotoComparisonResult,
  PhotoQualityMetrics,
  DiscrepancyReport,
  RoomFeatures,
  ComparisonRecommendation,
  DiscrepancyType,
  QualityScore,
  QualityIssue,
  QualityImprovement,
  DetectedFurniture,
  DetectedFixture,
  DetectedAmenity,
  ConditionAssessment,
  ImageRegion,
  PhotoComparisonConfig,
  BatchComparisonResult,
  ComparisonSummary,
} from "@/types/photo";

export class PhotoComparisonEngine {
  private config: PhotoComparisonConfig;
  private analysisVersion: string = "1.0.0";

  constructor(config: Partial<PhotoComparisonConfig> = {}) {
    this.config = {
      similarityThreshold: 75,
      qualityThreshold: 70,
      enableAIAnalysis: true,
      enableManualReview: false,
      strictMode: false,
      maxProcessingTime: 30000,
      ...config,
    };
  }

  /**
   * Compares an inspector photo to a listing photo
   * @param inspectorPhoto - Photo taken by inspector
   * @param listingPhoto - Reference photo from listing
   * @param roomContext - Context about the room being compared
   * @returns Promise<PhotoComparisonResult>
   */
  async compareInspectorPhotoToListing(
    inspectorPhoto: File | string,
    listingPhoto: string,
    roomContext?: string,
  ): Promise<PhotoComparisonResult> {
    const startTime = Date.now();

    try {
      // Step 1: Analyze photo quality
      const qualityMetrics = await this.analyzePhotoQuality(inspectorPhoto);

      // Step 2: Check if quality meets minimum threshold
      if (qualityMetrics.overall_score < this.config.qualityThreshold) {
        return this.createLowQualityResult(qualityMetrics, startTime);
      }

      // Step 3: Detect room features in both photos
      const inspectorFeatures = await this.detectRoomFeatures(inspectorPhoto);
      const listingFeatures = await this.detectRoomFeatures(listingPhoto);

      // Step 4: Compare features and calculate similarity
      const discrepancies = this.compareFeatures(
        inspectorFeatures,
        listingFeatures,
      );
      const similarityScore = this.calculateSimilarityScore(
        inspectorFeatures,
        listingFeatures,
        discrepancies,
      );

      // Step 5: Generate recommendation
      const recommendation = this.generateRecommendation(
        similarityScore,
        discrepancies,
        qualityMetrics,
      );

      // Step 6: Create comprehensive result
      return {
        similarity_score: similarityScore,
        discrepancies,
        quality_score: qualityMetrics,
        recommendation,
        confidence: this.calculateConfidence(
          qualityMetrics,
          discrepancies.length,
        ),
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
        metadata: {
          roomType: roomContext,
          inspectorPhotoDate: new Date(),
          analysisVersion: this.analysisVersion,
        },
      };
    } catch (error) {
      return this.createErrorResult(error, startTime);
    }
  }

  /**
   * Analyzes photo quality metrics
   * @param photo - Photo to analyze
   * @returns Promise<PhotoQualityMetrics>
   */
  async analyzePhotoQuality(
    photo: File | string,
  ): Promise<PhotoQualityMetrics> {
    // Mock implementation - in production, this would use computer vision
    await this.simulateProcessing(500);

    const mockMetrics: PhotoQualityMetrics = {
      sharpness: {
        score: 85,
        rating: "good",
        details: "Image is sharp with good detail preservation",
      },
      lighting: {
        score: 78,
        rating: "good",
        details: "Well-lit with minimal shadows",
      },
      composition: {
        score: 82,
        rating: "good",
        details: "Good framing, captures full room view",
      },
      overall_score: 81.7,
      issues: [],
      suggestions: [],
    };

    // Simulate quality issues detection
    if (mockMetrics.sharpness.score < 70) {
      mockMetrics.issues.push({
        type: "blur",
        severity: "major",
        description: "Image appears blurry or out of focus",
      });
      mockMetrics.suggestions.push({
        action: "Hold device steady and tap to focus",
        priority: "high",
        icon: "📷",
        estimatedImprovement: 25,
      });
    }

    if (mockMetrics.lighting.score < 60) {
      mockMetrics.issues.push({
        type: "underexposed",
        severity: "major",
        description: "Image is too dark",
      });
      mockMetrics.suggestions.push({
        action: "Turn on lights or use flash",
        priority: "high",
        icon: "💡",
        estimatedImprovement: 30,
      });
    }

    return mockMetrics;
  }

  /**
   * Detects furniture, fixtures, and room condition
   * @param photo - Photo to analyze
   * @returns Promise<RoomFeatures>
   */
  async detectRoomFeatures(photo: File | string): Promise<RoomFeatures> {
    // Mock implementation - in production, this would use AI vision
    await this.simulateProcessing(1000);

    const mockFeatures: RoomFeatures = {
      furniture: [
        {
          type: "bed",
          condition: "excellent",
          location: { x: 100, y: 200, width: 400, height: 300 },
          confidence: 95,
        },
        {
          type: "nightstand",
          condition: "good",
          location: { x: 50, y: 250, width: 100, height: 150 },
          confidence: 88,
        },
        {
          type: "dresser",
          condition: "good",
          location: { x: 550, y: 150, width: 200, height: 250 },
          confidence: 92,
        },
      ],
      fixtures: [
        {
          type: "ceiling_light",
          working: true,
          condition: "excellent",
          location: { x: 350, y: 50, width: 100, height: 100 },
          needsMaintenance: false,
        },
        {
          type: "wall_outlet",
          working: true,
          condition: "good",
          location: { x: 100, y: 400, width: 50, height: 50 },
          needsMaintenance: false,
        },
      ],
      amenities: [
        {
          name: "Smart TV",
          present: true,
          functional: true,
          location: { x: 300, y: 100, width: 200, height: 150 },
          matchesListing: true,
        },
        {
          name: "Air Conditioning",
          present: true,
          functional: true,
          matchesListing: true,
        },
      ],
      condition: {
        overall: "excellent",
        cleanliness: 92,
        maintenance: 88,
        damage: [],
        wearAndTear: "Minimal wear, well-maintained",
      },
      roomType: "bedroom",
      confidence: 89,
    };

    return mockFeatures;
  }

  /**
   * Generates a comprehensive comparison report
   * @param results - Array of comparison results
   * @returns BatchComparisonResult
   */
  async generateComparisonReport(
    results: PhotoComparisonResult[],
  ): Promise<BatchComparisonResult> {
    const roomComparisons = new Map<string, PhotoComparisonResult>();
    const criticalIssues: DiscrepancyReport[] = [];

    let totalSimilarity = 0;
    let totalQuality = 0;
    let matchingPhotos = 0;
    let minorDifferences = 0;
    let majorDifferences = 0;

    results.forEach((result, index) => {
      const roomId = result.metadata.roomType || `room_${index}`;
      roomComparisons.set(roomId, result);

      totalSimilarity += result.similarity_score;
      totalQuality += result.quality_score.overall_score;

      // Categorize results
      if (result.similarity_score >= 90) {
        matchingPhotos++;
      } else if (result.similarity_score >= 70) {
        minorDifferences++;
      } else {
        majorDifferences++;
      }

      // Collect critical issues
      result.discrepancies
        .filter((d) => d.severity === "critical")
        .forEach((d) => criticalIssues.push(d));
    });

    const summary: ComparisonSummary = {
      totalPhotos: results.length,
      matchingPhotos,
      minorDifferences,
      majorDifferences,
      averageSimilarity: totalSimilarity / results.length,
      averageQuality: totalQuality / results.length,
      passRate: ((matchingPhotos + minorDifferences) / results.length) * 100,
    };

    const recommendations = this.generateBatchRecommendations(
      summary,
      criticalIssues,
    );

    return {
      roomComparisons,
      overallSimilarity: summary.averageSimilarity,
      criticalIssues,
      summary,
      recommendations,
    };
  }

  // Private helper methods

  private compareFeatures(
    inspectorFeatures: RoomFeatures,
    listingFeatures: RoomFeatures,
  ): DiscrepancyReport[] {
    const discrepancies: DiscrepancyReport[] = [];

    // Compare furniture
    listingFeatures.furniture.forEach((listingItem) => {
      const found = inspectorFeatures.furniture.find(
        (item) =>
          item.type === listingItem.type &&
          this.isLocationSimilar(item.location, listingItem.location),
      );

      if (!found) {
        discrepancies.push({
          type: "missing_furniture",
          severity: "major",
          description: `${listingItem.type} shown in listing is missing`,
          location: listingItem.location,
          confidence: 85,
        });
      } else if (
        found.condition !== listingItem.condition &&
        this.isConditionWorse(found.condition, listingItem.condition)
      ) {
        discrepancies.push({
          type: "damage_detected",
          severity: "minor",
          description: `${found.type} condition has deteriorated`,
          location: found.location,
          confidence: 75,
        });
      }
    });

    // Compare amenities
    listingFeatures.amenities.forEach((listingAmenity) => {
      const found = inspectorFeatures.amenities.find(
        (a) => a.name === listingAmenity.name,
      );

      if (!found || !found.present) {
        discrepancies.push({
          type: "missing_amenity",
          severity: "critical",
          description: `${listingAmenity.name} advertised but not found`,
          confidence: 90,
        });
      } else if (found.present && !found.functional) {
        discrepancies.push({
          type: "maintenance_needed",
          severity: "major",
          description: `${found.name} is not functional`,
          confidence: 95,
        });
      }
    });

    // Check overall condition
    if (inspectorFeatures.condition.cleanliness < 70) {
      discrepancies.push({
        type: "cleanliness_issue",
        severity: "major",
        description: "Room cleanliness below acceptable standards",
        confidence: 88,
      });
    }

    return discrepancies;
  }

  private calculateSimilarityScore(
    inspectorFeatures: RoomFeatures,
    listingFeatures: RoomFeatures,
    discrepancies: DiscrepancyReport[],
  ): number {
    // Base similarity from feature matching
    const furnitureMatch = this.calculateFeatureMatchRate(
      inspectorFeatures.furniture,
      listingFeatures.furniture,
    );
    const amenityMatch = this.calculateAmenityMatchRate(
      inspectorFeatures.amenities,
      listingFeatures.amenities,
    );

    // Penalty for discrepancies
    const discrepancyPenalty = discrepancies.reduce((penalty, d) => {
      switch (d.severity) {
        case "critical":
          return penalty + 15;
        case "major":
          return penalty + 10;
        case "minor":
          return penalty + 5;
        default:
          return penalty + 2;
      }
    }, 0);

    // Calculate weighted score
    const baseScore = (furnitureMatch * 0.4 + amenityMatch * 0.6) * 100;
    const finalScore = Math.max(0, baseScore - discrepancyPenalty);

    return Math.round(finalScore);
  }

  private calculateFeatureMatchRate(
    inspectorItems: { type: string; [key: string]: unknown }[],
    listingItems: { type: string; [key: string]: unknown }[],
  ): number {
    if (listingItems.length === 0) return 1;

    let matches = 0;
    listingItems.forEach((listingItem) => {
      if (inspectorItems.some((item) => item.type === listingItem.type)) {
        matches++;
      }
    });

    return matches / listingItems.length;
  }

  private calculateAmenityMatchRate(
    inspectorAmenities: DetectedAmenity[],
    listingAmenities: DetectedAmenity[],
  ): number {
    if (listingAmenities.length === 0) return 1;

    let matches = 0;
    listingAmenities.forEach((listingAmenity) => {
      const found = inspectorAmenities.find(
        (a) => a.name === listingAmenity.name,
      );
      if (found && found.present && found.functional !== false) {
        matches++;
      }
    });

    return matches / listingAmenities.length;
  }

  private generateRecommendation(
    similarityScore: number,
    discrepancies: DiscrepancyReport[],
    qualityMetrics: PhotoQualityMetrics,
  ): ComparisonRecommendation {
    // Check quality first
    if (qualityMetrics.overall_score < 60) {
      return "retake_photo";
    }

    // Check critical discrepancies
    const criticalCount = discrepancies.filter(
      (d) => d.severity === "critical",
    ).length;
    if (criticalCount > 0) {
      return "significant_discrepancies";
    }

    // Check similarity score
    if (similarityScore >= 90) {
      return "matches_listing";
    } else if (similarityScore >= 75) {
      return "acceptable_differences";
    } else if (similarityScore >= 60) {
      return "review_required";
    } else {
      return "significant_discrepancies";
    }
  }

  private calculateConfidence(
    qualityMetrics: PhotoQualityMetrics,
    discrepancyCount: number,
  ): number {
    // Higher quality and fewer discrepancies increase confidence
    const qualityFactor = qualityMetrics.overall_score / 100;
    const discrepancyFactor = Math.max(0, 1 - discrepancyCount * 0.1);

    return Math.round((qualityFactor * 0.6 + discrepancyFactor * 0.4) * 100);
  }

  private isLocationSimilar(loc1: ImageRegion, loc2: ImageRegion): boolean {
    const centerDist = Math.sqrt(
      Math.pow(loc1.x + loc1.width / 2 - (loc2.x + loc2.width / 2), 2) +
        Math.pow(loc1.y + loc1.height / 2 - (loc2.y + loc2.height / 2), 2),
    );

    return centerDist < 100; // pixels threshold
  }

  private isConditionWorse(current: string, original: string): boolean {
    const conditionOrder = ["new", "excellent", "good", "fair", "poor"];
    return conditionOrder.indexOf(current) > conditionOrder.indexOf(original);
  }

  private generateBatchRecommendations(
    summary: ComparisonSummary,
    criticalIssues: DiscrepancyReport[],
  ): string[] {
    const recommendations: string[] = [];

    if (summary.passRate < 80) {
      recommendations.push(
        "Overall pass rate is below acceptable threshold. Review all failed comparisons.",
      );
    }

    if (summary.averageQuality < 70) {
      recommendations.push(
        "Photo quality needs improvement. Provide better lighting and camera guidance to inspectors.",
      );
    }

    if (criticalIssues.length > 0) {
      recommendations.push(
        `${criticalIssues.length} critical issues found. Immediate attention required.`,
      );
    }

    if (summary.majorDifferences > summary.totalPhotos * 0.2) {
      recommendations.push(
        "High rate of major differences detected. Property may need re-listing or major updates.",
      );
    }

    return recommendations;
  }

  private createLowQualityResult(
    qualityMetrics: PhotoQualityMetrics,
    startTime: number,
  ): PhotoComparisonResult {
    return {
      similarity_score: 0,
      discrepancies: [
        {
          type: "cleanliness_issue",
          severity: "critical",
          description: "Photo quality too low for accurate comparison",
          confidence: 100,
        },
      ],
      quality_score: qualityMetrics,
      recommendation: "retake_photo",
      confidence: 0,
      timestamp: new Date(),
      processingTime: Date.now() - startTime,
      metadata: {
        inspectorPhotoDate: new Date(),
        analysisVersion: this.analysisVersion,
      },
    };
  }

  private createErrorResult(
    error: Error | unknown,
    startTime: number,
  ): PhotoComparisonResult {
    return {
      similarity_score: 0,
      discrepancies: [
        {
          type: "cleanliness_issue",
          severity: "critical",
          description: `Analysis failed: ${error.message}`,
          confidence: 0,
        },
      ],
      quality_score: {
        sharpness: { score: 0, rating: "unacceptable" },
        lighting: { score: 0, rating: "unacceptable" },
        composition: { score: 0, rating: "unacceptable" },
        overall_score: 0,
        issues: [],
        suggestions: [],
      },
      recommendation: "retake_photo",
      confidence: 0,
      timestamp: new Date(),
      processingTime: Date.now() - startTime,
      metadata: {
        inspectorPhotoDate: new Date(),
        analysisVersion: this.analysisVersion,
      },
    };
  }

  private async simulateProcessing(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export factory function
export const createPhotoComparisonEngine = (
  config?: Partial<PhotoComparisonConfig>,
): PhotoComparisonEngine => {
  return new PhotoComparisonEngine(config);
};
