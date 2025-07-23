import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Flag, Info } from "lucide-react";
import { VideoTimestamp } from "./types";

interface VideoTimestampsProps {
  timestamps: VideoTimestamp[];
  currentTime: number;
  onTimestampClick: (timestamp: VideoTimestamp) => void;
}

export const VideoTimestamps: React.FC<VideoTimestampsProps> = ({
  timestamps,
  currentTime,
  onTimestampClick,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getCategoryIcon = (category: VideoTimestamp["category"]) => {
    switch (category) {
      case "issue":
        return <Flag className="w-4 h-4 text-red-500" />;
      case "note":
        return <Info className="w-4 h-4 text-blue-500" />;
      case "highlight":
        return <MapPin className="w-4 h-4 text-green-500" />;
    }
  };

  const getCategoryColor = (category: VideoTimestamp["category"]): string => {
    switch (category) {
      case "issue":
        return "border-red-200 bg-red-50";
      case "note":
        return "border-blue-200 bg-blue-50";
      case "highlight":
        return "border-green-200 bg-green-50";
    }
  };

  const isNearCurrentTime = (time: number): boolean => {
    return Math.abs(currentTime - time) < 2; // Within 2 seconds
  };

  return (
    <div id="video-timestamps" className="space-y-4">
      <h3 className="font-medium text-gray-900">Inspection Timeline</h3>

      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {timestamps.map((timestamp, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${getCategoryColor(
                timestamp.category,
              )} ${
                isNearCurrentTime(timestamp.time)
                  ? "ring-2 ring-blue-500 ring-opacity-50"
                  : ""
              }`}
              onClick={() => onTimestampClick(timestamp)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(timestamp.category)}
                  <Badge variant="outline" className="text-xs">
                    {formatTime(timestamp.time)}
                  </Badge>
                </div>
                {timestamp.inspector && (
                  <Badge variant="secondary" className="text-xs">
                    {timestamp.inspector}
                  </Badge>
                )}
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">
                {timestamp.description}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      {timestamps.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No timestamps available</p>
        </div>
      )}
    </div>
  );
};
