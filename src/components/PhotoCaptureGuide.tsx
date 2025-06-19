
import { Camera, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PhotoCaptureGuideProps {
  category: 'safety' | 'amenity' | 'cleanliness' | 'maintenance';
  label: string;
}

export const PhotoCaptureGuide = ({ category, label }: PhotoCaptureGuideProps) => {
  const getGuidelines = () => {
    switch (category) {
      case 'safety':
        return {
          tips: [
            "Ensure the safety feature is clearly visible and unobstructed",
            "Capture the entire device/feature in the frame",
            "Check that expiration dates are readable if applicable",
            "Include surrounding context to show proper placement"
          ],
          examples: [
            "Fire extinguisher with gauge and inspection tag visible",
            "Smoke detector showing green light/status",
            "Exit signs that are illuminated and unblocked"
          ],
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          color: "border-red-200 bg-red-50"
        };
      case 'amenity':
        return {
          tips: [
            "Show the amenity in its intended use state",
            "Capture multiple angles if the amenity is large",
            "Include any control panels or interfaces",
            "Verify cleanliness and working condition"
          ],
          examples: [
            "Hot tub with clear water and functioning jets",
            "Game room showing all equipment and space",
            "Kitchen appliances that appear clean and operational"
          ],
          icon: <Camera className="w-5 h-5 text-blue-500" />,
          color: "border-blue-200 bg-blue-50"
        };
      case 'cleanliness':
        return {
          tips: [
            "Focus on areas that guests will notice first",
            "Capture overall room condition, not just details",
            "Include corners, surfaces, and high-touch areas",
            "Document any cleaning supplies or maintenance needs"
          ],
          examples: [
            "Bathroom showing clean fixtures and surfaces",
            "Kitchen with clean counters and appliances",
            "Living areas with fresh linens and tidy appearance"
          ],
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          color: "border-green-200 bg-green-50"
        };
      default:
        return {
          tips: [
            "Document the current condition clearly",
            "Show any wear, damage, or maintenance needs",
            "Include before/after if repairs are made",
            "Capture serial numbers or model information if relevant"
          ],
          examples: [
            "HVAC filters showing condition and size",
            "Appliance maintenance records or service dates",
            "Structural elements showing wear or damage"
          ],
          icon: <Info className="w-5 h-5 text-yellow-500" />,
          color: "border-yellow-200 bg-yellow-50"
        };
    }
  };

  const guidelines = getGuidelines();

  return (
    <div className={`rounded-lg border-2 p-4 mb-4 ${guidelines.color}`}>
      <div className="flex items-center gap-2 mb-3">
        {guidelines.icon}
        <h4 className="font-semibold text-gray-900">Photo Guidelines</h4>
        <Badge variant="outline" className="text-xs">
          {category.toUpperCase()}
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">📋 Best Practices:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {guidelines.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">💡 Examples:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {guidelines.examples.map((example, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>{example}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
