/**
 * Centralized service for calculating inspection status counts
 * Provides consistent counting logic across all dashboard components
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  INSPECTION_STATUS, 
  STATUS_GROUPS, 
  normalizeStatus,
  type InspectionStatus 
} from '@/types/inspection-status';
import { logger } from '@/utils/logger';

// Types for count results
export interface InspectionCounts {
  total: number;
  draft: number;
  inProgress: number;
  completed: number;
  pendingReview: number;
  inReview: number;
  approved: number;
  rejected: number;
  needsRevision: number;
  cancelled: number;
}

export interface PropertyCounts {
  total: number;
  active: number;
  withInspections: number;
  withoutInspections: number;
}

export interface AuditorMetrics {
  totalReviews: number;
  pendingReviews: number;
  completedToday: number;
  approvalRate: number;
  avgReviewTime: number;
  aiAccuracyRate: number;
}

export interface AdminDashboardStats {
  inspections: InspectionCounts;
  properties: PropertyCounts;
  auditor: AuditorMetrics;
  users: {
    total: number;
    inspectors: number;
    auditors: number;
    admins: number;
  };
}

class StatusCountService {
  
  /**
   * Get comprehensive inspection counts with normalized status handling
   */
  async getInspectionCounts(userId?: string): Promise<InspectionCounts> {
    try {
      logger.info('Fetching inspection counts', { userId }, 'STATUS_COUNT_SERVICE');

      let query = supabase
        .from('inspections')
        .select('status');

      // Filter by user if provided (for inspector dashboard)
      if (userId) {
        query = query.eq('inspector_id', userId);
      }

      const { data: inspections, error } = await query;

      if (error) {
        logger.error('Failed to fetch inspections for counting', error, 'STATUS_COUNT_SERVICE');
        throw error;
      }

      // Initialize counts
      const counts: InspectionCounts = {
        total: 0,
        draft: 0,
        inProgress: 0,
        completed: 0,
        pendingReview: 0,
        inReview: 0,
        approved: 0,
        rejected: 0,
        needsRevision: 0,
        cancelled: 0
      };

      // Count each inspection with status normalization
      inspections?.forEach(inspection => {
        const normalizedStatus = normalizeStatus(inspection.status);
        
        counts.total++;

        switch (normalizedStatus) {
          case INSPECTION_STATUS.DRAFT:
            counts.draft++;
            break;
          case INSPECTION_STATUS.IN_PROGRESS:
            counts.inProgress++;
            break;
          case INSPECTION_STATUS.COMPLETED:
            counts.completed++;
            break;
          case INSPECTION_STATUS.PENDING_REVIEW:
            counts.pendingReview++;
            break;
          case INSPECTION_STATUS.IN_REVIEW:
            counts.inReview++;
            break;
          case INSPECTION_STATUS.APPROVED:
            counts.approved++;
            break;
          case INSPECTION_STATUS.REJECTED:
            counts.rejected++;
            break;
          case INSPECTION_STATUS.NEEDS_REVISION:
            counts.needsRevision++;
            break;
          case INSPECTION_STATUS.CANCELLED:
            counts.cancelled++;
            break;
          default:
            logger.warn('Unknown inspection status found', { status: inspection.status }, 'STATUS_COUNT_SERVICE');
        }
      });

      logger.info('Inspection counts calculated', counts, 'STATUS_COUNT_SERVICE');
      return counts;

    } catch (error) {
      logger.error('Failed to get inspection counts', error, 'STATUS_COUNT_SERVICE');
      throw error;
    }
  }

  /**
   * Get property counts with inspection statistics
   */
  async getPropertyCounts(userId?: string): Promise<PropertyCounts> {
    try {
      logger.info('Fetching property counts', { userId }, 'STATUS_COUNT_SERVICE');

      // Use the stored procedure that already calculates inspection counts
      const { data: properties, error } = await supabase.rpc('get_properties_with_inspections', {
        _user_id: userId || null
      });

      if (error) {
        logger.error('Failed to fetch properties with inspections', error, 'STATUS_COUNT_SERVICE');
        throw error;
      }

      const counts: PropertyCounts = {
        total: properties?.length || 0,
        active: 0,
        withInspections: 0,
        withoutInspections: 0
      };

      properties?.forEach((property: any) => {
        const totalInspections = property.inspection_count || 0;
        const activeInspections = property.active_inspection_count || 0;

        if (activeInspections > 0) {
          counts.active++;
        }

        if (totalInspections > 0) {
          counts.withInspections++;
        } else {
          counts.withoutInspections++;
        }
      });

      logger.info('Property counts calculated', counts, 'STATUS_COUNT_SERVICE');
      return counts;

    } catch (error) {
      logger.error('Failed to get property counts', error, 'STATUS_COUNT_SERVICE');
      throw error;
    }
  }

  /**
   * Get auditor-specific metrics
   */
  async getAuditorMetrics(auditorId: string, timeframe: 'today' | 'week' | 'month' = 'today'): Promise<AuditorMetrics> {
    try {
      logger.info('Fetching auditor metrics', { auditorId, timeframe }, 'STATUS_COUNT_SERVICE');

      // Calculate date range
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
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

      // Get all inspections that need or have had auditor attention
      const { data: inspections, error } = await supabase
        .from('inspections')
        .select('status, created_at, end_time')
        .in('status', STATUS_GROUPS.REVIEW_PIPELINE.concat(STATUS_GROUPS.FINAL))
        .gte('created_at', startDate.toISOString());

      if (error) {
        logger.error('Failed to fetch inspections for auditor metrics', error, 'STATUS_COUNT_SERVICE');
        throw error;
      }

      // Calculate metrics
      const totalReviews = inspections?.length || 0;
      const pendingReviews = inspections?.filter(insp => 
        STATUS_GROUPS.NEEDS_AUDITOR_ACTION.includes(normalizeStatus(insp.status) as InspectionStatus)
      ).length || 0;

      const completedToday = inspections?.filter(insp => {
        const normalizedStatus = normalizeStatus(insp.status);
        const endTime = insp.end_time ? new Date(insp.end_time) : null;
        const isCompleted = [INSPECTION_STATUS.APPROVED, INSPECTION_STATUS.REJECTED].includes(normalizedStatus as InspectionStatus);
        const isToday = endTime && endTime >= startDate;
        return isCompleted && isToday;
      }).length || 0;

      const approvedCount = inspections?.filter(insp => 
        normalizeStatus(insp.status) === INSPECTION_STATUS.APPROVED
      ).length || 0;

      const approvalRate = totalReviews > 0 ? (approvedCount / totalReviews) * 100 : 0;

      // TODO: Implement actual AI accuracy calculation
      const aiAccuracyRate = 87.3; // Placeholder
      const avgReviewTime = 15; // Placeholder in minutes

      const metrics: AuditorMetrics = {
        totalReviews,
        pendingReviews,
        completedToday,
        approvalRate: Math.round(approvalRate * 10) / 10,
        avgReviewTime,
        aiAccuracyRate
      };

      logger.info('Auditor metrics calculated', metrics, 'STATUS_COUNT_SERVICE');
      return metrics;

    } catch (error) {
      logger.error('Failed to get auditor metrics', error, 'STATUS_COUNT_SERVICE');
      throw error;
    }
  }

  /**
   * Get comprehensive admin dashboard statistics
   */
  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    try {
      logger.info('Fetching admin dashboard stats', {}, 'STATUS_COUNT_SERVICE');

      const [inspectionCounts, propertyCounts, users] = await Promise.all([
        this.getInspectionCounts(),
        this.getPropertyCounts(),
        supabase.from('users').select('role, email').eq('status', 'active')
      ]);

      // Calculate user counts
      const userCounts = {
        total: users.data?.length || 0,
        inspectors: users.data?.filter(u => u.role === 'inspector').length || 0,
        auditors: users.data?.filter(u => u.role === 'auditor').length || 0,
        admins: users.data?.filter(u => u.role === 'admin').length || 0
      };

      // Get auditor metrics (using first admin as fallback)
      const auditorMetrics = await this.getAuditorMetrics('system', 'today');

      const stats: AdminDashboardStats = {
        inspections: inspectionCounts,
        properties: propertyCounts,
        auditor: auditorMetrics,
        users: userCounts
      };

      logger.info('Admin dashboard stats calculated', stats, 'STATUS_COUNT_SERVICE');
      return stats;

    } catch (error) {
      logger.error('Failed to get admin dashboard stats', error, 'STATUS_COUNT_SERVICE');
      throw error;
    }
  }

  /**
   * Get status counts grouped by categories for simplified display
   */
  getGroupedCounts(counts: InspectionCounts) {
    return {
      active: counts.draft + counts.inProgress,
      pendingReview: counts.completed + counts.pendingReview,
      inReview: counts.inReview,
      final: counts.approved + counts.rejected + counts.cancelled,
      needsAction: counts.needsRevision
    };
  }

  /**
   * Calculate property-level statistics from inspection data
   */
  calculatePropertyStats(properties: any[]): { totalInspections: number; activeInspections: number; completedInspections: number } {
    return properties.reduce((stats, property) => ({
      totalInspections: stats.totalInspections + (property.inspection_count || 0),
      activeInspections: stats.activeInspections + (property.active_inspection_count || 0),
      completedInspections: stats.completedInspections + (property.completed_inspection_count || 0)
    }), { totalInspections: 0, activeInspections: 0, completedInspections: 0 });
  }
}

// Export singleton instance
export const statusCountService = new StatusCountService();