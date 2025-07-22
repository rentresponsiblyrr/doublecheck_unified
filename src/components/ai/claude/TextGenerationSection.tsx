import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText } from 'lucide-react';
import { createClaudeService, ClaudeTextRequest } from '@/lib/ai/claude-service';

interface ClaudeTextResult {
  text: string;
  metadata?: Record<string, unknown>;
  processingTime: number;
}

interface TextGenerationSectionProps {
  isLoading: boolean;
  error: string | null;
  result: ClaudeTextResult | null;
  onGenerationStart: () => void;
  onGenerationComplete: (result: ClaudeTextResult) => void;
  onError: (error: string) => void;
}

export const TextGenerationSection: React.FC<TextGenerationSectionProps> = ({
  isLoading,
  error,
  result,
  onGenerationStart,
  onGenerationComplete,
  onError
}) => {
  const [textPrompt, setTextPrompt] = useState('');

  const claudeService = createClaudeService();

  const handleTextGeneration = useCallback(async () => {
    if (!textPrompt.trim()) {
      onError('Please enter a prompt');
      return;
    }

    onGenerationStart();

    try {
      const request: ClaudeTextRequest = {
        prompt: textPrompt,
        context: {
          domain: 'property_inspection',
          purpose: 'content_generation'
        }
      };

      const response = await claudeService.generateText(request);
      onGenerationComplete(response);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Text generation failed');
    }
  }, [textPrompt, claudeService, onGenerationStart, onGenerationComplete, onError]);

  const handlePromptChange = (value: string) => {
    setTextPrompt(value);
  };

  const insertTemplate = (template: string) => {
    setTextPrompt(template);
  };

  const promptTemplates = [
    {
      name: 'Safety Checklist',
      template: 'Generate a comprehensive safety checklist for vacation rental property inspection, focusing on fire safety, electrical systems, and emergency exits.'
    },
    {
      name: 'Inspection Report',
      template: 'Create a detailed inspection report template for vacation rental properties, including sections for property condition, safety compliance, and recommendations.'
    },
    {
      name: 'Guest Guidelines',
      template: 'Write professional guest guidelines for a vacation rental property, covering house rules, safety procedures, and emergency contact information.'
    }
  ];

  return (
    <div id="text-generation-section" className="space-y-4">
      <Card id="text-prompt-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Text Generation</span>
          </CardTitle>
        </CardHeader>
        <CardContent id="text-prompt-content">
          <div className="space-y-4">
            <div>
              <label htmlFor="text-prompt-textarea" className="text-sm font-medium mb-2 block">
                Prompt
              </label>
              <Textarea
                id="text-prompt-textarea"
                placeholder="Enter your prompt here..."
                value={textPrompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Quick Templates:</p>
              <div className="flex flex-wrap gap-2">
                {promptTemplates.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate(template.template)}
                    id={`template-button-${index}`}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleTextGeneration}
              disabled={!textPrompt.trim() || isLoading}
              className="w-full"
              id="generate-text-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Text'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" id="text-error-alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};