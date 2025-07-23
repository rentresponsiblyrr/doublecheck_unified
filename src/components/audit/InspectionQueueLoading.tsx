/**
 * Inspection Queue Loading - Focused Component
 *
 * Displays loading state for inspection queue
 */

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const InspectionQueueLoading: React.FC = () => {
  return (
    <Card id="inspection-queue-loading">
      <CardHeader>
        <CardTitle>Inspection Queue</CardTitle>
        <CardDescription>Loading inspections...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </CardContent>
    </Card>
  );
};
