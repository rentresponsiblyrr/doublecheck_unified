/**
 * @fileoverview User Activity Tracking Service
 * Tracks user interactions for bug reporting and debugging purposes
 *
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import { logger } from "@/utils/logger";

export interface UserAction {
  id: string;
  timestamp: string;
  type: "click" | "navigation" | "input" | "error" | "custom";
  element: string;
  path: string;
  details: {
    elementId?: string;
    elementClass?: string;
    elementText?: string;
    url?: string;
    errorMessage?: string;
    value?: string;
    coordinates?: { x: number; y: number };
    viewport?: { width: number; height: number };
  };
  sessionId: string;
}

export interface BugReportData {
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "ui" | "functionality" | "performance" | "security" | "other";
  steps: string[];
  screenshot?: string;
  userActions: UserAction[];
  systemInfo: {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
    timestamp: string;
    url: string;
  };
  userInfo: {
    userId?: string;
    userRole?: string;
    email?: string;
  };
}

class UserActivityService {
  private actions: UserAction[] = [];
  private sessionId: string;
  private maxActions = 50; // Keep last 50 actions
  private isTracking = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking() {
    if (typeof window === "undefined") return;

    // Track clicks
    document.addEventListener("click", this.handleClick.bind(this), true);

    // Track navigation
    window.addEventListener("popstate", this.handleNavigation.bind(this));

    // Track input changes
    document.addEventListener("input", this.handleInput.bind(this), true);

    // Track errors
    window.addEventListener("error", this.handleError.bind(this));
    window.addEventListener(
      "unhandledrejection",
      this.handleUnhandledRejection.bind(this),
    );

    // Track route changes for SPA
    this.trackRouteChanges();
  }

  private handleClick(event: MouseEvent) {
    if (!this.isTracking) return;

    const target = event.target as HTMLElement;

    this.addAction({
      type: "click",
      element: this.getElementSelector(target),
      details: {
        elementId: target.id || undefined,
        elementClass: target.className || undefined,
        elementText: target.textContent?.trim().substring(0, 100) || undefined,
        coordinates: {
          x: event.clientX,
          y: event.clientY,
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
    });
  }

  private handleNavigation() {
    if (!this.isTracking) return;

    this.addAction({
      type: "navigation",
      element: "window",
      details: {
        url: window.location.href,
      },
    });
  }

  private handleInput(event: InputEvent) {
    if (!this.isTracking) return;

    const target = event.target as HTMLInputElement;

    // Don't log sensitive input values
    const isSensitive =
      target.type === "password" ||
      target.name?.toLowerCase().includes("password") ||
      target.name?.toLowerCase().includes("secret") ||
      target.name?.toLowerCase().includes("token");

    this.addAction({
      type: "input",
      element: this.getElementSelector(target),
      details: {
        elementId: target.id || undefined,
        elementClass: target.className || undefined,
        value: isSensitive ? "[REDACTED]" : target.value?.substring(0, 100),
      },
    });
  }

  private handleError(event: ErrorEvent) {
    this.addAction({
      type: "error",
      element: "window",
      details: {
        errorMessage: `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
      },
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    this.addAction({
      type: "error",
      element: "window",
      details: {
        errorMessage: `Unhandled Promise Rejection: ${event.reason}`,
      },
    });
  }

  private trackRouteChanges() {
    // Track React Router changes
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.handleNavigation();
      }
    }, 100);
  }

  private getElementSelector(element: HTMLElement): string {
    // Create a simple selector for the element
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : "";
    const classes = element.className
      ? `.${element.className.split(" ").join(".")}`
      : "";

    return `${tag}${id}${classes}`.substring(0, 200);
  }

  private addAction(
    actionData: Omit<UserAction, "id" | "timestamp" | "path" | "sessionId">,
  ) {
    const action: UserAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      path: window.location.pathname,
      sessionId: this.sessionId,
      ...actionData,
    };

    this.actions.push(action);

    // Keep only the most recent actions
    if (this.actions.length > this.maxActions) {
      this.actions = this.actions.slice(-this.maxActions);
    }

    logger.debug("User action tracked", action, "USER_ACTIVITY");
  }

  /**
   * Add a custom action for specific events
   */
  public trackCustomAction(element: string, details: Record<string, any>) {
    this.addAction({
      type: "custom",
      element,
      details,
    });
  }

  /**
   * Get recent user actions for bug reporting
   */
  public getRecentActions(count: number = 20): UserAction[] {
    return this.actions.slice(-count);
  }

  /**
   * Get system information for bug reports
   */
  public getSystemInfo(): BugReportData["systemInfo"] {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };
  }

  /**
   * Clear all tracked actions
   */
  public clearActions() {
    this.actions = [];
    this.sessionId = this.generateSessionId();
  }

  /**
   * Enable or disable tracking
   */
  public setTracking(enabled: boolean) {
    this.isTracking = enabled;
  }

  /**
   * Get current session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }
}

// Create singleton instance
export const userActivityService = new UserActivityService();

// Export types
export type { UserAction, BugReportData };
