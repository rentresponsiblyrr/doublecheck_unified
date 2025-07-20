// OpenAI Service for STR Certified AI Analysis

import OpenAI from 'openai';
import type {
  AIAnalysisResult,
  PhotoComparisonResult,
  DynamicChecklistItem,
  PropertyData,
  AIServiceConfig,
  AIAnalysisOptions,
  AIError
} from './types';

// ChecklistItem interface for type safety
interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  ai_status?: string;
  ai_confidence?: number;
  completed?: boolean;
  required?: boolean;
}

export class STRCertifiedAIService {
  private openai: OpenAI;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = {
      model: 'gpt-4-vision-preview',
      maxTokens: 1000,
      temperature: 0.3,
      timeout: 30000,
      ...config
    };

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
    });
  }

  /**
   * Analyzes an inspection photo using AI vision capabilities
   * @param file - The image file to analyze
   * @param checklistContext - Context about what to look for
   * @param options - Analysis options
   * @returns Promise<AIAnalysisResult>
   */
  async analyzeInspectionPhoto(
    file: File,
    checklistContext: string,
    options: AIAnalysisOptions = {}
  ): Promise<AIAnalysisResult> {
    try {
      // Convert file to base64 for OpenAI API
      const base64Image = await this.fileToBase64(file);
      
      const prompt = this.buildInspectionAnalysisPrompt(checklistContext, options);

      const response = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-4-vision-preview',
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return this.parseAnalysisResponse(content);
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Generates a dynamic checklist based on property data
   * @param propertyData - Property information for contextualization
   * @returns Promise<DynamicChecklistItem[]>
   */
  async generateDynamicChecklist(propertyData: PropertyData): Promise<DynamicChecklistItem[]> {
    try {
      const prompt = this.buildChecklistGenerationPrompt(propertyData);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        max_tokens: 2000,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'You are an expert property inspector specializing in short-term rental compliance and safety. Generate comprehensive inspection checklists based on property characteristics.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return this.parseChecklistResponse(content);
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Compares an inspector photo to listing photos for accuracy verification
   * @param inspectorPhoto - Photo taken by inspector
   * @param listingPhotos - Array of listing photo URLs
   * @param roomContext - Context about which room/area is being compared
   * @returns Promise<PhotoComparisonResult>
   */
  async comparePhotoToListing(
    inspectorPhoto: File,
    listingPhotos: string[],
    roomContext: string
  ): Promise<PhotoComparisonResult> {
    try {
      const inspectorBase64 = await this.fileToBase64(inspectorPhoto);
      
      // For now, compare to the first listing photo (can be enhanced to compare multiple)
      const primaryListingPhoto = listingPhotos[0];
      
      const prompt = this.buildPhotoComparisonPrompt(roomContext);

      const response = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-4-vision-preview',
        max_tokens: 1000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'text',
                text: 'Inspector Photo:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${inspectorBase64}`,
                  detail: 'high'
                }
              },
              {
                type: 'text',
                text: 'Listing Photo:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: primaryListingPhoto,
                  detail: 'high'
                }
              }
            ]
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return this.parseComparisonResponse(content);
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Validates inspection completeness using AI
   * @param checklistItems - Completed checklist items
   * @param photos - All inspection photos
   * @returns Promise<{complete: boolean, missingItems: string[], recommendations: string[]}>
   */
  async validateInspectionCompleteness(
    checklistItems: ChecklistItem[],
    photos: File[]
  ): Promise<{
    complete: boolean;
    missingItems: string[];
    recommendations: string[];
    confidence: number;
  }> {
    try {
      const prompt = this.buildValidationPrompt(checklistItems, photos.length);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        max_tokens: 1000,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'You are an expert inspection validator. Analyze checklist completeness and provide recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return this.parseValidationResponse(content);
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  // Private helper methods

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data:image/[type];base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  }

  private buildInspectionAnalysisPrompt(context: string, options: AIAnalysisOptions): string {
    return `
Analyze this inspection photo for STR (Short-Term Rental) compliance and safety. Context: ${context}

Please provide a detailed analysis including:
1. Detected features and objects
2. Safety assessment (fire safety, building code compliance, accessibility)
3. Pass/fail recommendation based on STR standards
4. Confidence level (0-100)
5. Detailed reasoning for your assessment

${options.checkSafetyConcerns ? 'Pay special attention to safety concerns and violations.' : ''}
${options.compareToStandards ? 'Compare against local building codes and STR regulations.' : ''}
${options.generateRecommendations ? 'Provide specific recommendations for improvement.' : ''}

Format your response as JSON with the following structure:
{
  "confidence": number,
  "detected_features": string[],
  "pass_fail_recommendation": "pass" | "fail" | "review_required",
  "reasoning": "detailed explanation",
  "safety_concerns": string[],
  "compliance_status": {
    "building_code": boolean,
    "fire_safety": boolean,
    "accessibility": boolean
  }
}
    `.trim();
  }

  private buildChecklistGenerationPrompt(propertyData: PropertyData): string {
    return `
Generate a comprehensive inspection checklist for this STR property:

Property Type: ${propertyData.property_type}
Bedrooms: ${propertyData.room_count.bedrooms}
Bathrooms: ${propertyData.room_count.bathrooms}
Amenities: ${propertyData.amenities.join(', ')}
Description: ${propertyData.description}
Location: ${propertyData.location.city}, ${propertyData.location.state}
${propertyData.special_features ? `Special Features: ${propertyData.special_features.join(', ')}` : ''}

Generate 15-25 specific checklist items that are:
1. Relevant to this property type and amenities
2. Focused on safety, compliance, and guest experience
3. Prioritized by importance (critical, high, medium, low)
4. Include estimated time for completion

Format as JSON array of checklist items with this structure:
{
  "id": "unique_id",
  "title": "Item title",
  "description": "Detailed description",
  "required": boolean,
  "ai_generated": true,
  "category": "safety|compliance|amenities|cleanliness|maintenance",
  "priority": "critical|high|medium|low",
  "estimated_time_minutes": number
}
    `.trim();
  }

  private buildPhotoComparisonPrompt(roomContext: string): string {
    return `
Compare these two photos of ${roomContext} to verify listing accuracy:

Analyze and provide:
1. Similarity score (0-100%)
2. Specific discrepancies found
3. Assessment of lighting, furniture, layout differences
4. Overall recommendation (matches_listing, minor_differences, major_discrepancies)
5. Confidence in comparison

Format response as JSON:
{
  "similarity_score": number,
  "discrepancies": string[],
  "recommendation": "matches_listing" | "minor_differences" | "major_discrepancies",
  "confidence": number,
  "details": {
    "lighting_differences": boolean,
    "furniture_changes": boolean,
    "structural_differences": boolean,
    "room_layout_match": boolean
  }
}
    `.trim();
  }

  private buildValidationPrompt(checklistItems: ChecklistItem[], photoCount: number): string {
    return `
Validate the completeness of this STR inspection:

Checklist Items Completed: ${checklistItems.length}
Photos Taken: ${photoCount}

Checklist Summary:
${checklistItems.map(item => `- ${item.title}: ${item.status || 'completed'}`).join('\n')}

Analyze if this inspection is complete and provide:
1. Completeness assessment (true/false)
2. Missing critical items
3. Recommendations for improvement
4. Confidence in assessment

Format as JSON:
{
  "complete": boolean,
  "missingItems": string[],
  "recommendations": string[],
  "confidence": number
}
    `.trim();
  }

  private parseAnalysisResponse(content: string): AIAnalysisResult {
    try {
      const parsed = JSON.parse(content);
      return {
        confidence: parsed.confidence || 0,
        detected_features: parsed.detected_features || [],
        pass_fail_recommendation: parsed.pass_fail_recommendation || 'review_required',
        reasoning: parsed.reasoning || 'Analysis completed',
        safety_concerns: parsed.safety_concerns,
        compliance_status: parsed.compliance_status
      };
    } catch (error) {
      // Fallback parsing if JSON is malformed
      return {
        confidence: 50,
        detected_features: ['Analysis completed'],
        pass_fail_recommendation: 'review_required',
        reasoning: content.substring(0, 500),
      };
    }
  }

  private parseChecklistResponse(content: string): DynamicChecklistItem[] {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      // Return empty array if parsing fails
      // REMOVED: console.error('Failed to parse checklist response:', error);
      return [];
    }
  }

  private parseComparisonResponse(content: string): PhotoComparisonResult {
    try {
      const parsed = JSON.parse(content);
      return {
        similarity_score: parsed.similarity_score || 0,
        discrepancies: parsed.discrepancies || [],
        recommendation: parsed.recommendation || 'major_discrepancies',
        confidence: parsed.confidence || 0,
        details: parsed.details || {
          lighting_differences: false,
          furniture_changes: false,
          structural_differences: false,
          room_layout_match: false
        }
      };
    } catch (error) {
      return {
        similarity_score: 0,
        discrepancies: ['Unable to analyze comparison'],
        recommendation: 'major_discrepancies',
        confidence: 0,
        details: {
          lighting_differences: false,
          furniture_changes: false,
          structural_differences: false,
          room_layout_match: false
        }
      };
    }
  }

  private parseValidationResponse(content: string): {
    complete: boolean;
    missingItems: string[];
    recommendations: string[];
    confidence: number;
  } {
    try {
      const parsed = JSON.parse(content);
      return {
        complete: parsed.complete || false,
        missingItems: parsed.missingItems || [],
        recommendations: parsed.recommendations || [],
        confidence: parsed.confidence || 0
      };
    } catch (error) {
      return {
        complete: false,
        missingItems: ['Unable to validate'],
        recommendations: ['Review inspection manually'],
        confidence: 0
      };
    }
  }

  private handleAPIError(error: unknown): AIError {
    if (error.code === 'insufficient_quota') {
      return {
        code: 'QUOTA_EXCEEDED',
        message: 'OpenAI API quota exceeded',
        details: error,
        retryable: false
      };
    }

    if (error.code === 'rate_limit_exceeded') {
      return {
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded, please try again later',
        details: error,
        retryable: true
      };
    }

    if (error.status === 401) {
      return {
        code: 'INVALID_API_KEY',
        message: 'Invalid OpenAI API key',
        details: error,
        retryable: false
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error,
      retryable: true
    };
  }
}

// Export a singleton instance factory
export const createAIService = (config: AIServiceConfig): STRCertifiedAIService => {
  return new STRCertifiedAIService(config);
};

// Export default configuration
export const DEFAULT_AI_CONFIG: Partial<AIServiceConfig> = {
  model: 'gpt-4-vision-preview',
  maxTokens: 1000,
  temperature: 0.3,
  timeout: 30000,
} as const;