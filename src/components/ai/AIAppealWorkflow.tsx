/**
 * AI Appeal Workflow - Focused Component
 *
 * One-click appeal initiation and workflow management
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, FileText, Clock } from "lucide-react";

interface AIAppealWorkflowProps {
  enabled: boolean;
  trafficLightStatus: "green" | "yellow" | "red";
  onInitiateAppeal: () => void;
  className?: string;
}

export const AIAppealWorkflow: React.FC<AIAppealWorkflowProps> = ({
  enabled,
  trafficLightStatus,
  onInitiateAppeal,
  className,
}) => {
  if (!enabled || trafficLightStatus === "green") {
    return null;
  }

  return (
    <Card className={className} id="ai-appeal-workflow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Appeal Process
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <FileText className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {trafficLightStatus === "yellow"
              ? "If you disagree with this analysis, you can request human review."
              : "This analysis requires human review before proceeding. You can also request additional review if needed."}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-medium">What happens next:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Appeal submitted to qualified human reviewers</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Review completed within 24 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>You'll receive notification of the decision</span>
            </div>
          </div>
        </div>

        <Button
          onClick={onInitiateAppeal}
          className="w-full"
          variant={trafficLightStatus === "red" ? "default" : "outline"}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          {trafficLightStatus === "red"
            ? "Request Required Review"
            : "Request Additional Review"}
        </Button>
      </CardContent>
    </Card>
  );
};
