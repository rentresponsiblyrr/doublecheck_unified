/**
 * PROFESSIONAL COMPONENT - SINGLE RESPONSIBILITY PRINCIPLE
 * Upload & Sync Step - Does ONE thing well
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OfflineSync } from '@/components/mobile/OfflineSync';

interface InspectionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  required: boolean;
  data?: unknown;
}

interface UploadSyncStepProps {
  inspectionData: InspectionStep[];
  propertyId: string;
  progress: number;
  onSyncComplete: () => void;
}

export function UploadSyncStep({
  inspectionData,
  propertyId,
  progress,
  onSyncComplete
}: UploadSyncStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload & Sync Data</CardTitle>
        <CardDescription>
          Sync all inspection data and media to the cloud
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OfflineSync
          inspectionData={inspectionData}
          propertyId={propertyId}
          onSyncComplete={onSyncComplete}
          progress={progress}
        />
      </CardContent>
    </Card>
  );
}