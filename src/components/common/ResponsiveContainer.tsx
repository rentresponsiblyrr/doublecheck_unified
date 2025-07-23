/**
 * RESPONSIVE CONTAINER - NETFLIX/META MOBILE-FIRST PATTERNS
 *
 * Enterprise-grade responsive container component following Netflix and Meta
 * design standards. Provides consistent layout patterns, performance
 * optimization, and accessibility compliance across all screen sizes.
 *
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import React from "react";
import {
  cn,
  RESPONSIVE_LAYOUTS,
  RESPONSIVE_SPACING,
  RESPONSIVE_A11Y,
} from "@/lib/utils/responsive";
import { useBreakpoints } from "@/hooks/useMediaQuery";

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;

  // Layout variants
  variant?: "default" | "compact" | "spacious" | "full-width";

  // Responsive behavior
  mobileLayout?: "stack" | "scroll" | "grid" | "flex";
  tabletLayout?: "stack" | "scroll" | "grid" | "flex";
  desktopLayout?: "stack" | "scroll" | "grid" | "flex";

  // Spacing control
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  gap?: "none" | "sm" | "md" | "lg" | "xl";

  // Accessibility
  role?: string;
  ariaLabel?: string;

  // Performance optimization
  priority?: "high" | "normal" | "low";
  virtualScroll?: boolean;

  // Mobile-specific
  touchOptimized?: boolean;
  safeArea?: boolean;
}

/**
 * Professional responsive container with Netflix/Meta standards
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = "",
  variant = "default",
  mobileLayout = "stack",
  tabletLayout = "flex",
  desktopLayout = "flex",
  padding = "md",
  gap = "md",
  role,
  ariaLabel,
  priority = "normal",
  virtualScroll = false,
  touchOptimized = true,
  safeArea = true,
}) => {
  const { isMobile, isTablet, isDesktop } = useBreakpoints();

  // Generate responsive layout classes
  const getLayoutClasses = () => {
    const layouts = {
      stack: "flex flex-col",
      scroll: "flex overflow-x-auto",
      grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      flex: "flex flex-col md:flex-row",
    };

    return cn(
      // Base layout
      layouts[mobileLayout],
      // Tablet override
      isTablet &&
        `md:${layouts[tabletLayout]
          .split(" ")
          .map((c) => (c.startsWith("flex") || c.startsWith("grid") ? c : ""))
          .filter(Boolean)
          .join(" ")}`,
      // Desktop override
      isDesktop &&
        `lg:${layouts[desktopLayout]
          .split(" ")
          .map((c) => (c.startsWith("flex") || c.startsWith("grid") ? c : ""))
          .filter(Boolean)
          .join(" ")}`,
    );
  };

  // Generate spacing classes
  const getSpacingClasses = () => {
    const paddingMap = {
      none: "",
      sm:
        RESPONSIVE_SPACING.mobile.sm +
        " " +
        RESPONSIVE_SPACING.tablet.sm +
        " " +
        RESPONSIVE_SPACING.desktop.sm,
      md:
        RESPONSIVE_SPACING.mobile.md +
        " " +
        RESPONSIVE_SPACING.tablet.md +
        " " +
        RESPONSIVE_SPACING.desktop.md,
      lg:
        RESPONSIVE_SPACING.mobile.lg +
        " " +
        RESPONSIVE_SPACING.tablet.lg +
        " " +
        RESPONSIVE_SPACING.desktop.lg,
      xl:
        RESPONSIVE_SPACING.mobile.xl +
        " " +
        RESPONSIVE_SPACING.tablet.xl +
        " " +
        RESPONSIVE_SPACING.desktop.xl,
    };

    const gapMap = {
      none: "",
      sm: "gap-2 md:gap-3 lg:gap-4",
      md: "gap-3 md:gap-4 lg:gap-6",
      lg: "gap-4 md:gap-6 lg:gap-8",
      xl: "gap-6 md:gap-8 lg:gap-10",
    };

    return cn(paddingMap[padding], gapMap[gap]);
  };

  // Generate variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case "compact":
        return "max-w-2xl mx-auto";
      case "spacious":
        return RESPONSIVE_LAYOUTS.container;
      case "full-width":
        return "w-full max-w-none";
      default:
        return "max-w-4xl mx-auto";
    }
  };

  // Performance optimization classes
  const getPerformanceClasses = () => {
    const classes = [];

    if (priority === "high") {
      classes.push("will-change-transform");
    }

    if (virtualScroll) {
      classes.push("overflow-hidden");
    }

    return cn(...classes);
  };

  // Mobile optimization classes
  const getMobileClasses = () => {
    const classes = [];

    if (touchOptimized) {
      classes.push("touch-manipulation");
    }

    if (safeArea && isMobile) {
      classes.push("pb-safe pt-safe px-safe");
    }

    return cn(...classes);
  };

  const containerClasses = cn(
    // Base styles
    "w-full",

    // Responsive layout
    getLayoutClasses(),

    // Spacing
    getSpacingClasses(),

    // Variant
    getVariantClasses(),

    // Performance
    getPerformanceClasses(),

    // Mobile optimization
    getMobileClasses(),

    // Accessibility
    RESPONSIVE_A11Y.motion,
    RESPONSIVE_A11Y.focus,

    // Custom classes
    className,
  );

  return (
    <div
      className={containerClasses}
      role={role}
      aria-label={ariaLabel}
      data-testid="responsive-container"
      data-variant={variant}
      data-mobile-layout={mobileLayout}
      data-priority={priority}
    >
      {children}
    </div>
  );
};

/**
 * Specialized responsive grid component
 */
export interface ResponsiveGridProps
  extends Omit<
    ResponsiveContainerProps,
    "mobileLayout" | "tabletLayout" | "desktopLayout"
  > {
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  minItemWidth?: string;
  autoFit?: boolean;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  minItemWidth = "250px",
  autoFit = false,
  className = "",
  ...props
}) => {
  const gridClasses = autoFit
    ? `grid grid-cols-[repeat(auto-fit,minmax(${minItemWidth},1fr))]`
    : cn(
        `grid-cols-${columns.mobile}`,
        `md:grid-cols-${columns.tablet}`,
        `lg:grid-cols-${columns.desktop}`,
      );

  return (
    <ResponsiveContainer
      {...props}
      className={cn("grid", gridClasses, className)}
      mobileLayout="grid"
      tabletLayout="grid"
      desktopLayout="grid"
    />
  );
};

/**
 * Specialized responsive flex component
 */
export interface ResponsiveFlexProps
  extends Omit<
    ResponsiveContainerProps,
    "mobileLayout" | "tabletLayout" | "desktopLayout"
  > {
  direction?: {
    mobile?: "row" | "col";
    tablet?: "row" | "col";
    desktop?: "row" | "col";
  };
  wrap?: boolean;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
}

export const ResponsiveFlex: React.FC<ResponsiveFlexProps> = ({
  direction = { mobile: "col", tablet: "row", desktop: "row" },
  wrap = true,
  align = "stretch",
  justify = "start",
  className = "",
  ...props
}) => {
  const flexClasses = cn(
    "flex",
    // Direction
    direction.mobile === "row" ? "flex-row" : "flex-col",
    direction.tablet === "row" ? "md:flex-row" : "md:flex-col",
    direction.desktop === "row" ? "lg:flex-row" : "lg:flex-col",
    // Wrap
    wrap && "flex-wrap",
    // Alignment
    {
      "items-start": align === "start",
      "items-center": align === "center",
      "items-end": align === "end",
      "items-stretch": align === "stretch",
    },
    // Justify
    {
      "justify-start": justify === "start",
      "justify-center": justify === "center",
      "justify-end": justify === "end",
      "justify-between": justify === "between",
      "justify-around": justify === "around",
      "justify-evenly": justify === "evenly",
    },
  );

  return (
    <ResponsiveContainer
      {...props}
      className={cn(flexClasses, className)}
      mobileLayout="flex"
      tabletLayout="flex"
      desktopLayout="flex"
    />
  );
};
