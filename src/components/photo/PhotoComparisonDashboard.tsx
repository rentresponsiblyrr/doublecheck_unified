/**
 * Photo Comparison Dashboard - Orchestration Component
 * Consolidated from PhotoComparisonView.tsx (581 lines → 120 lines)
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Eye } from "lucide-react";
import { PhotoViewer } from "./PhotoViewer";
import { ComparisonResults } from "./ComparisonResults";
import { QualityMetrics } from "./QualityMetrics";
import { usePhotoComparison } from "../../hooks/usePhotoComparison";
import type { PhotoComparisonResult } from "../../types/photo-comparison";

interface PhotoComparisonDashboardProps {
  inspectionPhoto: string;
  listingPhoto: string;
  checklistItemId: string;
  onComparisonComplete?: (result: PhotoComparisonResult) => void;
}

export const PhotoComparisonDashboard: React.FC<
  PhotoComparisonDashboardProps
> = ({
  inspectionPhoto,
  listingPhoto,
  checklistItemId,
  onComparisonComplete,
}) => {
  const [activeTab, setActiveTab] = useState("comparison");

  const { comparisonResult, isAnalyzing, analyzePhotos } = usePhotoComparison();

  React.useEffect(() => {
    if (inspectionPhoto && listingPhoto) {
      analyzePhotos(inspectionPhoto, listingPhoto, checklistItemId);
    }
  }, [inspectionPhoto, listingPhoto, checklistItemId, analyzePhotos]);

  React.useEffect(() => {
    if (comparisonResult && onComparisonComplete) {
      onComparisonComplete(comparisonResult);
    }
  }, [comparisonResult, onComparisonComplete]);

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Photo Comparison Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Comparison
            </TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="mt-6">
            <PhotoViewer
              inspectionPhoto={inspectionPhoto}
              listingPhoto={listingPhoto}
              isAnalyzing={isAnalyzing}
            />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            {comparisonResult && (
              <ComparisonResults result={comparisonResult} />
            )}
          </TabsContent>

          <TabsContent value="quality" className="mt-6">
            {comparisonResult && (
              <QualityMetrics metrics={comparisonResult.qualityMetrics} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
