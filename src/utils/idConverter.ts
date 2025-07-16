/**
 * Utility functions for handling ID type conversions between frontend (strings) and database (integers/UUIDs)
 */

/**
 * Converts a property ID from string to integer for database operations
 * @param propertyId - Property ID as string (from frontend)
 * @returns Property ID as integer for database
 * @throws Error if the ID is not a valid integer
 */
export function convertPropertyIdToInt(propertyId: string): number {
  const propertyIdInt = parseInt(propertyId, 10);
  if (isNaN(propertyIdInt)) {
    throw new Error(`Invalid property ID: ${propertyId} - must be a valid integer`);
  }
  return propertyIdInt;
}

/**
 * Validates that a string is a valid UUID format
 * @param id - ID string to validate
 * @returns true if valid UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validates that a string represents a valid integer
 * @param id - ID string to validate
 * @returns true if valid integer
 */
export function isValidIntegerString(id: string): boolean {
  const intValue = parseInt(id, 10);
  return !isNaN(intValue) && intValue.toString() === id;
}

/**
 * Type-safe ID conversion for different entity types
 */
export const IdConverter = {
  /**
   * Properties use UUID strings in the database (corrected from previous assumption of integers)
   */
  property: {
    toDatabase: (id: string) => id, // Properties are UUIDs, not integers
    validate: isValidUUID
  },
  
  /**
   * Inspections use UUID strings
   */
  inspection: {
    toDatabase: (id: string) => id, // Already a UUID string
    validate: isValidUUID
  },
  
  /**
   * Users use UUID strings from Supabase auth
   */
  user: {
    toDatabase: (id: string) => id, // Already a UUID string
    validate: isValidUUID
  },
  
  /**
   * Checklist items - depends on implementation
   */
  checklistItem: {
    toDatabase: (id: string) => id, // Assuming UUID for now
    validate: isValidUUID
  }
};

/**
 * Error class for ID conversion issues
 */
export class IdConversionError extends Error {
  constructor(message: string, public readonly entityType: string, public readonly originalId: string) {
    super(`[${entityType}] ${message}: ${originalId}`);
    this.name = 'IdConversionError';
  }
}