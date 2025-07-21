/**
 * AI Knowledge Search Component
 * Knowledge base search, insights management, and learning analytics
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search,
  BookOpen,
  Lightbulb,
  Database,
  CheckCircle,
  AlertCircle,
  Brain,
  TrendingUp,
  Activity
} from 'lucide-react';
import { sanitizeSearchQuery, validateAndSanitize } from '@/utils/validation';
import type { LearningInsight, KnowledgeSearchResult } from '@/types/ai-database';

interface AIKnowledgeSearchProps {
  learningInsights: LearningInsight[];
  knowledgeResults: KnowledgeSearchResult[];
  isSearchingKnowledge: boolean;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const AIKnowledgeSearch: React.FC<AIKnowledgeSearchProps> = ({
  learningInsights,
  knowledgeResults,
  isSearchingKnowledge,
  onSearch,
  isLoading = false
}) => {
  const [knowledgeQuery, setKnowledgeQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!knowledgeQuery.trim()) return;
    
    try {
      const sanitizedQuery = sanitizeSearchQuery(knowledgeQuery);
      const validatedQuery = validateAndSanitize(sanitizedQuery, 'searchQuery');
      
      if (validatedQuery) {
        onSearch(validatedQuery);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Search validation failed:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'inspection': 'bg-blue-100 text-blue-700',
      'compliance': 'bg-green-100 text-green-700',
      'safety': 'bg-red-100 text-red-700',
      'quality': 'bg-purple-100 text-purple-700',
      'efficiency': 'bg-orange-100 text-orange-700'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return { label: 'High', color: 'text-green-600' };
    if (confidence >= 0.6) return { label: 'Medium', color: 'text-yellow-600' };
    return { label: 'Low', color: 'text-red-600' };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-20 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Knowledge Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Knowledge Base Search
          </CardTitle>
          <CardDescription>
            Search through AI learning insights and knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search knowledge base (e.g., 'safety inspection best practices')"
              value={knowledgeQuery}
              onChange={(e) => setKnowledgeQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={isSearchingKnowledge || !knowledgeQuery.trim()}
            >
              {isSearchingKnowledge ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {hasSearched && !isSearchingKnowledge && (
            <div className="mt-4">
              {knowledgeResults.length === 0 ? (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    No results found for "{knowledgeQuery}". Try different search terms.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Found {knowledgeResults.length} results for "{knowledgeQuery}"
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {knowledgeResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Search Results
            </CardTitle>
            <CardDescription>
              Relevant knowledge base entries and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {knowledgeResults.map((result, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{result.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.source} • {result.category}
                      </p>
                    </div>
                    <Badge variant="outline" className={getConfidenceLevel(result.relevanceScore).color}>
                      {(result.relevanceScore * 100).toFixed(0)}% relevance
                    </Badge>
                  </div>
                  <p className="text-sm mb-3">{result.content}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(result.category)}>
                      {result.category}
                    </Badge>
                    {result.tags && result.tags.map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Insights by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            Learning Insights by Category
          </CardTitle>
          <CardDescription>
            AI insights organized by inspection categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {learningInsights.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-muted-foreground">No learning insights available</p>
              <p className="text-sm text-muted-foreground">
                Insights will appear as the AI processes inspection feedback
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(
                learningInsights.reduce((acc, insight) => {
                  const category = insight.category || 'general';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(insight);
                  return acc;
                }, {} as Record<string, LearningInsight[]>)
              ).map(([category, insights]) => (
                <div key={category} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium capitalize flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      {category} ({insights.length})
                    </h4>
                    <Badge className={getCategoryColor(category)}>
                      {category}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {insights.slice(0, 3).map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm">{insight.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(insight.timestamp).toLocaleDateString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {(insight.confidence * 100).toFixed(0)}% confidence
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {insights.length > 3 && (
                      <div className="text-sm text-muted-foreground text-center">
                        +{insights.length - 3} more insights in this category
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Knowledge Base Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningInsights.length}</div>
            <p className="text-xs text-muted-foreground">
              Accumulated learning data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(learningInsights.map(i => i.category)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Distinct knowledge areas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {learningInsights.length > 0 
                ? ((learningInsights.reduce((sum, i) => sum + i.confidence, 0) / learningInsights.length) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Knowledge reliability
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};