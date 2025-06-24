
import { ReactNode } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface LoadingStateManagerProps {
  isLoading: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  onRetry?: () => void;
  loadingMessage?: string;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  children: ReactNode;
}

export const LoadingStateManager = ({
  isLoading,
  error,
  isEmpty = false,
  onRetry,
  loadingMessage = 'Loading...',
  emptyMessage = 'No data found',
  emptyAction,
  children
}: LoadingStateManagerProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner message={loadingMessage} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50 mx-4 my-4">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <span>{error.message || 'An error occurred'}</span>
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="ml-2"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  }

  return <>{children}</>;
};
