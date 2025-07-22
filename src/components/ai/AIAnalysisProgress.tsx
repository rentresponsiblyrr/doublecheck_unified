/**
 * AI Analysis Progress - Focused Component
 * 
 * Displays analysis progress with detailed status information
 */

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, Brain } from 'lucide-react';

interface AIAnalysisProgressProps {
  analysisState: 'idle' | 'analyzing' | 'complete' | 'error';
  analysisProgress: number;
  errorMessage: string | null;
  onStartAnalysis: () => void;
  onRetryAnalysis: () => void;
  className?: string;
}

export const AIAnalysisProgress: React.FC<AIAnalysisProgressProps> = ({
  analysisState,
  analysisProgress,
  errorMessage,
  onStartAnalysis,
  onRetryAnalysis,
  className
}) => {
  const getProgressMessage = () => {
    if (analysisProgress < 40) return 'Running reliability analysis...';
    if (analysisProgress < 70) return 'Validating confidence scores...';
    if (analysisProgress < 100) return 'Generating explanations...';
    return 'Analysis complete!';
  };

  if (analysisState === 'idle') {
    return (
      <div className={`text-center p-6 ${className}`} id="ai-analysis-progress">
        <Brain className="w-12 h-12 mx-auto mb-4 text-blue-600" />
        <h3 className="text-lg font-medium mb-2">Ready for AI Analysis</h3>
        <p className="text-gray-600 mb-4">
          Click below to start comprehensive AI reliability analysis
        </p>
        <Button onClick={onStartAnalysis} className="w-full">
          Start AI Analysis
        </Button>
      </div>
    );
  }

  if (analysisState === 'analyzing') {
    return (
      <div className={`p-6 ${className}`} id="ai-analysis-progress-analyzing">
        <div className="text-center mb-4">
          <Brain className="w-8 h-8 mx-auto mb-2 text-blue-600 animate-pulse" />
          <h3 className="text-lg font-medium">Analyzing...</h3>
          <p className="text-sm text-gray-600">
            {getProgressMessage()}
          </p>
        </div>
        <Progress value={analysisProgress} className="w-full" />
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>{Math.round(analysisProgress)}% complete</span>
          <span>Est. {Math.max(1, Math.ceil((100 - analysisProgress) / 30))}min remaining</span>
        </div>
      </div>
    );
  }

  if (analysisState === 'error') {
    return (
      <div className={className} id="ai-analysis-progress-error">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Analysis Failed:</strong> {errorMessage || 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <Button 
            onClick={onRetryAnalysis} 
            variant="outline" 
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Analysis
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
