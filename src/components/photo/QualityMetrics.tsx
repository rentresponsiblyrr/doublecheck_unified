/**
 * Quality Metrics - Photo quality display component
 * Extracted from PhotoComparisonView.tsx
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, Activity } from 'lucide-react';
import type { PhotoQualityMetrics } from '../../types/photo-comparison';

interface QualityMetricsProps {
  metrics: PhotoQualityMetrics;
}

export const QualityMetrics: React.FC<QualityMetricsProps> = ({ metrics }) => {
  const getQualityBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 0.6) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (score >= 0.4) return <Badge variant="secondary">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const qualityItems = [
    { label: 'Overall Quality', value: metrics.overallScore, key: 'overall' },
    { label: 'Sharpness', value: metrics.sharpness, key: 'sharpness' },
    { label: 'Brightness', value: metrics.brightness, key: 'brightness' },
    { label: 'Contrast', value: metrics.contrast, key: 'contrast' },
    { label: 'Color Balance', value: metrics.colorBalance, key: 'color' },
    { label: 'Noise Level', value: 1 - metrics.noise, key: 'noise', inverted: true }
  ];

  return (
    <div id="quality-metrics" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Photo Quality Analysis
            {getQualityBadge(metrics.overallScore)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {qualityItems.map((item) => (
              <div key={item.key} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span>{Math.round(item.value * 100)}%</span>
                </div>
                <Progress 
                  value={item.value * 100} 
                  className={`h-2 ${
                    item.value >= 0.8 ? 'bg-green-100' :
                    item.value >= 0.6 ? 'bg-blue-100' :
                    item.value >= 0.4 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Technical Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Resolution:</span>
                <span className="ml-2">{metrics.resolution}</span>
              </div>
              <div>
                <span className="font-medium">File Size:</span>
                <span className="ml-2">{metrics.fileSize}</span>
              </div>
            </div>
            
            {metrics.issues && metrics.issues.length > 0 && (
              <div>
                <span className="font-medium">Detected Issues:</span>
                <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                  {metrics.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {metrics.recommendations && metrics.recommendations.length > 0 && (
              <div>
                <span className="font-medium">Recommendations:</span>
                <ul className="list-disc list-inside mt-1 space-y-1 text-blue-600">
                  {metrics.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
