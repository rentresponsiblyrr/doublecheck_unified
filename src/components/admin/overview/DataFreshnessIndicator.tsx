/**
 * Elite Data Freshness Indicator
 * Netflix-grade real-time data status indicators
 */

import React, { useState, useEffect } from "react";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataFreshnessIndicatorProps {
  lastUpdated: Date;
  isLoading?: boolean;
  hasError?: boolean;
  onRefresh?: () => void;
  autoRefreshInterval?: number; // in milliseconds
  stalenessThreshold?: number; // in milliseconds
  showAutoRefresh?: boolean;
  variant?: "compact" | "detailed" | "badge-only";
  metricName?: string;
}

export const DataFreshnessIndicator: React.FC<DataFreshnessIndicatorProps> = ({
  lastUpdated,
  isLoading = false,
  hasError = false,
  onRefresh,
  autoRefreshInterval = 300000, // 5 minutes
  stalenessThreshold = 300000, // 5 minutes
  showAutoRefresh = false,
  variant = "compact",
  metricName = "Data",
}) => {
  const [timeAgo, setTimeAgo] = useState("");
  const [isStale, setIsStale] = useState(false);
  const [nextAutoRefresh, setNextAutoRefresh] = useState<number | null>(null);

  // Update time ago and staleness
  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastUpdated.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      // Format time ago
      if (diffMs < 30000) setTimeAgo("Just now");
      else if (diffMinutes < 1) setTimeAgo(`${Math.floor(diffMs / 1000)}s ago`);
      else if (diffMinutes < 60) setTimeAgo(`${diffMinutes}m ago`);
      else if (diffHours < 24) setTimeAgo(`${diffHours}h ago`);
      else setTimeAgo(`${diffDays}d ago`);

      // Check staleness
      setIsStale(diffMs > stalenessThreshold);

      // Update next auto refresh countdown
      if (showAutoRefresh && autoRefreshInterval) {
        const timeSinceLastUpdate = diffMs;
        const timeUntilNextRefresh =
          autoRefreshInterval - (timeSinceLastUpdate % autoRefreshInterval);
        setNextAutoRefresh(Math.max(0, timeUntilNextRefresh));
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000); // Update every second

    return () => clearInterval(interval);
  }, [lastUpdated, stalenessThreshold, autoRefreshInterval, showAutoRefresh]);

  // Auto refresh functionality
  useEffect(() => {
    if (!showAutoRefresh || !onRefresh || !autoRefreshInterval) return;

    const autoRefreshTimer = setInterval(() => {
      const diffMs = Date.now() - lastUpdated.getTime();
      if (diffMs >= autoRefreshInterval) {
        onRefresh();
      }
    }, autoRefreshInterval);

    return () => clearInterval(autoRefreshTimer);
  }, [lastUpdated, autoRefreshInterval, onRefresh, showAutoRefresh]);

  const getStatusColor = () => {
    if (hasError) return "text-red-600";
    if (isLoading) return "text-blue-600";
    if (isStale) return "text-amber-600";
    return "text-green-600";
  };

  const getStatusIcon = () => {
    if (hasError) return AlertTriangle;
    if (isLoading) return RefreshCw;
    if (isStale) return Clock;
    return CheckCircle;
  };

  const getStatusBadgeVariant = ():
    | "default"
    | "secondary"
    | "destructive"
    | "outline" => {
    if (hasError) return "destructive";
    if (isStale) return "outline";
    return "secondary";
  };

  const getStatusText = () => {
    if (hasError) return "Error";
    if (isLoading) return "Updating";
    if (isStale) return "Stale";
    return "Fresh";
  };

  const formatNextRefresh = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const StatusIcon = getStatusIcon();

  if (variant === "badge-only") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={getStatusBadgeVariant()}
              className={cn("text-xs cursor-help", getStatusColor())}
            >
              <StatusIcon
                className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")}
              />
              {getStatusText()}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div className="font-medium">{metricName} Status</div>
              <div>Last updated: {timeAgo}</div>
              {hasError && <div className="text-red-400">Update failed</div>}
              {isStale && (
                <div className="text-amber-400">Data may be outdated</div>
              )}
              {showAutoRefresh && nextAutoRefresh && (
                <div>Next refresh: {formatNextRefresh(nextAutoRefresh)}</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn("flex items-center text-xs space-x-2", getStatusColor())}
      >
        <StatusIcon className={cn("h-3 w-3", isLoading && "animate-spin")} />
        <span>{timeAgo}</span>
        {(isStale || hasError) && (
          <Badge
            variant={getStatusBadgeVariant()}
            className="text-xs px-1 py-0"
          >
            {getStatusText()}
          </Badge>
        )}
        {onRefresh && !isLoading && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            className="h-5 w-5 p-0 hover:bg-gray-100"
            title="Refresh data"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded border">
      <div className="flex items-center space-x-2">
        <div className={cn("flex items-center space-x-1", getStatusColor())}>
          <StatusIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
          <span className="font-medium">{metricName}</span>
        </div>

        <Badge variant={getStatusBadgeVariant()} className="text-xs">
          {getStatusText()}
        </Badge>

        <span className="text-gray-500">Updated {timeAgo}</span>
      </div>

      <div className="flex items-center space-x-2">
        {showAutoRefresh && nextAutoRefresh && !isLoading && (
          <div className="flex items-center text-gray-400 space-x-1">
            <Wifi className="h-3 w-3" />
            <span>Auto refresh: {formatNextRefresh(nextAutoRefresh)}</span>
          </div>
        )}

        {hasError && (
          <div className="flex items-center text-red-400 space-x-1">
            <WifiOff className="h-3 w-3" />
            <span>Connection issue</span>
          </div>
        )}

        {onRefresh && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-6 text-xs"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Updating
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

// Specialized indicators for different contexts
export const MetricFreshnessIndicator: React.FC<{
  lastUpdated: Date;
  metricName: string;
  isLoading?: boolean;
  hasError?: boolean;
  onRefresh?: () => void;
}> = ({ lastUpdated, metricName, isLoading, hasError, onRefresh }) => (
  <DataFreshnessIndicator
    lastUpdated={lastUpdated}
    metricName={metricName}
    isLoading={isLoading}
    hasError={hasError}
    onRefresh={onRefresh}
    variant="compact"
    stalenessThreshold={300000} // 5 minutes
  />
);

export const DashboardFreshnessIndicator: React.FC<{
  lastUpdated: Date;
  isLoading?: boolean;
  hasError?: boolean;
  onRefresh?: () => void;
  showAutoRefresh?: boolean;
}> = ({
  lastUpdated,
  isLoading,
  hasError,
  onRefresh,
  showAutoRefresh = true,
}) => (
  <DataFreshnessIndicator
    lastUpdated={lastUpdated}
    metricName="Dashboard"
    isLoading={isLoading}
    hasError={hasError}
    onRefresh={onRefresh}
    variant="detailed"
    showAutoRefresh={showAutoRefresh}
    autoRefreshInterval={300000} // 5 minutes
    stalenessThreshold={600000} // 10 minutes
  />
);

export const RealTimeFreshnessIndicator: React.FC<{
  lastUpdated: Date;
  isConnected?: boolean;
  connectionQuality?: "excellent" | "good" | "poor" | "offline";
}> = ({ lastUpdated, isConnected = true, connectionQuality = "excellent" }) => {
  const getConnectionIcon = () => {
    if (!isConnected || connectionQuality === "offline") return WifiOff;
    return Wifi;
  };

  const getConnectionColor = () => {
    switch (connectionQuality) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "poor":
        return "text-amber-600";
      case "offline":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const ConnectionIcon = getConnectionIcon();

  return (
    <div className="flex items-center space-x-2 text-xs">
      <div className={cn("flex items-center space-x-1", getConnectionColor())}>
        <ConnectionIcon className="h-3 w-3" />
        <span className="capitalize">{connectionQuality}</span>
      </div>
      <DataFreshnessIndicator
        lastUpdated={lastUpdated}
        variant="badge-only"
        stalenessThreshold={60000} // 1 minute for real-time
        hasError={!isConnected}
      />
    </div>
  );
};
