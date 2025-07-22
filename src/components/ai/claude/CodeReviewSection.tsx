import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Code } from 'lucide-react';
import { createClaudeService, ClaudeCodeReviewRequest } from '@/lib/ai/claude-service';

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

interface CodeReviewSectionProps {
  isLoading: boolean;
  error: string | null;
  result: ClaudeCodeReview | null;
  onReviewStart: () => void;
  onReviewComplete: (result: ClaudeCodeReview) => void;
  onError: (error: string) => void;
}

export const CodeReviewSection: React.FC<CodeReviewSectionProps> = ({
  isLoading,
  error,
  result,
  onReviewStart,
  onReviewComplete,
  onError
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [filePath, setFilePath] = useState('');

  const claudeService = createClaudeService();

  const handleCodeReview = useCallback(async () => {
    if (!codeInput.trim()) {
      onError('Please enter code to review');
      return;
    }

    onReviewStart();

    try {
      const request: ClaudeCodeReviewRequest = {
        prompt: codeInput,
        context: {
          filePath: filePath || 'untitled.tsx',
          focusAreas: ['security', 'performance', 'accessibility', 'type-safety'],
          reviewLevel: 'comprehensive'
        }
      };

      const response = await claudeService.reviewCode(request);
      onReviewComplete(response);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Code review failed');
    }
  }, [codeInput, filePath, claudeService, onReviewStart, onReviewComplete, onError]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'destructive';
      case 'performance': return 'outline';
      case 'accessibility': return 'secondary';
      case 'type-safety': return 'default';
      case 'style': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div id="code-review-section" className="space-y-4">
      <Card id="code-input-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>Code Review</span>
          </CardTitle>
        </CardHeader>
        <CardContent id="code-input-content">
          <div className="space-y-4">
            <div>
              <label htmlFor="file-path-input" className="text-sm font-medium mb-2 block">
                File Path (Optional)
              </label>
              <input
                id="file-path-input"
                type="text"
                placeholder="e.g., src/components/MyComponent.tsx"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="code-input-textarea" className="text-sm font-medium mb-2 block">
                Code to Review
              </label>
              <Textarea
                id="code-input-textarea"
                placeholder="Paste your code here..."
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                rows={8}
                className="w-full font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleCodeReview}
              disabled={!codeInput.trim() || isLoading}
              className="w-full"
              id="review-code-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reviewing...
                </>
              ) : (
                'Review Code'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card id="code-review-results-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Review Results</span>
              <Badge variant="outline">{result.overallRating}/10</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent id="code-review-results-content">
            <div className="space-y-4">
              <p className="text-sm">{result.summary}</p>
              
              {result.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Issues Found:</h4>
                  {result.issues.map((issue, index) => (
                    <div key={index} className="p-3 border rounded-lg" id={`issue-${index}`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                        <Badge variant={getCategoryColor(issue.category)}>
                          {issue.category}
                        </Badge>
                        {issue.line && (
                          <Badge variant="outline">Line {issue.line}</Badge>
                        )}
                      </div>
                      <p className="text-sm mb-1">{issue.description}</p>
                      {issue.suggestion && (
                        <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          💡 {issue.suggestion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" id="code-error-alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};