/**
 * AI Performance Overview Component
 * Displays high-level AI metrics, performance trends, and health indicators
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, DollarSign, Clock, Target, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PerformanceMetrics {
  totalRequests: number;
  totalCost: number;
  avgResponseTime: number;
  avgAccuracy: number;
  costEfficiency: number;
  healthScore: number;
}

interface PerformanceTrends {
  responseTimeTrend: number[];
  accuracyTrend: number[];
  costTrend: number[];
  throughput: number;
  errorRate: number;
  cacheHitRate: number;
}

interface AIPerformanceOverviewProps {
  overview: PerformanceMetrics;
  performance: PerformanceTrends;
  isLoading?: boolean;
}

export const AIPerformanceOverview: React.FC<AIPerformanceOverviewProps> = ({
  overview,
  performance,
  isLoading = false
}) => {
  const getStatusColor = (value: number, good: number, warning: number) => {
    if (value >= good) return 'text-green-600 bg-green-100';
    if (value >= warning) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous * 1.05) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (current < previous * 0.95) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-blue-500" />;
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.healthScore}/100</div>
            <div className="flex items-center mt-2">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                overview.healthScore >= 90 ? 'bg-green-500' :
                overview.healthScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-xs text-muted-foreground">
                {overview.healthScore >= 90 ? 'Excellent' :
                 overview.healthScore >= 70 ? 'Good' : 'Needs Attention'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalRequests.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              {getTrendIcon(overview.totalRequests, overview.totalRequests * 0.9)}
              <span className="text-xs text-muted-foreground ml-2">
                Throughput: {performance.throughput}/min
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overview.totalCost.toFixed(2)}</div>
            <div className="flex items-center mt-2">
              <Badge className={getStatusColor(overview.costEfficiency, 80, 60)}>
                {overview.costEfficiency}% efficient
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.avgAccuracy.toFixed(1)}%</div>
            <Progress value={overview.avgAccuracy} className="mt-2" />
            <span className="text-xs text-muted-foreground">
              Target: >90%
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Response Time & Accuracy
            </CardTitle>
            <CardDescription>
              Average response time and accuracy trends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Response Time</span>
                <span>{overview.avgResponseTime.toFixed(0)}ms</span>
              </div>
              <Progress value={Math.min(100, (3000 - overview.avgResponseTime) / 30)} className="h-2" />
              <span className="text-xs text-muted-foreground">
                Target: &lt;2000ms
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Accuracy</span>
                <span>{overview.avgAccuracy.toFixed(1)}%</span>
              </div>
              <Progress value={overview.avgAccuracy} className="h-2" />
              <span className="text-xs text-muted-foreground">
                Target: &gt;90%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              System Performance
            </CardTitle>
            <CardDescription>
              Error rates and cache efficiency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Error Rate</span>
                <span className={performance.errorRate > 5 ? 'text-red-600' : 'text-green-600'}>
                  {performance.errorRate.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={100 - performance.errorRate} 
                className="h-2"
              />
              <span className="text-xs text-muted-foreground">
                Target: &lt;2%
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cache Hit Rate</span>
                <span className="text-green-600">{performance.cacheHitRate.toFixed(1)}%</span>
              </div>
              <Progress value={performance.cacheHitRate} className="h-2" />
              <span className="text-xs text-muted-foreground">
                Target: &gt;80%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};