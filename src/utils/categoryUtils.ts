
import { Category } from "@/types/categories";
import { AlertTriangle, Camera, Sparkles, Wrench, Check } from "lucide-react";

// Icon mapping - you can extend this as needed
export const getIconComponent = (iconName: string) => {
  const iconMap = {
    AlertTriangle,
    Camera,
    Sparkles,
    Wrench,
    Check,
  };
  
  return iconMap[iconName as keyof typeof iconMap] || Check;
};

export const getCategoryColor = (category: Category | string) => {
  if (typeof category === 'string') {
    // Fallback for when we only have the category name
    switch (category) {
      case 'safety': return 'bg-red-100 text-red-800 border-red-200';
      case 'amenity': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cleanliness': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
  
  return category.color_class;
};

export const getCategoryIcon = (category: Category | string) => {
  if (typeof category === 'string') {
    // Fallback for when we only have the category name
    switch (category) {
      case 'safety': return AlertTriangle;
      case 'amenity': return Camera;
      case 'cleanliness': return Sparkles;
      case 'maintenance': return Wrench;
      default: return Check;
    }
  }
  
  return getIconComponent(category.icon_name);
};
