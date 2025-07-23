/**
 * @fileoverview Auditor Dashboard - Clean Orchestrator
 * Coordinates audit workflow components using enterprise orchestrator pattern
 * ENTERPRISE GRADE: Clean delegation with focused component composition
 *
 * @author STR Certified Engineering Team
 * @version 2.0.0
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useErrorHandling } from "@/hooks/useErrorHandling";
import { useLearningAnalytics } from "@/hooks/useLearningAnalytics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  auditorService,
  type InspectionForReview,
  type AuditorMetrics,
} from "@/services/auditorService";
import { logger } from "@/utils/logger";

// Import focused components
import { InspectionQueueManager } from "@/components/audit/InspectionQueueManager";
import { AuditorMetricsOverview } from "@/components/audit/AuditorMetricsOverview";
import { InspectionReviewPanel } from "@/components/audit/InspectionReviewPanel";

// Transform service data to component-friendly format
interface Inspection {
  id: string;
  propertyId: string;
  propertyAddress: string;
  inspectorId: string;
  inspectorName: string;
  status:
    | "pending_review"
    | "in_review"
    | "completed"
    | "approved"
    | "rejected";
  submittedAt: string;
  priority: "high" | "medium" | "low";
  aiScore: number;
  photoCount: number;
  videoCount: number;
  issuesFound: number;
  estimatedReviewTime: number;
}

export function AuditorDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { error, handleError, withErrorHandling } = useErrorHandling();
  const { trackLearningEvent } = useLearningAnalytics();

  // State Management
  const [activeTab, setActiveTab] = useState("queue");
  const [selectedInspection, setSelectedInspection] =
    useState<Inspection | null>(null);

  // Data Queries - Real inspection data
  const { data: inspectionsData, isLoading: isLoadingInspections } = useQuery({
    queryKey: ["inspections", "pending_review"],
    queryFn: async () => {
      logger.info(
        "Fetching inspections for auditor dashboard",
        {},
        "AUDITOR_DASHBOARD",
      );

      const result = await auditorService.getInspectionsPendingReview(50, {});
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch inspections");
      }

      return result.data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Transform real data to component format
  const inspections: Inspection[] = (inspectionsData || []).map(
    (inspection) => ({
      id: inspection.id,
      propertyId: inspection.property_id,
      propertyAddress: inspection.properties?.address || "Unknown Address",
      inspectorId: inspection.inspector_id,
      inspectorName: inspection.users?.name || "Unknown Inspector",
      status: inspection.status as any,
      submittedAt: inspection.start_time,
      priority:
        inspection.ai_analysis_summary?.issues_count > 5
          ? "high"
          : inspection.ai_analysis_summary?.issues_count > 2
            ? "medium"
            : "low",
      aiScore: inspection.ai_analysis_summary?.overall_score || 0,
      photoCount: inspection.ai_analysis_summary?.photo_count || 0,
      videoCount: inspection.ai_analysis_summary?.video_count || 0,
      issuesFound: inspection.ai_analysis_summary?.issues_count || 0,
      estimatedReviewTime: Math.max(
        5,
        Math.min(
          30,
          (inspection.ai_analysis_summary?.total_items || 0) * 2 +
            (inspection.ai_analysis_summary?.issues_count || 0) * 3,
        ),
      ),
    }),
  );

  // Get auditor metrics using centralized service
  const { data: auditorMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["auditor_metrics", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const result = await auditorService.getAuditorMetrics(user.id);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch metrics");
      }

      return (
        result.data || {
          totalReviewed: 0,
          approved: 0,
          rejected: 0,
          averageReviewTime: 0,
          accuracyScore: 0,
          completionRate: 0,
          dailyTarget: 10,
          dailyCompleted: 0,
          weeklyStats: { thisWeek: 0, lastWeek: 0, weekOverWeekGrowth: 0 },
          qualityMetrics: {
            consistencyScore: 0,
            thoroughnessScore: 0,
            timeliness: 0,
          },
          learningProgress: {
            level: 1,
            experiencePoints: 0,
            nextLevelXP: 100,
            badges: [],
          },
        }
      );
    },
    enabled: !!user?.id,
  });

  // Review Decision Mutations
  const approveInspectionMutation = useMutation({
    mutationFn: async ({
      inspectionId,
      feedback,
    }: {
      inspectionId: string;
      feedback: string;
    }) => {
      const result = await auditorService.approveInspection(
        inspectionId,
        feedback,
      );
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      queryClient.invalidateQueries({ queryKey: ["auditor_metrics"] });
      trackLearningEvent("inspection_approved");
      setSelectedInspection(null);
    },
  });

  const rejectInspectionMutation = useMutation({
    mutationFn: async ({
      inspectionId,
      feedback,
    }: {
      inspectionId: string;
      feedback: string;
    }) => {
      const result = await auditorService.rejectInspection(
        inspectionId,
        feedback,
      );
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      queryClient.invalidateQueries({ queryKey: ["auditor_metrics"] });
      trackLearningEvent("inspection_rejected");
      setSelectedInspection(null);
    },
  });

  const requestRevisionMutation = useMutation({
    mutationFn: async ({
      inspectionId,
      feedback,
    }: {
      inspectionId: string;
      feedback: string;
    }) => {
      const result = await auditorService.requestRevision(
        inspectionId,
        feedback,
      );
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      queryClient.invalidateQueries({ queryKey: ["auditor_metrics"] });
      trackLearningEvent("revision_requested");
      setSelectedInspection(null);
    },
  });

  // Event Handlers
  const handleSelectInspection = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setActiveTab("review");

    logger.info(
      "Inspection selected for review",
      {
        inspectionId: inspection.id,
        aiScore: inspection.aiScore,
      },
      "AUDITOR_DASHBOARD",
    );
  };

  const handleApproveInspection = async (
    inspectionId: string,
    feedback: string,
  ) => {
    await approveInspectionMutation.mutateAsync({ inspectionId, feedback });
    logger.info("Inspection approved", { inspectionId }, "AUDITOR_DASHBOARD");
  };

  const handleRejectInspection = async (
    inspectionId: string,
    feedback: string,
  ) => {
    await rejectInspectionMutation.mutateAsync({ inspectionId, feedback });
    logger.info("Inspection rejected", { inspectionId }, "AUDITOR_DASHBOARD");
  };

  const handleRequestRevision = async (
    inspectionId: string,
    feedback: string,
  ) => {
    await requestRevisionMutation.mutateAsync({ inspectionId, feedback });
    logger.info("Revision requested", { inspectionId }, "AUDITOR_DASHBOARD");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Auditor Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Review and approve property inspections with AI-powered assistance
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="queue">Inspection Queue</TabsTrigger>
            <TabsTrigger value="review">Review Panel</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AuditorMetricsOverview
              metrics={auditorMetrics}
              isLoading={isLoadingMetrics}
              auditorName={
                user?.user_metadata?.full_name || user?.email || "Auditor"
              }
            />
          </TabsContent>

          <TabsContent value="queue">
            <InspectionQueueManager
              inspections={inspections}
              isLoading={isLoadingInspections}
              onSelectInspection={handleSelectInspection}
              selectedInspectionId={selectedInspection?.id}
            />
          </TabsContent>

          <TabsContent value="review">
            <InspectionReviewPanel
              inspection={selectedInspection}
              isLoading={false}
              onApprove={handleApproveInspection}
              onReject={handleRejectInspection}
              onRequestRevision={handleRequestRevision}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
