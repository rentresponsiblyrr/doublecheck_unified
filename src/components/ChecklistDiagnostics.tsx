import { useEffect, useState } from "react";
import { debugLogger } from "@/lib/logger/debug-logger";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface AuditEntry {
  id: string;
  inspection_id: string;
  operation_type: string;
  items_affected: number;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface ChecklistDiagnosticsProps {
  inspectionId: string;
}

export const ChecklistDiagnostics = ({
  inspectionId,
}: ChecklistDiagnosticsProps) => {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        const { data, error } = await supabase
          .from("checklist_operations_audit")
          .select("*")
          .eq("inspection_id", inspectionId)
          .order("created_at", { ascending: false });

        if (error) {
          return;
        }

        setAuditEntries(data || []);
      } catch (error) {
        debugLogger.error("Failed to load audit entries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (inspectionId) {
      fetchAuditData();
    }
  }, [inspectionId]);

  if (isLoading) {
    return <div>Loading diagnostics...</div>;
  }

  if (auditEntries.length === 0) {
    return null; // Don't show if no audit entries
  }

  const getIcon = (operationType: string) => {
    switch (operationType) {
      case "populate":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "duplicate_detected":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "cleanup":
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getVariant = (operationType: string) => {
    switch (operationType) {
      case "populate":
        return "default";
      case "duplicate_detected":
        return "destructive";
      case "cleanup":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Checklist Operations Log
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {auditEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              {getIcon(entry.operation_type)}
              <Badge
                variant={
                  getVariant(entry.operation_type) as
                    | "default"
                    | "destructive"
                    | "outline"
                    | "secondary"
                }
              >
                {entry.operation_type}
              </Badge>
              <span className="text-sm text-gray-600">
                {entry.items_affected} items
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(entry.created_at).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
