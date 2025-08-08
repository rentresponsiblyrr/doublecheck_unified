/**
 * Haptic Feedback Service
 * Professional haptic feedback for mobile workflow interactions
 */

import { debugLogger } from '@/utils/debugLogger';

type HapticIntensity = "light" | "medium" | "heavy";
type HapticPattern = "success" | "warning" | "error" | "impact" | "selection";

class HapticFeedbackService {
  private isSupported: boolean = false;
  private vibrationAPI: ((pattern: number | number[]) => boolean) | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Check for various haptic APIs
    if ("vibrate" in navigator) {
      this.vibrationAPI = navigator.vibrate.bind(navigator);
      this.isSupported = true;
    }

    // iOS haptic feedback support
    if (window.DeviceMotionEvent && "ontouchstart" in window) {
      this.isSupported = true;
    }

    // Web Haptics API (future support)
    if ("haptics" in navigator) {
      this.isSupported = true;
    }
  }

  // Basic vibration patterns
  private getVibrationPattern(
    pattern: HapticPattern,
    intensity: HapticIntensity,
  ): number[] {
    const patterns = {
      success: {
        light: [50],
        medium: [100],
        heavy: [150],
      },
      warning: {
        light: [50, 50, 50],
        medium: [100, 50, 100],
        heavy: [150, 100, 150],
      },
      error: {
        light: [100, 50, 100, 50, 100],
        medium: [150, 75, 150, 75, 150],
        heavy: [200, 100, 200, 100, 200],
      },
      impact: {
        light: [25],
        medium: [50],
        heavy: [75],
      },
      selection: {
        light: [10],
        medium: [20],
        heavy: [30],
      },
    };

    return patterns[pattern][intensity] || [50];
  }

  // Main haptic feedback method
  public impact(intensity: HapticIntensity = "medium"): void {
    if (!this.isSupported) return;

    try {
      // iOS Haptic Feedback (if available)
      if ((window as any).DeviceMotionEvent) {
        this.triggerIOSHaptic(intensity);
        return;
      }

      // Standard Vibration API
      if (this.vibrationAPI) {
        const pattern = this.getVibrationPattern("impact", intensity);
        this.vibrationAPI(pattern);
      }
    } catch (error) {
      debugLogger.warn("Haptic feedback failed", { error });
    }
  }

  // Workflow-specific haptic patterns
  public workflowSuccess(): void {
    if (!this.isSupported) return;

    try {
      const pattern = this.getVibrationPattern("success", "medium");
      this.vibrationAPI?.(pattern);
    } catch (error) {
      debugLogger.warn("Workflow success haptic failed", { error });
    }
  }

  public workflowError(): void {
    if (!this.isSupported) return;

    try {
      const pattern = this.getVibrationPattern("error", "heavy");
      this.vibrationAPI?.(pattern);
    } catch (error) {
      debugLogger.warn("Workflow error haptic failed", { error });
    }
  }

  public workflowProgress(): void {
    if (!this.isSupported) return;

    try {
      const pattern = this.getVibrationPattern("selection", "light");
      this.vibrationAPI?.(pattern);
    } catch (error) {
      debugLogger.warn("Workflow progress haptic failed", { error });
    }
  }

  // iOS-specific haptic feedback
  private triggerIOSHaptic(intensity: HapticIntensity): void {
    // This would use iOS-specific haptic APIs if available
    // For now, fall back to vibration
    const intensityMap = {
      light: [25],
      medium: [50],
      heavy: [75],
    };

    this.vibrationAPI?.(intensityMap[intensity]);
  }

  // Custom pattern method
  public customPattern(pattern: number[]): void {
    if (!this.isSupported || !this.vibrationAPI) return;

    try {
      this.vibrationAPI(pattern);
    } catch (error) {
      debugLogger.warn("Custom haptic pattern failed", { error });
    }
  }

  // Check if haptic feedback is supported
  public isHapticSupported(): boolean {
    return this.isSupported;
  }

  // Disable haptic feedback (for accessibility)
  public disable(): void {
    this.isSupported = false;
  }

  // Re-enable haptic feedback
  public enable(): void {
    this.initialize();
  }
}

// Export singleton instance
export const hapticFeedback = new HapticFeedbackService();
