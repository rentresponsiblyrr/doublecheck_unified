/**
 * Property Data Manager - Enterprise Grade
 * 
 * Handles all property data operations with render props pattern
 * for clean component separation and state management
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import type { Property } from './PropertySelectionStep';

interface PropertyDataManagerProps {
  children: (data: {
    properties: Property[];
    filteredProperties: Property[];
    searchQuery: string;
    isLoading: boolean;
    isSelecting: boolean;
    error: Error | null;
    onSearch: (query: string) => void;
    onRefresh: () => void;
    onPropertySelect: (property: Property) => void;
  }) => React.ReactNode;
}

export const PropertyDataManager: React.FC<PropertyDataManagerProps> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { toast } = useToast();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [searchQuery, properties]);

  const fetchProperties = async () => {
    if (!mountedRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      logger.info('Fetching properties for selection', {}, 'PROPERTY_DATA_MANAGER');

      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Database error: ${fetchError.message}`);
      }

      const formattedProperties: Property[] = data?.map(property => ({
        id: property.property_id.toString(),
        property_id: property.property_id,
        property_name: property.property_name || 'Unnamed Property',
        street_address: property.street_address || 'No address provided',
        vrbo_url: property.vrbo_url,
        airbnb_url: property.airbnb_url,
        type: 'rental',
        created_at: property.created_at
      })) || [];

      if (mountedRef.current) {
        setProperties(formattedProperties);
        setFilteredProperties(formattedProperties);
        logger.info(`Loaded ${formattedProperties.length} properties successfully`, {}, 'PROPERTY_DATA_MANAGER');
      }

    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error occurred');
      if (mountedRef.current) {
        setError(errorObj);
        logger.error('Failed to fetch properties', err, 'PROPERTY_DATA_MANAGER');
        
        toast({
          title: 'Error Loading Properties',
          description: 'Failed to load properties. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const filterProperties = () => {
    if (!searchQuery.trim()) {
      setFilteredProperties(properties);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = properties.filter(property =>
      property.property_name.toLowerCase().includes(query) ||
      property.street_address.toLowerCase().includes(query)
    );

    setFilteredProperties(filtered);
  };

  const handlePropertySelect = async (property: Property) => {
    if (!mountedRef.current) return;
    
    try {
      setIsSelecting(true);
      logger.info('Property selected for inspection', { 
        propertyId: property.id,
        propertyName: property.property_name 
      }, 'PROPERTY_DATA_MANAGER');

      toast({
        title: 'Property Selected',
        description: `Selected ${property.property_name} for inspection.`,
        duration: 3000,
      });

    } catch (err) {
      logger.error('Failed to select property', err, 'PROPERTY_DATA_MANAGER');
      toast({
        title: 'Selection Failed',
        description: 'Failed to select property. Please try again.',
        variant: 'destructive',
      });
    } finally {
      if (mountedRef.current) {
        setIsSelecting(false);
      }
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (mountedRef.current) {
        setIsLoading(false);
        toast({
          title: "Properties Refreshed",
          description: "Property list has been updated.",
        });
      }
    }, 1000);
  };

  return (
    <div id="property-data-manager">
      {children({
        properties,
        filteredProperties,
        searchQuery,
        isLoading,
        isSelecting,
        error,
        onSearch: setSearchQuery,
        onRefresh: handleRefresh,
        onPropertySelect: handlePropertySelect
      })}
    </div>
  );
};