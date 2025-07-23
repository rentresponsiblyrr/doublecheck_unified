/**
 * Axe-core accessibility testing setup for STR Certified
 * Ensures WCAG 2.1 AA compliance across all components
 */

import { toHaveNoViolations } from "jest-axe";
import { expect } from "vitest";

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Configure axe-core for STR Certified requirements
export const axeConfig = {
  rules: {
    // WCAG 2.1 AA Level requirements
    "color-contrast": { enabled: true },
    "keyboard-navigation": { enabled: true },
    "focus-management": { enabled: true },
    "aria-labels": { enabled: true },
    "heading-order": { enabled: true },
    "landmark-roles": { enabled: true },
    "form-labels": { enabled: true },
    "button-name": { enabled: true },
    "link-name": { enabled: true },
    "image-alt": { enabled: true },

    // STR Certified specific requirements
    "touch-target-size": { enabled: true },
    "page-title": { enabled: true },
    language: { enabled: true },
    "skip-link": { enabled: true },

    // Error handling accessibility
    "error-messages": { enabled: true },
    "status-messages": { enabled: true },
    "live-region": { enabled: true },
  },
  tags: ["wcag2a", "wcag2aa", "wcag21aa"],
  // Set to fail on any violations - zero tolerance
  allowedViolations: 0,
};

// Helper function for component accessibility testing
export const testComponentAccessibility = async (component: HTMLElement) => {
  const { default: axe } = await import("axe-core");

  const results = await axe.run(component, axeConfig);

  // Log violations for debugging
  if (results.violations.length > 0) {
    console.error("Accessibility violations found:", results.violations);
  }

  return results;
};

// Helper for testing interactive elements
export const testInteractiveAccessibility = async (element: HTMLElement) => {
  const { default: axe } = await import("axe-core");

  // Focus-specific testing
  const focusRules = {
    ...axeConfig,
    rules: {
      ...axeConfig.rules,
      "focus-order-semantics": { enabled: true },
      tabindex: { enabled: true },
      "focus-visible": { enabled: true },
    },
  };

  return await axe.run(element, focusRules);
};

// Helper for testing error states
export const testErrorStateAccessibility = async (element: HTMLElement) => {
  const { default: axe } = await import("axe-core");

  // Error-specific testing
  const errorRules = {
    ...axeConfig,
    rules: {
      ...axeConfig.rules,
      "aria-alert": { enabled: true },
      "aria-live": { enabled: true },
      "role-img-alt": { enabled: true },
      "aria-required": { enabled: true },
    },
  };

  return await axe.run(element, errorRules);
};
