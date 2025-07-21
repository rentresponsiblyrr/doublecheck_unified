/**
 * Review Decision Panel Component
 * Extracted from InspectionReviewPanel.tsx
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  CheckCircle
} from 'lucide-react';
import { ReviewDecision } from '@/hooks/useInspectionReview';

interface ReviewDecisionPanelProps {
  reviewDecision: ReviewDecision;
  setReviewDecision: (decision: ReviewDecision) => void;
  feedbackText: string;
  setFeedbackText: (text: string) => void;
  isSubmitting: boolean;
  onSubmitDecision: () => void;
}

export const ReviewDecisionPanel: React.FC<ReviewDecisionPanelProps> = ({
  reviewDecision,
  setReviewDecision,
  feedbackText,
  setFeedbackText,
  isSubmitting,
  onSubmitDecision
}) => {
  const getPlaceholderText = () => {
    switch (reviewDecision) {
      case 'approved':
        return 'Provide positive feedback and any suggestions...';
      case 'rejected':
        return 'Explain the reasons for rejection...';
      case 'needs_revision':
        return 'Detail what needs to be revised...';
      default:
        return 'Select a decision above and provide your feedback...';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Decision</CardTitle>
        <CardDescription>
          Provide your assessment and feedback for this inspection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-3">
          <Button
            variant={reviewDecision === 'approved' ? 'default' : 'outline'}
            onClick={() => setReviewDecision('approved')}
            className="flex-1"
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Approve
          </Button>
          
          <Button
            variant={reviewDecision === 'needs_revision' ? 'default' : 'outline'}
            onClick={() => setReviewDecision('needs_revision')}
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Request Revision
          </Button>
          
          <Button
            variant={reviewDecision === 'rejected' ? 'destructive' : 'outline'}
            onClick={() => setReviewDecision('rejected')}
            className="flex-1"
          >
            <ThumbsDown className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Feedback {reviewDecision && '*'}
          </label>
          <Textarea
            placeholder={getPlaceholderText()}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={4}
            disabled={!reviewDecision}
          />
        </div>

        <Button
          onClick={onSubmitDecision}
          disabled={!reviewDecision || !feedbackText.trim() || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Submitting Decision...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Review Decision
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};