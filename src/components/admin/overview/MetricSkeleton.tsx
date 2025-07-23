/**
 * Elite Metric Loading Skeletons
 * Netflix-grade loading states for optimal UX
 */

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricSkeletonProps {
  count?: number;
  variant?: "default" | "compact" | "detailed" | "chart";
  showHeader?: boolean;
  animate?: boolean;
}

export const MetricSkeleton: React.FC<MetricSkeletonProps> = ({
  count = 4,
  variant = "default",
  showHeader = false,
  animate = true,
}) => {
  const skeletonClass = animate ? "animate-pulse" : "";

  const renderSkeletonCard = (index: number) => {
    switch (variant) {
      case "compact":
        return (
          <Card key={index} className="p-4">
            <div className={skeletonClass}>
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </Card>
        );

      case "detailed":
        return (
          <Card key={index} className="p-6">
            <div className={skeletonClass}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-10 w-20 mb-3" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="mt-4 pt-4 border-t">
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </Card>
        );

      case "chart":
        return (
          <Card key={index} className="p-6">
            <div className={skeletonClass}>
              {showHeader && (
                <CardHeader className="pb-4">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-3 w-64" />
                </CardHeader>
              )}
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-end space-x-2">
                    {[1, 2, 3, 4, 5, 6].map((bar) => (
                      <Skeleton
                        key={bar}
                        className={`w-8 bg-gray-200`}
                        style={{ height: `${Math.random() * 100 + 40}px` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    {[1, 2, 3, 4, 5, 6].map((label) => (
                      <Skeleton key={label} className="h-3 w-6" />
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </div>
          </Card>
        );

      default:
        return (
          <Card key={index} className="p-6">
            <div className={skeletonClass}>
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16 mb-2" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </Card>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => renderSkeletonCard(i))}
    </div>
  );
};

// Specialized skeletons for different dashboard sections
export const DashboardOverviewSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="animate-pulse">
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-96" />
    </div>

    {/* Quick stats skeleton */}
    <MetricSkeleton count={4} variant="default" />

    {/* Charts section skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MetricSkeleton count={1} variant="chart" showHeader />
      <MetricSkeleton count={1} variant="chart" showHeader />
    </div>

    {/* Recent activity skeleton */}
    <Card className="p-6">
      <div className="animate-pulse">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  </div>
);

export const QuickActionsSkeleton: React.FC = () => (
  <Card className="p-6">
    <div className="animate-pulse">
      <div className="flex items-center mb-4">
        <Skeleton className="h-5 w-5 mr-2" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((action) => (
          <div key={action} className="p-4 border rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-4 w-8 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-32 mb-3" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    </div>
  </Card>
);

export const TrendChartSkeleton: React.FC = () => (
  <Card className="p-6">
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Chart area */}
      <div className="relative h-64 mb-4">
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between space-x-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bar) => (
            <Skeleton
              key={bar}
              className="flex-1 bg-blue-200"
              style={{ height: `${Math.random() * 160 + 40}px` }}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6">
        <div className="flex items-center">
          <Skeleton className="h-3 w-3 rounded-full mr-2" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center">
          <Skeleton className="h-3 w-3 rounded-full mr-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  </Card>
);

// Pulse animation variants
export const MetricSkeletonPulse: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="animate-pulse">{children}</div>;

export const MetricSkeletonShimmer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="relative overflow-hidden">
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gray-100 to-transparent animate-[shimmer_2s_infinite]"></div>
    {children}
  </div>
);

// Loading state with custom messages
export const MetricLoadingState: React.FC<{
  message?: string;
  submessage?: string;
  variant?: "default" | "compact" | "detailed" | "chart";
}> = ({
  message = "Loading dashboard metrics...",
  submessage = "Please wait while we fetch the latest data",
  variant = "default",
}) => (
  <div className="space-y-6">
    <div className="text-center py-8">
      <div className="animate-pulse">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
        <p className="text-sm text-gray-500">{submessage}</p>
      </div>
    </div>
    <MetricSkeleton variant={variant} animate={false} />
  </div>
);
