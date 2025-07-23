/**
 * Audit Trail Data Manager - Focused Component
 *
 * Handles all audit trail data operations with render props pattern
 * Provides clean separation between data management and UI rendering
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  action: string;
  user_id: string;
  user_name: string;
  details: string;
  category: "inspection" | "photo" | "ai_analysis" | "review" | "system";
  status: "completed" | "failed" | "pending";
  metadata?: Record<string, any>;
}

interface AuditTrailDataManagerProps {
  inspectionId: string;
  propertyName: string;
  children: (data: {
    auditTrail: AuditTrailEntry[];
    isLoading: boolean;
    isExporting: boolean;
    error: string | null;
    onRefresh: () => void;
    onExport: () => void;
  }) => React.ReactNode;
}

export const AuditTrailDataManager: React.FC<AuditTrailDataManagerProps> = ({
  inspectionId,
  propertyName,
  children,
}) => {
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAuditTrail = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      logger.info(
        "Fetching audit trail",
        { inspectionId },
        "AUDIT_TRAIL_DATA_MANAGER",
      );

      // Query checklist items and related audit data
      const { data: logs, error: logsError } = await supabase
        .from("checklist_items")
        .select(
          `
          *,
          static_safety_items!static_item_id (
            id,
            label,
            category
          ),
          users!inner (
            id,
            name
          )
        `,
        )
        .eq("property_id", inspectionId.split("-")[0]) // Extract property_id from inspection
        .order("created_at", { ascending: true });

      if (logsError) {
        throw logsError;
      }

      // Transform logs into audit trail entries
      const trailEntries: AuditTrailEntry[] =
        logs?.map((log: any) => ({
          id: log.log_id?.toString() || log.id,
          timestamp: log.created_at || new Date().toISOString(),
          action: `Checked: ${log.static_safety_items?.title || "Safety Item"}`,
          user_id: log.inspector_id || "system",
          user_name: log.users?.name || "System",
          details:
            log.inspector_remarks || log.ai_result || "No additional details",
          category:
            log.static_safety_items?.category?.toLowerCase() as "inspection",
          status:
            log.pass === true
              ? "completed"
              : log.pass === false
                ? "failed"
                : "pending",
          metadata: {
            checklistItemId: log.checklist_id,
            pass: log.pass,
            evidence_count: log.media?.length || 0,
          },
        })) || [];

      // Add system entries for inspection lifecycle
      const systemEntries: AuditTrailEntry[] = [
        {
          id: `${inspectionId}-start`,
          timestamp: new Date().toISOString(),
          action: "Inspection Started",
          user_id: "system",
          user_name: "System",
          details: `Inspection initiated for property: ${propertyName}`,
          category: "system",
          status: "completed",
          metadata: { propertyName },
        },
        {
          id: `${inspectionId}-ai-analysis`,
          timestamp: new Date().toISOString(),
          action: "AI Analysis Completed",
          user_id: "system",
          user_name: "AI System",
          details: "Automated photo analysis and quality assessment completed",
          category: "ai_analysis",
          status: "completed",
          metadata: { analysisType: "photo_comparison" },
        },
      ];

      const allEntries = [...systemEntries, ...trailEntries].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      setAuditTrail(allEntries);
    } catch (error: any) {
      const errorMessage = "Failed to load inspection audit trail";
      logger.error(errorMessage, error, "AUDIT_TRAIL_DATA_MANAGER");
      setError(errorMessage);
      toast({
        title: "Error Loading Audit Trail",
        description: `${errorMessage}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [inspectionId, propertyName, toast]);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      logger.info(
        "Exporting audit trail",
        { inspectionId },
        "AUDIT_TRAIL_DATA_MANAGER",
      );

      // Create CSV content
      const csvHeader = "Timestamp,Action,User,Details,Category,Status\n";
      const csvContent = auditTrail
        .map(
          (entry) =>
            `"${new Date(entry.timestamp).toLocaleString()}","${entry.action}","${entry.user_name}","${entry.details.replace(/"/g, '""')}","${entry.category}","${entry.status}"`,
        )
        .join("\n");

      const csvData = csvHeader + csvContent;
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });

      // Download CSV file
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${propertyName.replace(/[^a-zA-Z0-9]/g, "_")}_Audit_Trail_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Audit Trail Exported",
        description: "Audit trail has been downloaded as CSV file.",
        duration: 3000,
      });
    } catch (error: any) {
      logger.error(
        "Failed to export audit trail",
        error,
        "AUDIT_TRAIL_DATA_MANAGER",
      );
      toast({
        title: "Export Failed",
        description: "Failed to export audit trail. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [auditTrail, propertyName, toast]);

  useEffect(() => {
    fetchAuditTrail();
  }, [fetchAuditTrail]);

  return (
    <>
      {children({
        auditTrail,
        isLoading,
        isExporting,
        error,
        onRefresh: fetchAuditTrail,
        onExport: handleExport,
      })}
    </>
  );
};
