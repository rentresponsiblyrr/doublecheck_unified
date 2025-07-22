/**
 * RESPONSIVE DESIGN UTILITIES - NETFLIX/META STANDARDS
 * 
 * Mobile-first responsive design utilities following Netflix and Meta
 * design system patterns. Ensures consistent breakpoints, spacing,
 * and responsive behavior across all components.
 * 
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Enhanced className utility with responsive-specific optimizations
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Standard breakpoints following mobile-first approach
 */
export const RESPONSIVE_BREAKPOINTS = {
  // Mobile first (default - no prefix needed)
  mobile: '', // 0px and up
  
  // Tablet and up
  sm: 'sm:', // 640px and up
  md: 'md:', // 768px and up  
  lg: 'lg:', // 1024px and up
  xl: 'xl:', // 1280px and up
  '2xl': '2xl:', // 1536px and up
  
  // Custom STR breakpoints
  tablet: 'md:', // 768px and up
  desktop: 'lg:', // 1024px and up
  widescreen: 'xl:', // 1280px and up
} as const;

/**
 * Responsive spacing scale following 8px grid system
 */
export const RESPONSIVE_SPACING = {
  // Mobile-first spacing
  mobile: {
    xs: 'p-2',    // 8px
    sm: 'p-3',    // 12px  
    md: 'p-4',    // 16px
    lg: 'p-6',    // 24px
    xl: 'p-8',    // 32px
  },
  tablet: {
    xs: 'md:p-3', // 12px
    sm: 'md:p-4', // 16px
    md: 'md:p-6', // 24px
    lg: 'md:p-8', // 32px
    xl: 'md:p-10', // 40px
  },
  desktop: {
    xs: 'lg:p-4',  // 16px
    sm: 'lg:p-6',  // 24px
    md: 'lg:p-8',  // 32px
    lg: 'lg:p-10', // 40px
    xl: 'lg:p-12', // 48px
  }
} as const;

/**
 * Responsive typography scale
 */
export const RESPONSIVE_TYPOGRAPHY = {
  // Headers
  h1: 'text-2xl md:text-3xl lg:text-4xl font-bold',
  h2: 'text-xl md:text-2xl lg:text-3xl font-semibold', 
  h3: 'text-lg md:text-xl lg:text-2xl font-semibold',
  h4: 'text-base md:text-lg lg:text-xl font-medium',
  h5: 'text-sm md:text-base lg:text-lg font-medium',
  h6: 'text-xs md:text-sm lg:text-base font-medium',
  
  // Body text
  body: 'text-sm md:text-base',
  bodyLarge: 'text-base md:text-lg',
  bodySmall: 'text-xs md:text-sm',
  
  // Special
  caption: 'text-xs md:text-sm text-muted-foreground',
  overline: 'text-xs uppercase tracking-wider font-medium',
} as const;

/**
 * Responsive layout patterns
 */
export const RESPONSIVE_LAYOUTS = {
  // Container max-widths
  container: 'max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto',
  
  // Grid patterns
  gridAutoFit: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6',
  gridTwoCol: 'grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6',
  gridThreeCol: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
  
  // Flex patterns  
  flexMobile: 'flex flex-col md:flex-row gap-4 md:gap-6',
  flexReverse: 'flex flex-col-reverse md:flex-row gap-4 md:gap-6',
  
  // Card patterns
  card: 'bg-white rounded-lg shadow-sm border p-4 md:p-6',
  cardCompact: 'bg-white rounded-md shadow-sm border p-3 md:p-4',
} as const;

/**
 * Mobile-specific interaction patterns
 */
export const MOBILE_INTERACTIONS = {
  // Touch targets (minimum 44px)
  touchTarget: 'min-h-[44px] min-w-[44px]',
  
  // Button sizes
  buttonSm: 'px-3 py-2 text-sm min-h-[36px]',
  button: 'px-4 py-2.5 text-sm min-h-[40px] md:min-h-[36px]',
  buttonLg: 'px-6 py-3 text-base min-h-[44px] md:min-h-[40px]',
  
  // Form controls
  input: 'min-h-[44px] md:min-h-[40px] px-3 py-2',
  select: 'min-h-[44px] md:min-h-[40px] px-3 py-2',
  
  // Navigation
  navItem: 'block px-3 py-3 md:px-2 md:py-2 text-base md:text-sm',
} as const;

/**
 * Responsive visibility utilities
 */
export const RESPONSIVE_VISIBILITY = {
  // Show only on mobile
  mobileOnly: 'block md:hidden',
  
  // Show only on tablet and up
  tabletUp: 'hidden md:block',
  
  // Show only on desktop and up  
  desktopUp: 'hidden lg:block',
  
  // Hide on mobile
  hideMobile: 'hidden md:block',
  
  // Hide on tablet
  hideTablet: 'block md:hidden lg:block',
  
  // Hide on desktop
  hideDesktop: 'block lg:hidden',
} as const;

/**
 * Generate responsive className strings
 */
export const responsive = {
  /**
   * Create responsive padding classes
   */
  padding: (mobile: string, tablet?: string, desktop?: string) => {
    return cn(
      mobile,
      tablet && `md:${tablet}`,
      desktop && `lg:${desktop}`
    );
  },
  
  /**
   * Create responsive margin classes  
   */
  margin: (mobile: string, tablet?: string, desktop?: string) => {
    return cn(
      mobile,
      tablet && `md:${tablet}`, 
      desktop && `lg:${desktop}`
    );
  },
  
  /**
   * Create responsive text size classes
   */
  text: (mobile: string, tablet?: string, desktop?: string) => {
    return cn(
      mobile,
      tablet && `md:${tablet}`,
      desktop && `lg:${desktop}`
    );
  },
  
  /**
   * Create responsive grid column classes
   */
  gridCols: (mobile: number, tablet?: number, desktop?: number) => {
    return cn(
      `grid-cols-${mobile}`,
      tablet && `md:grid-cols-${tablet}`,
      desktop && `lg:grid-cols-${desktop}`
    );
  },
  
  /**
   * Create responsive width classes
   */
  width: (mobile: string, tablet?: string, desktop?: string) => {
    return cn(
      mobile,
      tablet && `md:${tablet}`,
      desktop && `lg:${desktop}`
    );
  },
} as const;

/**
 * Accessibility helpers for responsive design
 */
export const RESPONSIVE_A11Y = {
  // Focus states optimized for touch and keyboard
  focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
  
  // High contrast support
  highContrast: 'contrast-more:border-gray-900 contrast-more:text-gray-900',
  
  // Reduced motion support
  motion: 'motion-safe:transition-all motion-safe:duration-200',
  
  // Screen reader improvements
  srOnly: 'sr-only',
  notSrOnly: 'not-sr-only',
} as const;

/**
 * Performance-optimized responsive image classes
 */
export const RESPONSIVE_IMAGES = {
  // Aspect ratios
  square: 'aspect-square',
  video: 'aspect-video', 
  photo: 'aspect-[4/3]',
  
  // Object fit patterns
  cover: 'object-cover',
  contain: 'object-contain',
  
  // Responsive image containers
  container: 'relative overflow-hidden rounded-lg',
  
  // Loading states
  loading: 'bg-gray-200 animate-pulse',
} as const;

/**
 * Type-safe responsive breakpoint checker
 */
export const checkBreakpoint = (width: number) => {
  if (width < 640) return 'mobile';
  if (width < 768) return 'sm';
  if (width < 1024) return 'tablet';
  if (width < 1280) return 'desktop'; 
  return 'widescreen';
};

/**
 * Mobile detection utilities
 */
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};