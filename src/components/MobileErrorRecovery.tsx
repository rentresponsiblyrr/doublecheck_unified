/**
 * Mobile Error Recovery - Surgically Refactored
 * Decomposed from 475→<300 lines using component composition
 * Business logic extracted to useMobileErrorRecovery hook
 */

import React from 'react';
import { useMobileErrorRecovery } from '@/hooks/useMobileErrorRecovery';
import { ErrorHeader } from '@/components/error/ErrorHeader';
import { ErrorInformationCard } from '@/components/error/ErrorInformationCard';
import { QuickRecoveryCard } from '@/components/error/QuickRecoveryCard';
import { ManualRecoveryCard } from '@/components/error/ManualRecoveryCard';
import { NavigationActionsCard } from '@/components/error/NavigationActionsCard';
import { HelpText } from '@/components/error/HelpText';

interface MobileErrorRecoveryProps {
  error?: Error | null;
  errorInfo?: string;
  onRetry?: () => void;
  onReset?: () => void;
  onNavigateHome?: () => void;
  onContactSupport?: () => void;
  className?: string;
}

const MobileErrorRecovery: React.FC<MobileErrorRecoveryProps> = ({
  error,
  errorInfo,
  onRetry,
  onReset,
  onNavigateHome,
  onContactSupport,
  className = ''
}) => {
  const {
    isRecovering,
    recoveryActions,
    connectionStatus,
    handleAutoRecovery
  } = useMobileErrorRecovery(error, onRetry, onReset, onNavigateHome, onContactSupport);

  return (
    <div id="mobile-error-recovery-container" className={`min-h-screen bg-gray-50 flex flex-col ${className}`}>
      <ErrorHeader />
      
      <div id="error-recovery-content" className="flex-1 px-4 py-6">
        <ErrorInformationCard
          error={error}
          errorInfo={errorInfo}
          connectionStatus={connectionStatus}
        />
        
        <QuickRecoveryCard
          isRecovering={isRecovering}
          onAutoRecovery={handleAutoRecovery}
        />
        
        <ManualRecoveryCard
          recoveryActions={recoveryActions}
        />
        
        <NavigationActionsCard
          onNavigateHome={onNavigateHome}
          onContactSupport={onContactSupport}
          onReset={onReset}
        />
        
        <HelpText error={error} />
      </div>
    </div>
  );
};

export default MobileErrorRecovery;
export { MobileErrorRecovery };