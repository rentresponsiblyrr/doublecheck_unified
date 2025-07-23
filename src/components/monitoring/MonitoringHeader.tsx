/**
 * Monitoring Header - Enterprise Grade
 *
 * Dashboard header with title, last update time, and action buttons
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download } from "lucide-react";

interface MonitoringHeaderProps {
  lastUpdate: Date;
  onRefresh: () => void;
  onExport: () => void;
  isLoading: boolean;
}

export const MonitoringHeader: React.FC<MonitoringHeaderProps> = ({
  lastUpdate,
  onRefresh,
  onExport,
  isLoading,
}) => {
  return (
    <div id="monitoring-header" className="flex justify-between items-center">
      <div id="dashboard-title">
        <h2 className="text-2xl font-bold">Inspection Monitoring Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>
      <div id="dashboard-actions" className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>
    </div>
  );
};
