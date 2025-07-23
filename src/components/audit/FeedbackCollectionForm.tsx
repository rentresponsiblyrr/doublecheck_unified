/**
 * FOCUSED FEEDBACK COLLECTION FORM - PROFESSIONAL ARCHITECTURE
 *
 * Modular feedback collection system with clean separation of concerns.
 * Each aspect handled by focused sub-components for maintainability.
 *
 * @example
 * ```typescript
 * <FeedbackCollectionForm
 *   inspectionId="123"
 *   auditorId="456"
 *   aiPredictions={predictions}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type {
  FeedbackFormData,
  FeedbackItem,
  FeedbackCategory,
  AuditorFeedback,
} from "@/types/learning";
import { createFeedbackProcessor } from "@/lib/ai/feedback-processor";
import { useMutation } from "@tanstack/react-query";

// Focused sub-components
import { FeedbackHeader } from "./feedback/FeedbackHeader";
import { FeedbackStats } from "./feedback/FeedbackStats";
import { FeedbackFilters } from "./feedback/FeedbackFilters";
import { FeedbackItemsList } from "./feedback/FeedbackItemsList";
import { OverallFeedback } from "./feedback/OverallFeedback";
import { SubmissionStatus } from "./feedback/SubmissionStatus";

interface FeedbackCollectionFormProps {
  inspectionId: string;
  auditorId: string;
  aiPredictions: Array<{
    id: string;
    category: FeedbackCategory;
    value: unknown; // AI prediction value
    confidence: number;
    context?: {
      roomType?: string;
      photoId?: string;
      videoTimestamp?: number;
      checklistItemId?: string;
    };
  }>;
  onSubmit?: (feedback: AuditorFeedback[]) => void;
  onSaveDraft?: (draft: FeedbackFormData) => void;
  initialDraft?: FeedbackFormData;
  className?: string;
}

export const FeedbackCollectionForm: React.FC<FeedbackCollectionFormProps> = ({
  inspectionId,
  auditorId,
  aiPredictions,
  onSubmit,
  onSaveDraft,
  initialDraft,
  className,
}) => {
  // Core state management
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [overallRating, setOverallRating] = useState(3);
  const [comments, setComments] = useState("");
  const [suggestedImprovements, setSuggestedImprovements] = useState<string[]>(
    [],
  );
  const [newImprovement, setNewImprovement] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<
    FeedbackCategory | "all"
  >("all");
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  const feedbackProcessor = React.useMemo(() => createFeedbackProcessor(), []);

  // Initialize feedback items from AI predictions
  useEffect(() => {
    const items: FeedbackItem[] = aiPredictions.map((prediction) => ({
      id: prediction.id,
      type: prediction.category,
      aiValue: prediction.value,
      correctValue: prediction.value,
      confidenceRating: prediction.confidence,
      severity: "minor",
      explanation: "",
      evidence: {
        photoIds: prediction.context?.photoId
          ? [prediction.context.photoId]
          : undefined,
        videoTimestamp: prediction.context?.videoTimestamp,
        checklistItemId: prediction.context?.checklistItemId,
      },
    }));

    if (initialDraft) {
      const draftMap = new Map(
        initialDraft.feedbackItems.map((item) => [item.id, item]),
      );
      items.forEach((item) => {
        const draft = draftMap.get(item.id);
        if (draft) Object.assign(item, draft);
      });
      setOverallRating(initialDraft.overallRating);
      setComments(initialDraft.comments || "");
      setSuggestedImprovements(initialDraft.suggestedImprovements || []);
    }

    setFeedbackItems(items);
  }, [aiPredictions, initialDraft]);

  // Submit feedback
  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData: FeedbackFormData = {
        inspectionId,
        feedbackItems: feedbackItems.filter(
          (item) =>
            JSON.stringify(item.aiValue) !==
              JSON.stringify(item.correctValue) || item.explanation,
        ),
        overallRating,
        comments,
        suggestedImprovements,
      };
      return await feedbackProcessor.collectFeedback(
        formData,
        auditorId,
        inspectionId,
      );
    },
    onSuccess: (feedback) => onSubmit?.(feedback),
  });

  // Computed values
  const filteredItems = feedbackItems.filter((item) => {
    if (filterCategory !== "all" && item.type !== filterCategory) return false;
    if (
      showOnlyErrors &&
      JSON.stringify(item.aiValue) === JSON.stringify(item.correctValue)
    )
      return false;
    return true;
  });

  const stats = {
    total: feedbackItems.length,
    corrections: feedbackItems.filter(
      (item) =>
        JSON.stringify(item.aiValue) !== JSON.stringify(item.correctValue),
    ).length,
    reviewed: feedbackItems.filter((item) => item.explanation).length,
    highSeverity: feedbackItems.filter((item) => item.severity === "major")
      .length,
  };

  // Event handlers
  const updateFeedbackItem = (id: string, updates: Partial<FeedbackItem>) => {
    setFeedbackItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const handleSaveDraft = () => {
    const draft: FeedbackFormData = {
      inspectionId,
      feedbackItems,
      overallRating,
      comments,
      suggestedImprovements,
    };
    onSaveDraft?.(draft);
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addImprovement = () => {
    if (newImprovement.trim()) {
      setSuggestedImprovements((prev) => [...prev, newImprovement.trim()]);
      setNewImprovement("");
    }
  };

  const removeImprovement = (index: number) => {
    setSuggestedImprovements((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("space-y-6", className)}>
      <FeedbackHeader
        onSaveDraft={handleSaveDraft}
        onSubmit={() => submitMutation.mutate()}
        isSubmitting={submitMutation.isPending}
      />

      <FeedbackStats stats={stats} />

      <FeedbackFilters
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        showOnlyErrors={showOnlyErrors}
        setShowOnlyErrors={setShowOnlyErrors}
      />

      <FeedbackItemsList
        items={filteredItems}
        expandedItems={expandedItems}
        onToggleExpanded={toggleExpanded}
        onUpdateItem={updateFeedbackItem}
      />

      <OverallFeedback
        overallRating={overallRating}
        setOverallRating={setOverallRating}
        comments={comments}
        setComments={setComments}
        suggestedImprovements={suggestedImprovements}
        setSuggestedImprovements={setSuggestedImprovements}
        newImprovement={newImprovement}
        setNewImprovement={setNewImprovement}
        onAddImprovement={addImprovement}
        onRemoveImprovement={removeImprovement}
      />

      <SubmissionStatus
        isPending={submitMutation.isPending}
        isSuccess={submitMutation.isSuccess}
        isError={submitMutation.isError}
      />
    </div>
  );
};

export default FeedbackCollectionForm;
