/**
 * Workflow Actions Component
 * Extracted from InspectionWorkflowContainer.tsx
 */

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Home } from "lucide-react";
import { WorkflowState } from "@/hooks/useInspectionWorkflow";

interface WorkflowActionsProps {
  state: WorkflowState;
  onSafeReturn: () => void;
}

export const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  state,
  onSafeReturn,
}) => {
  return (
    <Card id="workflow-progress-header">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Inspection Workflow</CardTitle>
            <CardDescription>
              Step {state.currentStep + 1} of {state.inspectionSteps.length}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onSafeReturn}>
            <Home className="w-4 h-4 mr-2" />
            Exit
          </Button>
        </div>
        <Progress
          value={(state.currentStep / (state.inspectionSteps.length - 1)) * 100}
          className="w-full"
        />
      </CardHeader>
    </Card>
  );
};
