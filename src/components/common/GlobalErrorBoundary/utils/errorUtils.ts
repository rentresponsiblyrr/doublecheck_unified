/**
 * ERROR UTILITY FUNCTIONS - EXTRACTED FROM GOD COMPONENT
 *
 * Professional error handling utilities for logging and recovery.
 * Clean separation from GlobalErrorBoundary for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import { logger } from "@/utils/logger";

export interface ErrorInfo extends Error {
  componentStack?: string;
  errorBoundary?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: number;
  context?: Record<string, any>;
  severity?: "low" | "medium" | "high" | "critical";
}

export const logErrorToService = (
  error: Error,
  errorInfo: any,
  context?: Record<string, any>,
) => {
  const errorPayload: ErrorInfo = {
    ...error,
    componentStack: errorInfo?.componentStack,
    errorBoundary: "GlobalErrorBoundary",
    userId: getCurrentUserId(),
    sessionId: getSessionId(),
    timestamp: Date.now(),
    context: {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...context,
    },
    severity: determineSeverity(error),
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.group("🚨 Error Boundary Caught Error");
    console.error("Error:", error);
    console.error("Error Info:", errorInfo);
    console.error("Context:", errorPayload.context);
    console.groupEnd();
  }

  // Log to production service
  logger.error("Error boundary caught error", errorPayload);

  // Send to external error tracking service
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "exception", {
      description: error.message,
      fatal: errorPayload.severity === "critical",
    });
  }
};

export const determineSeverity = (
  error: Error,
): "low" | "medium" | "high" | "critical" => {
  const message = error.message.toLowerCase();

  if (message.includes("chunkloaderror") || message.includes("loading chunk")) {
    return "medium";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "medium";
  }

  if (
    message.includes("cannot read property") ||
    message.includes("undefined")
  ) {
    return "high";
  }

  if (message.includes("security") || message.includes("permission")) {
    return "critical";
  }

  return "high";
};

export const shouldAutoRecover = (error: Error): boolean => {
  const message = error.message.toLowerCase();

  // Auto-recover for network issues
  if (message.includes("network") || message.includes("fetch")) {
    return true;
  }

  // Auto-recover for chunk loading errors
  if (message.includes("chunkloaderror") || message.includes("loading chunk")) {
    return true;
  }

  return false;
};

const getCurrentUserId = (): string | undefined => {
  try {
    return localStorage.getItem("userId") || undefined;
  } catch {
    return undefined;
  }
};

const getSessionId = (): string | undefined => {
  try {
    return sessionStorage.getItem("sessionId") || undefined;
  } catch {
    return undefined;
  }
};
