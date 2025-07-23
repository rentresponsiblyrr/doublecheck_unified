/**
 * Redirect Error Fallback Component
 * Provides navigation options when a section is unavailable
 */

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";

interface RedirectFallbackProps {
  onNavigateBack: () => void;
}

export const RedirectFallback: React.FC<RedirectFallbackProps> = ({
  onNavigateBack,
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>Section Unavailable</CardTitle>
          <CardDescription>
            This section is temporarily unavailable. You can return to the
            previous page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onNavigateBack} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
