// AI Analysis Display Component for STR Certified

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Brain,
  Shield,
  Building,
  Eye,
  Zap
} from 'lucide-react';
import type { 
  AIAnalysisResult, 
  PhotoComparisonResult, 
  DynamicChecklistItem,
  AIAnalysisState 
} from '@/lib/ai/types';
import { cn } from '@/lib/utils';

interface AIAnalysisDisplayProps {
  result: AIAnalysisResult;
  className?: string;
  showDetailedBreakdown?: boolean;
  onRetryAnalysis?: () => void;
  isRetrying?: boolean;
}

export const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({
  result,
  className,
  showDetailedBreakdown = true,
  onRetryAnalysis,
  isRetrying = false
}) => {
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'pass':
        return 'text-green-600 border-green-200 bg-green-50';
      case 'fail':
        return 'text-red-600 border-red-200 bg-red-50';
      case 'review_required':
        return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      default:
        return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'review_required':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Eye className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'pass':
        return 'Inspection Passed';
      case 'fail':
        return 'Inspection Failed';
      case 'review_required':
        return 'Manual Review Required';
      default:
        return 'Analysis Complete';
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">AI Analysis Results</CardTitle>
          </div>
          {onRetryAnalysis && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetryAnalysis}
              disabled={isRetrying}
              className="flex items-center space-x-1"
            >
              <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
              <span>Retry</span>
            </Button>
          )}
        </div>
        <CardDescription>
          AI-powered inspection analysis with confidence scoring
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Confidence Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Confidence Score</span>
            <span className="text-sm text-muted-foreground">{result.confidence}%</span>
          </div>
          <Progress 
            value={result.confidence} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {result.confidence >= 90 ? 'Very High Confidence' :
             result.confidence >= 75 ? 'High Confidence' :
             result.confidence >= 60 ? 'Moderate Confidence' :
             result.confidence >= 40 ? 'Low Confidence' : 'Very Low Confidence'}
          </p>
        </div>

        <Separator />

        {/* Pass/Fail Recommendation */}
        <Alert className={getRecommendationColor(result.pass_fail_recommendation)}>
          <div className="flex items-center space-x-2">
            {getRecommendationIcon(result.pass_fail_recommendation)}
            <AlertTitle className="mb-0">
              {formatRecommendationText(result.pass_fail_recommendation)}
            </AlertTitle>
          </div>
          <AlertDescription className="mt-2">
            {result.reasoning}
          </AlertDescription>
        </Alert>

        {/* Detected Features */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Detected Features</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {result.detected_features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
          {result.detected_features.length === 0 && (
            <p className="text-sm text-muted-foreground">No specific features detected</p>
          )}
        </div>

        {/* Safety Concerns */}
        {result.safety_concerns && result.safety_concerns.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center space-x-2 text-red-600">
              <Shield className="h-4 w-4" />
              <span>Safety Concerns</span>
            </h4>
            <div className="space-y-2">
              {result.safety_concerns.map((concern, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{concern}</AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Status */}
        {result.compliance_status && showDetailedBreakdown && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Compliance Status</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ComplianceItem
                label="Building Code"
                status={result.compliance_status.building_code}
              />
              <ComplianceItem
                label="Fire Safety"
                status={result.compliance_status.fire_safety}
              />
              <ComplianceItem
                label="Accessibility"
                status={result.compliance_status.accessibility}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ComplianceItemProps {
  label: string;
  status: boolean;
}

const ComplianceItem: React.FC<ComplianceItemProps> = ({ label, status }) => (
  <div className={cn(
    'flex items-center space-x-2 p-3 rounded-lg border',
    status ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
  )}>
    {status ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )}
    <span className={cn(
      'text-sm font-medium',
      status ? 'text-green-700' : 'text-red-700'
    )}>
      {label}
    </span>
  </div>
);

// Photo Comparison Display Component
interface PhotoComparisonDisplayProps {
  result: PhotoComparisonResult;
  className?: string;
  onRetryComparison?: () => void;
  isRetrying?: boolean;
}

export const PhotoComparisonDisplay: React.FC<PhotoComparisonDisplayProps> = ({
  result,
  className,
  onRetryComparison,
  isRetrying = false
}) => {
  const getSimilarityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'matches_listing':
        return 'text-green-600 border-green-200 bg-green-50';
      case 'minor_differences':
        return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'major_discrepancies':
        return 'text-red-600 border-red-200 bg-red-50';
      default:
        return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Photo Comparison</CardTitle>
          </div>
          {onRetryComparison && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetryComparison}
              disabled={isRetrying}
              className="flex items-center space-x-1"
            >
              <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
              <span>Retry</span>
            </Button>
          )}
        </div>
        <CardDescription>
          AI comparison between inspector photo and listing photos
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Similarity Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Similarity Score</span>
            <span className={cn("text-sm font-semibold", getSimilarityColor(result.similarity_score))}>
              {result.similarity_score}%
            </span>
          </div>
          <Progress 
            value={result.similarity_score} 
            className="h-2"
          />
        </div>

        {/* Recommendation */}
        <Alert className={getRecommendationColor(result.recommendation)}>
          <AlertTitle className="capitalize">
            {result.recommendation.replace('_', ' ')}
          </AlertTitle>
          <AlertDescription>
            Confidence: {result.confidence}%
          </AlertDescription>
        </Alert>

        {/* Detailed Analysis */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Detailed Analysis</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className={cn(
              'flex items-center space-x-2 p-2 rounded',
              result.details.room_layout_match ? 'bg-green-50' : 'bg-red-50'
            )}>
              {result.details.room_layout_match ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-xs">Layout Match</span>
            </div>
            <div className={cn(
              'flex items-center space-x-2 p-2 rounded',
              !result.details.lighting_differences ? 'bg-green-50' : 'bg-yellow-50'
            )}>
              {!result.details.lighting_differences ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-xs">Lighting</span>
            </div>
            <div className={cn(
              'flex items-center space-x-2 p-2 rounded',
              !result.details.furniture_changes ? 'bg-green-50' : 'bg-yellow-50'
            )}>
              {!result.details.furniture_changes ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-xs">Furniture</span>
            </div>
            <div className={cn(
              'flex items-center space-x-2 p-2 rounded',
              !result.details.structural_differences ? 'bg-green-50' : 'bg-red-50'
            )}>
              {!result.details.structural_differences ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-xs">Structure</span>
            </div>
          </div>
        </div>

        {/* Discrepancies */}
        {result.discrepancies.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-red-600">Discrepancies Found</h4>
            <div className="space-y-2">
              {result.discrepancies.map((discrepancy, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 rounded">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-700">{discrepancy}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// AI Analysis State Display (for loading, error states)
interface AIAnalysisStateDisplayProps {
  state: AIAnalysisState;
  className?: string;
  onRetry?: () => void;
}

export const AIAnalysisStateDisplay: React.FC<AIAnalysisStateDisplayProps> = ({
  state,
  className,
  onRetry
}) => {
  if (state.status === 'idle') {
    return null;
  }

  if (state.status === 'analyzing') {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">Analyzing with AI...</p>
              {state.progress !== undefined && (
                <Progress value={state.progress} className="mt-2 h-1" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.status === 'error' && state.error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Analysis Failed</AlertTitle>
            <AlertDescription className="mt-2">
              {state.error.message}
              {onRetry && state.error.retryable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="mt-3 ml-0"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry Analysis
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (state.status === 'completed' && state.result) {
    return <AIAnalysisDisplay result={state.result} className={className} />;
  }

  return null;
};