/**
 * Inspection Header Component
 * Extracted from ProductionInspectionWorkflow.tsx
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

interface InspectionHeaderProps {
  currentUser: string | null;
  showNewInspectionButton: boolean;
  onNewInspection: () => void;
}

export const InspectionHeader: React.FC<InspectionHeaderProps> = ({
  currentUser,
  showNewInspectionButton,
  onNewInspection
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Inspection Workflow</h1>
        <div className="flex items-center space-x-2 text-gray-600 mt-1">
          <User className="w-4 h-4" />
          <span>Role: {currentUser}</span>
        </div>
      </div>
      {showNewInspectionButton && (
        <Button variant="outline" onClick={onNewInspection}>
          Start New Inspection
        </Button>
      )}
    </div>
  );
};