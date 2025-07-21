// Enhanced Photo Quality Service for STR Certified MVP
// Validates photo quality and provides re-upload prompts

import { STRCertifiedAIService } from './openai-service';
import { AIProxyService } from './ai-proxy-service';
import { aiDecisionLogger } from './decision-logger';
import { logger } from '../../utils/logger';
import { errorReporter } from '../monitoring/error-reporter';

// Photo Quality Types
export interface PhotoQualityResult {
  isAcceptable: boolean;
  qualityScore: number; // 0-100
  issues: PhotoQualityIssue[];
  recommendation: QualityRecommendation;
  confidence: number;
  processingTime: number;
  retryPrompt?: string;
}

export interface PhotoQualityIssue {
  type: QualityIssueType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  fixSuggestion: string;
  blocking: boolean;
}

export type QualityIssueType = 
  | 'blur'
  | 'low_light'
  | 'overexposure'
  | 'poor_composition'
  | 'wrong_subject'
  | 'obstruction'
  | 'poor_angle'
  | 'resolution_too_low'
  | 'color_distortion'
  | 'focus_issues'
  | 'motion_blur'
  | 'timestamp_missing'
  | 'safety_equipment_not_visible'
  | 'insufficient_coverage';

export interface QualityRecommendation {
  action: 'accept' | 'request_retake' | 'manual_review';
  reason: string;
  improvements: string[];
  expectedQuality: number;
}

export interface ChecklistItemContext {
  title: string;
  description: string;
  category: string;
  evidenceRequired: boolean;
  safetyRelated: boolean;
  complianceRequired: boolean;
  expectedSubjects: string[];
  minimumQuality: number;
}

export class PhotoQualityService {
  private static instance: PhotoQualityService;
  private aiService: AIProxyService;
  private qualityThresholds: Record<string, number> = {
    safety: 85,
    compliance: 80,
    general: 70,
    documentation: 75,
    evidence: 90
  };

  private constructor() {
    // Use secure backend proxy for AI analysis
    this.aiService = AIProxyService.getInstance();
  }

  static getInstance(): PhotoQualityService {
    if (!PhotoQualityService.instance) {
      PhotoQualityService.instance = new PhotoQualityService();
    }
    return PhotoQualityService.instance;
  }

  /**
   * Validates photo quality for a specific checklist item
   * @param photo - The photo file to validate
   * @param context - Context about the checklist item
   * @returns Promise<PhotoQualityResult>
   */
  async validatePhotoQuality(
    photo: File,
    context: ChecklistItemContext
  ): Promise<PhotoQualityResult> {
    const startTime = Date.now();
    
    try {
      // Log the quality validation attempt
      await aiDecisionLogger.logSimpleDecision(
        `Photo quality validation: ${context.title}`,
        'code_quality',
        `Validating photo quality for checklist item: ${context.title}`,
        [`photo_${photo.name}`],
        'medium'
      );

      // Get expected quality threshold for this context
      const expectedQuality = this.getExpectedQuality(context);
      
      // Analyze photo with AI
      const analysisResult = await this.analyzePhotoWithAI(photo, context);
      
      // Process and structure the results
      const result: PhotoQualityResult = {
        isAcceptable: analysisResult.qualityScore >= expectedQuality,
        qualityScore: analysisResult.qualityScore,
        issues: analysisResult.issues,
        recommendation: this.generateRecommendation(analysisResult, expectedQuality),
        confidence: analysisResult.confidence,
        processingTime: Date.now() - startTime,
        retryPrompt: analysisResult.qualityScore < expectedQuality ? 
          this.generateRetryPrompt(analysisResult.issues, context) : undefined
      };

      // Log the validation result
      logger.info(`Photo quality validation completed`, {
        checklistItem: context.title,
        qualityScore: result.qualityScore,
        acceptable: result.isAcceptable,
        issues: result.issues.length,
        processingTime: result.processingTime
      }, 'PHOTO_QUALITY_VALIDATION');

      return result;

    } catch (error) {
      errorReporter.reportError(error, {
        context: 'PHOTO_QUALITY_VALIDATION',
        checklistItem: context.title,
        photoName: photo.name,
        photoSize: photo.size
      });

      // Return fallback result on error
      return {
        isAcceptable: false,
        qualityScore: 0,
        issues: [{
          type: 'resolution_too_low',
          severity: 'high',
          description: 'Unable to analyze photo quality',
          fixSuggestion: 'Please try uploading the photo again',
          blocking: true
        }],
        recommendation: {
          action: 'request_retake',
          reason: 'Technical error during quality analysis',
          improvements: ['Try uploading the photo again'],
          expectedQuality: 70
        },
        confidence: 0,
        processingTime: Date.now() - startTime,
        retryPrompt: 'There was an issue analyzing your photo. Please try uploading it again.'
      };
    }
  }

  /**
   * Batch validates multiple photos for efficiency
   * @param photos - Array of photo files with their contexts
   * @returns Promise<PhotoQualityResult[]>
   */
  async validateMultiplePhotos(
    photos: Array<{ file: File; context: ChecklistItemContext }>
  ): Promise<PhotoQualityResult[]> {
    const results: PhotoQualityResult[] = [];
    
    // Process photos in batches to avoid API rate limits
    const batchSize = 3;
    for (let i = 0; i < photos.length; i += batchSize) {
      const batch = photos.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(({ file, context }) => this.validatePhotoQuality(file, context))
      );
      
      results.push(...batchResults);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < photos.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Generates a user-friendly retry prompt with specific instructions
   * @param issues - List of quality issues found
   * @param context - Checklist item context
   * @returns string
   */
  private generateRetryPrompt(issues: PhotoQualityIssue[], context: ChecklistItemContext): string {
    const blockingIssues = issues.filter(issue => issue.blocking);
    
    if (blockingIssues.length === 0) {
      return 'Your photo has been accepted! You may continue to the next item.';
    }

    const mainIssue = blockingIssues[0];
    const suggestions = blockingIssues.map(issue => issue.fixSuggestion).slice(0, 3);
    
    const basePrompt = `📸 Photo needs improvement for "${context.title}"`;
    const issueDescription = mainIssue.description;
    const improvementTips = suggestions.join('\n• ');
    
    return `${basePrompt}\n\n${issueDescription}\n\nTo improve your photo:\n• ${improvementTips}`;
  }

  /**
   * Analyzes photo using AI vision capabilities
   * @param photo - Photo file to analyze
   * @param context - Checklist item context
   * @returns Promise with analysis results
   */
  private async analyzePhotoWithAI(
    photo: File,
    context: ChecklistItemContext
  ): Promise<{
    qualityScore: number;
    issues: PhotoQualityIssue[];
    confidence: number;
  }> {
    logger.info('Starting AI photo quality analysis', { photoName: photo.name }, 'PHOTO_QUALITY_AI');
    
    try {
      // Convert file to base64 for AI analysis
      const base64Image = await this.fileToBase64(photo);
      
      // Build the analysis prompt
      const prompt = this.buildQualityAnalysisPrompt(context);
      
      const analysisResult = await this.aiService.analyzeInspectionPhoto({
        imageBase64: base64Image,
        prompt,
        inspectionId: 'quality-check', // Placeholder for quality checks
        checklistItemId: context.title, // Use title as identifier
        maxTokens: 500
      });

      return this.parseQualityAnalysis(analysisResult);
    } catch (error) {
      logger.error('AI photo analysis failed', error, 'PHOTO_QUALITY_AI');
      throw error;
    }
  }

  /**
   * Convert file to base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Builds the AI prompt for photo quality analysis
   * @param context - Checklist item context
   * @returns string
   */
  private buildQualityAnalysisPrompt(context: ChecklistItemContext): string {
    return `
Analyze this photo for quality and suitability for STR property inspection.

Context: ${context.title}
Description: ${context.description}
Category: ${context.category}
Evidence Required: ${context.evidenceRequired ? 'Yes' : 'No'}
Safety Related: ${context.safetyRelated ? 'Yes' : 'No'}
Expected Subjects: ${context.expectedSubjects.join(', ')}

Please evaluate:
1. Technical quality (focus, lighting, resolution, composition)
2. Content relevance (shows expected subjects clearly)
3. Suitability for inspection purposes
4. Any safety or compliance issues visible

Provide specific feedback on issues and improvements needed.
Quality score should be 0-100 where:
- 90-100: Excellent quality, perfect for inspection
- 80-89: Good quality, minor improvements possible
- 70-79: Acceptable quality, some improvements needed
- 60-69: Poor quality, significant improvements needed
- 0-59: Unacceptable, retake required

Focus on practical inspection needs rather than artistic quality.
${context.safetyRelated ? 'Pay special attention to safety equipment and hazards visibility.' : ''}
${context.complianceRequired ? 'Ensure compliance elements are clearly visible and documented.' : ''}
    `.trim();
  }

  /**
   * Parses AI analysis results into structured format
   * @param analysisResult - Raw AI analysis result
   * @returns Structured quality analysis
   */
  private parseQualityAnalysis(analysisResult: Record<string, unknown>): {
    qualityScore: number;
    issues: PhotoQualityIssue[];
    confidence: number;
  } {
    const issues: PhotoQualityIssue[] = [];
    
    // Extract quality score from reasoning or default to confidence
    const qualityScore = this.extractQualityScore(analysisResult.analysis?.reasoning) || 
                        Math.min(analysisResult.analysis?.confidence || 70, 80);
    
    // Parse issues from reasoning
    const parsedIssues = this.extractIssuesFromReasoning(analysisResult.analysis?.reasoning || '');
    issues.push(...parsedIssues);
    
    // Add any issues from analysis
    if (analysisResult.analysis?.issues && Array.isArray(analysisResult.analysis.issues)) {
      analysisResult.analysis.issues.forEach((issue: string) => {
        issues.push({
          type: 'poor_composition',
          severity: 'medium',
          description: issue,
          fixSuggestion: 'Address the identified issue and retake the photo',
          blocking: false
        });
      });
    }
    
    return {
      qualityScore,
      issues,
      confidence: analysisResult.analysis?.confidence || 70
    };
  }

  /**
   * Extracts quality score from AI reasoning text
   * @param reasoning - AI reasoning text
   * @returns number | null
   */
  private extractQualityScore(reasoning: string): number | null {
    const scorePatterns = [
      /quality score:?\s*(\d+)/i,
      /score:?\s*(\d+)\/100/i,
      /rating:?\s*(\d+)/i,
      /(\d+)\/100/,
      /(\d+)%/
    ];
    
    for (const pattern of scorePatterns) {
      const match = reasoning.match(pattern);
      if (match) {
        const score = parseInt(match[1]);
        return score >= 0 && score <= 100 ? score : null;
      }
    }
    
    return null;
  }

  /**
   * Extracts issues from AI reasoning text
   * @param reasoning - AI reasoning text
   * @returns PhotoQualityIssue[]
   */
  private extractIssuesFromReasoning(reasoning: string): PhotoQualityIssue[] {
    const issues: PhotoQualityIssue[] = [];
    const lowercaseReasoning = reasoning.toLowerCase();
    
    // Define issue patterns to look for
    const issuePatterns = [
      {
        keywords: ['blur', 'blurry', 'out of focus', 'unfocused'],
        type: 'blur' as QualityIssueType,
        severity: 'high' as const,
        description: 'Image is blurry or out of focus',
        fixSuggestion: 'Hold the camera steady and ensure proper focus before taking the photo'
      },
      {
        keywords: ['dark', 'low light', 'underexposed', 'too dim'],
        type: 'low_light' as QualityIssueType,
        severity: 'medium' as const,
        description: 'Image is too dark or poorly lit',
        fixSuggestion: 'Increase lighting or use flash, ensure adequate room lighting'
      },
      {
        keywords: ['overexposed', 'too bright', 'washed out', 'glare'],
        type: 'overexposure' as QualityIssueType,
        severity: 'medium' as const,
        description: 'Image is overexposed or too bright',
        fixSuggestion: 'Reduce lighting or adjust camera settings, avoid direct sunlight'
      },
      {
        keywords: ['poor angle', 'wrong angle', 'composition', 'framing'],
        type: 'poor_composition' as QualityIssueType,
        severity: 'medium' as const,
        description: 'Poor camera angle or composition',
        fixSuggestion: 'Adjust camera angle to better capture the subject'
      },
      {
        keywords: ['obstruction', 'blocked', 'obstacle', 'partially hidden'],
        type: 'obstruction' as QualityIssueType,
        severity: 'high' as const,
        description: 'Subject is partially obstructed or hidden',
        fixSuggestion: 'Remove obstructions or change angle to clearly show the subject'
      },
      {
        keywords: ['low resolution', 'pixelated', 'poor quality'],
        type: 'resolution_too_low' as QualityIssueType,
        severity: 'medium' as const,
        description: 'Image resolution is too low',
        fixSuggestion: 'Use higher camera resolution settings or move closer to the subject'
      }
    ];

    // Check for each issue pattern
    issuePatterns.forEach(pattern => {
      const hasIssue = pattern.keywords.some(keyword => 
        lowercaseReasoning.includes(keyword)
      );
      
      if (hasIssue) {
        issues.push({
          type: pattern.type,
          severity: pattern.severity,
          description: pattern.description,
          fixSuggestion: pattern.fixSuggestion,
          blocking: pattern.severity === 'high' || pattern.severity === 'critical'
        });
      }
    });

    return issues;
  }

  /**
   * Generates recommendation based on quality analysis
   * @param analysis - Quality analysis results
   * @param expectedQuality - Expected quality threshold
   * @returns QualityRecommendation
   */
  private generateRecommendation(
    analysis: { qualityScore: number; issues: PhotoQualityIssue[]; confidence: number },
    expectedQuality: number
  ): QualityRecommendation {
    const blockingIssues = analysis.issues.filter(issue => issue.blocking);
    
    if (analysis.qualityScore >= expectedQuality && blockingIssues.length === 0) {
      return {
        action: 'accept',
        reason: 'Photo meets quality standards',
        improvements: [],
        expectedQuality
      };
    }
    
    if (analysis.confidence < 50) {
      return {
        action: 'manual_review',
        reason: 'Low confidence in quality assessment',
        improvements: ['Consider manual review by auditor'],
        expectedQuality
      };
    }
    
    return {
      action: 'request_retake',
      reason: `Quality score ${analysis.qualityScore} is below required ${expectedQuality}`,
      improvements: analysis.issues.map(issue => issue.fixSuggestion).slice(0, 3),
      expectedQuality
    };
  }

  /**
   * Determines expected quality threshold based on context
   * @param context - Checklist item context
   * @returns number
   */
  private getExpectedQuality(context: ChecklistItemContext): number {
    if (context.minimumQuality > 0) {
      return context.minimumQuality;
    }
    
    if (context.safetyRelated) {
      return this.qualityThresholds.safety;
    }
    
    if (context.complianceRequired) {
      return this.qualityThresholds.compliance;
    }
    
    if (context.evidenceRequired) {
      return this.qualityThresholds.evidence;
    }
    
    return this.qualityThresholds.general;
  }

  /**
   * Updates quality thresholds for different categories
   * @param thresholds - New threshold values
   */
  updateQualityThresholds(thresholds: Partial<Record<string, number>>): void {
    this.qualityThresholds = { ...this.qualityThresholds, ...thresholds };
  }

  /**
   * Gets current quality thresholds
   * @returns Current threshold configuration
   */
  getQualityThresholds(): Record<string, number> {
    return { ...this.qualityThresholds };
  }
}

// Export singleton instance
export const photoQualityService = PhotoQualityService.getInstance();

// Export convenience functions
export const validatePhotoQuality = photoQualityService.validatePhotoQuality.bind(photoQualityService);
export const validateMultiplePhotos = photoQualityService.validateMultiplePhotos.bind(photoQualityService);