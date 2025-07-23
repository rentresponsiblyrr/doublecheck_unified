/**
 * Bug Report Button - Floating Action Button
 *
 * Professional floating action button for bug reporting positioned in bottom right corner.
 * Designed for executive team access to easily report issues throughout the application.
 *
 * Features:
 * - Fixed positioning in bottom right corner
 * - High z-index to appear above all content
 * - Professional styling with bug icon
 * - Hover effects and animations
 * - Mobile-responsive design
 * - Accessibility compliant
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";
import { BugReportDialog } from "./BugReportDialog";

export interface BugReportButtonProps {
  /** Optional custom positioning className */
  className?: string;
  /** Whether to show the button (default: true) */
  visible?: boolean;
}

export const BugReportButton: React.FC<BugReportButtonProps> = ({
  className = "",
  visible = true,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      {/* Floating Bug Report Button */}
      <Button
        id="floating-bug-report-button"
        onClick={handleOpenDialog}
        size="lg"
        className={`
          fixed bottom-6 right-6 z-50
          h-14 w-14 rounded-full
          bg-orange-500 hover:bg-orange-600
          text-white shadow-lg hover:shadow-xl
          transition-all duration-200 ease-in-out
          transform hover:scale-105
          border-2 border-orange-400
          focus:ring-4 focus:ring-orange-200
          group
          ${className}
        `}
        aria-label="Report a bug or issue"
        title="Report a bug or issue"
      >
        <Bug className="h-6 w-6 group-hover:rotate-12 transition-transform duration-200" />
      </Button>

      {/* Bug Report Dialog */}
      <BugReportDialog
        isOpen={dialogOpen}
        onClose={handleCloseDialog}
        initialTitle=""
        initialDescription=""
      />
    </>
  );
};

export default BugReportButton;
