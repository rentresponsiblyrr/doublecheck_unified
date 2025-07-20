/**
 * PROFESSIONAL COMPONENT - SINGLE RESPONSIBILITY PRINCIPLE
 * Photo Capture Step - Does ONE thing well
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoGuidance } from '@/components/photo/PhotoGuidance';

interface Property {
  id: string;
  address: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  listingUrl?: string;
  images?: string[];
}

interface ChecklistData {
  items: any[];
  estimatedTime: number;
  totalItems: number;
}

interface PhotoResult {
  photo: File;
  analysis: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
}

interface PhotoCaptureStepProps {
  property: Property;
  checklist: ChecklistData;
  inspectionId: string | null;
  onPhotoCapture: (roomType: string) => Promise<PhotoResult>;
  onAllPhotosComplete: () => void;
  onPhotoStored: (itemId: string, photo: File, analysis: any) => void;
}

export function PhotoCaptureStep({
  property,
  checklist,
  inspectionId,
  onPhotoCapture,
  onAllPhotosComplete,
  onPhotoStored
}: PhotoCaptureStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo Documentation</CardTitle>
        <CardDescription>
          Capture photos with AI-powered guidance and analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PhotoGuidance
          checklist={checklist}
          onPhotoCapture={onPhotoCapture}
          onAllPhotosComplete={onAllPhotosComplete}
          onPhotoStored={onPhotoStored}
          inspectionId={inspectionId}
          propertyData={property}
        />
      </CardContent>
    </Card>
  );
}