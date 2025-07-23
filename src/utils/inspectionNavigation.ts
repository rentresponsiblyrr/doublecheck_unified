/**
 * Safe Inspection Navigation Utilities
 *
 * Provides safe navigation functions that validate inspection IDs before navigation
 * to prevent "Invalid inspection ID provided: 'undefined'" errors.
 */

import { NavigateFunction } from "react-router-dom";
import { logger } from "@/lib/logger/production-logger";

/**
 * Safely navigate to an inspection page
 * @param navigate - React Router navigate function
 * @param inspectionId - The inspection ID to navigate to
 * @param fallbackPath - Where to go if the inspection ID is invalid (default: '/properties')
 * @returns boolean - true if navigation succeeded, false if fallback was used
 */
export const safeNavigateToInspection = (
  navigate: NavigateFunction,
  inspectionId: string | undefined | null,
  fallbackPath: string = "/properties",
): boolean => {
  // Validate inspection ID
  if (
    !inspectionId ||
    inspectionId === "undefined" ||
    inspectionId === "null" ||
    inspectionId.trim() === ""
  ) {
    logger.warn("Safe navigation prevented invalid inspection ID", {
      inspectionId,
      type: typeof inspectionId,
      fallbackPath,
      action: "navigation_prevented",
    });

    // Navigate to fallback instead
    navigate(fallbackPath);
    return false;
  }

  // Validate UUID format (basic check)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(inspectionId)) {
    logger.warn("Safe navigation prevented non-UUID inspection ID", {
      inspectionId,
      fallbackPath,
      action: "navigation_prevented",
    });

    navigate(fallbackPath);
    return false;
  }

  // Safe to navigate
  logger.info("Safe navigation to inspection", {
    inspectionId,
    action: "navigation_success",
  });

  navigate(`/inspection/${inspectionId}`);
  return true;
};

/**
 * Safely navigate to inspection complete page
 * @param navigate - React Router navigate function
 * @param inspectionId - The inspection ID to navigate to
 * @param fallbackPath - Where to go if the inspection ID is invalid (default: '/properties')
 * @returns boolean - true if navigation succeeded, false if fallback was used
 */
export const safeNavigateToInspectionComplete = (
  navigate: NavigateFunction,
  inspectionId: string | undefined | null,
  fallbackPath: string = "/properties",
): boolean => {
  // Validate inspection ID
  if (
    !inspectionId ||
    inspectionId === "undefined" ||
    inspectionId === "null" ||
    inspectionId.trim() === ""
  ) {
    logger.warn("Safe navigation prevented invalid inspection complete ID", {
      inspectionId,
      type: typeof inspectionId,
      fallbackPath,
      action: "navigation_prevented",
    });

    navigate(fallbackPath);
    return false;
  }

  // Validate UUID format (basic check)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(inspectionId)) {
    logger.warn("Safe navigation prevented non-UUID inspection complete ID", {
      inspectionId,
      fallbackPath,
      action: "navigation_prevented",
    });

    navigate(fallbackPath);
    return false;
  }

  // Safe to navigate
  logger.info("Safe navigation to inspection complete", {
    inspectionId,
    action: "navigation_success",
  });

  navigate(`/inspection-complete/${inspectionId}`);
  return true;
};

/**
 * Validate an inspection ID without navigation
 * @param inspectionId - The inspection ID to validate
 * @returns boolean - true if valid, false if invalid
 */
export const isValidInspectionId = (
  inspectionId: string | undefined | null,
): inspectionId is string => {
  if (
    !inspectionId ||
    inspectionId === "undefined" ||
    inspectionId === "null" ||
    inspectionId.trim() === ""
  ) {
    return false;
  }

  // Validate UUID format (basic check)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(inspectionId);
};
