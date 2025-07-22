// Auditor Service - Handles auditor dashboard data and review operations
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { errorManager } from '@/lib/error/enterprise-error-handler';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type InspectionRecord = Tables['inspections']['Row'];
type ChecklistItemRecord = Tables['checklist_items']['Row'];
type MediaFileRecord = Tables['media']['Row'];
type PropertyRecord = Tables['properties']['Row'];
type UserRecord = Tables['users']['Row'];

export interface InspectionForReview {
  id: string;
  property_id: string;
  inspector_id: string;
  status: string;
  start_time: string;
  end_time: string | null;
  created_at: string;
  properties: {
    id: string;
    name: string;
    address: string;
    vrbo_url?: string;
    airbnb_url?: string;
  };
  users: {
    id: string;
    name: string;
    email: string;
  };
  checklist_items: Array<{
    id: string;
    title: string;
    status: string;
    ai_status: string;
    ai_confidence: number;
    ai_reasoning: string;
    notes: string;
    media: Array<{
      id: string;
      type: 'photo' | 'video';
      url: string;
      created_at: string;
    }>;
  }>;
  ai_analysis_summary?: {
    overall_score: number;
    total_items: number;
    completed_items: number;
    photo_count: number;
    video_count: number;
    issues_count: number;
    confidence_average: number;
  };
}

export interface AuditorReviewDecision {
  inspectionId: string;
  decision: 'approved' | 'rejected' | 'needs_revision';
  feedback: string;
  overrides: Array<{
    checklistItemId: string;
    originalAiStatus: string;
    auditorStatus: string;
    reasoning: string;
  }>;
  reviewTime: number; // minutes
}

export interface AuditorMetrics {
  totalInspections: number;
  pendingReviews: number;
  completedToday: number;
  avgReviewTime: number;
  approvalRate: number;
  aiAccuracyRate: number;
  overrideRate: number;
}

export class AuditorService {
  /**
   * Get inspections pending review
   */
  async getInspectionsPendingReview(
    limit: number = 50,
    filters: {
      status?: string;
      priority?: string;
      searchQuery?: string;
    } = {}
  ): Promise<{ success: boolean; data?: InspectionForReview[]; error?: string }> {
    try {
      logger.info('Fetching inspections pending review', { filters, limit }, 'AUDITOR_SERVICE');

      let query = supabase
        .from('inspections')
        .select(`
          id,
          property_id,
          inspector_id,
          status,
          start_time,
          end_time,
          created_at,
          properties!inner (
            id,
            name,
            address,
            vrbo_url,
            airbnb_url
          ),
          users!inner (
            id,
            name,
            email
          ),
          checklist_items (
            id,
            title,
            status,
            ai_status,
            ai_confidence,
            ai_reasoning,
            notes,
            media (
              id,
              type,
              url,
              created_at
            )
          )
        `)
        .in('status', ['in_progress', 'completed', 'pending_review', 'in_review'])
        .order('created_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.searchQuery) {
        // Search in property address or name
        query = query.or(
          `properties.address.ilike.%${filters.searchQuery}%,properties.name.ilike.%${filters.searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch inspections for review', error, 'AUDITOR_SERVICE');
        return { success: false, error: error.message };
      }

      // Process and enhance the data
      const enhancedInspections: InspectionForReview[] = (data || []).map(inspection => ({
        ...inspection,
        ai_analysis_summary: this.calculateAIAnalysisSummary(inspection.checklist_items || [])
      }));

      logger.info('Successfully fetched inspections for review', {
        count: enhancedInspections.length
      }, 'AUDITOR_SERVICE');

      return { success: true, data: enhancedInspections };
    } catch (error) {
      logger.error('Failed to fetch inspections for review', error as Error, 'AUDITOR_SERVICE');
      return { success: false, error: 'Failed to fetch inspections for review' };
    }
  }

  /**
   * Get detailed inspection data for review
   */
  async getInspectionForReview(
    inspectionId: string
  ): Promise<{ success: boolean; data?: InspectionForReview; error?: string }> {
    try {
      logger.info('Fetching detailed inspection for review', { inspectionId }, 'AUDITOR_SERVICE');

      const { data, error } = await supabase
        .from('inspections')
        .select(`
          id,
          property_id,
          inspector_id,
          status,
          start_time,
          end_time,
          created_at,
          properties!inner (
            id,
            name,
            address,
            vrbo_url,
            airbnb_url
          ),
          users!inner (
            id,
            name,
            email
          ),
          checklist_items (
            id,
            title,
            description,
            category,
            status,
            ai_status,
            ai_confidence,
            ai_reasoning,
            notes,
            user_override,
            completed_at,
            media (
              id,
              type,
              url,
              created_at
            )
          )
        `)
        .eq('id', inspectionId)
        .single();

      if (error) {
        logger.error('Failed to fetch inspection details', error, 'AUDITOR_SERVICE');
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Inspection not found' };
      }

      // Enhance with AI analysis summary
      const enhancedInspection: InspectionForReview = {
        ...data,
        ai_analysis_summary: this.calculateAIAnalysisSummary(data.checklist_items || [])
      };

      return { success: true, data: enhancedInspection };
    } catch (error) {
      logger.error('Failed to fetch inspection details', error as Error, 'AUDITOR_SERVICE');
      return { success: false, error: 'Failed to fetch inspection details' };
    }
  }

  /**
   * Submit auditor review decision
   */
  async submitReviewDecision(
    reviewDecision: AuditorReviewDecision
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Submitting auditor review decision', {
        inspectionId: reviewDecision.inspectionId,
        decision: reviewDecision.decision,
        overridesCount: reviewDecision.overrides.length
      }, 'AUDITOR_SERVICE');

      // Start transaction by updating inspection status
      const { error: inspectionError } = await supabase
        .from('inspections')
        .update({
          status: reviewDecision.decision === 'approved' ? 'approved' : 
                  reviewDecision.decision === 'rejected' ? 'rejected' : 'needs_revision',
          end_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewDecision.inspectionId);

      if (inspectionError) {
        throw new Error(`Failed to update inspection status: ${inspectionError.message}`);
      }

      // Apply auditor overrides to checklist items
      for (const override of reviewDecision.overrides) {
        const { error: itemError } = await supabase
          .from('checklist_items')
          .update({
            ai_status: override.auditorStatus,
            user_override: true,
            notes: override.reasoning,
            updated_at: new Date().toISOString()
          })
          .eq('id', override.checklistItemId);

        if (itemError) {
          logger.error('Failed to apply override to checklist item', {
            itemId: override.checklistItemId,
            error: itemError
          }, 'AUDITOR_SERVICE');
        }
      }

      // Store auditor feedback for AI learning with error handling
      try {
        const { error: feedbackError } = await supabase
          .from('audit_feedback')
          .insert({
            inspection_id: reviewDecision.inspectionId,
            auditor_decision: reviewDecision.decision,
            feedback_text: reviewDecision.feedback,
            review_time_minutes: reviewDecision.reviewTime,
            overrides_count: reviewDecision.overrides.length,
            created_at: new Date().toISOString()
          });

        if (feedbackError) {
          logger.warn('Failed to store audit feedback for learning', feedbackError, 'AUDITOR_SERVICE');
          // Don't fail the whole operation for this
        } else {
          logger.info('Successfully stored audit feedback for AI learning', 'AUDITOR_SERVICE');
        }
      } catch (auditError) {
        logger.warn('Audit feedback table may not exist, skipping AI learning storage', auditError, 'AUDITOR_SERVICE');
        // Continue without failing - this is not critical functionality
      }

      logger.info('Successfully submitted review decision', {
        inspectionId: reviewDecision.inspectionId,
        decision: reviewDecision.decision
      }, 'AUDITOR_SERVICE');

      return { success: true };
    } catch (error) {
      logger.error('Failed to submit review decision', error as Error, 'AUDITOR_SERVICE');
      return { success: false, error: 'Failed to submit review decision' };
    }
  }

  /**
   * Get auditor performance metrics
   */
  async getAuditorMetrics(
    auditorId: string,
    timeRange: 'today' | 'week' | 'month' = 'today'
  ): Promise<{ success: boolean; data?: AuditorMetrics; error?: string }> {
    try {
      logger.info('Fetching auditor metrics', { auditorId, timeRange }, 'AUDITOR_SERVICE');

      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      // Get inspection counts and metrics - Get ALL inspections to show correct metrics
      const { data: inspectionMetrics, error: metricsError } = await supabase
        .from('inspections')
        .select('id, status, created_at, end_time, inspector_id')
        .gte('created_at', startDate.toISOString());

      if (metricsError) {
        throw new Error(`Failed to fetch inspection metrics: ${metricsError.message}`);
      }

      // Get audit feedback for accuracy calculations
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('audit_feedback')
        .select('auditor_decision, overrides_count, review_time_minutes')
        .gte('created_at', startDate.toISOString());

      if (feedbackError) {
        logger.warn('Failed to fetch feedback data for metrics', feedbackError, 'AUDITOR_SERVICE');
      }

      // Calculate metrics
      const totalInspections = inspectionMetrics?.length || 0;
      const completedInspections = inspectionMetrics?.filter(i => 
        ['approved', 'rejected', 'needs_revision'].includes(i.status || '')
      ) || [];
      const pendingReviews = inspectionMetrics?.filter(i => 
        ['completed', 'pending_review', 'in_review'].includes(i.status || '')
      ).length || 0;

      // Debug logging
      logger.info('Auditor metrics calculation', {
        totalInspections,
        completedInspections: completedInspections.length,
        pendingReviews,
        statuses: inspectionMetrics?.map(i => i.status) || [],
        timeRange,
        startDate: startDate.toISOString()
      }, 'AUDITOR_SERVICE');
      
      const completedToday = completedInspections.filter(i => {
        const completedDate = new Date(i.end_time || i.created_at);
        return completedDate >= startDate;
      }).length;

      const approvedCount = completedInspections.filter(i => i.status === 'approved').length;
      const approvalRate = completedInspections.length > 0 ? 
        (approvedCount / completedInspections.length) * 100 : 0;

      const avgReviewTime = feedbackData && feedbackData.length > 0 ?
        feedbackData.reduce((sum, f) => sum + (f.review_time_minutes || 0), 0) / feedbackData.length : 0;

      const totalOverrides = feedbackData?.reduce((sum, f) => sum + (f.overrides_count || 0), 0) || 0;
      const totalItems = feedbackData?.length || 0;
      const overrideRate = totalItems > 0 ? (totalOverrides / totalItems) * 100 : 0;
      
      // AI accuracy is inverse of override rate
      const aiAccuracyRate = Math.max(0, 100 - overrideRate);

      const metrics: AuditorMetrics = {
        totalInspections,
        pendingReviews,
        completedToday,
        avgReviewTime: Math.round(avgReviewTime),
        approvalRate: Math.round(approvalRate),
        aiAccuracyRate: Math.round(aiAccuracyRate),
        overrideRate: Math.round(overrideRate)
      };

      logger.info('Successfully calculated auditor metrics', metrics, 'AUDITOR_SERVICE');
      return { success: true, data: metrics };
    } catch (error) {
      logger.error('Failed to calculate auditor metrics', error as Error, 'AUDITOR_SERVICE');
      return { success: false, error: 'Failed to calculate auditor metrics' };
    }
  }

  /**
   * Calculate AI analysis summary for an inspection
   */
  private calculateAIAnalysisSummary(inspectionChecklistItems: Array<{ai_status: string; ai_confidence: number; media: Array<{type: string}>}>): {
    overall_score: number;
    total_items: number;
    completed_items: number;
    photo_count: number;
    video_count: number;
    issues_count: number;
    confidence_average: number;
  } {
    if (!inspectionChecklistItems.length) {
      return {
        overall_score: 0,
        total_items: 0,
        completed_items: 0,
        photo_count: 0,
        video_count: 0,
        issues_count: 0,
        confidence_average: 0
      };
    }

    const totalItems = inspectionChecklistItems.length;
    const completedItems = inspectionChecklistItems.filter(item => item.status === 'completed').length;
    const passedItems = inspectionChecklistItems.filter(item => item.ai_status === 'pass').length;
    const failedItems = inspectionChecklistItems.filter(item => item.ai_status === 'fail').length;
    const needsReviewItems = inspectionChecklistItems.filter(item => item.ai_status === 'needs_review').length;

    // Count media files
    let photoCount = 0;
    let videoCount = 0;
    
    inspectionChecklistItems.forEach(item => {
      if (item.media) {
        photoCount += item.media.filter((media) => media.type === 'photo').length;
        videoCount += item.media.filter((media) => media.type === 'video').length;
      }
    });

    // Calculate average confidence
    const confidenceScores = inspectionChecklistItems
      .filter(item => item.ai_confidence != null)
      .map(item => item.ai_confidence);
    const confidenceAverage = confidenceScores.length > 0 ?
      confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length : 0;

    // Calculate overall score (weighted by completion and AI results)
    const completionScore = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    const aiSuccessRate = completedItems > 0 ? (passedItems / completedItems) * 100 : 0;
    const overallScore = (completionScore * 0.6) + (aiSuccessRate * 0.4);

    return {
      overall_score: Math.round(overallScore),
      total_items: totalItems,
      completed_items: completedItems,
      photo_count: photoCount,
      video_count: videoCount,
      issues_count: failedItems + needsReviewItems,
      confidence_average: Math.round(confidenceAverage)
    };
  }
}

// Export singleton instance
export const auditorService = new AuditorService();