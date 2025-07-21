/**
 * Photo Quality Assistant Component
 * Real-time photo quality analysis, guidance, and feedback
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle, 
  Camera,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';
import { usePhotoGuidance } from '@/hooks/usePhotoGuidance';
import { usePhotoComparison } from '@/hooks/usePhotoComparison';
import type { PhotoGuidance, ChecklistItem } from '@/types/photo';

interface PhotoQualityAssistantProps {
  checklistItem: ChecklistItem;
  referencePhotoUrl?: string;
  videoStream?: MediaStream;
  onQualityUpdate: (quality: PhotoGuidance | null) => void;
  showGuidance: boolean;
  onToggleGuidance: (show: boolean) => void;
  className?: string;
}

export const PhotoQualityAssistant: React.FC<PhotoQualityAssistantProps> = ({
  checklistItem,
  referencePhotoUrl,
  videoStream,
  onQualityUpdate,
  showGuidance,
  onToggleGuidance,
  className
}) => {
  const [analysisActive, setAnalysisActive] = useState(true);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  const {
    guidance,
    isAnalyzing,
    analyzeCurrentFrame,
    clearGuidance
  } = usePhotoGuidance(checklistItem);

  const {
    comparison,
    compareWithReference,
    isComparing
  } = usePhotoComparison();

  // Continuous quality analysis
  useEffect(() => {
    if (!videoStream || !analysisActive) return;

    const interval = setInterval(() => {
      analyzeCurrentFrame();
      setLastAnalysis(new Date());
    }, 2000); // Analyze every 2 seconds

    return () => clearInterval(interval);
  }, [videoStream, analysisActive, analyzeCurrentFrame]);

  // Update parent component with current quality
  useEffect(() => {
    onQualityUpdate(guidance);
  }, [guidance, onQualityUpdate]);

  const getQualityScore = () => {
    if (!guidance) return 0;
    
    const maxScore = 100;
    const issueCount = guidance.messages.filter(m => m.type === 'error').length;
    const warningCount = guidance.messages.filter(m => m.type === 'warning').length;
    
    return Math.max(0, maxScore - (issueCount * 30) - (warningCount * 10));
  };

  const getQualityStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const qualityScore = getQualityScore();
  const qualityStatus = getQualityStatus(qualityScore);

  return (
    <div className={className}>
      {/* Quality Score Header */}
      <Card className="mb-4">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Photo Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${qualityStatus.color} ${qualityStatus.bg}`}>
                {qualityStatus.label}
              </Badge>
              <button
                onClick={() => onToggleGuidance(!showGuidance)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {showGuidance ? (
                  <Eye className="w-4 h-4 text-gray-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Quality Score</span>
              <span className={qualityStatus.color}>{qualityScore}/100</span>
            </div>
            <Progress value={qualityScore} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Target: 80+</span>
              {lastAnalysis && (
                <span>Updated: {lastAnalysis.toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Guidance Messages */}
      {showGuidance && guidance && guidance.messages.length > 0 && (
        <Card className="mb-4">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">Photography Guidance</span>
            </div>
            
            <div className="space-y-2">
              {guidance.messages.map((message, index) => (
                <Alert 
                  key={index} 
                  className={
                    message.type === 'error' ? 'border-red-200 bg-red-50' :
                    message.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-green-200 bg-green-50'
                  }
                >
                  {message.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : message.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  <AlertDescription className={
                    message.type === 'error' ? 'text-red-800' :
                    message.type === 'warning' ? 'text-yellow-800' :
                    'text-green-800'
                  }>
                    {message.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Reference Comparison */}
      {referencePhotoUrl && comparison && (
        <Card className="mb-4">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-5 h-5 text-purple-500" />
              <span className="font-medium">Reference Comparison</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Similarity</span>
                <span className={
                  comparison.similarity > 0.8 ? 'text-green-600' :
                  comparison.similarity > 0.6 ? 'text-yellow-600' :
                  'text-red-600'
                }>
                  {(comparison.similarity * 100).toFixed(0)}%
                </span>
              </div>
              <Progress value={comparison.similarity * 100} className="h-2" />
              
              {comparison.suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Suggestions:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {comparison.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Zap className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Analysis Status */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isAnalyzing ? 'bg-blue-500 animate-pulse' :
                analysisActive ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-600">
                {isAnalyzing ? 'Analyzing...' :
                 analysisActive ? 'Real-time analysis active' :
                 'Analysis paused'}
              </span>
            </div>
            <button
              onClick={() => setAnalysisActive(!analysisActive)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {analysisActive ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};