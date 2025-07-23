/**
 * Bug Report Form - Professional Form Component
 * Extracted from monolithic BugReportDialog for single responsibility
 */

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type {
  BugReportFormData,
  BugReportSeverity,
  BugReportCategory,
} from "./types";

interface BugReportFormProps {
  formData: BugReportFormData;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (description: string) => void;
  onUpdateSeverity: (severity: BugReportSeverity) => void;
  onUpdateCategory: (category: BugReportCategory) => void;
  onUpdateSteps: (steps: string[]) => void;
}

export const BugReportForm: React.FC<BugReportFormProps> = ({
  formData,
  onUpdateTitle,
  onUpdateDescription,
  onUpdateSeverity,
  onUpdateCategory,
  onUpdateSteps,
}) => {
  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    onUpdateSteps(newSteps);
  };

  const addStep = () => {
    onUpdateSteps([...formData.steps, ""]);
  };

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      const newSteps = formData.steps.filter((_, i) => i !== index);
      onUpdateSteps(newSteps);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title Input */}
      <div className="space-y-2">
        <Label htmlFor="bug-title">Bug Title *</Label>
        <Input
          id="bug-title"
          value={formData.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder="Brief description of the issue"
          className="w-full"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="bug-description">Description *</Label>
        <Textarea
          id="bug-description"
          value={formData.description}
          onChange={(e) => onUpdateDescription(e.target.value)}
          placeholder="Detailed description of what happened and what you expected to happen"
          className="min-h-[100px] w-full resize-none"
        />
      </div>

      {/* Severity and Category */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bug-severity">Severity</Label>
          <Select value={formData.severity} onValueChange={onUpdateSeverity}>
            <SelectTrigger id="bug-severity">
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bug-category">Category</Label>
          <Select value={formData.category} onValueChange={onUpdateCategory}>
            <SelectTrigger id="bug-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ui">UI/UX</SelectItem>
              <SelectItem value="functionality">Functionality</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Steps to Reproduce */}
      <div className="space-y-2">
        <Label>Steps to Reproduce</Label>
        {formData.steps.map((step, index) => (
          <div key={index} className="flex gap-2">
            <div className="flex-1">
              <Input
                value={step}
                onChange={(e) => handleStepChange(index, e.target.value)}
                placeholder={`Step ${index + 1}`}
              />
            </div>
            {formData.steps.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeStep(index)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={addStep}
          className="w-full"
        >
          Add Step
        </Button>
      </div>
    </div>
  );
};
