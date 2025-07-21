/**
 * AI Model Performance Component
 * Model performance metrics, comparison, and versioning analysis
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3,
  LineChart,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Zap,
  Award,
  Activity
} from 'lucide-react';
import type { ModelPerformanceMetrics } from '@/types/ai-database';

interface ModelComparisonData {
  version: string;
  accuracy: number;
  confidence: number;
  processingSpeed: number;
  deployedAt: string;
  feedbackCount: number;
}

interface AIModelPerformanceProps {
  modelPerformance: ModelPerformanceMetrics | null;
  modelComparison: ModelComparisonData[];
  selectedTimeframe: 'daily' | 'weekly' | 'monthly';
  isRefreshing: boolean;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const AIModelPerformance: React.FC<AIModelPerformanceProps> = ({
  modelPerformance,
  modelComparison,
  selectedTimeframe,
  isRefreshing,
  onRefresh,
  isLoading = false
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'speed' | 'confidence'>('accuracy');

  const getPerformanceStatus = (value: number, type: 'accuracy' | 'speed' | 'confidence') => {
    switch (type) {
      case 'accuracy':
        if (value >= 0.9) return 'excellent';
        if (value >= 0.7) return 'good';
        return 'needs-improvement';
      case 'speed':
        if (value <= 1000) return 'excellent';
        if (value <= 2000) return 'good';
        return 'needs-improvement';
      case 'confidence':
        if (value >= 0.85) return 'excellent';
        if (value >= 0.7) return 'good';
        return 'needs-improvement';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!modelPerformance) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Model Performance Data</CardTitle>
            <CardDescription>
              Performance metrics will appear here once AI processing begins
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-muted-foreground">No performance data available yet</p>
            <Button onClick={onRefresh} disabled={isRefreshing} className="mt-4">
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Check for Data
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((modelPerformance.accuracy || 0) * 100).toFixed(1)}%
            </div>
            <Badge className={getStatusColor(getPerformanceStatus(modelPerformance.accuracy || 0, 'accuracy'))}>
              {getPerformanceStatus(modelPerformance.accuracy || 0, 'accuracy')}
            </Badge>
            <Progress value={(modelPerformance.accuracy || 0) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(modelPerformance.avgResponseTime || 0).toFixed(0)}ms
            </div>
            <Badge className={getStatusColor(getPerformanceStatus(modelPerformance.avgResponseTime || 0, 'speed'))}>
              {getPerformanceStatus(modelPerformance.avgResponseTime || 0, 'speed')}
            </Badge>
            <Progress 
              value={Math.min(100, (3000 - (modelPerformance.avgResponseTime || 3000)) / 30)} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidence Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((modelPerformance.confidence || 0) * 100).toFixed(1)}%
            </div>
            <Badge className={getStatusColor(getPerformanceStatus(modelPerformance.confidence || 0, 'confidence'))}>
              {getPerformanceStatus(modelPerformance.confidence || 0, 'confidence')}
            </Badge>
            <Progress value={(modelPerformance.confidence || 0) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <LineChart className="w-5 h-5 mr-2" />
                Performance Trends
              </CardTitle>
              <CardDescription>
                {selectedTimeframe} performance analysis
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedMetric === 'accuracy' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('accuracy')}
              >
                Accuracy
              </Button>
              <Button
                variant={selectedMetric === 'speed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('speed')}
              >
                Speed
              </Button>
              <Button
                variant={selectedMetric === 'confidence' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('confidence')}
              >
                Confidence
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-muted-foreground">Performance trend chart</p>
              <p className="text-sm text-muted-foreground">
                Showing {selectedMetric} over {selectedTimeframe} period
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Model Version Comparison
          </CardTitle>
          <CardDescription>
            Performance comparison across different model versions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modelComparison.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-muted-foreground">No model versions to compare</p>
              <p className="text-sm text-muted-foreground">
                Model versioning will be available once multiple versions are deployed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {modelComparison.map((model, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">Model {model.version}</h4>
                      <p className="text-sm text-muted-foreground">
                        Deployed: {new Date(model.deployedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {model.feedbackCount} feedback entries
                      </Badge>
                      {index === 0 && (
                        <Badge className="bg-blue-100 text-blue-700">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Accuracy:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="font-medium">{(model.accuracy * 100).toFixed(1)}%</div>
                        {index > 0 && (
                          model.accuracy > modelComparison[index - 1].accuracy ? 
                            <TrendingUp className="w-4 h-4 text-green-500" /> :
                            <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Speed:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="font-medium">{model.processingSpeed.toFixed(0)}ms</div>
                        {index > 0 && (
                          model.processingSpeed < modelComparison[index - 1].processingSpeed ? 
                            <TrendingUp className="w-4 h-4 text-green-500" /> :
                            <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Confidence:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="font-medium">{(model.confidence * 100).toFixed(1)}%</div>
                        {index > 0 && (
                          model.confidence > modelComparison[index - 1].confidence ? 
                            <TrendingUp className="w-4 h-4 text-green-500" /> :
                            <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>
            AI-generated recommendations for improving model performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {modelPerformance.accuracy && modelPerformance.accuracy < 0.8 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Target className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800">Accuracy Improvement Needed</div>
                    <div className="text-sm text-yellow-700">
                      Current accuracy is below optimal threshold. Consider additional training data.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {modelPerformance.avgResponseTime && modelPerformance.avgResponseTime > 2000 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-orange-800">Performance Optimization</div>
                    <div className="text-sm text-orange-700">
                      Response time is above target. Consider model optimization or caching.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(!modelPerformance.accuracy || modelPerformance.accuracy >= 0.9) && 
             (!modelPerformance.avgResponseTime || modelPerformance.avgResponseTime <= 1500) && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Award className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-800">Excellent Performance</div>
                    <div className="text-sm text-green-700">
                      Model is performing within optimal parameters. Continue monitoring.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};