/**
 * AI Proxy Service - Secure server-side AI integration
 * Replaces direct OpenAI client calls with secure backend proxy
 */

import { supabase } from '@/integrations/supabase/client';

export interface AIAnalysisRequest {
  imageBase64: string;
  prompt: string;
  inspectionId: string;
  checklistItemId: string;
  maxTokens?: number;
}

export interface AIAnalysisResponse {
  analysis: {
    status: 'pass' | 'fail' | 'needs_review';
    confidence: number;
    reasoning: string;
    issues?: string[];
    recommendations?: string[];
  };
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  metadata: {
    model: string;
    timestamp: string;
    processingTimeMs: number;
  };
}

export interface AIError {
  code: string;
  message: string;
  details?: any;
}

class AIProxyService {
  private static instance: AIProxyService;
  private rateLimitCache = new Map<string, { count: number; resetTime: number }>();
  private readonly MAX_REQUESTS_PER_MINUTE = 30;
  private readonly MAX_REQUESTS_PER_HOUR = 500;

  private constructor() {}

  static getInstance(): AIProxyService {
    if (!AIProxyService.instance) {
      AIProxyService.instance = new AIProxyService();
    }
    return AIProxyService.instance;
  }

  /**
   * Analyze inspection photo using secure backend AI proxy
   */
  async analyzeInspectionPhoto(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    this.validateRequest(request);
    await this.checkRateLimit();

    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          imageBase64: request.imageBase64,
          prompt: this.sanitizePrompt(request.prompt),
          inspectionId: request.inspectionId,
          checklistItemId: request.checklistItemId,
          maxTokens: Math.min(request.maxTokens || 500, 1000), // Cap tokens
        },
      });

      if (error) {
        throw new Error(`AI analysis failed: ${error.message}`);
      }

      // Validate response structure
      if (!this.isValidResponse(data)) {
        throw new Error('Invalid AI response format');
      }

      // Log usage for monitoring
      await this.logUsage(request, data);

      return data;
    } catch (error) {
      console.error('AI analysis error:', error);
      throw this.handleAIError(error);
    }
  }

  /**
   * Generate dynamic checklist using secure backend
   */
  async generateDynamicChecklist(propertyData: any, inspectionType: string): Promise<any> {
    this.validatePropertyData(propertyData);
    await this.checkRateLimit();

    try {
      const { data, error } = await supabase.functions.invoke('ai-checklist-generation', {
        body: {
          propertyData: this.sanitizePropertyData(propertyData),
          inspectionType,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) {
        throw new Error(`Checklist generation failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Checklist generation error:', error);
      throw this.handleAIError(error);
    }
  }

  /**
   * Get AI service status and health
   */
  async getServiceStatus(): Promise<{
    available: boolean;
    rateLimitRemaining: number;
    lastUpdate: string;
    models: string[];
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-status');
      
      if (error) {
        return {
          available: false,
          rateLimitRemaining: 0,
          lastUpdate: new Date().toISOString(),
          models: [],
        };
      }

      return data;
    } catch (error) {
      console.error('AI status check failed:', error);
      return {
        available: false,
        rateLimitRemaining: 0,
        lastUpdate: new Date().toISOString(),
        models: [],
      };
    }
  }

  // Private helper methods

  private validateRequest(request: AIAnalysisRequest): void {
    if (!request.imageBase64 || !request.prompt) {
      throw new Error('Missing required fields: imageBase64 and prompt');
    }

    if (!request.inspectionId || !request.checklistItemId) {
      throw new Error('Missing required inspection context');
    }

    // Validate base64 image
    if (!this.isValidBase64Image(request.imageBase64)) {
      throw new Error('Invalid image format');
    }

    // Validate prompt length
    if (request.prompt.length > 2000) {
      throw new Error('Prompt too long (max 2000 characters)');
    }
  }

  private validatePropertyData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid property data');
    }
  }

  private sanitizePrompt(prompt: string): string {
    // Remove potentially dangerous content
    return prompt
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
      .substring(0, 2000);
  }

  private sanitizePropertyData(data: any): any {
    // Deep clone and sanitize property data
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Remove any potentially sensitive fields
    delete sanitized.internalNotes;
    delete sanitized.ownerPrivateInfo;
    delete sanitized.financialData;
    
    return sanitized;
  }

  private isValidBase64Image(base64: string): boolean {
    try {
      // Check if it's valid base64
      const decoded = atob(base64.split(',')[1] || base64);
      
      // Check if it starts with image headers
      const uint8Array = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        uint8Array[i] = decoded.charCodeAt(i);
      }
      
      // Check for common image signatures
      const signatures = [
        [0xFF, 0xD8, 0xFF], // JPEG
        [0x89, 0x50, 0x4E, 0x47], // PNG
        [0x47, 0x49, 0x46], // GIF
        [0x52, 0x49, 0x46, 0x46], // WebP
      ];
      
      return signatures.some(sig => 
        sig.every((byte, index) => uint8Array[index] === byte)
      );
    } catch {
      return false;
    }
  }

  private isValidResponse(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      data.analysis &&
      typeof data.analysis.status === 'string' &&
      typeof data.analysis.confidence === 'number' &&
      typeof data.analysis.reasoning === 'string' &&
      data.usage &&
      data.metadata
    );
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const minuteKey = Math.floor(now / 60000);
    const hourKey = Math.floor(now / 3600000);

    // Check minute limit
    const minuteData = this.rateLimitCache.get(`minute_${minuteKey}`);
    if (minuteData && minuteData.count >= this.MAX_REQUESTS_PER_MINUTE) {
      throw new Error('Rate limit exceeded: too many requests per minute');
    }

    // Check hour limit
    const hourData = this.rateLimitCache.get(`hour_${hourKey}`);
    if (hourData && hourData.count >= this.MAX_REQUESTS_PER_HOUR) {
      throw new Error('Rate limit exceeded: too many requests per hour');
    }

    // Update counters
    this.rateLimitCache.set(`minute_${minuteKey}`, {
      count: (minuteData?.count || 0) + 1,
      resetTime: (minuteKey + 1) * 60000,
    });

    this.rateLimitCache.set(`hour_${hourKey}`, {
      count: (hourData?.count || 0) + 1,
      resetTime: (hourKey + 1) * 3600000,
    });

    // Cleanup old entries
    this.cleanupRateLimit(now);
  }

  private cleanupRateLimit(now: number): void {
    for (const [key, data] of this.rateLimitCache.entries()) {
      if (data.resetTime < now) {
        this.rateLimitCache.delete(key);
      }
    }
  }

  private async logUsage(request: AIAnalysisRequest, response: AIAnalysisResponse): Promise<void> {
    try {
      await supabase.from('ai_usage_log').insert({
        inspection_id: request.inspectionId,
        checklist_item_id: request.checklistItemId,
        prompt_tokens: response.usage.promptTokens,
        completion_tokens: response.usage.completionTokens,
        total_tokens: response.usage.totalTokens,
        cost: response.usage.cost,
        model: response.metadata.model,
        processing_time_ms: response.metadata.processingTimeMs,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log AI usage:', error);
      // Don't throw - logging failure shouldn't break the main flow
    }
  }

  private handleAIError(error: any): AIError {
    if (error.message?.includes('rate limit')) {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'AI service temporarily unavailable due to rate limiting. Please try again in a few minutes.',
        details: { retryAfter: 60 },
      };
    }

    if (error.message?.includes('invalid')) {
      return {
        code: 'INVALID_REQUEST',
        message: 'Invalid request format. Please check your input and try again.',
        details: error,
      };
    }

    return {
      code: 'AI_SERVICE_ERROR',
      message: 'AI analysis temporarily unavailable. Please try again later.',
      details: error,
    };
  }
}

export const aiProxyService = AIProxyService.getInstance();
export default aiProxyService;