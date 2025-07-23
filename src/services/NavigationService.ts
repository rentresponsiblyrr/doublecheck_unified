/**
 * Professional Navigation Service
 * Replaces nuclear window.location patterns with React Router integration
 */

import { NavigateFunction } from "react-router-dom";
import { logger } from "../utils/logger";

interface NavigationState {
  from?: string;
  inspectionId?: string;
  propertyId?: string;
  userId?: string;
  context?: "inspection" | "audit" | "admin" | "report";
  data?: Record<string, unknown>;
}

export interface NavigationOptions {
  replace?: boolean;
  state?: NavigationState;
  preserveQuery?: boolean;
  fallbackUrl?: string;
}

export interface ExternalNavigationOptions {
  newTab?: boolean;
  confirmMessage?: string;
  fallbackDelay?: number;
}

class NavigationService {
  private navigate: NavigateFunction | null = null;
  private currentLocation: string = "/";

  // Initialize with React Router's navigate function
  initialize(navigate: NavigateFunction, currentLocation: string) {
    this.navigate = navigate;
    this.currentLocation = currentLocation;
    logger.logInfo("NavigationService initialized", { currentLocation });
  }

  // Professional internal navigation
  navigateTo(path: string, options: NavigationOptions = {}) {
    if (!this.navigate) {
      logger.logError("NavigationService not initialized", { path, options });
      return false;
    }

    try {
      const {
        replace = false,
        state,
        preserveQuery = false,
        fallbackUrl,
      } = options;

      let targetPath = path;

      // Preserve query parameters if requested
      if (preserveQuery && window.location.search) {
        targetPath += window.location.search;
      }

      this.navigate(targetPath, { replace, state });

      logger.logInfo("Navigation successful", {
        from: this.currentLocation,
        to: targetPath,
        replace,
        preserveQuery,
      });

      return true;
    } catch (error) {
      logger.logError("Navigation failed", { path, options, error });

      // Fallback navigation if provided
      if (options.fallbackUrl) {
        return this.navigateTo(options.fallbackUrl, { replace: true });
      }

      return false;
    }
  }

  // Professional external navigation (replaces window.location.assign)
  navigateToExternal(url: string, options: ExternalNavigationOptions = {}) {
    const { newTab = false, confirmMessage, fallbackDelay = 3000 } = options;

    try {
      // Validate URL
      const validUrl = new URL(url);

      // Optional user confirmation for external links
      if (confirmMessage && !window.confirm(confirmMessage)) {
        return false;
      }

      if (newTab) {
        const newWindow = window.open(url, "_blank", "noopener,noreferrer");
        if (!newWindow) {
          throw new Error("Popup blocked or failed to open");
        }
      } else {
        window.location.href = url;
      }

      logger.logInfo("External navigation successful", { url, newTab });
      return true;
    } catch (error) {
      logger.logError("External navigation failed", { url, options, error });

      // Graceful fallback with delay
      setTimeout(() => {
        try {
          window.location.href = url;
        } catch (fallbackError) {
          logger.logError("Fallback navigation failed", { url, fallbackError });
        }
      }, fallbackDelay);

      return false;
    }
  }

  // Professional page refresh (replaces window.location.reload)
  refreshPage(preserveState: boolean = true) {
    try {
      if (preserveState) {
        // Try to preserve application state
        const currentState = {
          path: this.currentLocation,
          timestamp: Date.now(),
          reason: "user_refresh",
        };

        sessionStorage.setItem(
          "app_refresh_state",
          JSON.stringify(currentState),
        );
      }

      // Professional page refresh using history API
      window.history.pushState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
      window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
      return true;
    } catch (error) {
      logger.logError("Page refresh failed", { preserveState, error });
      return false;
    }
  }

  // Go back with fallback
  goBack(fallbackPath: string = "/") {
    try {
      if (window.history.length > 1) {
        window.history.back();
        return true;
      } else {
        return this.navigateTo(fallbackPath, { replace: true });
      }
    } catch (error) {
      logger.logError("Go back failed", { fallbackPath, error });
      return this.navigateTo(fallbackPath, { replace: true });
    }
  }

  // Get current navigation state
  getCurrentState() {
    return {
      location: this.currentLocation,
      isInitialized: this.navigate !== null,
      canGoBack: window.history.length > 1,
    };
  }
}

export const navigationService = new NavigationService();
