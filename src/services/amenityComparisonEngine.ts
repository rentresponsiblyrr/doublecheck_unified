// Amenity Comparison Engine - Comprehensive analysis of listing vs inspection findings
import { logger } from '@/utils/logger';
import { amenityDiscoveryService } from './amenityDiscoveryService';
import { missingAmenityDetector } from './missingAmenityDetector';
import type { InspectionForReview } from './auditorService';
import type { ScrapedPropertyData } from '@/lib/scrapers/types';

export interface ListingOptimizationReport {
  propertyName: string;
  inspectionId: string;
  generatedAt: string;
  
  // Core Analysis
  currentListing: {
    totalAmenities: number;
    wellDocumented: string[];
    categories: Record<string, number>;
  };
  
  discoveredOpportunities: {
    criticalMissing: Array<{
      amenity: string;
      evidence: string;
      suggestion: string;
      priority: 'immediate' | 'suggested' | 'consider';
    }>;
    
    underUtilized: Array<{
      amenity: string;
      currentStatus: string;
      suggestion: string;
    }>;
    
    roomSpecificFindings: Array<{
      room: string;
      features: string[];
      recommendations: string[];
    }>;
  };
  
  // Actionable Recommendations
  recommendations: {
    amenityCheckboxes: Array<{
      amenity: string;
      action: 'add' | 'update' | 'feature';
      reason: string;
    }>;
    
    descriptionUpdates: Array<{
      section: string;
      currentText: string;
      suggestedAddition: string;
      rationale: string;
    }>;
    
    photoSuggestions: Array<{
      amenity: string;
      suggestion: string;
      availablePhotos: string[];
    }>;
  };
  
  // Summary
  summary: {
    totalOpportunities: number;
    highPriorityActions: number;
    estimatedImpact: string;
    keyFindings: string[];
  };
}

export interface ComparisonMetrics {
  listingCompleteness: number;      // 0-100 how well listing matches reality
  amenityAccuracy: number;          // 0-100 how accurate listed amenities are
  opportunityScore: number;         // 0-100 how many opportunities exist
  overallOptimization: number;      // 0-100 overall listing optimization score
}

export class AmenityComparisonEngine {
  
  /**
   * Generate comprehensive listing optimization report
   */
  async generateOptimizationReport(
    inspection: InspectionForReview,
    scrapedData: ScrapedPropertyData
  ): Promise<ListingOptimizationReport> {
    try {
      logger.info('Starting comprehensive amenity comparison', { 
        inspectionId: inspection.id,
        propertyName: inspection.properties.name
      }, 'AMENITY_COMPARISON_ENGINE');

      // Run both analysis services
      const [discoveryResult, missingResult] = await Promise.all([
        amenityDiscoveryService.compareInspectionToListing(inspection, scrapedData),
        missingAmenityDetector.detectMissingAmenities(inspection, scrapedData)
      ]);

      // Analyze current listing status
      const currentListing = this.analyzeCurrentListing(scrapedData);
      
      // Process discovered opportunities
      const discoveredOpportunities = this.processDiscoveredOpportunities(
        discoveryResult,
        missingResult,
        inspection
      );
      
      // Generate actionable recommendations
      const recommendations = this.generateActionableRecommendations(
        discoveryResult,
        missingResult,
        scrapedData
      );
      
      // Create summary
      const summary = this.generateSummary(discoveryResult, missingResult, recommendations);

      const report: ListingOptimizationReport = {
        propertyName: inspection.properties.name,
        inspectionId: inspection.id,
        generatedAt: new Date().toISOString(),
        currentListing,
        discoveredOpportunities,
        recommendations,
        summary
      };

      logger.info('Amenity comparison report generated', {
        totalOpportunities: summary.totalOpportunities,
        highPriorityActions: summary.highPriorityActions
      }, 'AMENITY_COMPARISON_ENGINE');

      return report;

    } catch (error) {
      logger.error('Failed to generate optimization report', error, 'AMENITY_COMPARISON_ENGINE');
      throw error;
    }
  }

  /**
   * Analyze current listing status
   */
  private analyzeCurrentListing(scrapedData: ScrapedPropertyData) {
    const categories: Record<string, number> = {};
    
    scrapedData.amenities.forEach(amenity => {
      categories[amenity.category] = (categories[amenity.category] || 0) + 1;
    });

    return {
      totalAmenities: scrapedData.amenities.length,
      wellDocumented: scrapedData.amenities.map(a => a.name),
      categories
    };
  }

  /**
   * Process discovered opportunities from analysis results
   */
  private processDiscoveredOpportunities(
    discoveryResult: any,
    missingResult: any,
    inspection: InspectionForReview
  ) {
    // Critical missing amenities
    const criticalMissing = missingResult.criticalMissing.map((alert: any) => ({
      amenity: alert.amenityName,
      evidence: alert.evidence.reasoning,
      suggestion: alert.recommendation.specificSuggestion,
      priority: alert.recommendation.priority
    }));

    // Under-utilized amenities
    const underUtilized = missingResult.underUtilized.map((alert: any) => ({
      amenity: alert.amenityName,
      currentStatus: alert.evidence.reasoning,
      suggestion: alert.recommendation.specificSuggestion
    }));

    // Room-specific findings
    const roomSpecificFindings = this.extractRoomSpecificFindings(inspection);

    return {
      criticalMissing,
      underUtilized,
      roomSpecificFindings
    };
  }

  /**
   * Extract room-specific findings from inspection
   */
  private extractRoomSpecificFindings(inspection: InspectionForReview) {
    const roomFindings: Array<{
      room: string;
      features: string[];
      recommendations: string[];
    }> = [];

    // Group checklist items by room type
    const roomTypes = ['kitchen', 'living_room', 'bedroom', 'bathroom', 'outdoor'];
    
    roomTypes.forEach(roomType => {
      const roomItems = inspection.checklist_items.filter(item => 
        item.title.toLowerCase().includes(roomType) || 
        (item as any).room_type?.toLowerCase() === roomType
      );

      if (roomItems.length > 0) {
        const features: string[] = [];
        const recommendations: string[] = [];

        roomItems.forEach(item => {
          // Extract notable features from AI analysis
          if (item.ai_confidence > 70 && item.ai_reasoning) {
            const reasoning = item.ai_reasoning.toLowerCase();
            
            // Look for specific feature mentions
            const featureKeywords = this.getRoomFeatureKeywords(roomType);
            featureKeywords.forEach(keyword => {
              if (reasoning.includes(keyword)) {
                features.push(keyword);
              }
            });
          }

          // Generate recommendations for well-documented items
          if (item.ai_confidence > 80 && item.status === 'completed') {
            recommendations.push(`Consider highlighting "${item.title}" in your ${roomType} description`);
          }
        });

        if (features.length > 0 || recommendations.length > 0) {
          roomFindings.push({
            room: roomType.replace('_', ' '),
            features: [...new Set(features)], // Remove duplicates
            recommendations: [...new Set(recommendations)]
          });
        }
      }
    });

    return roomFindings;
  }

  /**
   * Get room-specific feature keywords
   */
  private getRoomFeatureKeywords(roomType: string): string[] {
    const keywords: Record<string, string[]> = {
      kitchen: ['island', 'dishwasher', 'microwave', 'coffee maker', 'pantry', 'breakfast bar'],
      living_room: ['fireplace', 'sectional', 'entertainment center', 'views', 'balcony access'],
      bedroom: ['walk-in closet', 'ensuite', 'king bed', 'queen bed', 'balcony', 'views'],
      bathroom: ['jetted tub', 'walk-in shower', 'double vanity', 'heated floors', 'spa'],
      outdoor: ['deck', 'patio', 'garden', 'outdoor seating', 'fire pit', 'bbq area']
    };

    return keywords[roomType] || [];
  }

  /**
   * Generate actionable recommendations
   */
  private generateActionableRecommendations(
    discoveryResult: any,
    missingResult: any,
    scrapedData: ScrapedPropertyData
  ) {
    const amenityCheckboxes: Array<{
      amenity: string;
      action: 'add' | 'update' | 'feature';
      reason: string;
    }> = [];

    const descriptionUpdates: Array<{
      section: string;
      currentText: string;
      suggestedAddition: string;
      rationale: string;
    }> = [];

    const photoSuggestions: Array<{
      amenity: string;
      suggestion: string;
      availablePhotos: string[];
    }> = [];

    // Process critical missing amenities
    missingResult.criticalMissing.forEach((alert: any) => {
      amenityCheckboxes.push({
        amenity: alert.amenityName,
        action: 'add',
        reason: `Found evidence of ${alert.amenityName} but not listed in amenities`
      });

      if (alert.evidence.photoUrls.length > 0) {
        photoSuggestions.push({
          amenity: alert.amenityName,
          suggestion: `Feature photos of ${alert.amenityName} more prominently`,
          availablePhotos: alert.evidence.photoUrls
        });
      }
    });

    // Process under-utilized amenities
    missingResult.underUtilized.forEach((alert: any) => {
      amenityCheckboxes.push({
        amenity: alert.amenityName,
        action: 'feature',
        reason: `${alert.amenityName} is available but not well-highlighted`
      });
    });

    // Generate description updates
    discoveryResult.suggestions.descriptionAdditions.forEach((addition: string) => {
      descriptionUpdates.push({
        section: 'main_description',
        currentText: this.extractRelevantDescriptionSection(scrapedData.description, addition),
        suggestedAddition: addition,
        rationale: 'Found evidence during inspection but not mentioned in description'
      });
    });

    return {
      amenityCheckboxes,
      descriptionUpdates,
      photoSuggestions
    };
  }

  /**
   * Extract relevant section from description
   */
  private extractRelevantDescriptionSection(description: string, addition: string): string {
    // Find the most relevant paragraph/section for this addition
    const sentences = description.split(/[.!?]+/);
    const relevantSentence = sentences.find(sentence => 
      addition.toLowerCase().split(' ').some(word => 
        sentence.toLowerCase().includes(word)
      )
    );
    
    return relevantSentence ? relevantSentence.trim() : 'Beginning of description';
  }

  /**
   * Generate summary of findings
   */
  private generateSummary(discoveryResult: any, missingResult: any, recommendations: any) {
    const totalOpportunities = missingResult.criticalMissing.length + 
                              missingResult.underUtilized.length + 
                              missingResult.opportunityAmenities.length;

    const highPriorityActions = missingResult.criticalMissing.filter((alert: any) => 
      alert.recommendation.priority === 'immediate'
    ).length;

    const keyFindings: string[] = [];
    
    // Add key findings
    if (missingResult.criticalMissing.length > 0) {
      const highValueMissing = missingResult.criticalMissing.filter((alert: any) => 
        alert.category === 'high_value'
      );
      if (highValueMissing.length > 0) {
        keyFindings.push(`${highValueMissing.length} high-value amenities found but not listed`);
      }
    }

    if (missingResult.underUtilized.length > 0) {
      keyFindings.push(`${missingResult.underUtilized.length} amenities could be featured more prominently`);
    }

    if (recommendations.photoSuggestions.length > 0) {
      keyFindings.push(`${recommendations.photoSuggestions.length} opportunities to improve photo presentation`);
    }

    if (keyFindings.length === 0) {
      keyFindings.push('Listing appears well-optimized for visible amenities');
    }

    return {
      totalOpportunities,
      highPriorityActions,
      estimatedImpact: this.calculateEstimatedImpact(missingResult),
      keyFindings
    };
  }

  /**
   * Calculate estimated impact of improvements
   */
  private calculateEstimatedImpact(missingResult: any): string {
    const highValueCount = missingResult.criticalMissing.filter((alert: any) => 
      alert.category === 'high_value'
    ).length;

    if (highValueCount >= 2) {
      return 'High - Multiple premium amenities identified that could significantly improve listing appeal';
    } else if (highValueCount === 1) {
      return 'Moderate - One premium amenity identified that could improve listing competitiveness';
    } else if (missingResult.summary.totalMissing >= 3) {
      return 'Moderate - Several amenities identified that could enhance listing completeness';
    } else if (missingResult.summary.totalMissing > 0) {
      return 'Low - Few amenities identified for optimization';
    } else {
      return 'Minimal - Listing appears well-optimized for current amenities';
    }
  }

  /**
   * Calculate listing optimization metrics
   */
  async calculateOptimizationMetrics(
    inspection: InspectionForReview,
    scrapedData: ScrapedPropertyData
  ): Promise<ComparisonMetrics> {
    try {
      const [discoveryResult, missingResult] = await Promise.all([
        amenityDiscoveryService.compareInspectionToListing(inspection, scrapedData),
        missingAmenityDetector.detectMissingAmenities(inspection, scrapedData)
      ]);

      // Calculate metrics
      const totalPossibleAmenities = scrapedData.amenities.length + missingResult.summary.totalMissing;
      const accurateAmenities = discoveryResult.wellDocumented.length;
      const missedOpportunities = missingResult.summary.totalMissing;

      const listingCompleteness = totalPossibleAmenities > 0 ? 
        Math.round((accurateAmenities / totalPossibleAmenities) * 100) : 100;

      const amenityAccuracy = scrapedData.amenities.length > 0 ? 
        Math.round((accurateAmenities / scrapedData.amenities.length) * 100) : 100;

      const opportunityScore = missedOpportunities > 0 ? 
        Math.max(0, 100 - (missedOpportunities * 10)) : 100;

      const overallOptimization = Math.round(
        (listingCompleteness * 0.4) + 
        (amenityAccuracy * 0.3) + 
        (opportunityScore * 0.3)
      );

      return {
        listingCompleteness,
        amenityAccuracy,
        opportunityScore,
        overallOptimization
      };

    } catch (error) {
      logger.error('Failed to calculate optimization metrics', error, 'AMENITY_COMPARISON_ENGINE');
      throw error;
    }
  }

  /**
   * Get quick actionable checklist
   */
  async getQuickActionableChecklist(
    inspection: InspectionForReview,
    scrapedData: ScrapedPropertyData
  ): Promise<Array<{ item: string; action: string; priority: string }>> {
    const missingResult = await missingAmenityDetector.detectMissingAmenities(inspection, scrapedData);
    
    return [
      ...missingResult.criticalMissing.map(alert => ({
        item: alert.amenityName,
        action: alert.recommendation.specificSuggestion,
        priority: alert.recommendation.priority
      })),
      ...missingResult.underUtilized.slice(0, 3).map(alert => ({
        item: alert.amenityName,
        action: alert.recommendation.specificSuggestion,
        priority: alert.recommendation.priority
      }))
    ];
  }
}

// Export singleton instance
export const amenityComparisonEngine = new AmenityComparisonEngine();