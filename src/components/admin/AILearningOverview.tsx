/**
 * AI Learning Overview Component
 * High-level AI learning metrics, insights, and performance indicators
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Database,
  Target
} from 'lucide-react';
import type { LearningInsight, ModelPerformanceMetrics } from '@/types/ai-database';

interface AILearningOverviewProps {
  learningInsights: LearningInsight[];
  modelPerformance: ModelPerformanceMetrics | null;
  selectedTimeframe: 'daily' | 'weekly' | 'monthly';
  isLoading?: boolean;
}

export const AILearningOverview: React.FC<AILearningOverviewProps> = ({
  learningInsights,
  modelPerformance,
  selectedTimeframe,
  isLoading = false
}) => {
  const getOverallAccuracy = () => {
    if (!modelPerformance || !learningInsights.length) return 0;
    return learningInsights.reduce((sum, insight) => sum + insight.confidence, 0) / learningInsights.length;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0.05) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < -0.05) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-blue-500" />;
  };

  const getStatusColor = (value: number, goodThreshold: number, warningThreshold: number) => {
    if (value >= goodThreshold) return 'text-green-600 bg-green-100';
    if (value >= warningThreshold) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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

  const overallAccuracy = getOverallAccuracy();
  const totalInsights = learningInsights.length;
  const highConfidenceInsights = learningInsights.filter(insight => insight.confidence > 0.8).length;
  const recentInsights = learningInsights.filter(insight => 
    new Date(insight.timestamp).getTime() > Date.now() - (24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="space-y-6">
      {/* Critical Learning Alerts */}
      {overallAccuracy < 0.7 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>AI accuracy below 70%</strong> - Model performance needs attention. 
            Consider retraining or adjusting parameters.
          </AlertDescription>
        </Alert>
      )}

      {recentInsights === 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>No recent learning insights</strong> - The AI hasn't processed new feedback in 24 hours.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Learning Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(overallAccuracy * 100).toFixed(1)}%
            </div>
            <div className="flex items-center mt-2">
              <Badge className={getStatusColor(overallAccuracy, 0.9, 0.7)}>
                {overallAccuracy >= 0.9 ? 'Excellent' : 
                 overallAccuracy >= 0.7 ? 'Good' : 'Needs Attention'}
              </Badge>
            </div>
            <Progress value={overallAccuracy * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInsights.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              {getTrendIcon(0.1)}
              <span className="text-xs text-muted-foreground ml-2">
                {selectedTimeframe} learning data
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {highConfidenceInsights}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalInsights > 0 ? ((highConfidenceInsights / totalInsights) * 100).toFixed(1) : 0}% of insights
            </div>
            <Progress 
              value={totalInsights > 0 ? (highConfidenceInsights / totalInsights) * 100 : 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentInsights}</div>
            <p className="text-xs text-muted-foreground">
              Insights from last 24h
            </p>
            {recentInsights === 0 && (
              <Badge variant="outline" className="mt-2 text-yellow-600">
                No recent activity
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress Trends */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              Learning Progress
            </CardTitle>
            <CardDescription>
              AI accuracy improvement over {selectedTimeframe} timeframe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Accuracy</span>
                  <span>{(overallAccuracy * 100).toFixed(1)}%</span>
                </div>
                <Progress value={overallAccuracy * 100} className="h-2" />
              </div>
              
              {modelPerformance && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing Speed</span>
                    <span>{modelPerformance.avgResponseTime?.toFixed(0) || 0}ms</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (3000 - (modelPerformance.avgResponseTime || 3000)) / 30)} 
                    className="h-2" 
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Knowledge Base Coverage</span>
                  <span>85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              User Feedback Integration
            </CardTitle>
            <CardDescription>
              How user feedback improves AI performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Positive Feedback</div>
                  <div className="text-sm text-muted-foreground">
                    Reinforces correct predictions
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {learningInsights.filter(i => i.confidence > 0.8).length}
                  </div>
                  <div className="text-xs text-muted-foreground">entries</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Corrections</div>
                  <div className="text-sm text-muted-foreground">
                    Improves future accuracy
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {learningInsights.filter(i => i.confidence <= 0.5).length}
                  </div>
                  <div className="text-xs text-muted-foreground">entries</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Model Updates</div>
                  <div className="text-sm text-muted-foreground">
                    Applied improvements
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">3</div>
                  <div className="text-xs text-muted-foreground">this week</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent High-Impact Insights */}
      {learningInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent High-Impact Learning</CardTitle>
            <CardDescription>
              Latest insights that significantly improved AI performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {learningInsights
                .filter(insight => insight.confidence > 0.8)
                .slice(0, 5)
                .map((insight, index) => (
                  <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <div className="font-medium">{insight.category}</div>
                        <div className="text-sm text-muted-foreground">
                          {insight.content}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(insight.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};