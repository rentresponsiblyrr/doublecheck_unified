import { openAIService } from "./openai.service";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";

interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  recommendations: string[];
  aiInsights: Record<string, any>;
}

interface ValidationIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  description: string;
  affectedItem?: string;
}

interface ChecklistValidation {
  completeness: number;
  accuracy: number;
  missingRequired: string[];
  inconsistencies: string[];
}

class AIValidationService {
  private enabled: boolean;

  constructor() {
    this.enabled = env.ENABLE_AI_VALIDATION === "true";
  }

  async validateInspection(
    inspectionData: {
      id: string;
      propertyId: string;
      checklistId: string;
      items: Array<{
        id: string;
        name: string;
        status: string;
        notes?: string;
        photos?: string[];
      }>;
    },
    propertyDetails?: Record<string, any>
  ): Promise<ValidationResult> {
    if (!this.enabled) {
      return this.getDefaultValidationResult();
    }

    try {
      const validation = await openAIService.validateInspectionReport({
        inspection: inspectionData,
        property: propertyDetails,
      });

      const issues: ValidationIssue[] = [];

      if (validation.completenessScore < 80) {
        issues.push({
          severity: "warning",
          category: "completeness",
          description: `Inspection is only ${validation.completenessScore}% complete`,
        });
      }

      validation.missingItems.forEach((item) => {
        issues.push({
          severity: "critical",
          category: "missing",
          description: `Missing required item: ${item}`,
          affectedItem: item,
        });
      });

      const propertyCondition = await openAIService.assessPropertyCondition(
        inspectionData,
        this.extractPhotoUrls(inspectionData.items)
      );

      if (propertyCondition.overallScore < 70) {
        issues.push({
          severity: "warning",
          category: "condition",
          description: `Property condition score is low: ${propertyCondition.overallScore}/100`,
        });
      }

      propertyCondition.priorityIssues.forEach((issue) => {
        issues.push({
          severity: "critical",
          category: "maintenance",
          description: issue,
        });
      });

      return {
        isValid: validation.isValid && issues.filter(i => i.severity === "critical").length === 0,
        score: (validation.completenessScore + propertyCondition.overallScore) / 2,
        issues,
        recommendations: [
          ...validation.suggestions,
          ...propertyCondition.maintenanceRecommendations,
        ],
        aiInsights: {
          validation,
          propertyCondition,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("AI validation error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to perform AI validation",
      });
    }
  }

  async validateChecklist(
    checklistData: {
      id: string;
      name: string;
      categories: Array<{
        name: string;
        items: Array<{
          name: string;
          required: boolean;
          description?: string;
        }>;
      }>;
    }
  ): Promise<ChecklistValidation> {
    if (!this.enabled) {
      return {
        completeness: 100,
        accuracy: 100,
        missingRequired: [],
        inconsistencies: [],
      };
    }

    const prompt = `
    Analyze this STR inspection checklist for completeness and best practices:
    ${JSON.stringify(checklistData, null, 2)}
    
    Return a JSON object with:
    - completeness: percentage score (0-100)
    - accuracy: how well it matches industry standards (0-100)
    - missingRequired: array of missing critical items
    - inconsistencies: array of logical inconsistencies or issues
    `;

    try {
      const result = await openAIService.generateText({
        prompt,
        systemPrompt:
          "You are an expert in STR property management and inspection standards. Evaluate checklists for thoroughness and compliance.",
        temperature: 0.3,
      });

      return JSON.parse(result);
    } catch (error) {
      console.error("Checklist validation error:", error);
      return {
        completeness: 0,
        accuracy: 0,
        missingRequired: ["Unable to validate checklist"],
        inconsistencies: ["Validation failed"],
      };
    }
  }

  async generateInspectionSummary(
    inspectionId: string,
    inspectionData: Record<string, any>
  ): Promise<string> {
    if (!this.enabled) {
      return "AI-powered summaries are not enabled.";
    }

    try {
      const summary = await openAIService.generateText({
        prompt: `
        Create a concise executive summary for this STR property inspection:
        ${JSON.stringify(inspectionData, null, 2)}
        
        Include:
        - Overall property condition
        - Key findings
        - Priority action items
        - Compliance status
        
        Keep it under 200 words.
        `,
        systemPrompt:
          "You are a property inspection expert. Create clear, actionable summaries for property managers.",
        temperature: 0.5,
        maxTokens: 300,
      });

      return summary;
    } catch (error) {
      console.error("Summary generation error:", error);
      return "Failed to generate AI summary.";
    }
  }

  async analyzePropertyPhotos(
    photos: Array<{ url: string; category?: string }>
  ): Promise<Record<string, any>> {
    if (!this.enabled || photos.length === 0) {
      return { analyzed: false };
    }

    const analyses = await Promise.all(
      photos.slice(0, 10).map(async (photo) => {
        try {
          const analysis = await openAIService.analyzeImage({
            imageUrl: photo.url,
            prompt: `Analyze this STR property photo for:
            1. Cleanliness and maintenance issues
            2. Safety concerns
            3. Damage or wear
            4. Guest experience impact
            5. Compliance with STR standards
            
            Be specific and actionable.`,
          });

          return {
            photoUrl: photo.url,
            category: photo.category,
            analysis,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          console.error("Photo analysis error:", error);
          return {
            photoUrl: photo.url,
            category: photo.category,
            analysis: "Failed to analyze photo",
            error: true,
          };
        }
      })
    );

    return {
      analyzed: true,
      photoCount: photos.length,
      analyzedCount: analyses.length,
      analyses,
    };
  }

  async getMarketBenchmarks(
    location: string,
    propertyType: string
  ): Promise<Record<string, any>> {
    if (!this.enabled) {
      return { available: false };
    }

    try {
      const insights = await openAIService.generateMarketInsights(
        location,
        propertyType
      );

      const benchmarkPrompt = `
      Based on these market insights:
      ${insights}
      
      Extract specific benchmarks as JSON:
      - averageOccupancyRate: number
      - averageDailyRate: number
      - seasonalMultipliers: object with seasons as keys
      - maintenanceStandards: array of key standards
      - competitorCount: estimated number
      `;

      const benchmarks = await openAIService.generateText({
        prompt: benchmarkPrompt,
        temperature: 0.3,
      });

      return {
        available: true,
        location,
        propertyType,
        insights,
        benchmarks: JSON.parse(benchmarks),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Market benchmark error:", error);
      return {
        available: false,
        error: "Failed to generate market benchmarks",
      };
    }
  }

  private extractPhotoUrls(items: Array<{ photos?: string[] }>): string[] {
    return items
      .flatMap((item) => item.photos || [])
      .filter((url) => url && url.startsWith("http"));
  }

  private getDefaultValidationResult(): ValidationResult {
    return {
      isValid: true,
      score: 100,
      issues: [],
      recommendations: [],
      aiInsights: {
        enabled: false,
        message: "AI validation is disabled",
      },
    };
  }
}

export const aiValidationService = new AIValidationService();