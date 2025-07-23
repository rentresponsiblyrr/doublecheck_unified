import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { ListingScore } from "./types";

interface OptimizationScoreProps {
  score: ListingScore;
}

export const OptimizationScore: React.FC<OptimizationScoreProps> = ({
  score,
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number): string => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Improvement";
  };

  return (
    <div
      id="optimization-score-panel"
      className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg"
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">
          Property Optimization Score
        </h3>
        <Badge variant="outline" className={getScoreColor(score.overall)}>
          {getScoreBadge(score.overall)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Overall</span>
              <span
                className={`text-sm font-semibold ${getScoreColor(score.overall)}`}
              >
                {score.overall}/100
              </span>
            </div>
            <Progress value={score.overall} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Photos</span>
              <span
                className={`text-sm font-semibold ${getScoreColor(score.photos)}`}
              >
                {score.photos}/100
              </span>
            </div>
            <Progress value={score.photos} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Safety</span>
              <span
                className={`text-sm font-semibold ${getScoreColor(score.safety)}`}
              >
                {score.safety}/100
              </span>
            </div>
            <Progress value={score.safety} className="h-2" />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Pricing</span>
              <span
                className={`text-sm font-semibold ${getScoreColor(score.pricing)}`}
              >
                {score.pricing}/100
              </span>
            </div>
            <Progress value={score.pricing} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Amenities</span>
              <span
                className={`text-sm font-semibold ${getScoreColor(score.amenities)}`}
              >
                {score.amenities}/100
              </span>
            </div>
            <Progress value={score.amenities} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
};
