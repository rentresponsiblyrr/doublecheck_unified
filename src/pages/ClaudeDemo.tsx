import * as React from "react";
import { ClaudeIntegrationExample } from "@/components/ai/ClaudeIntegrationExample";
import { logger } from "@/utils/logger";

export default function ClaudeDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Claude AI Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience Claude AI integration for property inspection workflows.
            Test photo analysis, text generation, and code review capabilities.
          </p>
        </div>

        <ClaudeIntegrationExample
          inspectionId="demo-inspection-123"
          onAnalysisComplete={(result) => {
            logger.info("Claude analysis completed", {
              component: "ClaudeDemo",
              result: result ? "success" : "null",
              action: "analysis_completion",
            });
            // You can handle the results here
          }}
        />
      </div>
    </div>
  );
}
