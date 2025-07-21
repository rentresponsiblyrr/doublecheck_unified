/**
 * Safe Workflow Wrapper Component
 * 
 * Simple wrapper component for workflow safety.
 * Created to fix build issues.
 */

import React from 'react';

interface SafeWorkflowWrapperProps {
  children: React.ReactNode;
}

export const SafeWorkflowWrapper: React.FC<SafeWorkflowWrapperProps> = ({ children }) => {
  return (
    <div className="safe-workflow-wrapper">
      {children}
    </div>
  );
};