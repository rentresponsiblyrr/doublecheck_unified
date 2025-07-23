/**
 * Alert utility functions for creating common alert types
 */

import { PropertyFormAlert, AlertType } from "@/components/PropertyFormAlerts";

export const createSuccessAlert = (
  id: string,
  title: string,
  message: string,
  details?: string[],
): PropertyFormAlert => ({
  id,
  type: "success" as AlertType,
  title,
  message,
  details,
});

export const createWarningAlert = (
  id: string,
  title: string,
  message: string,
  details?: string[],
): PropertyFormAlert => ({
  id,
  type: "warning" as AlertType,
  title,
  message,
  details,
});

export const createErrorAlert = (
  id: string,
  title: string,
  message: string,
  details?: string[],
): PropertyFormAlert => ({
  id,
  type: "error" as AlertType,
  title,
  message,
  details,
});

export const createInfoAlert = (
  id: string,
  title: string,
  message: string,
  details?: string[],
): PropertyFormAlert => ({
  id,
  type: "info" as AlertType,
  title,
  message,
  details,
});
