/**
 * Chart Style Injection Component
 * Extracted from chart.tsx
 * 
 * Securely injects CSS custom properties for chart theming without XSS vulnerabilities.
 * Uses imperative DOM manipulation with proper input sanitization.
 */

import React, { useEffect, useRef } from "react";
import { ChartConfig } from "@/components/ui/chart";

interface ChartStyleInjectProps {
  id: string;
  config: ChartConfig;
}

/**
 * Sanitizes a CSS value to prevent injection attacks
 * @param value - The CSS value to sanitize
 * @returns Sanitized CSS value or null if invalid
 */
const sanitizeCSSValue = (value: string): string | null => {
  if (!value || typeof value !== 'string') {
    return null;
  }
  
  // Remove any potential CSS injection characters
  // Allow only valid CSS color characters (alphanumeric, #, %, commas, spaces, parentheses for functions)
  const sanitized = value.replace(/[^a-zA-Z0-9#%(),.\s-]/g, '');
  
  // Basic validation for common CSS color formats
  const colorPatterns = [
    /^#[0-9a-fA-F]{3,8}$/, // Hex colors
    /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, // RGB
    /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/, // RGBA
    /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/, // HSL
    /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/, // HSLA
    /^[a-zA-Z]+$/, // Named colors
  ];
  
  const isValidColor = colorPatterns.some(pattern => pattern.test(sanitized.trim()));
  return isValidColor ? sanitized : null;
};

/**
 * Sanitizes a CSS selector identifier
 * @param id - The ID to sanitize
 * @returns Sanitized ID
 */
const sanitizeCSSId = (id: string): string => {
  // Only allow alphanumeric characters, hyphens, and underscores for CSS IDs
  return id.replace(/[^a-zA-Z0-9_-]/g, '');
};

export const ChartStyleInject: React.FC<ChartStyleInjectProps> = ({
  id,
  config,
}) => {
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const THEMES = { light: "", dark: ".dark" } as const;

  useEffect(() => {
    const colorConfig = Object.entries(config).filter(
      ([_, config]) => config.theme || config.color,
    );

    if (!colorConfig.length) {
      // Remove style element if no config
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
      return;
    }

    // Sanitize the chart ID
    const sanitizedId = sanitizeCSSId(id);
    
    // Generate CSS rules with proper sanitization
    const cssRules: string[] = [];
    
    Object.entries(THEMES).forEach(([theme, prefix]) => {
      const properties: string[] = [];
      
      colorConfig.forEach(([key, itemConfig]) => {
        const color =
          itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
          itemConfig.color;
          
        if (color) {
          const sanitizedColor = sanitizeCSSValue(color);
          const sanitizedKey = sanitizeCSSId(key);
          
          if (sanitizedColor && sanitizedKey) {
            properties.push(`  --color-${sanitizedKey}: ${sanitizedColor};`);
          }
        }
      });
      
      if (properties.length > 0) {
        cssRules.push(`${prefix} [data-chart="${sanitizedId}"] {\n${properties.join('\n')}\n}`);
      }
    });

    // Create or update style element
    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      styleRef.current.setAttribute('data-chart-styles', sanitizedId);
      document.head.appendChild(styleRef.current);
    }

    // Set the text content safely
    styleRef.current.textContent = cssRules.join('\n\n');

    // Cleanup function
    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [id, config]);

  // This component doesn't render any JSX - it manages styles imperatively
  return null;
};
