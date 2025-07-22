/**
 * @fileoverview AI Performance Dashboard - Clean Orchestrator
 * Coordinates AI monitoring components using enterprise orchestrator pattern
 * ENTERPRISE GRADE: Clean delegation with focused AI analytics composition
 * 
 * @author STR Certified Engineering Team
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import OfflineIndicator from '@/components/ui/OfflineIndicator';

// Import focused components
import { AIMetricsOverview } from './ai/AIMetricsOverview';
import { AICostAnalytics } from './ai/AICostAnalytics';

// Mock AI service - replace with actual service
class AIPerformanceService {
  static async getMetrics() {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      accuracyScore: 92,
      confidenceScore: 87,
      processingTime: 245,
      totalInferences: 125630,
      successRate: 98.5,
      errorRate: 1.5,
      modelHealth: 'excellent' as const,
      lastUpdated: new Date().toISOString(),
      trends: {
        accuracyTrend: 2.3,
        performanceTrend: -5.1,
        volumeTrend: 15.7
      },
      realTimeMetrics: {
        requestsPerMinute: 45,
        averageLatency: 180,
        activeConnections: 23,
        memoryUsage: 68,
        cpuUsage: 42
      }
    };
  }

  static async getCostMetrics() {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      currentMonthCost: 2847.50,
      previousMonthCost: 2456.20,
      monthlyBudget: 3500.00,
      projectedMonthlyCost: 3200.00,
      costPerInference: 0.0226,
      dailyAverage: 94.92,
      costBreakdown: {
        gpt4Vision: 1420.30,
        gpt4Text: 890.40,
        embeddings: 234.60,
        imageProcessing: 180.20,
        other: 122.00
      },
      dailyCosts: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
        cost: 80 + Math.random() * 40,
        inferences: 3000 + Math.random() * 2000
      })),
      costOptimizations: [
        {
          suggestion: 'Implement response caching for similar inspection queries',
          potentialSavings: 340.50,
          implementation: 'easy' as const
        },
        {
          suggestion: 'Optimize image resolution for AI analysis to reduce processing costs',
          potentialSavings: 225.80,
          implementation: 'medium' as const
        },
        {
          suggestion: 'Batch similar requests to improve efficiency',
          potentialSavings: 180.20,
          implementation: 'hard' as const
        }
      ],
      budgetAlerts: [
        {
          type: 'warning' as const,
          message: 'Current spending is projected to exceed 90% of monthly budget',
          threshold: 90
        }
      ]
    };
  }
}

export default function AIPerformanceDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('metrics');
  const [costTimeRange, setCostTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isOffline, setIsOffline] = useState(false);

  // Data Queries
  const { data: aiMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['ai_metrics'],
    queryFn: AIPerformanceService.getMetrics,
    refetchInterval: 30000, // Refresh every 30 seconds
    onError: (error) => {
      logger.error('Failed to fetch AI metrics', error, 'AI_PERFORMANCE_DASHBOARD');
      setIsOffline(true);
    },
    onSuccess: () => {
      setIsOffline(false);
    }
  });

  const { data: costMetrics, isLoading: isLoadingCosts } = useQuery({
    queryKey: ['ai_cost_metrics', costTimeRange],
    queryFn: AIPerformanceService.getCostMetrics,
    refetchInterval: 300000, // Refresh every 5 minutes
    onError: (error) => {
      logger.error('Failed to fetch cost metrics', error, 'AI_PERFORMANCE_DASHBOARD');
    }
  });

  // Event Handlers
  const handleTimeRangeChange = (range: '7d' | '30d' | '90d') => {
    setCostTimeRange(range);
    logger.info('Cost time range changed', { range }, 'AI_PERFORMANCE_DASHBOARD');
  };

  const handleExportData = () => {
    // Implement data export functionality
    logger.info('AI cost data export requested', { timeRange: costTimeRange }, 'AI_PERFORMANCE_DASHBOARD');
    
    // Mock export - replace with actual implementation
    const data = {
      metrics: aiMetrics,
      costs: costMetrics,
      exportedAt: new Date().toISOString(),
      timeRange: costTimeRange
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-performance-data-${costTimeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Performance Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Monitor AI system performance, costs, and optimization opportunities
              </p>
            </div>
            <OfflineIndicator isOnline={!isOffline} />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
            <TabsTrigger value="costs">Cost Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <AIMetricsOverview
              metrics={aiMetrics}
              isLoading={isLoadingMetrics}
              isOffline={isOffline}
            />
          </TabsContent>

          <TabsContent value="costs">
            <AICostAnalytics
              metrics={costMetrics}
              isLoading={isLoadingCosts}
              timeRange={costTimeRange}
              onTimeRangeChange={handleTimeRangeChange}
              onExportData={handleExportData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}