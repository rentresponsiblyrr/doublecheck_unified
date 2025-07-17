import { supabase } from '@/integrations/supabase/client';
import type { ScrapedPropertyData } from '@/lib/scrapers/types';

export interface PropertyData {
  name: string;
  address: string;
  vrbo_url?: string;
  airbnb_url?: string;
}

interface PropertyServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class PropertyService {
  /**
   * Add a new property with automatic data enhancement
   * This replaces the need for separate import + add steps
   */
  async addProperty(propertyData: PropertyData, userId?: string): Promise<PropertyServiceResult<any>> {
    try {
      console.log('🏠 Adding property:', propertyData);

      // Get current user if not provided
      if (!userId) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          return { success: false, error: 'User authentication required' };
        }
        userId = userData.user.id;
      }

      // Validate required fields
      if (!propertyData.name?.trim()) {
        return { success: false, error: 'Property name is required' };
      }

      if (!propertyData.address?.trim()) {
        return { success: false, error: 'Property address is required' };
      }

      // Validate that at least one URL is provided
      const hasVrbo = propertyData.vrbo_url?.trim();
      const hasAirbnb = propertyData.airbnb_url?.trim();
      
      if (!hasVrbo && !hasAirbnb) {
        return { success: false, error: 'At least one property URL (VRBO or Airbnb) is required' };
      }

      // Validate VRBO URL format if provided
      if (hasVrbo && !this.isValidVRBOUrl(propertyData.vrbo_url!)) {
        return { success: false, error: 'Please enter a valid VRBO URL' };
      }

      // Prepare property data for database (matching the schema)
      const propertyToInsert = {
        name: propertyData.name.trim(),
        address: propertyData.address.trim(),
        vrbo_url: propertyData.vrbo_url?.trim() || null,
        airbnb_url: propertyData.airbnb_url?.trim() || null,
        added_by: userId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 Inserting property with data:', propertyToInsert);

      // Insert property into database using compatibility layer
      const { data: insertedProperty, error: insertError } = await supabase
        .from('properties_fixed')
        .insert(propertyToInsert)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Database insertion failed:', insertError);
        return { 
          success: false, 
          error: `Failed to save property: ${insertError.message}` 
        };
      }

      console.log('✅ Property added successfully:', insertedProperty);

      // Attempt to get enhanced data if VRBO URL is provided (non-blocking)
      let scrapedData: ScrapedPropertyData | null = null;
      if (hasVrbo) {
        try {
          const enhancedData = await this.enhancePropertyData(propertyData.vrbo_url!);
          if (enhancedData.success) {
            scrapedData = enhancedData.data;
            console.log('✅ Enhanced property data available:', scrapedData);
          }
        } catch (error) {
          console.warn('⚠️ Could not enhance property data, continuing with basic info:', error);
          // Continue without enhanced data - not a critical failure
        }
      }

      return {
        success: true,
        data: {
          property: insertedProperty,
          scrapedData,
          enhanced: !!scrapedData
        }
      };

    } catch (error) {
      console.error('❌ Property service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error occurred'
      };
    }
  }

  /**
   * Enhance property data using available information
   * This is a simplified version that doesn't rely on browser scraping
   */
  private async enhancePropertyData(vrboUrl: string): Promise<PropertyServiceResult<ScrapedPropertyData>> {
    try {
      // For now, extract basic info from URL structure
      const urlInfo = this.extractVRBOInfo(vrboUrl);
      
      // Create basic scraped data structure
      const basicData: ScrapedPropertyData = {
        title: `Property from VRBO listing`,
        description: 'Property imported from VRBO',
        location: {
          city: 'Location to be verified',
          state: '',
          country: 'US'
        },
        pricing: {
          basePrice: 0,
          currency: 'USD'
        },
        amenities: [],
        images: [],
        propertyType: 'vacation rental',
        bedrooms: 0,
        bathrooms: 0,
        maxGuests: 0,
        url: vrboUrl,
        listingId: urlInfo.listingId
      };

      return {
        success: true,
        data: basicData
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to enhance property data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Extract basic info from VRBO URL
   */
  private extractVRBOInfo(url: string): { listingId: string | null } {
    try {
      const match = url.match(/vrbo\.com\/(\d+)/);
      return {
        listingId: match ? match[1] : null
      };
    } catch {
      return { listingId: null };
    }
  }

  /**
   * Validate VRBO URL format
   */
  private isValidVRBOUrl(url: string): boolean {
    if (!url.trim()) return false;
    const vrboPatterns = [
      /^https?:\/\/(www\.)?vrbo\.com\/\d+/,
      /^https?:\/\/(www\.)?homeaway\.com\/\d+/,
      /^https?:\/\/(www\.)?vacationrentals\.com\/\d+/
    ];
    return vrboPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Update existing property
   */
  async updateProperty(id: string, propertyData: Partial<PropertyData>): Promise<PropertyServiceResult<any>> {
    try {
      const { data, error } = await supabase
        .from('properties_fixed')
        .update(propertyData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  /**
   * Get property by ID
   */
  async getProperty(id: string): Promise<PropertyServiceResult<any>> {
    try {
      const { data, error } = await supabase
        .from('properties_fixed')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get property'
      };
    }
  }
}

export const propertyService = new PropertyService();