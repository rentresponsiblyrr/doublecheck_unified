import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Camera } from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  required: boolean;
  evidence_type: string;
  description?: string;
  completed?: boolean;
}

interface CaptureProgressProps {
  checklist: ChecklistItem[];
  capturedPhotos: { [itemId: string]: File[] };
  currentItemIndex: number;
  onItemSelect: (index: number) => void;
}

export const CaptureProgress: React.FC<CaptureProgressProps> = ({
  checklist,
  capturedPhotos,
  currentItemIndex,
  onItemSelect
}) => {
  const completedItems = checklist.filter(item => 
    capturedPhotos[item.id] && capturedPhotos[item.id].length > 0
  ).length;
  
  const progressPercentage = (completedItems / checklist.length) * 100;
  const currentItem = checklist[currentItemIndex];

  return (
    <Card id="capture-progress-card">
      <CardHeader id="progress-header">
        <CardTitle className="flex items-center justify-between">
          Photo Capture Progress
          <Badge variant="secondary" id="progress-counter-badge">
            {completedItems}/{checklist.length}
          </Badge>
        </CardTitle>
        <Progress 
          value={progressPercentage} 
          className="w-full" 
          id="capture-progress-bar"
        />
      </CardHeader>
      
      <CardContent id="progress-content">
        <div id="current-item-section" className="mb-4">
          <h4 className="font-medium mb-2">Current Item:</h4>
          {currentItem && (
            <div id="current-item-details" className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">{currentItem.title}</span>
                <Badge variant={currentItem.required ? 'destructive' : 'secondary'}>
                  {currentItem.required ? 'Required' : 'Optional'}
                </Badge>
              </div>
              {currentItem.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentItem.description}
                </p>
              )}
            </div>
          )}
        </div>
        
        <div id="checklist-overview" className="space-y-2">
          <h4 className="font-medium">Checklist Overview:</h4>
          <div id="checklist-items-grid" className="grid gap-2">
            {checklist.map((item, index) => {
              const isCompleted = capturedPhotos[item.id] && capturedPhotos[item.id].length > 0;
              const isCurrent = index === currentItemIndex;
              const photoCount = capturedPhotos[item.id]?.length || 0;
              
              return (
                <div
                  key={item.id}
                  id={`checklist-item-${item.id}`}
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    isCurrent 
                      ? 'border-primary bg-primary/10' 
                      : isCompleted 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onItemSelect(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Camera className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium truncate">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {photoCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {photoCount} photo{photoCount > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {item.required && (
                        <Badge variant="outline" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};