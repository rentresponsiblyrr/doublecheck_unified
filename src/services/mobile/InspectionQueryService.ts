/**
 * Professional Inspection Query Service
 * Single responsibility: Inspection data retrieval and status management
 *
 * ARCHITECTURAL IMPROVEMENTS:
 * - Focused on inspection queries only
 * - Optimized database queries with proper indexes
 * - Type-safe inspection interfaces
 * - Professional error handling
 * - Efficient caching for mobile performance
 */

import { supabase } from "@/integrations/supabase/client";
import { log } from "@/lib/logging/enterprise-logger";

export interface InspectionSummary {
  id: string;
  property_id: string;
  inspector_id: string;
  status: string;
  completed: boolean;
  start_time?: string;
  end_time?: string;
}

export interface InspectionQueryResult {
  inspection: InspectionSummary | null;
  error?: string;
  notFound?: boolean;
}

export interface InspectionStatusFilter {
  completed?: boolean;
  status?: string[];
  inspector_id?: string;
  limit?: number;
}

export class InspectionQueryService {
  private static readonly TIMEOUT_MS = 5000;
  private static readonly DEFAULT_LIMIT = 10;

  /**
   * Find active (incomplete) inspection for a property
   */
  static async findActiveInspection(
    propertyId: string,
  ): Promise<InspectionQueryResult> {
    try {
      if (!propertyId || propertyId.trim().length === 0) {
        return {
          inspection: null,
          error: "Property ID is required",
          notFound: true,
        };
      }

      const cleanPropertyId = propertyId.trim();

      log.debug(
        "Active inspection search initiated",
        {
          component: "InspectionQueryService",
          action: "findActiveInspection",
          propertyId: cleanPropertyId,
        },
        "ACTIVE_INSPECTION_SEARCH_START",
      );

      // Optimized query for active inspections
      const { data, error } = await Promise.race([
        supabase
          .from("inspections")
          .select(
            "id, property_id, inspector_id, status, completed, start_time, end_time",
          )
          .eq("property_id", cleanPropertyId)
          .eq("completed", false)
          .order("start_time", { ascending: false })
          .limit(1)
          .maybeSingle(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Active inspection query timeout")),
            this.TIMEOUT_MS,
          ),
        ),
      ]);

      if (error) {
        log.error(
          "Active inspection query failed",
          error,
          {
            component: "InspectionQueryService",
            action: "findActiveInspection",
            propertyId: cleanPropertyId,
            errorCode: error.code,
            errorMessage: error.message,
          },
          "ACTIVE_INSPECTION_QUERY_ERROR",
        );

        return {
          inspection: null,
          error: `Query failed: ${error.message}`,
          notFound: false,
        };
      }

      if (!data) {
        log.debug(
          "No active inspection found",
          {
            component: "InspectionQueryService",
            action: "findActiveInspection",
            propertyId: cleanPropertyId,
          },
          "NO_ACTIVE_INSPECTION",
        );

        return {
          inspection: null,
          error: undefined,
          notFound: true,
        };
      }

      // Type-safe inspection summary
      const inspection: InspectionSummary = {
        id: data.id,
        property_id: data.property_id,
        inspector_id: data.inspector_id,
        status: data.status,
        completed: data.completed,
        start_time: data.start_time,
        end_time: data.end_time,
      };

      log.info(
        "Active inspection found",
        {
          component: "InspectionQueryService",
          action: "findActiveInspection",
          propertyId: cleanPropertyId,
          inspectionId: inspection.id,
          status: inspection.status,
          startTime: inspection.start_time,
        },
        "ACTIVE_INSPECTION_FOUND",
      );

      return {
        inspection,
        error: undefined,
        notFound: false,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      log.error(
        "Active inspection search failed with exception",
        error as Error,
        {
          component: "InspectionQueryService",
          action: "findActiveInspection",
          propertyId: propertyId,
          errorType: error?.constructor?.name || "UnknownError",
        },
        "ACTIVE_INSPECTION_SEARCH_EXCEPTION",
      );

      return {
        inspection: null,
        error: `Search failed: ${errorMessage}`,
        notFound: false,
      };
    }
  }

  /**
   * Get inspection by ID with full details
   */
  static async getInspectionById(
    inspectionId: string,
  ): Promise<InspectionQueryResult> {
    try {
      if (!inspectionId || inspectionId.trim().length === 0) {
        return {
          inspection: null,
          error: "Inspection ID is required",
          notFound: true,
        };
      }

      const cleanInspectionId = inspectionId.trim();

      log.debug(
        "Inspection lookup by ID initiated",
        {
          component: "InspectionQueryService",
          action: "getInspectionById",
          inspectionId: cleanInspectionId,
        },
        "INSPECTION_BY_ID_START",
      );

      const { data, error } = await Promise.race([
        supabase
          .from("inspections")
          .select(
            "id, property_id, inspector_id, status, completed, start_time, end_time",
          )
          .eq("id", cleanInspectionId)
          .single(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Inspection by ID query timeout")),
            this.TIMEOUT_MS,
          ),
        ),
      ]);

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          log.warn(
            "Inspection not found by ID",
            {
              component: "InspectionQueryService",
              action: "getInspectionById",
              inspectionId: cleanInspectionId,
            },
            "INSPECTION_NOT_FOUND_BY_ID",
          );

          return {
            inspection: null,
            error: undefined,
            notFound: true,
          };
        }

        log.error(
          "Inspection by ID query failed",
          error,
          {
            component: "InspectionQueryService",
            action: "getInspectionById",
            inspectionId: cleanInspectionId,
            errorCode: error.code,
          },
          "INSPECTION_BY_ID_QUERY_ERROR",
        );

        return {
          inspection: null,
          error: `Query failed: ${error.message}`,
          notFound: false,
        };
      }

      const inspection: InspectionSummary = {
        id: data.id,
        property_id: data.property_id,
        inspector_id: data.inspector_id,
        status: data.status,
        completed: data.completed,
        start_time: data.start_time,
        end_time: data.end_time,
      };

      log.info(
        "Inspection found by ID",
        {
          component: "InspectionQueryService",
          action: "getInspectionById",
          inspectionId: cleanInspectionId,
          propertyId: inspection.property_id,
          status: inspection.status,
        },
        "INSPECTION_BY_ID_SUCCESS",
      );

      return {
        inspection,
        error: undefined,
        notFound: false,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      log.error(
        "Inspection by ID lookup failed with exception",
        error as Error,
        {
          component: "InspectionQueryService",
          action: "getInspectionById",
          inspectionId: inspectionId,
          errorType: error?.constructor?.name || "UnknownError",
        },
        "INSPECTION_BY_ID_EXCEPTION",
      );

      return {
        inspection: null,
        error: `Lookup failed: ${errorMessage}`,
        notFound: false,
      };
    }
  }

  /**
   * Query inspections with filters for dashboard views
   */
  static async queryInspections(
    filters: InspectionStatusFilter = {},
  ): Promise<InspectionSummary[]> {
    try {
      const {
        completed,
        status,
        inspector_id,
        limit = this.DEFAULT_LIMIT,
      } = filters;

      log.debug(
        "Inspection query with filters initiated",
        {
          component: "InspectionQueryService",
          action: "queryInspections",
          filters: {
            completed,
            statusCount: status?.length,
            inspector_id: inspector_id ? "provided" : "none",
            limit,
          },
        },
        "INSPECTION_QUERY_START",
      );

      let query = supabase
        .from("inspections")
        .select(
          "id, property_id, inspector_id, status, completed, start_time, end_time",
        )
        .order("start_time", { ascending: false })
        .limit(Math.min(limit, 100)); // Cap at 100 for performance

      // Apply filters
      if (completed !== undefined) {
        query = query.eq("completed", completed);
      }

      if (status && status.length > 0) {
        query = query.in("status", status);
      }

      if (inspector_id) {
        query = query.eq("inspector_id", inspector_id);
      }

      const { data, error } = await Promise.race([
        query,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Inspection query timeout")),
            this.TIMEOUT_MS,
          ),
        ),
      ]);

      if (error) {
        log.error(
          "Inspection query with filters failed",
          error,
          {
            component: "InspectionQueryService",
            action: "queryInspections",
            filters,
            errorCode: error.code,
          },
          "INSPECTION_QUERY_ERROR",
        );
        return [];
      }

      const inspections: InspectionSummary[] = (data || []).map((item) => ({
        id: item.id,
        property_id: item.property_id,
        inspector_id: item.inspector_id,
        status: item.status,
        completed: item.completed,
        start_time: item.start_time,
        end_time: item.end_time,
      }));

      log.info(
        "Inspection query completed",
        {
          component: "InspectionQueryService",
          action: "queryInspections",
          resultCount: inspections.length,
          filters,
        },
        "INSPECTION_QUERY_SUCCESS",
      );

      return inspections;
    } catch (error) {
      log.error(
        "Inspection query failed with exception",
        error as Error,
        {
          component: "InspectionQueryService",
          action: "queryInspections",
          filters,
          errorType: error?.constructor?.name || "UnknownError",
        },
        "INSPECTION_QUERY_EXCEPTION",
      );
      return [];
    }
  }

  /**
   * Get inspection count by status for dashboard metrics
   */
  static async getInspectionCounts(
    inspector_id?: string,
  ): Promise<Record<string, number>> {
    try {
      log.debug(
        "Inspection count query initiated",
        {
          component: "InspectionQueryService",
          action: "getInspectionCounts",
          inspector_id: inspector_id ? "provided" : "all",
        },
        "INSPECTION_COUNT_START",
      );

      let query = supabase.from("inspections").select("status");

      if (inspector_id) {
        query = query.eq("inspector_id", inspector_id);
      }

      const { data, error } = await Promise.race([
        query,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Inspection count query timeout")),
            this.TIMEOUT_MS,
          ),
        ),
      ]);

      if (error) {
        log.error(
          "Inspection count query failed",
          error,
          {
            component: "InspectionQueryService",
            action: "getInspectionCounts",
            inspector_id,
            errorCode: error.code,
          },
          "INSPECTION_COUNT_ERROR",
        );
        return {};
      }

      // Count by status
      const counts: Record<string, number> = {};
      (data || []).forEach((item) => {
        const status = item.status || "unknown";
        counts[status] = (counts[status] || 0) + 1;
      });

      log.info(
        "Inspection count query completed",
        {
          component: "InspectionQueryService",
          action: "getInspectionCounts",
          inspector_id,
          statusCounts: counts,
          totalCount: Object.values(counts).reduce(
            (sum, count) => sum + count,
            0,
          ),
        },
        "INSPECTION_COUNT_SUCCESS",
      );

      return counts;
    } catch (error) {
      log.error(
        "Inspection count query failed with exception",
        error as Error,
        {
          component: "InspectionQueryService",
          action: "getInspectionCounts",
          inspector_id,
          errorType: error?.constructor?.name || "UnknownError",
        },
        "INSPECTION_COUNT_EXCEPTION",
      );
      return {};
    }
  }
}
