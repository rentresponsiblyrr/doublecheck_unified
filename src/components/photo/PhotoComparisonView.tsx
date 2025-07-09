// Photo Comparison View Component for STR Certified

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Camera,
  ZoomIn,
  Info,
  Eye,
  Sparkles,
  Shield,
  Target,
  Home,
  Activity
} from 'lucide-react';
import type {
  PhotoComparisonResult,
  DiscrepancyReport,
  PhotoQualityMetrics,
  ComparisonRecommendation,
  RoomFeatures
} from '@/types/photo';
import { cn } from '@/lib/utils';

interface PhotoComparisonViewProps {
  comparisonResult: PhotoComparisonResult;
  inspectorPhotoUrl: string;
  listingPhotoUrl: string;
  roomName?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  showDetailedAnalysis?: boolean;
  className?: string;
}

export const PhotoComparisonView: React.FC<PhotoComparisonViewProps> = ({
  comparisonResult,
  inspectorPhotoUrl,
  listingPhotoUrl,
  roomName = 'Room',
  onRetry,
  isRetrying = false,
  showDetailedAnalysis = true,
  className
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const [showDiscrepancyOverlay, setShowDiscrepancyOverlay] = useState(true);

  const getRecommendationStyle = (recommendation: ComparisonRecommendation) => {
    switch (recommendation) {
      case 'matches_listing':
        return {
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />
        };
      case 'acceptable_differences':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />
        };
      case 'review_required':
        return {
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: <Eye className="h-5 w-5 text-orange-600" />
        };
      case 'significant_discrepancies':
        return {
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: <XCircle className="h-5 w-5 text-red-600" />
        };
      case 'retake_photo':
        return {
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          icon: <Camera className="h-5 w-5 text-purple-600" />
        };
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: <Info className="h-5 w-5 text-gray-600" />
        };
    }
  };

  const recommendationStyle = getRecommendationStyle(comparisonResult.recommendation);

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header with Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <span>Photo Comparison Analysis</span>
              </CardTitle>
              <CardDescription>
                {roomName} • Analyzed in {comparisonResult.processingTime}ms
              </CardDescription>
            </div>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                disabled={isRetrying}
                className="flex items-center space-x-1"
              >
                <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
                <span>Retry</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recommendation Alert */}
          <Alert className={cn(recommendationStyle.bg, recommendationStyle.border, 'border')}>
            <div className="flex items-center space-x-2">
              {recommendationStyle.icon}
              <AlertTitle className={cn('mb-0', recommendationStyle.color)}>
                {formatRecommendation(comparisonResult.recommendation)}
              </AlertTitle>
            </div>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <p className="text-sm">
                  {getRecommendationDescription(comparisonResult.recommendation)}
                </p>
                {comparisonResult.discrepancies.length > 0 && (
                  <p className="text-sm font-medium">
                    {comparisonResult.discrepancies.length} discrepancies found
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              title="Similarity Score"
              value={`${comparisonResult.similarity_score}%`}
              icon={<Target className="h-4 w-4" />}
              color={comparisonResult.similarity_score >= 75 ? 'green' : 'orange'}
            />
            <MetricCard
              title="Photo Quality"
              value={`${comparisonResult.quality_score.overall_score}%`}
              icon={<Camera className="h-4 w-4" />}
              color={comparisonResult.quality_score.overall_score >= 70 ? 'blue' : 'orange'}
            />
            <MetricCard
              title="Confidence"
              value={`${comparisonResult.confidence}%`}
              icon={<Shield className="h-4 w-4" />}
              color={comparisonResult.confidence >= 80 ? 'purple' : 'gray'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Photo Comparison */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Visual Comparison</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'side-by-side' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('side-by-side')}
              >
                Side by Side
              </Button>
              <Button
                variant={viewMode === 'overlay' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('overlay')}
              >
                Overlay
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PhotoFrame
                title="Inspector Photo"
                photoUrl={inspectorPhotoUrl}
                quality={comparisonResult.quality_score}
                badge="Current"
              />
              <PhotoFrame
                title="Listing Photo"
                photoUrl={listingPhotoUrl}
                badge="Reference"
              />
            </div>
          ) : (
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={listingPhotoUrl}
                alt="Listing photo"
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
              <img
                src={inspectorPhotoUrl}
                alt="Inspector photo"
                className={cn(
                  "absolute inset-0 w-full h-full object-cover",
                  showDiscrepancyOverlay ? "opacity-80" : "opacity-100"
                )}
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-4 right-4"
                onClick={() => setShowDiscrepancyOverlay(!showDiscrepancyOverlay)}
              >
                {showDiscrepancyOverlay ? 'Hide' : 'Show'} Overlay
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      {showDetailedAnalysis && (
        <Tabs defaultValue="discrepancies" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="discrepancies">Discrepancies</TabsTrigger>
            <TabsTrigger value="quality">Quality Analysis</TabsTrigger>
            <TabsTrigger value="features">Detected Features</TabsTrigger>
          </TabsList>

          {/* Discrepancies Tab */}
          <TabsContent value="discrepancies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detected Discrepancies</CardTitle>
                <CardDescription>
                  Differences between inspector photo and listing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonResult.discrepancies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No significant discrepancies detected</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {comparisonResult.discrepancies.map((discrepancy, index) => (
                        <DiscrepancyCard key={index} discrepancy={discrepancy} />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Analysis Tab */}
          <TabsContent value="quality" className="space-y-4">
            <QualityAnalysisCard quality={comparisonResult.quality_score} />
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Room Feature Detection</CardTitle>
                <CardDescription>
                  AI-detected furniture, fixtures, and amenities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Feature detection helps verify that all advertised amenities are present and functional.
                  </AlertDescription>
                </Alert>
                {/* Feature detection would be displayed here when available */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

// Sub-components

const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'gray';
}> = ({ title, value, icon, color }) => {
  const colorClasses = {
    green: 'text-green-600 bg-green-50',
    blue: 'text-blue-600 bg-blue-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
    gray: 'text-gray-600 bg-gray-50'
  };

  return (
    <div className={cn('p-4 rounded-lg text-center', colorClasses[color])}>
      <div className="flex items-center justify-center mb-2">
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-80">{title}</div>
    </div>
  );
};

const PhotoFrame: React.FC<{
  title: string;
  photoUrl: string;
  quality?: PhotoQualityMetrics;
  badge?: string;
}> = ({ title, photoUrl, quality, badge }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{title}</h4>
        {badge && <Badge variant="secondary">{badge}</Badge>}
      </div>
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
        <img
          src={photoUrl}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5VjEzTTEyIDE3SDE2TTE2IDlIOEw2IDExVjE5SDIwVjExTDE4IDlaIiBzdHJva2U9IiM2QjcyODAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
          }}
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
      {quality && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Quality: {quality.overall_score}%</span>
          <span>{quality.sharpness.rating}</span>
        </div>
      )}
    </div>
  );
};

const DiscrepancyCard: React.FC<{ discrepancy: DiscrepancyReport }> = ({ discrepancy }) => {
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'major':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'minor':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'missing_furniture':
      case 'missing_amenity':
        return <Home className="h-4 w-4" />;
      case 'damage_detected':
      case 'maintenance_needed':
        return <AlertTriangle className="h-4 w-4" />;
      case 'cleanliness_issue':
        return <Activity className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      getSeverityStyle(discrepancy.severity)
    )}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getTypeIcon(discrepancy.type)}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h5 className="font-medium capitalize">
              {discrepancy.type.replace(/_/g, ' ')}
            </h5>
            <Badge variant="outline" className="text-xs">
              {discrepancy.severity}
            </Badge>
          </div>
          <p className="text-sm">{discrepancy.description}</p>
          <div className="flex items-center space-x-4 text-xs">
            <span>Confidence: {discrepancy.confidence}%</span>
            {discrepancy.location && (
              <span>Location: {discrepancy.location.label || 'Detected'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const QualityAnalysisCard: React.FC<{ quality: PhotoQualityMetrics }> = ({ quality }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo Quality Analysis</CardTitle>
        <CardDescription>
          Technical assessment of the inspector's photo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quality Scores */}
        <div className="space-y-4">
          <QualityMetric
            label="Sharpness"
            score={quality.sharpness.score}
            rating={quality.sharpness.rating}
            details={quality.sharpness.details}
          />
          <QualityMetric
            label="Lighting"
            score={quality.lighting.score}
            rating={quality.lighting.rating}
            details={quality.lighting.details}
          />
          <QualityMetric
            label="Composition"
            score={quality.composition.score}
            rating={quality.composition.rating}
            details={quality.composition.details}
          />
        </div>

        <Separator />

        {/* Issues and Suggestions */}
        {quality.issues.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Quality Issues</h4>
            {quality.issues.map((issue, index) => (
              <Alert key={index} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{issue.description}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {quality.suggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Improvement Suggestions</h4>
            {quality.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <span className="text-2xl">{suggestion.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{suggestion.action}</p>
                  <p className="text-xs text-muted-foreground">
                    Could improve quality by {suggestion.estimatedImprovement}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const QualityMetric: React.FC<{
  label: string;
  score: number;
  rating: string;
  details?: string;
}> = ({ label, score, rating, details }) => {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'acceptable': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'unacceptable': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center space-x-2">
          <span className={cn('text-sm capitalize', getRatingColor(rating))}>
            {rating}
          </span>
          <span className="text-sm text-muted-foreground">({score}%)</span>
        </div>
      </div>
      <Progress value={score} className="h-2" />
      {details && (
        <p className="text-xs text-muted-foreground">{details}</p>
      )}
    </div>
  );
};

// Helper functions
const formatRecommendation = (recommendation: ComparisonRecommendation): string => {
  switch (recommendation) {
    case 'matches_listing':
      return 'Photo Matches Listing';
    case 'acceptable_differences':
      return 'Minor Differences Detected';
    case 'review_required':
      return 'Manual Review Required';
    case 'significant_discrepancies':
      return 'Significant Discrepancies Found';
    case 'retake_photo':
      return 'Please Retake Photo';
    default:
      return 'Analysis Complete';
  }
};

const getRecommendationDescription = (recommendation: ComparisonRecommendation): string => {
  switch (recommendation) {
    case 'matches_listing':
      return 'The inspector photo accurately represents the listing. No significant differences found.';
    case 'acceptable_differences':
      return 'Minor differences detected that do not affect the accuracy of the listing representation.';
    case 'review_required':
      return 'Some differences detected that require human review to determine acceptability.';
    case 'significant_discrepancies':
      return 'Major differences found between the inspector photo and listing. Investigation required.';
    case 'retake_photo':
      return 'Photo quality is insufficient for accurate comparison. Please retake with better lighting and focus.';
    default:
      return 'Photo comparison analysis has been completed.';
  }
};