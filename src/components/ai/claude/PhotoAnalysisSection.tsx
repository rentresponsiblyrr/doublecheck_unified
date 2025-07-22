import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, Upload } from 'lucide-react';
import { createClaudeService, ClaudeAnalysisRequest } from '@/lib/ai/claude-service';

interface ClaudeAnalysisResult {
  confidence: number;
  issues: Array<{
    severity: 'low' | 'medium' | 'high';
    description: string;
    location?: string;
    suggestions: string[];
  }>;
  recommendations: string[];
  processingTime: number;
  status: 'success' | 'error' | 'processing';
}

interface PhotoAnalysisSectionProps {
  inspectionId?: string;
  checklistItemId?: string;
  isLoading: boolean;
  error: string | null;
  result: ClaudeAnalysisResult | null;
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: ClaudeAnalysisResult) => void;
  onError: (error: string) => void;
}

export const PhotoAnalysisSection: React.FC<PhotoAnalysisSectionProps> = ({
  inspectionId,
  checklistItemId,
  isLoading,
  error,
  result,
  onAnalysisStart,
  onAnalysisComplete,
  onError
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const claudeService = createClaudeService();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError('Please select a valid image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onError('Image file must be less than 10MB');
      return;
    }
    setImageFile(file);
  };

  const handlePhotoAnalysis = useCallback(async () => {
    if (!imageFile) {
      onError('Please select an image file');
      return;
    }

    onAnalysisStart();

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        const request: ClaudeAnalysisRequest = {
          imageBase64: base64,
          prompt: 'Analyze this property inspection photo for compliance and safety issues',
          inspectionId,
          checklistItemId,
          context: {
            propertyType: 'vacation_rental',
            inspectionType: 'safety_compliance'
          }
        };

        const response = await claudeService.analyzeInspectionPhoto(request);
        onAnalysisComplete(response);
      };
      reader.readAsDataURL(imageFile);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Photo analysis failed');
    }
  }, [imageFile, inspectionId, checklistItemId, claudeService, onAnalysisStart, onAnalysisComplete, onError]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div id="photo-analysis-section" className="space-y-4">
      <Card id="photo-upload-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Photo Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent id="photo-upload-content">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/10' : 'border-muted-foreground'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            id="photo-drop-zone"
          >
            {imageFile ? (
              <div className="space-y-2">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Selected"
                  className="max-h-32 mx-auto rounded"
                  id="photo-preview"
                />
                <p className="text-sm font-medium">{imageFile.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drop an image here or click to select
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
              id="photo-file-input"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => document.getElementById('photo-file-input')?.click()}
              id="select-photo-button"
            >
              Select Photo
            </Button>
          </div>
          
          <Button
            onClick={handlePhotoAnalysis}
            disabled={!imageFile || isLoading}
            className="w-full mt-4"
            id="analyze-photo-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Photo'
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" id="photo-error-alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};