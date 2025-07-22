/**
 * PROPERTY ID CONVERTER SERVICE
 * 
 * Handles type conversion between database integer property IDs and frontend string representations.
 * This service is MANDATORY for all property ID handling to ensure consistency across the application.
 * 
 * Database Reality (VERIFIED):
 * - properties.property_id: INTEGER PRIMARY KEY 
 * - inspections.property_id: TEXT (string representation)
 * 
 * Frontend Requirements:
 * - All React components expect string property IDs for consistency
 * 
 * @example
 * ```typescript
 * // Converting from database to frontend
 * const frontendId = PropertyIdConverter.toFrontend(123); // "123"
 * 
 * // Converting from frontend to database
 * const dbId = PropertyIdConverter.toDatabase("123"); // 123
 * ```
 */

export class DatabaseError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class PropertyIdConverter {
  /**
   * Convert database integer ID to frontend string representation
   * 
   * @param dbId - Integer property ID from database
   * @returns String representation for frontend use
   * @throws DatabaseError if conversion fails
   */
  static toFrontend(dbId: number): string {
    if (!this.validateDatabaseId(dbId)) {
      throw new DatabaseError(
        `Invalid database property ID: ${dbId}. Must be a positive integer.`,
        'INVALID_DB_ID'
      );
    }
    return dbId.toString();
  }

  /**
   * Convert frontend string ID to database integer
   * 
   * @param frontendId - String property ID from frontend
   * @returns Integer for database queries
   * @throws DatabaseError if conversion fails
   */
  static toDatabase(frontendId: string): number {
    if (!this.validateFrontendId(frontendId)) {
      throw new DatabaseError(
        `Invalid frontend property ID format: "${frontendId}". Must be a numeric string.`,
        'INVALID_FRONTEND_ID'
      );
    }
    
    const parsed = parseInt(frontendId, 10);
    
    // Additional safety check after parsing
    if (isNaN(parsed) || !this.validateDatabaseId(parsed)) {
      throw new DatabaseError(
        `Failed to convert property ID "${frontendId}" to valid database integer.`,
        'CONVERSION_FAILED'
      );
    }
    
    return parsed;
  }

  /**
   * Validate frontend string property ID format
   * 
   * @param id - Property ID to validate
   * @returns true if valid string format
   */
  static validateFrontendId(id: string): boolean {
    return typeof id === 'string' && 
           id.length > 0 && 
           /^\d+$/.test(id) && 
           parseInt(id, 10) > 0;
  }

  /**
   * Validate database integer property ID
   * 
   * @param id - Property ID to validate  
   * @returns true if valid database integer
   */
  static validateDatabaseId(id: number): boolean {
    return typeof id === 'number' && 
           Number.isInteger(id) && 
           id > 0 && 
           id <= Number.MAX_SAFE_INTEGER;
  }

  /**
   * Validate property ID in either format
   * 
   * @param id - Property ID to validate (string or number)
   * @returns true if valid in either format
   */
  static validate(id: string | number): boolean {
    if (typeof id === 'number') {
      return this.validateDatabaseId(id);
    }
    if (typeof id === 'string') {
      return this.validateFrontendId(id);
    }
    return false;
  }

  /**
   * Safe conversion with fallback - for use in error recovery scenarios
   * 
   * @param id - Property ID in any format
   * @param fallback - Fallback value if conversion fails
   * @returns Converted value or fallback
   */
  static safeTo<T extends string | number>(
    id: string | number, 
    targetType: 'string' | 'number',
    fallback: T
  ): T {
    try {
      if (targetType === 'string') {
        return (typeof id === 'number' ? this.toFrontend(id) : id) as T;
      } else {
        return (typeof id === 'string' ? this.toDatabase(id) : id) as T;
      }
    } catch {
      return fallback;
    }
  }

  /**
   * Convert array of database IDs to frontend format
   * 
   * @param dbIds - Array of database integer IDs
   * @returns Array of string IDs for frontend
   * @throws DatabaseError if any conversion fails
   */
  static arrayToFrontend(dbIds: number[]): string[] {
    return dbIds.map((id, index) => {
      try {
        return this.toFrontend(id);
      } catch (error) {
        throw new DatabaseError(
          `Failed to convert property ID at index ${index}: ${error.message}`,
          'ARRAY_CONVERSION_FAILED'
        );
      }
    });
  }

  /**
   * Convert array of frontend IDs to database format
   * 
   * @param frontendIds - Array of string IDs from frontend
   * @returns Array of integer IDs for database
   * @throws DatabaseError if any conversion fails
   */
  static arrayToDatabase(frontendIds: string[]): number[] {
    return frontendIds.map((id, index) => {
      try {
        return this.toDatabase(id);
      } catch (error) {
        throw new DatabaseError(
          `Failed to convert property ID at index ${index}: ${error.message}`,
          'ARRAY_CONVERSION_FAILED'
        );
      }
    });
  }

  /**
   * Check if two property IDs are equal, regardless of format
   * 
   * @param id1 - First property ID (string or number)
   * @param id2 - Second property ID (string or number)  
   * @returns true if IDs represent the same property
   */
  static areEqual(id1: string | number, id2: string | number): boolean {
    try {
      const normalizedId1 = typeof id1 === 'string' ? this.toDatabase(id1) : id1;
      const normalizedId2 = typeof id2 === 'string' ? this.toDatabase(id2) : id2;
      return normalizedId1 === normalizedId2;
    } catch {
      return false;
    }
  }

  /**
   * Generate debug information for property ID
   * Useful for troubleshooting ID-related issues
   * 
   * @param id - Property ID to debug
   * @returns Debug information object
   */
  static debugInfo(id: string | number): {
    originalValue: string | number;
    originalType: string;
    isValid: boolean;
    asFrontend?: string;
    asDatabase?: number;
    validationErrors: string[];
  } {
    const info = {
      originalValue: id,
      originalType: typeof id,
      isValid: this.validate(id),
      validationErrors: [] as string[]
    };

    try {
      if (typeof id === 'number') {
        info.asFrontend = this.toFrontend(id);
        info.asDatabase = id;
      } else if (typeof id === 'string') {
        info.asFrontend = id;
        info.asDatabase = this.toDatabase(id);
      }
    } catch (error) {
      info.validationErrors.push(error.message);
    }

    return info;
  }
}

/**
 * Type guards for property ID validation
 */
export const isValidPropertyId = (id: unknown): id is string | number => {
  return PropertyIdConverter.validate(id as string | number);
};

export const isFrontendPropertyId = (id: unknown): id is string => {
  return typeof id === 'string' && PropertyIdConverter.validateFrontendId(id);
};

export const isDatabasePropertyId = (id: unknown): id is number => {
  return typeof id === 'number' && PropertyIdConverter.validateDatabaseId(id);
};

/**
 * Branded types for additional type safety
 */
export type FrontendPropertyId = string & { readonly __brand: 'FrontendPropertyId' };
export type DatabasePropertyId = number & { readonly __brand: 'DatabasePropertyId' };

/**
 * Factory functions for branded types
 */
export const createFrontendPropertyId = (id: number | string): FrontendPropertyId => {
  const stringId = typeof id === 'number' ? PropertyIdConverter.toFrontend(id) : id;
  if (!PropertyIdConverter.validateFrontendId(stringId)) {
    throw new DatabaseError(`Invalid property ID for frontend: ${stringId}`);
  }
  return stringId as FrontendPropertyId;
};

export const createDatabasePropertyId = (id: string | number): DatabasePropertyId => {
  const numberId = typeof id === 'string' ? PropertyIdConverter.toDatabase(id) : id;
  if (!PropertyIdConverter.validateDatabaseId(numberId)) {
    throw new DatabaseError(`Invalid property ID for database: ${numberId}`);
  }
  return numberId as DatabasePropertyId;
};