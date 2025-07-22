import React from 'react';
import { PhotoCaptureContainer } from './camera/PhotoCaptureContainer';

interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  required: boolean;
  evidence_type: string;
  description?: string;
  completed?: boolean;
  photos?: File[];
}

interface PhotoCaptureStepProps {
  checklist: ChecklistItem[];
  onPhotosUpdate: (itemId: string, photos: File[]) => void;
  onStepComplete: () => void;
  className?: string;
}

const PhotoCaptureStep: React.FC<PhotoCaptureStepProps> = ({
  checklist,
  onPhotosUpdate,
  onStepComplete,
  className = ''
}) => {
  return (
    <PhotoCaptureContainer
      checklist={checklist}
      onPhotosUpdate={onPhotosUpdate}
      onStepComplete={onStepComplete}
      className={className}
    />
  );
};

export default PhotoCaptureStep;