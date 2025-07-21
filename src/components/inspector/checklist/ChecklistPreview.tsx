/**
 * Checklist Preview Component
 * Extracted from ChecklistGenerationStep.tsx
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckSquare, Sparkles, Shield, Home } from 'lucide-react';
import { ChecklistItem } from '@/hooks/useChecklistGeneration';

interface ChecklistPreviewProps {
  staticItems: ChecklistItem[];
  aiItems: ChecklistItem[];
  totalItems: number;
  getCategoryColor: (category: string) => string;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'safety':
      return <Shield className="w-4 h-4" />;
    case 'amenity':
      return <Home className="w-4 h-4" />;
    case 'cleanliness':
      return <Sparkles className="w-4 h-4" />;
    default:
      return <CheckSquare className="w-4 h-4" />;
  }
};

export const ChecklistPreview: React.FC<ChecklistPreviewProps> = ({
  staticItems,
  aiItems,
  totalItems,
  getCategoryColor
}) => {
  return (
    <div id="checklist-preview" className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
          <div className="text-xs text-gray-500">Total Items</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{staticItems.length}</div>
          <div className="text-xs text-gray-500">Standard Items</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{aiItems.length}</div>
          <div className="text-xs text-gray-500">AI-Enhanced</div>
        </div>
      </div>

      {/* Standard Items */}
      {staticItems.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Standard Safety Items ({staticItems.length})
          </h4>
          <ScrollArea className="h-32 w-full">
            <div className="space-y-2">
              {staticItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    {getCategoryIcon(item.category)}
                    <span className="text-sm font-medium">{item.title}</span>
                    {item.required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <Badge className={getCategoryColor(item.category)}>
                    {item.category}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* AI-Generated Items */}
      {aiItems.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-500" />
              AI-Enhanced Items ({aiItems.length})
            </h4>
            <ScrollArea className="h-32 w-full">
              <div className="space-y-2">
                {aiItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 flex-1">
                      {getCategoryIcon(item.category)}
                      <span className="text-sm font-medium">{item.title}</span>
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                        AI
                      </Badge>
                      {item.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <Badge className={getCategoryColor(item.category)}>
                      {item.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
};