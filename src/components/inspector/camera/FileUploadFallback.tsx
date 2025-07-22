import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileImage, AlertTriangle } from 'lucide-react';
import { logger } from '@/utils/logger';

interface FileUploadFallbackProps {
  onFileSelected: (file: File) => void;
  onError: (error: Error) => void;
  accept?: string;
  maxSizeBytes?: number;
  cameraError?: string;
}

export const FileUploadFallback: React.FC<FileUploadFallbackProps> = ({
  onFileSelected,
  onError,
  accept = 'image/*',
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  cameraError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const error = new Error('Please select a valid image file');
      logger.warn('Invalid file type selected', {
        component: 'FileUploadFallback',
        fileType: file.type,
        fileName: file.name,
        action: 'file_validation'
      });
      onError(error);
      return;
    }

    // Validate file size
    if (file.size > maxSizeBytes) {
      const error = new Error(`File size must be less than ${Math.round(maxSizeBytes / (1024 * 1024))}MB`);
      logger.warn('File size exceeds limit', {
        component: 'FileUploadFallback',
        fileSize: file.size,
        maxSize: maxSizeBytes,
        fileName: file.name,
        action: 'file_validation'
      });
      onError(error);
      return;
    }

    logger.info('File selected successfully', {
      component: 'FileUploadFallback',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      action: 'file_selection'
    });

    onFileSelected(file);
    
    // Clear input for potential re-upload
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="file-upload-fallback-container" className="space-y-4">
      {cameraError && (
        <Alert id="camera-error-alert">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {cameraError}
          </AlertDescription>
        </Alert>
      )}
      
      <div id="upload-section" className="text-center space-y-4">
        <div id="upload-icon-container" className="flex justify-center">
          <FileImage className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <div id="upload-text-container">
          <p className="text-sm text-muted-foreground">
            {cameraError ? 'Camera unavailable. Please upload a photo instead.' : 'Or upload a photo from your device'}
          </p>
        </div>
        
        <Button
          onClick={triggerFileSelect}
          variant="outline"
          size="lg"
          className="w-full"
          id="upload-file-button"
        >
          <Upload className="w-5 h-5 mr-2" />
          Choose Photo
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload-input"
        />
      </div>
    </div>
  );
};