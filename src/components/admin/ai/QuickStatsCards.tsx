/**
 * AI Dashboard Quick Stats Cards Component
 * Displays key AI performance metrics in card layout
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Target,
  Users,
  Zap,
  Brain,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import type {
  ModelPerformanceMetrics,
  LearningInsight,
} from "@/types/ai-database";

interface QuickStatsCardsProps {
  modelPerformance: ModelPerformanceMetrics | null;
  learningInsights: LearningInsight[];
}

export const QuickStatsCards: React.FC<QuickStatsCardsProps> = ({
  modelPerformance,
  learningInsights,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Overall Accuracy
              </p>
              <p className="text-2xl font-bold text-green-600">
                {modelPerformance?.overall_accuracy.toFixed(1)}%
              </p>
            </div>
            <Target className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            {modelPerformance?.accuracy_trend &&
            modelPerformance.accuracy_trend > 0 ? (
              <>
                <TrendingUp className="h-3 w-3 mr-1" />+
                {modelPerformance.accuracy_trend.toFixed(1)}% from last week
              </>
            ) : modelPerformance?.accuracy_trend &&
              modelPerformance.accuracy_trend < 0 ? (
              <>
                <TrendingDown className="h-3 w-3 mr-1" />
                {modelPerformance.accuracy_trend.toFixed(1)}% from last week
              </>
            ) : (
              <>
                <Target className="h-3 w-3 mr-1" />
                No change from last week
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Feedback Volume
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {modelPerformance?.feedback_volume || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            {modelPerformance?.feedback_trend &&
            modelPerformance.feedback_trend > 0 ? (
              <>
                <TrendingUp className="h-3 w-3 mr-1" />+
                {modelPerformance.feedback_trend.toFixed(1)}% from last week
              </>
            ) : modelPerformance?.feedback_trend &&
              modelPerformance.feedback_trend < 0 ? (
              <>
                <TrendingDown className="h-3 w-3 mr-1" />
                {modelPerformance.feedback_trend.toFixed(1)}% from last week
              </>
            ) : (
              <>
                <Users className="h-3 w-3 mr-1" />
                No change from last week
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Avg Processing
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {modelPerformance?.avg_processing_time || 0}ms
              </p>
            </div>
            <Zap className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            {modelPerformance?.processing_time_trend &&
            modelPerformance.processing_time_trend > 0 ? (
              <>
                <TrendingUp className="h-3 w-3 mr-1 text-red-500" />+
                {modelPerformance.processing_time_trend.toFixed(1)}% from last
                week
              </>
            ) : modelPerformance?.processing_time_trend &&
              modelPerformance.processing_time_trend < 0 ? (
              <>
                <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
                {modelPerformance.processing_time_trend.toFixed(1)}% from last
                week
              </>
            ) : (
              <>
                <Zap className="h-3 w-3 mr-1" />
                No change from last week
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Learning Insights
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {learningInsights.length}
              </p>
            </div>
            <Brain className="h-8 w-8 text-orange-500" />
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <AlertCircle className="h-3 w-3 mr-1" />
            {
              learningInsights.filter((i) => i.severity === "warning").length
            }{" "}
            require attention
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
