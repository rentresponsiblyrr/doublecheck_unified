/**
 * Individual Feedback Item Component
 * Handles display and editing of a single feedback item
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  Video,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  FeedbackItem as FeedbackItemType,
  FeedbackCategory,
} from "@/types/learning";

interface FeedbackItemProps {
  item: FeedbackItemType;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onUpdateItem: (updates: Partial<FeedbackItemType>) => void;
}

export const FeedbackItem: React.FC<FeedbackItemProps> = ({
  item,
  isExpanded,
  onToggleExpanded,
  onUpdateItem,
}) => {
  const hasError =
    JSON.stringify(item.aiValue) !== JSON.stringify(item.correctValue);

  const getCategoryColor = (category: FeedbackCategory) => {
    const colors: Record<FeedbackCategory, string> = {
      photo_quality: "bg-blue-100 text-blue-800",
      object_detection: "bg-purple-100 text-purple-800",
      room_classification: "bg-green-100 text-green-800",
      damage_assessment: "bg-red-100 text-red-800",
      completeness_check: "bg-yellow-100 text-yellow-800",
      safety_compliance: "bg-orange-100 text-orange-800",
      amenity_verification: "bg-indigo-100 text-indigo-800",
      measurement_accuracy: "bg-pink-100 text-pink-800",
      condition_rating: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const renderValue = (value: unknown) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return value.toFixed(2);
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return `${value.length} items`;
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-4 transition-all",
        hasError ? "border-red-200 bg-red-50" : "border-gray-200",
        isExpanded && "ring-2 ring-primary ring-offset-2",
      )}
    >
      {/* Item Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <button onClick={onToggleExpanded} className="mt-1">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Badge className={cn("text-xs", getCategoryColor(item.type))}>
                {item.type.replace(/_/g, " ")}
              </Badge>
              {hasError && (
                <Badge variant="destructive" className="text-xs">
                  Correction
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {item.confidenceRating}% confidence
              </Badge>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">AI Prediction</p>
                <p className="text-sm font-mono">{renderValue(item.aiValue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Correct Value</p>
                <p
                  className={cn(
                    "text-sm font-mono",
                    hasError && "text-red-600 font-semibold",
                  )}
                >
                  {renderValue(item.correctValue)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {item.explanation && (
            <Badge variant="secondary" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Explained
            </Badge>
          )}
          {hasError ? (
            <XCircle className="h-5 w-5 text-red-600" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          <Separator />

          {/* Correct Value Input */}
          <div>
            <Label>Correct Value</Label>
            <div className="mt-1">
              {typeof item.aiValue === "boolean" ? (
                <RadioGroup
                  value={String(item.correctValue)}
                  onValueChange={(value) =>
                    onUpdateItem({ correctValue: value === "true" })
                  }
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id={`${item.id}_true`} />
                      <Label htmlFor={`${item.id}_true`}>Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id={`${item.id}_false`} />
                      <Label htmlFor={`${item.id}_false`}>No</Label>
                    </div>
                  </div>
                </RadioGroup>
              ) : typeof item.aiValue === "number" ? (
                <div className="flex items-center space-x-2">
                  <Slider
                    value={[item.correctValue]}
                    onValueChange={([value]) =>
                      onUpdateItem({ correctValue: value })
                    }
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm font-mono">
                    {item.correctValue}
                  </span>
                </div>
              ) : (
                <Textarea
                  value={
                    typeof item.correctValue === "string"
                      ? item.correctValue
                      : JSON.stringify(item.correctValue, null, 2)
                  }
                  onChange={(e) => {
                    try {
                      const value = JSON.parse(e.target.value);
                      onUpdateItem({ correctValue: value });
                    } catch {
                      onUpdateItem({ correctValue: e.target.value });
                    }
                  }}
                  className="font-mono text-sm"
                  rows={3}
                />
              )}
            </div>
          </div>

          {/* Severity */}
          <div>
            <Label>Severity</Label>
            <RadioGroup
              value={item.severity}
              onValueChange={(value: string) =>
                onUpdateItem({ severity: value })
              }
              className="flex items-center space-x-4 mt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="minor" id={`${item.id}_minor`} />
                <Label htmlFor={`${item.id}_minor`} className="cursor-pointer">
                  Minor
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="moderate" id={`${item.id}_moderate`} />
                <Label
                  htmlFor={`${item.id}_moderate`}
                  className="cursor-pointer"
                >
                  Moderate
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="major" id={`${item.id}_major`} />
                <Label htmlFor={`${item.id}_major`} className="cursor-pointer">
                  Major
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Confidence Rating */}
          <div>
            <Label>Your Confidence Level</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Slider
                value={[item.confidenceRating]}
                onValueChange={([value]) =>
                  onUpdateItem({ confidenceRating: value })
                }
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="w-12 text-sm font-mono">
                {item.confidenceRating}%
              </span>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <Label>Explanation (Optional)</Label>
            <Textarea
              placeholder="Explain why this correction is needed..."
              value={item.explanation || ""}
              onChange={(e) => onUpdateItem({ explanation: e.target.value })}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Evidence */}
          {item.evidence && (
            <div>
              <Label>Related Evidence</Label>
              <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                {item.evidence.photoIds && (
                  <div className="flex items-center space-x-1">
                    <ImageIcon className="h-4 w-4" />
                    <span>{item.evidence.photoIds.length} photos</span>
                  </div>
                )}
                {item.evidence.videoTimestamp !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Video className="h-4 w-4" />
                    <span>
                      Video at {formatTime(item.evidence.videoTimestamp)}
                    </span>
                  </div>
                )}
                {item.evidence.checklistItemId && (
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>Checklist item</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
