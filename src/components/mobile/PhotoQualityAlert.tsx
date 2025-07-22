/**
 * Photo Quality Alert - Focused Component
 * 
 * Displays quality warnings and guidance messages
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PhotoQualityAlertProps {
  hasQualityIssues: boolean;
  qualityScore: number;
  className?: string;
}

export const PhotoQualityAlert: React.FC<PhotoQualityAlertProps> = ({
  hasQualityIssues,
  qualityScore,
  className
}) => {
  if (!hasQualityIssues) return null;

  return (
    <Alert className={`border-yellow-200 bg-yellow-50 ${className}`} id="photo-quality-alert">
      <AlertDescription className="text-yellow-800">
        Photo quality issues detected (Score: {qualityScore}%). Consider following the guidance above before capturing.
      </AlertDescription>
    </Alert>
  );
};
