/**
 * OpenAI Cost Tracking Service
 * Monitor and report API usage costs
 */

import { TokenEstimator } from './openai-optimization';

interface UsageRecord {
  timestamp: Date;
  operation: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  userId?: string;
  cached: boolean;
}

interface CostReport {
  totalCost: number;
  totalRequests: number;
  totalTokens: number;
  averageCostPerRequest: number;
  costByOperation: Record<string, number>;
  costByModel: Record<string, number>;
  savingsFromCache: number;
}

class OpenAICostTracker {
  private usage: UsageRecord[] = [];
  private readonly MAX_RECORDS = 10000;
  
  // Model pricing (as of 2024)
  private readonly PRICING = {
    'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
    'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
    'gpt-4-vision-preview': { input: 0.03, output: 0.06 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  };

  /**
   * Track API usage
   */
  trackUsage(params: {
    operation: string;
    model: string;
    prompt: string;
    response: string;
    userId?: string;
    cached?: boolean;
  }): UsageRecord {
    const inputTokens = TokenEstimator.estimateTokens(params.prompt);
    const outputTokens = TokenEstimator.estimateTokens(params.response);
    
    const pricing = this.PRICING[params.model as keyof typeof this.PRICING] || this.PRICING['gpt-4'];
    const cost = (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
    
    const record: UsageRecord = {
      timestamp: new Date(),
      operation: params.operation,
      model: params.model,
      inputTokens,
      outputTokens,
      cost: params.cached ? 0 : cost, // Cached requests cost nothing
      userId: params.userId,
      cached: params.cached || false
    };
    
    this.usage.push(record);
    
    // Maintain size limit
    if (this.usage.length > this.MAX_RECORDS) {
      this.usage = this.usage.slice(-this.MAX_RECORDS);
    }
    
    return record;
  }

  /**
   * Get cost report for a time period
   */
  getCostReport(since?: Date, userId?: string): CostReport {
    const filteredUsage = this.usage.filter(record => {
      const matchesTime = !since || record.timestamp >= since;
      const matchesUser = !userId || record.userId === userId;
      return matchesTime && matchesUser;
    });
    
    const totalCost = filteredUsage.reduce((sum, record) => sum + record.cost, 0);
    const totalRequests = filteredUsage.length;
    const totalTokens = filteredUsage.reduce(
      (sum, record) => sum + record.inputTokens + record.outputTokens, 
      0
    );
    
    // Calculate savings from cache
    const cachedRequests = filteredUsage.filter(r => r.cached);
    const estimatedCachedCost = cachedRequests.reduce((sum, record) => {
      const pricing = this.PRICING[record.model as keyof typeof this.PRICING] || this.PRICING['gpt-4'];
      return sum + (record.inputTokens / 1000) * pricing.input + 
                   (record.outputTokens / 1000) * pricing.output;
    }, 0);
    
    // Group by operation
    const costByOperation: Record<string, number> = {};
    filteredUsage.forEach(record => {
      costByOperation[record.operation] = (costByOperation[record.operation] || 0) + record.cost;
    });
    
    // Group by model
    const costByModel: Record<string, number> = {};
    filteredUsage.forEach(record => {
      costByModel[record.model] = (costByModel[record.model] || 0) + record.cost;
    });
    
    return {
      totalCost,
      totalRequests,
      totalTokens,
      averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      costByOperation,
      costByModel,
      savingsFromCache: estimatedCachedCost
    };
  }

  /**
   * Get detailed usage logs
   */
  getUsageLogs(options?: {
    limit?: number;
    offset?: number;
    operation?: string;
    userId?: string;
    since?: Date;
  }): UsageRecord[] {
    let logs = [...this.usage];
    
    if (options?.since) {
      logs = logs.filter(r => r.timestamp >= options.since!);
    }
    
    if (options?.operation) {
      logs = logs.filter(r => r.operation === options.operation);
    }
    
    if (options?.userId) {
      logs = logs.filter(r => r.userId === options.userId);
    }
    
    // Sort by timestamp descending
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const offset = options?.offset || 0;
    const limit = options?.limit || 100;
    
    return logs.slice(offset, offset + limit);
  }

  /**
   * Get cost forecast based on usage patterns
   */
  getForecast(daysAhead: number = 30): {
    estimatedCost: number;
    estimatedRequests: number;
    recommendations: string[];
  } {
    // Get usage from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsage = this.usage.filter(r => r.timestamp >= sevenDaysAgo);
    
    if (recentUsage.length === 0) {
      return {
        estimatedCost: 0,
        estimatedRequests: 0,
        recommendations: ['Not enough data for forecast']
      };
    }
    
    const dailyAvgCost = recentUsage.reduce((sum, r) => sum + r.cost, 0) / 7;
    const dailyAvgRequests = recentUsage.length / 7;
    
    const estimatedCost = dailyAvgCost * daysAhead;
    const estimatedRequests = Math.round(dailyAvgRequests * daysAhead);
    
    const recommendations: string[] = [];
    
    // Cost optimization recommendations
    const costByModel = this.getCostReport(sevenDaysAgo).costByModel;
    const gpt4Usage = costByModel['gpt-4'] || 0;
    const gpt35Usage = costByModel['gpt-3.5-turbo'] || 0;
    
    if (gpt4Usage > gpt35Usage * 2) {
      recommendations.push('Consider using GPT-3.5-Turbo for simple tasks to reduce costs');
    }
    
    const cacheReport = this.getCostReport(sevenDaysAgo);
    const cacheRate = cacheReport.totalRequests > 0 
      ? (cacheReport.savingsFromCache / (cacheReport.totalCost + cacheReport.savingsFromCache)) 
      : 0;
    
    if (cacheRate < 0.3) {
      recommendations.push('Increase cache utilization to reduce API calls');
    }
    
    if (dailyAvgCost > 10) {
      recommendations.push('High daily costs detected. Review prompt optimization strategies');
    }
    
    return {
      estimatedCost,
      estimatedRequests,
      recommendations
    };
  }

  /**
   * Export usage data for analysis
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.usage, null, 2);
    }
    
    // CSV format
    const headers = ['timestamp', 'operation', 'model', 'inputTokens', 'outputTokens', 'cost', 'userId', 'cached'];
    const rows = this.usage.map(record => [
      record.timestamp.toISOString(),
      record.operation,
      record.model,
      record.inputTokens,
      record.outputTokens,
      record.cost.toFixed(6),
      record.userId || '',
      record.cached
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\\n');
  }

  /**
   * Clear old records
   */
  cleanup(olderThan: Date) {
    this.usage = this.usage.filter(record => record.timestamp >= olderThan);
  }
}

// Singleton instance
export const costTracker = new OpenAICostTracker();

// Helper function to track costs in OpenAI service
export function trackApiCall(
  operation: string,
  model: string,
  prompt: string,
  response: string,
  userId?: string,
  cached: boolean = false
) {
  return costTracker.trackUsage({
    operation,
    model,
    prompt,
    response,
    userId,
    cached
  });
}

// Example dashboard data generator
export function generateCostDashboard(userId?: string): {
  today: CostReport;
  week: CostReport;
  month: CostReport;
  forecast: ReturnType<OpenAICostTracker['getForecast']>;
} {
  const now = new Date();
  
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  
  return {
    today: costTracker.getCostReport(today, userId),
    week: costTracker.getCostReport(weekAgo, userId),
    month: costTracker.getCostReport(monthAgo, userId),
    forecast: costTracker.getForecast(30)
  };
}