/**
 * Photo Viewer - Side-by-side photo display component
 * Extracted from PhotoComparisonView.tsx
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, RefreshCw } from "lucide-react";

interface PhotoViewerProps {
  inspectionPhoto: string;
  listingPhoto: string;
  isAnalyzing: boolean;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  inspectionPhoto,
  listingPhoto,
  isAnalyzing,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<
    "inspection" | "listing" | null
  >(null);

  const handlePhotoClick = (type: "inspection" | "listing") => {
    setSelectedPhoto(selectedPhoto === type ? null : type);
  };

  if (selectedPhoto) {
    const photoUrl =
      selectedPhoto === "inspection" ? inspectionPhoto : listingPhoto;
    return (
      <div
        id="photo-viewer-fullscreen"
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      >
        <div className="relative max-w-4xl max-h-full">
          <img
            src={photoUrl}
            alt={`${selectedPhoto} photo`}
            className="max-w-full max-h-full object-contain"
          />
          <Button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70"
            variant="ghost"
            size="sm"
          >
            ×
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="photo-viewer-comparison"
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {/* Inspection Photo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Inspector Photo
            <Badge variant="outline">Current</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="relative group cursor-pointer"
            onClick={() => handlePhotoClick("inspection")}
          >
            <img
              src={inspectionPhoto}
              alt="Inspector captured photo"
              className="w-full h-64 object-cover rounded-lg transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {isAnalyzing && (
              <div className="absolute inset-0 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Listing Photo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Listing Photo
            <Badge variant="secondary">Reference</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="relative group cursor-pointer"
            onClick={() => handlePhotoClick("listing")}
          >
            <img
              src={listingPhoto}
              alt="Property listing photo"
              className="w-full h-64 object-cover rounded-lg transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
