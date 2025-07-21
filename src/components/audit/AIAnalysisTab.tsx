/**
 * AI Analysis Tab Component
 * Extracted from InspectionReviewPanel.tsx
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { AIAnalysis } from '@/hooks/useInspectionReview';

interface AIAnalysisTabProps {
  analysis: AIAnalysis;
}

export const AIAnalysisTab: React.FC<AIAnalysisTabProps> = ({ analysis }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Analysis Results</CardTitle>
        <CardDescription>
          Automated analysis with {analysis.confidence}% confidence
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{analysis.overallScore}%</div>
            <div className="text-sm text-blue-800">Overall Score</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{analysis.completedItems}/{analysis.totalItems}</div>
            <div className="text-sm text-green-800">Items Completed</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{analysis.confidence}%</div>
            <div className="text-sm text-yellow-800">AI Confidence</div>
          </div>
        </div>

        {analysis.issues.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Flagged Issues</h4>
            <div className="space-y-2">
              {analysis.issues.map((issue) => (
                <div key={issue.id} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="font-medium">{issue.label}</span>
                      <Badge variant="outline">{issue.category}</Badge>
                    </div>
                    <Badge variant="destructive">{issue.ai_status}</Badge>
                  </div>
                  {issue.notes && (
                    <p className="text-sm text-red-700 mt-2">{issue.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">AI Recommendations</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              {analysis.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};