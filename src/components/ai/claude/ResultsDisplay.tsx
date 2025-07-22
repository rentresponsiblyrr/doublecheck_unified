import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

interface ClaudeAnalysisResult {
  confidence: number;
  issues: Array<{
    severity: 'low' | 'medium' | 'high';
    description: string;
    location?: string;
    suggestions: string[];
  }>;
  recommendations: string[];
  processingTime: number;
  status: 'success' | 'error' | 'processing';
}

interface ClaudeTextResult {
  text: string;
  metadata?: Record<string, unknown>;
  processingTime: number;
}

interface ClaudeCodeReview {
  overallRating: number;
  issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'security' | 'performance' | 'accessibility' | 'type-safety' | 'style';
    description: string;
    line?: number;
    suggestion?: string;
  }>;
  summary: string;
  processingTime: number;
}

type ClaudeResult = ClaudeAnalysisResult | ClaudeTextResult | ClaudeCodeReview;

interface ResultsDisplayProps {
  result: ClaudeResult | null;
  activeTab: 'photo' | 'text' | 'code';
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  result,
  activeTab
}) => {
  if (!result) return null;

  const renderPhotoAnalysisResult = (result: ClaudeAnalysisResult) => (
    <Card id="photo-analysis-result">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span>Analysis Complete</span>
          <Badge variant="secondary">{result.confidence}% confidence</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent id="photo-analysis-content">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Confidence Score</span>
              <span className="text-sm">{result.confidence}%</span>
            </div>
            <Progress value={result.confidence} className="w-full" />
          </div>

          {result.issues.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Issues Found:</h4>
              <div className="space-y-2">
                {result.issues.map((issue, index) => (
                  <div key={index} className="p-3 border rounded-lg" id={`issue-${index}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={
                        issue.severity === 'high' ? 'destructive' : 
                        issue.severity === 'medium' ? 'outline' : 
                        'secondary'
                      }>
                        {issue.severity}
                      </Badge>
                      {issue.location && <Badge variant="outline">{issue.location}</Badge>}
                    </div>
                    <p className="text-sm mb-2">{issue.description}</p>
                    {issue.suggestions.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium">Suggestions:</p>
                        <ul className="list-disc list-inside mt-1">
                          {issue.suggestions.map((suggestion, idx) => (
                            <li key={idx}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Recommendations:</h4>
              <ul className="space-y-1">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Processing time: {result.processingTime}ms</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTextResult = (result: ClaudeTextResult) => (
    <Card id="text-generation-result">
      <CardHeader>
        <CardTitle>Generated Content</CardTitle>
      </CardHeader>
      <CardContent id="text-generation-content">
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <pre className="whitespace-pre-wrap text-sm">{result.text}</pre>
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Processing time: {result.processingTime}ms</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCodeReviewResult = (result: ClaudeCodeReview) => (
    <Card id="code-review-result">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Code Review Results</span>
          <Badge variant="outline">{result.overallRating}/10</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent id="code-review-content">
        <div className="space-y-4">
          <p className="text-sm">{result.summary}</p>
          
          {result.issues.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Issues Found ({result.issues.length}):</h4>
              <div className="space-y-2">
                {result.issues.map((issue, index) => (
                  <div key={index} className="p-3 border rounded-lg" id={`code-issue-${index}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={
                        issue.severity === 'critical' ? 'destructive' :
                        issue.severity === 'high' ? 'destructive' :
                        issue.severity === 'medium' ? 'outline' : 
                        'secondary'
                      }>
                        {issue.severity}
                      </Badge>
                      <Badge variant="outline">{issue.category}</Badge>
                      {issue.line && <Badge variant="outline">Line {issue.line}</Badge>}
                    </div>
                    <p className="text-sm mb-2">{issue.description}</p>
                    {issue.suggestion && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        💡 {issue.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Processing time: {result.processingTime}ms</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Type-safe result rendering
  if (activeTab === 'photo' && 'confidence' in result) {
    return renderPhotoAnalysisResult(result as ClaudeAnalysisResult);
  }
  
  if (activeTab === 'text' && 'text' in result) {
    return renderTextResult(result as ClaudeTextResult);
  }
  
  if (activeTab === 'code' && 'overallRating' in result) {
    return renderCodeReviewResult(result as ClaudeCodeReview);
  }

  return null;
};