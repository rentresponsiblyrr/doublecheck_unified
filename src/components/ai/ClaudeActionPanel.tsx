/**
 * Claude Action Panel - Enterprise Grade
 *
 * Action buttons for different Claude AI analysis types
 */

import React from "react";
import { Button } from "@/components/ui/button";

interface ClaudeActionPanelProps {
  isLoading: boolean;
  onPhotoAnalysis: () => void;
  onCodeReview: () => void;
  onClearResults: () => void;
}

export const ClaudeActionPanel: React.FC<ClaudeActionPanelProps> = ({
  isLoading,
  onPhotoAnalysis,
  onCodeReview,
  onClearResults,
}) => {
  return (
    <div
      id="claude-action-panel"
      className="flex flex-wrap gap-4 justify-center"
    >
      <Button
        onClick={onPhotoAnalysis}
        disabled={isLoading}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white"
        size="lg"
      >
        {isLoading ? "Analyzing..." : "📸 Mock Photo Analysis"}
      </Button>

      <Button
        onClick={onCodeReview}
        disabled={isLoading}
        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white"
        size="lg"
      >
        {isLoading ? "Reviewing..." : "💻 Mock Code Review"}
      </Button>

      <Button
        onClick={onClearResults}
        disabled={isLoading}
        variant="secondary"
        className="px-6 py-3"
        size="lg"
      >
        Clear Results
      </Button>
    </div>
  );
};
