import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Lightbulb, Target, CheckCircle2 } from "lucide-react";

interface PhotoCaptureGuideProps {
  category: string;
  label: string;
}

export const PhotoCaptureGuide: React.FC<PhotoCaptureGuideProps> = ({
  category,
  label
}) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'safety':
        return '🔒';
      case 'amenities':
        return '✨';
      case 'cleanliness':
        return '🧽';
      case 'maintenance':
        return '🔧';
      default:
        return '📋';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'safety':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'amenities':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cleanliness':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPhotoTips = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'safety':
        return [
          "Capture clear view of safety equipment",
          "Show any damage or wear clearly",
          "Include surrounding context for location"
        ];
      case 'amenities':
        return [
          "Show the full amenity in operation if possible",
          "Capture quality and condition details",
          "Include any associated accessories"
        ];
      case 'cleanliness':
        return [
          "Use good lighting to show true condition",
          "Capture any stains, dirt, or damage",
          "Show overall area cleanliness"
        ];
      case 'maintenance':
        return [
          "Document any visible issues clearly",
          "Show serial numbers or labels if relevant",
          "Capture before/after if repairs needed"
        ];
      default:
        return [
          "Take clear, well-lit photos",
          "Show the item from multiple angles",
          "Ensure all relevant details are visible"
        ];
    }
  };

  return (
    <Card id="photo-capture-guide" className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {label}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getCategoryColor(category)}>
                  <span className="mr-1">{getCategoryIcon(category)}</span>
                  {category}
                </Badge>
              </div>
            </div>
            <Camera className="w-6 h-6 text-blue-600" />
          </div>

          {/* Photo Tips */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
              <Lightbulb className="w-4 h-4" />
              Photo Guidelines:
            </div>
            <ul className="space-y-1">
              {getPhotoTips(category).map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-700">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Quality Requirements */}
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Target className="w-4 h-4" />
              Quality Requirements:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>✓ Well-lit and clear</div>
              <div>✓ In focus</div>
              <div>✓ Proper framing</div>
              <div>✓ Relevant details visible</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};