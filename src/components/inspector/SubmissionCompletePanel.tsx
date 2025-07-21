/**
 * Submission Complete Panel Component
 * Extracted from ProductionInspectionWorkflow.tsx
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { ProductionProperty } from '@/services/productionDatabaseService';

interface SubmissionCompletePanelProps {
  selectedProperty: ProductionProperty | null;
  inspectionId: string | null;
  completedItemsCount: number;
  totalItemsCount: number;
  onNewInspection: () => void;
}

export const SubmissionCompletePanel: React.FC<SubmissionCompletePanelProps> = ({
  selectedProperty,
  inspectionId,
  completedItemsCount,
  totalItemsCount,
  onNewInspection
}) => {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-green-600 mb-2">Inspection Submitted Successfully!</h2>
        <p className="text-gray-600 mb-6">
          Your inspection for "{selectedProperty?.property_name}" has been submitted for review.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Inspection ID:</span><br />
              {inspectionId}
            </div>
            <div>
              <span className="font-medium">Items Completed:</span><br />
              {completedItemsCount} of {totalItemsCount}
            </div>
          </div>
        </div>
        
        <Button onClick={onNewInspection}>
          Start New Inspection
        </Button>
      </CardContent>
    </Card>
  );
};