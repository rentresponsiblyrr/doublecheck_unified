import { supabase } from "../supabase";

/**
 * Claude AI Client Service
 *
 * Provides client-side integration with Claude AI through Supabase Edge Functions
 * for the STR Certified platform.
 */

export interface ClaudeAnalysisRequest {
  imageBase64?: string;
  prompt: string;
  inspectionId?: string;
  checklistItemId?: string;
  context?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
  analysisType: "photo" | "text" | "code";
}

export interface ClaudeAnalysisResponse {
  analysis?: {
    status: "pass" | "fail" | "needs_review";
    confidence: number;
    reasoning: string;
    issues: string[];
    recommendations: string[];
  };
  content?: string;
  review?: {
    score: number;
    issues: Array<{
      severity: "critical" | "high" | "medium" | "low";
      category:
        | "security"
        | "performance"
        | "maintainability"
        | "accessibility"
        | "type-safety";
      description: string;
      line?: number;
      suggestion?: string;
    }>;
    suggestions: string[];
    summary: string;
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  };
  metadata: {
    model: string;
    processingTime: number;
    timestamp: string;
  };
}

export class ClaudeClient {
  private rateLimiter: Map<string, { count: number; resetTime: number }>;

  constructor() {
    this.rateLimiter = new Map();
  }

  /**
   * Analyze inspection photo using Claude Vision
   */
  async analyzeInspectionPhoto(
    request: Omit<ClaudeAnalysisRequest, "analysisType">,
  ): Promise<ClaudeAnalysisResponse> {
    await this.checkRateLimit("photo-analysis");

    const { data, error } = await supabase.functions.invoke("claude-analysis", {
      body: {
        ...request,
        analysisType: "photo" as const,
      },
    });

    if (error) {
      throw new Error(
        `Claude photo analysis failed: ${error.message || "Unknown error"}`,
      );
    }

    return data as ClaudeAnalysisResponse;
  }

  /**
   * Generate text using Claude
   */
  async generateText(
    request: Omit<ClaudeAnalysisRequest, "analysisType">,
  ): Promise<ClaudeAnalysisResponse> {
    await this.checkRateLimit("text-generation");

    const { data, error } = await supabase.functions.invoke("claude-analysis", {
      body: {
        ...request,
        analysisType: "text" as const,
      },
    });

    if (error) {
      throw new Error(
        `Claude text generation failed: ${error.message || "Unknown error"}`,
      );
    }

    return data as ClaudeAnalysisResponse;
  }

  /**
   * Perform code review using Claude
   */
  async reviewCode(
    request: Omit<ClaudeAnalysisRequest, "analysisType">,
  ): Promise<ClaudeAnalysisResponse> {
    await this.checkRateLimit("code-review");

    const { data, error } = await supabase.functions.invoke("claude-analysis", {
      body: {
        ...request,
        analysisType: "code" as const,
      },
    });

    if (error) {
      throw new Error(
        `Claude code review failed: ${error.message || "Unknown error"}`,
      );
    }

    return data as ClaudeAnalysisResponse;
  }

  /**
   * Check rate limits for different operation types
   */
  private async checkRateLimit(operationType: string): Promise<void> {
    const now = Date.now();
    const window = 60000; // 1 minute window
    const limits = {
      "photo-analysis": 20,
      "text-generation": 50,
      "code-review": 10,
    };

    const limit = limits[operationType as keyof typeof limits] || 30;
    const key = `${operationType}:${Math.floor(now / window)}`;

    const current = this.rateLimiter.get(key) || {
      count: 0,
      resetTime: now + window,
    };

    if (current.count >= limit) {
      throw new Error(
        `Rate limit exceeded for ${operationType}. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds.`,
      );
    }

    current.count++;
    this.rateLimiter.set(key, current);

    // Clean up old entries
    for (const [oldKey] of this.rateLimiter) {
      if (
        oldKey.includes(":") &&
        parseInt(oldKey.split(":")[1]) < Math.floor(now / window)
      ) {
        this.rateLimiter.delete(oldKey);
      }
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    available: boolean;
    model: string;
    rateLimitRemaining: number;
    lastUpdate: string;
  }> {
    try {
      // Test with a simple request
      const { data, error } = await supabase.functions.invoke(
        "claude-analysis",
        {
          body: {
            prompt: "test",
            analysisType: "text" as const,
          },
        },
      );

      return {
        available: !error,
        model: "claude-3-5-sonnet-20241022",
        rateLimitRemaining: 50, // Approximate
        lastUpdate: new Date().toISOString(),
      };
    } catch (error) {
      return {
        available: false,
        model: "claude-3-5-sonnet-20241022",
        rateLimitRemaining: 0,
        lastUpdate: new Date().toISOString(),
      };
    }
  }
}

/**
 * Factory function to create Claude client instance
 */
export function createClaudeClient(): ClaudeClient {
  return new ClaudeClient();
}

/**
 * Utility function to convert file to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Utility function to validate image file
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please select a JPEG, PNG, or WebP image.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File too large. Please select an image smaller than 10MB.",
    };
  }

  return { valid: true };
}
