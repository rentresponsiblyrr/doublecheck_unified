/**
 * FLOATING INSTALL BUTTON COMPONENT - EXTRACTED FROM GOD COMPONENT
 *
 * Professional floating button for PWA installation prompts.
 * Clean separation from PWAInstallPrompt for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";

interface FloatingInstallButtonProps {
  showFloatingButton: boolean;
  onShowInstallPrompt: () => void;
  enableConstructionSiteMode?: boolean;
}

export const FloatingInstallButton: React.FC<FloatingInstallButtonProps> = ({
  showFloatingButton,
  onShowInstallPrompt,
  enableConstructionSiteMode = false,
}) => {
  return (
    <button
      id="floating-install-button"
      onClick={onShowInstallPrompt}
      className={`fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 ${
        showFloatingButton ? "opacity-100 scale-100" : "opacity-0 scale-0"
      } ${enableConstructionSiteMode ? "p-6 text-lg" : ""}`}
      aria-label="Install STR Certified App"
    >
      <div className="flex items-center space-x-2">
        <span className="text-2xl">📱</span>
        {enableConstructionSiteMode && (
          <span className="hidden sm:inline font-medium">Install App</span>
        )}
      </div>
    </button>
  );
};
