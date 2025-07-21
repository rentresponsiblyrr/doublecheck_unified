/**
 * Inspection Overview Tab Component
 * Extracted from InspectionReviewPanel.tsx
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Inspection } from '@/hooks/useInspectionReview';

interface InspectionOverviewTabProps {
  inspection: Inspection;
}

export const InspectionOverviewTab: React.FC<InspectionOverviewTabProps> = ({ inspection }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspection Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Property Information</h4>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Address:</span> {inspection.propertyAddress}</div>
              <div><span className="font-medium">Property ID:</span> {inspection.propertyId}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Inspector Information</h4>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Name:</span> {inspection.inspectorName}</div>
              <div><span className="font-medium">Inspector ID:</span> {inspection.inspectorId}</div>
              <div><span className="font-medium">Submitted:</span> {new Date(inspection.submittedAt).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {inspection.issuesFound > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Issues Require Attention</AlertTitle>
            <AlertDescription>
              This inspection has {inspection.issuesFound} flagged issues that require careful review.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};