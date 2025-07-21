/**
 * Utility for generating semantic, accessible IDs for DOM elements
 * Ensures consistent ID naming patterns across the application
 */

// Counter to ensure uniqueness
let idCounter = 0;

/**
 * Generate a unique, semantic ID for DOM elements
 * @param prefix - Semantic prefix describing the element's purpose
 * @param suffix - Optional suffix for additional context
 * @returns Unique ID string
 */
export function generateId(prefix: string, suffix?: string): string {
  idCounter++;
  const base = `${prefix}-${idCounter}`;
  return suffix ? `${base}-${suffix}` : base;
}

/**
 * Generate component-scoped ID with consistent naming
 * @param componentName - Name of the React component
 * @param elementType - Type/purpose of the element
 * @param index - Optional index for lists
 * @returns Semantic component ID
 */
export function generateComponentId(
  componentName: string, 
  elementType: string, 
  index?: number
): string {
  const normalizedComponent = componentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const normalizedElement = elementType.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const indexSuffix = index !== undefined ? `-${index}` : '';
  
  return `${normalizedComponent}-${normalizedElement}${indexSuffix}`;
}

/**
 * Reset ID counter (useful for testing)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}