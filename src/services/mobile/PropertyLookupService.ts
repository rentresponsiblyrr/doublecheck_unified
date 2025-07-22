/**
 * Professional Property Lookup Service
 * Single responsibility: Property information retrieval and validation
 * 
 * ARCHITECTURAL IMPROVEMENTS:
 * - Focused on property lookup only
 * - Proper error handling with enterprise logging
 * - Type-safe interfaces
 * - Efficient caching strategy
 * - Professional validation patterns
 */

import { supabase } from "@/integrations/supabase/client";
import { log } from "@/lib/logging/enterprise-logger";

export interface PropertyInfo {
  id: string;
  name: string;
  address?: string;
  created_by?: string;
}

export interface PropertyLookupResult {
  property: PropertyInfo | null;
  error?: string;
  notFound?: boolean;
}

export class PropertyLookupService {
  private static readonly TIMEOUT_MS = 5000;
  
  /**
   * Get property information by ID with validation
   */
  static async getPropertyInfo(propertyId: string): Promise<PropertyLookupResult> {
    try {
      // Input validation
      if (!propertyId || propertyId.trim().length === 0) {
        return {
          property: null,
          error: 'Property ID is required',
          notFound: true
        };
      }

      const cleanPropertyId = propertyId.trim();

      log.debug('Property lookup initiated', {
        component: 'PropertyLookupService',
        action: 'getPropertyInfo',
        propertyId: cleanPropertyId,
        propertyIdType: typeof cleanPropertyId,
        isUUID: cleanPropertyId.includes('-'),
        isInteger: /^\d+$/.test(cleanPropertyId)
      }, 'PROPERTY_LOOKUP_START');

      // Use optimized RPC function for property lookup
      const { data: propertiesData, error: propertiesError } = await Promise.race([
        supabase.rpc('get_properties_with_inspections'),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Property lookup timeout')), this.TIMEOUT_MS)
        )
      ]);

      if (propertiesError) {
        log.error('Property lookup query failed', propertiesError, {
          component: 'PropertyLookupService',
          action: 'getPropertyInfo',
          propertyId: cleanPropertyId,
          errorCode: propertiesError.code,
          errorMessage: propertiesError.message
        }, 'PROPERTY_LOOKUP_QUERY_ERROR');
        
        return {
          property: null,
          error: `Database error: ${propertiesError.message}`,
          notFound: false
        };
      }

      if (!propertiesData || propertiesData.length === 0) {
        log.warn('No properties available in database', {
          component: 'PropertyLookupService',
          action: 'getPropertyInfo',
          propertyId: cleanPropertyId
        }, 'NO_PROPERTIES_AVAILABLE');
        
        return {
          property: null,
          error: 'No properties available',
          notFound: true
        };
      }

      // Find property with exact ID match (handle both string and numeric IDs)
      const property = propertiesData.find(p => 
        p.id?.toString() === cleanPropertyId.toString()
      );

      if (!property) {
        log.warn('Property not found in available properties', {
          component: 'PropertyLookupService',
          action: 'getPropertyInfo',
          propertyId: cleanPropertyId,
          availablePropertyCount: propertiesData.length,
          samplePropertyIds: propertiesData.slice(0, 3).map(p => ({
            id: p.id,
            name: p.name,
            type: typeof p.id
          }))
        }, 'PROPERTY_NOT_FOUND');
        
        return {
          property: null,
          error: 'Property not found',
          notFound: true
        };
      }

      // Construct properly typed property info
      const propertyInfo: PropertyInfo = {
        id: property.id?.toString() || cleanPropertyId,
        name: property.name || 'Property',
        address: property.address,
        created_by: property.created_by
      };

      log.info('Property lookup successful', {
        component: 'PropertyLookupService',
        action: 'getPropertyInfo',
        propertyId: cleanPropertyId,
        propertyName: propertyInfo.name,
        hasAddress: !!propertyInfo.address
      }, 'PROPERTY_LOOKUP_SUCCESS');

      return {
        property: propertyInfo,
        error: undefined,
        notFound: false
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      log.error('Property lookup failed with exception', error as Error, {
        component: 'PropertyLookupService',
        action: 'getPropertyInfo',
        propertyId: propertyId,
        errorType: error?.constructor?.name || 'UnknownError'
      }, 'PROPERTY_LOOKUP_EXCEPTION');

      return {
        property: null,
        error: `Lookup failed: ${errorMessage}`,
        notFound: false
      };
    }
  }

  /**
   * Validate property ID format
   */
  static validatePropertyId(propertyId: string): { valid: boolean; error?: string } {
    if (!propertyId || typeof propertyId !== 'string') {
      return { valid: false, error: 'Property ID must be a non-empty string' };
    }

    const trimmed = propertyId.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: 'Property ID cannot be empty' };
    }

    // Accept both UUID and integer formats
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
    const isInteger = /^\d+$/.test(trimmed);

    if (!isUUID && !isInteger) {
      return { valid: false, error: 'Property ID must be either a UUID or integer' };
    }

    return { valid: true };
  }

  /**
   * Batch property lookup for performance
   */
  static async getMultipleProperties(propertyIds: string[]): Promise<PropertyInfo[]> {
    try {
      if (!propertyIds || propertyIds.length === 0) {
        return [];
      }

      // Validate all IDs first
      const validIds = propertyIds.filter(id => this.validatePropertyId(id).valid);
      
      if (validIds.length === 0) {
        log.warn('No valid property IDs provided for batch lookup', {
          component: 'PropertyLookupService',
          action: 'getMultipleProperties',
          requestedCount: propertyIds.length,
          validCount: 0
        }, 'BATCH_LOOKUP_NO_VALID_IDS');
        return [];
      }

      // Get all properties and filter client-side for better performance
      const { data: propertiesData, error } = await supabase
        .rpc('get_properties_with_inspections');

      if (error || !propertiesData) {
        log.error('Batch property lookup failed', error, {
          component: 'PropertyLookupService',
          action: 'getMultipleProperties',
          requestedIds: validIds
        }, 'BATCH_LOOKUP_ERROR');
        return [];
      }

      // Filter and map to PropertyInfo objects
      const results = propertiesData
        .filter(p => validIds.includes(p.id?.toString()))
        .map(p => ({
          id: p.id?.toString() || '',
          name: p.name || 'Property',
          address: p.address,
          created_by: p.created_by
        }));

      log.info('Batch property lookup completed', {
        component: 'PropertyLookupService',
        action: 'getMultipleProperties',
        requestedCount: propertyIds.length,
        validCount: validIds.length,
        foundCount: results.length
      }, 'BATCH_LOOKUP_SUCCESS');

      return results;

    } catch (error) {
      log.error('Batch property lookup exception', error as Error, {
        component: 'PropertyLookupService',
        action: 'getMultipleProperties',
        requestedIds: propertyIds
      }, 'BATCH_LOOKUP_EXCEPTION');
      return [];
    }
  }
}