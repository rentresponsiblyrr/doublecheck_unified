export interface Property {
  id: string;
  name: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  photos: File[];
  notes: string;
  status: string;
}

export interface UploadItem {
  id: string;
  type: "photo" | "video" | "data";
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "completed" | "failed";
  error?: string;
}

export interface UploadSyncStepProps {
  property: Property;
  checklistItems: ChecklistItem[];
  onComplete: (inspectionId: string) => void;
  onBack?: () => void;
  className?: string;
}

export interface UploadProgress {
  currentStep: string;
  totalProgress: number;
  isUploading: boolean;
  isOnline: boolean;
}
