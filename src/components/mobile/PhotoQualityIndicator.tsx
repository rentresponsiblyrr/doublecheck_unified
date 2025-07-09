// Photo Quality Indicator Component for STR Certified

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  Sun,
  Focus,
  Move,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap
} from 'lucide-react';
import type { PhotoGuidance, PhotoQualityMetrics, GuidanceMessage } from '@/types/photo';
import { cn } from '@/lib/utils';

interface PhotoQualityIndicatorProps {
  quality: PhotoGuidance | PhotoQualityMetrics;
  compact?: boolean;
  showDetails?: boolean;
  animated?: boolean;
  className?: string;
}

export const PhotoQualityIndicator: React.FC<PhotoQualityIndicatorProps> = ({
  quality,
  compact = false,
  showDetails = true,
  animated = true,
  className
}) => {
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [scoreDirection, setScoreDirection] = useState<'up' | 'down' | 'stable'>('stable');
  const [isAnimating, setIsAnimating] = useState(false);

  // Determine if we have PhotoGuidance or PhotoQualityMetrics
  const isGuidance = 'isAcceptable' in quality;
  const overallScore = isGuidance ? quality.qualityScore : quality.overall_score;

  // Track score changes
  useEffect(() => {
    if (previousScore !== null && previousScore !== overallScore) {
      setScoreDirection(overallScore > previousScore ? 'up' : 'down');
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    }
    setPreviousScore(overallScore);
  }, [overallScore, previousScore]);

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Get status icon
  const getStatusIcon = (score: number) => {
    if (score >= 85) return <CheckCircle className="h-5 w-5" />;
    if (score >= 70) return <AlertTriangle className="h-5 w-5" />;
    return <XCircle className="h-5 w-5" />;
  };

  // Get trend icon
  const getTrendIcon = () => {
    if (scoreDirection === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (scoreDirection === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-400" />;
  };

  // Compact view for mobile
  if (compact) {
    return (
      <div className={cn(
        'relative transition-all duration-300',
        isAnimating && animated && 'scale-110',
        className
      )}>
        <div className={cn(
          'flex items-center space-x-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-sm border',
          getScoreColor(overallScore),
          'bg-opacity-90'
        )}>
          {getStatusIcon(overallScore)}
          <span className="font-bold text-lg">{overallScore}%</span>
          {animated && getTrendIcon()}
        </div>
      </div>
    );
  }

  // Full view
  return (
    <Card className={cn(
      'p-4 space-y-3 shadow-lg backdrop-blur-sm bg-opacity-95',
      className
    )}>
      {/* Score Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn(
            'p-3 rounded-full',
            getScoreColor(overallScore).replace('text-', 'bg-').replace('600', '100')
          )}>
            {getStatusIcon(overallScore)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">{overallScore}%</span>
              {animated && getTrendIcon()}
            </div>
            <p className="text-sm text-muted-foreground">Quality Score</p>
          </div>
        </div>
        
        {isGuidance && (
          <Badge
            variant={quality.isAcceptable ? 'default' : 'destructive'}
            className="ml-auto"
          >
            {quality.isAcceptable ? 'Acceptable' : 'Needs Improvement'}
          </Badge>
        )}
      </div>

      {/* Quality Metrics */}
      {showDetails && !isGuidance && (
        <div className="space-y-2">
          <QualityMetric
            label="Sharpness"
            score={quality.sharpness.score}
            icon={<Focus className="h-4 w-4" />}
          />
          <QualityMetric
            label="Lighting"
            score={quality.lighting.score}
            icon={<Sun className="h-4 w-4" />}
          />
          <QualityMetric
            label="Composition"
            score={quality.composition.score}
            icon={<Camera className="h-4 w-4" />}
          />
        </div>
      )}

      {/* Guidance Messages */}
      {isGuidance && quality.messages.length > 0 && (
        <div className="space-y-2">
          {quality.messages.slice(0, 2).map((message, index) => (
            <GuidanceAlert key={index} message={message} />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {!isGuidance && quality.suggestions.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">Quick Tips</p>
          <div className="space-y-1">
            {quality.suggestions.slice(0, 2).map((suggestion, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <span className="text-lg">{suggestion.icon}</span>
                <span className="flex-1">{suggestion.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// Sub-component for quality metrics
const QualityMetric: React.FC<{
  label: string;
  score: number;
  icon: React.ReactNode;
}> = ({ label, score, icon }) => {
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-1">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-medium">{score}%</span>
      </div>
      <Progress 
        value={score} 
        className="h-1.5"
        indicatorClassName={getProgressColor(score)}
      />
    </div>
  );
};

// Sub-component for guidance alerts
const GuidanceAlert: React.FC<{ message: GuidanceMessage }> = ({ message }) => {
  const getAlertStyle = (type: GuidanceMessage['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getIcon = (type: GuidanceMessage['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn(
      'flex items-start space-x-2 p-2 rounded-lg border text-sm',
      getAlertStyle(message.type)
    )}>
      <div className="flex-shrink-0">
        {getIcon(message.type)}
      </div>
      <div className="flex-1 space-y-1">
        <p className="font-medium">{message.message}</p>
        {message.action && (
          <p className="text-xs opacity-80">{message.action}</p>
        )}
      </div>
    </div>
  );
};

// Mobile-optimized floating indicator
export const FloatingQualityIndicator: React.FC<{
  score: number;
  isAcceptable: boolean;
}> = ({ score, isAcceptable }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [score]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className={cn(
        'flex items-center space-x-2 px-4 py-2 rounded-full shadow-xl backdrop-blur-sm border',
        isAcceptable
          ? 'bg-green-50/90 text-green-700 border-green-200'
          : 'bg-red-50/90 text-red-700 border-red-200'
      )}>
        {isAcceptable ? (
          <CheckCircle className="h-5 w-5" />
        ) : (
          <XCircle className="h-5 w-5" />
        )}
        <span className="font-bold">{score}%</span>
      </div>
    </div>
  );
};

// Minimal quality bar for integration into other components
export const QualityBar: React.FC<{
  score: number;
  height?: string;
  showLabel?: boolean;
  className?: string;
}> = ({ score, height = 'h-2', showLabel = false, className }) => {
  const getBarColor = (score: number) => {
    if (score >= 85) return 'bg-green-600';
    if (score >= 70) return 'bg-yellow-600';
    if (score >= 50) return 'bg-orange-600';
    return 'bg-red-600';
  };

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Quality</span>
          <span className="font-medium">{score}%</span>
        </div>
      )}
      <div className={cn('bg-gray-200 rounded-full overflow-hidden', height)}>
        <div
          className={cn(
            'h-full transition-all duration-300',
            getBarColor(score)
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};