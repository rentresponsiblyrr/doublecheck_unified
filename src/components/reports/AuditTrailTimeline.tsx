/**
 * Audit Trail Timeline - Focused Component
 *
 * Displays audit trail entries in timeline format with proper accessibility
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  User,
  Camera,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  FileText,
} from "lucide-react";
import type { AuditTrailEntry } from "./AuditTrailDataManager";

interface AuditTrailTimelineProps {
  entries: AuditTrailEntry[];
  className?: string;
}

export const AuditTrailTimeline: React.FC<AuditTrailTimelineProps> = ({
  entries,
  className = "",
}) => {
  const getActionIcon = (category: string, status: string) => {
    switch (category) {
      case "photo":
        return <Camera className="w-4 h-4" />;
      case "ai_analysis":
        return <Eye className="w-4 h-4" />;
      case "review":
        return <User className="w-4 h-4" />;
      case "system":
        return <FileText className="w-4 h-4" />;
      default:
        return status === "completed" ? (
          <CheckCircle className="w-4 h-4" />
        ) : status === "failed" ? (
          <XCircle className="w-4 h-4" />
        ) : (
          <AlertTriangle className="w-4 h-4" />
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "pending":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <ScrollArea
      className={`h-96 w-full ${className}`}
      id="audit-trail-timeline"
    >
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div key={entry.id} className="relative">
            {index < entries.length - 1 && (
              <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200" />
            )}

            <div className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center ${getStatusColor(entry.status)}`}
              >
                {getActionIcon(entry.category, entry.status)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {entry.action}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {entry.category.replace("_", " ")}
                    </Badge>
                    <Badge
                      variant={
                        entry.status === "completed"
                          ? "default"
                          : entry.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {entry.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-1 text-sm text-gray-600">
                  {entry.details}
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {entry.user_name}
                  </div>
                </div>
              </div>
            </div>

            {index < entries.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
