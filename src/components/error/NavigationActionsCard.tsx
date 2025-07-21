/**
 * Navigation Actions Card Component
 * Extracted from MobileErrorRecovery.tsx
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Phone, AlertTriangle } from 'lucide-react';

interface NavigationActionsCardProps {
  onNavigateHome?: () => void;
  onContactSupport?: () => void;
  onReset?: () => void;
}

export const NavigationActionsCard: React.FC<NavigationActionsCardProps> = ({
  onNavigateHome,
  onContactSupport,
  onReset
}) => {
  return (
    <Card id="navigation-actions-card">
      <CardHeader>
        <CardTitle className="text-sm">Navigation Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={onNavigateHome || (() => window.location.href = '/')}
          variant="outline"
          className="w-full"
        >
          <Home className="w-4 h-4 mr-2" />
          Return to Home
        </Button>
        
        <Button 
          onClick={onContactSupport || (() => window.location.href = 'tel:+1-555-STR-CERT')}
          variant="outline"
          className="w-full"
        >
          <Phone className="w-4 h-4 mr-2" />
          Contact Support
        </Button>
        
        {onReset && (
          <Button 
            onClick={onReset}
            variant="destructive"
            className="w-full"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Reset Application
          </Button>
        )}
      </CardContent>
    </Card>
  );
};