/**
 * INSPECTION QUICK ACTIONS - ENTERPRISE EXCELLENCE
 * 
 * Focused component for inspection action buttons:
 * - Save progress functionality with professional feedback
 * - Navigation controls (back button)
 * - Help and tips section with best practices
 * - Professional error handling and accessibility
 * - Mobile-optimized touch targets
 * 
 * Extracted from InspectionStepsSidebar.tsx as part of architectural excellence
 * 
 * @author STR Certified Engineering Team
 * @version 2.0.0 - Phase 1C Excellence
 */

import React, { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

export interface InspectionQuickActionsProps {
  onSaveProgress?: () => void;
  onGoBack?: () => void;
  showTips?: boolean;
  className?: string;
}

/**
 * Default tips for inspection best practices
 */
const INSPECTION_TIPS = [
  'Take clear, well-lit photos of all required items',
  'Record a comprehensive video walkthrough',
  'Ensure stable internet for upload',
  'Your progress is saved automatically'
];

/**
 * Inspection Quick Actions Component
 */
export const InspectionQuickActions: React.FC<InspectionQuickActionsProps> = ({
  onSaveProgress,
  onGoBack,
  showTips = true,
  className = ''
}) => {
  const { toast } = useToast();

  /**
   * Handle save progress with user feedback
   */
  const handleSaveProgress = useCallback(async () => {
    try {
      if (onSaveProgress) {
        await onSaveProgress();
      }
      
      toast({
        title: "Progress Saved",
        description: "Your inspection progress has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save progress. Please try again.",
        variant: "destructive"
      });
    }
  }, [onSaveProgress, toast]);

  /**
   * Handle go back navigation
   */
  const handleGoBack = useCallback(() => {
    if (onGoBack) {
      onGoBack();
    } else {
      // Default navigation behavior
      window.history.back();
    }
  }, [onGoBack]);

  return (
    <div className={className}>
      {/* Quick Actions */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="space-y-3">
            <h5 className="font-medium text-gray-900">Quick Actions</h5>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start focus:ring-2 focus:ring-blue-500"
                onClick={handleSaveProgress}
                aria-describedby="save-progress-description"
              >
                <Clock className="w-4 h-4 mr-2" aria-hidden="true" />
                Save Progress
              </Button>
              <div id="save-progress-description" className="sr-only">
                Save your current inspection progress
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start focus:ring-2 focus:ring-blue-500"
                onClick={handleGoBack}
                aria-describedby="go-back-description"
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" aria-hidden="true" />
                Go Back
              </Button>
              <div id="go-back-description" className="sr-only">
                Go back to previous page
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help/Tips */}
      {showTips && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-500" aria-hidden="true" />
                <h5 className="font-medium text-gray-900">Tips</h5>
              </div>
              
              <ul className="text-xs text-gray-600 space-y-2" role="list">
                {INSPECTION_TIPS.map((tip, index) => (
                  <li key={index} className="flex items-start" role="listitem">
                    <span className="mr-2 text-blue-500" aria-hidden="true">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
