/**
 * Claude Text Generator - Enterprise Grade
 *
 * Text generation interface for Claude AI
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ClaudeTextGeneratorProps {
  textPrompt: string;
  onTextPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export const ClaudeTextGenerator: React.FC<ClaudeTextGeneratorProps> = ({
  textPrompt,
  onTextPromptChange,
  onGenerate,
  isLoading,
}) => {
  return (
    <Card id="claude-text-generator">
      <CardHeader>
        <CardTitle className="text-lg">Text Generation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={textPrompt}
          onChange={(e) => onTextPromptChange(e.target.value)}
          placeholder="Enter a prompt for Claude AI text generation..."
          className="min-h-[100px] resize-none"
          disabled={isLoading}
        />
        <Button
          onClick={onGenerate}
          disabled={!textPrompt.trim() || isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? "Generating..." : "Generate Text"}
        </Button>
      </CardContent>
    </Card>
  );
};
