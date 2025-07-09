// AI Learning Dashboard Component
// Displays comprehensive AI learning analytics and performance metrics

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Database,
  Zap,
  Target,
  BarChart3,
  LineChart,
  RefreshCw,
  Settings,
  Search,
  BookOpen,
  Lightbulb,
  Award,
  Activity
} from 'lucide-react';
import { useEnhancedAI } from '@/hooks/useEnhancedAI';
import { aiLearningService } from '@/services/aiLearningService';
import { logger } from '@/utils/logger';
import type { 
  LearningInsight, 
  ModelPerformanceMetrics,
  KnowledgeSearchResult 
} from '@/types/ai-database';

interface AILearningDashboardProps {
  className?: string;
}

interface ModelComparisonData {
  version: string;
  accuracy: number;
  confidence: number;
  processingSpeed: number;
  deployedAt: string;
  feedbackCount: number;
}

export function AILearningDashboard({ className }: AILearningDashboardProps) {
  const {
    learningInsights,
    modelPerformance,
    refreshInsights,
    refreshPerformance,
    searchKnowledge,
    knowledgeResults,
    isSearchingKnowledge
  } = useEnhancedAI();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [knowledgeQuery, setKnowledgeQuery] = useState('');
  const [modelComparison, setModelComparison] = useState<ModelComparisonData[]>([]);

  // Load model comparison data
  useEffect(() => {
    const loadModelComparison = async () => {
      try {
        // This would fetch actual model comparison data in production
        const mockComparison: ModelComparisonData[] = [
          {
            version: 'v1.1.0-cag',
            accuracy: 87.5,
            confidence: 0.91,
            processingSpeed: 1850,
            deployedAt: '2024-07-01',
            feedbackCount: 1247
          },
          {
            version: 'v1.0.0',
            accuracy: 82.3,
            confidence: 0.85,
            processingSpeed: 2100,
            deployedAt: '2024-06-15',
            feedbackCount: 2156
          }
        ];
        setModelComparison(mockComparison);
      } catch (error) {
        logger.error('Failed to load model comparison', error, 'AI_LEARNING_DASHBOARD');
      }
    };

    loadModelComparison();
  }, []);

  // Refresh all data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshInsights(),
        refreshPerformance()
      ]);
    } catch (error) {
      logger.error('Failed to refresh dashboard data', error, 'AI_LEARNING_DASHBOARD');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle knowledge search
  const handleKnowledgeSearch = async () => {
    if (!knowledgeQuery.trim()) return;
    
    try {
      await searchKnowledge({
        query: knowledgeQuery,
        filters: {
          threshold: 0.7,
          limit: 10
        }
      });
    } catch (error) {
      logger.error('Knowledge search failed', error, 'AI_LEARNING_DASHBOARD');
    }
  };

  // Get insight severity color
  const getInsightSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'success': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  // Get insight icon
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <Activity className="h-4 w-4" />;
      case 'anomaly': return <AlertCircle className="h-4 w-4" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      case 'achievement': return <Award className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            AI Learning Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitor AI performance, learning progress, and system insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Accuracy</p>
                <p className="text-2xl font-bold text-green-600">
                  {modelPerformance?.overall_accuracy.toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2.3% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Feedback Volume</p>
                <p className="text-2xl font-bold text-blue-600">
                  {modelPerformance?.feedback_volume || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing</p>
                <p className="text-2xl font-bold text-purple-600">
                  {modelPerformance?.avg_processing_time || 0}ms
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <TrendingDown className="h-3 w-3 mr-1" />
              -8% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Learning Insights</p>
                <p className="text-2xl font-bold text-orange-600">
                  {learningInsights.length}
                </p>
              </div>
              <Brain className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <AlertCircle className="h-3 w-3 mr-1" />
              {learningInsights.filter(i => i.severity === 'warning').length} require attention
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Accuracy by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Accuracy by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modelPerformance?.accuracy_by_category && 
                    Object.entries(modelPerformance.accuracy_by_category).map(([category, accuracy]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium capitalize">
                            {category.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-600">
                            {accuracy.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={accuracy} className="h-2" />
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>

            {/* Recent Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Recent Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {learningInsights.slice(0, 5).map((insight) => (
                    <div key={insight.id} className="flex items-start space-x-3">
                      <div className={`p-1 rounded-full ${getInsightSeverityColor(insight.severity)}`}>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {insight.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {insight.description}
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {new Date(insight.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {learningInsights.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No recent insights available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Metrics */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
                <CardDescription>
                  AI model performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Performance chart would be rendered here</p>
                    <p className="text-sm">Using Chart.js or similar library</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-medium">
                      {(modelPerformance?.success_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Error Rate</span>
                    <span className="text-sm font-medium">
                      {(modelPerformance?.error_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Correction Rate</span>
                    <span className="text-sm font-medium">
                      {(modelPerformance?.correction_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Confidence Cal.</span>
                    <span className="text-sm font-medium">
                      {(modelPerformance?.confidence_calibration * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Improvement Rate</span>
                    <span className="text-sm font-medium text-green-600">
                      +{modelPerformance?.improvement_velocity.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {learningInsights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full ${getInsightSeverityColor(insight.severity)}`}>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <CardDescription>{insight.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{insight.type}</Badge>
                      <Badge variant={insight.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {insight.severity}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {insight.suggested_actions && insight.suggested_actions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Suggested Actions:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {insight.suggested_actions.map((action, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-gray-400">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {insight.metrics && (
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      {Object.entries(insight.metrics).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">
                            {key.replace('_', ' ')}:
                          </span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>Created: {new Date(insight.created_at).toLocaleString()}</span>
                    <span>Categories: {insight.affected_categories.join(', ')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {learningInsights.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No learning insights available</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Insights will appear as the AI processes more feedback
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Knowledge Tab */}
        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Knowledge Base Search
              </CardTitle>
              <CardDescription>
                Search through AI knowledge base and regulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search knowledge base..."
                  value={knowledgeQuery}
                  onChange={(e) => setKnowledgeQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                  onKeyPress={(e) => e.key === 'Enter' && handleKnowledgeSearch()}
                />
                <Button 
                  onClick={handleKnowledgeSearch}
                  disabled={isSearchingKnowledge}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              {knowledgeResults.length > 0 && (
                <div className="mt-4 space-y-3">
                  {knowledgeResults.map((result) => (
                    <Card key={result.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{result.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {result.content.substring(0, 200)}...
                          </p>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                            <span>Category: {result.category}</span>
                            <span>Source: {result.source}</span>
                            <span>Similarity: {(result.similarity * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {result.category}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Model Versions
              </CardTitle>
              <CardDescription>
                Compare different AI model versions and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelComparison.map((model) => (
                  <Card key={model.version} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="font-medium">{model.version}</h4>
                          <p className="text-sm text-gray-600">
                            Deployed: {new Date(model.deployedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {model.version === 'v1.1.0-cag' && (
                          <Badge variant="default">Current</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{model.accuracy}%</p>
                          <p className="text-gray-600">Accuracy</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{model.processingSpeed}ms</p>
                          <p className="text-gray-600">Speed</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{model.feedbackCount}</p>
                          <p className="text-gray-600">Feedback</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AILearningDashboard;