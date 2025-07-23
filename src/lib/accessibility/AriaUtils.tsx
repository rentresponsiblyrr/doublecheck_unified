/**
 * ARIA UTILITIES - WCAG 2.1 AA SCREEN READER OPTIMIZATION
 *
 * Comprehensive ARIA implementation following WCAG 2.1 AA standards.
 * Provides screen reader optimization, semantic markup, and assistive
 * technology compatibility for Netflix/Meta accessibility compliance.
 *
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import React, { useEffect, useCallback, useState } from "react";
import { useAccessibility } from "./AccessibilityProvider";

/**
 * ARIA live region priorities
 */
export type AriaLivePriority = "off" | "polite" | "assertive";

/**
 * Common ARIA roles
 */
export type AriaRole =
  | "alert"
  | "alertdialog"
  | "application"
  | "article"
  | "banner"
  | "button"
  | "cell"
  | "checkbox"
  | "columnheader"
  | "combobox"
  | "complementary"
  | "contentinfo"
  | "definition"
  | "dialog"
  | "directory"
  | "document"
  | "form"
  | "grid"
  | "gridcell"
  | "group"
  | "heading"
  | "img"
  | "link"
  | "list"
  | "listbox"
  | "listitem"
  | "log"
  | "main"
  | "marquee"
  | "math"
  | "menu"
  | "menubar"
  | "menuitem"
  | "menuitemcheckbox"
  | "menuitemradio"
  | "navigation"
  | "note"
  | "option"
  | "presentation"
  | "progressbar"
  | "radio"
  | "radiogroup"
  | "region"
  | "row"
  | "rowgroup"
  | "rowheader"
  | "scrollbar"
  | "search"
  | "separator"
  | "slider"
  | "spinbutton"
  | "status"
  | "tab"
  | "tablist"
  | "tabpanel"
  | "textbox"
  | "timer"
  | "toolbar"
  | "tooltip"
  | "tree"
  | "treeitem"
  | "none";

/**
 * ARIA properties interface
 */
export interface AriaProps {
  role?: AriaRole;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaHidden?: boolean;
  ariaLive?: AriaLivePriority;
  ariaAtomic?: boolean;
  ariaRelevant?: string;
  ariaBusy?: boolean;
  ariaDisabled?: boolean;
  ariaReadOnly?: boolean;
  ariaRequired?: boolean;
  ariaInvalid?: boolean | "grammar" | "spelling";
  ariaChecked?: boolean | "mixed";
  ariaPressed?: boolean | "mixed";
  ariaSelected?: boolean;
  ariaCurrent?: boolean | "page" | "step" | "location" | "date" | "time";
  ariaLevel?: number;
  ariaSetSize?: number;
  ariaPosInSet?: number;
  ariaValueNow?: number;
  ariaValueMin?: number;
  ariaValueMax?: number;
  ariaValueText?: string;
  tabIndex?: number;
}

/**
 * Convert ARIA props to HTML attributes
 */
export const convertAriaProps = (props: AriaProps): Record<string, any> => {
  const htmlAttributes: Record<string, any> = {};

  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined) return;

    // Convert camelCase to kebab-case with aria- prefix
    const ariaKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    const htmlKey =
      key === "role" || key === "tabIndex"
        ? key
        : `aria-${ariaKey.replace("aria-", "")}`;

    htmlAttributes[htmlKey] = value;
  });

  return htmlAttributes;
};

/**
 * Live region component for announcements
 */
interface LiveRegionProps {
  message?: string;
  priority?: AriaLivePriority;
  atomic?: boolean;
  relevant?: string;
  id?: string;
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = "polite",
  atomic = true,
  relevant = "additions text",
  id = "live-region",
  className = "sr-only",
}) => {
  return (
    <div
      id={id}
      className={className}
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      role="status"
    >
      {message}
    </div>
  );
};

/**
 * Status announcer hook
 */
export const useStatusAnnouncer = () => {
  const { announce } = useAccessibility();
  const [status, setStatus] = useState<string>("");

  const announceStatus = useCallback(
    (message: string, priority: AriaLivePriority = "polite") => {
      setStatus(message);
      announce(message, priority);

      // Clear after announcement
      setTimeout(() => setStatus(""), 1000);
    },
    [announce],
  );

  const announceError = useCallback(
    (message: string) => {
      announceStatus(`Error: ${message}`, "assertive");
    },
    [announceStatus],
  );

  const announceSuccess = useCallback(
    (message: string) => {
      announceStatus(`Success: ${message}`, "polite");
    },
    [announceStatus],
  );

  const announceWarning = useCallback(
    (message: string) => {
      announceStatus(`Warning: ${message}`, "assertive");
    },
    [announceStatus],
  );

  return {
    status,
    announceStatus,
    announceError,
    announceSuccess,
    announceWarning,
  };
};

/**
 * Accessible button component
 */
interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    AriaProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingText?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  loadingText = "Loading...",
  disabled,
  onClick,
  className = "",
  ...ariaProps
}) => {
  const { announceStatus } = useStatusAnnouncer();

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        event.preventDefault();
        return;
      }

      // Announce button activation for screen readers
      const buttonText =
        typeof children === "string"
          ? children
          : ariaProps.ariaLabel || "Button";
      announceStatus(`${buttonText} activated`);

      onClick?.(event);
    },
    [loading, disabled, onClick, children, ariaProps.ariaLabel, announceStatus],
  );

  const buttonClass = `
    accessible-button
    accessible-button--${variant}
    accessible-button--${size}
    ${loading ? "accessible-button--loading" : ""}
    ${disabled ? "accessible-button--disabled" : ""}
    ${className}
  `.trim();

  const htmlAttributes = convertAriaProps({
    ...ariaProps,
    ariaDisabled: disabled || loading,
    ariaBusy: loading,
  });

  return (
    <button
      {...htmlAttributes}
      className={buttonClass}
      disabled={disabled || loading}
      onClick={handleClick}
    >
      {loading && (
        <span className="accessible-button__spinner" aria-hidden="true" />
      )}
      <span className={loading ? "sr-only" : ""}>
        {loading ? loadingText : children}
      </span>
    </button>
  );
};

/**
 * Accessible form field component
 */
interface AccessibleFieldProps extends AriaProps {
  children: React.ReactNode;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  id: string;
}

export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  children,
  label,
  error,
  hint,
  required = false,
  id,
  ...ariaProps
}) => {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const htmlAttributes = convertAriaProps({
    ...ariaProps,
    ariaRequired: required,
    ariaInvalid: !!error,
    ariaDescribedBy: describedBy,
  });

  return (
    <div
      className={`accessible-field ${error ? "accessible-field--error" : ""}`}
    >
      <label
        htmlFor={id}
        className={`accessible-field__label ${required ? "accessible-field__label--required" : ""}`}
      >
        {label}
        {required && (
          <span className="accessible-field__required" aria-label=" (required)">
            *
          </span>
        )}
      </label>

      {hint && (
        <div id={hintId} className="accessible-field__hint">
          {hint}
        </div>
      )}

      <div className="accessible-field__input">
        {React.cloneElement(children as React.ReactElement, {
          id,
          ...htmlAttributes,
        })}
      </div>

      {error && (
        <div
          id={errorId}
          className="accessible-field__error"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
};

/**
 * Accessible modal dialog
 */
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnEscape?: boolean;
  closeOnOverlay?: boolean;
  initialFocus?: string;
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnEscape = true,
  closeOnOverlay = true,
  initialFocus,
  className = "",
}) => {
  const { trapFocus, announce } = useAccessibility();
  const modalId = `modal-${React.useId()}`;
  const titleId = `${modalId}-title`;
  const contentId = `${modalId}-content`;

  useEffect(() => {
    if (!isOpen) return;

    // Announce modal opening
    announce(`Dialog opened: ${title}`, "assertive");

    // Trap focus in modal
    const cleanup = trapFocus(modalId);

    // Focus initial element
    if (initialFocus) {
      setTimeout(() => {
        const element = document.getElementById(initialFocus);
        element?.focus();
      }, 100);
    }

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    return () => {
      cleanup();
      document.body.style.overflow = "unset";
      announce("Dialog closed", "polite");
    };
  }, [isOpen, modalId, trapFocus, announce, title, initialFocus]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  return (
    <div className="accessible-modal-overlay" aria-hidden="true">
      <div
        className="accessible-modal-backdrop"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      <div
        id={modalId}
        className={`accessible-modal accessible-modal--${size} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={contentId}
        tabIndex={-1}
      >
        <div className="accessible-modal__header">
          <h2 id={titleId} className="accessible-modal__title">
            {title}
          </h2>

          <button
            className="accessible-modal__close"
            onClick={onClose}
            aria-label={`Close ${title} dialog`}
            type="button"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div id={contentId} className="accessible-modal__content">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Accessible tab system
 */
interface AccessibleTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
    disabled?: boolean;
  }>;
  defaultTab?: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export const AccessibleTabs: React.FC<AccessibleTabsProps> = ({
  tabs,
  defaultTab,
  orientation = "horizontal",
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const { announce } = useAccessibility();
  const tabsId = `tabs-${React.useId()}`;

  const handleTabChange = useCallback(
    (tabId: string, tabLabel: string) => {
      setActiveTab(tabId);
      announce(`${tabLabel} tab selected`);
    },
    [announce],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, tabId: string) => {
      const tabIds = tabs.filter((tab) => !tab.disabled).map((tab) => tab.id);
      const currentIndex = tabIds.indexOf(tabId);
      let nextIndex: number;

      switch (event.key) {
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : tabIds.length - 1;
          setActiveTab(tabIds[nextIndex]);
          break;

        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          nextIndex = currentIndex < tabIds.length - 1 ? currentIndex + 1 : 0;
          setActiveTab(tabIds[nextIndex]);
          break;

        case "Home":
          event.preventDefault();
          setActiveTab(tabIds[0]);
          break;

        case "End":
          event.preventDefault();
          setActiveTab(tabIds[tabIds.length - 1]);
          break;
      }
    },
    [tabs],
  );

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div
      className={`accessible-tabs accessible-tabs--${orientation} ${className}`}
    >
      <div
        role="tablist"
        aria-orientation={orientation}
        className="accessible-tabs__list"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tabsId}-panel-${tab.id}`}
            id={`${tabsId}-tab-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            disabled={tab.disabled}
            className={`accessible-tabs__tab ${activeTab === tab.id ? "accessible-tabs__tab--active" : ""}`}
            onClick={() => handleTabChange(tab.id, tab.label)}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTabData && (
        <div
          role="tabpanel"
          aria-labelledby={`${tabsId}-tab-${activeTab}`}
          id={`${tabsId}-panel-${activeTab}`}
          className="accessible-tabs__panel"
          tabIndex={0}
        >
          {activeTabData.content}
        </div>
      )}
    </div>
  );
};

/**
 * Screen reader utilities
 */
export const screenReaderUtils = {
  /**
   * Create screen reader only text
   */
  srOnly: (text: string) => <span className="sr-only">{text}</span>,

  /**
   * Create visually hidden but focusable element
   */
  visuallyHidden: (text: string, focusable = false) => (
    <span
      className={`visually-hidden ${focusable ? "visually-hidden-focusable" : ""}`}
    >
      {text}
    </span>
  ),

  /**
   * Format number for screen readers
   */
  formatNumber: (
    num: number,
    type: "currency" | "percentage" | "decimal" = "decimal",
  ) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style:
        type === "currency"
          ? "currency"
          : type === "percentage"
            ? "percent"
            : "decimal",
      currency: type === "currency" ? "USD" : undefined,
    });
    return formatter.format(num);
  },

  /**
   * Format date for screen readers
   */
  formatDate: (date: Date, format: "short" | "medium" | "long" = "medium") => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: format,
    }).format(date);
  },
};
