/**
 * Inspection Review Panel Component - SURGICALLY REFACTORED
 * 
 * SURGICAL REFACTORING APPLIED:
 * ✅ Extracted business logic to useInspectionReview hook
 * ✅ Decomposed into focused sub-components
 * ✅ Preserved exact functionality and behavior
 * ✅ Maintained type safety and review workflow
 * ✅ Reduced from 484 lines to <300 lines using composition
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye } from 'lucide-react';

// Extracted business logic hook
import { useInspectionReview, Inspection } from '@/hooks/useInspectionReview';

// Extracted UI components
import { InspectionHeaderCard } from './InspectionHeaderCard';
import { InspectionOverviewTab } from './InspectionOverviewTab';
import { MediaReviewTab } from './MediaReviewTab';
import { AIAnalysisTab } from './AIAnalysisTab';
import { ReviewDecisionPanel } from './ReviewDecisionPanel';

interface InspectionReviewPanelProps {
  inspection: Inspection | null;
  isLoading: boolean;
  onApprove: (inspectionId: string, feedback: string) => Promise<void>;
  onReject: (inspectionId: string, feedback: string) => Promise<void>;
  onRequestRevision: (inspectionId: string, feedback: string) => Promise<void>;
}

export const InspectionReviewPanel: React.FC<InspectionReviewPanelProps> = ({
  inspection,
  isLoading,
  onApprove,
  onReject,
  onRequestRevision
}) => {
  const {
    activeTab,
    setActiveTab,
    reviewDecision,
    setReviewDecision,
    feedbackText,
    setFeedbackText,
    isSubmitting,
    aiAnalysis,
    handleSubmitDecision,
    getScoreColor,
    getScoreBadgeVariant
  } = useInspectionReview(inspection, onApprove, onReject, onRequestRevision);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-gray-600">Loading inspection details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!inspection) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Inspection Selected</h3>
          <p className="text-gray-600">Select an inspection from the queue to begin your review.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inspection Header */}
      <InspectionHeaderCard
        inspection={inspection}
        getScoreColor={getScoreColor}
        getScoreBadgeVariant={getScoreBadgeVariant}
      />

      {/* Review Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <InspectionOverviewTab inspection={inspection} />
        </TabsContent>

        <TabsContent value="photos">
          <MediaReviewTab type="photos" count={inspection.photoCount} />
        </TabsContent>

        <TabsContent value="videos">
          <MediaReviewTab type="videos" count={inspection.videoCount} />
        </TabsContent>

        <TabsContent value="ai-analysis">
          {aiAnalysis && <AIAnalysisTab analysis={aiAnalysis} />}
        </TabsContent>
      </Tabs>

      {/* Review Decision Panel */}
      <ReviewDecisionPanel
        reviewDecision={reviewDecision}
        setReviewDecision={setReviewDecision}
        feedbackText={feedbackText}
        setFeedbackText={setFeedbackText}
        isSubmitting={isSubmitting}
        onSubmitDecision={handleSubmitDecision}
      />
    </div>
  );
};