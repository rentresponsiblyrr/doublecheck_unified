import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera, Home, Shield, Star, TrendingUp, Users } from "lucide-react";
import { SuggestionCard } from "./SuggestionCard";
import { OptimizationSuggestion } from "./types";

interface SuggestionTabsProps {
  suggestions: OptimizationSuggestion[];
}

export const SuggestionTabs: React.FC<SuggestionTabsProps> = ({
  suggestions,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "photos":
        return <Camera className="w-4 h-4" />;
      case "pricing":
        return <TrendingUp className="w-4 h-4" />;
      case "amenities":
        return <Home className="w-4 h-4" />;
      case "description":
        return <Users className="w-4 h-4" />;
      case "safety":
        return <Shield className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const categories = [
    "all",
    "photos",
    "pricing",
    "amenities",
    "description",
    "safety",
  ];

  const getFilteredSuggestions = (
    category: string,
  ): OptimizationSuggestion[] => {
    if (category === "all") return suggestions;
    return suggestions.filter((s) => s.category === category);
  };

  const getCategoryLabel = (category: string): string => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (!suggestions.length) {
    return (
      <div id="no-suggestions-message" className="text-center py-8">
        <p className="text-gray-500">No optimization suggestions available.</p>
      </div>
    );
  }

  return (
    <Tabs id="suggestion-tabs" defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => (
          <TabsTrigger
            key={category}
            value={category}
            className="flex items-center gap-1"
          >
            {getCategoryIcon(category)}
            <span className="hidden sm:inline">
              {getCategoryLabel(category)}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {categories.map((category) => (
        <TabsContent key={category} value={category} className="mt-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="grid gap-4">
              {getFilteredSuggestions(category).map((suggestion) => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
};
