/**
 * USE MEDIA QUERY HOOK - MOBILE-FIRST RESPONSIVE DESIGN
 *
 * High-performance media query hook for responsive breakpoints.
 * Implements Netflix/Meta-standard mobile-first patterns with
 * proper cleanup and performance optimization.
 *
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import { useState, useEffect } from "react";
import { debugLogger } from '@/utils/debugLogger';

/**
 * Hook for responsive media query matching with performance optimization
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => {
    // Server-side rendering guard
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return window.matchMedia(query).matches;
    } catch (error) {
      debugLogger.warn("useMediaQuery: Invalid media query", { query, error });
      return false;
    }
  });

  useEffect(() => {
    // Validate query and create MediaQueryList
    let mediaQuery: MediaQueryList | null = null;

    try {
      mediaQuery = window.matchMedia(query);
    } catch (error) {
      debugLogger.error("useMediaQuery: Failed to create media query", {
        query,
        error,
      });
      return;
    }

    // Update state to current match
    setMatches(mediaQuery.matches);

    // Event handler for media query changes
    const handleMediaQueryChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener with proper browser compatibility
    if (mediaQuery.addEventListener) {
      // Modern browsers
      mediaQuery.addEventListener("change", handleMediaQueryChange);
    } else {
      // Legacy browser support (Safari < 14)
      mediaQuery.addListener(handleMediaQueryChange);
    }

    // Cleanup function
    return () => {
      if (mediaQuery) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", handleMediaQueryChange);
        } else {
          mediaQuery.removeListener(handleMediaQueryChange);
        }
      }
    };
  }, [query]);

  return matches;
};

/**
 * Predefined breakpoints for common responsive patterns
 */
export const BREAKPOINTS = {
  // Mobile first approach
  mobile: "(max-width: 767px)",
  tablet: "(min-width: 768px) and (max-width: 1023px)",
  desktop: "(min-width: 1024px)",

  // Specific breakpoints
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",

  // Orientation and features
  portrait: "(orientation: portrait)",
  landscape: "(orientation: landscape)",
  retina: "(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)",
  touch: "(pointer: coarse)",
  hover: "(hover: hover)",

  // Dark mode preference
  darkMode: "(prefers-color-scheme: dark)",
  lightMode: "(prefers-color-scheme: light)",

  // Accessibility
  reduceMotion: "(prefers-reduced-motion: reduce)",
  increaseContrast: "(prefers-contrast: high)",
} as const;

/**
 * Convenience hooks for common breakpoints
 */
export const useIsMobile = () => useMediaQuery(BREAKPOINTS.mobile);
export const useIsTablet = () => useMediaQuery(BREAKPOINTS.tablet);
export const useIsDesktop = () => useMediaQuery(BREAKPOINTS.desktop);

export const useIsDarkMode = () => useMediaQuery(BREAKPOINTS.darkMode);
export const usePrefersReducedMotion = () =>
  useMediaQuery(BREAKPOINTS.reduceMotion);
export const useIsTouch = () => useMediaQuery(BREAKPOINTS.touch);
export const useCanHover = () => useMediaQuery(BREAKPOINTS.hover);

/**
 * Multiple breakpoint hook for complex responsive logic
 */
export const useBreakpoints = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  const currentBreakpoint = isMobile
    ? "mobile"
    : isTablet
      ? "tablet"
      : "desktop";

  return {
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint,
    // Utility functions
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop,
  };
};
