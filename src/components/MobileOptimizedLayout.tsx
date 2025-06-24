
import { ReactNode } from 'react';
import { NetworkStatusIcon } from '@/components/NetworkStatusIndicator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileOptimizedLayoutProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backTo?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const MobileOptimizedLayout = ({
  title,
  subtitle,
  showBackButton = false,
  backTo = '/properties',
  actions,
  children,
  className = ''
}: MobileOptimizedLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Mobile-optimized header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(backTo)}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-600 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NetworkStatusIcon />
            {actions}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <main className="pb-6">
        {children}
      </main>

      {/* Safe area for mobile devices */}
      <div className="h-6 bg-gray-50" />
    </div>
  );
};
