/**
 * Claude Setup Instructions - Enterprise Grade
 *
 * Setup instructions for enabling real Claude AI functionality
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const ClaudeSetupInstructions: React.FC = () => {
  return (
    <Card id="claude-setup-instructions" className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-lg text-blue-900 flex items-center">
          🚀 Enable Real Claude AI
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="border-blue-200">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3 text-sm text-blue-800">
              <p>To enable real Claude AI functionality:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>
                  Install the Anthropic SDK:{" "}
                  <code className="bg-blue-100 px-1 rounded">
                    npm install @anthropic-ai/sdk
                  </code>
                </li>
                <li>Set up your Anthropic API key in environment variables</li>
                <li>Deploy the claude-analysis Edge Function</li>
                <li>Update this component to use real API calls</li>
              </ol>
              <p className="mt-4">
                📖 See{" "}
                <code className="bg-blue-100 px-1 rounded">
                  docs/CLAUDE_INTEGRATION.md
                </code>{" "}
                for complete setup instructions.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
