/**
 * @fileoverview Auditor Metrics Overview Component
 * Displays auditor performance metrics, statistics, and analytics
 * ENTERPRISE GRADE: Single responsibility for metrics display
 *
 * @author STR Certified Engineering Team
 * @version 2.0.0
 */

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Award,
  Target,
  Zap,
  Calendar,
  Users,
} from "lucide-react";

interface AuditorMetrics {
  totalReviewed: number;
  approved: number;
  rejected: number;
  averageReviewTime: number;
  accuracyScore: number;
  completionRate: number;
  dailyTarget: number;
  dailyCompleted: number;
  weeklyStats: {
    thisWeek: number;
    lastWeek: number;
    weekOverWeekGrowth: number;
  };
  qualityMetrics: {
    consistencyScore: number;
    thoroughnessScore: number;
    timeliness: number;
  };
  learningProgress: {
    level: number;
    experiencePoints: number;
    nextLevelXP: number;
    badges: string[];
  };
}

interface AuditorMetricsOverviewProps {
  metrics: AuditorMetrics;
  isLoading: boolean;
  auditorName?: string;
}

export const AuditorMetricsOverview: React.FC<AuditorMetricsOverviewProps> = ({
  metrics,
  isLoading,
  auditorName = "Auditor",
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const dailyProgress = (metrics.dailyCompleted / metrics.dailyTarget) * 100;
  const approvalRate =
    metrics.totalReviewed > 0
      ? (metrics.approved / metrics.totalReviewed) * 100
      : 0;
  const rejectionRate =
    metrics.totalReviewed > 0
      ? (metrics.rejected / metrics.totalReviewed) * 100
      : 0;

  const getScoreColor = (score: number): string => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return "default";
    if (score >= 80) return "secondary";
    if (score >= 70) return "outline";
    return "destructive";
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Award className="h-6 w-6 text-yellow-600" />
            <span>Welcome back, {auditorName}!</span>
            <Badge variant="outline" className="ml-auto">
              Level {metrics.learningProgress.level}
            </Badge>
          </CardTitle>
          <CardDescription>
            Your audit performance and progress overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Daily Progress</span>
                <span>
                  {metrics.dailyCompleted}/{metrics.dailyTarget}
                </span>
              </div>
              <Progress value={dailyProgress} className="h-2" />
              <div className="text-xs text-gray-600">
                {dailyProgress >= 100
                  ? "🎉 Daily target achieved!"
                  : `${Math.max(0, metrics.dailyTarget - metrics.dailyCompleted)} more to reach daily target`}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Experience Progress</span>
                <span>
                  {metrics.learningProgress.experiencePoints}/
                  {metrics.learningProgress.nextLevelXP} XP
                </span>
              </div>
              <Progress
                value={
                  (metrics.learningProgress.experiencePoints /
                    metrics.learningProgress.nextLevelXP) *
                  100
                }
                className="h-2"
              />
              <div className="text-xs text-gray-600">
                {metrics.learningProgress.nextLevelXP -
                  metrics.learningProgress.experiencePoints}{" "}
                XP to next level
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {metrics.learningProgress.badges
                .slice(0, 3)
                .map((badge, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    🏆 {badge}
                  </Badge>
                ))}
              {metrics.learningProgress.badges.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{metrics.learningProgress.badges.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Reviewed */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Reviewed
                </p>
                <p className="text-2xl font-bold">
                  {metrics.totalReviewed.toLocaleString()}
                </p>
                <div className="flex items-center mt-2 text-xs">
                  {metrics.weeklyStats.weekOverWeekGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  <span
                    className={
                      metrics.weeklyStats.weekOverWeekGrowth >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {Math.abs(metrics.weeklyStats.weekOverWeekGrowth)}% vs last
                    week
                  </span>
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Accuracy Score */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Accuracy Score
                </p>
                <p
                  className={`text-2xl font-bold ${getScoreColor(metrics.accuracyScore)}`}
                >
                  {metrics.accuracyScore}%
                </p>
                <Badge
                  variant={getScoreBadgeVariant(metrics.accuracyScore)}
                  className="mt-2"
                >
                  {metrics.accuracyScore >= 90
                    ? "Excellent"
                    : metrics.accuracyScore >= 80
                      ? "Good"
                      : metrics.accuracyScore >= 70
                        ? "Fair"
                        : "Needs Improvement"}
                </Badge>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Average Review Time */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Review Time
                </p>
                <p className="text-2xl font-bold">
                  {formatTime(metrics.averageReviewTime)}
                </p>
                <div className="flex items-center mt-2 text-xs">
                  <Clock className="h-3 w-3 mr-1 text-blue-500" />
                  <span className="text-gray-600">Per inspection</span>
                </div>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.completionRate}%
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span>On-time reviews</span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quality Metrics</CardTitle>
            <CardDescription>
              Assessment of audit quality and consistency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Consistency Score</span>
                <span
                  className={getScoreColor(
                    metrics.qualityMetrics.consistencyScore,
                  )}
                >
                  {metrics.qualityMetrics.consistencyScore}%
                </span>
              </div>
              <Progress
                value={metrics.qualityMetrics.consistencyScore}
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Thoroughness Score</span>
                <span
                  className={getScoreColor(
                    metrics.qualityMetrics.thoroughnessScore,
                  )}
                >
                  {metrics.qualityMetrics.thoroughnessScore}%
                </span>
              </div>
              <Progress
                value={metrics.qualityMetrics.thoroughnessScore}
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Timeliness</span>
                <span
                  className={getScoreColor(metrics.qualityMetrics.timeliness)}
                >
                  {metrics.qualityMetrics.timeliness}%
                </span>
              </div>
              <Progress
                value={metrics.qualityMetrics.timeliness}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Distribution</CardTitle>
            <CardDescription>
              Breakdown of your review decisions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Approved
                </span>
                <span className="font-medium">
                  {metrics.approved} ({approvalRate.toFixed(1)}%)
                </span>
              </div>
              <Progress value={approvalRate} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-red-500" />
                  Rejected
                </span>
                <span className="font-medium">
                  {metrics.rejected} ({rejectionRate.toFixed(1)}%)
                </span>
              </div>
              <Progress value={rejectionRate} className="h-2" />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Weekly Performance:</strong>{" "}
                {metrics.weeklyStats.thisWeek} reviews this week vs{" "}
                {metrics.weeklyStats.lastWeek} last week
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
