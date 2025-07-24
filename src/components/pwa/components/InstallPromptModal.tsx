/**
 * INSTALL PROMPT MODAL COMPONENT - EXTRACTED FROM GOD COMPONENT
 *
 * Professional modal dialog for PWA installation prompts.
 * Clean separation from PWAInstallPrompt for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";
import { InstallPromptState, InstallPromptConfig } from "../types/install";

interface InstallPromptModalProps {
  promptState: InstallPromptState;
  promptConfig: InstallPromptConfig;
  onNativeInstallation: () => void;
  onManualInstallation: () => void;
  onInstallDeclined: (reason: string) => void;
  onClosePrompt: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  promptState,
  promptConfig,
  onNativeInstallation,
  onManualInstallation,
  onInstallDeclined,
  onClosePrompt,
}) => {
  return (
    <div
      id="install-prompt-modal"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ${
        promptState.isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        id="install-prompt-content"
        className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-transform duration-300 ${
          promptState.isVisible ? "scale-100" : "scale-95"
        }`}
      >
        {/* Header */}
        <div
          id="install-prompt-header"
          className="flex items-center justify-between p-6 border-b"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {promptConfig.title}
              </h3>
              <p className="text-sm text-gray-600">
                {promptConfig.description}
              </p>
            </div>
          </div>
          <button
            id="close-install-prompt"
            onClick={onClosePrompt}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close install prompt"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Benefits */}
        <div id="install-benefits" className="p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Why install STR Certified?
          </h4>
          <ul className="space-y-2">
            {promptConfig.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span className="text-sm text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div
          id="install-actions"
          className="flex flex-col sm:flex-row gap-3 p-6 bg-gray-50"
        >
          <button
            id="install-button"
            onClick={
              promptState.installationStep === "prompt"
                ? onNativeInstallation
                : onManualInstallation
            }
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              promptConfig.customBranding ? "py-4 text-lg" : ""
            }`}
            style={{
              backgroundColor: promptConfig.customBranding?.color || "#2563eb",
              color: "white",
            }}
          >
            {promptState.canShowNativePrompt
              ? "Install Now"
              : "Show Instructions"}
          </button>

          <button
            id="maybe-later-button"
            onClick={() => onInstallDeclined("maybe_later")}
            className={`flex-1 py-3 px-6 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors ${
              promptConfig.customBranding ? "py-4 text-lg" : ""
            }`}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
