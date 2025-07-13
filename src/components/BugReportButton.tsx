/**
 * @fileoverview Bug Report Button Component
 * Floating action button for quick access to bug reporting
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bug, MessageCircle, X } from 'lucide-react';
import BugReportDialog from './BugReportDialog';
import { userActivityService } from '@/services/userActivityService';
import { cn } from '@/lib/utils';

interface BugReportButtonProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  showInProduction?: boolean;
}

export const BugReportButton: React.FC<BugReportButtonProps> = ({
  className,
  position = 'bottom-right',
  size = 'md',
  showInProduction = true
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Hide in production unless explicitly enabled
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const shouldShow = isDevelopment || showInProduction;
    console.log('🐛 BugReportButton visibility check:', { 
      isDevelopment, 
      showInProduction, 
      shouldShow,
      NODE_ENV: process.env.NODE_ENV
    });
    setIsVisible(shouldShow);
  }, [showInProduction]);

  // Auto-collapse after 30 seconds to reduce screen clutter
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCollapsed(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    userActivityService.trackCustomAction('bug_report_button_clicked', {
      timestamp: new Date().toISOString(),
      position,
      size
    });
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-10 w-10';
      case 'md':
        return 'h-12 w-12';
      case 'lg':
        return 'h-14 w-14';
      default:
        return 'h-12 w-12';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'md':
        return 'h-5 w-5';
      case 'lg':
        return 'h-6 w-6';
      default:
        return 'h-5 w-5';
    }
  };

  console.log('🐛 BugReportButton render state:', { isVisible, isCollapsed, isDialogOpen });

  if (!isVisible) {
    console.log('🐛 BugReportButton hidden due to visibility check');
    return null;
  }

  return (
    <>
      <TooltipProvider>
        <div
          className={cn(
            'fixed transition-all duration-300',
            getPositionClasses(),
            className
          )}
          style={{ zIndex: 10000 }}
        >
          {/* Expanded state */}
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              {/* Text label */}
              <div className="bg-white shadow-lg rounded-full px-4 py-2 border border-gray-200">
                <span className="text-sm font-medium text-gray-700">Found a bug?</span>
              </div>
              
              {/* Collapse button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(true)}
                className="rounded-full h-8 w-8 shadow-md bg-white border border-gray-200 hover:bg-gray-50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Main bug report button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleOpenDialog}
                className={cn(
                  'rounded-full shadow-lg bg-red-500 hover:bg-red-600 text-white border-2 border-red-600 transition-all duration-200 hover:scale-105',
                  getSizeClasses(),
                  isCollapsed ? 'mt-0' : 'mt-2',
                  // Debug: add a visible outline
                  'ring-4 ring-yellow-300'
                )}
              >
                <Bug className={getIconSize()} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="mr-2">
              <p>Report a bug or issue</p>
            </TooltipContent>
          </Tooltip>

          {/* Expand button when collapsed */}
          {isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(false)}
              className="absolute -top-10 right-0 rounded-full h-8 w-8 shadow-md bg-white border border-gray-200 hover:bg-gray-50"
            >
              <MessageCircle className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TooltipProvider>

      {/* Bug Report Dialog */}
      <BugReportDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
};

export default BugReportButton;