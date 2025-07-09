// Photo Comparison Report Component - Specialized report for photo analysis
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Download, Image, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { reportService, type PhotoComparisonData } from '@/services/reportService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface PhotoComparisonReportProps {
  inspectionId: string;
  propertyName: string;
  checklistItems: Array<{
    id: string;
    title: string;
    ai_status: string;
    ai_confidence: number;
    ai_reasoning: string;
    media_files: Array<{
      id: string;
      type: 'photo' | 'video';
      url: string;
      file_name: string;
    }>;
  }>;
}

export const PhotoComparisonReport: React.FC<PhotoComparisonReportProps> = ({
  inspectionId,
  propertyName,
  checklistItems
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [comparisons, setComparisons] = useState<PhotoComparisonData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Prepare photo comparison data from checklist items
    const photoComparisons: PhotoComparisonData[] = [];
    
    checklistItems.forEach(item => {
      const photos = item.media_files.filter(m => m.type === 'photo');
      
      if (photos.length > 0) {
        photos.forEach(photo => {
          photoComparisons.push({
            referencePhoto: '', // Would need to be populated from property listing
            inspectionPhoto: photo.url,
            aiAnalysis: {
              score: item.ai_confidence,
              confidence: item.ai_confidence,
              reasoning: item.ai_reasoning,
              issues: item.ai_status === 'fail' ? [item.ai_reasoning] : []
            },
            auditorFeedback: undefined // Would be populated from audit feedback
          });
        });
      }
    });
    
    setComparisons(photoComparisons);
  }, [checklistItems]);

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      logger.info('Generating photo comparison report', { inspectionId, comparisons: comparisons.length }, 'PHOTO_COMPARISON_REPORT');

      const result = await reportService.generatePhotoComparisonReport(inspectionId, comparisons);
      
      if (result.success && result.data) {
        const fileName = `${propertyName.replace(/[^a-zA-Z0-9]/g, '_')}_Photo_Comparison_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        await reportService.downloadReport(result.data, fileName);
        
        toast({
          title: 'Photo Comparison Report Generated',
          description: `Report saved as ${fileName}`,
          duration: 5000,
        });
      } else {
        throw new Error(result.error || 'Failed to generate report');
      }
    } catch (error) {
      logger.error('Photo comparison report generation failed', error, 'PHOTO_COMPARISON_REPORT');
      toast({
        title: 'Report Generation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'needs_review':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'needs_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5" />
          Photo Comparison Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {checklistItems.reduce((sum, item) => sum + item.media_files.filter(m => m.type === 'photo').length, 0)}
            </div>
            <div className="text-sm text-blue-700">Total Photos</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {checklistItems.filter(item => item.ai_status === 'pass').length}
            </div>
            <div className="text-sm text-green-700">Passed Items</div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {checklistItems.filter(item => item.ai_status === 'fail').length}
            </div>
            <div className="text-sm text-red-700">Failed Items</div>
          </div>
        </div>

        {/* Photo Analysis Preview */}
        <div className="space-y-4">
          <h4 className="font-medium">Photo Analysis Results</h4>
          
          {checklistItems.slice(0, 5).map(item => {
            const photos = item.media_files.filter(m => m.type === 'photo');
            
            if (photos.length === 0) return null;
            
            return (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{item.title}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(item.ai_status)}
                      <Badge className={`text-xs ${getStatusColor(item.ai_status)}`}>
                        {item.ai_status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {item.ai_confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {photos.length} photo{photos.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {item.ai_reasoning && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {item.ai_reasoning}
                  </p>
                )}
                
                {/* Photo thumbnails */}
                <div className="flex gap-2 overflow-x-auto">
                  {photos.slice(0, 3).map(photo => (
                    <div key={photo.id} className="flex-shrink-0">
                      <img 
                        src={photo.url} 
                        alt={photo.file_name}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    </div>
                  ))}
                  {photos.length > 3 && (
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                      <span className="text-xs text-gray-500">+{photos.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {checklistItems.length > 5 && (
            <div className="text-sm text-gray-500 text-center py-2">
              ... and {checklistItems.length - 5} more items
            </div>
          )}
        </div>

        {/* Generation Button */}
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateReport}
            disabled={isGenerating || comparisons.length === 0}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate Photo Comparison Report
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p>This report focuses on photo analysis results and AI confidence scores.</p>
              <p className="mt-1">Perfect for reviewing visual evidence and photo quality assessments.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhotoComparisonReport;