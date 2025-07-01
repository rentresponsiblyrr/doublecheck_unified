import OpenAI from 'openai';
import { env } from "~/env";
import { TRPCError } from "@trpc/server";
import { aiCacheService, cacheKey } from "./aiCache.service";
import { OptimizedPrompts, DataCompression, TokenEstimator, CostStrategies } from "./openai-optimization";

interface TextCompletionOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

interface VisionAnalysisOptions {
  imageUrl: string;
  prompt: string;
  maxTokens?: number;
}

interface PropertyConditionAssessment {
  overallScore: number;
  categories: {
    structural: number;
    interior: number;
    exterior: number;
    systems: number;
  };
  maintenanceRecommendations: string[];
  priorityIssues: string[];
}

interface InspectionValidation {
  isValid: boolean;
  completenessScore: number;
  missingItems: string[];
  suggestions: string[];
}

class OpenAIService {
  private openai: OpenAI;
  private textModel: string;
  private visionModel: string;

  constructor() {
    const apiKey = env.OPENAI_API_KEY || "";
    
    if (!apiKey) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "OpenAI API key is not configured",
      });
    }

    this.openai = new OpenAI({
      apiKey,
      organization: env.OPENAI_ORG_ID,
    });

    this.textModel = env.OPENAI_MODEL || "gpt-4";
    this.visionModel = env.OPENAI_VISION_MODEL || "gpt-4-vision-preview";
  }

  async generateText(options: TextCompletionOptions, userId?: string): Promise<string> {
    const cacheKeyStr = cacheKey("generateText", options);
    
    const generateFn = async () => {
      try {
        const response = await this.openai.chat.completions.create({
          model: this.textModel,
          messages: [
            ...(options.systemPrompt
              ? [{ role: "system" as const, content: options.systemPrompt }]
              : []),
            { role: "user" as const, content: options.prompt },
          ],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1000,
        });

        return response.choices[0]?.message?.content || "";
      } catch (error) {
        console.error("OpenAI text generation error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate text with OpenAI",
        });
      }
    };

    if (userId) {
      return aiCacheService.withCacheAndRateLimit(
        userId,
        cacheKeyStr,
        generateFn,
        600000 // 10 minutes cache
      );
    }
    
    return aiCacheService.withCache(cacheKeyStr, generateFn, 600000);
  }

  async analyzeImage(options: VisionAnalysisOptions, userId?: string): Promise<string> {
    const cacheKeyStr = cacheKey("analyzeImage", options);
    
    const analyzeFn = async () => {
      try {
        const response = await this.openai.chat.completions.create({
          model: this.visionModel,
          messages: [
            {
              role: "user" as const,
              content: [
                { type: "text" as const, text: options.prompt },
                { type: "image_url" as const, image_url: { url: options.imageUrl } },
              ],
            },
          ],
          max_tokens: options.maxTokens ?? 500,
        });

        return response.choices[0]?.message?.content || "";
      } catch (error) {
        console.error("OpenAI vision analysis error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to analyze image with OpenAI",
        });
      }
    };

    if (userId) {
      return aiCacheService.withCacheAndRateLimit(
        userId,
        cacheKeyStr,
        analyzeFn,
        1800000 // 30 minutes cache for images
      );
    }
    
    return aiCacheService.withCache(cacheKeyStr, analyzeFn, 1800000);
  }

  async validateInspectionReport(
    reportData: Record<string, any>,
    userId?: string
  ): Promise<InspectionValidation> {
    // Compress data for efficiency
    const compressed = reportData.items ? DataCompression.compressInspectionData(reportData) : reportData;
    const cacheKeyStr = CostStrategies.generateCacheKey("validateInspection", compressed);
    
    const validateFn = async () => {
      try {
        // Use optimized prompt
        const optimizedPrompt = OptimizedPrompts.inspectionValidation({
          propertyType: reportData.propertyType || 'Property',
          itemsPassed: compressed.totalItems - compressed.failedCount || 0,
          itemsFailed: compressed.failedCount || 0,
          criticalIssues: compressed.criticalIssues || []
        });

        // Estimate cost
        const inputTokens = TokenEstimator.estimateTokens(optimizedPrompt);
        console.log(`Validation prompt tokens: ${inputTokens} (~$${(inputTokens * 0.00003).toFixed(4)})`);

        const response = await this.openai.chat.completions.create({
          model: CostStrategies.selectModel('simple'),
          messages: [
            {
              role: "system",
              content: "Expert vacation rental inspector. Provide concise JSON responses."
            },
            {
              role: "user",
              content: optimizedPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200,
          response_format: { type: "json_object" }
        });

        const result = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(result);
        
        // Transform optimized response to expected format
        return {
          isValid: parsed.valid ?? false,
          completenessScore: parsed.score ?? 0,
          missingItems: parsed.topIssues ?? [],
          suggestions: parsed.actions ?? []
        };
      } catch (error) {
        console.error("Inspection validation error:", error);
        return {
          isValid: false,
          completenessScore: 0,
          missingItems: ["Unable to validate inspection"],
          suggestions: ["Please try again"],
        };
      }
    };

    if (userId) {
      return aiCacheService.withCacheAndRateLimit(
        userId,
        cacheKeyStr,
        validateFn,
        600000 // 10 minutes cache
      );
    }
    
    return aiCacheService.withCache(cacheKeyStr, validateFn, 600000);
  }

  async assessPropertyCondition(
    inspectionData: Record<string, any>,
    photos?: string[],
    userId?: string
  ): Promise<PropertyConditionAssessment> {
    // Use optimized prompt
    const reportedIssues = inspectionData.items
      ?.filter((i: any) => i.status === 'FAIL')
      .map((i: any) => `${i.category}: ${i.name}`)
      .slice(0, 5) || [];

    const optimizedPrompt = OptimizedPrompts.propertyCondition({
      propertyType: inspectionData.propertyType || 'Property',
      age: inspectionData.propertyAge,
      lastMaintenance: inspectionData.lastMaintenanceDate,
      reportedIssues
    });

    try {
      const response = await this.openai.chat.completions.create({
        model: CostStrategies.selectModel('simple'),
        messages: [
          {
            role: "system",
            content: "Property condition expert. Provide scores and priorities concisely."
          },
          {
            role: "user",
            content: optimizedPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 250
      });

      const result = response.choices[0]?.message?.content || "";
      
      // Parse structured response
      const scoreMatch = result.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)[,\s]+(\d+)/);      const scores = scoreMatch ? {
        structural: parseInt(scoreMatch[1]) * 10,
        interior: parseInt(scoreMatch[2]) * 10,
        exterior: parseInt(scoreMatch[3]) * 10,
        systems: parseInt(scoreMatch[4]) * 10
      } : { structural: 70, interior: 70, exterior: 70, systems: 70 };

      const overallScore = Math.round(
        (scores.structural + scores.interior + scores.exterior + scores.systems) / 4
      );

      // Extract maintenance priorities
      const priorities = result
        .split('\n')
        .filter(line => line.match(/^\d+\.|^-|^•/))
        .map(line => line.replace(/^[\d.\-•\s]+/, '').trim())
        .slice(0, 3);

      // Analyze photos if provided (limit to 3 for cost)
      let photoIssues: string[] = [];
      if (photos && photos.length > 0 && CostStrategies.requiresFullAnalysis(inspectionData)) {
        for (const photo of photos.slice(0, 3)) {
          const photoPrompt = OptimizedPrompts.photoAnalysis({
            room: 'Unknown',
            focus: ['maintenance', 'safety']
          });
          
          const analysis = await this.analyzeImage({
            imageUrl: photo,
            prompt: photoPrompt,
            maxTokens: 100
          }, userId);
          
          const issues = analysis.match(/maintenance needs?:(.+?)(?:safety|$)/i);
          if (issues) {
            photoIssues.push(issues[1].trim());
          }
        }
      }

      return {
        overallScore,
        categories: scores,
        maintenanceRecommendations: priorities.slice(0, 3),
        priorityIssues: [...reportedIssues.slice(0, 2), ...photoIssues].slice(0, 3)
      };
    } catch (error) {
      console.error("Property assessment error:", error);
      return {
        overallScore: 0,
        categories: {
          structural: 0,
          interior: 0,
          exterior: 0,
          systems: 0,
        },
        maintenanceRecommendations: ["Unable to assess property"],
        priorityIssues: ["Please try again"],
      };
    }
  }

  async generateInspectionReport(
    propertyData: Record<string, any>,
    checklistData: Record<string, any>,
    userId?: string
  ): Promise<string> {
    // Compress data for efficient processing
    const propertyInfo = DataCompression.compressPropertyData(propertyData);
    const checklistSummary = {
      score: checklistData.score || 0,
      passed: checklistData.passedItems || 0,
      failed: checklistData.failedItems || 0,
      criticalIssues: checklistData.criticalIssues?.slice(0, 5) || [],
      categories: checklistData.categorySummary || {}
    };

    const optimizedPrompt = `
Property: ${propertyInfo}
Inspection Score: ${checklistSummary.score}/100
Pass/Fail: ${checklistSummary.passed}/${checklistSummary.failed}
Critical: ${checklistSummary.criticalIssues.join('; ') || 'None'}

Generate concise report:
1. Status (2 sentences)
2. Top 3 findings
3. Required actions (max 5)
4. Maintenance schedule
`;

    return this.generateText({
      prompt: optimizedPrompt,
      systemPrompt: "STR inspector. Generate actionable reports. Be concise.",
      temperature: 0.5,
      maxTokens: 800, // Reduced from 2000
    }, userId);
  }

  async moderateContent(text: string): Promise<boolean> {
    try {
      const response = await this.openai.moderations.create({
        input: text,
      });

      const results = response.results[0];
      return !results?.flagged;
    } catch (error) {
      console.error("OpenAI moderation error:", error);
      return true;
    }
  }

  async generateMarketInsights(
    location: string,
    propertyType: string,
    userId?: string
  ): Promise<string> {
    const prompt = `
    Provide STR market insights for:
    Location: ${location}
    Property Type: ${propertyType}
    
    Include:
    1. Market trends
    2. Average occupancy rates
    3. Pricing recommendations
    4. Seasonal patterns
    5. Competition analysis
    6. Investment potential
    `;

    return this.generateText({
      prompt,
      systemPrompt:
        "You are a short-term rental market analyst. Provide data-driven insights and recommendations.",
      temperature: 0.5,
      maxTokens: 1500,
    }, userId);
  }
}

export const openAIService = new OpenAIService();