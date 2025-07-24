/**
 * PWA INSTALL TYPES - EXTRACTED FROM GOD COMPONENT
 *
 * Professional type definitions for PWA installation workflow.
 * Clean separation of concerns for maintainable architecture.
 *
 * @author STR Certified Engineering Team
 */

export interface PWAInstallEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface InstallPromptState {
  isVisible: boolean;
  isSupported: boolean;
  platform: "android" | "ios" | "desktop" | "unknown";
  canShowNativePrompt: boolean;
  shouldShowManualInstructions: boolean;
  installationStep:
    | "prompt"
    | "installing"
    | "success"
    | "error"
    | "instructions";
  errorMessage?: string;
  installationSource: "native" | "manual" | "floating_button" | "auto_trigger";
}

export interface InstallPromptConfig {
  title: string;
  description: string;
  benefits: string[];
  showFloatingButton: boolean;
  autoTriggerDelay: number;
  maxDismissals: number;
  dismissalCooldown: number;
  enableAnalytics: boolean;
  customBranding?: {
    icon?: string;
    color?: string;
  };
}

export interface PWAInstallPromptProps {
  config?: Partial<InstallPromptConfig>;
  onInstallSuccess?: (method: "native" | "manual") => void;
  onInstallDeclined?: () => void;
  onPromptDismissed?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: "modal" | "banner" | "floating" | "inline";
}
