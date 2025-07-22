/**
 * Claude Results Display - Enterprise Grade
 * 
 * Comprehensive display of Claude AI analysis results
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AnalysisResult {
  content?: string;
  analysis?: {
    status: 'pass' | 'fail' | 'needs_review';
    confidence: number;
    reasoning: string;
    issues: string[];
    recommendations: string[];
  };
  review?: {
    score: number;
    issues: Array<{
      severity: 'critical' | 'high' | 'medium' | 'low';
      category: 'security' | 'performance' | 'maintainability' | 'style';
      description: string;
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

interface ClaudeResultsDisplayProps {
  result: AnalysisResult | null;
}

export const ClaudeResultsDisplay: React.FC<ClaudeResultsDisplayProps> = ({ result }) => {
  if (!result) {
    return null;
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card id="claude-results-display">
      <CardHeader>
        <CardTitle className="text-lg">Analysis Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Generated Text */}
        {result.content && (
          <div>
            <h4 className="font-semibold mb-2">Generated Text</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{result.content}</pre>
            </div>
          </div>
        )}

        {/* Photo Analysis */}
        {result.analysis && (
          <div>
            <h4 className="font-semibold mb-2">Photo Analysis</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getStatusBadgeClass(result.analysis.status)}>
                  {result.analysis.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-600">
                  Confidence: {Math.round(result.analysis.confidence * 100)}%
                </span>
              </div>
              
              <div>
                <h5 className="font-medium mb-1">Reasoning</h5>
                <p className="text-sm text-gray-700">{result.analysis.reasoning}</p>
              </div>

              {result.analysis.issues.length > 0 && (
                <div>
                  <h5 className="font-medium mb-1">Issues Found</h5>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {result.analysis.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.analysis.recommendations.length > 0 && (
                <div>
                  <h5 className="font-medium mb-1">Recommendations</h5>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {result.analysis.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Code Review */}
        {result.review && (
          <div>
            <h4 className="font-semibold mb-2">Code Review</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Score:</span>
                <Progress value={result.review.score} className="flex-1 max-w-32" />
                <span className="text-sm">{result.review.score}/100</span>
              </div>

              <div>
                <h5 className="font-medium mb-1">Summary</h5>
                <p className="text-sm text-gray-700">{result.review.summary}</p>
              </div>

              {result.review.issues.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Issues Found</h5>
                  <div className="space-y-2">
                    {result.review.issues.map((issue, index) => (
                      <div key={index} className="border-l-4 border-red-200 pl-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityBadgeClass(issue.severity)}>
                            {issue.severity}
                          </Badge>
                          <Badge variant="outline">
                            {issue.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{issue.description}</p>
                        {issue.suggestion && (
                          <p className="text-xs text-gray-500 mt-1">
                            Suggestion: {issue.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Usage Information */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Usage Information</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Processing Time:</span>
              <div className="font-medium">{result.metadata.processingTime}ms</div>
            </div>
            <div>
              <span className="text-gray-600">Model:</span>
              <div className="font-medium">{result.metadata.model}</div>
            </div>
            <div>
              <span className="text-gray-600">Total Tokens:</span>
              <div className="font-medium">{result.usage.totalTokens}</div>
            </div>
            <div>
              <span className="text-gray-600">Cost:</span>
              <div className="font-medium">${result.usage.cost.toFixed(4)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};