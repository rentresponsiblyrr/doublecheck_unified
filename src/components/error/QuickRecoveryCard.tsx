/**
 * Quick Recovery Card Component
 * Extracted from MobileErrorRecovery.tsx
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface QuickRecoveryCardProps {
  isRecovering: boolean;
  onAutoRecovery: () => void;
}

export const QuickRecoveryCard: React.FC<QuickRecoveryCardProps> = ({
  isRecovering,
  onAutoRecovery,
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-sm">Quick Recovery</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={onAutoRecovery}
          disabled={isRecovering}
          className="w-full"
          variant="default"
        >
          {isRecovering ? (
            <>
              <LoadingSpinner className="w-4 h-4 mr-2" />
              Running Auto Recovery...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Auto Recovery
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
