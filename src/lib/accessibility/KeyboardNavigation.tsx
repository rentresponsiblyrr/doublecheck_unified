/**
 * KEYBOARD NAVIGATION SYSTEM - WCAG 2.1 AA COMPLIANCE
 *
 * Enterprise-grade keyboard navigation following WCAG 2.1 AA standards.
 * Implements comprehensive keyboard shortcuts, focus management, and
 * screen reader optimization for Netflix/Meta accessibility standards.
 *
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import React, { useEffect, useCallback, useRef } from "react";
import { useAccessibility } from "./AccessibilityProvider";

export interface KeyboardNavigationConfig {
  // Focus management
  autoFocus?: boolean;
  focusTrap?: boolean;
  restoreFocus?: boolean;

  // Navigation patterns
  arrowKeys?: boolean;
  tabNavigation?: boolean;
  escapeKey?: boolean;
  enterKey?: boolean;
  spaceKey?: boolean;

  // Custom shortcuts
  shortcuts?: Array<{
    key: string;
    handler: () => void;
    description: string;
    preventDefault?: boolean;
  }>;

  // Accessibility
  announceNavigation?: boolean;
  skipToContent?: boolean;
}

interface KeyboardNavigationProps extends KeyboardNavigationConfig {
  children: React.ReactNode;
  id: string;
  className?: string;
  role?: string;
  ariaLabel?: string;
}

/**
 * Keyboard navigation wrapper component
 */
export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  id,
  className = "",
  role = "region",
  ariaLabel,
  autoFocus = false,
  focusTrap = false,
  restoreFocus = true,
  arrowKeys = false,
  tabNavigation = true,
  escapeKey = true,
  enterKey = true,
  spaceKey = true,
  shortcuts = [],
  announceNavigation = true,
  skipToContent = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    announce,
    handleKeyboardNavigation,
    registerKeyboardShortcut,
    trapFocus,
  } = useAccessibility();

  // Initialize focus management
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (autoFocus) {
      const firstFocusable = container.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }

    let cleanupFocusTrap: (() => void) | undefined;
    if (focusTrap) {
      cleanupFocusTrap = trapFocus(id);
    }

    return cleanupFocusTrap;
  }, [id, autoFocus, focusTrap, trapFocus]);

  // Register custom shortcuts
  useEffect(() => {
    const cleanupFunctions = shortcuts.map(({ key, handler, description }) =>
      registerKeyboardShortcut(key, handler, description),
    );

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [shortcuts, registerKeyboardShortcut]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      // Global navigation handled first
      if (handleKeyboardNavigation(event.nativeEvent)) {
        return;
      }

      // Arrow key navigation
      if (
        arrowKeys &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        handleArrowNavigation(event, container);
        return;
      }

      // Escape key handling
      if (escapeKey && event.key === "Escape") {
        handleEscapeKey(event, container);
        return;
      }

      // Enter key handling
      if (enterKey && event.key === "Enter") {
        handleEnterKey(event, container);
        return;
      }

      // Space key handling
      if (spaceKey && event.key === " ") {
        handleSpaceKey(event, container);
        return;
      }

      // Custom shortcuts
      const shortcut = shortcuts.find(
        (s) => s.key.toLowerCase() === event.key.toLowerCase(),
      );
      if (shortcut) {
        if (shortcut.preventDefault) {
          event.preventDefault();
        }
        shortcut.handler();
        return;
      }
    },
    [
      arrowKeys,
      escapeKey,
      enterKey,
      spaceKey,
      shortcuts,
      handleKeyboardNavigation,
    ],
  );

  // Arrow key navigation logic
  const handleArrowNavigation = useCallback(
    (event: React.KeyboardEvent, container: HTMLElement) => {
      event.preventDefault();

      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );

      const currentIndex = focusableElements.indexOf(
        document.activeElement as HTMLElement,
      );
      let nextIndex: number;

      switch (event.key) {
        case "ArrowUp":
        case "ArrowLeft":
          nextIndex =
            currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
          break;
        case "ArrowDown":
        case "ArrowRight":
          nextIndex =
            currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
          break;
        default:
          return;
      }

      const nextElement = focusableElements[nextIndex];
      if (nextElement) {
        nextElement.focus();

        if (announceNavigation) {
          const label =
            nextElement.getAttribute("aria-label") ||
            nextElement.textContent?.trim() ||
            nextElement.getAttribute("title") ||
            "Interactive element";
          announce(`Focused: ${label}`);
        }
      }
    },
    [announce, announceNavigation],
  );

  // Escape key logic
  const handleEscapeKey = useCallback(
    (event: React.KeyboardEvent, container: HTMLElement) => {
      // Close modals, dropdowns, etc.
      const closeButtons = container.querySelectorAll<HTMLElement>(
        '[aria-label*="close"], [aria-label*="Close"]',
      );
      if (closeButtons.length > 0) {
        event.preventDefault();
        closeButtons[0].click();
        return;
      }

      // Focus parent container or previous focus
      if (restoreFocus) {
        event.preventDefault();
        const parentFocusable = container.closest<HTMLElement>(
          "[tabindex], button, [href]",
        );
        if (parentFocusable) {
          parentFocusable.focus();
          if (announceNavigation) {
            announce("Escaped to parent element");
          }
        }
      }
    },
    [restoreFocus, announce, announceNavigation],
  );

  // Enter key logic
  const handleEnterKey = useCallback(
    (event: React.KeyboardEvent, container: HTMLElement) => {
      const activeElement = document.activeElement as HTMLElement;

      // Activate buttons, links with Enter
      if (
        activeElement.tagName === "BUTTON" ||
        activeElement.getAttribute("role") === "button"
      ) {
        event.preventDefault();
        activeElement.click();

        if (announceNavigation) {
          const label =
            activeElement.getAttribute("aria-label") ||
            activeElement.textContent?.trim() ||
            "Button";
          announce(`Activated: ${label}`);
        }
      }
    },
    [announce, announceNavigation],
  );

  // Space key logic
  const handleSpaceKey = useCallback(
    (event: React.KeyboardEvent, container: HTMLElement) => {
      const activeElement = document.activeElement as HTMLElement;

      // Activate buttons with space
      if (
        activeElement.tagName === "BUTTON" ||
        activeElement.getAttribute("role") === "button"
      ) {
        event.preventDefault();
        activeElement.click();

        if (announceNavigation) {
          const label =
            activeElement.getAttribute("aria-label") ||
            activeElement.textContent?.trim() ||
            "Button";
          announce(`Activated: ${label}`);
        }
      }

      // Toggle checkboxes
      if (activeElement.getAttribute("role") === "checkbox") {
        event.preventDefault();
        activeElement.click();

        if (announceNavigation) {
          const checked = activeElement.getAttribute("aria-checked") === "true";
          const label = activeElement.getAttribute("aria-label") || "Checkbox";
          announce(`${label} ${checked ? "checked" : "unchecked"}`);
        }
      }
    },
    [announce, announceNavigation],
  );

  return (
    <div
      ref={containerRef}
      id={id}
      className={className}
      role={role}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      tabIndex={focusTrap ? 0 : undefined}
    >
      {skipToContent && (
        <a
          href={`#${id}-content`}
          className="skip-to-content"
          onFocus={() => announce("Skip to content link focused")}
        >
          Skip to content
        </a>
      )}

      <div id={`${id}-content`}>{children}</div>
    </div>
  );
};

/**
 * Focus management utilities
 */
export const useFocusManagement = () => {
  const { setFocus, restoreFocus, trapFocus } = useAccessibility();

  const focusFirst = useCallback((containerId: string) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const firstFocusable = container.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, []);

  const focusLast = useCallback((containerId: string) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const lastFocusable = focusableElements[focusableElements.length - 1];
    if (lastFocusable) {
      lastFocusable.focus();
    }
  }, []);

  const cycleFocus = useCallback(
    (containerId: string, direction: "forward" | "backward" = "forward") => {
      const container = document.getElementById(containerId);
      if (!container) return;

      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );

      const currentIndex = focusableElements.indexOf(
        document.activeElement as HTMLElement,
      );
      let nextIndex: number;

      if (direction === "forward") {
        nextIndex =
          currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
      } else {
        nextIndex =
          currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
      }

      const nextElement = focusableElements[nextIndex];
      if (nextElement) {
        nextElement.focus();
      }
    },
    [],
  );

  return {
    setFocus,
    restoreFocus,
    trapFocus,
    focusFirst,
    focusLast,
    cycleFocus,
  };
};

/**
 * Keyboard shortcut hook
 */
export const useKeyboardShortcut = (
  key: string,
  handler: () => void,
  description: string,
  enabled: boolean = true,
) => {
  const { registerKeyboardShortcut } = useAccessibility();

  useEffect(() => {
    if (!enabled) return;

    return registerKeyboardShortcut(key, handler, description);
  }, [key, handler, description, enabled, registerKeyboardShortcut]);
};

/**
 * Roving tabindex implementation for lists and grids
 */
export const useRovingTabindex = (
  containerId: string,
  orientation: "horizontal" | "vertical" | "both" = "both",
) => {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const items = Array.from(
      container.querySelectorAll<HTMLElement>("[data-roving-tabindex]"),
    );
    if (items.length === 0) return;

    // Set initial tabindex
    items.forEach((item, index) => {
      item.setAttribute("tabindex", index === 0 ? "0" : "-1");
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      )
        return;

      const currentItem = document.activeElement as HTMLElement;
      const currentIndex = items.indexOf(currentItem);
      if (currentIndex === -1) return;

      let nextIndex: number = currentIndex;

      switch (event.key) {
        case "ArrowUp":
          if (orientation === "vertical" || orientation === "both") {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          }
          break;
        case "ArrowDown":
          if (orientation === "vertical" || orientation === "both") {
            nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          }
          break;
        case "ArrowLeft":
          if (orientation === "horizontal" || orientation === "both") {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          }
          break;
        case "ArrowRight":
          if (orientation === "horizontal" || orientation === "both") {
            nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          }
          break;
      }

      if (nextIndex !== currentIndex) {
        event.preventDefault();

        // Update tabindex
        currentItem.setAttribute("tabindex", "-1");
        items[nextIndex].setAttribute("tabindex", "0");
        items[nextIndex].focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerId, orientation]);
};
