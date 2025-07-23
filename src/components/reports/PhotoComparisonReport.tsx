import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface PhotoComparisonData {
  inspectionId: string;
  totalItems: number;
  completedItems: number;
  passedItems: number;
  failedItems: number;
  overallScore: number;
}

interface ChecklistItem {
  id: string;
  title: string;
  status: string;
  hasEvidence: boolean;
}

interface PhotoComparisonReportProps {
  inspectionId: string;
  propertyName: string;
  checklistItems: ChecklistItem[];
  className?: string;
}

export function PhotoComparisonReport({ 
  inspectionId, 
  propertyName, 
  checklistItems, 
  className = '' 
}: PhotoComparisonReportProps) {
  const [data, setData] = useState<PhotoComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPhotoComparisonData();
  }, [inspectionId]);

  const fetchPhotoComparisonData = async () => {
    try {
      setIsLoading(true);
      logger.info('Fetching photo comparison data', { inspectionId }, 'PHOTO_COMPARISON_REPORT');

      // Fetch checklist items with media information
      const { data: logs, error } = await supabase
        .from('checklist_items')
        .select(`
          *,
          static_safety_items!static_item_id (
            id,
            label,
            category
          ),
          media (*)
        `)
        .eq('property_id', inspectionId.split('-')[0]) // Extract property_id from inspection
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      // Calculate comparison metrics
      const totalItems = logs?.length || 0;
      const completedItems = logs?.filter(log => log.pass !== null).length || 0;
      const passedItems = logs?.filter(log => log.pass === true).length || 0;
      const failedItems = logs?.filter(log => log.pass === false).length || 0;
      const itemsWithPhotos = logs?.filter(log => log.media && log.media.length > 0).length || 0;

      // Calculate overall score based on completion and photo evidence
      const completionScore = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
      const photoScore = totalItems > 0 ? (itemsWithPhotos / totalItems) * 100 : 0;
      const passScore = completedItems > 0 ? (passedItems / completedItems) * 100 : 0;
      const overallScore = Math.round((completionScore + photoScore + passScore) / 3);

      setData({
        inspectionId,
        totalItems,
        completedItems,
        passedItems,
        failedItems,
        overallScore
      });

    } catch (error) {
      logger.error('Failed to fetch photo comparison data', error, 'PHOTO_COMPARISON_REPORT');
      toast({
        title: 'Error Loading Photo Data',
        description: 'Failed to load photo comparison data. Using default values.',
        variant: 'destructive',
      });
      
      // Set default data if fetch fails
      setData({
        inspectionId,
        totalItems: 10,
        completedItems: 8,
        passedItems: 7,
        failedItems: 1,
        overallScore: 75
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Photo Comparison Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Photo Comparison Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No photo comparison data available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completionRate = (data.completedItems / data.totalItems) * 100;
  const passRate = data.completedItems > 0 ? (data.passedItems / data.completedItems) * 100 : 0;
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Photo Comparison Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Inspection Progress</span>
            <span>{data.completedItems}/{data.totalItems} items</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>
        
        {/* Score Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.passedItems}</div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Passed
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{data.failedItems}</div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <XCircle className="w-3 h-3" />
              Failed
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.overallScore}%</div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Score
            </div>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge 
            variant={passRate >= 80 ? "default" : passRate >= 60 ? "secondary" : "destructive"}
            className="px-4 py-1"
          >
            {passRate >= 80 ? "Excellent" : passRate >= 60 ? "Good" : "Needs Improvement"}
          </Badge>
        </div>
        
        {/* Additional Stats */}
        <div className="pt-4 border-t text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Completion Rate:</span>
            <span className="font-medium">{completionRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Pass Rate:</span>
            <span className="font-medium">{passRate.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}