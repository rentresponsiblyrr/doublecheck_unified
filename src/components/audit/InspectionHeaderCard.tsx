/**
 * Inspection Header Card Component
 * Extracted from InspectionReviewPanel.tsx
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
import {
  FileText,
  Camera,
  Video,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Inspection } from "@/hooks/useInspectionReview";

interface InspectionHeaderCardProps {
  inspection: Inspection;
  getScoreColor: (score: number) => string;
  getScoreBadgeVariant: (score: number) => string;
}

export const InspectionHeaderCard: React.FC<InspectionHeaderCardProps> = ({
  inspection,
  getScoreColor,
  getScoreBadgeVariant,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6" />
            <span>Inspection Review</span>
          </div>
          <Badge variant="outline">ID: {inspection.id.slice(-8)}</Badge>
        </CardTitle>
        <CardDescription>
          {inspection.propertyAddress} • Inspector: {inspection.inspectorName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">AI Score</div>
            <div
              className={`text-2xl font-bold ${getScoreColor(inspection.aiScore)}`}
            >
              {inspection.aiScore}%
            </div>
            <Badge variant={getScoreBadgeVariant(inspection.aiScore) as any}>
              {inspection.aiScore >= 80
                ? "High Quality"
                : inspection.aiScore >= 60
                  ? "Medium Quality"
                  : "Needs Review"}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Media Count</div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Camera className="h-4 w-4 mr-1 text-gray-500" />
                <span>{inspection.photoCount}</span>
              </div>
              <div className="flex items-center">
                <Video className="h-4 w-4 mr-1 text-gray-500" />
                <span>{inspection.videoCount}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Issues Found</div>
            <div className="flex items-center">
              {inspection.issuesFound > 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                  <span className="text-red-600 font-medium">
                    {inspection.issuesFound}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  <span className="text-green-600 font-medium">None</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Est. Review Time</div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-gray-500" />
              <span>{inspection.estimatedReviewTime} minutes</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
