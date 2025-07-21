/**
 * Comparison Results - Analysis display component
 * Extracted from PhotoComparisonView.tsx
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Target, Sparkles } from 'lucide-react';
import type { PhotoComparisonResult } from '../../types/photo-comparison';

interface ComparisonResultsProps {
  result: PhotoComparisonResult;
}

export const ComparisonResults: React.FC<ComparisonResultsProps> = ({ result }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'match': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'mismatch': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'partial': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Target className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'match': return <Badge className="bg-green-100 text-green-800">Match</Badge>;
      case 'mismatch': return <Badge variant="destructive">Mismatch</Badge>;
      case 'partial': return <Badge variant="secondary">Partial Match</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div id="comparison-results" className="space-y-6">
      {/* Overall Comparison Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(result.overallMatch)}
            Overall Comparison Result
            {getStatusBadge(result.overallMatch)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Similarity Score</span>
                <span>{Math.round(result.similarityScore * 100)}%</span>
              </div>
              <Progress value={result.similarityScore * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Confidence Level</span>
                <span>{Math.round(result.confidence * 100)}%</span>
              </div>
              <Progress value={result.confidence * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis */}
      {result.aiAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-700">{result.aiAnalysis.summary}</p>
              
              {result.aiAnalysis.keyFindings.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Key Findings:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {result.aiAnalysis.keyFindings.map((finding, index) => (
                      <li key={index}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discrepancies */}
      {result.discrepancies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">
              Discrepancies Found ({result.discrepancies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.discrepancies.map((discrepancy, index) => (
                <Alert key={index} className="border-red-200">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">{discrepancy.type}</p>
                      <p className="text-sm">{discrepancy.description}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Severity: {discrepancy.severity}</span>
                        <span>Confidence: {Math.round(discrepancy.confidence * 100)}%</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
