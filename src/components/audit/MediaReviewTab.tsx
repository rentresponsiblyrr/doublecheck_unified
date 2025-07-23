/**
 * Media Review Tab Component
 * Extracted from InspectionReviewPanel.tsx
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Video } from "lucide-react";

interface MediaReviewTabProps {
  type: "photos" | "videos";
  count: number;
}

export const MediaReviewTab: React.FC<MediaReviewTabProps> = ({
  type,
  count,
}) => {
  const Icon = type === "photos" ? Camera : Video;
  const title = type === "photos" ? "Photo Review" : "Video Review";
  const description =
    type === "photos"
      ? "Display inspection photos with AI analysis overlay"
      : "Enhanced video player with timeline annotations";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title} ({count} {type})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <Icon className="h-12 w-12 mx-auto mb-4" />
          <p>{title} interface would be implemented here</p>
          <p className="text-sm">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};
