# ♿ ACCESSIBILITY GUIDE FOR STR CERTIFIED

*Comprehensive WCAG 2.1 compliance standards for building inclusive, accessible applications*

## **🎯 ACCESSIBILITY PHILOSOPHY**

Accessibility is not an add-on feature—it's a fundamental requirement that ensures our platform is usable by everyone, regardless of their abilities. Our accessibility approach follows these core principles:

- **Inclusive by Design** - Accessibility considerations from the very beginning
- **Universal Usability** - Works for all users, regardless of disability
- **Legal Compliance** - Meets WCAG 2.1 AA standards and ADA requirements
- **Progressive Enhancement** - Core functionality accessible to all assistive technologies
- **Continuous Testing** - Regular testing with real users and assistive technologies

## **📊 ACCESSIBILITY STANDARDS**

### **WCAG 2.1 Level AA Requirements**
```typescript
// Accessibility compliance targets
const ACCESSIBILITY_STANDARDS = {
  // Perceivable
  colorContrast: {
    normalText: 4.5,        // 4.5:1 contrast ratio
    largeText: 3.0,         // 3.0:1 contrast ratio
    uiComponents: 3.0,      // 3.0:1 for UI components
    graphics: 3.0           // 3.0:1 for meaningful graphics
  },
  
  // Operable
  keyboard: {
    fullKeyboardAccess: true,     // All functionality available via keyboard
    noKeyboardTrap: true,         // No keyboard traps
    focusVisible: true,           // Focus indicators visible
    bypassBlocks: true            // Skip links available
  },
  
  timing: {
    adjustableTime: true,         // Time limits adjustable
    pauseAnimation: true,         // Animations can be paused
    noFlashing: true              // No content flashes > 3 times per second
  },
  
  // Understandable
  readability: {
    languageOfPage: true,         // Page language identified
    languageOfParts: true,        // Language changes identified
    unusualWords: true,           // Unusual words explained
    abbreviations: true           // Abbreviations explained
  },
  
  // Robust
  compatibility: {
    validHtml: true,              // Valid HTML markup
    nameRoleValue: true,          // All UI components have name, role, value
    statusMessages: true          // Status messages announced
  }
};
```

### **Mobile Accessibility Requirements**
```typescript
// Mobile-specific accessibility standards
const MOBILE_ACCESSIBILITY = {
  touchTargets: {
    minimumSize: 44,              // 44px minimum touch target size
    spacing: 8,                   // 8px minimum spacing between targets
    visualSize: 24                // 24px minimum visual size
  },
  
  gestures: {
    alternativeInputs: true,      // Alternative to complex gestures
    cancelable: true,             // Gestures can be cancelled
    singlePointer: true,          // Single pointer operation
    dragAndDrop: true             // Drag operations have alternative
  },
  
  orientation: {
    supportBoth: true,            // Support both portrait and landscape
    noRestrictions: true,         // No essential functionality restricted by orientation
    rotationLock: false           // Don't force rotation lock
  },
  
  motion: {
    reducedMotion: true,          // Respect prefers-reduced-motion
    motionActuation: true,        // Alternative to device motion
    vestibularSafety: true        // No vestibular disorder triggers
  }
};
```

## **🔍 PERCEIVABLE CONTENT**

### **Color and Contrast**

```typescript
/**
 * Color contrast utilities and validation
 */
class ColorAccessibility {
  /**
   * Calculate color contrast ratio
   */
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    const luminance1 = this.getLuminance(rgb1);
    const luminance2 = this.getLuminance(rgb2);
    
    const brightest = Math.max(luminance1, luminance2);
    const darkest = Math.min(luminance1, luminance2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }
  
  /**
   * Validate color contrast compliance
   */
  static validateContrast(
    foreground: string, 
    background: string, 
    level: 'AA' | 'AAA' = 'AA',
    fontSize: number = 16
  ): AccessibilityResult {
    const contrast = this.getContrastRatio(foreground, background);
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && this.isBold(fontSize));
    
    const requiredRatio = level === 'AAA' 
      ? (isLargeText ? 4.5 : 7.0)
      : (isLargeText ? 3.0 : 4.5);
    
    return {
      passes: contrast >= requiredRatio,
      contrast,
      required: requiredRatio,
      level,
      isLargeText,
      recommendations: contrast < requiredRatio ? [
        `Increase contrast to ${requiredRatio}:1 or higher`,
        `Current contrast: ${contrast.toFixed(2)}:1`
      ] : []
    };
  }
  
  /**
   * Generate accessible color palette
   */
  static generateAccessiblePalette(baseColor: string): AccessiblePalette {
    const palette: AccessiblePalette = {
      primary: baseColor,
      onPrimary: this.findOptimalTextColor(baseColor),
      secondary: this.adjustColorBrightness(baseColor, 0.8),
      background: '#ffffff',
      surface: '#f8f9fa',
      error: '#dc3545',
      warning: '#ffc107',
      success: '#28a745',
      info: '#17a2b8'
    };
    
    // Ensure all combinations meet contrast requirements
    return this.validatePalette(palette);
  }
  
  private static hexToRgb(hex: string): RGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
  
  private static getLuminance(rgb: RGB): number {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
  
  private static findOptimalTextColor(backgroundColor: string): string {
    const whiteContrast = this.getContrastRatio('#ffffff', backgroundColor);
    const blackContrast = this.getContrastRatio('#000000', backgroundColor);
    
    return whiteContrast > blackContrast ? '#ffffff' : '#000000';
  }
  
  private static adjustColorBrightness(color: string, factor: number): string {
    const rgb = this.hexToRgb(color);
    const adjusted = {
      r: Math.round(rgb.r * factor),
      g: Math.round(rgb.g * factor),
      b: Math.round(rgb.b * factor)
    };
    
    return `#${adjusted.r.toString(16).padStart(2, '0')}${adjusted.g.toString(16).padStart(2, '0')}${adjusted.b.toString(16).padStart(2, '0')}`;
  }
  
  private static validatePalette(palette: AccessiblePalette): AccessiblePalette {
    // Validate all color combinations and adjust if necessary
    const validatedPalette = { ...palette };
    
    // Ensure primary/onPrimary contrast
    const primaryContrast = this.getContrastRatio(palette.primary, palette.onPrimary);
    if (primaryContrast < 4.5) {
      validatedPalette.onPrimary = this.findOptimalTextColor(palette.primary);
    }
    
    return validatedPalette;
  }
  
  private static isBold(fontSize: number): boolean {
    // Implementation depends on font weight detection
    return false; // Placeholder
  }
}

// CSS custom properties for accessible colors
const accessibleColorSystem = `
:root {
  /* Primary colors with guaranteed contrast */
  --color-primary: #0056b3;
  --color-primary-light: #007bff;
  --color-primary-dark: #003d82;
  --color-on-primary: #ffffff;
  
  /* Secondary colors */
  --color-secondary: #6c757d;
  --color-secondary-light: #adb5bd;
  --color-secondary-dark: #495057;
  --color-on-secondary: #ffffff;
  
  /* Background colors */
  --color-background: #ffffff;
  --color-surface: #f8f9fa;
  --color-surface-variant: #e9ecef;
  
  /* Text colors */
  --color-on-background: #212529;
  --color-on-surface: #212529;
  --color-on-surface-variant: #495057;
  
  /* Status colors */
  --color-error: #dc3545;
  --color-on-error: #ffffff;
  --color-success: #28a745;
  --color-on-success: #ffffff;
  --color-warning: #ffc107;
  --color-on-warning: #000000;
  
  /* Focus indicator */
  --color-focus: #0056b3;
  --focus-ring: 0 0 0 2px var(--color-focus);
  
  /* High contrast mode support */
  --color-border: #dee2e6;
  --color-outline: #6c757d;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --color-primary: #000000;
    --color-on-primary: #ffffff;
    --color-background: #ffffff;
    --color-on-background: #000000;
    --color-border: #000000;
    --color-outline: #000000;
  }
}
`;
```

### **Typography and Readability**

```typescript
/**
 * Typography accessibility utilities
 */
class TypographyAccessibility {
  /**
   * Accessible font size system
   */
  static getFontSizeSystem(): FontSizeSystem {
    return {
      xs: { size: 12, lineHeight: 1.5, letterSpacing: 0.025 },
      sm: { size: 14, lineHeight: 1.5, letterSpacing: 0.025 },
      base: { size: 16, lineHeight: 1.5, letterSpacing: 0 },
      lg: { size: 18, lineHeight: 1.4, letterSpacing: 0 },
      xl: { size: 20, lineHeight: 1.4, letterSpacing: 0 },
      '2xl': { size: 24, lineHeight: 1.3, letterSpacing: -0.025 },
      '3xl': { size: 30, lineHeight: 1.2, letterSpacing: -0.025 },
      '4xl': { size: 36, lineHeight: 1.1, letterSpacing: -0.05 }
    };
  }
  
  /**
   * Validate text readability
   */
  static validateReadability(text: string, context: ReadabilityContext): ReadabilityResult {
    const metrics = {
      wordCount: text.split(/\s+/).length,
      sentenceCount: text.split(/[.!?]+/).length,
      syllableCount: this.countSyllables(text),
      averageWordsPerSentence: 0,
      averageSyllablesPerWord: 0,
      fleschReadingScore: 0,
      readingLevel: ''
    };
    
    metrics.averageWordsPerSentence = metrics.wordCount / metrics.sentenceCount;
    metrics.averageSyllablesPerWord = metrics.syllableCount / metrics.wordCount;
    
    // Flesch Reading Ease Score
    metrics.fleschReadingScore = 206.835 - 
      (1.015 * metrics.averageWordsPerSentence) - 
      (84.6 * metrics.averageSyllablesPerWord);
    
    // Determine reading level
    if (metrics.fleschReadingScore >= 90) {
      metrics.readingLevel = 'Very Easy';
    } else if (metrics.fleschReadingScore >= 80) {
      metrics.readingLevel = 'Easy';
    } else if (metrics.fleschReadingScore >= 70) {
      metrics.readingLevel = 'Fairly Easy';
    } else if (metrics.fleschReadingScore >= 60) {
      metrics.readingLevel = 'Standard';
    } else if (metrics.fleschReadingScore >= 50) {
      metrics.readingLevel = 'Fairly Difficult';
    } else {
      metrics.readingLevel = 'Difficult';
    }
    
    return {
      ...metrics,
      passes: metrics.fleschReadingScore >= context.minimumScore,
      recommendations: this.generateReadabilityRecommendations(metrics, context)
    };
  }
  
  /**
   * Generate accessible typography CSS
   */
  static generateTypographyCSS(): string {
    return `
      /* Accessible typography system */
      :root {
        /* Font families */
        --font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        --font-family-mono: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', 'Courier New', monospace;
        
        /* Font sizes with good contrast */
        --font-size-xs: 0.75rem;    /* 12px */
        --font-size-sm: 0.875rem;   /* 14px */
        --font-size-base: 1rem;     /* 16px */
        --font-size-lg: 1.125rem;   /* 18px */
        --font-size-xl: 1.25rem;    /* 20px */
        --font-size-2xl: 1.5rem;    /* 24px */
        
        /* Line heights for readability */
        --line-height-tight: 1.25;
        --line-height-normal: 1.5;
        --line-height-relaxed: 1.75;
        
        /* Letter spacing */
        --letter-spacing-tight: -0.025em;
        --letter-spacing-normal: 0em;
        --letter-spacing-wide: 0.025em;
      }
      
      /* Base typography */
      body {
        font-family: var(--font-family-sans);
        font-size: var(--font-size-base);
        line-height: var(--line-height-normal);
        color: var(--color-on-background);
        background-color: var(--color-background);
      }
      
      /* Headings with proper hierarchy */
      h1, h2, h3, h4, h5, h6 {
        font-weight: 600;
        line-height: var(--line-height-tight);
        margin-top: 0;
        margin-bottom: 0.5em;
      }
      
      h1 { font-size: var(--font-size-2xl); }
      h2 { font-size: var(--font-size-xl); }
      h3 { font-size: var(--font-size-lg); }
      h4 { font-size: var(--font-size-base); }
      h5 { font-size: var(--font-size-sm); }
      h6 { font-size: var(--font-size-xs); }
      
      /* Paragraph spacing */
      p {
        margin-top: 0;
        margin-bottom: 1em;
        max-width: 65ch; /* Optimal line length */
      }
      
      /* Links */
      a {
        color: var(--color-primary);
        text-decoration: underline;
        text-underline-offset: 0.125em;
      }
      
      a:hover {
        text-decoration-thickness: 2px;
      }
      
      a:focus {
        outline: 2px solid var(--color-focus);
        outline-offset: 2px;
      }
      
      /* Code */
      code, pre {
        font-family: var(--font-family-mono);
        font-size: 0.9em;
      }
      
      /* Lists */
      ul, ol {
        margin-top: 0;
        margin-bottom: 1em;
        padding-left: 1.5em;
      }
      
      li {
        margin-bottom: 0.25em;
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      
      /* Print styles */
      @media print {
        body {
          font-size: 12pt;
          line-height: 1.4;
          color: black;
          background: white;
        }
        
        a {
          color: black;
          text-decoration: underline;
        }
        
        a[href]:after {
          content: " (" attr(href) ")";
          font-size: 0.8em;
        }
      }
    `;
  }
  
  private static countSyllables(text: string): number {
    // Simple syllable counting algorithm
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    return words.reduce((total, word) => {
      return total + Math.max(1, word.match(/[aeiouy]+/g)?.length || 1);
    }, 0);
  }
  
  private static generateReadabilityRecommendations(
    metrics: any, 
    context: ReadabilityContext
  ): string[] {
    const recommendations: string[] = [];
    
    if (metrics.averageWordsPerSentence > 20) {
      recommendations.push('Consider breaking long sentences into shorter ones');
    }
    
    if (metrics.averageSyllablesPerWord > 2) {
      recommendations.push('Consider using simpler words where possible');
    }
    
    if (metrics.fleschReadingScore < 60) {
      recommendations.push('Consider simplifying the language for better readability');
    }
    
    return recommendations;
  }
}
```

## **⌨️ KEYBOARD ACCESSIBILITY**

### **Keyboard Navigation**

```typescript
/**
 * Keyboard navigation and focus management
 */
class KeyboardAccessibility {
  private focusableElements: string[] = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ];
  
  /**
   * Create accessible keyboard navigation for a container
   */
  createKeyboardNavigation(container: HTMLElement, options: KeyboardNavigationOptions = {}): KeyboardNavigation {
    const {
      trapFocus = false,
      skipLinks = true,
      roving = false,
      circular = false
    } = options;
    
    const focusableElements = this.getFocusableElements(container);
    let currentFocusIndex = 0;
    
    const navigation: KeyboardNavigation = {
      focusFirst: () => {
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
          currentFocusIndex = 0;
        }
      },
      
      focusLast: () => {
        if (focusableElements.length > 0) {
          const lastIndex = focusableElements.length - 1;
          focusableElements[lastIndex].focus();
          currentFocusIndex = lastIndex;
        }
      },
      
      focusNext: () => {
        if (currentFocusIndex < focusableElements.length - 1) {
          currentFocusIndex++;
          focusableElements[currentFocusIndex].focus();
        } else if (circular) {
          currentFocusIndex = 0;
          focusableElements[0].focus();
        }
      },
      
      focusPrevious: () => {
        if (currentFocusIndex > 0) {
          currentFocusIndex--;
          focusableElements[currentFocusIndex].focus();
        } else if (circular) {
          currentFocusIndex = focusableElements.length - 1;
          focusableElements[currentFocusIndex].focus();
        }
      },
      
      destroy: () => {
        container.removeEventListener('keydown', handleKeyDown);
      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Tab':
          if (trapFocus) {
            event.preventDefault();
            if (event.shiftKey) {
              navigation.focusPrevious();
            } else {
              navigation.focusNext();
            }
          }
          break;
          
        case 'ArrowDown':
        case 'ArrowRight':
          if (roving) {
            event.preventDefault();
            navigation.focusNext();
          }
          break;
          
        case 'ArrowUp':
        case 'ArrowLeft':
          if (roving) {
            event.preventDefault();
            navigation.focusPrevious();
          }
          break;
          
        case 'Home':
          if (roving) {
            event.preventDefault();
            navigation.focusFirst();
          }
          break;
          
        case 'End':
          if (roving) {
            event.preventDefault();
            navigation.focusLast();
          }
          break;
          
        case 'Escape':
          if (trapFocus) {
            // Allow escape to close modal/dialog
            const closeEvent = new CustomEvent('escape', { bubbles: true });
            container.dispatchEvent(closeEvent);
          }
          break;
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    if (skipLinks) {
      this.addSkipLinks(container);
    }
    
    return navigation;
  }
  
  /**
   * React hook for keyboard navigation
   */
  useKeyboardNavigation(
    containerRef: React.RefObject<HTMLElement>,
    options: KeyboardNavigationOptions = {}
  ): KeyboardNavigation | null {
    const [navigation, setNavigation] = useState<KeyboardNavigation | null>(null);
    
    useEffect(() => {
      if (containerRef.current) {
        const nav = this.createKeyboardNavigation(containerRef.current, options);
        setNavigation(nav);
        
        return () => {
          nav.destroy();
        };
      }
    }, [containerRef, options]);
    
    return navigation;
  }
  
  /**
   * Focus management for SPAs
   */
  manageFocusForSPA(): void {
    // Focus management for route changes
    const handleRouteChange = () => {
      // Focus the main content area
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.focus();
      } else {
        // Focus the first heading
        const firstHeading = document.querySelector('h1, h2, h3, h4, h5, h6');
        if (firstHeading) {
          (firstHeading as HTMLElement).focus();
        }
      }
    };
    
    // Listen for route changes (adjust for your router)
    window.addEventListener('popstate', handleRouteChange);
    
    // For React Router
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Route changed, manage focus
          setTimeout(handleRouteChange, 0);
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  /**
   * Create accessible modal focus trap
   */
  createModalFocusTrap(modal: HTMLElement): FocusTrap {
    const focusableElements = this.getFocusableElements(modal);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    const previouslyFocusedElement = document.activeElement as HTMLElement;
    
    const trap: FocusTrap = {
      activate: () => {
        if (firstFocusable) {
          firstFocusable.focus();
        }
        
        document.addEventListener('keydown', handleKeyDown);
      },
      
      deactivate: () => {
        document.removeEventListener('keydown', handleKeyDown);
        
        if (previouslyFocusedElement) {
          previouslyFocusedElement.focus();
        }
      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable.focus();
          }
        }
      }
      
      if (event.key === 'Escape') {
        trap.deactivate();
        const closeEvent = new CustomEvent('close', { bubbles: true });
        modal.dispatchEvent(closeEvent);
      }
    };
    
    return trap;
  }
  
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = this.focusableElements.join(', ');
    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  }
  
  private addSkipLinks(container: HTMLElement): void {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--color-primary);
      color: var(--color-on-primary);
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 9999;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    container.prepend(skipLink);
  }
}
```

### **Focus Management Components**

```typescript
/**
 * Accessible React components with focus management
 */
import { useRef, useEffect, useState } from 'react';

// Accessible Button Component
interface AccessibleButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  ariaLabel,
  ariaDescribedBy,
  className = ''
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;
  
  const variantClasses = {
    primary: 'bg-primary text-on-primary hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-secondary text-on-secondary hover:bg-secondary-dark focus:ring-secondary',
    danger: 'bg-error text-on-error hover:bg-error-dark focus:ring-error'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-4 py-2 text-base min-h-[40px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]'
  };
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && onClick) {
      onClick(event);
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event as any);
    }
  };
  
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

// Accessible Modal Component
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      
      // Focus modal
      if (modalRef.current) {
        modalRef.current.focus();
      }
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
      
      // Restore body scroll
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${className}`}
        tabIndex={-1}
        role="document"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// Accessible Form Field Component
interface AccessibleFormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  label,
  children,
  error,
  hint,
  required = false,
  className = ''
}) => {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  
  return (
    <div className={`space-y-1 ${className}`}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">*</span>
        )}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-required': required,
          'aria-invalid': !!error,
          'aria-describedby': [
            hint ? hintId : '',
            error ? errorId : ''
          ].filter(Boolean).join(' ') || undefined
        })}
      </div>
      
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible Input Component
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  hint,
  required,
  className = '',
  ...props
}) => {
  return (
    <AccessibleFormField
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <input
        className={`
          block w-full px-3 py-2 border border-gray-300 rounded-md
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
        `}
        {...props}
      />
    </AccessibleFormField>
  );
};
```

## **🔊 SCREEN READER SUPPORT**

### **ARIA Implementation**

```typescript
/**
 * Screen reader and ARIA utilities
 */
class ScreenReaderSupport {
  /**
   * Announce content to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.getElementById('screen-reader-announcer') || this.createAnnouncer();
    
    // Clear previous message
    announcer.textContent = '';
    
    // Set priority
    announcer.setAttribute('aria-live', priority);
    
    // Announce new message
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
  }
  
  /**
   * Create live region for announcements
   */
  private static createAnnouncer(): HTMLElement {
    const announcer = document.createElement('div');
    announcer.id = 'screen-reader-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(announcer);
    return announcer;
  }
  
  /**
   * Generate accessible table markup
   */
  static createAccessibleTable(data: TableData): string {
    const { headers, rows, caption, summary } = data;
    
    let tableHtml = `<table role="table"`;
    if (summary) {
      tableHtml += ` aria-describedby="table-summary"`;
    }
    tableHtml += `>`;
    
    if (caption) {
      tableHtml += `<caption>${caption}</caption>`;
    }
    
    if (summary) {
      tableHtml += `<div id="table-summary" class="sr-only">${summary}</div>`;
    }
    
    // Table header
    tableHtml += `<thead><tr>`;
    headers.forEach((header, index) => {
      tableHtml += `<th scope="col" id="col-${index}">${header}</th>`;
    });
    tableHtml += `</tr></thead>`;
    
    // Table body
    tableHtml += `<tbody>`;
    rows.forEach((row, rowIndex) => {
      tableHtml += `<tr>`;
      row.forEach((cell, cellIndex) => {
        if (cellIndex === 0) {
          tableHtml += `<th scope="row" headers="col-${cellIndex}">${cell}</th>`;
        } else {
          tableHtml += `<td headers="col-${cellIndex}">${cell}</td>`;
        }
      });
      tableHtml += `</tr>`;
    });
    tableHtml += `</tbody></table>`;
    
    return tableHtml;
  }
  
  /**
   * Create accessible progress indicator
   */
  static createProgressIndicator(options: ProgressOptions): HTMLElement {
    const { value, max, label, description } = options;
    
    const container = document.createElement('div');
    container.className = 'progress-container';
    
    if (label) {
      const labelElement = document.createElement('label');
      labelElement.textContent = label;
      labelElement.id = 'progress-label';
      container.appendChild(labelElement);
    }
    
    const progressBar = document.createElement('div');
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-valuenow', value.toString());
    progressBar.setAttribute('aria-valuemin', '0');
    progressBar.setAttribute('aria-valuemax', max.toString());
    progressBar.setAttribute('aria-valuetext', `${value} of ${max}`);
    
    if (label) {
      progressBar.setAttribute('aria-labelledby', 'progress-label');
    }
    
    if (description) {
      const descElement = document.createElement('div');
      descElement.textContent = description;
      descElement.id = 'progress-description';
      descElement.className = 'sr-only';
      container.appendChild(descElement);
      progressBar.setAttribute('aria-describedby', 'progress-description');
    }
    
    progressBar.className = 'progress-bar';
    progressBar.style.cssText = `
      width: 100%;
      height: 8px;
      background-color: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.cssText = `
      height: 100%;
      background-color: var(--color-primary);
      width: ${(value / max) * 100}%;
      transition: width 0.3s ease;
    `;
    
    progressBar.appendChild(progressFill);
    container.appendChild(progressBar);
    
    return container;
  }
}

// React hook for screen reader announcements
export const useScreenReaderAnnouncement = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    ScreenReaderSupport.announce(message, priority);
  }, []);
  
  return announce;
};

// React component for accessible status updates
export const AccessibleStatus: React.FC<{
  status: string;
  priority?: 'polite' | 'assertive';
  children: React.ReactNode;
}> = ({ status, priority = 'polite', children }) => {
  const announce = useScreenReaderAnnouncement();
  
  useEffect(() => {
    if (status) {
      announce(status, priority);
    }
  }, [status, priority, announce]);
  
  return <>{children}</>;
};

// Accessible loading component
export const AccessibleLoader: React.FC<{
  isLoading: boolean;
  label?: string;
  children: React.ReactNode;
}> = ({ isLoading, label = 'Loading', children }) => {
  const announce = useScreenReaderAnnouncement();
  
  useEffect(() => {
    if (isLoading) {
      announce(`${label}...`, 'polite');
    }
  }, [isLoading, label, announce]);
  
  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className="flex items-center justify-center p-4"
      >
        <svg
          className="animate-spin h-8 w-8 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="sr-only">{label}</span>
      </div>
    );
  }
  
  return <>{children}</>;
};
```

## **📱 MOBILE ACCESSIBILITY**

### **Touch Target Optimization**

```typescript
/**
 * Mobile accessibility optimization
 */
class MobileAccessibility {
  /**
   * Validate touch target sizes
   */
  static validateTouchTargets(element: HTMLElement): TouchTargetValidation {
    const rect = element.getBoundingClientRect();
    const computedStyle = getComputedStyle(element);
    
    const width = rect.width;
    const height = rect.height;
    const minSize = 44; // WCAG minimum touch target size
    
    const validation: TouchTargetValidation = {
      width,
      height,
      meetsMinimumSize: width >= minSize && height >= minSize,
      recommendations: []
    };
    
    if (width < minSize) {
      validation.recommendations.push(`Increase width to ${minSize}px (currently ${width}px)`);
    }
    
    if (height < minSize) {
      validation.recommendations.push(`Increase height to ${minSize}px (currently ${height}px)`);
    }
    
    // Check spacing between touch targets
    const siblings = this.getNearbyTouchTargets(element);
    const inadequateSpacing = siblings.filter(sibling => {
      const siblingRect = sibling.getBoundingClientRect();
      const distance = this.getDistance(rect, siblingRect);
      return distance < 8; // 8px minimum spacing
    });
    
    if (inadequateSpacing.length > 0) {
      validation.recommendations.push('Increase spacing between touch targets (minimum 8px)');
    }
    
    return validation;
  }
  
  /**
   * Create accessible touch component
   */
  static createTouchComponent(config: TouchComponentConfig): HTMLElement {
    const element = document.createElement(config.tag || 'button');
    
    // Ensure minimum touch target size
    element.style.minWidth = '44px';
    element.style.minHeight = '44px';
    
    // Add touch-friendly padding
    element.style.padding = '12px';
    element.style.margin = '4px';
    
    // Optimize for touch
    element.style.touchAction = 'manipulation';
    element.style.userSelect = 'none';
    
    // Add visual feedback
    element.style.transition = 'all 0.2s ease';
    element.addEventListener('touchstart', () => {
      element.style.transform = 'scale(0.95)';
    });
    
    element.addEventListener('touchend', () => {
      element.style.transform = 'scale(1)';
    });
    
    // Add accessibility attributes
    if (config.label) {
      element.setAttribute('aria-label', config.label);
    }
    
    if (config.description) {
      const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
      const descElement = document.createElement('span');
      descElement.id = descId;
      descElement.className = 'sr-only';
      descElement.textContent = config.description;
      element.appendChild(descElement);
      element.setAttribute('aria-describedby', descId);
    }
    
    // Add content
    if (config.content) {
      element.appendChild(config.content);
    }
    
    return element;
  }
  
  /**
   * Handle gesture accessibility
   */
  static makeGestureAccessible(element: HTMLElement, gesture: GestureConfig): void {
    const { type, action, alternative } = gesture;
    
    // Add keyboard alternative
    element.addEventListener('keydown', (event) => {
      let shouldTrigger = false;
      
      switch (type) {
        case 'swipe-left':
          shouldTrigger = event.key === 'ArrowLeft' && event.ctrlKey;
          break;
        case 'swipe-right':
          shouldTrigger = event.key === 'ArrowRight' && event.ctrlKey;
          break;
        case 'pinch-zoom':
          shouldTrigger = (event.key === '=' || event.key === '-') && event.ctrlKey;
          break;
        case 'long-press':
          shouldTrigger = event.key === 'Enter' && event.ctrlKey;
          break;
      }
      
      if (shouldTrigger) {
        event.preventDefault();
        action();
      }
    });
    
    // Add alternative UI if provided
    if (alternative) {
      const altElement = alternative.createElement();
      altElement.addEventListener('click', action);
      element.parentNode?.insertBefore(altElement, element.nextSibling);
    }
    
    // Add ARIA description for gesture
    const gestureDescription = this.getGestureDescription(type);
    const existingDescription = element.getAttribute('aria-describedby');
    const descId = `gesture-desc-${Math.random().toString(36).substr(2, 9)}`;
    
    const descElement = document.createElement('span');
    descElement.id = descId;
    descElement.className = 'sr-only';
    descElement.textContent = gestureDescription;
    element.appendChild(descElement);
    
    element.setAttribute('aria-describedby', 
      existingDescription ? `${existingDescription} ${descId}` : descId
    );
  }
  
  /**
   * Optimize for reduced motion
   */
  static optimizeForReducedMotion(): void {
    const css = `
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
        
        /* Disable parallax scrolling */
        .parallax {
          transform: none !important;
        }
        
        /* Disable auto-playing videos */
        video {
          animation-play-state: paused !important;
        }
        
        /* Disable CSS animations */
        .animate-spin,
        .animate-ping,
        .animate-pulse,
        .animate-bounce {
          animation: none !important;
        }
      }
    `;
    
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
  
  private static getNearbyTouchTargets(element: HTMLElement): HTMLElement[] {
    const touchTargets = document.querySelectorAll(
      'button, a, input, [role="button"], [tabindex]'
    );
    
    const elementRect = element.getBoundingClientRect();
    const nearby: HTMLElement[] = [];
    
    touchTargets.forEach(target => {
      if (target !== element) {
        const targetRect = target.getBoundingClientRect();
        const distance = this.getDistance(elementRect, targetRect);
        
        if (distance < 100) { // Within 100px
          nearby.push(target as HTMLElement);
        }
      }
    });
    
    return nearby;
  }
  
  private static getDistance(rect1: DOMRect, rect2: DOMRect): number {
    const x1 = rect1.left + rect1.width / 2;
    const y1 = rect1.top + rect1.height / 2;
    const x2 = rect2.left + rect2.width / 2;
    const y2 = rect2.top + rect2.height / 2;
    
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  
  private static getGestureDescription(type: string): string {
    const descriptions = {
      'swipe-left': 'Swipe left or press Ctrl+Left Arrow',
      'swipe-right': 'Swipe right or press Ctrl+Right Arrow',
      'pinch-zoom': 'Pinch to zoom or press Ctrl+Plus/Minus',
      'long-press': 'Long press or press Ctrl+Enter'
    };
    
    return descriptions[type] || 'Custom gesture available';
  }
}
```

## **🧪 ACCESSIBILITY TESTING**

### **Automated Testing Tools**

```typescript
/**
 * Accessibility testing utilities
 */
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

class AccessibilityTesting {
  /**
   * Run automated accessibility tests
   */
  static async runAxeTests(container: HTMLElement, options: AxeOptions = {}): Promise<AxeResults> {
    const results = await axe(container, {
      rules: {
        // Enable all WCAG 2.1 AA rules
        'color-contrast': { enabled: true },
        'keyboard-accessibility': { enabled: true },
        'focus-management': { enabled: true },
        'aria-implementation': { enabled: true },
        'semantic-markup': { enabled: true },
        ...options.rules
      },
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      ...options
    });
    
    return results;
  }
  
  /**
   * Test keyboard navigation
   */
  static async testKeyboardNavigation(container: HTMLElement): Promise<KeyboardTestResult> {
    const focusableElements = container.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const results: KeyboardTestResult = {
      focusableElements: focusableElements.length,
      keyboardAccessible: true,
      tabOrder: [],
      issues: []
    };
    
    // Test tab order
    for (let i = 0; i < focusableElements.length; i++) {
      const element = focusableElements[i] as HTMLElement;
      
      // Simulate tab focus
      element.focus();
      
      if (document.activeElement !== element) {
        results.issues.push(`Element ${i} cannot receive focus`);
        results.keyboardAccessible = false;
      }
      
      // Check for visible focus indicator
      const computedStyle = getComputedStyle(element);
      const hasVisibleFocus = computedStyle.outline !== 'none' || 
                            computedStyle.boxShadow !== 'none' ||
                            computedStyle.border !== computedStyle.getPropertyValue('border');
      
      if (!hasVisibleFocus) {
        results.issues.push(`Element ${i} has no visible focus indicator`);
      }
      
      results.tabOrder.push({
        element: element.tagName.toLowerCase(),
        tabIndex: element.tabIndex,
        hasVisibleFocus
      });
    }
    
    return results;
  }
  
  /**
   * Test color contrast
   */
  static testColorContrast(container: HTMLElement): ColorContrastResult[] {
    const textElements = container.querySelectorAll('*');
    const results: ColorContrastResult[] = [];
    
    textElements.forEach(element => {
      const computedStyle = getComputedStyle(element);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      if (color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const contrast = ColorAccessibility.getContrastRatio(color, backgroundColor);
        const fontSize = parseInt(computedStyle.fontSize);
        const fontWeight = computedStyle.fontWeight;
        
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= '700');
        const requiredRatio = isLargeText ? 3.0 : 4.5;
        
        results.push({
          element: element.tagName.toLowerCase(),
          color,
          backgroundColor,
          contrast,
          requiredRatio,
          passes: contrast >= requiredRatio,
          isLargeText
        });
      }
    });
    
    return results;
  }
  
  /**
   * Test ARIA implementation
   */
  static testARIA(container: HTMLElement): ARIATestResult {
    const results: ARIATestResult = {
      totalElements: 0,
      elementsWithARIA: 0,
      issues: [],
      warnings: []
    };
    
    const elements = container.querySelectorAll('*');
    results.totalElements = elements.length;
    
    elements.forEach(element => {
      const tagName = element.tagName.toLowerCase();
      const role = element.getAttribute('role');
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledBy = element.getAttribute('aria-labelledby');
      const ariaDescribedBy = element.getAttribute('aria-describedby');
      
      if (role || ariaLabel || ariaLabelledBy || ariaDescribedBy) {
        results.elementsWithARIA++;
      }
      
      // Check for required ARIA attributes
      if (role === 'button' && !ariaLabel && !ariaLabelledBy) {
        results.issues.push(`Button without accessible name: ${tagName}`);
      }
      
      if (role === 'dialog' && !ariaLabel && !ariaLabelledBy) {
        results.issues.push(`Dialog without accessible name: ${tagName}`);
      }
      
      if (tagName === 'img' && !element.getAttribute('alt')) {
        results.issues.push(`Image without alt text: ${tagName}`);
      }
      
      // Check for proper ARIA usage
      if (role && !this.isValidARIARole(role)) {
        results.issues.push(`Invalid ARIA role: ${role}`);
      }
      
      if (ariaLabelledBy && !document.getElementById(ariaLabelledBy)) {
        results.issues.push(`aria-labelledby references non-existent element: ${ariaLabelledBy}`);
      }
      
      if (ariaDescribedBy && !document.getElementById(ariaDescribedBy)) {
        results.issues.push(`aria-describedby references non-existent element: ${ariaDescribedBy}`);
      }
    });
    
    return results;
  }
  
  /**
   * Generate accessibility report
   */
  static async generateAccessibilityReport(container: HTMLElement): Promise<AccessibilityReport> {
    const axeResults = await this.runAxeTests(container);
    const keyboardResults = await this.testKeyboardNavigation(container);
    const contrastResults = this.testColorContrast(container);
    const ariaResults = this.testARIA(container);
    
    const report: AccessibilityReport = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      summary: {
        totalViolations: axeResults.violations.length,
        criticalIssues: axeResults.violations.filter(v => v.impact === 'critical').length,
        keyboardAccessible: keyboardResults.keyboardAccessible,
        contrastIssues: contrastResults.filter(r => !r.passes).length,
        ariaIssues: ariaResults.issues.length
      },
      axeResults,
      keyboardResults,
      contrastResults,
      ariaResults,
      recommendations: this.generateRecommendations(axeResults, keyboardResults, contrastResults, ariaResults)
    };
    
    return report;
  }
  
  private static isValidARIARole(role: string): boolean {
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
      'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
      'contentinfo', 'dialog', 'directory', 'document', 'feed', 'figure',
      'form', 'grid', 'gridcell', 'group', 'heading', 'img', 'link',
      'list', 'listbox', 'listitem', 'log', 'main', 'marquee', 'math',
      'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
      'navigation', 'none', 'note', 'option', 'presentation', 'progressbar',
      'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader',
      'scrollbar', 'search', 'separator', 'slider', 'spinbutton', 'status',
      'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term', 'textbox',
      'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
    ];
    
    return validRoles.includes(role);
  }
  
  private static generateRecommendations(
    axeResults: AxeResults,
    keyboardResults: KeyboardTestResult,
    contrastResults: ColorContrastResult[],
    ariaResults: ARIATestResult
  ): string[] {
    const recommendations: string[] = [];
    
    if (axeResults.violations.length > 0) {
      recommendations.push('Fix automated accessibility violations found by axe-core');
    }
    
    if (!keyboardResults.keyboardAccessible) {
      recommendations.push('Ensure all interactive elements are keyboard accessible');
    }
    
    const contrastFailures = contrastResults.filter(r => !r.passes);
    if (contrastFailures.length > 0) {
      recommendations.push(`Fix ${contrastFailures.length} color contrast violations`);
    }
    
    if (ariaResults.issues.length > 0) {
      recommendations.push('Fix ARIA implementation issues');
    }
    
    return recommendations;
  }
}

// Jest test examples
describe('Accessibility Tests', () => {
  test('should have no accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await AccessibilityTesting.runAxeTests(container);
    expect(results).toHaveNoViolations();
  });
  
  test('should be keyboard accessible', async () => {
    const { container } = render(<MyComponent />);
    const results = await AccessibilityTesting.testKeyboardNavigation(container);
    expect(results.keyboardAccessible).toBe(true);
  });
  
  test('should have sufficient color contrast', () => {
    const { container } = render(<MyComponent />);
    const results = AccessibilityTesting.testColorContrast(container);
    const failures = results.filter(r => !r.passes);
    expect(failures).toHaveLength(0);
  });
});
```

---

## **♿ ACCESSIBILITY CHECKLIST**

### **Development Accessibility Checklist**
- [ ] All images have appropriate alt text
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and clear
- [ ] ARIA labels and roles are properly implemented
- [ ] Forms have proper labels and error handling
- [ ] Headings create a logical hierarchy
- [ ] Content is readable and understandable
- [ ] Touch targets are minimum 44x44 pixels
- [ ] Reduced motion preferences are respected

### **Testing Accessibility Checklist**
- [ ] Automated tests pass (axe-core)
- [ ] Manual keyboard testing completed
- [ ] Screen reader testing performed
- [ ] Color contrast validated
- [ ] Touch target sizes verified
- [ ] Focus management tested
- [ ] ARIA implementation reviewed
- [ ] Mobile accessibility tested
- [ ] Error handling accessibility verified
- [ ] Real user testing conducted

---

## **🎯 CONCLUSION**

Accessibility is not just about compliance—it's about creating inclusive experiences for all users. Remember:

1. **Design for everyone** - Universal design benefits all users
2. **Test with real users** - Automated testing catches only 30% of issues
3. **Progressive enhancement** - Core functionality must work for everyone
4. **Continuous improvement** - Accessibility is an ongoing commitment
5. **Legal compliance** - Meet WCAG 2.1 AA standards and ADA requirements
6. **Performance matters** - Accessibility features must perform well
7. **Mobile optimization** - Ensure touch accessibility on all devices

**Accessibility is not a feature—it's a fundamental right!** ♿

---

*This guide is living documentation. Please update it as accessibility standards evolve and new techniques become available.*