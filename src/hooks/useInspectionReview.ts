/**
 * Inspection Review Business Logic Hook
 * Extracted from InspectionReviewPanel.tsx for surgical refactoring
 */

import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

export interface Inspection {
  id: string;
  propertyId: string;
  propertyAddress: string;
  inspectorId: string;
  inspectorName: string;
  status: 'pending_review' | 'in_review' | 'completed' | 'approved' | 'rejected';
  submittedAt: string;
  priority: 'high' | 'medium' | 'low';
  aiScore: number;
  photoCount: number;
  videoCount: number;
  issuesFound: number;
  estimatedReviewTime: number;
}

export interface AIAnalysis {
  overallScore: number;
  confidence: number;
  completedItems: number;
  totalItems: number;
  photoCount: number;
  videoCount: number;
  issues: Array<{
    id: string;
    label: string;
    category: string | null;
    status: string | null;
    ai_status: string | null;
    notes: string | null;
  }>;
  recommendations: string[];
}

export type ReviewDecision = 'approved' | 'rejected' | 'needs_revision' | null;

export const useInspectionReview = (
  inspection: Inspection | null,
  onApprove: (inspectionId: string, feedback: string) => Promise<void>,
  onReject: (inspectionId: string, feedback: string) => Promise<void>,
  onRequestRevision: (inspectionId: string, feedback: string) => Promise<void>
) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);

  // Mock AI analysis - in real implementation, fetch from API
  useEffect(() => {
    if (inspection) {
      setAIAnalysis({
        overallScore: inspection.aiScore,
        confidence: Math.min(95, inspection.aiScore + 10),
        completedItems: Math.max(1, inspection.photoCount + inspection.videoCount - inspection.issuesFound),
        totalItems: inspection.photoCount + inspection.videoCount,
        photoCount: inspection.photoCount,
        videoCount: inspection.videoCount,
        issues: Array.from({ length: inspection.issuesFound }, (_, i) => ({
          id: `issue_${i}`,
          label: `Issue ${i + 1}`,
          category: ['safety', 'cleanliness', 'maintenance'][i % 3],
          status: 'flagged',
          ai_status: 'attention_required',
          notes: `AI detected potential issue requiring review`
        })),
        recommendations: [
          'Review flagged safety items carefully',
          'Verify photo quality meets standards',
          'Check completeness of inspection coverage'
        ]
      });
    }
  }, [inspection]);

  const handleSubmitDecision = async () => {
    if (!inspection || !reviewDecision || !feedbackText.trim()) return;

    try {
      setIsSubmitting(true);
      
      logger.info('Submitting review decision', {
        inspectionId: inspection.id,
        decision: reviewDecision,
        feedbackLength: feedbackText.length
      }, 'INSPECTION_REVIEW_PANEL');

      switch (reviewDecision) {
        case 'approved':
          await onApprove(inspection.id, feedbackText);
          break;
        case 'rejected':
          await onReject(inspection.id, feedbackText);
          break;
        case 'needs_revision':
          await onRequestRevision(inspection.id, feedbackText);
          break;
      }

      // Reset form after successful submission
      setReviewDecision(null);
      setFeedbackText('');
      
    } catch (error) {
      logger.error('Failed to submit review decision', error, 'INSPECTION_REVIEW_PANEL');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return {
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
  };
};