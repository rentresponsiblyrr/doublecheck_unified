
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCw, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  action: () => void;
  shortcut?: string;
  variant?: 'default' | 'secondary' | 'outline';
  badge?: string;
}

interface QuickActionsProps {
  context?: 'home' | 'properties' | 'inspection';
  pendingInspections?: number;
}

export const QuickActions = ({ 
  context = 'home', 
  pendingInspections = 0 
}: QuickActionsProps) => {
  const navigate = useNavigate();

  const getQuickActions = (): QuickAction[] => {
    const baseActions: QuickAction[] = [
      {
        id: 'add-property',
        label: 'Add Property',
        icon: Plus,
        action: () => navigate('/add-property'),
        shortcut: 'Ctrl+N',
        variant: 'default'
      },
      {
        id: 'refresh',
        label: 'Refresh',
        icon: RefreshCw,
        action: () => window.location.reload(),
        shortcut: 'F5',
        variant: 'outline'
      }
    ];

    if (context === 'home' || context === 'properties') {
      baseActions.unshift({
        id: 'view-properties',
        label: 'Properties',
        icon: Search,
        action: () => navigate('/properties'),
        variant: 'secondary',
        badge: pendingInspections > 0 ? `${pendingInspections}` : undefined
      });
    }

    return baseActions;
  };

  const actions = getQuickActions();

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        navigate('/add-property');
      }
      if (e.key === 'F5') {
        e.preventDefault();
        window.location.reload();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [navigate]);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-blue-600" />
          <h3 className="font-medium text-gray-900">Quick Actions</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.action}
                className="flex flex-col items-center gap-1 h-auto py-3 relative"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{action.label}</span>
                {action.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 text-xs min-w-[1.25rem] h-5 flex items-center justify-center"
                  >
                    {action.badge}
                  </Badge>
                )}
                {action.shortcut && (
                  <span className="text-xs text-gray-500 mt-1">
                    {action.shortcut}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
