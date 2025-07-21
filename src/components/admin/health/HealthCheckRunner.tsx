/**
 * Health Check Runner - Loading State Component
 * Extracted from ProductionHealthCheck.tsx
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RefreshCw } from 'lucide-react';

export const HealthCheckRunner: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Running Production Health Check</h3>
        <p className="text-gray-600 mb-4">
          Testing database connectivity, authentication, table access, and core functionality...
        </p>
        <Progress value={undefined} className="w-full" />
      </CardContent>
    </Card>
  );
};
