/**
 * OpenAI Usage Optimization Utilities
 * Cost-effective prompt engineering and token management
 */

import type { InspectionData, PropertyData } from './types/openai.types';

/**
 * Token estimation utilities
 */
export const TokenEstimator = {
  // Rough estimation: 1 token ≈ 4 characters
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  },

  // GPT-4o-mini pricing (as of 2024)
  calculateCost(inputTokens: number, outputTokens: number): {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  } {
    const INPUT_COST_PER_1K = 0.00015; // $0.00015 per 1K tokens
    const OUTPUT_COST_PER_1K = 0.0006; // $0.0006 per 1K tokens
    
    const inputCost = (inputTokens / 1000) * INPUT_COST_PER_1K;
    const outputCost = (outputTokens / 1000) * OUTPUT_COST_PER_1K;
    
    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost
    };
  }
};

/**
 * Optimized prompt templates
 */
export const OptimizedPrompts = {
  /**
   * Concise inspection validation prompt
   */
  inspectionValidation: (data: {
    propertyType: string;
    itemsPassed: number;
    itemsFailed: number;
    criticalIssues: string[];
  }) => `
Analyze inspection:
- Type: ${data.propertyType}
- Pass/Fail: ${data.itemsPassed}/${data.itemsFailed}
- Critical: ${data.criticalIssues.join(', ') || 'None'}

Return JSON:
{
  "score": 1-100,
  "valid": boolean,
  "topIssues": ["max 3 issues"],
  "actions": ["max 3 actions"]
}`,

  /**
   * Efficient property condition assessment
   */
  propertyCondition: (data: {
    propertyType: string;
    age?: number;
    lastMaintenance?: string;
    reportedIssues: string[];
  }) => `
Property: ${data.propertyType}${data.age ? `, ${data.age}yrs` : ''}
Last maintenance: ${data.lastMaintenance || 'Unknown'}
Issues: ${data.reportedIssues.slice(0, 5).join('; ')}

Score (1-10) for: Structure, Interior, Exterior, Systems
List top 3 maintenance priorities`,

  /**
   * Streamlined photo analysis
   */
  photoAnalysis: (photoContext: {
    room: string;
    focus: string[];
  }) => `
Room: ${photoContext.room}
Check: ${photoContext.focus.join(', ')}

Identify:
1. Maintenance needs (critical only)
2. Safety issues
3. Guest impact (1-5)`,

  /**
   * Compact market insights
   */
  marketInsights: (location: string, propertyType: string) => `
${location} - ${propertyType}
Provide:
- Occupancy rate
- ADR range
- Top 3 market factors
- Investment score (1-10)`,

  /**
   * Batch inspection summary
   */
  batchSummary: (inspectionIds: string[], keyMetrics: Record<string, any>) => `
Summarize ${inspectionIds.length} inspections:
Metrics: ${JSON.stringify(keyMetrics, null, 0)}

Provide:
- Overall health score
- Common issues (max 3)
- Urgent actions (max 3)`
};

/**
 * Data compression utilities
 */
export const DataCompression = {
  /**
   * Extract only essential inspection data
   */
  compressInspectionData(inspection: InspectionData): Record<string, any> {
    const failedItems = inspection.items.filter(i => i.status === 'FAIL');
    const criticalItems = failedItems.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
    
    return {
      id: inspection.id,
      status: inspection.status,
      score: inspection.score,
      totalItems: inspection.items.length,
      failedCount: failedItems.length,
      criticalIssues: criticalItems.map(i => `${i.category}: ${i.name}`),
      categories: this.summarizeByCategory(inspection.items)
    };
  },

  /**
   * Summarize items by category
   */
  summarizeByCategory(items: InspectionData['items']): Record<string, any> {
    const summary: Record<string, any> = {};
    
    items.forEach(item => {
      if (!summary[item.category]) {
        summary[item.category] = { pass: 0, fail: 0, issues: [] };
      }
      
      if (item.status === 'PASS') {
        summary[item.category].pass++;
      } else if (item.status === 'FAIL') {
        summary[item.category].fail++;
        if (item.severity === 'HIGH' || item.severity === 'CRITICAL') {
          summary[item.category].issues.push(item.name);
        }
      }
    });
    
    return summary;
  },

  /**
   * Compress property data to essentials
   */
  compressPropertyData(property: PropertyData): string {
    return `${property.propertyType} ${property.bedrooms}BR/${property.bathrooms}BA in ${property.city}, ${property.state}`;
  }
};

/**
 * Response parsing utilities
 */
export const ResponseParser = {
  /**
   * Extract structured data from free-form response
   */
  extractStructuredData(response: string, format: 'json' | 'list' | 'score'): any {
    try {
      if (format === 'json') {
        // Try to find JSON in the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } else if (format === 'list') {
        // Extract numbered or bulleted lists
        const listItems = response.match(/(?:^|\n)\s*(?:\d+\.|[-•*])\s*(.+)/gm);
        return listItems?.map(item => item.replace(/^[\s\d.-•*]+/, '').trim()) || [];
      } else if (format === 'score') {
        // Extract numeric score
        const scoreMatch = response.match(/\b(\d+(?:\.\d+)?)\s*(?:\/\s*10|out of 10|%)?/i);
        return scoreMatch ? parseFloat(scoreMatch[1]) : null;
      }
    } catch (error) {
      console.error('Failed to parse response:', error);
    }
    return null;
  },

  /**
   * Ensure response fits within token limit
   */
  truncateResponse(response: string, maxTokens: number): string {
    const estimatedTokens = TokenEstimator.estimateTokens(response);
    if (estimatedTokens <= maxTokens) {
      return response;
    }
    
    // Truncate to fit within limit
    const targetLength = Math.floor((maxTokens * 4) * 0.9); // 90% to be safe
    return response.substring(0, targetLength) + '...';
  }
};

/**
 * Batch processing optimization
 */
export const BatchOptimizer = {
  /**
   * Group similar requests for batch processing
   */
  groupRequests<T extends { category?: string; type?: string }>(
    requests: T[]
  ): Map<string, T[]> {
    const groups = new Map<string, T[]>();
    
    requests.forEach(request => {
      const key = `${request.category || 'default'}_${request.type || 'default'}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(request);
    });
    
    return groups;
  },

  /**
   * Create consolidated prompt for multiple items
   */
  createBatchPrompt(items: any[], template: (item: any) => string): string {
    return items
      .slice(0, 5) // Limit batch size
      .map((item, index) => `[${index + 1}] ${template(item)}`)
      .join('\n\n');
  }
};

/**
 * Cost-effective strategies
 */
export const CostStrategies = {
  /**
   * Determine if full analysis is needed
   */
  requiresFullAnalysis(inspection: InspectionData): boolean {
    const failureRate = inspection.items.filter(i => i.status === 'FAIL').length / inspection.items.length;
    const hasCriticalIssues = inspection.items.some(i => i.severity === 'CRITICAL');
    const isRecent = inspection.completedAt && 
      (Date.now() - new Date(inspection.completedAt).getTime()) < 24 * 60 * 60 * 1000;
    
    return failureRate > 0.2 || hasCriticalIssues || !isRecent;
  },

  /**
   * Choose appropriate model based on task
   */
  selectModel(task: 'simple' | 'complex' | 'vision'): string {
    switch (task) {
      case 'simple':
        return 'gpt-3.5-turbo'; // Cheaper for simple tasks
      case 'complex':
        return 'gpt-4'; // Better reasoning
      case 'vision':
        return 'gpt-4-vision-preview'; // Vision capabilities
      default:
        return 'gpt-4';
    }
  },

  /**
   * Cache-friendly prompt generation
   */
  generateCacheKey(type: string, params: Record<string, any>): string {
    // Remove variable data like timestamps
    const stableParams = Object.entries(params)
      .filter(([key]) => !['timestamp', 'id', 'createdAt', 'updatedAt'].includes(key))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
      .join('|');
    
    return `${type}:${stableParams}`;
  }
};

/**
 * Example usage
 */
export function exampleOptimizedValidation(inspection: InspectionData): string {
  // Compress data first
  const compressed = DataCompression.compressInspectionData(inspection);
  
  // Use optimized prompt
  const prompt = OptimizedPrompts.inspectionValidation({
    propertyType: 'Condo', // Would come from property data
    itemsPassed: compressed.totalItems - compressed.failedCount,
    itemsFailed: compressed.failedCount,
    criticalIssues: compressed.criticalIssues
  });
  
  // Estimate cost
  const inputTokens = TokenEstimator.estimateTokens(prompt);
  const estimatedOutputTokens = 150; // Expected response size
  const cost = TokenEstimator.calculateCost(inputTokens, estimatedOutputTokens);
  
  console.log(`Estimated cost: $${cost.totalCost.toFixed(4)}`);
  
  return prompt;
}